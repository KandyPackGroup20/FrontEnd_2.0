import type { Metadata } from "next";
import RailManagement from "@/components/rail/RailManagement";

export const metadata: Metadata = {
  title: "Pending Rail Orders | Kandypack Rail Management",
};

export default function PendingOrdersPage() {
  return <RailManagement initialTab="pending" />;
}
