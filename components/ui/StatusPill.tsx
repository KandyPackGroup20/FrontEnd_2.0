type Status = "pending" | "transit" | "delivered" | "issue";

interface StatusPillProps {
  status: Status;
  label?: string;
  className?: string;
}

const statusLabels: Record<Status, string> = {
  pending: "Pending",
  transit: "In Transit",
  delivered: "Delivered",
  issue: "Issue",
};

const statusClasses: Record<Status, string> = {
  pending: "status-pill-pending",
  transit: "status-pill-transit",
  delivered: "status-pill-delivered",
  issue: "status-pill-issue",
};

export default function StatusPill({
  status,
  label,
  className = "",
}: StatusPillProps) {
  return (
    <span className={`status-pill ${statusClasses[status]} ${className}`}>
      <span className="status-dot" aria-hidden="true" />
      {label ?? statusLabels[status]}
    </span>
  );
}
