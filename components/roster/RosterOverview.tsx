"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Info, Loader2, RefreshCw, Truck, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import GradientBlobs from "@/components/ui/GradientBlobs";
import AssignmentForm from "@/components/roster/AssignmentForm";
import AttemptHistory from "@/components/roster/AttemptHistory";
import WeeklyHours from "@/components/roster/WeeklyHours";
import type { ReportState } from "@/components/roster/WeeklyHours";
import {
  currentColomboWeek,
  getRosterAudit,
  getRosterAssignments,
  getRosterCandidates,
  getRosterHours,
  getRosterSession,
  initialRosterWeek,
  RosterApiError,
  rosterWeekRange,
  sameRosterMetadata,
  shiftRosterWeek,
} from "@/lib/roster/api";
import { canAssignRoster, canReadRoster } from "@/lib/roster/types";
import type {
  RosterAssignment, RosterAudit, RosterCandidates, RosterHours, RosterMetadata, RosterSession,
} from "@/lib/roster/types";

type ViewState =
  | { kind: "loading" }
  | { kind: "denied"; message: string }
  | { kind: "error"; message: string }
  | {
    kind: "ready";
    session: RosterSession;
    catalog: RosterCandidates;
    assignments: RosterAssignment[];
    hours: ReportState<RosterHours>;
    audit: ReportState<RosterAudit>;
    range: { from: string; to: string };
  };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo", day: "numeric", month: "short", year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  hour12: false,
});

function durationLabel(seconds: number): string {
  return `${Number((seconds / 3600).toFixed(2))} h`;
}

async function reportState<T>(request: Promise<T>): Promise<ReportState<T>> {
  try {
    return { kind: "ready", data: await request };
  } catch (error: unknown) {
    if (error instanceof RosterApiError
      && (error.status === 401 || (error.status === 403 && error.code === "PASSWORD_RESET_REQUIRED"))) {
      throw error;
    }
    return {
      kind: "error",
      message: error instanceof RosterApiError
        ? error.message
        : "The reporting service could not be reached. Check your connection and retry.",
    };
  }
}

export default function RosterOverview() {
  const router = useRouter();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [selection, setSelection] = useState<{ weekStart: string; dataSource: RosterMetadata["data_source"] } | null>(null);
  const auditCache = useRef<ReportState<RosterAudit> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        // Check the existing session before requesting any roster data.
        const session = await getRosterSession(signal);
        if (signal.aborted) return;
        if (session.force_password_reset) {
          router.replace("/profile?force_reset=true");
          return;
        }
        if (!canReadRoster(session.role)) {
          setState({ kind: "denied", message: "Your account does not have access to the truck roster." });
          return;
        }

        const catalog = await getRosterCandidates(signal);
        const weekStart = selection?.dataSource === catalog.meta.data_source
          ? selection.weekStart : initialRosterWeek(catalog.meta);
        const range = rosterWeekRange(weekStart);
        const auditRequest = auditCache.current === null
          ? reportState(getRosterAudit(signal, 50))
          : Promise.resolve(auditCache.current);
        const [result, hours, audit] = await Promise.all([
          getRosterAssignments(range, signal),
          reportState(getRosterHours(weekStart, signal)),
          auditRequest,
        ]);
        if (signal.aborted) return;
        if (!sameRosterMetadata(result.meta, catalog.meta)) {
          throw new RosterApiError("The roster data changed while loading. Please refresh.", 502);
        }
        auditCache.current = audit;
        setState({ kind: "ready", session, catalog, assignments: result.assignments, hours, audit, range });
      } catch (error: unknown) {
        if (signal.aborted) return;
        if (error instanceof RosterApiError) {
          if (error.status === 401) {
            router.replace("/login?redirect=/admin/roster");
            return;
          }
          if (error.status === 403 && error.code === "PASSWORD_RESET_REQUIRED") {
            router.replace("/profile?force_reset=true");
            return;
          }
          if (error.status === 403) {
            setState({ kind: "denied", message: error.message });
            return;
          }
        }
        setState({
          kind: "error",
          message: error instanceof RosterApiError
            ? error.message
            : "We could not reach the roster service. Check your connection and retry.",
        });
      }
    }

    void load();
    return () => controller.abort();
  }, [router, attempt, selection]);

  function refresh() {
    auditCache.current = null;
    setState({ kind: "loading" });
    setAttempt((value) => value + 1);
  }

  function selectWeek(weekStart: string) {
    if (state.kind !== "ready") return;
    setSelection({ weekStart, dataSource: state.catalog.meta.data_source });
    setState({ kind: "loading" });
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-6 py-8 sm:py-12 lg:px-16">
      <GradientBlobs />
      <div className="relative mx-auto max-w-7xl">
        <nav aria-label="Roster navigation" className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Button href="/profile" variant="secondary" size="sm" className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to profile
          </Button>
          <span className="caption">Kandypack / Operations</span>
        </nav>

        <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-green-700">Delivery operations</p>
            <h1 className="text-[clamp(2.25rem,5vw,3.75rem)]">Truck roster</h1>
            <p className="mt-4 text-lg">Review delivery schedules, trucks, and the people assigned to each route.</p>
          </div>
          {state.kind === "ready" && (
            <Button variant="secondary" onClick={refresh} className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh roster
            </Button>
          )}
        </header>

        {state.kind === "loading" && (
          <section className="glass flex min-h-48 items-center justify-center gap-3 p-8" role="status" aria-live="polite">
            <Loader2 className="h-6 w-6 animate-spin text-green-600 motion-reduce:animate-none" aria-hidden="true" />
            <p>Checking your session and loading the roster…</p>
          </section>
        )}

        {(state.kind === "error" || state.kind === "denied") && (
          <section className="glass p-6 sm:p-8" role="alert">
            <h2 className="text-2xl">{state.kind === "denied" ? "Access denied" : "Roster unavailable"}</h2>
            <p className="mt-3 mb-6">{state.message}</p>
            <Button onClick={refresh} className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
            </Button>
          </section>
        )}

        {state.kind === "ready" && <RosterData state={state} onSelectWeek={selectWeek} onRefresh={refresh} />}
      </div>
    </main>
  );
}

function RosterData({ state, onSelectWeek, onRefresh }: {
  state: Extract<ViewState, { kind: "ready" }>;
  onSelectWeek: (weekStart: string) => void;
  onRefresh: () => void;
}) {
  const { catalog, assignments, hours, audit, range } = state;
  const weekStart = range.from.slice(0, 10);
  const lastDay = new Date(Date.parse(range.to) - 1000);
  const routeById = new Map(catalog.routes.map((route) => [route.route_id, route]));
  const truckById = new Map(catalog.trucks.map((truck) => [truck.truck_id, truck]));
  const staffById = new Map([...catalog.drivers, ...catalog.assistants].map((staff) => [staff.staff_id, staff]));

  return (
    <>
      {catalog.meta.data_source === "dev-memory" && <aside className="glass mb-8 flex items-start gap-3 p-6" aria-label="Development data notice">
        <Info className="mt-1 h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
        <div>
          <p className="font-semibold text-text-heading">Development data · {catalog.meta.data_source}</p>
          <p className="mt-1 text-sm">This is a demonstration roster. Data resets when the backend restarts.
            {" "}The {catalog.meta.policy_id} rules are provisional and have not been confirmed for operational use.</p>
        </div>
      </aside>}

      {canAssignRoster(state.session.role) && catalog.meta.data_source === "mysql" && (
        <AssignmentForm catalog={catalog} onCreated={onRefresh} />
      )}
      {canAssignRoster(state.session.role) && catalog.meta.data_source === "dev-memory" && (
        <aside className="glass mb-8 p-6" aria-label="Assignment creation availability">
          <p className="font-semibold text-text-heading">Assignment creation needs the roster database</p>
          <p className="mt-1 text-sm">Development roster data is read-only and resets when the backend restarts.</p>
        </aside>
      )}

      <section aria-labelledby="schedule-title" className="mb-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="schedule-title" className="text-[clamp(1.5rem,3vw,2rem)]">Delivery schedule</h2>
            <p className="mt-2 text-sm">{dateFormat.format(new Date(range.from))} – {dateFormat.format(lastDay)} · Sri Lanka time (Asia/Colombo)</p>
            {catalog.meta.data_source === "dev-memory" && (
              <p className="mt-1 text-sm">Showing the fixed demonstration week supplied by the server.</p>
            )}
          </div>
          <p className="text-sm tabular-nums">{assignments.length} {assignments.length === 1 ? "assignment" : "assignments"}</p>
        </div>

        {catalog.meta.data_source === "mysql" && (
          <nav aria-label="Schedule week" className="mb-5 flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => onSelectWeek(shiftRosterWeek(weekStart, -1))} className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous week
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onSelectWeek(currentColomboWeek())} className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600">
              <CalendarDays className="h-4 w-4" aria-hidden="true" /> Current week
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onSelectWeek(shiftRosterWeek(weekStart, 1))} className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600">
              Next week <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </nav>
        )}

        {assignments.length === 0 ? (
          <div className="glass p-8" role="status">
            <CalendarDays className="mb-4 h-6 w-6 text-green-700" aria-hidden="true" />
            <h3 className="text-xl">No assignments this week</h3>
            <p className="mt-2">The roster service returned no delivery schedules for this date range.</p>
          </div>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2" aria-label="Delivery assignments">
            {assignments.map((assignment) => (
              <li key={assignment.roster_id} className="glass p-6">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 text-sm text-text-muted">Assignment #{assignment.roster_id}</p>
                    <h3 className="text-xl">{routeById.get(assignment.route_id)?.route_name ?? `Route #${assignment.route_id}`}</h3>
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                    {assignment.status.toLowerCase().replaceAll("_", " ")}
                  </span>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <dt className="text-text-muted">Starts</dt>
                  <dd className="text-right tabular-nums"><time dateTime={assignment.start_time}>{timeFormat.format(new Date(assignment.start_time))}</time></dd>
                  <dt className="text-text-muted">Ends</dt>
                  <dd className="text-right tabular-nums"><time dateTime={assignment.end_time}>{timeFormat.format(new Date(assignment.end_time))}</time></dd>
                  <dt className="text-text-muted">Duration</dt><dd className="text-right">{durationLabel(assignment.duration_seconds)}</dd>
                  <dt className="text-text-muted">Truck</dt><dd className="text-right">{truckById.get(assignment.truck_id)?.plate_number ?? `Truck #${assignment.truck_id}`}</dd>
                  <dt className="text-text-muted">Driver</dt><dd className="text-right">{staffById.get(assignment.driver_id)?.name ?? `Staff #${assignment.driver_id}`}</dd>
                  <dt className="text-text-muted">Assistant</dt><dd className="text-right">{staffById.get(assignment.assistant_id)?.name ?? `Staff #${assignment.assistant_id}`}</dd>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <WeeklyHours state={hours} staff={[...catalog.drivers, ...catalog.assistants]} />

      <AttemptHistory state={audit} />

      <section aria-labelledby="catalog-title">
        <h2 id="catalog-title" className="text-[clamp(1.5rem,3vw,2rem)]">Roster resources</h2>
        <p className="mt-2 mb-5 text-sm">Catalog entries do not guarantee availability for a delivery.</p>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <CatalogCard title="Routes" icon="routes" items={catalog.routes.map((route) => ({ id: route.route_id, name: route.route_name, detail: `Maximum ${durationLabel(route.max_duration_seconds)}` }))} />
          <CatalogCard title="Trucks" icon="trucks" items={catalog.trucks.map((truck) => ({ id: truck.truck_id, name: truck.plate_number, detail: truck.is_active ? "Active" : "Inactive" }))} />
          <CatalogCard title="Drivers" icon="staff" items={catalog.drivers.map((staff) => ({ id: staff.staff_id, name: staff.name }))} />
          <CatalogCard title="Assistants" icon="staff" items={catalog.assistants.map((staff) => ({ id: staff.staff_id, name: staff.name }))} />
        </div>
      </section>
    </>
  );
}

function CatalogCard({ title, icon, items }: {
  title: string;
  icon: "routes" | "trucks" | "staff";
  items: { id: number; name: string; detail?: string }[];
}) {
  const Icon = icon === "trucks" ? Truck : icon === "staff" ? Users : CalendarDays;
  return (
    <div className="glass p-6">
      <Icon className="mb-4 h-6 w-6 text-green-700" aria-hidden="true" />
      <h3 className="text-xl">{title} <span className="text-sm font-normal text-text-muted">({items.length})</span></h3>
      {items.length === 0 ? <p className="mt-4 text-sm">No {title.toLowerCase()} in the catalog.</p> : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="text-sm">
              <p className="font-medium text-text-heading">{item.name}</p>
              {item.detail && <p className="text-xs text-text-muted">{item.detail}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
