"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Train,
  Truck,
  Package,
  Layers,
  BarChart3,
  Clock,
  Users,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  LayoutGrid,
  Sliders,
  History,
  AlertTriangle,
  Boxes,
  User,
  ExternalLink,
  ChevronRight,
  Warehouse,
} from "lucide-react";
import {
  AlertsSidebar,
  LogisticsNotification,
} from "@/components/notifications/AlertsSidebar";
import { setAuthToken } from "@/lib/api";

export interface DashboardUser {
  user_id?: number;
  name?: string;
  email?: string;
  role?: string;
  station_id?: number | null;
  station_name?: string | null;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
}

interface DashboardSidebarProps {
  user?: DashboardUser | null;
  activeKey?: string;
  onTabChange?: (key: string) => void;
  roleOverride?: string;
  hubName?: string;
  customNavItems?: NavItem[];
}

export function DashboardSidebar({
  user: propUser,
  activeKey: propActiveKey,
  onTabChange,
  roleOverride,
  hubName: propHubName,
  customNavItems,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<DashboardUser | null>(propUser || null);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Sync propUser if it changes
  useEffect(() => {
    if (propUser) setUser(propUser);
  }, [propUser]);

  // Load user session if not provided
  useEffect(() => {
    if (!user) {
      fetch("/api/v1/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setUser(data);
        })
        .catch(() => {});
    }
  }, [user]);

  // Check saved theme
  useEffect(() => {
    const saved = localStorage.getItem("kp_sidebar_theme");
    if (saved === "dark" || saved === "light") {
      setThemeMode(saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    localStorage.setItem("kp_sidebar_theme", next);
  };

  // Poll notifications
  const loadNotifBadge = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications/recent?limit=10");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unread_count === "number") {
          setUnreadCount(data.unread_count);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadNotifBadge();
    const timer = setInterval(loadNotifBadge, 15000);
    return () => clearInterval(timer);
  }, [loadNotifBadge]);

  // Determine current active role strictly: 1) authenticated user.role, 2) roleOverride, 3) pathname inference, 4) CUSTOMER
  let resolvedRole = (user?.role || roleOverride || "").toUpperCase();
  if (!resolvedRole) {
    if (pathname?.startsWith("/admin/rail")) resolvedRole = "LOGISTICS_MGR";
    else if (pathname?.startsWith("/admin/roster")) resolvedRole = "DISPATCHER";
    else if (pathname?.startsWith("/admin/users") || pathname?.startsWith("/admin/reports")) resolvedRole = "SUPERADMIN";
    else if (pathname?.startsWith("/warehouse")) resolvedRole = "STORE_MGR";
    else if (pathname?.startsWith("/driver")) resolvedRole = "DRIVER";
    else resolvedRole = "CUSTOMER";
  }

  // Determine hub name according to role
  const displayHub =
    propHubName ||
    user?.station_name ||
    (resolvedRole === "LOGISTICS_MGR"
      ? "Rail Operations"
      : resolvedRole === "DISPATCHER"
      ? "Road Dispatch Hub"
      : resolvedRole === "STORE_MGR" || resolvedRole === "WAREHOUSE_STAFF"
      ? "Station Depot Store"
      : resolvedRole === "DRIVER" || resolvedRole === "ASSISTANT"
      ? "Delivery Run Fleet"
      : resolvedRole === "SUPERADMIN"
      ? "Head Office HQ"
      : "Colombo Central Hub");

  // Format member name
  const memberName = user?.name || "KandyPack Member";
  const memberInitials = (memberName || "KP")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    if (typeof window !== "undefined") {
      setAuthToken(null);
      document.cookie =
        "kandypack_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem("kandypack_user");
      localStorage.removeItem("kandypack_auth_token");
      sessionStorage.clear();
      window.location.href = "/login?switch=1";
    }
  };

  // Compute navigation items STRICTLY for each role
  let navItems: NavItem[] = [];

  if (customNavItems && customNavItems.length > 0) {
    navItems = customNavItems;
  } else if (resolvedRole === "LOGISTICS_MGR") {
    // Only rail multimodal freight allocation, trips, breakdown, and pending consignments
    navItems = [
      { id: "rail", label: "Rail Allocation", icon: Train, href: "/admin/rail" },
      { id: "trips", label: "Train Schedules", icon: Clock, href: "/admin/rail/trips" },
      { id: "breakdown", label: "Order Allocations", icon: Layers, href: "/admin/rail/breakdown" },
      { id: "orders", label: "Pending Consignments", icon: Package, href: "/admin/rail/orders" },
      { id: "profile", label: "My Profile & Security", icon: ShieldCheck, href: "/profile" },
    ];
  } else if (resolvedRole === "DISPATCHER") {
    // Last-mile delivery truck and driver rostering operations
    navItems = [
      { id: "roster", label: "Fleet Roster Planning", icon: Truck, href: "/admin/roster?tab=planning" },
      { id: "hours", label: "Weekly Staff Hours", icon: Clock, href: "/admin/roster?tab=hours" },
      { id: "history", label: "Accepted Assignment History", icon: History, href: "/admin/roster?tab=history" },
      { id: "resources", label: "Roster Resources", icon: Layers, href: "/admin/roster?tab=resources" },
      { id: "active", label: "Active Delivery Runs", icon: MapPin, href: "/driver?tab=active" },
      { id: "profile", label: "Dispatcher Profile", icon: User, href: "/profile" },
    ];
  } else if (resolvedRole === "STORE_MGR") {
    // Station store manager depot operations
    navItems = [
      { id: "manifests", label: "Inbound Train Manifests", icon: Train, href: "/warehouse?tab=manifests" },
      { id: "inventory", label: "Station Stock & Storage Bins", icon: Layers, href: "/warehouse?tab=inventory" },
      { id: "adjustments", label: "Stock Adjustments", icon: AlertTriangle, href: "/warehouse?tab=adjustments" },
      { id: "reports", label: "Depot Loss & Reports", icon: BarChart3, href: "/warehouse?tab=reports" },
      { id: "profile", label: "Store Manager Profile", icon: User, href: "/profile" },
    ];
  } else if (resolvedRole === "WAREHOUSE_STAFF" || resolvedRole === "STORE_CLERK" || resolvedRole === "WAREHOUSE") {
    // Warehouse floor staff bin management
    navItems = [
      { id: "inventory", label: "Station Stock & Storage Bins", icon: Layers, href: "/warehouse?tab=inventory" },
      { id: "manifests", label: "Inbound Manifests", icon: Train, href: "/warehouse?tab=manifests" },
      { id: "adjustments", label: "Stock Adjustments", icon: AlertTriangle, href: "/warehouse?tab=adjustments" },
      { id: "profile", label: "Staff Profile", icon: User, href: "/profile" },
    ];
  } else if (resolvedRole === "DRIVER" || resolvedRole === "ASSISTANT") {
    // Delivery drivers and vehicle crew
    navItems = [
      { id: "active", label: "Active Delivery Stops", icon: Truck, href: "/driver?tab=active" },
      { id: "completed", label: "Completed Deliveries", icon: CheckCircle2, href: "/driver?tab=completed" },
      { id: "vehicle", label: "Assigned Truck & Route", icon: MapPin, href: "/driver?tab=vehicle" },
      { id: "guide", label: "Handover Guidelines", icon: FileText, href: "/driver?tab=guide" },
      { id: "profile", label: "Driver Profile", icon: User, href: "/profile" },
    ];
  } else if (resolvedRole === "SUPERADMIN") {
    // Head office administrator: staff provisioning, executive analytics & global oversight
    navItems = [
      { id: "users", label: "Staff Directory & Security", icon: Users, href: "/admin/users" },
      { id: "reports", label: "Executive Analytics & Reports", icon: BarChart3, href: "/admin/reports" },
      { id: "rail", label: "Rail Operations Overview", icon: Train, href: "/admin/rail" },
      { id: "roster", label: "Fleet Rostering Overview", icon: Truck, href: "/admin/roster" },
      { id: "warehouse", label: "Station Depots Overview", icon: Warehouse, href: "/warehouse" },
      { id: "profile", label: "Superadmin Console", icon: ShieldCheck, href: "/profile" },
    ];
  } else {
    // CUSTOMER
    navItems = [
      { id: "active", label: "Active Shipments", icon: Package, href: "/orders" },
      { id: "history", label: "Order History", icon: History, href: "/orders?view=history" },
      { id: "book", label: "Book Rail Freight", icon: Plus, href: "/order/new" },
      { id: "tracking", label: "Live Consignment Tracking", icon: Search, href: "/orders?view=tracking" },
      { id: "profile", label: "Customer Profile", icon: User, href: "/profile" },
    ];
  }

  // Active key calculation
  const currentActiveKey =
    propActiveKey ||
    (pathname?.includes("/warehouse")
      ? (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") || "inventory" : "inventory")
      : pathname?.includes("/driver")
      ? (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") || "active" : "active")
      : pathname?.includes("/admin/rail/trips")
      ? "trips"
      : pathname?.includes("/admin/rail/breakdown")
      ? "breakdown"
      : pathname?.includes("/admin/rail/orders")
      ? "orders"
      : pathname?.includes("/admin/rail")
      ? "rail"
      : pathname?.includes("/admin/roster")
      ? (typeof window !== "undefined"
          ? (() => {
              const tab = new URLSearchParams(window.location.search).get("tab");
              if (tab === "hours" || tab === "history" || tab === "resources") return tab;
              return "roster";
            })()
          : "roster")
      : pathname?.includes("/admin/reports")
      ? "reports"
      : pathname?.includes("/admin/users")
      ? "users"
      : pathname?.includes("/profile")
      ? "profile"
      : pathname?.includes("/order/new")
      ? "book"
      : "active");

  const isDark = themeMode === "dark";

  // Sidebar Render Component (shared between Desktop & Mobile Drawer)
  const SidebarContent = () => (
    <div
      className={`flex h-full w-[310px] select-none text-sm transition-colors duration-200 ${
        isDark
          ? "bg-[#1b5e43] text-emerald-50 border-r border-[#144733]"
          : "bg-white text-slate-700 border-r border-slate-200 shadow-sm"
      }`}
    >
      {/* ── RAIL 1: Slim Left Vertical Icon Bar (~70px) ── */}
      <div
        className={`flex w-[70px] shrink-0 flex-col items-center justify-between py-5 border-r ${
          isDark ? "border-[#164e37] bg-[#17523a]" : "border-slate-100 bg-[#f8fafc]/90"
        }`}
      >
        {/* Top: Brand Logo + Primary category icons */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo */}
          <Link
            href="/"
            title="Kandypack Logistics"
            className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform hover:scale-105"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 text-white shadow-md shadow-green-600/30">
              <Train className="h-5 w-5" />
            </div>
          </Link>

          {/* Primary View Icons */}
          <div className="flex flex-col items-center gap-3 w-full px-2">
            {/* Overview / Primary Action */}
            {navItems[0] && (
              <button
                onClick={() => {
                  if (navItems[0]?.onClick) navItems[0].onClick();
                  else if (navItems[0]?.href) router.push(navItems[0].href);
                }}
                title={navItems[0]?.label || "Primary View"}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all cursor-pointer ${
                  currentActiveKey === navItems[0].id
                    ? isDark
                      ? "!bg-white !text-[#1b5e43] shadow-md shadow-black/10 font-bold"
                      : "!bg-[#1d6349] !text-white shadow-md shadow-green-900/15"
                    : isDark
                    ? "!text-emerald-200/80 hover:!bg-white/10 hover:!text-white"
                    : "!text-slate-500 hover:!bg-slate-200/60 hover:!text-slate-900"
                }`}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
            )}

            {/* Operations / Secondary View */}
            {navItems[1] && (
              <button
                onClick={() => {
                  if (navItems[1]?.onClick) navItems[1].onClick();
                  else if (navItems[1]?.href) router.push(navItems[1].href);
                }}
                title={navItems[1]?.label || "Secondary View"}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                  currentActiveKey === navItems[1].id
                    ? isDark
                      ? "!bg-white !text-[#1b5e43] shadow-md shadow-black/10 font-bold"
                      : "!bg-[#1d6349] !text-white shadow-md shadow-green-900/15"
                    : isDark
                    ? "!text-emerald-200/80 hover:!bg-white/10 hover:!text-white"
                    : "!text-slate-500 hover:!bg-slate-200/60 hover:!text-slate-900"
                }`}
              >
                <Sliders className="h-4 w-4" />
              </button>
            )}

            {/* Consignments / Third View */}
            {navItems[2] && (
              <button
                onClick={() => {
                  if (navItems[2]?.onClick) navItems[2].onClick();
                  else if (navItems[2]?.href) router.push(navItems[2].href);
                }}
                title={navItems[2]?.label || "Consignments"}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                  currentActiveKey === navItems[2].id
                    ? isDark
                      ? "!bg-white !text-[#1b5e43] shadow-md shadow-black/10 font-bold"
                      : "!bg-[#1d6349] !text-white shadow-md shadow-green-900/15"
                    : isDark
                    ? "!text-emerald-200/80 hover:!bg-white/10 hover:!text-white"
                    : "!text-slate-500 hover:!bg-slate-200/60 hover:!text-slate-900"
                }`}
              >
                <Boxes className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Utilities */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {/* Subtle line divider */}
          <div
            className={`w-8 border-b mb-1 ${
              isDark ? "border-[#20684a]" : "border-slate-200"
            }`}
          />

          {/* Settings / Profile link */}
          <Link
            href="/profile"
            title="Profile & Settings"
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              isDark
                ? "text-emerald-200 hover:bg-white/10 hover:text-white"
                : "text-slate-500 hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <Settings className="h-4 w-4" />
          </Link>

          {/* Notifications Bell */}
          <button
            onClick={() => setNotificationsOpen(true)}
            title="Notifications & Alerts"
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
              isDark
                ? "text-emerald-200 hover:bg-white/10 hover:text-white"
                : "text-slate-500 hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </button>

          {/* Vertical Theme Toggle Capsule Pill (matching reference image) */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Crisp Light theme" : "Switch to Deep Forest Emerald theme"}
            className={`flex h-14 w-8 flex-col items-center justify-between rounded-full py-1.5 transition-all cursor-pointer ${
              isDark
                ? "border border-emerald-400/30 bg-[#123e2a] text-emerald-200"
                : "border border-slate-300 bg-white text-slate-500 shadow-xs"
            }`}
          >
            <Sun
              className={`h-3.5 w-3.5 transition-opacity ${
                !isDark ? "text-amber-500 opacity-100" : "opacity-40"
              }`}
            />
            <Moon
              className={`h-3.5 w-3.5 transition-opacity ${
                isDark ? "text-emerald-200 opacity-100" : "opacity-40"
              }`}
            />
          </button>

          {/* Member Profile Avatar */}
          <Link
            href="/profile"
            title={`${memberName} (${resolvedRole})`}
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-green-600 to-emerald-400 text-white font-bold text-xs ring-2 ring-white/60 shadow-sm"
          >
            {memberInitials}
          </Link>
        </div>
      </div>

      {/* ── RAIL 2: Right Navigation & Details Panel (~240px) ── */}
      <div className="flex flex-1 flex-col justify-between p-4 overflow-y-auto">
        {/* Top: Hub Selector Pill & Navigation Links */}
        <div className="flex flex-col gap-5">
          {/* Workspace / Hub pill (matching "Neurotime +" from reference) */}
          <div
            className={`flex items-center justify-between px-3.5 py-2 rounded-full border transition-all ${
              isDark
                ? "border-emerald-500/40 bg-[#164e37]/70 text-emerald-100"
                : "border-slate-200 bg-slate-50 text-slate-800 shadow-xs"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-semibold text-xs truncate max-w-[140px]">
                {displayHub}
              </span>
            </div>
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isDark
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              +
            </div>
          </div>

          {/* Navigation Item List */}
          <nav className="flex flex-col gap-1.5" aria-label="Dashboard sections">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentActiveKey === item.id;

              const handleClick = (e: React.MouseEvent) => {
                if (onTabChange) {
                  e.preventDefault();
                  onTabChange(item.id);
                  setIsMobileOpen(false);
                } else if (item.onClick) {
                  e.preventDefault();
                  item.onClick();
                  setIsMobileOpen(false);
                } else {
                  setIsMobileOpen(false);
                }
              };

              return (
                <Link
                  key={item.id}
                  href={item.href || "#"}
                  onClick={handleClick}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-medium transition-all group !no-underline ${
                    isActive
                      ? isDark
                        ? "!bg-white !text-[#154c36] font-bold shadow-md shadow-black/10"
                        : "!bg-[#1d6349] !text-white font-bold shadow-sm"
                      : isDark
                      ? "!text-emerald-100/90 hover:!bg-white/10 hover:!text-white"
                      : "!text-slate-700 hover:!bg-slate-100 hover:!text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? isDark
                            ? "!text-[#154c36]"
                            : "!text-white"
                          : isDark
                          ? "!text-emerald-200/80"
                          : "!text-slate-500 group-hover:!text-slate-700"
                      }`}
                    />
                    <span
                      className={`truncate ${
                        isActive
                          ? isDark
                            ? "!text-[#154c36] font-bold"
                            : "!text-white font-bold"
                          : isDark
                          ? "!text-emerald-100/90 group-hover:!text-white"
                          : "!text-slate-700 group-hover:!text-slate-900"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? isDark
                            ? "!bg-[#154c36]/15 !text-[#154c36]"
                            : "!bg-white/20 !text-white"
                          : isDark
                          ? "!bg-emerald-800 !text-emerald-200"
                          : "!bg-slate-200 !text-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Section Divider */}
          <div
            className={`border-b ${
              isDark ? "border-[#20684a]" : "border-slate-200"
            }`}
          />

          {/* Secondary Quick Links */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setNotificationsOpen(true)}
              className={`flex items-center justify-between px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer !no-underline ${
                isDark
                  ? "!text-emerald-200/85 hover:!bg-white/10 hover:!text-white"
                  : "!text-slate-600 hover:!bg-slate-100 hover:!text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`h-4 w-4 shrink-0 ${isDark ? "text-emerald-300" : "text-slate-500"}`} />
                <span className={isDark ? "!text-emerald-100/90" : "!text-slate-700"}>Live Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-bold text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── BOTTOM CARD: Member Details (matching reference "Upgrade Plan" card) ── */}
        <div
          className={`rounded-2xl p-3.5 border transition-all mt-4 ${
            isDark
              ? "border-emerald-400/40 bg-[#144933]/90 text-emerald-100"
              : "border-green-300 bg-gradient-to-b from-green-50 to-[#d8f3dc]/80 text-slate-800 shadow-xs"
          }`}
        >
          <div className="text-center mb-3">
            <p className="text-[11px] font-medium leading-tight">
              {resolvedRole.replace("_", " ")} Portal
            </p>
            <p className="text-xs font-bold truncate mt-0.5 text-text-heading">
              {memberName}
            </p>
            <p className="text-[10px] text-text-muted truncate mt-0.5">
              {user?.email || "Authenticated Session"}
            </p>
          </div>

          {/* Action button inside card (styled like [Upgrade Plan] in reference) */}
          <button
            onClick={handleLogout}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isDark
                ? "bg-white text-[#154c36] hover:bg-emerald-50 shadow-sm"
                : "bg-[#1d6349] text-white hover:bg-green-800 shadow-sm shadow-green-900/10"
            }`}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR: Fits 100% device height (h-screen / h-[100dvh]), sticky ── */}
      <aside className="hidden lg:flex h-screen shrink-0 sticky top-0 z-30 select-none overflow-hidden">
        <SidebarContent />
      </aside>

      {/* ── MOBILE HEADER BAR: When on smaller screens ── */}
      <header
        className={`lg:hidden fixed top-0 left-0 right-0 h-14 z-40 px-4 flex items-center justify-between border-b ${
          isDark
            ? "bg-[#1b5e43] border-[#144733] text-white"
            : "bg-white border-slate-200 text-slate-900"
        } shadow-xs backdrop-blur-md`}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open navigation sidebar"
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
            }`}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 font-bold text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600 text-white">
              <Train className="h-4 w-4" />
            </div>
            <span>Kandypack</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotificationsOpen(true)}
            className="p-2 rounded-xl relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          <Link
            href="/profile"
            className="h-7 w-7 rounded-full bg-green-600 text-white text-[11px] font-bold flex items-center justify-center"
          >
            {memberInitials}
          </Link>
        </div>
      </header>

      {/* ── MOBILE DRAWER MODAL ── */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-10 flex h-full max-w-[310px] animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </div>

          {/* Close button outside drawer */}
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close sidebar drawer"
            className="relative z-10 ml-2 mt-3 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ── NOTIFICATIONS POPUP DRAWER ── */}
      <AlertsSidebar
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNotificationsUpdated={(cnt) => setUnreadCount(cnt)}
      />
    </>
  );
}
