"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Train,
  Plus,
  Search,
  ArrowRight,
  Filter,
  Calendar,
  Package,
  MapPin,
} from "lucide-react";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import GradientBlobs from "@/components/ui/GradientBlobs";

type Status = "pending" | "transit" | "delivered" | "issue";

interface OrderItem {
  id: string;
  destination: string;
  hubStation: string;
  cargo: string;
  weight: string;
  date: string;
  status: Status;
  trainSlot: string;
  recipient: string;
  amount: number;
}

const MOCK_ORDERS: OrderItem[] = [
  {
    id: "KP-78291-CMB",
    destination: "Colombo",
    hubStation: "Colombo Fort Station",
    cargo: "Ceylon Tea Crates (Export grade)",
    weight: "120 kg",
    date: "2026-09-04",
    status: "transit",
    trainSlot: "06:30 AM Express Rail 101",
    recipient: "Lanka Freight Forwarders Ltd",
    amount: 3250,
  },
  {
    id: "KP-64102-GAL",
    destination: "Galle",
    hubStation: "Galle Central Hub",
    cargo: "Organic Spices & Vanilla",
    weight: "45 kg",
    date: "2026-09-03",
    status: "delivered",
    trainSlot: "11:15 AM Coastal Express",
    recipient: "Southern Spice Exporters",
    amount: 2100,
  },
  {
    id: "KP-59381-JAF",
    destination: "Jaffna",
    hubStation: "Jaffna Railway Hub",
    cargo: "Handicrafts & Brassware",
    weight: "80 kg",
    date: "2026-09-05",
    status: "pending",
    trainSlot: "09:00 PM Night Express 404",
    recipient: "Northern Trading Co.",
    amount: 3450,
  },
  {
    id: "KP-41908-NEG",
    destination: "Negombo",
    hubStation: "Negombo Hub",
    cargo: "Fresh Highland Vegetables",
    weight: "200 kg",
    date: "2026-09-02",
    status: "delivered",
    trainSlot: "06:30 AM Express Rail 101",
    recipient: "Airport Catering Services",
    amount: 4800,
  },
  {
    id: "KP-32115-MAT",
    destination: "Matara",
    hubStation: "Matara Railway Hub",
    cargo: "Textiles & Garments",
    weight: "150 kg",
    date: "2026-09-01",
    status: "delivered",
    trainSlot: "03:45 PM Mainline Freight 312",
    recipient: "Ruhuna Apparel Outlets",
    amount: 3850,
  },
  {
    id: "KP-28043-TRN",
    destination: "Trincomalee",
    hubStation: "Trincomalee Freight Hub",
    cargo: "Confectionery & Bakery Supplies",
    weight: "65 kg",
    date: "2026-08-30",
    status: "issue",
    trainSlot: "11:15 AM Intercity Rail 205",
    recipient: "Eastern Province Stores",
    amount: 2450,
  },
];

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.recipient.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ? true : order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="relative min-h-screen pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <GradientBlobs />

      {/* Top Header */}
      <div className="mx-auto max-w-6xl mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-text-heading no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
            <Train className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Kandypack</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" href="/order/new">
            <Plus className="h-4 w-4" />
            Book Shipment
          </Button>
          <Link
            href="/profile"
            className="text-sm font-medium text-text-muted hover:text-green-600 transition-colors"
          >
            Profile
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Page Title */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-heading">
              Shipment History
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Track and review all your rail freight consignments dispatched from Kandy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" href="/order/new">
              <Plus className="h-4 w-4" />
              New Consignment
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="glass p-4 rounded-2xl mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by ID, destination, cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 text-sm py-2"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All" },
              { id: "transit", label: "In Transit" },
              { id: "pending", label: "Pending" },
              { id: "delivered", label: "Delivered" },
              { id: "issue", label: "Issue" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-white/60 text-text-muted hover:bg-white hover:text-text-heading"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List / Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-green-600/50 mb-3" />
              <h3 className="font-bold text-text-heading mb-1">No consignments found</h3>
              <p className="text-sm text-text-muted mb-4">
                Try adjusting your search query or status filter.
              </p>
              <Button variant="secondary" size="sm" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-surface-glass-border bg-white/40 text-xs font-bold uppercase tracking-wider text-text-muted">
                      <th className="py-4 px-6">Tracking ID</th>
                      <th className="py-4 px-6">Route</th>
                      <th className="py-4 px-6">Cargo & Weight</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-glass-border text-sm">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-green-50/40 transition-colors"
                      >
                        <td className="py-4 px-6 font-mono font-semibold text-text-heading">
                          <Link
                            href={`/orders/${order.id}/track`}
                            className="hover:text-green-600 transition-colors"
                          >
                            {order.id}
                          </Link>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-text-heading">
                            Kandy → {order.destination}
                          </div>
                          <div className="text-xs text-text-muted">{order.hubStation}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-text-heading">{order.cargo}</div>
                          <div className="text-xs text-text-muted">{order.weight}</div>
                        </td>
                        <td className="py-4 px-6 text-text-muted">
                          <div>{order.date}</div>
                          <div className="text-xs">{order.trainSlot.split(" ")[0]}</div>
                        </td>
                        <td className="py-4 px-6">
                          <StatusPill status={order.status} />
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/orders/${order.id}/track`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
                          >
                            Track
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-surface-glass-border">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-text-heading">
                        {order.id}
                      </span>
                      <StatusPill status={order.status} />
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-text-heading">
                      <Train className="h-4 w-4 text-green-700" />
                      Kandy → {order.destination}
                    </div>

                    <div className="text-xs text-text-muted">
                      <div>{order.cargo} • {order.weight}</div>
                      <div>Dispatched: {order.date} ({order.trainSlot})</div>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-xs font-semibold text-text-heading">
                        Rs. {order.amount.toLocaleString()}
                      </span>
                      <Button variant="secondary" size="sm" href={`/orders/${order.id}/track`}>
                        Live Tracking
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
