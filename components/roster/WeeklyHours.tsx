"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Clock3, Loader2, Search, ChevronLeft, ChevronRight, UserCheck, AlertCircle } from "lucide-react";
import type { RosterHours, RosterStaff } from "@/lib/roster/types";

export type ReportState<T> =
  | { kind: "loading" }
  | { kind: "ready"; data: T }
  | { kind: "error"; message: string };

function hoursLabel(seconds: number): string {
  return `${Number((Math.abs(seconds) / 3600).toFixed(2))} h`;
}

export default function WeeklyHours({
  state,
  staff,
}: {
  state: ReportState<RosterHours>;
  staff: RosterStaff[];
}) {
  const [roleFilter, setRoleFilter] = useState<"ALL" | "DRIVER" | "ASSISTANT">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WITHIN" | "EXCEEDED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const staffById = useMemo(() => new Map(staff.map((person) => [person.staff_id, person])), [staff]);

  const rawHours = state.kind === "ready" ? state.data.hours : [];

  const filtered = useMemo(() => {
    return rawHours.filter((row) => {
      // Role filter
      if (roleFilter !== "ALL" && row.staff_type !== roleFilter) return false;

      // Status filter
      const exceeded = row.remaining_seconds < 0;
      if (statusFilter === "EXCEEDED" && !exceeded) return false;
      if (statusFilter === "WITHIN" && exceeded) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const resolvedName = row.staff_name || staffById.get(row.staff_id)?.name || `Staff #${row.staff_id}`;
      return resolvedName.toLowerCase().includes(q) || String(row.staff_id).includes(q);
    });
  }, [rawHours, roleFilter, statusFilter, searchQuery, staffById]);

  // Overall metric counters
  const totalWithin = useMemo(() => rawHours.filter((r) => r.remaining_seconds >= 0).length, [rawHours]);
  const totalExceeded = useMemo(() => rawHours.filter((r) => r.remaining_seconds < 0).length, [rawHours]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedHours = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, filtered.length);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleRoleChange = (role: "ALL" | "DRIVER" | "ASSISTANT") => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleStatusChange = (status: "ALL" | "WITHIN" | "EXCEEDED") => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <section aria-labelledby="weekly-hours-title" className="mb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="weekly-hours-title" className="text-[clamp(1.5rem,3vw,2rem)]">Weekly staff hours</h2>
          <p className="mt-1 text-sm text-text-muted">
            Monitored weekly duty hours per driver and assistant against Sri Lanka transport labor regulations (40-hour weekly ceiling).
          </p>
        </div>
      </div>

      {state.kind === "loading" && (
        <div className="glass flex min-h-32 items-center justify-center gap-3 p-8 rounded-2xl border border-slate-200/80" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-green-600 motion-reduce:animate-none" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-700">Aggregating weekly shift hours from roster duty intervals…</p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="glass p-6 rounded-2xl border border-red-200 bg-red-50/50" role="alert">
          <AlertTriangle className="mb-3 h-6 w-6 text-red-600" aria-hidden="true" />
          <h3 className="text-lg font-bold text-red-900">Weekly hours unavailable</h3>
          <p className="mt-2 text-sm text-red-800">{state.message}</p>
        </div>
      )}

      {state.kind === "ready" && rawHours.length === 0 && (
        <div className="glass p-8 text-center rounded-2xl border border-slate-200/80" role="status">
          <Clock3 className="mx-auto mb-3 h-8 w-8 text-green-700" aria-hidden="true" />
          <h3 className="text-lg font-bold text-text-heading">No staff shifts scheduled this week</h3>
          <p className="mt-1 text-sm text-text-muted">Assigned runs will automatically register duty hours under this calendar week.</p>
        </div>
      )}

      {state.kind === "ready" && rawHours.length > 0 && (
        <>
          {/* Stat Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="glass p-4 rounded-xl border border-slate-200/80">
              <span className="text-xs font-semibold text-text-muted block mb-1">Total Scheduled Staff</span>
              <p className="text-2xl font-bold text-text-heading">{rawHours.length}</p>
            </div>
            <div className="glass p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/30">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-1">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                Within Safe Hours Limit
              </span>
              <p className="text-2xl font-bold text-emerald-950">{totalWithin}</p>
            </div>
            <div className="glass p-4 rounded-xl border border-amber-200/80 bg-amber-50/30">
              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Overtime Ceiling Exceeded
              </span>
              <p className="text-2xl font-bold text-amber-950">{totalExceeded}</p>
            </div>
          </div>

          {/* Filtering and Search Toolbar */}
          <div className="glass p-5 rounded-2xl mb-6 border border-slate-200/80">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Role Pill Filters */}
                <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => handleRoleChange("ALL")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      roleFilter === "ALL" ? "bg-white text-slate-900 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All Staff
                  </button>
                  <button
                    onClick={() => handleRoleChange("DRIVER")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      roleFilter === "DRIVER" ? "bg-white text-slate-900 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Drivers
                  </button>
                  <button
                    onClick={() => handleRoleChange("ASSISTANT")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      roleFilter === "ASSISTANT" ? "bg-white text-slate-900 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Assistants
                  </button>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => handleStatusChange("ALL")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      statusFilter === "ALL" ? "bg-white text-slate-900 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={() => handleStatusChange("WITHIN")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      statusFilter === "WITHIN" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Within Limit ({totalWithin})
                  </button>
                  <button
                    onClick={() => handleStatusChange("EXCEEDED")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      statusFilter === "EXCEEDED" ? "bg-red-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Over Limit ({totalExceeded})
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by staff name..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-600/30 bg-white"
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="glass p-8 text-center rounded-2xl border border-slate-200/80" role="status">
              <Clock3 className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <h3 className="text-base font-bold text-text-heading">No staff match your filter criteria</h3>
              <p className="mt-1 text-xs text-text-muted">
                Try resetting your filters or clearing the search query.
              </p>
              <button
                onClick={() => {
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-1.5 rounded-lg bg-green-50 text-green-800 text-xs font-semibold hover:bg-green-100 cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Selected-week staff hours">
              {pagedHours.map((row) => {
                const exceeded = row.remaining_seconds < 0;
                const resolvedName = row.staff_name ?? staffById.get(row.staff_id)?.name ?? `Staff #${row.staff_id}`;
                return (
                  <li
                    key={`${row.staff_id}-${row.staff_type}`}
                    className={`glass p-6 rounded-2xl border transition-shadow hover:shadow-sm ${
                      exceeded ? "border-red-200/90 bg-red-50/20" : "border-slate-200/80"
                    }`}
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-green-700 uppercase tracking-wider">
                          {row.staff_type === "DRIVER" ? "Heavy Truck Driver" : "Cargo Assistant"}
                        </span>
                        <h3 className="mt-0.5 text-lg font-bold text-text-heading">{resolvedName}</h3>
                        <p className="text-xs text-text-muted">Staff Record #{row.staff_id}</p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          exceeded
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {exceeded ? "Limit exceeded" : "Within limit"}
                      </span>
                    </div>

                    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-xs tabular-nums bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <dt className="text-text-muted font-medium">Scheduled Run Time</dt>
                      <dd className="font-semibold text-text-heading">{hoursLabel(row.scheduled_seconds)}</dd>
                      <dt className="text-text-muted font-medium">Statutory Weekly Ceiling</dt>
                      <dd className="font-semibold text-text-heading">{hoursLabel(row.limit_seconds)}</dd>
                      <dt className="text-text-muted font-medium">{exceeded ? "Overtime Excess" : "Available Capacity"}</dt>
                      <dd className={`font-bold ${exceeded ? "text-red-700" : "text-emerald-700"}`}>
                        {hoursLabel(row.remaining_seconds)}
                      </dd>
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination Toolbar */}
          {filtered.length > pageSize && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 p-4 glass rounded-2xl border border-slate-200/80 text-xs">
              <p className="text-slate-600 font-medium">
                Showing <strong className="text-slate-900">{startIdx}</strong> to{" "}
                <strong className="text-slate-900">{endIdx}</strong> of{" "}
                <strong className="text-slate-900">{filtered.length}</strong> staff members
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
