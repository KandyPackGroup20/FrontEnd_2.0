"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Award,
  MapPin,
  Train,
  Clock,
  Truck,
  Package,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Database,
  BarChart3,
  X,
} from "lucide-react";

type ReportRow = Record<string, any>;

type Column = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

interface ReportDefinition {
  id: string;
  title: string;
  shortTitle: string;
  category: "Sales & Revenue" | "Logistics & Rail" | "Fleet & Operations" | "Inventory" | "Compliance";
  description: string;
  endpoint: string;
  icon: typeof TrendingUp;
  columns: Column[];
}

const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "quarterly-sales",
    title: "1. Quarterly Sales by Route and Product",
    shortTitle: "Quarterly Sales",
    category: "Sales & Revenue",
    description: "Consolidated sales volume and revenue segmented by delivery route and quarterly sales cycles.",
    endpoint: "/api/v1/reports/quarterly-sales",
    icon: TrendingUp,
    columns: [
      { key: "sales_year", label: "Year", align: "center" },
      { key: "sales_quarter", label: "Quarter", align: "center" },
      { key: "route_name", label: "Route" },
      { key: "product_name", label: "Product" },
      { key: "total_quantity", label: "Quantity Sold", align: "right" },
      { key: "total_sales", label: "Total Sales (LKR)", align: "right" },
    ],
  },
  {
    id: "top-products",
    title: "2. Top-Selling Products per Quarter",
    shortTitle: "Top Products",
    category: "Sales & Revenue",
    description: "Ranked list of best-performing products by quarterly demand volume and revenue generated.",
    endpoint: "/api/v1/reports/top-products",
    icon: Award,
    columns: [
      { key: "sales_year", label: "Year", align: "center" },
      { key: "sales_quarter", label: "Quarter", align: "center" },
      { key: "product_name", label: "Product Name" },
      { key: "total_quantity", label: "Volume Sold", align: "right" },
      { key: "total_sales", label: "Revenue (LKR)", align: "right" },
      { key: "product_rank", label: "Rank", align: "center" },
    ],
  },
  {
    id: "city-route-sales",
    title: "3. Regional City & Route Sales Volume",
    shortTitle: "City & Route Sales",
    category: "Sales & Revenue",
    description: "Regional distribution of order volume and financial throughput across delivery routes.",
    endpoint: "/api/v1/reports/city-route-sales",
    icon: MapPin,
    columns: [
      { key: "city_name", label: "Regional Hub" },
      { key: "route_name", label: "Delivery Route" },
      { key: "total_quantity", label: "Units Sold", align: "right" },
      { key: "total_sales", label: "Total Sales (LKR)", align: "right" },
    ],
  },
  {
    id: "rail-capacity",
    title: "4. Rail Freight Capacity Utilisation",
    shortTitle: "Rail Capacity",
    category: "Logistics & Rail",
    description: "Monthly train wagon payload capacity, allocated cargo volume, and remaining cubic space.",
    endpoint: "/api/v1/reports/rail-capacity-utilisation",
    icon: Train,
    columns: [
      { key: "destination_hub", label: "Destination Hub" },
      { key: "dep_year", label: "Year", align: "center" },
      { key: "dep_month", label: "Month", align: "center" },
      { key: "total_capacity", label: "Total Space", align: "right" },
      { key: "allocated_capacity", label: "Allocated", align: "right" },
      { key: "remaining_capacity", label: "Remaining", align: "right" },
      { key: "utilization_percentage", label: "Utilisation %", align: "center" },
    ],
  },
  {
    id: "workforce-hours",
    title: "5. Workforce Duty Hours vs 40h/60h Cap",
    shortTitle: "Workforce Hours",
    category: "Fleet & Operations",
    description: "Weekly accumulated hours for delivery drivers and assistants with regulatory hour caps.",
    endpoint: "/api/v1/reports/workforce-hours",
    icon: Clock,
    columns: [
      { key: "delivery_staff_id", label: "Staff ID", align: "center" },
      { key: "staff_name", label: "Staff Member" },
      { key: "staff_role", label: "Role" },
      { key: "accumulated_hours", label: "Work Hours", align: "right" },
      { key: "weekly_cap", label: "Weekly Cap", align: "right" },
      { key: "utilization_pct", label: "Cap %", align: "center" },
      { key: "status_flag", label: "Compliance Status", align: "center" },
    ],
  },
  {
    id: "truck-utilisation",
    title: "6. Truck Fleet Utilisation & Runs",
    shortTitle: "Truck Fleet",
    category: "Fleet & Operations",
    description: "Operating vehicle fleet efficiency, completed delivery runs, and operational service hours.",
    endpoint: "/api/v1/reports/truck-utilisation",
    icon: Truck,
    columns: [
      { key: "truck_id", label: "Truck ID", align: "center" },
      { key: "plate_number", label: "Plate Number" },
      { key: "total_delivery_runs", label: "Delivery Runs", align: "right" },
      { key: "total_routes", label: "Routes Covered", align: "right" },
      { key: "total_operating_hours", label: "Operating Hours", align: "right" },
    ],
  },
  {
    id: "station-inventory",
    title: "7. Station Inventory & Stock Adjustments",
    shortTitle: "Station Inventory",
    category: "Inventory",
    description: "Regional depot storage holdings, physical count adjustments, and verified net inventory.",
    endpoint: "/api/v1/reports/station-inventory",
    icon: Package,
    columns: [
      { key: "station", label: "Station Store" },
      { key: "product_name", label: "Product" },
      { key: "stored_quantity", label: "Stored Qty", align: "right" },
      { key: "positive_adjustments", label: "(+) Inflow", align: "right" },
      { key: "negative_adjustments", label: "(-) Outflow", align: "right" },
      { key: "net_adjustment", label: "Net Adjust", align: "right" },
      { key: "adjusted_stock", label: "Adjusted Stock", align: "right" },
    ],
  },
  {
    id: "audit-logs",
    title: "8. Roster Audit & Compliance Trail",
    shortTitle: "Audit Logs",
    category: "Compliance",
    description: "Immutable audit log trail of dispatcher assignments, state transitions, and validation events.",
    endpoint: "/api/v1/reports/audit-logs",
    icon: ShieldCheck,
    columns: [
      { key: "log_id", label: "Log #", align: "center" },
      { key: "dispatcher_id", label: "Actor / Dispatcher", align: "center" },
      { key: "attempt_timestamp", label: "Timestamp" },
      { key: "status", label: "Outcome", align: "center" },
      { key: "violation_rule", label: "Action / Rule" },
      { key: "details", label: "Entity Details" },
    ],
  },
];

function getFirstArray(data: any): ReportRow[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) return value as ReportRow[];
    }
  }
  return [];
}

async function fetchReport(url: string): Promise<ReportRow[]> {
  try {
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = await response.json();
    return getFirstArray(data);
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err);
    return [];
  }
}

function exportToCsv(filename: string, columns: Column[], rows: ReportRow[]) {
  if (!rows || rows.length === 0) return;
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = row[c.key] ?? "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function renderCellContent(key: string, value: any) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">-</span>;
  }

  // Format currency amounts
  if (key === "total_sales" || key === "revenue") {
    const num = Number(value);
    if (!isNaN(num)) {
      return (
        <span className="font-semibold text-slate-800">
          Rs. {num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    }
  }

  // Format status badges
  if (key === "status_flag" || key === "status") {
    const s = String(value).toUpperCase();
    if (s === "SAFE" || s === "ACCEPTED" || s === "RECEIVED" || s === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
          {s}
        </span>
      );
    }
    if (s === "WARNING_NEAR_CAP" || s === "PENDING" || s === "IN_TRANSIT" || s === "WARNING") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
          {s}
        </span>
      );
    }
    if (s === "CAP_REACHED" || s === "FAILED" || s === "CANCELLED" || s === "CRITICAL") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
        {s}
      </span>
    );
  }

  // Format Rank
  if (key === "product_rank") {
    const rank = Number(value);
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 shadow-sm">
          🏆 Rank #1
        </span>
      );
    }
    return <span className="font-medium text-slate-700">#{rank}</span>;
  }

  // Format Percentages
  if (key === "utilization_percentage" || key === "utilization_pct") {
    const pct = parseFloat(String(value));
    const isHigh = pct >= 90;
    const isMedium = pct >= 75;
    return (
      <div className="inline-flex items-center gap-2">
        <span
          className={`font-semibold ${
            isHigh ? "text-rose-700" : isMedium ? "text-amber-700" : "text-emerald-700"
          }`}
        >
          {pct.toFixed(1)}%
        </span>
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${
              isHigh ? "bg-rose-500" : isMedium ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

export default function ReportsPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Store data by report ID
  const [reportsData, setReportsData] = useState<Record<string, ReportRow[]>>({});
  const [activeReportId, setActiveReportId] = useState<string>("quarterly-sales");

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Load all reports
  async function loadAllReports() {
    try {
      setError("");
      const results: Record<string, ReportRow[]> = {};
      await Promise.all(
        REPORT_DEFINITIONS.map(async (def) => {
          const rows = await fetchReport(def.endpoint);
          results[def.id] = rows;
        })
      );
      setReportsData(results);
    } catch (err) {
      console.error(err);
      setError("Failed to load management reports from the backend database.");
    }
  }

  // Initial Auth & Load
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const authResponse = await fetch("/api/v1/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!authResponse.ok) {
          router.replace("/login?redirect=/admin/reports");
          return;
        }

        const user = await authResponse.json();
        if (user.role !== "SUPERADMIN") {
          router.replace("/profile");
          return;
        }

        setAuthorized(true);
        await loadAllReports();
      } catch (err) {
        console.error(err);
        setError("Unable to authenticate or communicate with backend.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAllReports();
    setRefreshing(false);
  }

  // Active Report Definition
  const activeReport = useMemo(() => {
    return (
      REPORT_DEFINITIONS.find((r) => r.id === activeReportId) ||
      REPORT_DEFINITIONS[0]
    );
  }, [activeReportId]);

  // Raw rows for active report
  const rawRows = useMemo(() => {
    return reportsData[activeReport.id] || [];
  }, [reportsData, activeReport.id]);

  // Reset page and sort when switching report
  function handleSelectReport(id: string) {
    setActiveReportId(id);
    setSearchQuery("");
    setPage(1);
    setSortKey(null);
    setSortDir("asc");
  }

  // Filter & Sort
  const processedRows = useMemo(() => {
    let rows = [...rawRows];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    // Sort
    if (sortKey) {
      rows.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === "asc" ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDir === "asc"
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return rows;
  }, [rawRows, searchQuery, sortKey, sortDir]);

  // Pagination calculation
  const totalRows = processedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const paginatedRows = useMemo(() => {
    return processedRows.slice(startIndex, endIndex);
  }, [processedRows, startIndex, endIndex]);

  function handleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  // Filtered list of reports on the sidebar
  const filteredReportDefs = useMemo(() => {
    if (!sidebarSearch.trim()) return REPORT_DEFINITIONS;
    const q = sidebarSearch.toLowerCase();
    return REPORT_DEFINITIONS.filter(
      (r) =>
        r.shortTitle.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [sidebarSearch]);

  if (!authorized && loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
          <p className="text-sm font-semibold text-slate-700">
            Verifying Superadmin Authorization...
          </p>
        </div>
      </main>
    );
  }

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/60 via-slate-50 to-white px-3 pb-8 pt-24 md:px-6 md:pt-28">
      <div className="mx-auto max-w-[1600px]">
        {/* Top Header Bar */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-emerald-100/70 pb-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-100/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <BarChart3 className="h-3.5 w-3.5 text-emerald-700" />
                Enterprise Analytics
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 shadow-sm">
                <Database className="h-3 w-3 text-emerald-600" />
                MySQL 8.0 (3NF Core)
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Management Reports & Analytics
            </h1>
            <p className="text-sm text-slate-600">
              Interactive operational intelligence, freight capacity, and fleet utilization metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-60"
              title="Refresh reports data from database"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
              <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
            </button>

            <button
              onClick={() =>
                exportToCsv(activeReport.id, activeReport.columns, processedRows)
              }
              disabled={processedRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              title="Export current filtered view to CSV file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Master-Detail Layout: Sidebar + Fit-to-Page Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left Sidebar: Report Navigator */}
          <aside className="lg:col-span-3 xl:col-span-3">
            <div className="flex flex-col rounded-2xl border border-emerald-100/80 bg-white/80 p-4 shadow-sm backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Layers className="h-3.5 w-3.5 text-emerald-600" />
                  Report Catalog
                </span>
                <span className="rounded-md bg-emerald-100/60 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  {REPORT_DEFINITIONS.length} Reports
                </span>
              </div>

              {/* Sidebar Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter reports..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {sidebarSearch && (
                  <button
                    onClick={() => setSidebarSearch("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Report List */}
              <nav className="flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-1" aria-label="Management Reports">
                {filteredReportDefs.map((def) => {
                  const Icon = def.icon;
                  const isActive = def.id === activeReportId;
                  const count = reportsData[def.id]?.length ?? 0;

                  return (
                    <button
                      key={def.id}
                      onClick={() => handleSelectReport(def.id)}
                      className={`group flex items-start gap-3 rounded-xl p-2.5 text-left transition-all ${
                        isActive
                          ? "border border-emerald-300 bg-gradient-to-r from-emerald-50 via-emerald-100/40 to-white text-emerald-950 shadow-sm"
                          : "border border-transparent hover:border-emerald-100 hover:bg-emerald-50/40 text-slate-700"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`truncate text-xs font-bold ${isActive ? "text-emerald-950" : "text-slate-900"}`}>
                            {def.shortTitle}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                              isActive
                                ? "bg-emerald-200/80 text-emerald-900 font-bold"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {count}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-slate-500">
                          {def.category}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {filteredReportDefs.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No matching reports found.
                  </p>
                )}
              </nav>

              {/* Sidebar Footer Info */}
              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Engine:</span>
                  <span className="font-semibold text-slate-700">PyMySQL / Relational</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>Pagination:</span>
                  <span className="font-semibold text-emerald-700">Scalable Client/Server</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Panel: Selected Report Table with Pagination */}
          <section className="lg:col-span-9 xl:col-span-9">
            <div className="flex flex-col rounded-2xl border border-emerald-100/90 bg-white shadow-sm">
              {/* Report Header Bar */}
              <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/70 via-white to-white px-5 py-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        {activeReport.category}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {totalRows} {totalRows === 1 ? "Record" : "Records"} Total
                      </span>
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-slate-900 md:text-xl">
                      {activeReport.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {activeReport.description}
                    </p>
                  </div>

                  {/* Search within Report */}
                  <div className="relative min-w-[240px] md:min-w-[280px]">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search in ${activeReport.shortTitle}...`}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setPage(1);
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fit-to-page Contained Table Body */}
              <div className="overflow-x-auto overflow-y-auto max-h-[58vh] min-h-[300px]">
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                      <p className="text-xs font-semibold text-slate-500">Loading Report Rows...</p>
                    </div>
                  </div>
                ) : paginatedRows.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
                      <SlidersHorizontal className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {searchQuery
                        ? `No matching records found for "${searchQuery}"`
                        : "No data available in this report"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {searchQuery
                        ? "Try adjusting your search query or clear the filter."
                        : "Data will appear once operations generate records."}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-3 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Clear Search Filter
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 border-b border-emerald-100/90 bg-emerald-50/90 shadow-sm backdrop-blur-md">
                      <tr>
                        {activeReport.columns.map((col) => {
                          const isSorted = sortKey === col.key;
                          return (
                            <th
                              key={col.key}
                              onClick={() => handleSort(col.key)}
                              className={`cursor-pointer select-none px-4 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-100/60 ${
                                col.align === "right"
                                  ? "text-right"
                                  : col.align === "center"
                                  ? "text-center"
                                  : "text-left"
                              }`}
                            >
                              <div
                                className={`inline-flex items-center gap-1.5 ${
                                  col.align === "right"
                                    ? "flex-row-reverse"
                                    : col.align === "center"
                                    ? "justify-center"
                                    : ""
                                }`}
                              >
                                <span>{col.label}</span>
                                {isSorted ? (
                                  sortDir === "asc" ? (
                                    <ArrowUp className="h-3 w-3 text-emerald-700" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3 text-emerald-700" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="transition-colors hover:bg-emerald-50/30 odd:bg-white even:bg-slate-50/40"
                        >
                          {activeReport.columns.map((col) => (
                            <td
                              key={col.key}
                              className={`px-4 py-3.5 text-slate-700 ${
                                col.align === "right"
                                  ? "text-right font-mono"
                                  : col.align === "center"
                                  ? "text-center"
                                  : "text-left"
                              }`}
                            >
                              {renderCellContent(col.key, row[col.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Scalable Pagination Footer */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:flex-row">
                {/* Left: Row Counts info */}
                <div className="text-xs text-slate-600">
                  {totalRows > 0 ? (
                    <>
                      Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{" "}
                      <span className="font-bold text-slate-900">{endIndex}</span> of{" "}
                      <span className="font-bold text-slate-900">{totalRows}</span> entries
                      {searchQuery && (
                        <span className="text-slate-500"> (filtered from {rawRows.length} total)</span>
                      )}
                    </>
                  ) : (
                    "0 entries"
                  )}
                </div>

                {/* Right: Rows per page & Navigation Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Rows per page selector */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <label htmlFor="pageSizeSelect" className="font-medium text-slate-500">
                      Rows:
                    </label>
                    <select
                      id="pageSizeSelect"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(1)}
                      disabled={currentPage <= 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white"
                      title="First Page"
                      aria-label="First page"
                    >
                      <ChevronsLeft className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white"
                      title="Previous Page"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - currentPage) <= 1
                        )
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          const showEllipsis = prev && p - prev > 1;

                          return (
                            <span key={p} className="flex items-center">
                              {showEllipsis && (
                                <span className="px-1 text-slate-400">…</span>
                              )}
                              <button
                                onClick={() => setPage(p)}
                                className={`h-7 min-w-[28px] rounded-lg px-2 text-xs font-bold transition ${
                                  currentPage === p
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {p}
                              </button>
                            </span>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white"
                      title="Next Page"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={currentPage >= totalPages}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white"
                      title="Last Page"
                      aria-label="Last page"
                    >
                      <ChevronsRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}