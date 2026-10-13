import type { Metadata } from "next";
import RailManagement from "@/components/rail/RailManagement";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "Order Allocation Breakdown | Kandypack Rail Management",
};

export default function BreakdownPage() {
  return (
    <DashboardLayout activeKey="breakdown" hideHeader roleOverride="LOGISTICS_MGR" hubName="Rail Operations">
      <RailManagement initialTab="breakdown" />
    </DashboardLayout>
  );
}

