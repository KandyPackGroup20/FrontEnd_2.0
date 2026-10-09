import type { Metadata } from "next";
import RailManagement from "@/components/rail/RailManagement";

export const metadata: Metadata = {
  title: "Train Trips | Kandypack Rail Management",
};

export default function TripsPage() {
  return <RailManagement initialTab="trips" />;
}
