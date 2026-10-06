"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import GradientBlobs from "@/components/ui/GradientBlobs";
import {
  AlertsSidebar,
  NotificationBellButton,
  LogisticsNotification,
} from "@/components/notifications/AlertsSidebar";

type Status = "pending" | "transit" | "delivered" | "issue";

interface OrderItem {
  id: string;
  order_id?: number;
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

const FALLBACK_ORDERS: OrderItem[] = [
  {
    id: "KP-01007-CMB",
    destination: "Colombo",
    hubStation: "Colombo Fort Goods Shed",
    cargo: "Kandy Pure Ceylon Tea 500g Pack",
    weight: "300 kg",
    date: "2026-09-04",
    status: "transit",
    trainSlot: "06:00 AM Express Rail 101",
    recipient: "Lanka Retailers Ltd",
    amount: 135000,
  },
  {
    id: "KP-01005-GAL",
    destination: "Galle",
    hubStation: "Galle Central Hub",
    cargo: "Kandy Spice Mixture Box (12 Units)",
    weight: "375 kg",
    date: "2026-09-01",
    status: "delivered",
    trainSlot: "07:00 AM Coastal Express 103",
    recipient: "Southern Spice Exporters",
    amount: 85000,
  },
  {
    id: "KP-01003-CMB",
    destination: "Colombo",
    hubStation: "Colombo Fort Station",
    cargo: "Highland Organic Produce & Spices",
    weight: "200 kg",
    date: "2026-09-05",
    status: "pending",
    trainSlot: "09:00 PM Night Express 404",
    recipient: "Lanka WholeSalers LTD",
    amount: 64000,
  },
  {
    id: "KP-01004-GAL",
    destination: "Galle",
    hubStation: "Galle Station Hub",
    cargo: "FMCG Biscuits Master Carton",
    weight: "1250 kg",
    date: "2026-09-02",
    status: "delivered",
    trainSlot: "06:00 AM Express Rail 101",
    recipient: "Galle Retail Partners",
    amount: 120000,
  },
  {
    id: "KP-01006-CMB",
    destination: "Trincomalee",
    hubStation: "Trincomalee Freight Hub",
    cargo: "Coconut Oil 5L Containers",
    weight: "270 kg",
    date: "2026-08-30",
    status: "issue",
    trainSlot: "11:15 AM Intercity Rail 205",
    recipient: "Eastern Province Stores",
    amount: 72000,
  },
  {
    id: "KP-01001-CMB",
    destination: "Colombo",
    hubStation: "Colombo Main Railway Station Store",
    cargo: "FMCG Biscuits Master Carton (24 Packs)",
    weight: "2500 kg",
    date: "2026-08-08",
    status: "pending",
    trainSlot: "06:30 AM Express Rail 101",
    recipient: "Lanka Retailers Ltd",
    amount: 240000,
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [notifications, setNotifications] = useState<LogisticsNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"unread" | "history">("unread");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<{ user_id: number; email: string; role: string; name: string } | null>(null);

  const loadUserSession = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications/recent?limit=50");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated === false) {
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
        if (typeof data.unread_count === "number") {
          setUnreadCount(data.unread_count);
        }
      }
    } catch {
      // quiet fallback
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
          return;
        }
      }
      setOrders(FALLBACK_ORDERS);
    } catch {
      setOrders(FALLBACK_ORDERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserSession();
    loadOrders();
    loadNotifications();
    const interval = setInterval(loadNotifications, 6000);
    return () => clearInterval(interval);
  }, [loadUserSession, loadOrders, loadNotifications]);

  const isLogisticsStaff = Boolean(
    currentUser && (currentUser.role === "LOGISTICS_MGR" || currentUser.role === "SUPERADMIN")
  );

  const filteredOrders = orders.filter((order) => {
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
          {currentUser && (
            <NotificationBellButton
              onClick={() => {
                setSidebarTab("unread");
                setSidebarOpen(true);
              }}
              unreadCount={unreadCount}
            />
          )}
          <Button variant="primary" size="sm" href="/order/new">
            <Plus className="h-4 w-4" />
            Book Shipment
          </Button>
          <Link
            href="/profile"
            className="text-sm font-medium text-text-muted hover:text-green-600 transition-colors"
          >
            {currentUser ? currentUser.name.split(" ")[0] : "Profile"}
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
            {isLogisticsStaff && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSidebarTab("history");
                  setSidebarOpen(true);
                }}
                className="text-emerald-800 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
              >
                Alert History Tab
              </Button>
            )}
            <Button variant="secondary" size="sm" href="/order/new">
              <Plus className="h-4 w-4" />
              New Consignment
            </Button>
          </div>
        </div>

        {/* Live Logistics Manager Alerts Banner - Strictly for authenticated Logistics Staff */}
        {isLogisticsStaff && notifications.length > 0 && showNotifications && (
          <div className="mb-6 rounded-2xl bg-emerald-50/90 border border-emerald-300/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  Live Freight Dispatch & Logistics Alerts
                </span>
                {unreadCount > 0 ? (
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {unreadCount} Unread
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded-full">
                    All Caught Up
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarTab("unread");
                    setSidebarOpen(true);
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline decoration-emerald-400 hover:decoration-emerald-700 cursor-pointer"
                >
                  Open Sidebar Drawer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarTab("history");
                    setSidebarOpen(true);
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline decoration-emerald-400 hover:decoration-emerald-700 cursor-pointer"
                >
                  Alert History Tab
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-950 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {notifications.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    setSidebarTab(n.is_read ? "history" : "unread");
                    setSidebarOpen(true);
                  }}
                  className={`rounded-xl border p-2.5 text-xs flex items-start gap-2.5 shadow-2xs transition-all hover:shadow-xs cursor-pointer ${
                    !n.is_read
                      ? "bg-white/95 border-emerald-300 ring-1 ring-emerald-200"
                      : "bg-white/70 border-emerald-100"
                  }`}
                >
                  <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <Train className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-bold text-text-heading truncate">{n.subject}</div>
                      {!n.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-text-muted text-[11px] truncate mt-0.5">{n.body_preview}</div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center justify-between">
                      <span>{n.recipient} • {n.timestamp}</span>
                      <span className="font-bold text-emerald-800 hover:underline">View in Sidebar →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-text-heading">Loading live consignment records from database...</p>
              <p className="text-xs text-text-muted mt-1">Connecting to Kandypack Freight Logistics Engine</p>
            </div>
          ) : filteredOrders.length === 0 ? (
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

      {/* Slide-over Logistics Alerts & History Sidebar Drawer */}
      <AlertsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        initialTab={sidebarTab}
        onNotificationsUpdated={(cnt, notifs) => {
          setUnreadCount(cnt);
          setNotifications(notifs);
        }}
      />
    </div>
  );
}

