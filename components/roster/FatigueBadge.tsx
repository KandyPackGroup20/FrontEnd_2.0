import { fatigue } from "@/lib/roster/fatigue";

export default function FatigueBadge({ seconds, limit }: { seconds: number; limit: number }) {
  const badge = fatigue(seconds, limit);
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>;
}
