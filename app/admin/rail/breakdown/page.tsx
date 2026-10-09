import type { Metadata } from "next";
import RailManagement from "@/components/rail/RailManagement";

export const metadata: Metadata = {
  title: "Order Allocation Breakdown | Kandypack Rail Management",
};

export default function BreakdownPage() {
  return <RailManagement initialTab="breakdown" />;
}
