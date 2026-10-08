"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Train,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  History,
  Info,
  ChevronRight,
  Split,
  Undo2,
  Eye,
  XCircle,
  Lock,
} from "lucide-react";

interface TrainTrip {
  trip_id: number;
  origin_station_id: number;
  origin_city: string;
  destination_station_id: number;
  destination_city: string;
  departure_datetime: string;
  arrival_datetime: string;
  total_capacity: number;
  used_space: number;
  remaining_space: number;
  utilisation_pct: number;
  status: "SCHEDULED" | "CANCELLED" | "COMPLETED";
}

interface PendingOrder {
  order_id: number;
  customer_id: number;
  customer_name: string;
  phone: string;
  customer_city: string;
  destination_station_id: number;
  destination_city: string;
  route_name: string;
  order_date: string;
  delivery_date: string;
  status: string;
  total_quantity: number;
  total_required_space: number;
  items: Array<{
    order_item_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price_at_order: number;
    space_consumption_rate: number;
    required_space: number;
  }>;
}

interface AllocationRecord {
  allocation_id: number;
  order_id?: number;
  order_item_id?: number;
  trip_id: number;
  departure_datetime: string;
  allocated_quantity: number;
  allocated_space: number;
}

interface TripAllocationItem {
  allocation_id: number;
  trip_id: number;
  order_id: number;
  customer_name: string;
  product_name: string;
  allocated_quantity: number;
  allocated_space: number;
  allocated_at: string;
  allocated_by_name: string;
}

interface AuditLogEntry {
  audit_id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  action: string;
  entity_id: number;
  outcome: string;
  occurred_at: string;
  entity_name: string;
}

interface RailManagementProps {
  initialTab?: "trips" | "pending" | "breakdown" | "schedules" | "audit";
}

export default function RailManagement({ initialTab = "trips" }: RailManagementProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Data states
  const [trips, setTrips] = useState<TrainTrip[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [cacheStatus, setCacheStatus] = useState<string>("MISS");
  const [loading, setLoading] = useState(false);

  // Modals & Panels
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<TrainTrip | null>(null);
  const [selectedTripConsignments, setSelectedTripConsignments] = useState<{ tripId: number; items: TripAllocationItem[] } | null>(null);
  const [suitableTripsModal, setSuitableTripsModal] = useState<{ orderId: number; trips: any[] } | null>(null);
  const [breakdownOrderId, setBreakdownOrderId] = useState<number | "">("");
  const [orderAllocations, setOrderAllocations] = useState<{ orderId: number; allocations: AllocationRecord[] } | null>(null);

  // Action status message
  const [alertBanner, setAlertBanner] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // New Trip Form state
  const [newTripDestination, setNewTripDestination] = useState<number>(1); // Colombo default
  const [newTripDeparture, setNewTripDeparture] = useState<string>("");
  const [newTripArrival, setNewTripArrival] = useState<string>("");
  const [newTripCapacity, setNewTripCapacity] = useState<number>(50);

  // Edit Trip Form state
  const [editCapacity, setEditCapacity] = useState<number>(50);
  const [editDeparture, setEditDeparture] = useState<string>("");
  const [editArrival, setEditArrival] = useState<string>("");

  // Check user role
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const u = await res.json();
          setCurrentUser(u);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    }
    fetchMe();
  }, []);

  // Fetch Trips
  const loadTrips = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/rail/trips");
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips || []);
      }
    } catch (err) {
      console.error("Failed to load trips", err);
    }
  }, []);

  // Fetch Pending Orders
  const loadPendingOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/rail/orders/pending");
      if (res.ok) {
        const data = await res.json();
        setPendingOrders(data.pending_orders || []);
      }
    } catch (err) {
      console.error("Failed to load pending orders", err);
    }
  }, []);

  // Fetch Schedules & Cache
  const loadSchedules = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/rail/schedules");
      if (res.ok) {
        const cacheHeader = res.headers.get("x-cache") || res.headers.get("X-Cache") || "MISS";
        setCacheStatus(cacheHeader);
        const data = await res.json();
        setSchedules(data.trips || []);
      }
    } catch (err) {
      console.error("Failed to load schedules", err);
    }
  }, []);

  // Fetch Audit Trail
  const loadAuditTrail = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/rail/audit");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.audit_trail || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    loadTrips();
    loadPendingOrders();
    loadSchedules();
    loadAuditTrail();
  }, [loadTrips, loadPendingOrders, loadSchedules, loadAuditTrail]);

  useEffect(() => {
    if (currentUser && ["LOGISTICS_MGR", "SUPERADMIN"].includes(currentUser.role)) {
      refreshAll();
    }
  }, [currentUser, refreshAll]);

  // Auth gate check
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-300">
        <RefreshCw className="h-6 w-6 animate-spin text-green-500 mr-3" />
        <span>Verifying Logistics Manager credentials...</span>
      </div>
    );
  }

  const isAuthorized = currentUser && ["LOGISTICS_MGR", "SUPERADMIN"].includes(currentUser.role);
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">403 Forbidden - Access Denied</h2>
          <p className="text-sm text-slate-400 mb-6">
            The Rail Capacity & Allocation portal is restricted exclusively to <strong>Logistics Managers</strong> and <strong>Superadmins</strong>.
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-all"
          >
            Back to Orders Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // --- ACTIONS ---

  // 1. Create Trip (LM-01)
  async function handleCreateTrip(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAlertBanner(null);

    try {
      const res = await fetch("/api/v1/rail/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_station_id: 7, // Locked to Kandy
          destination_station_id: Number(newTripDestination),
          departure_datetime: new Date(newTripDeparture).toISOString(),
          arrival_datetime: new Date(newTripArrival).toISOString(),
          total_capacity: Number(newTripCapacity),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to create trip.");
      }

      setAlertBanner({ type: "success", message: data.message || `Train trip #${data.trip_id} created successfully.` });
      setCreateModalOpen(false);
      refreshAll();
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 2. Update Trip (LM-02)
  async function handleUpdateTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!editTrip) return;
    setLoading(true);
    setAlertBanner(null);

    try {
      const res = await fetch(`/api/v1/rail/trips/${editTrip.trip_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_capacity: Number(editCapacity),
          departure_datetime: editDeparture ? new Date(editDeparture).toISOString() : undefined,
          arrival_datetime: editArrival ? new Date(editArrival).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update trip.");
      }

      setAlertBanner({ type: "success", message: data.message || `Train trip #${editTrip.trip_id} updated.` });
      setEditTrip(null);
      refreshAll();
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 3. Cancel Trip (LM-02)
  async function handleCancelTrip(tripId: number) {
    if (!confirm(`Are you sure you want to cancel train trip #${tripId}?`)) return;
    setLoading(true);
    setAlertBanner(null);

    try {
      const res = await fetch(`/api/v1/rail/trips/${tripId}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to cancel trip.");
      }
      setAlertBanner({ type: "success", message: data.message || `Trip #${tripId} cancelled.` });
      refreshAll();
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 4. Activate Trip (LM-02)
  async function handleActivateTrip(tripId: number) {
    setLoading(true);
    setAlertBanner(null);

    try {
      const res = await fetch(`/api/v1/rail/trips/${tripId}/activate`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to activate trip.");
      }
      setAlertBanner({ type: "success", message: data.message || `Trip #${tripId} activated.` });
      refreshAll();
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 5. Inspect Suitable Trips (LM-03/04/15)
  async function handleInspectSuitableTrips(orderId: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/rail/orders/${orderId}/suitable-trips`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to retrieve suitable trips.");
      }
      setSuitableTripsModal({ orderId, trips: data.suitable_trips || [] });
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 6. Allocate Capacity (Stored Procedure sp_schedule_train_order)
  async function handleAllocate(orderId: number) {
    setLoading(true);
    setAlertBanner(null);

    try {
      const res = await fetch("/api/v1/rail/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetail = data.detail || "Allocation failed";
        let humanMessage = errorDetail;
        if (errorDetail.includes("INSUFFICIENT_RAIL_CAPACITY")) {
          humanMessage = "Allocation Rejected: Insufficient rail carriage capacity available before delivery date.";
        } else if (errorDetail.includes("ORDER_NOT_FOUND")) {
          humanMessage = "Order not found in database.";
        } else if (errorDetail.includes("INVALID_ORDER_STATUS")) {
          humanMessage = "Invalid order status. Order must be in PENDING_RAIL_SCHEDULING.";
        } else if (errorDetail.includes("DESTINATION_HUB_NOT_RESOLVED")) {
          humanMessage = "Destination station hub could not be resolved from customer address.";
        }
        setAlertBanner({ type: "error", message: humanMessage });
        return;
      }

      const statusResult = data.status_result;
      let outcomeText = `Order #${orderId} allocated successfully! Result: ${statusResult}`;
      if (statusResult === "SUCCESS_SINGLE_TRIP") {
        outcomeText = `Order #${orderId} scheduled successfully on a single train trip!`;
      } else if (statusResult.includes("SPILLOVER") || statusResult === "SUCCESS_MULTI_TRIP") {
        outcomeText = `Order #${orderId} scheduled with Multi-Trip Spillover across multiple train carriages!`;
      }

      setAlertBanner({ type: "success", message: outcomeText });

      // Automatically display breakdown
      if (data.allocations && data.allocations.length > 0) {
        setOrderAllocations({ orderId, allocations: data.allocations });
        setBreakdownOrderId(orderId);
        setActiveTab("breakdown");
      }

      refreshAll();
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 7. View Order Breakdown (LM-19)
  async function handleLoadOrderAllocations(orderId: number) {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/rail/orders/${orderId}/allocations`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to load order allocations.");
      }
      setOrderAllocations({ orderId, allocations: data.allocations || [] });
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 8. Reverse Allocation / Reschedule (LM-18)
  async function handleReverseAllocation(orderId: number) {
    if (!confirm(`Are you sure you want to reverse rail allocations for Order #${orderId}? This will release the booked wagon capacity and return the order to PENDING_RAIL_SCHEDULING.`)) return;
    setLoading(true);
    setAlertBanner(null);

    try {
      const res = await fetch(`/api/v1/rail/orders/${orderId}/reverse`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to reverse rail allocation.");
      }
      setAlertBanner({ type: "success", message: data.message || `Order #${orderId} allocation reversed. Capacity released.` });
      setOrderAllocations(null);
      refreshAll();
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 9. View Trip Consignments (LM-20)
  async function handleViewTripConsignments(tripId: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/rail/trips/${tripId}/allocations`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to load trip consignments.");
      }
      setSelectedTripConsignments({ tripId, items: data.allocations || [] });
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-green-900/40">
              <Train className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Rail Capacity & Allocation</h1>
                <span className="text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  Feature 4.2 Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Trip Carriage Scheduling Engine • Kandy Central Goods Yard Mainline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshAll}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-all cursor-pointer"
              title="Refresh all data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                setNewTripDeparture("");
                setNewTripArrival("");
                setNewTripCapacity(50);
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold shadow-lg shadow-green-900/30 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Train Trip</span>
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        {alertBanner && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 backdrop-blur-md transition-all ${
              alertBanner.type === "success"
                ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-200"
                : alertBanner.type === "error"
                ? "bg-red-950/60 border-red-500/30 text-red-200"
                : "bg-blue-950/60 border-blue-500/30 text-blue-200"
            }`}
          >
            {alertBanner.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : alertBanner.type === "error" ? (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm font-medium">{alertBanner.message}</div>
            <button
              onClick={() => setAlertBanner(null)}
              className="text-white/60 hover:text-white text-xs cursor-pointer font-bold ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          {[
            { id: "trips", label: "Train Trips (LM-01/02)", count: trips.length, icon: Train },
            { id: "pending", label: "Pending Orders (LM-06)", count: pendingOrders.length, icon: Layers },
            { id: "breakdown", label: "Allocation Breakdown (LM-19/18)", icon: Split },
            { id: "schedules", label: "Live Schedule & Cache", icon: Calendar },
            { id: "audit", label: "Rail Audit Log (LM-23)", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-green-600 text-white shadow-md shadow-green-900/40"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: TRAIN TRIPS (LM-01, LM-02, LM-20) */}
        {/* ======================================================== */}
        {activeTab === "trips" && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Scheduled Freight Trips</h2>
                  <p className="text-xs text-slate-400">
                    Real-time carriage capacity usage from <code className="text-green-400 font-mono">v_trip_capacity_usage</code>
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  Showing <strong className="text-white">{trips.length}</strong> trips originating from Kandy Central Goods Yard
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Trip ID</th>
                      <th className="py-3 px-3">Corridor Route</th>
                      <th className="py-3 px-3">Departure</th>
                      <th className="py-3 px-3">Arrival</th>
                      <th className="py-3 px-3">Capacity (Space Units)</th>
                      <th className="py-3 px-3">Utilisation</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {trips.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No train trips currently scheduled. Click <strong>Create Train Trip</strong> above.
                        </td>
                      </tr>
                    ) : (
                      trips.map((t) => {
                        const pct = Math.min(100, Math.max(0, Number(t.utilisation_pct) || 0));
                        const isFull = Number(t.remaining_space) <= 0.001;
                        return (
                          <tr key={t.trip_id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-white">#{t.trip_id}</td>
                            <td className="py-3 px-3 font-medium text-slate-200">
                              <span className="text-green-400 font-semibold">{t.origin_city}</span> &rarr;{" "}
                              <span className="text-white font-semibold">{t.destination_city}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-300">{t.departure_datetime}</td>
                            <td className="py-3 px-3 text-slate-300">{t.arrival_datetime}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{Number(t.used_space).toFixed(1)}</span>
                                <span className="text-slate-500">/</span>
                                <span className="text-slate-400">{Number(t.total_capacity).toFixed(1)}</span>
                                <span className="text-[10px] text-emerald-400 ml-1">
                                  ({Number(t.remaining_space).toFixed(1)} avail)
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      pct > 90
                                        ? "bg-red-500"
                                        : pct > 60
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-slate-300 w-9 text-right">
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  t.status === "SCHEDULED"
                                    ? isFull
                                      ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                                      : "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                                    : "bg-red-950 text-red-300 border border-red-500/30"
                                }`}
                              >
                                {t.status === "SCHEDULED" && isFull ? "FULL" : t.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleViewTripConsignments(t.trip_id)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                  title="View Consignments Manifest (LM-20)"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setEditTrip(t);
                                    setEditCapacity(Number(t.total_capacity));
                                    setEditDeparture(t.departure_datetime.replace(" ", "T").slice(0, 16));
                                    setEditArrival(t.arrival_datetime.replace(" ", "T").slice(0, 16));
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                  title="Edit Trip Capacity (LM-02)"
                                >
                                  <Layers className="h-3.5 w-3.5" />
                                </button>

                                {t.status === "SCHEDULED" ? (
                                  <button
                                    onClick={() => handleCancelTrip(t.trip_id)}
                                    className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-red-100 transition-colors cursor-pointer"
                                    title="Cancel Train Trip (LM-02)"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleActivateTrip(t.trip_id)}
                                    className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-100 transition-colors cursor-pointer"
                                    title="Activate Trip (LM-02)"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PENDING ORDERS & ALLOCATION (LM-06, LM-03, LM-04) */}
        {/* ======================================================== */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Orders Awaiting Train Allocation (LM-06)</h2>
                  <p className="text-xs text-slate-400">
                    Orders in status <code className="text-amber-400 font-mono">PENDING_RAIL_SCHEDULING</code> eligible for train carriage booking
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  <strong className="text-white">{pendingOrders.length}</strong> orders queued for dispatch
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {pendingOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-medium text-white">All orders are scheduled!</p>
                    <p className="text-xs mt-1">No customer orders currently awaiting rail allocation.</p>
                  </div>
                ) : (
                  pendingOrders.map((order) => (
                    <div
                      key={order.order_id}
                      className="bg-slate-800/40 border border-white/5 hover:border-white/15 rounded-2xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white text-sm">Order #{order.order_id}</span>
                          <span className="text-xs font-semibold text-slate-200">{order.customer_name}</span>
                          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                            PENDING SCHEDULING
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <div>
                            Destination: <strong className="text-slate-200">{order.destination_city} Hub</strong> ({order.route_name})
                          </div>
                          <div>
                            Delivery Deadline: <strong className="text-slate-200">{order.delivery_date}</strong>
                          </div>
                          <div>
                            Total Cargo: <strong className="text-emerald-400">{order.total_required_space.toFixed(2)} space units</strong> ({order.total_quantity} items)
                          </div>
                        </div>

                        {/* Order Item tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {order.items.map((i) => (
                            <span
                              key={i.order_item_id}
                              className="text-[11px] bg-slate-900 border border-white/10 px-2 py-0.5 rounded-lg text-slate-300"
                            >
                              {i.product_name} &times; <strong>{i.quantity}</strong> ({Number(i.required_space).toFixed(2)} space)
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleInspectSuitableTrips(order.order_id)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-all cursor-pointer"
                        >
                          Check Suitable Trips
                        </button>

                        <button
                          onClick={() => handleAllocate(order.order_id)}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold shadow-md shadow-green-900/30 transition-all cursor-pointer"
                        >
                          <Split className="h-3.5 w-3.5" />
                          <span>Allocate Rail Capacity</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: BREAKDOWN & RESCHEDULE (LM-19, LM-18) */}
        {/* ======================================================== */}
        {activeTab === "breakdown" && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Order Allocation Breakdown (LM-19)</h2>
                  <p className="text-xs text-slate-400">
                    Trip-by-trip wagon distribution, multi-trip spillover visualisation, and capacity reversal (LM-18)
                  </p>
                </div>
              </div>

              {/* Order Search Bar */}
              <div className="mt-4 flex items-center gap-3 max-w-md">
                <input
                  type="number"
                  placeholder="Enter Customer Order ID..."
                  value={breakdownOrderId}
                  onChange={(e) => setBreakdownOrderId(e.target.value ? Number(e.target.value) : "")}
                  className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={() => breakdownOrderId && handleLoadOrderAllocations(Number(breakdownOrderId))}
                  className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Lookup Breakdown
                </button>
              </div>

              {/* Breakdown display */}
              {orderAllocations && (
                <div className="mt-6 space-y-4">
                  <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">Order #{orderAllocations.orderId}</span>
                          {orderAllocations.allocations.length > 1 ? (
                            <span className="text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Split className="h-3 w-3" /> Multi-Trip Spillover ({orderAllocations.allocations.length} Trips)
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                              Single Trip Booking
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Total Allocated Space:{" "}
                          <strong className="text-white">
                            {orderAllocations.allocations.reduce((acc, curr) => acc + Number(curr.allocated_space), 0).toFixed(2)} units
                          </strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleReverseAllocation(orderAllocations.orderId)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Undo2 className="h-3.5 w-3.5 text-red-400" />
                        <span>Reverse Allocation (LM-18)</span>
                      </button>
                    </div>

                    {/* Consignment allocations table */}
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                            <th className="py-2.5 px-3">Allocation ID</th>
                            <th className="py-2.5 px-3">Assigned Trip</th>
                            <th className="py-2.5 px-3">Departure Date & Time</th>
                            <th className="py-2.5 px-3">Consignment Quantity</th>
                            <th className="py-2.5 px-3">Occupied Wagon Space</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {orderAllocations.allocations.map((a, idx) => (
                            <tr key={a.allocation_id} className="hover:bg-white/[0.02]">
                              <td className="py-2.5 px-3 font-mono text-slate-400">#{a.allocation_id}</td>
                              <td className="py-2.5 px-3 font-semibold text-white">
                                Train Trip #{a.trip_id}
                                {orderAllocations.allocations.length > 1 && (
                                  <span className="text-[10px] text-amber-400 ml-2 font-normal">
                                    (Spillover Leg {idx + 1})
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-300">{a.departure_datetime}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-100">{a.allocated_quantity} units</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                                {Number(a.allocated_space).toFixed(2)} space
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: LIVE SCHEDULE & CACHE (LM-21, Redis Caching) */}
        {/* ======================================================== */}
        {activeTab === "schedules" && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Public Train Timetable & Caching Analytics</h2>
                  <p className="text-xs text-slate-400">
                    Cached endpoint <code className="text-green-400 font-mono">/api/v1/rail/schedules</code> (TTL 60s, invalidated upon allocations)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs bg-slate-950 border border-white/10 px-3 py-1.5 rounded-xl">
                    <span className="text-slate-400">X-Cache Status:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                        cacheStatus === "HIT"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-950 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {cacheStatus}
                    </span>
                  </div>
                  <button
                    onClick={loadSchedules}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                  >
                    Test Cache Fetch
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {schedules.map((s) => (
                  <div key={s.trip_id} className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-xs">Trip #{s.trip_id}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                        {s.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {s.origin_city} &rarr; {s.destination_city}
                    </div>
                    <div className="text-xs text-slate-400 space-y-0.5">
                      <div>Departs: <strong className="text-slate-200">{s.departure_datetime}</strong></div>
                      <div>Arrives: <strong className="text-slate-200">{s.arrival_datetime}</strong></div>
                      <div>Remaining Capacity: <strong className="text-emerald-400">{Number(s.remaining_capacity).toFixed(1)} units</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: RAIL AUDIT TRAIL (LM-23) */}
        {/* ======================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Immutable Rail Audit Trail (LM-23)</h2>
                  <p className="text-xs text-slate-400">
                    Tamper-proof event logs recording all train creation, allocation, reversal, and cancellation events
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Log ID</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Entity Reference</th>
                      <th className="py-2.5 px-3">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map((log) => (
                      <tr key={log.audit_id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-mono text-slate-400">#{log.audit_id}</td>
                        <td className="py-2.5 px-3 text-slate-300">{log.occurred_at}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-white">{log.user_name || "System"}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">({log.user_role})</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{log.action}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {log.entity_name} #{log.entity_id}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.outcome === "SUCCESS"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                                : "bg-red-950 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {log.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: CREATE TRAIN TRIP (LM-01) */}
        {/* ======================================================== */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Train className="h-4 w-4 text-green-400" /> Create Scheduled Train Trip
                </h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Origin Station (Mandatory Hub)</label>
                  <input
                    type="text"
                    disabled
                    value="Kandy Central Goods Yard (Station #7)"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Per LM-03 policy, all trips depart from Kandy.</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Destination Station Hub</label>
                  <select
                    value={newTripDestination}
                    onChange={(e) => setNewTripDestination(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-green-500"
                  >
                    <option value={1}>Colombo Main Railway Station Store (ID #1)</option>
                    <option value={2}>Negombo Station Hub (ID #2)</option>
                    <option value={3}>Galle Station Hub (ID #3)</option>
                    <option value={4}>Matara Station Hub (ID #4)</option>
                    <option value={5}>Jaffna Station Hub (ID #5)</option>
                    <option value={6}>Trincomalee Station Hub (ID #6)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Departure Datetime</label>
                    <input
                      type="datetime-local"
                      required
                      value={newTripDeparture}
                      onChange={(e) => setNewTripDeparture(e.target.value)}
                      className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Arrival Datetime</label>
                    <input
                      type="datetime-local"
                      required
                      value={newTripArrival}
                      onChange={(e) => setNewTripArrival(e.target.value)}
                      className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Carriage Capacity (Space Units)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={newTripCapacity}
                    onChange={(e) => setNewTripCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-green-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold cursor-pointer"
                  >
                    {loading ? "Creating..." : "Confirm Trip Creation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: EDIT TRIP (LM-02) */}
        {/* ======================================================== */}
        {editTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">
                  Update Trip #{editTrip.trip_id} ({editTrip.origin_city} &rarr; {editTrip.destination_city})
                </h3>
                <button onClick={() => setEditTrip(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateTrip} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Total Capacity (Current Used: {Number(editTrip.used_space).toFixed(1)})
                  </label>
                  <input
                    type="number"
                    min={Number(editTrip.used_space)}
                    step="0.5"
                    required
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-green-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    DB trigger prevents reducing capacity below {Number(editTrip.used_space).toFixed(1)} units.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Departure Datetime</label>
                    <input
                      type="datetime-local"
                      required
                      value={editDeparture}
                      onChange={(e) => setEditDeparture(e.target.value)}
                      className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Arrival Datetime</label>
                    <input
                      type="datetime-local"
                      required
                      value={editArrival}
                      onChange={(e) => setEditArrival(e.target.value)}
                      className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditTrip(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold cursor-pointer"
                  >
                    {loading ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: SUITABLE TRIPS DISCOVERY (LM-03/04/15) */}
        {/* ======================================================== */}
        {suitableTripsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">
                  Eligible Chronological Trips for Order #{suitableTripsModal.orderId}
                </h3>
                <button
                  onClick={() => setSuitableTripsModal(null)}
                  className="text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {suitableTripsModal.trips.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No eligible scheduled trips found departing Kandy before the order delivery deadline.
                  </div>
                ) : (
                  suitableTripsModal.trips.map((st) => (
                    <div
                      key={st.trip_id}
                      className="bg-slate-950 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          Trip #{st.trip_id} &bull; {st.origin_city} &rarr; {st.destination_city}
                        </div>
                        <div className="text-slate-400 mt-1">
                          Departs: <strong className="text-slate-200">{st.departure_datetime}</strong> &bull; Arrives:{" "}
                          <strong className="text-slate-200">{st.arrival_datetime}</strong>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400">
                          {Number(st.remaining_space).toFixed(1)} space units avail
                        </div>
                        <div className="text-[10px] text-slate-500">Total: {Number(st.total_capacity).toFixed(1)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSuitableTripsModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: TRIP CONSIGNMENTS MANIFEST (LM-20) */}
        {/* ======================================================== */}
        {selectedTripConsignments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">
                  Cargo Bookings for Train Trip #{selectedTripConsignments.tripId} (LM-20)
                </h3>
                <button
                  onClick={() => setSelectedTripConsignments(null)}
                  className="text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {selectedTripConsignments.items.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No order consignments have been booked onto this train trip yet.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Space Occupied</th>
                        <th className="py-2.5 px-3">Booked At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedTripConsignments.items.map((item) => (
                        <tr key={item.allocation_id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-mono font-bold text-white">#{item.order_id}</td>
                          <td className="py-2.5 px-3 text-slate-200">{item.customer_name}</td>
                          <td className="py-2.5 px-3 text-slate-300">{item.product_name}</td>
                          <td className="py-2.5 px-3 font-semibold text-white">{item.allocated_quantity}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                            {Number(item.allocated_space).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.allocated_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedTripConsignments(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
