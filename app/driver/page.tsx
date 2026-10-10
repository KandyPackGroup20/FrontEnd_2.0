"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Check,
  FileText,
  Calendar,
  User,
} from "lucide-react";
import Button from "@/components/ui/Button";
import GradientBlobs from "@/components/ui/GradientBlobs";

interface DeliveryStop {
  delivery_id: number;
  order_id: number;
  delivery_status: string;
  cargo_weight_kg: string;
  proof_reference: string | null;
  delivered_at: string | null;
  roster_id: number;
  start_time: string;
  end_time: string;
  run_status: string;
  truck_plate: string;
  route_name: string;
  station_name: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  order_status: string;
}

export default function DriverPortalPage() {
  const [deliveries, setDeliveries] = useState<DeliveryStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [proofNote, setProofNote] = useState<string>("Handed over to recipient, signed.");
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; email: string } | null>(null);

  async function loadDeliveries() {
    setLoading(true);
    setError(null);
    try {
      const userRes = await fetch("/api/v1/auth/me");
      if (userRes.ok) {
        const u = await userRes.json();
        setCurrentUser(u);
      }
      const res = await fetch("/api/v1/roster/driver/my-deliveries");
      if (!res.ok) {
        throw new Error("Failed to load driver deliveries.");
      }
      const data = await res.json();
      setDeliveries(data.deliveries || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error loading deliveries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function handleMarkDelivered(deliveryId: number, orderId: number) {
    setCompletingId(deliveryId);
    try {
      const res = await fetch(`/api/v1/roster/deliveries/${deliveryId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof_reference: proofNote }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to mark delivery complete.");
      }
      await loadDeliveries();
      setCompletingId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error completing delivery.");
      setCompletingId(null);
    }
  }

  const pendingStops = deliveries.filter((d) => d.delivery_status !== "DELIVERED");
  const completedStops = deliveries.filter((d) => d.delivery_status === "DELIVERED");
  const displayStops = activeTab === "pending" ? pendingStops : completedStops;

  return (
    <div className="relative min-h-screen pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <GradientBlobs />

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="glass p-6 md:p-8 rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-600/30">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-heading">
                  Driver Road Dispatch Portal
                </h1>
                <p className="text-xs text-text-muted">
                  {currentUser ? (
                    <span>
                      Logged in as <strong>{currentUser.name}</strong> ({currentUser.role})
                    </span>
                  ) : (
                    "Manage your assigned local truck runs and verify customer doorstep handovers."
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadDeliveries}
                className="btn-secondary px-4 py-2 text-xs flex items-center gap-1.5"
              >
                Refresh Runs
              </button>
              <Link href="/orders" className="btn-secondary px-4 py-2 text-xs">
                All Orders
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-surface-glass-border text-xs">
            <div>
              <span className="text-text-muted block">Pending Stops</span>
              <strong className="text-lg font-bold text-green-700">{pendingStops.length}</strong>
            </div>
            <div>
              <span className="text-text-muted block">Completed Today</span>
              <strong className="text-lg font-bold text-text-heading">{completedStops.length}</strong>
            </div>
            <div>
              <span className="text-text-muted block">Active Truck Plate</span>
              <strong className="text-sm font-bold text-text-heading">
                {deliveries[0]?.truck_plate || "SP-CAB-2001"}
              </strong>
            </div>
            <div>
              <span className="text-text-muted block">Depot Hub</span>
              <strong className="text-sm font-bold text-text-heading">
                {deliveries[0]?.station_name || "Galle Regional Hub"}
              </strong>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === "pending"
                ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                : "glass text-text-body hover:text-green-700"
            }`}
          >
            Active Stops ({pendingStops.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === "completed"
                ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                : "glass text-text-body hover:text-green-700"
            }`}
          >
            Delivered History ({completedStops.length})
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Deliveries List */}
        {loading ? (
          <div className="glass p-12 text-center rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600 mb-3" />
            <p className="text-xs text-text-muted">Loading your assigned delivery runs and stops...</p>
          </div>
        ) : displayStops.length === 0 ? (
          <div className="glass p-12 text-center rounded-2xl">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-text-heading mb-1">
              {activeTab === "pending" ? "No Pending Stops Remaining!" : "No Completed Deliveries Yet"}
            </h3>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              {activeTab === "pending"
                ? "All assigned customer orders on this run have been delivered. New runs will appear once scheduled by Dispatcher."
                : "Deliveries marked as complete will appear here with confirmation proof."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayStops.map((stop) => (
              <div
                key={stop.delivery_id}
                className="glass p-6 rounded-2xl transition-all hover:border-green-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-glass-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-green-700">
                        Order #{stop.order_id}
                      </span>
                      <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                        Run #{stop.roster_id} · {stop.route_name}
                      </span>
                      {stop.delivery_status === "DELIVERED" ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3" /> DELIVERED
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          ON TRUCK
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-2">
                      <span>Truck: <strong>{stop.truck_plate}</strong></span>
                      <span>•</span>
                      <span>Weight: <strong>{stop.cargo_weight_kg} kg</strong></span>
                      <span>•</span>
                      <span>Hub: <strong>{stop.station_name}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orders/${stop.order_id}/track`}
                      className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1"
                    >
                      <span>Track Order</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Recipient Details & Handover */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-text-muted block">Recipient Name</span>
                        <strong className="text-text-heading">{stop.recipient_name}</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-text-muted block">Contact Phone</span>
                        <a href={`tel:${stop.recipient_phone}`} className="font-semibold text-green-700 hover:underline">
                          {stop.recipient_phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-text-muted block">Doorstep Address</span>
                        <strong className="text-text-heading">{stop.delivery_address}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action / Delivery Proof */}
                  <div className="rounded-xl bg-green-50/50 border border-green-200/80 p-4 flex flex-col justify-between">
                    {stop.delivery_status === "DELIVERED" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-green-800">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Delivery Confirmed</span>
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed">
                          <strong>Proof note:</strong> {stop.proof_reference || "Signed by recipient."}
                        </p>
                        {stop.delivered_at && (
                          <p className="text-[10px] text-text-muted font-mono">
                            Delivered timestamp: {stop.delivered_at}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-green-800 mb-1">
                            Proof / Recipient Verification Note
                          </label>
                          <input
                            type="text"
                            value={proofNote}
                            onChange={(e) => setProofNote(e.target.value)}
                            placeholder="e.g. Handed over to recipient, signed by Kasun"
                            className="w-full rounded-xl bg-white border border-green-300 px-3 py-1.5 text-xs text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20"
                          />
                        </div>

                        <button
                          onClick={() => handleMarkDelivered(stop.delivery_id, stop.order_id)}
                          disabled={completingId === stop.delivery_id}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold py-2 px-3 text-xs shadow-md shadow-green-800/10 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {completingId === stop.delivery_id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Confirming Delivery...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Mark as Delivered to Customer</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
