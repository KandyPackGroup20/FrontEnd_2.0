import type {
  RosterAssignment,
  RosterAssignmentCreated,
  RosterAssignmentRequest,
  RosterAssignments,
  RosterAudit,
  RosterAuditAttempt,
  RosterCandidates,
  RosterHours,
  RosterMetadata,
  RosterRoute,
  RosterSession,
  RosterStaff,
  RosterTruck,
  RosterWriteMetadata,
} from "./types";

export class RosterApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "RosterApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0;
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    || !Number.isFinite(Date.parse(value))) return false;
  // Date.parse normalizes impossible dates (for example, 30 February).
  const local = value.slice(0, 19);
  const calendar = new Date(`${local}Z`);
  return Number(local.slice(0, 4)) > 0 && Number.isFinite(calendar.getTime())
    && calendar.toISOString().slice(0, 19) === local;
}

function isMonday(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number(value.slice(0, 4)) > 0 && Number.isFinite(date.getTime())
    && date.toISOString().slice(0, 10) === value && date.getUTCDay() === 1;
}

function isMetadata(value: unknown): value is RosterMetadata {
  if (!isRecord(value) || value.policy_confirmed !== false || value.timezone !== "Asia/Colombo") return false;
  if (value.data_source === "mysql") {
    return value.policy_id === "pending-confirmation" && value.volatile === false
      && value.fixture_week_start === null;
  }
  return value.data_source === "dev-memory"
    && value.policy_id === "kandypack-roster"
    && value.volatile === true
    && isMonday(value.fixture_week_start);
}

export function sameRosterMetadata(first: RosterMetadata, second: RosterMetadata): boolean {
  return first.data_source === second.data_source && first.policy_id === second.policy_id
    && first.policy_confirmed === second.policy_confirmed && first.timezone === second.timezone
    && first.volatile === second.volatile && first.fixture_week_start === second.fixture_week_start;
}

function isRoute(value: unknown): value is RosterRoute {
  return isRecord(value) && isId(value.route_id) && isText(value.station_id)
    && isText(value.route_name) && isId(value.max_duration_seconds);
}

function isTruck(value: unknown): value is RosterTruck {
  return isRecord(value) && isId(value.truck_id) && (value.station_id === null || isText(value.station_id))
    && isText(value.plate_number) && typeof value.is_active === "boolean";
}

function isStaff(value: unknown, type: RosterStaff["staff_type"]): value is RosterStaff {
  return isRecord(value) && isId(value.staff_id) && isId(value.person_id)
    && isText(value.name) && value.staff_type === type;
}

function isAssignment(value: unknown): value is RosterAssignment {
  return isRecord(value)
    && [value.roster_id, value.route_id, value.truck_id, value.driver_id,
      value.assistant_id, value.dispatcher_id, value.duration_seconds].every(isId)
    && isTimestamp(value.start_time) && isTimestamp(value.end_time)
    && isTimestamp(value.created_at)
    && Date.parse(value.end_time) - Date.parse(value.start_time) === Number(value.duration_seconds) * 1000
    && typeof value.status === "string"
    && ["SCHEDULED", "IN_TRANSIT", "COMPLETED", "CANCELLED"].includes(value.status);
}

function isWriteMetadata(value: unknown): value is RosterWriteMetadata {
  return isRecord(value) && value.data_source === "mysql" && value.policy_id === "kandypack-roster"
    && value.policy_confirmed === false && value.timezone === "Asia/Colombo"
    && value.volatile === false && value.fixture_week_start === null;
}

function isCreatedAssignment(value: unknown): value is RosterAssignmentCreated {
  return isRecord(value) && value.status === "SUCCESS" && isText(value.message)
    && (value.result_code === "ROSTER_ASSIGNED" || value.result_code === "ROSTER_ASSIGNMENT_REPLAYED")
    && isAssignment(value.assignment) && isWriteMetadata(value.meta);
}

function isStaffHours(value: unknown): boolean {
  return isRecord(value) && isId(value.staff_id)
    && (value.staff_type === "DRIVER" || value.staff_type === "ASSISTANT")
    && isNonNegativeInteger(value.scheduled_seconds) && isId(value.limit_seconds)
    && isInteger(value.remaining_seconds);
}

function isNullableText(value: unknown): value is string | null {
  return value === null || isText(value);
}

function isAuditAttempt(value: unknown): value is RosterAuditAttempt {
  return isRecord(value) && isId(value.audit_id) && isId(value.actor_id)
    && isNullableText(value.actor_name) && isTimestamp(value.occurred_at)
    && value.outcome === "ACCEPTED" && value.legacy === false
    && [value.attempted_route_id, value.attempted_truck_id, value.attempted_driver_id,
      value.attempted_assistant_id, value.assignment_id].every(isId)
    && isTimestamp(value.attempted_start_time) && isTimestamp(value.attempted_end_time)
    && isNonNegativeInteger(value.attempted_duration_seconds) && value.attempted_duration_seconds > 0
    && Date.parse(value.attempted_end_time) - Date.parse(value.attempted_start_time)
      === value.attempted_duration_seconds * 1000
    && isText(value.request_key) && value.request_key.length <= 128
    && value.policy_id === null && value.reason_code === null;
}


function errorMessage(detail: unknown): string | undefined {
  if (isText(detail)) return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map(errorMessage).filter(Boolean);
    return messages.length ? messages.join("; ") : undefined;
  }
  if (isRecord(detail)) {
    if (isText(detail.message)) return detail.message;
    if (isText(detail.msg)) return detail.msg;
  }
}

function invalidResponse(): never {
  throw new RosterApiError("The server returned an unexpected response. Please retry.", 502, "INVALID_RESPONSE");
}

async function readJson(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (response.ok) invalidResponse();
  }
  if (!response.ok) {
    const detail = isRecord(body) ? body.detail : body;
    const code = isRecord(detail) && isText(detail.error_code) ? detail.error_code : undefined;
    throw new RosterApiError(
      errorMessage(detail) ?? `The request could not be completed (HTTP ${response.status}).`,
      response.status,
      code,
    );
  }
  return body;
}

async function writeJson(
  path: string, body: RosterAssignmentRequest, idempotencyKey: string, signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
    signal,
  });
  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    if (response.ok) invalidResponse();
  }
  if (!response.ok) {
    const detail = isRecord(responseBody) ? responseBody.detail : responseBody;
    const code = isRecord(detail) && isText(detail.error_code) ? detail.error_code : undefined;
    throw new RosterApiError(
      errorMessage(detail) ?? `The request could not be completed (HTTP ${response.status}).`,
      response.status,
      code,
    );
  }
  return responseBody;
}

export async function getRosterSession(signal: AbortSignal): Promise<RosterSession> {
  const body = await readJson("/api/v1/auth/me", signal);
  if (!isRecord(body) || !isId(body.user_id) || !isText(body.name)
    || !isText(body.role) || typeof body.force_password_reset !== "boolean") invalidResponse();
  return body as unknown as RosterSession;
}

export async function getRosterCandidates(signal: AbortSignal): Promise<RosterCandidates> {
  const body = await readJson("/api/v1/roster/candidates", signal);
  if (!isRecord(body) || !isMetadata(body.meta)
    || !Array.isArray(body.routes) || !body.routes.every(isRoute)
    || !Array.isArray(body.trucks) || !body.trucks.every(isTruck)
    || !Array.isArray(body.drivers) || !body.drivers.every((item) => isStaff(item, "DRIVER"))
    || !Array.isArray(body.assistants) || !body.assistants.every((item) => isStaff(item, "ASSISTANT"))) invalidResponse();
  if (body.meta.data_source === "mysql") {
    if (!body.routes.every((route) => /^[1-9]\d*$/.test(route.station_id))
      || !body.trucks.every((truck) => truck.station_id === null)) invalidResponse();
  } else if (!body.trucks.every((truck) => isText(truck.station_id))) invalidResponse();
  return body as unknown as RosterCandidates;
}

/** Shift calendar dates in UTC, never using the device's local timezone. */
export function shiftRosterWeek(weekStart: string, weeks: number): string {
  if (!isMonday(weekStart) || !Number.isSafeInteger(weeks)) throw new RangeError("A valid Monday and whole weeks are required.");
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  const shifted = date.toISOString().slice(0, 10);
  if (!isMonday(shifted)) throw new RangeError("The selected week is outside the supported date range.");
  return shifted;
}

/** Monday in Colombo for the supplied instant, independently of device timezone. */
export function currentColomboWeek(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  const date = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.toISOString().slice(0, 10);
}

export function initialRosterWeek(meta: RosterMetadata, now = new Date()): string {
  return meta.data_source === "dev-memory" ? meta.fixture_week_start : currentColomboWeek(now);
}

const colomboOffsetFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo", timeZoneName: "longOffset",
});

function colomboMidnight(date: string): string {
  const calendarMidnight = Date.parse(`${date}T00:00:00Z`);
  let instant = calendarMidnight;
  // Resolve the offset at local midnight, including historical Colombo changes.
  for (let attempt = 0; attempt < 3; attempt++) {
    const zone = colomboOffsetFormat.formatToParts(new Date(instant))
      .find((part) => part.type === "timeZoneName")?.value ?? "";
    const offset = /^GMT([+-])(\d{2}):(\d{2})$/.exec(zone);
    if (!offset) throw new RangeError("This historical week has an unsupported timezone offset.");
    const minutes = (Number(offset[2]) * 60 + Number(offset[3])) * (offset[1] === "+" ? 1 : -1);
    const resolved = calendarMidnight - minutes * 60_000;
    if (resolved === instant) return `${date}T00:00:00${zone.slice(3)}`;
    instant = resolved;
  }
  throw new RangeError("The selected week does not start at a valid Colombo midnight.");
}

/** Build Colombo midnights explicitly; the end is the following Monday, exclusive. */
export function rosterWeekRange(weekStart: string): { from: string; to: string } {
  const nextWeek = shiftRosterWeek(weekStart, 1);
  return {
    from: colomboMidnight(weekStart),
    to: colomboMidnight(nextWeek),
  };
}

// Preserve the Session 1 helper for existing explicit demo consumers.
export const fixtureWeekRange = rosterWeekRange;

/**
 * Convert a browser datetime-local value to the fixed Sri Lanka API offset.
 * No Date constructor is used, so the device timezone cannot affect the value.
 */
export function serializeColomboDateTime(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new RangeError("Enter a complete Sri Lanka date and time.");
  }
  const local = `${value}:00`;
  const check = new Date(`${local}Z`);
  if (Number(value.slice(0, 4)) < 1000 || !Number.isFinite(check.getTime())
    || check.toISOString().slice(0, 19) !== local) {
    throw new RangeError("Enter a valid Sri Lanka date and time.");
  }
  return `${local}+05:30`;
}

export async function createRosterAssignment(
  request: RosterAssignmentRequest, idempotencyKey: string, signal?: AbortSignal,
): Promise<RosterAssignmentCreated> {
  if (!isText(idempotencyKey) || idempotencyKey.length > 128
    || ![request.route_id, request.truck_id, request.driver_id, request.assistant_id].every(isId)
    || !isTimestamp(request.start_time) || !isTimestamp(request.end_time)) {
    throw new RangeError("The assignment request is incomplete.");
  }
  const body = await writeJson("/api/v1/roster/assign", request, idempotencyKey, signal);
  if (!isCreatedAssignment(body)) invalidResponse();
  return body;
}

export async function getRosterAssignments(
  range: { from: string; to: string }, signal: AbortSignal,
): Promise<RosterAssignments> {
  const query = new URLSearchParams(range);
  const body = await readJson(`/api/v1/roster/assignments?${query}`, signal);
  if (!isRecord(body) || !isMetadata(body.meta)
    || !Array.isArray(body.assignments) || !body.assignments.every(isAssignment)) invalidResponse();
  const from = Date.parse(range.from);
  const to = Date.parse(range.to);
  const ids = new Set<number>();
  for (let index = 0; index < body.assignments.length; index++) {
    const assignment = body.assignments[index];
    const previous = body.assignments[index - 1];
    const start = Date.parse(assignment.start_time);
    if (ids.has(assignment.roster_id) || start >= to || Date.parse(assignment.end_time) <= from
      || (previous && (Date.parse(previous.start_time) > start
        || (Date.parse(previous.start_time) === start && previous.roster_id > assignment.roster_id)))) invalidResponse();
    ids.add(assignment.roster_id);
  }
  return body as unknown as RosterAssignments;
}

export async function getRosterHours(weekStart: string, signal: AbortSignal): Promise<RosterHours> {
  if (!isMonday(weekStart) || Number(weekStart.slice(0, 4)) < 1000) {
    throw new RangeError("A supported Monday is required for roster hours.");
  }
  const query = new URLSearchParams({ week_start: weekStart });
  const body = await readJson(`/api/v1/roster/hours?${query}`, signal);
  if (!isRecord(body) || !isWriteMetadata(body.meta)
    || body.week_start !== weekStart || body.week_end !== shiftRosterWeek(weekStart, 1)
    || !Array.isArray(body.hours) || !body.hours.every(isStaffHours)) invalidResponse();
  const keys = new Set<string>();
  for (const row of body.hours) {
    const key = `${row.staff_id}:${row.staff_type}`;
    if (keys.has(key)) invalidResponse();
    keys.add(key);
  }
  return body as unknown as RosterHours;
}

export async function getRosterAudit(signal: AbortSignal, limit = 50): Promise<RosterAudit> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError("Audit limit must be an integer from 1 through 100.");
  }
  const query = new URLSearchParams({ limit: String(limit) });
  const body = await readJson(`/api/v1/roster/audit?${query}`, signal);
  if (!isRecord(body) || !isWriteMetadata(body.meta)
    || !Array.isArray(body.attempts) || body.attempts.length > limit
    || !body.attempts.every(isAuditAttempt)) invalidResponse();
  const ids = new Set<number>();
  for (let index = 0; index < body.attempts.length; index++) {
    const attempt = body.attempts[index];
    const previous = body.attempts[index - 1];
    if (ids.has(attempt.audit_id)) invalidResponse();
    ids.add(attempt.audit_id);
    if (previous) {
      const previousTime = previous.occurred_at === null ? Number.NEGATIVE_INFINITY : Date.parse(previous.occurred_at);
      const currentTime = attempt.occurred_at === null ? Number.NEGATIVE_INFINITY : Date.parse(attempt.occurred_at);
      if (previousTime < currentTime || (previousTime === currentTime && previous.audit_id < attempt.audit_id)) {
        invalidResponse();
      }
    }
  }
  return body as unknown as RosterAudit;
}
