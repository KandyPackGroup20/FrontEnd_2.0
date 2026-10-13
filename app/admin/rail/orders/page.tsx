import type { Metadata } from "next";
import RailManagement from "@/components/rail/RailManagement";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "Pending Rail Orders | Kandypack Rail Management",
};

export default function PendingOrdersPage() {
  return (
    <DashboardLayout activeKey="orders" hideHeader roleOverride="LOGISTICS_MGR" hubName="Rail Operations">
      <RailManagement initialTab="pending" />
    </DashboardLayout>
  );
}

