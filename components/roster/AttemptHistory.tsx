"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, ClipboardClock, Loader2, Search, ChevronLeft, ChevronRight, CheckCircle2, History } from "lucide-react";
import type { RosterAudit } from "@/lib/roster/types";
import type { ReportState } from "@/components/roster/WeeklyHours";

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function timeValue(value: string | null): React.ReactNode {
  return value ? <time dateTime={value}>{dateTimeFormat.format(new Date(value))}</time> : "Unavailable";
}

function idValue(label: string, value: number | null): string {
  return value === null ? "Unavailable" : `${label} #${value}`;
}

export default function AttemptHistory({ state }: { state: ReportState<RosterAudit> }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const attempts = state.kind === "ready" ? state.data.attempts : [];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return attempts;
    const q = searchQuery.toLowerCase();
    return attempts.filter((attempt) => {
      const matchRoute = attempt.route_name?.toLowerCase().includes(q);
      const matchStation = attempt.station_name?.toLowerCase().includes(q);
      const matchPlate = attempt.plate_number?.toLowerCase().includes(q);
      const matchDriver = attempt.driver_name?.toLowerCase().includes(q);
      const matchAssistant = attempt.assistant_name?.toLowerCase().includes(q);
      const matchActor = attempt.actor_name?.toLowerCase().includes(q);
      const matchId = String(attempt.audit_id).includes(q) || String(attempt.assignment_id).includes(q);
      return matchRoute || matchStation || matchPlate || matchDriver || matchAssistant || matchActor || matchId;
    });
  }, [attempts, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedAttempts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, filtered.length);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  return (
    <section aria-labelledby="attempt-history-title" className="mb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="attempt-history-title" className="text-[clamp(1.5rem,3vw,2rem)]">Accepted assignment history</h2>
          <p className="mt-1 text-sm text-text-muted">
            Audited history of approved truck roster schedules, driver pairings, and dispatched delivery assignments.
          </p>
        </div>
      </div>

      {state.kind === "loading" && (
        <div className="glass flex min-h-32 items-center justify-center gap-3 p-8 rounded-2xl border border-slate-200/80" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-green-600 motion-reduce:animate-none" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-700">Loading accepted assignment history from database…</p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="glass p-6 rounded-2xl border border-red-200 bg-red-50/50" role="alert">
          <AlertTriangle className="mb-3 h-6 w-6 text-red-600" aria-hidden="true" />
          <h3 className="text-lg font-bold text-red-900">Accepted assignment history unavailable</h3>
          <p className="mt-2 text-sm text-red-800">{state.message}</p>
        </div>
      )}

      {state.kind === "ready" && attempts.length === 0 && (
        <div className="glass p-8 text-center rounded-2xl border border-slate-200/80" role="status">
          <ClipboardClock className="mx-auto mb-3 h-8 w-8 text-green-700" aria-hidden="true" />
          <h3 className="text-lg font-bold text-text-heading">No accepted assignments recorded</h3>
          <p className="mt-1 text-sm text-text-muted">Once dispatchers approve and create delivery runs, they will appear here.</p>
        </div>
      )}

      {state.kind === "ready" && attempts.length > 0 && (
        <>
          {/* Search & Filter Toolbar */}
          <div className="glass p-5 rounded-2xl mb-6 border border-slate-200/80">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">Records logged:</span>
                <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-800 font-bold border border-green-200/60">
                  {attempts.length} total
                </span>
                {filtered.length !== attempts.length && (
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {filtered.length} matched
                  </span>
                )}
              </div>

              <div className="relative min-w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by driver, route, truck, station..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-600/30 bg-white"
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="glass p-8 text-center rounded-2xl border border-slate-200/80" role="status">
              <History className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <h3 className="text-base font-bold text-text-heading">No records match your search</h3>
              <p className="mt-1 text-xs text-text-muted">
                No assignments match "{searchQuery}". Try a different keyword or staff name.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-1.5 rounded-lg bg-green-50 text-green-800 text-xs font-semibold hover:bg-green-100 cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <ol className="grid gap-4 lg:grid-cols-2" aria-label="Accepted assignments">
              {pagedAttempts.map((attempt) => (
                <li key={attempt.audit_id} className="glass p-6 rounded-2xl border border-slate-200/80 hover:shadow-sm transition-shadow">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-muted">Audit Record #{attempt.audit_id}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-green-700">{idValue("Assignment", attempt.assignment_id)}</span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-text-heading">
                        {attempt.route_name ?? idValue("Route", attempt.attempted_route_id)}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>{attempt.outcome.toLowerCase().replaceAll("_", " ")}</span>
                    </span>
                  </div>

                  <dl className="grid gap-3 text-xs sm:grid-cols-2 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <dt className="text-text-muted font-medium">Station Hub</dt>
                      <dd className="mt-0.5 text-text-heading font-semibold">{attempt.station_name ?? idValue("Station", attempt.station_id ?? null)}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted font-medium">Assigned Truck</dt>
                      <dd className="mt-0.5 text-text-heading font-semibold">{attempt.plate_number ?? idValue("Truck", attempt.attempted_truck_id)}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted font-medium">Lead Driver</dt>
                      <dd className="mt-0.5 text-text-heading font-semibold">{attempt.driver_name ?? idValue("Staff", attempt.attempted_driver_id)}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted font-medium">Crew Assistant</dt>
                      <dd className="mt-0.5 text-text-heading font-semibold">{attempt.assistant_name ?? idValue("Staff", attempt.attempted_assistant_id)}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted font-medium">Dispatcher Actor</dt>
                      <dd className="mt-0.5 text-text-heading font-semibold">{attempt.actor_name ?? `User #${attempt.actor_id}`}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted font-medium">Approval Timestamp</dt>
                      <dd className="mt-0.5 text-text-heading font-semibold tabular-nums">{timeValue(attempt.occurred_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted font-medium">Run Start</dt>
                      <dd className="mt-0.5 text-text-heading tabular-nums">{timeValue(attempt.attempted_start_time)}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted font-medium">Run End</dt>
                      <dd className="mt-0.5 text-text-heading tabular-nums">{timeValue(attempt.attempted_end_time)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          )}

          {/* Pagination Toolbar */}
          {filtered.length > pageSize && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 p-4 glass rounded-2xl border border-slate-200/80 text-xs">
              <p className="text-slate-600 font-medium">
                Showing <strong className="text-slate-900">{startIdx}</strong> to{" "}
                <strong className="text-slate-900">{endIdx}</strong> of{" "}
                <strong className="text-slate-900">{filtered.length}</strong> audit records
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        currentPage === num
                          ? "bg-green-700 text-white shadow-xs"
                          : "hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
