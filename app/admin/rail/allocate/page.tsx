import type { Metadata } from "next";
import RailManagement from "@/components/rail/RailManagement";

export const metadata: Metadata = {
  title: "Allocate Rail Capacity | Kandypack Rail Management",
};

export default function AllocatePage() {
  return <RailManagement initialTab="pending" />;
}
