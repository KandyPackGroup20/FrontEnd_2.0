"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  Layers,
  Loader2,
  RefreshCw,
  Truck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import GradientBlobs from "@/components/ui/GradientBlobs";
import DeliveryDemand from "@/components/roster/DeliveryDemand";
import AttemptHistory from "@/components/roster/AttemptHistory";
import WeeklyHours from "@/components/roster/WeeklyHours";
import RosterResources from "@/components/roster/RosterResources";
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
  RosterAssignment,
  RosterAudit,
  RosterCandidates,
  RosterHours,
  RosterMetadata,
  RosterSession,
} from "@/lib/roster/types";

export type RosterTabKey = "planning" | "hours" | "history" | "resources";

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
  timeZone: "Asia/Colombo",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function durationLabel(seconds: number): string {
  return `${Number((seconds / 3600).toFixed(2))} h`;
}

async function reportState<T>(request: Promise<T>): Promise<ReportState<T>> {
  try {
    return { kind: "ready", data: await request };
  } catch (error: unknown) {
    if (
      error instanceof RosterApiError &&
      (error.status === 401 || (error.status === 403 && error.code === "PASSWORD_RESET_REQUIRED"))
    ) {
      throw error;
    }
    return {
      kind: "error",
      message:
        error instanceof RosterApiError
          ? error.message
          : "The reporting service could not be reached. Check your connection and retry.",
    };
  }
}

export default function RosterOverview({
  activeTab: controlledTab,
  onTabChange,
}: {
  activeTab?: RosterTabKey;
  onTabChange?: (tab: RosterTabKey) => void;
}) {
  const router = useRouter();
  const [internalTab, setInternalTab] = useState<RosterTabKey>("planning");
  const currentTab = controlledTab ?? internalTab;

  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [displayWeek, setDisplayWeek] = useState(currentColomboWeek);
  const [selection, setSelection] = useState<{
    weekStart: string;
    dataSource: RosterMetadata["data_source"];
  } | null>(null);

  // Cache data across tabs to protect database performance and avoid repeated heavy queries
  const catalogCache = useRef<RosterCandidates | null>(null);
  const sessionCache = useRef<RosterSession | null>(null);
  const assignmentsCache = useRef<Record<string, RosterAssignment[]>>({});
  const hoursCache = useRef<Record<string, ReportState<RosterHours>>>({});
  const auditCache = useRef<ReportState<RosterAudit> | null>(null);

  const handleTabSelect = (tab: RosterTabKey) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.pushState({}, "", url.toString());
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        // 1. Check or load session
        let session = sessionCache.current;
        if (!session) {
          session = await getRosterSession(signal);
          if (signal.aborted) return;
          if (session.force_password_reset) {
            router.replace("/profile?force_reset=true");
            return;
          }
          if (!canReadRoster(session.role)) {
            setState({ kind: "denied", message: "Your account does not have access to the truck roster." });
            return;
          }
          sessionCache.current = session;
        }

        // 2. Load or reuse candidate catalog
        let catalog = catalogCache.current;
        if (!catalog) {
          catalog = await getRosterCandidates(signal);
          if (signal.aborted) return;
          catalogCache.current = catalog;
        }

        const weekStart =
          selection?.dataSource === catalog.meta.data_source
            ? selection.weekStart
            : initialRosterWeek(catalog.meta);
        const range = rosterWeekRange(weekStart);
        setDisplayWeek(weekStart);

        // 3. Lazy, on-demand data fetching based strictly on the active tab (DB Performance Optimization)
        let assignments: RosterAssignment[] = assignmentsCache.current[weekStart] || [];
        let hours: ReportState<RosterHours> = hoursCache.current[weekStart] || { kind: "loading" };
        let audit: ReportState<RosterAudit> = auditCache.current || { kind: "loading" };

        if (currentTab === "planning") {
          if (!assignmentsCache.current[weekStart]) {
            const result = await getRosterAssignments(range, signal);
            if (signal.aborted) return;
            if (!sameRosterMetadata(result.meta, catalog.meta)) {
              throw new RosterApiError("The roster data changed while loading. Please refresh.", 502);
            }
            assignments = result.assignments;
            assignmentsCache.current[weekStart] = assignments;
          }
        } else if (currentTab === "hours") {
          if (!hoursCache.current[weekStart] || hoursCache.current[weekStart].kind !== "ready") {
            hours = await reportState(getRosterHours(weekStart, signal));
            if (signal.aborted) return;
            hoursCache.current[weekStart] = hours;
          }
        } else if (currentTab === "history") {
          if (!auditCache.current || auditCache.current.kind !== "ready") {
            audit = await reportState(getRosterAudit(signal, 50));
            if (signal.aborted) return;
            auditCache.current = audit;
          }
        }

        setState({
          kind: "ready",
          session,
          catalog,
          assignments,
          hours,
          audit,
          range,
        });
      } catch (error: unknown) {
        if (signal.aborted) return;
        if (error instanceof RosterApiError) {
          if (error.status === 401) {
            router.replace("/?redirect=/admin/roster");
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
          message:
            error instanceof RosterApiError
              ? error.message
              : "We could not reach the roster service. Check your connection and retry.",
        });
      }
    }

    void load();
    return () => controller.abort();
  }, [router, attempt, selection, currentTab]);

  function refresh() {
    assignmentsCache.current = {};
    hoursCache.current = {};
    auditCache.current = null;
    catalogCache.current = null;
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
          <Button
            href="/profile"
            variant="secondary"
            size="sm"
            className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to profile
          </Button>
          <span className="caption">Kandypack / Dispatcher Operations</span>
        </nav>

        <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-green-700">Dispatcher Portal</p>
            <h1 className="text-[clamp(2.25rem,5vw,3.75rem)]">Truck fleet roster</h1>
          </div>
          {state.kind === "ready" && (
            <Button
              variant="secondary"
              onClick={refresh}
              className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh roster
            </Button>
          )}
        </header>

        {/* Dispatcher Portal Tabs Bar */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 border-b border-slate-200/80">
          <button
            onClick={() => handleTabSelect("planning")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === "planning"
                ? "bg-green-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Fleet Roster Planning</span>
          </button>
          <button
            onClick={() => handleTabSelect("hours")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === "hours"
                ? "bg-green-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Weekly Staff Hours</span>
          </button>
          <button
            onClick={() => handleTabSelect("history")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === "history"
                ? "bg-green-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Accepted Assignment History</span>
          </button>
          <button
            onClick={() => handleTabSelect("resources")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === "resources"
                ? "bg-green-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Roster Resources</span>
          </button>
        </div>

        {/* Schedule Week Bar (Shown on Planning and Weekly Hours tabs) */}
        {(currentTab === "planning" || currentTab === "hours") && (
          <nav aria-label="Schedule week" className="mb-6 flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={state.kind !== "ready"}
              onClick={() => selectWeek(shiftRosterWeek(displayWeek, -1))}
              className="min-h-11 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous week
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={state.kind !== "ready"}
              onClick={() => selectWeek(currentColomboWeek())}
              className="min-h-11 cursor-pointer"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" /> Current week
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={state.kind !== "ready"}
              onClick={() => selectWeek(shiftRosterWeek(displayWeek, 1))}
              className="min-h-11 cursor-pointer"
            >
              Next week <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <p className="text-sm tabular-nums text-slate-700">
              {dateFormat.format(new Date(rosterWeekRange(displayWeek).from))} –{" "}
              {dateFormat.format(new Date(Date.parse(rosterWeekRange(displayWeek).to) - 1000))} · Sri Lanka time
            </p>
          </nav>
        )}

        {state.kind === "loading" && (
          <section
            className="glass flex min-h-48 items-center justify-center gap-3 p-8 rounded-2xl"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-6 w-6 animate-spin text-green-600 motion-reduce:animate-none" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700">Loading roster portal…</p>
          </section>
        )}

        {(state.kind === "error" || state.kind === "denied") && (
          <section className="glass p-6 sm:p-8 rounded-2xl" role="alert">
            <h2 className="text-2xl font-bold text-text-heading">
              {state.kind === "denied" ? "Access denied" : "Roster unavailable"}
            </h2>
            <p className="mt-3 mb-6 text-sm text-text-muted">{state.message}</p>
            <Button
              onClick={refresh}
              className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
            </Button>
          </section>
        )}

        {state.kind === "ready" && (
          <RosterData state={state} activeTab={currentTab} onRefresh={refresh} />
        )}
      </div>
    </main>
  );
}

function RosterData({
  state,
  activeTab,
  onRefresh,
}: {
  state: Extract<ViewState, { kind: "ready" }>;
  activeTab: RosterTabKey;
  onRefresh: () => void;
}) {
  const { catalog, assignments, hours, audit, range } = state;
  const lastDay = new Date(Date.parse(range.to) - 1000);
  const routeById = new Map(catalog.routes.map((route) => [route.route_id, route]));
  const truckById = new Map(catalog.trucks.map((truck) => [truck.truck_id, truck]));
  const staffById = new Map([...catalog.drivers, ...catalog.assistants].map((staff) => [staff.staff_id, staff]));

  return (
    <>
      {/* ── TAB 1: FLEET ROSTER PLANNING ── */}
      {activeTab === "planning" && (
        <>
          {catalog.meta.data_source === "dev-memory" && (
            <aside className="glass mb-6 p-6 rounded-2xl" aria-label="Sample roster notice">
              <p className="font-semibold text-text-heading">Sample roster</p>
            </aside>
          )}

          {catalog.meta.data_source === "mysql" && (
            <DeliveryDemand
              catalog={catalog}
              range={range}
              writable={canAssignRoster(state.session.role)}
              onCreated={onRefresh}
            />
          )}

          {canAssignRoster(state.session.role) && catalog.meta.data_source === "dev-memory" && (
            <aside className="glass mb-8 p-6 rounded-2xl" aria-label="Assignment creation availability">
              <p className="font-semibold text-text-heading">
                Assignments unavailable while the live roster is disconnected.
              </p>
            </aside>
          )}

          {catalog.meta.data_source === "dev-memory" && (
            <section aria-labelledby="schedule-title" className="mb-12">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="schedule-title" className="text-[clamp(1.5rem,3vw,2rem)]">Delivery schedule</h2>
                  <p className="mt-2 text-sm text-text-muted">
                    {dateFormat.format(new Date(range.from))} – {dateFormat.format(lastDay)} · Sri Lanka time (Asia/Colombo)
                  </p>
                </div>
                <p className="text-sm tabular-nums text-slate-700">
                  {assignments.length} {assignments.length === 1 ? "assignment" : "assignments"}
                </p>
              </div>

              {assignments.length === 0 ? (
                <div className="glass p-8 rounded-2xl" role="status">
                  <CalendarDays className="mb-4 h-6 w-6 text-green-700" aria-hidden="true" />
                  <h3 className="text-xl font-bold">No assignments this week</h3>
                </div>
              ) : (
                <ul className="grid gap-5 md:grid-cols-2" aria-label="Delivery assignments">
                  {assignments.map((assignment) => (
                    <li key={assignment.roster_id} className="glass p-6 rounded-2xl">
                      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="mb-1 text-sm text-text-muted">Assignment #{assignment.roster_id}</p>
                          <h3 className="text-xl font-bold">
                            {routeById.get(assignment.route_id)?.route_name ?? `Route #${assignment.route_id}`}
                          </h3>
                        </div>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                          {assignment.status.toLowerCase().replaceAll("_", " ")}
                        </span>
                      </div>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                        <dt className="text-text-muted">Starts</dt>
                        <dd className="text-right tabular-nums">
                          <time dateTime={assignment.start_time}>{timeFormat.format(new Date(assignment.start_time))}</time>
                        </dd>
                        <dt className="text-text-muted">Ends</dt>
                        <dd className="text-right tabular-nums">
                          <time dateTime={assignment.end_time}>{timeFormat.format(new Date(assignment.end_time))}</time>
                        </dd>
                        <dt className="text-text-muted">Duration</dt>
                        <dd className="text-right">{durationLabel(assignment.duration_seconds)}</dd>
                        <dt className="text-text-muted">Truck</dt>
                        <dd className="text-right">
                          {truckById.get(assignment.truck_id)?.plate_number ?? `Truck #${assignment.truck_id}`}
                        </dd>
                        <dt className="text-text-muted">Driver</dt>
                        <dd className="text-right">
                          {staffById.get(assignment.driver_id)?.name ?? `Staff #${assignment.driver_id}`}
                        </dd>
                        <dt className="text-text-muted">Assistant</dt>
                        <dd className="text-right">
                          {staffById.get(assignment.assistant_id)?.name ?? `Staff #${assignment.assistant_id}`}
                        </dd>
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      {/* ── TAB 2: WEEKLY STAFF HOURS (PAGINATED) ── */}
      {activeTab === "hours" && (
        <WeeklyHours state={hours} staff={[...catalog.drivers, ...catalog.assistants]} />
      )}

      {/* ── TAB 3: ACCEPTED ASSIGNMENT HISTORY (PAGINATED) ── */}
      {activeTab === "history" && (
        <AttemptHistory state={audit} />
      )}

      {/* ── TAB 4: ROSTER RESOURCES (PAGINATED) ── */}
      {activeTab === "resources" && (
        <RosterResources catalog={catalog} />
      )}
    </>
  );
}
