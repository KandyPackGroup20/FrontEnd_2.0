import { AlertTriangle, ClipboardClock, Loader2 } from "lucide-react";
import type { RosterAudit } from "@/lib/roster/types";
import type { ReportState } from "@/components/roster/WeeklyHours";

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo", day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
});

function timeValue(value: string | null): React.ReactNode {
  return value ? <time dateTime={value}>{dateTimeFormat.format(new Date(value))}</time> : "Unavailable";
}

function idValue(label: string, value: number | null): string {
  return value === null ? "Unavailable" : `${label} #${value}`;
}

export default function AttemptHistory({ state }: { state: ReportState<RosterAudit> }) {
  return (
    <section aria-labelledby="attempt-history-title" className="mb-12">
      <div className="mb-5">
        <h2 id="attempt-history-title" className="text-[clamp(1.5rem,3vw,2rem)]">Accepted assignment history</h2>
      </div>

      {state.kind === "loading" && (
        <div className="glass flex min-h-32 items-center justify-center gap-3 p-6" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-green-600 motion-reduce:animate-none" aria-hidden="true" />
          <p>Loading accepted assignment history…</p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="glass p-6" role="alert">
          <AlertTriangle className="mb-3 h-6 w-6 text-status-pending" aria-hidden="true" />
          <h3 className="text-lg">Accepted assignment history unavailable</h3>
          <p className="mt-2 text-sm">{state.message}</p>
        </div>
      )}

      {state.kind === "ready" && state.data.attempts.length === 0 && (
        <div className="glass p-6" role="status">
          <ClipboardClock className="mb-3 h-6 w-6 text-green-700" aria-hidden="true" />
          <h3 className="text-lg">No accepted assignments recorded</h3>
        </div>
      )}

      {state.kind === "ready" && state.data.attempts.length > 0 && (
        <ol className="grid gap-4 lg:grid-cols-2" aria-label="Newest accepted assignments">
          {state.data.attempts.map((attempt) => {
            return (
              <li key={attempt.audit_id} className="glass p-6">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-text-muted">Audit record #{attempt.audit_id}</p>
                    <h3 className="mt-1 text-lg">{attempt.route_name ?? idValue("Route", attempt.attempted_route_id)}</h3>
                  </div>
                  <span className="status-pill status-pill-delivered">
                    {attempt.outcome.toLowerCase().replaceAll("_", " ")}
                  </span>
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-text-muted">Station</dt><dd className="mt-1 text-text-heading">{attempt.station_name ?? idValue("Station", attempt.station_id ?? null)}</dd></div>
                  <div><dt className="text-text-muted">Truck</dt><dd className="mt-1 text-text-heading">{attempt.plate_number ?? idValue("Truck", attempt.attempted_truck_id)}</dd></div>
                  <div><dt className="text-text-muted">Driver</dt><dd className="mt-1 text-text-heading">{attempt.driver_name ?? idValue("Staff", attempt.attempted_driver_id)}</dd></div>
                  <div><dt className="text-text-muted">Assistant</dt><dd className="mt-1 text-text-heading">{attempt.assistant_name ?? idValue("Staff", attempt.attempted_assistant_id)}</dd></div>
                  <div><dt className="text-text-muted">Dispatcher</dt><dd className="mt-1 text-text-heading">{attempt.actor_name ?? `User #${attempt.actor_id}`}</dd></div>
                  <div><dt className="text-text-muted">Scheduled start</dt><dd className="mt-1 text-text-heading tabular-nums">{timeValue(attempt.attempted_start_time)}</dd></div>
                  <div><dt className="text-text-muted">Scheduled end</dt><dd className="mt-1 text-text-heading tabular-nums">{timeValue(attempt.attempted_end_time)}</dd></div>
                  <div><dt className="text-text-muted">Accepted</dt><dd className="mt-1 text-text-heading tabular-nums">{timeValue(attempt.occurred_at)}</dd></div>
                  <div><dt className="text-text-muted">Assignment</dt><dd className="mt-1 text-text-heading">{idValue("Assignment", attempt.assignment_id)}</dd></div>
                </dl>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
