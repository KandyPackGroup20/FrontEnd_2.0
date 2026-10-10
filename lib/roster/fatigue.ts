export function fatigue(scheduled: number, limit: number) {
  if (scheduled > limit) return { label: "Limit exceeded", className: "bg-red-100 text-red-800" };
  if (scheduled * 10 >= limit * 9) return { label: "Fatigue warning", className: "bg-yellow-100 text-yellow-900" };
  return { label: "Within limit", className: "bg-green-100 text-green-800" };
}
