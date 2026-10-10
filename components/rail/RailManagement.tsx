"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { railTimestamp, railError, distinctRailTrips } from "@/lib/rail-input";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  PackageCheck,
  Sparkles,
  TrendingUp,
  Search,
  Boxes,
} from "lucide-react";
import GradientBlobs from "@/components/ui/GradientBlobs";

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
  status: "SCHEDULED" | "CANCELLED" | "IN_TRANSIT" | "ARRIVED";
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
    space_rate: number;
    required_space: number;
  }>;
}

interface SuitableTripOption {
  trip_id: number;
  departure_datetime: string;
  arrival_datetime: string;
  total_capacity: number;
  used_space: number;
  remaining_space: number;
  utilisation_pct: number;
}

interface OrderAllocationBreakdown {
  order_id: number;
  status_result?: string;
  allocations: Array<{
    allocation_id: number;
    order_item_id: number;
    trip_id: number;
    departure_datetime: string;
    allocated_quantity: number;
    allocated_space: number;
  }>;
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
  entity_name: string;
  outcome: string;
  occurred_at: string;
}

interface RailManagementProps {
  initialTab?: "trips" | "pending" | "breakdown" | "schedules" | "audit";
}

export default function RailManagement({ initialTab = "trips" }: RailManagementProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"trips" | "pending" | "breakdown" | "schedules" | "audit">(initialTab);
  const [currentUser, setCurrentUser] = useState<{ user_id: number; email: string; role: string; name: string } | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Trips data
  const [trips, setTrips] = useState<TrainTrip[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [schedules, setSchedules] = useState<TrainTrip[]>([]);
  const [cacheStatus, setCacheStatus] = useState<string>("MISS");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [alertBanner, setAlertBanner] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Inspect suitable trips drawer
  const [selectedOrderForSuitable, setSelectedOrderForSuitable] = useState<PendingOrder | null>(null);
  const [suitableTripsList, setSuitableTripsList] = useState<SuitableTripOption[]>([]);
  const [suitableDrawerOpen, setSuitableDrawerOpen] = useState<boolean>(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  // Allocation Breakdown state
  const [breakdownOrderId, setBreakdownOrderId] = useState<number | "">("");
  const [orderAllocations, setOrderAllocations] = useState<{ orderId: number; allocations: OrderAllocationBreakdown["allocations"] } | null>(null);

  // Trip Consignments Modal
  const [tripConsignmentsModal, setTripConsignmentsModal] = useState<{ tripId: number; items: TripAllocationItem[] } | null>(null);

  // Create Trip Modal state
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editTrip, setEditTrip] = useState<TrainTrip | null>(null);
  const [newTripDestination, setNewTripDestination] = useState<number>(0);
  const [railHubs, setRailHubs] = useState<{origins: Array<{station_id: number; city: string}>; destinations: Array<{station_id: number; city: string}>}>({origins: [], destinations: []});
  const [allocationOrderId, setAllocationOrderId] = useState<number | null>(null);
  const allocationInFlight = useRef(false);
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
          if (u.force_password_reset) {
            router.replace("/profile?force_reset=true");
            return;
          }
          setCurrentUser(u);
        } else if (res.status === 401) {
          router.replace("/login?redirect=/admin/rail");
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
  }, [router]);

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

  const loadRailHubs = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/rail/stations');
      const data = await response.json();
      if (!response.ok) throw new Error(railError(data.detail));
      setRailHubs(data);
      setNewTripDestination(current => current || data.destinations[0]?.station_id || 0);
    } catch (error) {
      setAlertBanner({type: 'error', message: error instanceof Error ? error.message : 'Could not load rail hubs.'});
    }
  }, []);

  const refreshAll = useCallback(() => {
    loadRailHubs();
    loadTrips();
    loadPendingOrders();
    loadSchedules();
    loadAuditTrail();
  }, [loadTrips, loadPendingOrders, loadSchedules, loadAuditTrail, loadRailHubs]);

  useEffect(() => {
    if (currentUser && ["LOGISTICS_MGR", "SUPERADMIN"].includes(currentUser.role)) {
      refreshAll();
    }
  }, [currentUser, refreshAll]);

  // Auth gate check
  if (authChecking) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#F5FAF7] text-slate-700">
        <GradientBlobs />
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-sm flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
          <span className="text-sm font-medium">Verifying Logistics Manager authorization...</span>
        </div>
      </div>
    );
  }

  const isAuthorized = currentUser && ["LOGISTICS_MGR", "SUPERADMIN"].includes(currentUser.role);
  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#F5FAF7]">
        <GradientBlobs />
        <div className="relative z-10 bg-white/90 backdrop-blur-2xl border border-red-200 rounded-3xl p-8 max-w-md text-center shadow-xl">
          <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">403 Forbidden - Access Denied</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            The Rail Capacity & Allocation portal is restricted exclusively to <strong>Logistics Managers</strong> and <strong>Superadmins</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/login?redirect=/admin/rail"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Sign in as Logistics Manager
            </Link>
            <Link
              href="/orders"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
            >
              Back to Orders Dashboard
            </Link>
          </div>
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
      if (!railHubs.origins.length || !newTripDestination) throw new Error('Active rail hubs must be configured before creating a trip.');
      const res = await fetch("/api/v1/rail/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_station_id: railHubs.origins[0].station_id,
          destination_station_id: Number(newTripDestination),
          departure_datetime: railTimestamp(newTripDeparture),
          arrival_datetime: railTimestamp(newTripArrival),
          total_capacity: Number(newTripCapacity),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(railError(data.detail, "Failed to create trip."));
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_capacity: Number(editCapacity),
          departure_datetime: editDeparture ? railTimestamp(editDeparture) : undefined,
          arrival_datetime: editArrival ? railTimestamp(editArrival) : undefined,
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
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to cancel trip.");
      }
      setAlertBanner({ type: "info", message: data.message || `Train trip #${tripId} cancelled.` });
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
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to activate trip.");
      }
      setAlertBanner({ type: "success", message: data.message || `Train trip #${tripId} reactivated.` });
      refreshAll();
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 5. Inspect Suitable Trips
  async function handleInspectSuitableTrips(orderId: number) {
    setLoading(true);
    setAlertBanner(null);
    setSelectedTripId(null);
    const ord = pendingOrders.find((o) => o.order_id === orderId);
    setSelectedOrderForSuitable(ord || null);

    try {
      const res = await fetch(`/api/v1/rail/orders/${orderId}/suitable-trips`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to query suitable trips.");
      }
      setSuitableTripsList(data.suitable_trips || []);
      setSuitableDrawerOpen(true);
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 6. Allocate Rail Capacity
  async function handleAllocate(orderId: number, tripId?: number | null) {
    if (allocationInFlight.current) return;
    allocationInFlight.current = true;
    setAllocationOrderId(orderId);
    setSuitableDrawerOpen(false);
    setLoading(true);
    setAlertBanner(null);

    try {
      const res = await fetch("/api/v1/rail/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          ...(tripId ? { trip_id: tripId } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetail = railError(data.detail, "Allocation failed");
        let humanMessage = errorDetail;
        if (errorDetail.includes("INSUFFICIENT_RAIL_CAPACITY")) {
          humanMessage = "Allocation Rejected: Insufficient rail carriage capacity available before delivery cutoff date.";
        } else if (errorDetail.includes("ORDER_NOT_FOUND")) {
          humanMessage = "Order not found in database.";
        } else if (errorDetail.includes("INVALID_ORDER_STATUS")) {
          humanMessage = "Invalid order status. Order must be in PENDING_RAIL_SCHEDULING.";
        } else if (errorDetail.includes("DESTINATION_HUB_NOT_RESOLVED")) {
          humanMessage = "Destination station hub could not be resolved from customer delivery address.";
        }
        setAlertBanner({ type: "error", message: humanMessage });
        return;
      }

      const statusResult = data.status_result;
      let outcomeText = `Order #${orderId} allocated successfully! Result: ${statusResult}`;
      if (statusResult === "SUCCESS_SINGLE_TRIP") {
        outcomeText = `Order #${orderId} scheduled successfully on a single train trip!`;
      } else if (statusResult?.includes("SPILLOVER") || statusResult === "SUCCESS_MULTI_TRIP") {
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
      allocationInFlight.current = false;
      setAllocationOrderId(null);
      setLoading(false);
    }
  }

  // 7. Load Order Breakdown (LM-19)
  async function handleLoadOrderAllocations(orderId: number) {
    setLoading(true);
    setAlertBanner(null);

    try {
      const res = await fetch(`/api/v1/rail/orders/${orderId}/allocations`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to load order allocation breakdown.");
      }
      setOrderAllocations({ orderId, allocations: data.allocations || [] });
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
      setOrderAllocations(null);
    } finally {
      setLoading(false);
    }
  }

  // 8. Reverse Allocation
  async function handleReverseAllocation(orderId: number) {
    if (!confirm(`Are you sure you want to reverse all train allocations for Order #${orderId}? This will free all reserved carriage slots.`)) return;
    setLoading(true);
    setAlertBanner(null);

    try {
      const res = await fetch(`/api/v1/rail/orders/${orderId}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to reverse allocation.");
      }

      setAlertBanner({ type: "success", message: `Order #${orderId} allocation reversed. Capacity restored and order returned to Pending Orders.` });
      setOrderAllocations(null);
      setBreakdownOrderId("");
      await refreshAll();
      setActiveTab("pending");
    } catch (err: any) {
      setAlertBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // 9. View Trip Consignments Manifest (LM-20)
  async function handleViewTripConsignments(tripId: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/rail/trips/${tripId}/allocations`);
      const data = await res.json();
      if (res.ok) {
        setTripConsignmentsModal({ tripId, items: data.allocations || [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Calculations for KPI Cards
  const totalTripsCount = trips.length;
  const scheduledTripsCount = trips.filter((t) => t.status === "SCHEDULED").length;
  const pendingOrdersCount = pendingOrders.length;
  const totalPendingSpace = pendingOrders.reduce((acc, o) => acc + (o.total_required_space || 0), 0);
  const allocationTripIds = distinctRailTrips(orderAllocations?.allocations || []);

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-[#F5FAF7] text-slate-800">
      <GradientBlobs />
      {allocationOrderId !== null && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="rail-allocation-title">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="status" aria-live="polite">
          <RefreshCw className="mb-3 h-6 w-6 animate-spin text-green-600" />
          <h2 id="rail-allocation-title" className="font-bold">Scheduling order #{allocationOrderId}</h2>
          <p className="mt-2 text-sm">Checking available capacity and saving the allocation. Keep this page open; the trip breakdown will appear when the request completes.</p>
        </div>
      </div>}

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">

        {/* Header Bar */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-green-600/20">
              <Train className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Rail Capacity & Allocation
                </h2>
                <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  Operational
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-Trip Carriage Scheduling Engine • Kandy Central Goods Yard Mainline Corridor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshAll}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/80 shadow-sm transition-all cursor-pointer"
              title="Refresh all data"
            >
              <RefreshCw className={`h-4 w-4 text-green-600 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                setNewTripDeparture("");
                setNewTripArrival("");
                setNewTripCapacity(50);
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-md shadow-green-600/25 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Train Trip</span>
            </button>
          </div>
        </div>

        {/* Feature KPI Cards: Everything Visible Upfront */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Train Trips */}
          <div
            onClick={() => setActiveTab("trips")}
            className={`bg-white/80 backdrop-blur-xl border rounded-2xl p-5 shadow-sm transition-all cursor-pointer hover:shadow-md ${
              activeTab === "trips" ? "border-green-500 ring-2 ring-green-500/20" : "border-white/60 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled Trains</span>
              <div className="h-8 w-8 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                <Train className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{scheduledTripsCount}</span>
              <span className="text-xs text-slate-500">active ({totalTripsCount} total)</span>
            </div>
            <div className="mt-2 text-xs text-green-700 font-medium flex items-center gap-1">
              <span>View & Manage Trips</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>

          {/* Card 2: Pending Orders */}
          <div
            onClick={() => setActiveTab("pending")}
            className={`bg-white/80 backdrop-blur-xl border rounded-2xl p-5 shadow-sm transition-all cursor-pointer hover:shadow-md ${
              activeTab === "pending" ? "border-green-500 ring-2 ring-green-500/20" : "border-white/60 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Orders</span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{pendingOrdersCount}</span>
              <span className="text-xs text-amber-700 font-medium">waiting for slot</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span>Req Space: <strong>{totalPendingSpace.toFixed(1)} units</strong></span>
              <ChevronRight className="h-3 w-3 ml-auto text-amber-600" />
            </div>
          </div>

          {/* Card 3: Spillover Engine */}
          <div
            onClick={() => setActiveTab("pending")}
            className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all cursor-pointer hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Spillover Engine</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Split className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-sm font-bold text-slate-900">Chronological Split</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Active</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 leading-snug">
              Auto-spills cargo across consecutive trains before deadline
            </div>
          </div>

          {/* Card 4: Breakdown & Reschedule */}
          <div
            onClick={() => setActiveTab("breakdown")}
            className={`bg-white/80 backdrop-blur-xl border rounded-2xl p-5 shadow-sm transition-all cursor-pointer hover:shadow-md ${
              activeTab === "breakdown" ? "border-green-500 ring-2 ring-green-500/20" : "border-white/60 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Slot Inspector</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Search className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-sm font-bold text-slate-900">Allocation Breakdown</span>
            </div>
            <div className="mt-2 text-xs text-blue-700 font-medium flex items-center gap-1">
              <span>Inspect Legs & Reverse Slots</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {alertBanner && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 backdrop-blur-md transition-all shadow-sm ${
              alertBanner.type === "success"
                ? "bg-green-50/90 border-green-200 text-green-900"
                : alertBanner.type === "error"
                ? "bg-red-50/90 border-red-200 text-red-900"
                : "bg-blue-50/90 border-blue-200 text-blue-900"
            }`}
          >
            {alertBanner.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            ) : alertBanner.type === "error" ? (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm font-medium">{alertBanner.message}</div>
            <button
              onClick={() => setAlertBanner(null)}
              className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer font-bold ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
          {[
            { id: "trips", label: "Train Trips", count: trips.length, icon: Train },
            { id: "pending", label: "Pending Orders", count: pendingOrders.length, icon: Layers },
            { id: "breakdown", label: "Allocation Breakdown", icon: Split },
            { id: "schedules", label: "Live Schedule & Cache", icon: Calendar },
            { id: "audit", label: "Rail Audit Log", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-white/80 text-slate-600 hover:text-green-700 hover:bg-green-50/60 border border-slate-200/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Scheduled Freight Train Trips</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time carriage capacity usage from view <code className="text-green-700 font-mono font-semibold">v_trip_capacity_usage</code>
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  Showing <strong className="text-slate-900">{trips.length}</strong> trips originating from Kandy Central Goods Yard
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
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
                  <tbody className="divide-y divide-slate-100">
                    {trips.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No train trips currently scheduled. Click <strong>Create Train Trip</strong> above.
                        </td>
                      </tr>
                    ) : (
                      trips.map((t) => {
                        const pct = Math.min(100, Math.max(0, Number(t.utilisation_pct) || 0));
                        const isFull = Number(t.remaining_space) <= 0.001;
                        return (
                          <tr key={t.trip_id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-3 font-mono font-bold text-slate-900">#{t.trip_id}</td>
                            <td className="py-3.5 px-3 font-medium text-slate-800">
                              <span className="text-green-700 font-semibold">{t.origin_city}</span> &rarr;{" "}
                              <span className="text-slate-900 font-semibold">{t.destination_city}</span>
                            </td>
                            <td className="py-3.5 px-3 text-slate-600">{t.departure_datetime}</td>
                            <td className="py-3.5 px-3 text-slate-600">{t.arrival_datetime}</td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900">{Number(t.used_space).toFixed(1)}</span>
                                <span className="text-slate-400">/</span>
                                <span className="text-slate-600">{Number(t.total_capacity).toFixed(1)}</span>
                                <span className="text-[11px] text-green-700 font-medium ml-1">
                                  ({Number(t.remaining_space).toFixed(1)} avail)
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      pct > 90
                                        ? "bg-red-500"
                                        : pct > 60
                                        ? "bg-amber-500"
                                        : "bg-green-500"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-mono text-slate-600 w-9 text-right font-semibold">
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  t.status === "SCHEDULED"
                                    ? isFull
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                              >
                                {t.status === "SCHEDULED" && isFull ? "FULL" : t.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleViewTripConsignments(t.trip_id)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="View Consignments Manifest"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    setEditTrip(t);
                                    setEditCapacity(Number(t.total_capacity));
                                    setEditDeparture(t.departure_datetime.replace(" ", "T").slice(0, 16));
                                    setEditArrival(t.arrival_datetime.replace(" ", "T").slice(0, 16));
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="Edit Trip Capacity"
                                >
                                  <Layers className="h-4 w-4" />
                                </button>

                                {t.status === "SCHEDULED" ? (
                                  <button
                                    onClick={() => handleCancelTrip(t.trip_id)}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                                    title="Cancel Train Trip"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleActivateTrip(t.trip_id)}
                                    className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-colors cursor-pointer"
                                    title="Activate Trip"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Orders Awaiting Train Allocation</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Orders in status <code className="text-amber-700 font-mono font-semibold">PENDING_RAIL_SCHEDULING</code> eligible for train carriage booking
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  <strong className="text-slate-900">{pendingOrders.length}</strong> customer orders queued for rail scheduling
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {pendingOrders.length === 0 ? (
                  <div className="py-16 text-center text-slate-500">
                    <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-slate-900 text-base">All orders are scheduled!</p>
                    <p className="text-xs mt-1">No customer orders currently awaiting rail carriage allocation.</p>
                  </div>
                ) : (
                  pendingOrders.map((order) => (
                    <div
                      key={order.order_id}
                      className="bg-white border border-slate-200/70 hover:border-green-300 rounded-2xl p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900 text-sm">Order #{order.order_id}</span>
                          <span className="text-xs font-semibold text-slate-700">{order.customer_name}</span>
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                            PENDING SCHEDULING
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
                          <div>
                            Destination: <strong className="text-slate-800">{order.destination_city} Hub</strong> ({order.route_name})
                          </div>
                          <div>
                            Delivery Cutoff: <strong className="text-slate-800">{order.delivery_date}</strong>
                          </div>
                          <div>
                            Required Wagon Space: <strong className="text-green-700 font-bold">{order.total_required_space.toFixed(2)} units</strong> ({order.total_quantity} items)
                          </div>
                        </div>

                        {/* Order Item tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {order.items.map((i) => (
                            <span
                              key={i.order_item_id}
                              className="text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium"
                            >
                              {i.product_name} &times; <strong>{i.quantity}</strong> ({Number(i.required_space).toFixed(2)} space)
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => handleInspectSuitableTrips(order.order_id)}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer border border-slate-200 shadow-2xs"
                        >
                          <Search className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Find Trips</span>
                        </button>

                        <button
                          onClick={() => handleAllocate(order.order_id, null)}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-md shadow-green-600/20 transition-all cursor-pointer"
                        >
                          <Split className="h-4 w-4" />
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Order Allocation Breakdown</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trip-by-trip wagon distribution, multi-trip spillover visualisation, and capacity reversal
                  </p>
                </div>
              </div>

              {/* Order Search Bar */}
              <div className="mt-5 flex items-center gap-3 max-w-md">
                <input
                  type="number"
                  placeholder="Enter Customer Order ID (e.g. 1141)..."
                  value={breakdownOrderId}
                  onChange={(e) => setBreakdownOrderId(e.target.value ? Number(e.target.value) : "")}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 shadow-sm"
                />
                <button
                  onClick={() => breakdownOrderId && handleLoadOrderAllocations(Number(breakdownOrderId))}
                  className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Lookup Breakdown
                </button>
              </div>

              {/* Breakdown display */}
              {orderAllocations && (
                <div className="mt-6 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-slate-900 text-lg">Order #{orderAllocations.orderId}</span>
                          {allocationTripIds.length > 1 ? (
                            <span className="text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                              <Split className="h-3.5 w-3.5" /> Multi-Trip Spillover ({allocationTripIds.length} Trains)
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                              {allocationTripIds.length === 1 ? 'Single Trip Booking' : 'Not allocated'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">
                          Total Allocated Carriage Space:{" "}
                          <strong className="text-slate-900 font-bold">
                            {orderAllocations.allocations.reduce((acc, curr) => acc + Number(curr.allocated_space), 0).toFixed(2)} units
                          </strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleReverseAllocation(orderAllocations.orderId)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Undo2 className="h-4 w-4 text-red-600" />
                        <span>Reverse Allocation</span>
                      </button>
                    </div>

                    {/* Consignment allocations table */}
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-semibold">
                            <th className="py-2.5 px-3">Allocation ID</th>
                            <th className="py-2.5 px-3">Assigned Trip</th>
                            <th className="py-2.5 px-3">Departure Date & Time</th>
                            <th className="py-2.5 px-3">Consignment Quantity</th>
                            <th className="py-2.5 px-3">Occupied Wagon Space</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orderAllocations.allocations.map((a) => (
                            <tr key={a.allocation_id} className="hover:bg-slate-50/60">
                              <td className="py-3 px-3 font-mono text-slate-500 font-semibold">#{a.allocation_id}</td>
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                Train Trip #{a.trip_id}
                                {allocationTripIds.length > 1 && (
                                  <span className="text-[11px] text-amber-700 ml-2 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    Spillover Leg {allocationTripIds.indexOf(a.trip_id) + 1}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-slate-600">{a.departure_datetime}</td>
                              <td className="py-3 px-3 font-bold text-slate-800">{a.allocated_quantity} units</td>
                              <td className="py-3 px-3 font-mono font-bold text-green-700">
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Public Train Timetable & Caching Analytics</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cached endpoint <code className="text-green-700 font-mono font-semibold">/api/v1/rail/schedules</code> (TTL 60s, invalidated automatically on allocations)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <span className="text-slate-500">X-Cache Status:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                        cacheStatus === "HIT"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {cacheStatus}
                    </span>
                  </div>
                  <button
                    onClick={loadSchedules}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                  >
                    Test Cache Fetch
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map((s) => (
                  <div key={s.trip_id} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 text-xs">Trip #{s.trip_id}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                        {s.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {s.origin_city} &rarr; {s.destination_city}
                    </div>
                    <div className="text-xs text-slate-500 space-y-1 pt-1">
                      <div>Departs: <strong className="text-slate-800">{s.departure_datetime}</strong></div>
                      <div>Arrives: <strong className="text-slate-800">{s.arrival_datetime}</strong></div>
                      <div>Remaining Capacity: <strong className="text-green-700 font-semibold">{Number(s.remaining_space).toFixed(1)} space units</strong></div>
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
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Immutable Rail Audit Trail</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tamper-proof logs recording all train creation, allocation, reversal, and cancellation events
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-semibold">
                      <th className="py-2.5 px-3">Log ID</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Entity Reference</th>
                      <th className="py-2.5 px-3">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.audit_id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-mono text-slate-500">#{log.audit_id}</td>
                        <td className="py-3 px-3 text-slate-600">{log.occurred_at}</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900">{log.user_name || "System"}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">({log.user_role})</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">{log.action}</td>
                        <td className="py-3 px-3 text-slate-600">
                          {log.entity_name} #{log.entity_id}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              log.outcome === "SUCCESS"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Train className="h-5 w-5 text-green-600" /> Create Scheduled Train Trip
                </h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Origin Station</label>
                  <input
                    type="text"
                    disabled
                    value={railHubs.origins[0] ? `Kandy (Station #${railHubs.origins[0].station_id})` : "No active Kandy hub configured"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination Hub Station</label>
                  <select
                    value={newTripDestination}
                    onChange={(e) => setNewTripDestination(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-green-500"
                  >
                    <option value={0} disabled>Select destination</option>
                    {railHubs.destinations.map(hub => <option key={hub.station_id} value={hub.station_id}>{hub.city} (Station #{hub.station_id})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Departure Date & Time (Sri Lanka)</label>
                    <input
                      type="datetime-local"
                      required
                      value={newTripDeparture}
                      onChange={(e) => setNewTripDeparture(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Arrival Date & Time (Sri Lanka)</label>
                    <input
                      type="datetime-local"
                      required
                      value={newTripArrival}
                      onChange={(e) => setNewTripArrival(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Carriage Capacity (Space Units)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="0.5"
                    required
                    value={newTripCapacity}
                    onChange={(e) => setNewTripCapacity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-green-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Defines total wagon slots available for freight allocation.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-md shadow-green-600/25"
                  >
                    Create Train Trip
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: EDIT TRIP CAPACITY (LM-02) */}
        {/* ======================================================== */}
        {editTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-green-600" /> Edit Capacity: Trip #{editTrip.trip_id}
                </h3>
                <button
                  onClick={() => setEditTrip(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateTrip} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">New Total Capacity (Space Units)</label>
                  <input
                    type="number"
                    min={Number(editTrip.used_space)}
                    max="500"
                    step="0.5"
                    required
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-green-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Capacity cannot be reduced below currently allocated space ({Number(editTrip.used_space).toFixed(1)} units).
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Departure</label>
                    <input
                      type="datetime-local"
                      value={editDeparture}
                      onChange={(e) => setEditDeparture(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Arrival</label>
                    <input
                      type="datetime-local"
                      value={editArrival}
                      onChange={(e) => setEditArrival(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditTrip(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-md shadow-green-600/25"
                  >
                    Update Trip
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DRAWER: SUITABLE TRIPS MODAL (LM-03, LM-04, LM-15) */}
        {/* ======================================================== */}
        {suitableDrawerOpen && selectedOrderForSuitable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Train className="h-5 w-5 text-green-600" /> Suitable Trips for Order #{selectedOrderForSuitable.order_id}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Destination: <strong className="text-slate-800">{selectedOrderForSuitable.destination_city} Hub</strong> • Deadline: <strong className="text-slate-800">{selectedOrderForSuitable.delivery_date}</strong> • Required: <strong className="text-green-700">{selectedOrderForSuitable.total_required_space.toFixed(2)} space units</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSuitableDrawerOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                {suitableTripsList.length === 0 ? (
                  <div className="py-10 text-center text-slate-500">
                    <AlertCircle className="h-9 w-9 text-amber-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-900 text-sm">No suitable train trips available</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      There are no scheduled trips departing Kandy towards <strong>{selectedOrderForSuitable.destination_city} Hub</strong> before the delivery cutoff date (<strong>{selectedOrderForSuitable.delivery_date}</strong>).
                    </p>
                    <div className="mt-4 inline-block bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 text-left max-w-lg shadow-xs">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
                        <span>💡 How to enable scheduling for this order:</span>
                      </div>
                      <p className="leading-relaxed text-[11px] text-amber-700">
                        Click <strong>&quot;+ Create Scheduled Trip&quot;</strong> on the main rail page and add a new trip to <strong>{selectedOrderForSuitable.destination_city} Hub</strong> with arrival date strictly on or before <strong>{selectedOrderForSuitable.delivery_date}</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  suitableTripsList.map((st) => {
                    const isSelected = selectedTripId === st.trip_id;
                    const canFitOrder = selectedOrderForSuitable.total_required_space <= Number(st.remaining_space);
                    return (
                      <div
                        key={st.trip_id}
                        onClick={() => setSelectedTripId(isSelected ? null : st.trip_id)}
                        className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-green-50/70 border-green-500 ring-2 ring-green-500/30 shadow-sm"
                            : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="selected_trip"
                            checked={isSelected}
                            onChange={() => setSelectedTripId(st.trip_id)}
                            className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2 font-mono font-bold text-slate-900 text-sm">
                              <span>Trip #{st.trip_id}</span>
                              <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-sans">
                                Kandy Mainline
                              </span>
                              {canFitOrder ? (
                                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-sans">
                                  Fits Entire Order
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-sans">
                                  Partial (Requires Spillover)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 space-y-0.5 mt-1.5">
                              <div>Departure: <strong className="text-slate-800">{st.departure_datetime}</strong></div>
                              <div>Arrival: <strong className="text-slate-800">{st.arrival_datetime}</strong></div>
                              <div>
                                Available Carriage Space: <strong className="text-green-700 font-bold">{Number(st.remaining_space).toFixed(1)} units</strong> ({Number(st.total_capacity).toFixed(1)} total)
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right sm:self-center flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                          <span className="text-xs font-mono font-semibold text-slate-600 block">
                            {st.utilisation_pct.toFixed(0)}% full
                          </span>
                          <span className="text-[11px] text-green-700 font-semibold mt-1">
                            {isSelected ? "Selected ✓" : "Click to select"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {suitableTripsList.length} suitable train trips discovered
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSuitableDrawerOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>

                  {selectedTripId ? (
                    <button
                      onClick={() => {
                        setSuitableDrawerOpen(false);
                        handleAllocate(selectedOrderForSuitable.order_id, selectedTripId);
                      }}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      Book on Selected Trip #{selectedTripId}
                    </button>
                  ) : null}

                  <button
                    onClick={() => {
                      if (suitableTripsList.length === 0) return;
                      setSuitableDrawerOpen(false);
                      handleAllocate(selectedOrderForSuitable.order_id, null);
                    }}
                    disabled={suitableTripsList.length === 0 || loading}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      suitableTripsList.length === 0 || loading
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                        : "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 cursor-pointer"
                    }`}
                    title={
                      suitableTripsList.length === 0
                        ? "No suitable train trips available before order delivery cutoff date"
                        : "Auto-spill across consecutive trains chronologically"
                    }
                  >
                    <Split className="h-3.5 w-3.5" />
                    <span>Auto Multi-Trip Spillover</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: TRIP CONSIGNMENTS MANIFEST (LM-20) */}
        {/* ======================================================== */}
        {tripConsignmentsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" /> Cargo Manifest: Train Trip #{tripConsignmentsModal.tripId}
                </h3>
                <button
                  onClick={() => setTripConsignmentsModal(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {tripConsignmentsModal.items.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Boxes className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800">No freight cargo booked yet</p>
                    <p className="text-xs mt-1">This train currently has zero consignments allocated.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Wagon Space</th>
                        <th className="py-2.5 px-3">Scheduled By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tripConsignmentsModal.items.map((ci) => (
                        <tr key={ci.allocation_id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">#{ci.order_id}</td>
                          <td className="py-2.5 px-3 text-slate-800 font-medium">{ci.customer_name}</td>
                          <td className="py-2.5 px-3 text-slate-600">{ci.product_name}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{ci.allocated_quantity}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-green-700">{Number(ci.allocated_space).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-slate-500">{ci.allocated_by_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-right">
                <button
                  onClick={() => setTripConsignmentsModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
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
