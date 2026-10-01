import type { Metadata } from "next";
import RosterOverview from "@/components/roster/RosterOverview";

export const metadata: Metadata = {
  title: "Truck roster",
  robots: { index: false, follow: false },
};

export default function RosterPage() {
  return <RosterOverview />;
}
