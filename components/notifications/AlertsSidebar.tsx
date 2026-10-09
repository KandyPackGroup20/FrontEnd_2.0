"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  X,
  CheckCheck,
  Check,
  Clock,
  Train,
  Package,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Lock,
  ArrowRight,
} from "lucide-react";

export interface LogisticsNotification {
  id: number;
  type: string;
  recipient: string;
  subject: string;
  body_preview: string;
  status: string;
  timestamp: string;
  order_id?: number | null;
  is_read: number | boolean;
  order_status?: string | null;
}

interface AlertsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "unread" | "history";
  onNotificationsUpdated?: (unreadCount: number, allNotifs: LogisticsNotification[]) => void;
}

export function AlertsSidebar({
  isOpen,
  onClose,
  initialTab = "unread",
  onNotificationsUpdated,
}: AlertsSidebarProps) {
  const [activeTab, setActiveTab] = useState<"unread" | "history">(initialTab);
  const [notifications, setNotifications] = useState<LogisticsNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "unread" | "read">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState<boolean>(false);

  // Sync initial tab when reopened
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Fetch real notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications/recent?limit=50", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated === false) {
          setIsAuthenticated(false);
          setNotifications([]);
          setUnreadCount(0);
          if (onNotificationsUpdated) {
            onNotificationsUpdated(0, []);
          }
          return;
        }

        setIsAuthenticated(true);
        setUserRole(data.role || null);

        const list: LogisticsNotification[] = Array.isArray(data.notifications)
          ? data.notifications
          : [];
        setNotifications(list);

        const count =
          typeof data.unread_count === "number"
            ? data.unread_count
            : list.filter((n) => !n.is_read).length;
        setUnreadCount(count);

        if (onNotificationsUpdated) {
          onNotificationsUpdated(count, list);
        }
      } else if (res.status === 401) {
        setIsAuthenticated(false);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn("[AlertsSidebar] Could not refresh notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [onNotificationsUpdated]);

  // Initial fetch and 6-second polling for live updates
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 6000);

    const handleOrderPlaced = () => {
      fetchNotifications();
    };
    window.addEventListener("kandypack:order_placed", handleOrderPlaced);

    return () => {
      clearInterval(interval);
      window.removeEventListener("kandypack:order_placed", handleOrderPlaced);
    };
  }, [fetchNotifications]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionLoading(id);
    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Mark all unread as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/v1/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Filtered lists
  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.is_read || n.is_read === 0);
  }, [notifications]);

  const historyNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        !historySearch ||
        n.subject.toLowerCase().includes(historySearch.toLowerCase()) ||
        n.body_preview.toLowerCase().includes(historySearch.toLowerCase()) ||
        n.recipient.toLowerCase().includes(historySearch.toLowerCase()) ||
        (n.order_id && String(n.order_id).includes(historySearch));

      const isRead = Boolean(n.is_read);
      if (historyFilter === "unread") return matchesSearch && !isRead;
      if (historyFilter === "read") return matchesSearch && isRead;
      return matchesSearch;
    });
  }, [notifications, historySearch, historyFilter]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Slide-over Drawer Panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-emerald-100"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-white to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 leading-tight">
                        {userRole === "CUSTOMER" ? "Notifications" : "Operations & Dispatch Alerts"}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-medium text-emerald-700">
                          {userRole === "CUSTOMER" ? "Live Updates" : `${(userRole || "Operations").replace("_", " ")} Feed`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close sidebar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="mt-4 flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("unread")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${activeTab === "unread"
                        ? "bg-white text-emerald-800 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    <span>Live / Unread</span>
                    {unreadCount > 0 ? (
                      <span className="flex items-center justify-center px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-emerald-600 text-white">
                        {unreadCount}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center px-1.5 py-0.2 text-[10px] font-medium rounded-full bg-slate-200 text-slate-600">
                        0
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${activeTab === "history"
                        ? "bg-white text-emerald-800 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    <span>Alert History</span>
                    <span className="flex items-center justify-center px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-slate-200 text-slate-700">
                      {notifications.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Sub-Header Actions */}
              <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
                {activeTab === "unread" ? (
                  <>
                    <span className="text-slate-500 font-medium">
                      {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""} requiring attention
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        disabled={markingAll}
                        className="text-emerald-700 font-bold hover:text-emerald-900 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        {markingAll ? "Marking..." : "Mark all as read"}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full flex flex-col gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search history by tracking ID, customer, city..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 mr-1">Filter:</span>
                      {(["all", "unread", "read"] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setHistoryFilter(filter)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize cursor-pointer transition-colors ${historyFilter === filter
                              ? "bg-emerald-100 text-emerald-800 font-bold"
                              : "text-slate-500 hover:bg-slate-200"
                            }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {!isAuthenticated ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-200">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Sign In Required</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                      Logistics dispatch alerts and order histories are protected and only accessible to authorized accounts.
                    </p>
                    <Link
                      href="/?redirect=/orders"
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <span>Sign In to Access Alerts</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
                    <span>Loading real-time alerts...</span>
                  </div>
                ) : activeTab === "unread" ? (
                  // TAB 1: UNREAD ALERTS
                  unreadNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">All Caught Up!</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                        {userRole === "CUSTOMER"
                          ? "No unread notifications at the moment. All consignment updates are up to date."
                          : "No unread operational alerts at this moment."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("history")}
                        className="mt-4 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        View Alert History ({notifications.length})
                      </button>
                    </div>
                  ) : (
                    unreadNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-3.5 shadow-2xs transition-all hover:shadow-xs relative"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-200/80 text-emerald-800 shrink-0 mt-0.5">
                            <Train className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-bold text-xs text-slate-900 leading-snug">
                                {notif.subject}
                              </h4>
                              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            </div>

                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {notif.body_preview}
                            </p>

                            <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-emerald-800">
                              <div className="flex items-center gap-1 font-medium text-slate-500">
                                <Clock className="h-3 w-3" />
                                <span>{notif.timestamp}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleMarkAsRead(notif.id, e)}
                                  disabled={actionLoading === notif.id}
                                  className="font-bold text-emerald-700 hover:text-emerald-950 flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>{actionLoading === notif.id ? "Marking..." : "Mark Read"}</span>
                                </button>

                                {notif.order_id && (
                                  <Link
                                    href={`/orders/${notif.order_id}/track`}
                                    className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-0.5"
                                  >
                                    <span>Track</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  // TAB 2: ALERT HISTORY
                  historyNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <Package className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">No History Records Found</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Try adjusting your search query or filter.
                      </p>
                    </div>
                  ) : (
                    historyNotifications.map((notif) => {
                      const isRead = Boolean(notif.is_read);
                      return (
                        <div
                          key={notif.id}
                          className={`rounded-xl border p-3.5 transition-all text-xs ${isRead
                              ? "border-slate-200 bg-white hover:border-slate-300"
                              : "border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50"
                            }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isRead
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-emerald-200 text-emerald-900"
                                  }`}
                              >
                                {isRead ? "Read" : "Unread"}
                              </span>
                              {notif.order_id && (
                                <span className="font-mono text-[11px] font-bold text-slate-700">
                                  KP-{String(notif.order_id).padStart(5, "0")}
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] text-slate-400 font-medium">
                              {notif.timestamp}
                            </span>
                          </div>

                          <div className="mt-1.5 font-bold text-slate-900 leading-tight">
                            {notif.subject}
                          </div>

                          <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            {notif.body_preview}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 truncate max-w-[200px]">
                              {notif.recipient}
                            </span>

                            <div className="flex items-center gap-2">
                              {!isRead && (
                                <button
                                  type="button"
                                  onClick={(e) => handleMarkAsRead(notif.id, e)}
                                  disabled={actionLoading === notif.id}
                                  className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer disabled:opacity-50"
                                >
                                  {actionLoading === notif.id ? "Marking..." : "Mark Read"}
                                </button>
                              )}
                              {notif.order_id && (
                                <Link
                                  href={`/orders/${notif.order_id}/track`}
                                  className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-0.5"
                                >
                                  <span>Track</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCheck className="h-3 w-3 text-emerald-600" />
                  Live Sync Active
                </span>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh Feed
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Standalone Notification Bell Component with pulsing unread count badge.
 * Place in navbar or page headers to open the sidebar.
 */
export function NotificationBellButton({
  onClick,
  unreadCount = 0,
}: {
  onClick: () => void;
  unreadCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative p-2 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs"
      aria-label="Open Notifications"
      title="View Notifications"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-extrabold text-white shadow-xs animate-pulse">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
