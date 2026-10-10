"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Train,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  AlertCircle,
  Package,
  Calendar,
  Share2,
  Loader2,
  Check,
  ShieldCheck,
  Building2,
  UserCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import GradientBlobs from "@/components/ui/GradientBlobs";

interface TrackingMilestone {
  title: string;
  location: string;
  time: string;
  description: string;
  completed: boolean;
  active: boolean;
}

interface OrderDetails {
  id: string;
  order_id: number;
  destination: string;
  hubStation: string;
  cargo: string;
  weight: string;
  date: string;
  status: string;
  trainSlot: string;
  recipient: string;
  amount: number;
  milestones: TrackingMilestone[];
  raw_status?: string;
  can_confirm_receipt?: boolean;
  driver_name?: string | null;
  driver_phone?: string | null;
  truck_plate?: string | null;
  warehouse_bin?: string | null;
  proof_reference?: string | null;
  delivered_at?: string | null;
}

export default function OrderTrackPage() {
  const params = useParams();
  const orderId = (params?.id as string) || "KP-78291-CMB";

  const [copied, setCopied] = useState(false);
  const [orderData, setOrderData] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("Package received in excellent condition.");

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrderData(data);
      }
    } catch (e) {
      console.error("Failed to load tracking data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [orderId]);

  async function handleConfirmReceipt() {
    if (!orderData) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderData.order_id}/confirm-received`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: customerNotes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to confirm receipt.");
      }
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error confirming receipt.");
    } finally {
      setConfirming(false);
    }
  }

  const milestones = orderData?.milestones || [];

  function copyTrackingLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isDelivered = orderData?.raw_status === "DELIVERED" || orderData?.can_confirm_receipt;
  const isCompleted = orderData?.raw_status === "COMPLETED";

  return (
    <div className="relative min-h-screen pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <GradientBlobs />

      {/* Top Bar */}
      <div className="mx-auto max-w-5xl mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-text-heading no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
            <Train className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Kandypack</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        {/* Header Glass Card */}
        <div className="glass p-6 md:p-8 rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-surface-glass-border">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-mono text-2xl font-bold text-text-heading">
                  {orderData?.id || orderId}
                </h1>
                <StatusPill status={(orderData?.status as any) || "transit"} />
              </div>
              <p className="text-sm text-text-muted">
                Kandy Central Goods Shed → {orderData?.destination || "Colombo"} Hub ({orderData?.hubStation || "Colombo Fort Goods Shed"}) → Doorstep Delivery
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyTrackingLink}
                className="btn-secondary px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                {copied ? "Link Copied!" : "Share Tracking"}
              </button>
              <Button variant="primary" size="sm" href="/order/new">
                New Order
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-sm">
            <div>
              <span className="text-xs text-text-muted block">Estimated Delivery</span>
              <strong className="text-text-heading font-semibold">{orderData?.date ? `${orderData.date}` : "Scheduled Delivery"}</strong>
            </div>
            <div>
              <span className="text-xs text-text-muted block">Freight Service</span>
              <strong className="text-text-heading font-semibold">{orderData?.trainSlot || "Rail Express"}</strong>
            </div>
            <div>
              <span className="text-xs text-text-muted block">Cargo Weight</span>
              <strong className="text-text-heading font-semibold">{orderData?.weight ? `${orderData.weight}` : "60 kg"}</strong>
            </div>
            <div>
              <span className="text-xs text-text-muted block">Recipient</span>
              <strong className="text-text-heading font-semibold">{orderData?.recipient || "Consignee"}</strong>
            </div>
          </div>
        </div>

        {/* Customer Receipt Verification Banner */}
        {isDelivered && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border-2 border-green-500 bg-linear-to-r from-green-50 via-emerald-50 to-green-100/60 p-6 md:p-8 shadow-lg shadow-green-600/10"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-900 font-bold text-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                  <span>Consignment Delivered to Your Doorstep!</span>
                </div>
                <p className="text-xs text-green-950/80 leading-relaxed max-w-xl">
                  Driver <strong>{orderData?.driver_name || "Assigned Driver"}</strong> has completed doorstep handover of your consignment.
                  {orderData?.proof_reference && (
                    <span className="block mt-1 font-mono text-[11px] text-green-800">
                      Proof reference: {orderData.proof_reference}
                    </span>
                  )}
                  Please verify that all parcels arrived in good condition and confirm your receipt below.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Optional customer feedback note..."
                  className="rounded-xl border border-green-300 bg-white px-3 py-2 text-xs text-text-heading w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
                <button
                  onClick={handleConfirmReceipt}
                  disabled={confirming}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold py-2.5 px-6 text-xs shadow-md shadow-green-800/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Confirm Order Received</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isCompleted && (
          <div className="mb-8 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 text-xs text-emerald-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-emerald-950 block">
                  Consignment Received & Verified by Recipient
                </strong>
                <span className="text-[11px] text-emerald-800">
                  {orderData?.proof_reference || "Customer signed off delivery."} · Thank you for using Kandypack Logistics!
                </span>
              </div>
            </div>
            <span className="rounded-full bg-emerald-200/80 text-emerald-950 px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
              Completed
            </span>
          </div>
        )}

        {/* Content Grid: Timeline + Details Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Timeline (2 cols) */}
          <div className="lg:col-span-2 glass p-6 md:p-8 rounded-2xl">
            <h2 className="text-lg font-bold text-text-heading mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-700" />
              Live Journey Milestones
            </h2>

            <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-green-100">
              {milestones.map((milestone, idx) => (
                <div key={idx} className="relative group">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                      milestone.completed
                        ? "bg-green-600 text-white shadow-sm"
                        : milestone.active
                        ? "bg-green-600 text-white ring-4 ring-green-100 animate-pulse"
                        : "bg-white border-2 border-gray-200 text-transparent"
                    }`}
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : milestone.active ? (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    ) : null}
                  </div>

                  {/* Milestone Content */}
                  <div className="pl-4">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                      <h3
                        className={`text-sm font-semibold ${
                          milestone.active
                            ? "text-green-700 font-bold"
                            : milestone.completed
                            ? "text-text-heading"
                            : "text-text-muted"
                        }`}
                      >
                        {milestone.title}
                        {milestone.active && (
                          <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                            CURRENT
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-text-muted font-mono">{milestone.time}</span>
                    </div>

                    <div className="text-xs font-medium text-text-heading flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3 text-green-600 shrink-0" />
                      {milestone.location}
                    </div>

                    <p className="text-xs text-text-muted leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipment Details Sidebar (1 col) */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-text-heading uppercase tracking-wider text-green-700 mb-4 flex items-center gap-2">
                <Train className="h-4 w-4" /> Rail Segment
              </h3>
              <div className="space-y-3 text-xs text-text-body">
                <div className="flex justify-between">
                  <span className="text-text-muted">Locomotive:</span>
                  <span className="font-semibold">M10 Diesel Electric</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Freight Service:</span>
                  <span className="font-semibold">{orderData?.trainSlot || "SLR Freight"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Hub Destination:</span>
                  <span className="font-semibold">{orderData?.destination} Goods Shed</span>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-text-heading uppercase tracking-wider text-green-700 mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Warehouse & Depot
              </h3>
              <div className="space-y-3 text-xs text-text-body">
                <div className="flex justify-between">
                  <span className="text-text-muted">Storage Bin:</span>
                  <span className="font-semibold font-mono text-green-700">
                    {orderData?.warehouse_bin || "General Inbound Bay"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Regional Depot:</span>
                  <span className="font-semibold">{orderData?.hubStation || `${orderData?.destination} Central`}</span>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-text-heading uppercase tracking-wider text-green-700 mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4" /> Road Delivery Fleet
              </h3>
              <div className="space-y-3 text-xs text-text-body">
                <div className="flex justify-between">
                  <span className="text-text-muted">Assigned Truck:</span>
                  <span className="font-semibold">{orderData?.truck_plate || "Road Fleet Scheduled"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Driver:</span>
                  <span className="font-semibold">{orderData?.driver_name || "Regional Driver Assigned"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Recipient:</span>
                  <span className="font-semibold text-right">{orderData?.recipient}</span>
                </div>
                {orderData?.proof_reference && (
                  <div className="pt-2 border-t border-surface-glass-border">
                    <span className="text-text-muted block text-[10px]">Proof / Notes:</span>
                    <span className="font-mono text-[11px] text-text-heading">{orderData.proof_reference}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50/60 p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-green-800 mb-1">
                <AlertCircle className="h-4 w-4" /> Need assistance?
              </div>
              <p className="text-xs text-text-muted mb-3">
                Our Operations Desk is available 24/7 for freight inquiries and dispatch updates.
              </p>
              <div className="text-xs font-bold text-green-700">
                Hotline: +94 81 223 4455
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
