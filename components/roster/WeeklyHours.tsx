import { AlertTriangle, Clock3, Loader2 } from "lucide-react";
import type { RosterHours, RosterStaff } from "@/lib/roster/types";

export type ReportState<T> =
  | { kind: "loading" }
  | { kind: "ready"; data: T }
  | { kind: "error"; message: string };

function hoursLabel(seconds: number): string {
  return `${Number((Math.abs(seconds) / 3600).toFixed(2))} h`;
}

export default function WeeklyHours({ state, staff }: {
  state: ReportState<RosterHours>;
  staff: RosterStaff[];
}) {
  const staffById = new Map(staff.map((person) => [person.staff_id, person]));

  return (
    <section aria-labelledby="weekly-hours-title" className="mb-12">
      <div className="mb-5">
        <h2 id="weekly-hours-title" className="text-[clamp(1.5rem,3vw,2rem)]">Weekly staff hours</h2>
      </div>

      {state.kind === "loading" && (
        <div className="glass flex min-h-32 items-center justify-center gap-3 p-6" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-green-600 motion-reduce:animate-none" aria-hidden="true" />
          <p>Loading weekly hours…</p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="glass p-6" role="alert">
          <AlertTriangle className="mb-3 h-6 w-6 text-status-pending" aria-hidden="true" />
          <h3 className="text-lg">Weekly hours unavailable</h3>
          <p className="mt-2 text-sm">{state.message}</p>
        </div>
      )}

      {state.kind === "ready" && state.data.hours.length === 0 && (
        <div className="glass p-6" role="status">
          <Clock3 className="mb-3 h-6 w-6 text-green-700" aria-hidden="true" />
          <h3 className="text-lg">No staff to report this week</h3>
        </div>
      )}

      {state.kind === "ready" && state.data.hours.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Selected-week staff hours">
          {state.data.hours.map((row) => {
            const exceeded = row.remaining_seconds < 0;
            return (
              <li key={`${row.staff_id}-${row.staff_type}`} className="glass p-6">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-text-muted">{row.staff_type === "DRIVER" ? "Driver" : "Assistant"}</p>
                    <h3 className="mt-1 text-xl">{row.staff_name ?? staffById.get(row.staff_id)?.name ?? `Staff #${row.staff_id}`}</h3>
                  </div>
                  <span className={exceeded
                    ? "status-pill status-pill-issue"
                    : "status-pill status-pill-delivered"}>
                    {exceeded ? "Limit exceeded" : "Within limit"}
                  </span>
                </div>
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm tabular-nums">
                  <dt className="text-text-muted">Scheduled</dt><dd>{hoursLabel(row.scheduled_seconds)}</dd>
                  <dt className="text-text-muted">Weekly limit</dt><dd>{hoursLabel(row.limit_seconds)}</dd>
                  <dt className="text-text-muted">{exceeded ? "Over limit" : "Remaining"}</dt>
                  <dd className={exceeded ? "font-semibold text-status-issue" : "font-semibold text-green-800"}>
                    {hoursLabel(row.remaining_seconds)}
                  </dd>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
