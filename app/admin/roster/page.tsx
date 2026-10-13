import type { Metadata } from "next";
import RosterOverview from "@/components/roster/RosterOverview";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "Truck roster",
  robots: { index: false, follow: false },
};

export default function RosterPage() {
  return (
    <DashboardLayout activeKey="roster" hideHeader roleOverride="DISPATCHER" hubName="Driver Roster">
      <RosterOverview />
    </DashboardLayout>
  );
}
