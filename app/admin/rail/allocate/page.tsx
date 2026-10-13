import type { Metadata } from "next";
import RailManagement from "@/components/rail/RailManagement";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "Allocate Rail Capacity | Kandypack Rail Management",
};

export default function AllocatePage() {
  return (
    <DashboardLayout activeKey="allocate" hideHeader roleOverride="LOGISTICS_MGR" hubName="Rail Operations">
      <RailManagement initialTab="pending" />
    </DashboardLayout>
  );
}

