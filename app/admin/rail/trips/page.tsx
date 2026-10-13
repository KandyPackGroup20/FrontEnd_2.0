import type { Metadata } from "next";
import RailManagement from "@/components/rail/RailManagement";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "Train Trips | Kandypack Rail Management",
};

export default function TripsPage() {
  return (
    <DashboardLayout activeKey="trips" hideHeader roleOverride="LOGISTICS_MGR" hubName="Rail Schedules">
      <RailManagement initialTab="trips" />
    </DashboardLayout>
  );
}
