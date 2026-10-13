import type { Metadata } from "next";
import RailManagement from "@/components/rail/RailManagement";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "Rail Capacity & Allocation | Kandypack Logistics",
  description: "Schedule train trips, allocate freight wagon capacity, and monitor multi-trip cargo spillover across Sri Lanka Railways mainline.",
};

export default function RailPage() {
  return (
    <DashboardLayout activeKey="rail" hideHeader roleOverride="LOGISTICS_MGR" hubName="Rail Operations">
      <RailManagement initialTab="trips" />
    </DashboardLayout>
  );
}
