import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { afterEach, mock, test } from "node:test";
import ts from "typescript";

// Exercise the actual TypeScript client without introducing a browser/test dependency.
const source = await readFile(new URL("../lib/roster/api.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});
const apiModule = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
const api = await import(apiModule);

const meta = {
  data_source: "dev-memory", policy_id: "demo-v1", policy_confirmed: false,
  timezone: "Asia/Colombo", volatile: true, fixture_week_start: "2026-09-14",
};
const candidates = {
  routes: [{ route_id: 1, station_id: "CMB", route_name: "Colombo North", max_duration_seconds: 14400 }],
  trucks: [{ truck_id: 1, station_id: "CMB", plate_number: "DEMO-001", is_active: true }],
  drivers: [{ staff_id: 1, person_id: 101, name: "Demo Driver", staff_type: "DRIVER" }],
  assistants: [{ staff_id: 2, person_id: 102, name: "Demo Assistant", staff_type: "ASSISTANT" }],
  meta,
};
const mysqlMeta = {
  data_source: "mysql", policy_id: "pending-confirmation", policy_confirmed: false,
  timezone: "Asia/Colombo", volatile: false, fixture_week_start: null,
};
const mysqlWriteMeta = {
  data_source: "mysql", policy_id: "demo-v1", policy_confirmed: false,
  timezone: "Asia/Colombo", volatile: false, fixture_week_start: null,
};
const mysqlCandidates = {
  ...candidates,
  routes: [{ ...candidates.routes[0], station_id: "17", max_duration_seconds: 90061 }],
  trucks: [{ ...candidates.trucks[0], station_id: null }],
  meta: mysqlMeta,
};
const assignment = {
  roster_id: 1, route_id: 1, truck_id: 1, driver_id: 1, assistant_id: 2, dispatcher_id: 10,
  start_time: "2026-09-15T08:00:00+05:30", end_time: "2026-09-15T10:00:00+05:30",
  duration_seconds: 7200, status: "SCHEDULED", created_at: "2026-09-14T00:00:00Z",
};
const createdAssignment = {
  status: "SUCCESS", message: "Roster assignment created.", result_code: "ROSTER_ASSIGNED",
  assignment, meta: mysqlWriteMeta,
};
const hours = {
  week_start: "2026-09-14", week_end: "2026-09-21",
  hours: [
    { staff_id: 1, staff_type: "DRIVER", scheduled_seconds: 144000, limit_seconds: 144000, remaining_seconds: 0 },
    { staff_id: 2, staff_type: "ASSISTANT", scheduled_seconds: 216001, limit_seconds: 216000, remaining_seconds: -1 },
  ],
  meta: mysqlWriteMeta,
};
const acceptedAudit = {
  audit_id: 3, actor_id: 10, actor_name: "Dispatcher",
  attempted_route_id: 1, attempted_truck_id: 1, attempted_driver_id: 1, attempted_assistant_id: 2,
  attempted_start_time: "2026-09-22T09:00:00+05:30", attempted_end_time: "2026-09-22T10:00:00+05:30",
  attempted_duration_seconds: 3600, outcome: "ACCEPTED", reason_code: null,
  policy_id: "demo-v1", request_key: "request-3", assignment_id: 501,
  occurred_at: "2026-09-20T10:00:00+05:30", legacy: false,
};
const rejectedAudit = {
  ...acceptedAudit, audit_id: 2, outcome: "REJECTED", reason_code: "TRUCK_OVERLAP",
  request_key: "request-2", assignment_id: null, occurred_at: "2026-09-20T09:00:00+05:30",
};
const legacyAudit = {
  audit_id: 1, actor_id: 10, actor_name: null,
  attempted_route_id: null, attempted_truck_id: null, attempted_driver_id: null,
  attempted_assistant_id: null, attempted_start_time: null, attempted_end_time: null,
  attempted_duration_seconds: null, outcome: "FAILURE", reason_code: null,
  policy_id: null, request_key: null, assignment_id: null,
  occurred_at: "2026-09-20T08:00:00+05:30", legacy: true,
};
const audit = { attempts: [acceptedAudit, rejectedAudit, legacyAudit], meta: mysqlWriteMeta };
const signal = () => new AbortController().signal;
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" },
});

afterEach(() => mock.restoreAll());

test("existing staff session uses same-origin cookies and preserves role/reset flags", async () => {
  const session = { user_id: 10, name: "Dispatcher", role: "DISPATCHER", force_password_reset: true };
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse(session));
  const requestSignal = signal();
  assert.deepEqual(await api.getRosterSession(requestSignal), session);
  const [path, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(path, "/api/v1/auth/me");
  assert.equal(options.credentials, "same-origin");
  assert.equal(options.cache, "no-store");
  assert.equal(options.signal, requestSignal);
});

test("catalog accepts backend station codes and explicitly provisional metadata", async () => {
  mock.method(globalThis, "fetch", async () => jsonResponse(candidates));
  assert.deepEqual(await api.getRosterCandidates(signal()), candidates);
});

test("a valid empty catalog remains distinct from an invalid successful response", async () => {
  mock.method(globalThis, "fetch", async () => jsonResponse({
    routes: [], trucks: [], drivers: [], assistants: [], meta,
  }));
  assert.equal((await api.getRosterCandidates(signal())).routes.length, 0);
});

test("malformed or unexpected-mode 200 responses never become fallback data", async () => {
  const bodies = [
    {},
    { ...candidates, drivers: [{}] },
    { ...candidates, meta: { ...meta, data_source: "mysql" } },
    { ...candidates, meta: { ...meta, fixture_week_start: "2026-09-15" } },
  ];
  let index = 0;
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse(bodies[index++]));
  for (const unused of bodies) {
    void unused;
    await assert.rejects(api.getRosterCandidates(signal()), {
      name: "RosterApiError", status: 502, code: "INVALID_RESPONSE",
    });
  }
  assert.equal(fetchMock.mock.calls.length, bodies.length);
});

test("invalid JSON success is reported rather than treated as an empty roster", async () => {
  mock.method(globalThis, "fetch", async () => new Response("<html>Proxy response</html>"));
  await assert.rejects(api.getRosterCandidates(signal()), { status: 502, code: "INVALID_RESPONSE" });
});

test("auth strings, FastAPI validation lists, and roster error objects remain actionable", async () => {
  const cases = [
    { status: 401, body: { detail: "INVALID_TOKEN: Session expired." }, message: /Session expired/ },
    { status: 422, body: { detail: [{ loc: ["query", "from"], msg: "Offset required" }] }, message: /Offset required/ },
    { status: 503, body: { detail: { error_code: "ROSTER_DISABLED", message: "Roster data is disabled." } }, message: /disabled/, code: "ROSTER_DISABLED" },
  ];
  let index = 0;
  mock.method(globalThis, "fetch", async () => {
    const item = cases[index++];
    return jsonResponse(item.body, item.status);
  });
  for (const item of cases) {
    await assert.rejects(api.getRosterCandidates(signal()), (error) => {
      assert.equal(error.status, item.status);
      assert.match(error.message, item.message);
      assert.equal(error.code, item.code);
      return true;
    });
  }
});

test("plain-text proxy errors preserve status", async () => {
  mock.method(globalThis, "fetch", async () => new Response("Bad gateway", { status: 502 }));
  await assert.rejects(api.getRosterCandidates(signal()), { status: 502, message: /HTTP 502/ });
});

test("network failures reject without automatic retries or fixture substitution", async () => {
  const failure = new TypeError("Network unavailable");
  const fetchMock = mock.method(globalThis, "fetch", async () => { throw failure; });
  await assert.rejects(api.getRosterCandidates(signal()), (error) => error === failure);
  assert.equal(fetchMock.mock.calls.length, 1);
});

test("assignment creation serializes Sri Lanka local fields with a fixed +05:30 offset", () => {
  assert.equal(api.serializeColomboDateTime("2026-09-22T09:00"), "2026-09-22T09:00:00+05:30");
  assert.equal(api.serializeColomboDateTime("2026-12-31T23:59"), "2026-12-31T23:59:00+05:30");
  assert.throws(() => api.serializeColomboDateTime("2026-02-30T09:00"), RangeError);
  assert.throws(() => api.serializeColomboDateTime("2026-09-22T09:00:30"), RangeError);
});

test("assignment creation sends only documented fields, credentials, and one idempotency key", async () => {
  const request = {
    route_id: 1, truck_id: 1, driver_id: 1, assistant_id: 2,
    start_time: "2026-09-22T09:00:00+05:30", end_time: "2026-09-22T10:00:00+05:30",
  };
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse(createdAssignment, 201));
  assert.deepEqual(await api.createRosterAssignment(request, "request-key-1"), createdAssignment);
  const [path, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(path, "/api/v1/roster/assign");
  assert.equal(options.method, "POST");
  assert.equal(options.credentials, "same-origin");
  assert.equal(options.cache, "no-store");
  assert.equal(options.headers["Idempotency-Key"], "request-key-1");
  assert.deepEqual(JSON.parse(options.body), request);
  assert.equal("dispatcher_id" in JSON.parse(options.body), false);
  assert.equal("duration_seconds" in JSON.parse(options.body), false);
});

test("assignment rejection and service errors retain server messages without retries", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse({
    detail: { error_code: "TRUCK_OVERLAP", message: "Truck is already assigned during this interval." },
  }, 409));
  await assert.rejects(api.createRosterAssignment({
    route_id: 1, truck_id: 1, driver_id: 1, assistant_id: 2,
    start_time: "2026-09-22T09:00:00+05:30", end_time: "2026-09-22T10:00:00+05:30",
  }, "request-key-2"), {
    name: "RosterApiError", status: 409, code: "TRUCK_OVERLAP",
  });
  assert.equal(fetchMock.mock.calls.length, 1);
});

test("fixture week crosses year boundaries using explicit Colombo offsets", () => {
  assert.deepEqual(api.fixtureWeekRange("2026-12-28"), {
    from: "2026-12-28T00:00:00+05:30", to: "2027-01-04T00:00:00+05:30",
  });
});

test("assignment request encodes positive offsets and accepts the read contract", async () => {
  const body = { assignments: [assignment], meta };
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse(body));
  const range = api.fixtureWeekRange(meta.fixture_week_start);
  assert.deepEqual(await api.getRosterAssignments(range, signal()), body);
  const url = new URL(fetchMock.mock.calls[0].arguments[0], "http://localhost");
  assert.equal(url.pathname, "/api/v1/roster/assignments");
  assert.equal(url.searchParams.get("from"), range.from);
  assert.equal(url.searchParams.get("to"), range.to);
});

test("malformed assignment records fail explicitly", async () => {
  mock.method(globalThis, "fetch", async () => jsonResponse({
    assignments: [{ ...assignment, start_time: "2026-09-15T08:00:00" }], meta,
  }));
  await assert.rejects(api.getRosterAssignments(api.fixtureWeekRange(meta.fixture_week_start), signal()), {
    status: 502, code: "INVALID_RESPONSE",
  });
});

test("MySQL catalog accepts decimal station IDs, null truck stations, and durations over 24 hours", async () => {
  mock.method(globalThis, "fetch", async () => jsonResponse(mysqlCandidates));
  assert.deepEqual(await api.getRosterCandidates(signal()), mysqlCandidates);
});

test("MySQL empty catalogs and assignments remain actual empty arrays", async () => {
  const empty = { routes: [], trucks: [], drivers: [], assistants: [], meta: mysqlMeta };
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse(empty));
  assert.deepEqual(await api.getRosterCandidates(signal()), empty);
  fetchMock.mock.mockImplementation(async () => jsonResponse({ assignments: [], meta: mysqlMeta }));
  assert.deepEqual(await api.getRosterAssignments(api.rosterWeekRange("2026-09-14"), signal()), {
    assignments: [], meta: mysqlMeta,
  });
});

test("metadata validates each mode without accepting hybrid or missing fields", async () => {
  const invalidMetadata = [
    { ...mysqlMeta, volatile: true },
    { ...mysqlMeta, policy_id: "demo-v1" },
    { ...mysqlMeta, policy_confirmed: true },
    { ...mysqlMeta, fixture_week_start: "2026-09-14" },
    { ...mysqlMeta, fixture_week_start: undefined },
    { ...mysqlMeta, timezone: "UTC" },
    { ...mysqlMeta, data_source: "unknown" },
    { ...meta, fixture_week_start: null },
    { ...meta, fixture_week_start: "2026-02-30" },
    { ...meta, fixture_week_start: "2026-09-15" },
    { ...meta, volatile: false },
  ];
  let index = 0;
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse({
    routes: [], trucks: [], drivers: [], assistants: [], meta: invalidMetadata[index++],
  }));
  for (const unused of invalidMetadata) {
    void unused;
    await assert.rejects(api.getRosterCandidates(signal()), { status: 502, code: "INVALID_RESPONSE" });
  }
  assert.equal(fetchMock.mock.calls.length, invalidMetadata.length);
});

test("catalog station mappings and exact positive durations are validated for their source", async () => {
  const bodies = [
    { ...mysqlCandidates, routes: [{ ...mysqlCandidates.routes[0], station_id: "CMB" }] },
    { ...mysqlCandidates, routes: [{ ...mysqlCandidates.routes[0], station_id: null }] },
    { ...mysqlCandidates, routes: [{ ...mysqlCandidates.routes[0], max_duration_seconds: 90061.5 }] },
    { ...mysqlCandidates, routes: [{ ...mysqlCandidates.routes[0], max_duration_seconds: 0 }] },
    { ...mysqlCandidates, trucks: [{ ...mysqlCandidates.trucks[0], station_id: "CMB" }] },
    { ...mysqlCandidates, trucks: [{ ...mysqlCandidates.trucks[0], station_id: undefined }] },
    { ...candidates, trucks: [{ ...candidates.trucks[0], station_id: null }] },
    { ...mysqlCandidates, drivers: [{ ...mysqlCandidates.drivers[0], staff_type: "ASSISTANT" }] },
  ];
  let index = 0;
  mock.method(globalThis, "fetch", async () => jsonResponse(bodies[index++]));
  for (const unused of bodies) {
    void unused;
    await assert.rejects(api.getRosterCandidates(signal()), { status: 502, code: "INVALID_RESPONSE" });
  }
});

test("initial week uses the clock only for MySQL and preserves explicit demo fixtures", () => {
  const now = new Date("2027-01-03T18:30:00Z");
  assert.equal(api.initialRosterWeek(mysqlMeta, now), "2027-01-04");
  assert.equal(api.initialRosterWeek(meta, now), "2026-09-14");
});

test("Colombo weeks switch exactly at Monday midnight across a year boundary", () => {
  assert.equal(api.currentColomboWeek(new Date("2027-01-03T18:29:59Z")), "2026-12-28");
  assert.equal(api.currentColomboWeek(new Date("2027-01-03T18:30:00Z")), "2027-01-04");
  assert.equal(api.currentColomboWeek(new Date("2027-01-04T00:00:00+05:30")), "2027-01-04");
  assert.equal(api.currentColomboWeek(new Date("2027-01-03T10:30:00-08:00")), "2027-01-04");
});

test("previous and next navigation preserve Monday dates across month, leap day, and year", () => {
  assert.equal(api.shiftRosterWeek("2027-01-04", -1), "2026-12-28");
  assert.equal(api.shiftRosterWeek("2026-12-28", 1), "2027-01-04");
  assert.equal(api.shiftRosterWeek("2024-02-26", 1), "2024-03-04");
  assert.equal(api.shiftRosterWeek("2024-03-04", -1), "2024-02-26");
  assert.deepEqual(api.rosterWeekRange("2024-02-26"), {
    from: "2024-02-26T00:00:00+05:30", to: "2024-03-04T00:00:00+05:30",
  });
  assert.throws(() => api.rosterWeekRange("2026-02-30"), RangeError);
  assert.throws(() => api.shiftRosterWeek("2026-09-15", 1), RangeError);
});

test("week selection and navigation are identical across device timezones", () => {
  const script = `
    const api = await import(${JSON.stringify(apiModule)});
    const current = api.currentColomboWeek(new Date("2027-01-03T18:30:00Z"));
    process.stdout.write(JSON.stringify({ current, previous: api.shiftRosterWeek(current, -1), range: api.rosterWeekRange(current) }));
  `;
  const results = ["UTC", "America/Los_Angeles", "Pacific/Kiritimati", "Asia/Colombo"].map((timezone) =>
    JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      env: { ...process.env, TZ: timezone }, encoding: "utf8", windowsHide: true,
    })));
  for (const result of results) assert.deepEqual(result, {
    current: "2027-01-04", previous: "2026-12-28",
    range: { from: "2027-01-04T00:00:00+05:30", to: "2027-01-11T00:00:00+05:30" },
  });
});

test("historical Colombo weeks use their actual IANA offsets, including changes within a week", () => {
  assert.deepEqual(api.rosterWeekRange("2000-01-03"), {
    from: "2000-01-03T00:00:00+06:00", to: "2000-01-10T00:00:00+06:00",
  });
  assert.deepEqual(api.rosterWeekRange("2006-04-10"), {
    from: "2006-04-10T00:00:00+06:00", to: "2006-04-17T00:00:00+05:30",
  });
  assert.deepEqual(api.rosterWeekRange("1996-05-20"), {
    from: "1996-05-20T00:00:00+05:30", to: "1996-05-27T00:00:00+06:30",
  });
  assert.throws(() => api.rosterWeekRange("1900-01-01"), /unsupported timezone offset/);
});

test("metadata consistency detects an adapter or demo fixture change between requests", () => {
  assert.equal(api.sameRosterMetadata(mysqlMeta, { ...mysqlMeta }), true);
  assert.equal(api.sameRosterMetadata(meta, mysqlMeta), false);
  assert.equal(api.sameRosterMetadata(meta, { ...meta, fixture_week_start: "2026-09-21" }), false);
});

test("MySQL assignments accept history references absent from the active catalog", async () => {
  const body = { assignments: [{ ...assignment, driver_id: 999, assistant_id: 1000 }], meta: mysqlMeta };
  mock.method(globalThis, "fetch", async () => jsonResponse(body));
  assert.deepEqual(await api.getRosterAssignments(api.rosterWeekRange("2026-09-14"), signal()), body);
});

test("assignment records reject normalized invalid dates, missing values, statuses and inconsistent durations", async () => {
  const records = [
    { ...assignment, start_time: "2026-02-30T08:00:00+05:30", end_time: "2026-02-30T10:00:00+05:30" },
    { ...assignment, created_at: "2026-09-14T24:00:00Z" },
    { ...assignment, start_time: "2026-09-15T08:00:00.500+05:30" },
    { ...assignment, start_time: "2026-09-15T08:00:00+24:00" },
    { ...assignment, created_at: null },
    { ...assignment, status: "UNKNOWN" },
    { ...assignment, status: ["SCHEDULED"] },
    { ...assignment, duration_seconds: 7200.5 },
    { ...assignment, duration_seconds: 3600 },
    { ...assignment, end_time: assignment.start_time },
  ];
  let index = 0;
  mock.method(globalThis, "fetch", async () => jsonResponse({ assignments: [records[index++]], meta: mysqlMeta }));
  for (const unused of records) {
    void unused;
    await assert.rejects(api.getRosterAssignments(api.rosterWeekRange("2026-09-14"), signal()), {
      status: 502, code: "INVALID_RESPONSE",
    });
  }
});

test("assignment response validates half-open boundaries, duplicate IDs and chronological ordering", async () => {
  const start = { ...assignment, start_time: "2026-09-14T00:00:00+05:30", end_time: "2026-09-14T02:00:00+05:30" };
  const before = { ...assignment, start_time: "2026-09-13T22:00:00+05:30", end_time: "2026-09-14T00:00:00+05:30" };
  const after = { ...assignment, start_time: "2026-09-21T00:00:00+05:30", end_time: "2026-09-21T02:00:00+05:30" };
  const lists = [[before], [after], [assignment, assignment], [assignment, { ...start, roster_id: 2 }], [{ ...assignment, roster_id: 2 }, assignment]];
  let index = 0;
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse({ assignments: lists[index++], meta: mysqlMeta }));
  for (const unused of lists) {
    void unused;
    await assert.rejects(api.getRosterAssignments(api.rosterWeekRange("2026-09-14"), signal()), {
      status: 502, code: "INVALID_RESPONSE",
    });
  }
  const valid = [start, { ...assignment, roster_id: 2 }, { ...assignment, roster_id: 3 }];
  fetchMock.mock.mockImplementation(async () => jsonResponse({ assignments: valid, meta: mysqlMeta }));
  assert.deepEqual((await api.getRosterAssignments(api.rosterWeekRange("2026-09-14"), signal())).assignments, valid);
});

test("MySQL service failures preserve explicit causes and make no fallback request", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse({
    detail: { error_code: "ROSTER_DATABASE_UNAVAILABLE", message: "The roster database is unavailable." },
  }, 503));
  await assert.rejects(api.getRosterCandidates(signal()), { status: 503, code: "ROSTER_DATABASE_UNAVAILABLE" });
  assert.equal(fetchMock.mock.calls.length, 1);
});

test("selected-week hours use the exact Monday query and strictly parse role totals", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse(hours));
  const requestSignal = signal();
  assert.deepEqual(await api.getRosterHours("2026-09-14", requestSignal), hours);
  const [path, options] = fetchMock.mock.calls[0].arguments;
  const url = new URL(path, "http://localhost");
  assert.equal(url.pathname, "/api/v1/roster/hours");
  assert.equal(url.searchParams.get("week_start"), "2026-09-14");
  assert.equal(options.credentials, "same-origin");
  assert.equal(options.cache, "no-store");
  assert.equal(options.signal, requestSignal);
  assert.equal(fetchMock.mock.calls.length, 1);
  await assert.rejects(api.getRosterHours("2026-09-15", requestSignal), RangeError);
});

test("empty hours remain empty and malformed hours responses fail explicitly", async () => {
  const bodies = [
    { ...hours, hours: [] },
    { ...hours, week_end: "2026-09-22" },
    { ...hours, meta: mysqlMeta },
    { ...hours, hours: [{ ...hours.hours[0], scheduled_seconds: 1.5 }] },
    { ...hours, hours: [{ ...hours.hours[0], remaining_seconds: null }] },
    { ...hours, hours: [hours.hours[0], { ...hours.hours[0] }] },
  ];
  let index = 0;
  mock.method(globalThis, "fetch", async () => jsonResponse(bodies[index++]));
  assert.deepEqual((await api.getRosterHours("2026-09-14", signal())).hours, []);
  for (let bodyIndex = 1; bodyIndex < bodies.length; bodyIndex++) {
    await assert.rejects(api.getRosterHours("2026-09-14", signal()), {
      status: 502, code: "INVALID_RESPONSE",
    });
  }
});

test("audit requests the documented limit and parses accepted rejected and legacy entries", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse(audit));
  const requestSignal = signal();
  assert.deepEqual(await api.getRosterAudit(requestSignal), audit);
  const [path, options] = fetchMock.mock.calls[0].arguments;
  const url = new URL(path, "http://localhost");
  assert.equal(url.pathname, "/api/v1/roster/audit");
  assert.equal(url.searchParams.get("limit"), "50");
  assert.equal(options.signal, requestSignal);
  assert.equal(fetchMock.mock.calls.length, 1);
});

test("empty audit stays empty and explicit maximum limit is encoded", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => jsonResponse({ attempts: [], meta: mysqlWriteMeta }));
  assert.deepEqual((await api.getRosterAudit(signal(), 100)).attempts, []);
  const url = new URL(fetchMock.mock.calls[0].arguments[0], "http://localhost");
  assert.equal(url.searchParams.get("limit"), "100");
  for (const invalid of [0, 101, 1.5, Number.NaN]) {
    await assert.rejects(api.getRosterAudit(signal(), invalid), RangeError);
  }
  assert.equal(fetchMock.mock.calls.length, 1);
});

test("malformed audit detail legacy consistency and ordering are rejected", async () => {
  const bodies = [
    { ...audit, attempts: [{ ...legacyAudit, attempted_route_id: 1 }] },
    { ...audit, attempts: [{ ...acceptedAudit, reason_code: "CONFLICT" }] },
    { ...audit, attempts: [{ ...rejectedAudit, assignment_id: 501 }] },
    { ...audit, attempts: [{ ...acceptedAudit, attempted_start_time: "2026-09-22T09:00:00" }] },
    { ...audit, attempts: [rejectedAudit, acceptedAudit] },
    { ...audit, attempts: [acceptedAudit, { ...acceptedAudit }] },
    { ...audit, attempts: Array.from({ length: 51 }, (_, index) => ({ ...legacyAudit, audit_id: index + 1 })) },
  ];
  let index = 0;
  mock.method(globalThis, "fetch", async () => jsonResponse(bodies[index++]));
  for (const unused of bodies) {
    void unused;
    await assert.rejects(api.getRosterAudit(signal()), { status: 502, code: "INVALID_RESPONSE" });
  }
});

test("reporting authentication permission and unavailable responses preserve status and code", async () => {
  const cases = [
    { status: 401, code: undefined, detail: "INVALID_TOKEN: Session expired." },
    { status: 403, code: "PASSWORD_RESET_REQUIRED", detail: { error_code: "PASSWORD_RESET_REQUIRED", message: "Reset required." } },
    { status: 503, code: "ROSTER_REPORTING_REQUIRES_MYSQL", detail: { error_code: "ROSTER_REPORTING_REQUIRES_MYSQL", message: "Persistent reporting requires MySQL." } },
  ];
  let index = 0;
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    const item = cases[index++];
    return jsonResponse({ detail: item.detail }, item.status);
  });
  await assert.rejects(api.getRosterHours("2026-09-14", signal()), { status: 401 });
  await assert.rejects(api.getRosterAudit(signal()), { status: 403, code: "PASSWORD_RESET_REQUIRED" });
  await assert.rejects(api.getRosterHours("2026-09-14", signal()), { status: 503, code: "ROSTER_REPORTING_REQUIRES_MYSQL" });
  assert.equal(fetchMock.mock.calls.length, 3);
});

test("assignment success refreshes all authoritative views without browser policy constants", async () => {
  const [overview, form, weekly] = await Promise.all([
    readFile(new URL("../components/roster/RosterOverview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/roster/AssignmentForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/roster/WeeklyHours.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(form, /const result = await createRosterAssignment/);
  assert.match(form, /await onCreated\(\)/);
  assert.match(overview, /<AssignmentForm catalog=\{catalog\} onCreated=\{onRefresh\}/);
  assert.match(overview, /getRosterAssignments\(range, signal\)/);
  assert.match(overview, /getRosterHours\(weekStart, signal\)/);
  assert.match(overview, /getRosterAudit\(signal, 50\)/);
  assert.doesNotMatch(source, /144000|216000/);
  assert.doesNotMatch(weekly, /144000|216000/);
});
