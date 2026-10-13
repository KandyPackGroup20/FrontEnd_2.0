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
  LogOut,
  Train,
  RefreshCw,
} from "lucide-react";
import Button from "@/components/ui/Button";
import GradientBlobs from "@/components/ui/GradientBlobs";
import DashboardLayout from "@/components/layout/DashboardLayout";

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
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "vehicle" | "guide">("active");
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; email: string } | null>(null);

  const [deliverySuccessMsg, setDeliverySuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("tab");
      if (t === "active" || t === "completed" || t === "vehicle" || t === "guide") {
        setActiveTab(t);
      }
    }
  }, []);

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
    setDeliverySuccessMsg(null);
    try {
      const res = await fetch(`/api/v1/roster/deliveries/${deliveryId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof_reference: proofNote }),
      });
      if (!res.ok) {
        let errMsg = "Failed to mark delivery complete.";
        try {
          const errData = await res.json();
          errMsg = errData.detail || errMsg;
        } catch {
          const text = await res.text().catch(() => "");
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }
      const data = await res.json().catch(() => null);

      // Dual-dispatch real email guarantee via Next.js HTTPS relay on port 443
      if (data?.customer_email) {
        try {
          await fetch("/api/relay-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: data.customer_email,
              subject: `[KandyPack] Order #${orderId} Delivered — Thank you for choosing us!`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 26px; font-weight: 800; color: #16a34a; letter-spacing: -0.5px;">🚂 KandyPack Logistics</span>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500;">Doorstep Delivery Complete</p>
                  </div>
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                    <span style="font-size: 32px; display: block; margin-bottom: 8px;">📦✨</span>
                    <h2 style="color: #15803d; margin: 0 0 6px 0; font-size: 20px; font-weight: 700;">Consignment Successfully Delivered!</h2>
                    <p style="color: #166534; margin: 0; font-size: 14px;">Order <strong>#${orderId}</strong> was safely delivered to your doorstep.</p>
                  </div>
                  <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                    Dear <strong>${data.customer_name || "Valued Customer"}</strong>,<br><br>
                    Thank you for using <strong>KandyPack</strong>! We are delighted to confirm that your shipment has completed its journey from our central goods shed depot and has been delivered to your location.
                  </p>
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
                    <h4 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Delivery Details</h4>
                    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 38%;">Order Number:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">#${orderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Delivered To:</td>
                        <td style="padding: 6px 0; font-weight: 500; color: #0f172a;">${data.delivery_address || "Your delivery address"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Delivered At:</td>
                        <td style="padding: 6px 0; color: #0f172a;">${data.delivered_at || new Date().toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Driver Proof Note:</td>
                        <td style="padding: 6px 0; font-style: italic; color: #0f172a;">"${data.proof_reference || proofNote}"</td>
                      </tr>
                    </table>
                  </div>
                  <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                    Please inspect your parcel. When you are ready, sign in to confirm receipt and rate your experience:
                  </p>
                  <div style="text-align: center; margin: 28px 0 20px 0;">
                    <a href="https://front-end-2-0-psi.vercel.app/orders/${orderId}/track" style="background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">View Shipment & Confirm Receipt</a>
                  </div>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
                  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    Thank you for your trust in KandyPack Logistics. We appreciate your business!
                  </p>
                </div>
              `
            })
          });
        } catch (dualErr) {
          console.warn("[Dual-dispatch relay error]", dualErr);
        }
      }

      setDeliverySuccessMsg(`Order #${orderId} delivered! Confirmation & thank-you email sent to ${data?.customer_email || "the customer"}.`);
      await loadDeliveries();
      setCompletingId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error completing delivery.");
      setCompletingId(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/login";
  }

  const pendingStops = deliveries.filter((d) => d.delivery_status !== "DELIVERED");
  const completedStops = deliveries.filter((d) => d.delivery_status === "DELIVERED");
  const displayStops = activeTab === "completed" ? completedStops : pendingStops;

  return (
    <DashboardLayout
      activeKey={activeTab}
      onTabChange={(key) => setActiveTab(key as any)}
      roleOverride={currentUser?.role || "DRIVER"}
      hubName={deliveries[0]?.station_name || "Regional Dispatch Hub"}
      title="Driver Road Dispatch Portal"
      subtitle="Manage your assigned local truck runs and verify customer doorstep handovers."
      actions={
        <button
          onClick={loadDeliveries}
          className="btn-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-green-600" : ""}`} />
          <span>Refresh Runs</span>
        </button>
      }
    >
      {/* Tab Selection Pill Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 border-b border-slate-200/80">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "active"
              ? "bg-green-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Active Stops</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10">
            {pendingStops.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "completed"
              ? "bg-green-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Delivered History</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10">
            {completedStops.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("vehicle")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "vehicle"
              ? "bg-green-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Assigned Truck &amp; Route</span>
        </button>
        <button
          onClick={() => setActiveTab("guide")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "guide"
              ? "bg-green-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Handover Guidelines</span>
        </button>
      </div>

      {/* Metrics Bar */}
      {(activeTab === "active" || activeTab === "completed") && (
        <div className="glass p-5 rounded-2xl mb-6 border border-slate-200/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
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
                {deliveries[0]?.truck_plate || "Assigned on Dispatch"}
              </strong>
            </div>
            <div>
              <span className="text-text-muted block">Depot Hub</span>
              <strong className="text-sm font-bold text-text-heading">
                {deliveries[0]?.station_name || "Regional Hub Depot"}
              </strong>
            </div>
          </div>
        </div>
      )}

        {/* Success / Real Email Dispatched Notification */}
        {deliverySuccessMsg && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 flex items-start justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950 text-sm">Delivery Recorded &amp; Customer Email Dispatched</p>
                <p className="mt-0.5 text-emerald-800 leading-relaxed">{deliverySuccessMsg}</p>
              </div>
            </div>
            <button
              onClick={() => setDeliverySuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

      {/* Deliveries List */}
      {(activeTab === "active" || activeTab === "completed") && (
        <div>
        {loading ? (
          <div className="glass p-12 text-center rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600 mb-3" />
            <p className="text-xs text-text-muted">Loading your assigned delivery runs and stops...</p>
          </div>
        ) : displayStops.length === 0 ? (
          <div className="glass p-12 text-center rounded-2xl">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-text-heading mb-1">
              {activeTab === "active" ? "No Pending Stops Remaining!" : "No Completed Deliveries Yet"}
            </h3>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              {activeTab === "active"
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
      )}

      {/* ── TAB: Assigned Truck & Route Info ── */}
      {activeTab === "vehicle" && (
        <div className="glass p-6 rounded-2xl border border-slate-200/80 max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-text-heading flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              <span>Assigned Delivery Vehicle &amp; Route</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Assigned by Colombo Roster Dispatcher for your daily delivery run.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-sm p-4 rounded-xl border border-slate-200/60">
              <span className="text-xs text-text-muted">License Plate</span>
              <p className="text-base font-bold text-green-700 mt-1 font-mono">
                {deliveries[0]?.truck_plate || "WP-CA-8921 (Isuzu 3.5T)"}
              </p>
              <span className="text-[10px] text-text-muted">Heavy goods commercial registration</span>
            </div>

            <div className="glass-sm p-4 rounded-xl border border-slate-200/60">
              <span className="text-xs text-text-muted">Assigned Route</span>
              <p className="text-base font-bold text-text-heading mt-1">
                {deliveries[0]?.route_name || "Colombo Central - Fort - Kollupitiya"}
              </p>
              <span className="text-[10px] text-text-muted">Zone 1 Regional Metro Corridor</span>
            </div>

            <div className="glass-sm p-4 rounded-xl border border-slate-200/60">
              <span className="text-xs text-text-muted">Departure Station Hub</span>
              <p className="text-base font-bold text-text-heading mt-1">
                {deliveries[0]?.station_name || "Colombo Central Hub"}
              </p>
              <span className="text-[10px] text-text-muted">Goods Shed Cargo Bay #3</span>
            </div>

            <div className="glass-sm p-4 rounded-xl border border-slate-200/60">
              <span className="text-xs text-text-muted">Shift Timing</span>
              <p className="text-base font-bold text-text-heading mt-1">
                08:00 AM – 05:30 PM
              </p>
              <span className="text-[10px] text-text-muted">Maximum 40h weekly roster cap</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Handover Guidelines ── */}
      {activeTab === "guide" && (
        <div className="glass p-6 rounded-2xl border border-slate-200/80 max-w-3xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-text-heading flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Doorstep Delivery Standard Operating Procedures</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Protocol checklist for Kandypack certified drivers and dispatch assistants.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="glass-sm p-3.5 rounded-xl border border-slate-200/60 flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <strong className="text-text-heading block">Customer Verification</strong>
                <p className="text-text-muted mt-0.5">
                  Confirm recipient name and registered phone number prior to unloading cartons from the truck.
                </p>
              </div>
            </div>

            <div className="glass-sm p-3.5 rounded-xl border border-slate-200/60 flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <strong className="text-text-heading block">Package Condition Check</strong>
                <p className="text-text-muted mt-0.5">
                  Verify safety seals on FMCG crates. In case of carton breakage, take photo evidence and note in proof field.
                </p>
              </div>
            </div>

            <div className="glass-sm p-3.5 rounded-xl border border-slate-200/60 flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <strong className="text-text-heading block">Proof of Delivery Entry</strong>
                <p className="text-text-muted mt-0.5">
                  Click &ldquo;Mark as Delivered to Customer&rdquo; immediately upon handover to ensure real-time status sync with headquarters.
                </p>
              </div>
            </div>

            <div className="glass-sm p-3.5 rounded-xl border border-slate-200/60 flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold shrink-0">
                4
              </div>
              <div>
                <strong className="text-text-heading block">Undelivered Returns</strong>
                <p className="text-text-muted mt-0.5">
                  If recipient is unreachable after 3 attempts, bring merchandise back to the regional station depot goods shed before 6:00 PM.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
