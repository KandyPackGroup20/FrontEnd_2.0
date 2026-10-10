"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Train,
  Package,
  Calendar,
  History,
  Shield,
  ChevronDown,
  ChevronUp,
  MapPin,
  DollarSign,
  Layers,
  AlertTriangle,
  BarChart3,
  LogOut,
} from "lucide-react";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import GradientBlobs from "@/components/ui/GradientBlobs";
import { apiFetch, describeError, ApiError, getAuthToken, setAuthToken } from "@/lib/api";

// These ids match station_store in the database (06_seed_data.sql).
const STATIONS = [
  { id: 1, name: "Colombo" },
  { id: 2, name: "Negombo" },
  { id: 3, name: "Galle" },
  { id: 4, name: "Matara" },
  { id: 5, name: "Jaffna" },
  { id: 6, name: "Trincomalee" },
  { id: 7, name: "Kandy" },
];

const STANDARD_REASONS = [
  "Damaged during unloading - crushed carton",
  "Missing item - short shipment from train",
  "Water / moisture damage in storage",
  "Quality rejection / expired packaging",
  "Audit recount - inventory surplus found",
  "Audit recount - inventory shortage found",
  "Custom Reason...",
];

type StockRow = {
  inventory_id: number;
  station_id: number;
  station_city: string;
  product_id: number;
  product_name: string;
  unit_price: number;
  space_consumption_rate: number;
  stored_quantity: number;
  bin_code: string | null;
  bin_type: string | null;
  last_updated: string;
};

type ManifestRow = {
  manifest_id: number;
  station_id: number;
  destination_station: string;
  trip_id: number;
  departure_datetime: string;
  arrival_datetime: string;
  train_status: string;
  manifest_status: "PENDING" | "RECEIVED";
  received_at: string | null;
};

type CargoItem = {
  trip_id: number;
  order_item_id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  allocated_quantity: number;
  allocated_space: number;
  space_consumption_rate: number;
};

type BinOption = {
  location_id: number;
  station_id: number;
  location_code: string;
  location_type: string;
};

type AdjustmentRow = {
  adjustment_id: number;
  inventory_id: number;
  quantity_delta: number;
  reason: string;
  adjusted_by: number | null;
  adjusted_at: string;
};

type ReportOverview = {
  total_distinct_products: number;
  total_stored_units: number;
  total_inventory_value_lkr: number;
  total_damaged_or_lost_units: number;
  total_loss_value_lkr: number;
};

type AdjustmentBreakdown = {
  station_id: number;
  station_city: string;
  product_id: number;
  product_name: string;
  unit_price: number;
  reason: string;
  total_adjustment_events: number;
  net_quantity_delta: number;
  total_units_damaged_or_lost: number;
  total_loss_value: number;
  first_adjustment_at: string;
  latest_adjustment_at: string;
};

type ReportSummary = {
  overview: ReportOverview;
  breakdown: AdjustmentBreakdown[];
};

type Banner = { type: "success" | "error"; text: string } | null;

export default function WarehousePage() {
  const [stationId, setStationId] = useState(1);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [manifests, setManifests] = useState<ManifestRow[]>([]);
  const [manifestsNote, setManifestsNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<Banner>(null);

  // Report #6 Summary State
  const [summaryReport, setSummaryReport] = useState<ReportSummary | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Train Cargo preview state
  const [expandedTripId, setExpandedTripId] = useState<number | null>(null);
  const [cargoItems, setCargoItems] = useState<Record<number, CargoItem[]>>({});
  const [loadingCargoTripId, setLoadingCargoTripId] = useState<number | null>(null);

  // Available bins and editing state (FR-4.4.6)
  const [availableBins, setAvailableBins] = useState<BinOption[]>([]);
  const [editingBinInvId, setEditingBinInvId] = useState<number | null>(null);
  const [assigningBin, setAssigningBin] = useState(false);

  // Authenticated Employee Profile
  const [operator, setOperator] = useState<{
    name: string;
    role: "STORE_MGR" | "WAREHOUSE_STAFF";
    email: string;
  }>({
    name: "Sunil Colombo Store Mgr",
    role: "STORE_MGR",
    email: "store.colombo@kandypack.lk",
  });

  // Receive a manifest
  const [receivingTripId, setReceivingTripId] = useState<number | null>(null);

  // Adjustment form
  const [adjustInventoryId, setAdjustInventoryId] = useState("");
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReasonPreset, setAdjustReasonPreset] = useState(STANDARD_REASONS[0]);
  const [adjustReasonCustom, setAdjustReasonCustom] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Adjustment history (open for one stock row at a time)
  const [historyFor, setHistoryFor] = useState<number | null>(null);
  const [history, setHistory] = useState<AdjustmentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetches stock + manifests + available bins + Report 6 summary for the chosen station.
  const fetchStationData = useCallback(async (id: number) => {
    const [stockResult, manifestResult, binsResult, reportResult] = await Promise.allSettled([
      apiFetch<{ inventory: StockRow[] }>(`/inventory/?station_id=${id}`),
      apiFetch<{ manifests: ManifestRow[] }>(`/inventory/manifests?station_id=${id}`),
      apiFetch<{ bins: BinOption[] }>(`/inventory/bins?station_id=${id}`),
      apiFetch<ReportSummary>(`/inventory/reports/summary?station_id=${id}`),
    ]);

    if (stockResult.status === "rejected") throw stockResult.reason;
    setStock(stockResult.value.inventory);

    if (manifestResult.status === "fulfilled") {
      setManifests(manifestResult.value.manifests);
      setManifestsNote(null);
    } else {
      setManifests([]);
      const reason = manifestResult.reason;
      setManifestsNote(
        reason instanceof ApiError && reason.status === 403
          ? "Train manifests are only visible to Store Managers."
          : describeError(reason)
      );
    }

    if (binsResult.status === "fulfilled") {
      setAvailableBins(binsResult.value.bins);
    }

    if (reportResult.status === "fulfilled") {
      setSummaryReport(reportResult.value);
    }
  }, []);



  // Check active user session on load and fetch station data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch currently authenticated profile from backend
        const user = await apiFetch<{
          user_id: number;
          name: string;
          email: string;
          role: "STORE_MGR" | "WAREHOUSE_STAFF" | string;
        }>("/auth/me");

        let initialStationId = stationId;
        const emailLower = (user.email || "").toLowerCase();
        if (emailLower.includes("galle")) initialStationId = 3;
        else if (emailLower.includes("colombo")) initialStationId = 1;
        else if (emailLower.includes("negombo")) initialStationId = 2;
        else if (emailLower.includes("matara")) initialStationId = 4;
        else if (emailLower.includes("jaffna")) initialStationId = 5;
        else if (emailLower.includes("trinco")) initialStationId = 6;
        else if (emailLower.includes("kandy")) initialStationId = 7;

        if (!cancelled) {
          setStationId(initialStationId);
          setOperator({
            name: user.name,
            role: user.role === "WAREHOUSE_STAFF" ? "WAREHOUSE_STAFF" : "STORE_MGR",
            email: user.email,
          });
        }

        await fetchStationData(initialStationId);
        if (!cancelled) setBanner(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // If not authenticated, redirect to login
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }
        if (!cancelled) setBanner({ type: "error", text: describeError(err) });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stationId, fetchStationData]);


  function handleStationChange(id: number) {
    setLoading(true);
    setHistoryFor(null);
    setAdjustInventoryId("");
    setStationId(id);
  }

  async function reloadStation() {
    try {
      await fetchStationData(stationId);
    } catch (err) {
      setBanner({ type: "error", text: describeError(err) });
    }
  }

  async function toggleCargoPreview(tripId: number) {
    if (expandedTripId === tripId) {
      setExpandedTripId(null);
      return;
    }
    setExpandedTripId(tripId);
    if (!cargoItems[tripId]) {
      setLoadingCargoTripId(tripId);
      try {
        const res = await apiFetch<{ items: CargoItem[] }>(
          `/inventory/manifests/${tripId}/items`
        );
        setCargoItems((prev) => ({ ...prev, [tripId]: res.items }));
      } catch (err) {
        setBanner({ type: "error", text: describeError(err) });
      } finally {
        setLoadingCargoTripId(null);
      }
    }
  }

  async function handleAssignBin(inventoryId: number, locationId: number | null) {
    setAssigningBin(true);
    setBanner(null);
    try {
      const res = await apiFetch<{ message: string; inventory: StockRow }>(
        `/inventory/${inventoryId}/bin`,
        {
          method: "PUT",
          body: JSON.stringify({ location_id: locationId }),
        }
      );
      setStock((prev) =>
        prev.map((row) =>
          row.inventory_id === inventoryId ? { ...row, ...res.inventory } : row
        )
      );
      setEditingBinInvId(null);
      setBanner({
        type: "success",
        text: `Bin location updated successfully!`,
      });
    } catch (err) {
      setBanner({ type: "error", text: describeError(err) });
    } finally {
      setAssigningBin(false);
    }
  }

  async function handleReceive(tripId: number) {
    setReceivingTripId(tripId);
    setBanner(null);
    try {
      await apiFetch("/inventory/manifests/receive", {
        method: "POST",
        body: JSON.stringify({ station_id: stationId, trip_id: tripId }),
      });
      setBanner({
        type: "success",
        text: `Train manifest for Trip #${tripId} confirmed received! Station stock updated and allocated customer orders marked as ARRIVED AT STATION STORE.`,
      });
      await reloadStation();
    } catch (err) {
      setBanner({ type: "error", text: describeError(err) });
    } finally {
      setReceivingTripId(null);
    }
  }

  async function loadHistory(inventoryId: number) {
    // Clicking the same History link again closes it.
    if (historyFor === inventoryId) {
      setHistoryFor(null);
      return;
    }
    setHistoryFor(inventoryId);
    setHistoryLoading(true);
    try {
      const res = await apiFetch<{ adjustments: AdjustmentRow[] }>(
        `/inventory/adjustments/${inventoryId}`
      );
      setHistory(res.adjustments);
    } catch (err) {
      setBanner({ type: "error", text: describeError(err) });
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    const delta = Number(adjustDelta);

    const finalReason =
      adjustReasonPreset === "Custom Reason..."
        ? adjustReasonCustom.trim()
        : adjustReasonPreset;

    if (!adjustInventoryId || !adjustDelta || !finalReason) {
      setBanner({ type: "error", text: "Please choose a product, a quantity, and a reason." });
      return;
    }
    if (!Number.isInteger(delta) || delta === 0) {
      setBanner({ type: "error", text: "Quantity must be a whole number and cannot be 0." });
      return;
    }

    // Negative stock guard: prevent stock level from dropping below 0
    const selectedItem = stock.find((item) => item.inventory_id === Number(adjustInventoryId));
    if (selectedItem && delta < 0 && Math.abs(delta) > selectedItem.stored_quantity) {
      setBanner({
        type: "error",
        text: `Cannot reduce stock by ${Math.abs(delta)}. Current stored quantity is only ${selectedItem.stored_quantity}. Negative warehouse stock is prohibited.`,
      });
      return;
    }

    setAdjustSubmitting(true);
    setBanner(null);
    try {
      const res = await apiFetch<{ new_stored_quantity: number }>("/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify({
          inventory_id: Number(adjustInventoryId),
          quantity_delta: delta,
          reason: finalReason,
        }),
      });
      setBanner({
        type: "success",
        text: `Adjustment saved. New stock level: ${res.new_stored_quantity}.`,
      });
      setAdjustDelta("");
      setAdjustReasonCustom("");
      await reloadStation();

      // Refresh the open history panel if it belongs to this product.
      if (historyFor === Number(adjustInventoryId)) {
        const h = await apiFetch<{ adjustments: AdjustmentRow[] }>(
          `/inventory/adjustments/${historyFor}`
        );
        setHistory(h.adjustments);
      }
    } catch (err) {
      setBanner({ type: "error", text: describeError(err) });
    } finally {
      setAdjustSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <GradientBlobs />

      {/* Top header */}
      <div className="relative mx-auto max-w-6xl mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-text-heading no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
            <Train className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Kandypack</span>
        </Link>
        <span className="caption">Staff · Warehouse</span>
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Authenticated Employee Profile Bar */}
        <div className="glass-sm mb-6 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-green-200/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-green-700 flex items-center gap-1.5">
                <span>Active Portal Session</span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="font-bold text-green-800">
                  {operator.role === "STORE_MGR" ? "Store Manager" : "Warehouse Staff"}
                </span>
              </div>
              <div className="text-sm font-bold text-text-heading">
                {operator.name} <span className="text-xs font-normal text-text-muted">({operator.email})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await apiFetch("/auth/logout", { method: "POST" });
                } catch {}
                setAuthToken(null);
                if (typeof window !== "undefined") {
                  window.location.href = "/login";
                }
              }}
              className="text-xs px-3.5 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Title + station picker */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-heading">
              Warehouse &amp; Station Inventory
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Receive train shipments and keep station stock accurate.
            </p>
          </div>

          <div className="w-full md:w-56">
            <label htmlFor="station" className="input-label">
              Station
            </label>
            <select
              id="station"
              className={`input ${(operator.role === "STORE_MGR" || operator.role === "WAREHOUSE_STAFF") ? "opacity-80 bg-slate-100 cursor-not-allowed" : ""}`}
              value={stationId}
              disabled={operator.role === "STORE_MGR" || operator.role === "WAREHOUSE_STAFF"}
              onChange={(e) => handleStationChange(Number(e.target.value))}
            >
              {STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {(operator.role === "STORE_MGR" || operator.role === "WAREHOUSE_STAFF") && (
              <span className="text-[11px] text-text-muted mt-1 block">
                Assigned station for your account
              </span>
            )}
          </div>
        </div>

        {/* Success / error banner */}
        {banner && (
          <div
            role="status"
            className={`glass-sm mb-6 px-4 py-3 text-sm font-medium ${
              banner.type === "success" ? "text-green-700" : "text-status-issue"
            }`}
          >
            {banner.text}
          </div>
        )}

        {/* Store Manager Report #6 KPI Summary Cards */}
        {summaryReport && (
          <section className="mb-6 space-y-4" aria-labelledby="report-summary-title">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <h2 id="report-summary-title" className="text-base font-bold text-text-heading">
                  Station Inventory &amp; Operations Overview
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBreakdown((prev) => !prev)}
                className="text-xs font-semibold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {showBreakdown ? (
                  <>
                    Hide Audit Breakdown <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    View Audit Breakdown <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="glass-sm p-4 border border-green-200/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted">Total Stock Value</span>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight text-text-heading">
                  LKR {Number(summaryReport.overview.total_inventory_value_lkr).toLocaleString()}
                </div>
                <span className="text-[11px] text-text-muted">
                  {summaryReport.overview.total_distinct_products} active products
                </span>
              </div>

              <div className="glass-sm p-4 border border-green-200/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted">Stored Units</span>
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight text-text-heading">
                  {Number(summaryReport.overview.total_stored_units).toLocaleString()}
                </div>
                <span className="text-[11px] text-text-muted">Physical shelf stock</span>
              </div>

              <div className="glass-sm p-4 border border-green-200/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted">Damaged / Lost</span>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight text-amber-700">
                  {Number(summaryReport.overview.total_damaged_or_lost_units).toLocaleString()}
                </div>
                <span className="text-[11px] text-text-muted">Total written-off units</span>
              </div>

              <div className="glass-sm p-4 border border-green-200/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted">Financial Loss</span>
                  <Layers className="h-4 w-4 text-red-600" />
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight text-status-issue">
                  LKR {Number(summaryReport.overview.total_loss_value_lkr).toLocaleString()}
                </div>
                <span className="text-[11px] text-text-muted">Written-off merchandise</span>
              </div>
            </div>

            {/* Expandable Report #6 Audit Breakdown Table */}
            {showBreakdown && (
              <div className="glass p-4 border border-green-200">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Stock Adjustment &amp; Discrepancy Breakdown
                  </h3>
                  <span className="text-xs text-text-muted">
                    {summaryReport.breakdown.length} discrepancy records
                  </span>
                </div>
                {summaryReport.breakdown.length === 0 ? (
                  <p className="text-xs text-text-muted py-2">
                    No damage or discrepancy records found for this station.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-green-100 text-text-muted">
                          <th className="pb-2 font-semibold">Product</th>
                          <th className="pb-2 font-semibold">Reported Reason</th>
                          <th className="pb-2 font-semibold text-center">Incidents</th>
                          <th className="pb-2 font-semibold text-right">Lost Units</th>
                          <th className="pb-2 font-semibold text-right">Financial Loss (LKR)</th>
                          <th className="pb-2 font-semibold text-right">Latest Incident</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-50">
                        {summaryReport.breakdown.map((item, idx) => (
                          <tr key={`${item.product_id}-${item.reason}-${idx}`} className="hover:bg-green-50/50">
                            <td className="py-2.5 font-medium text-text-heading">
                              {item.product_name}
                              <span className="block text-[10px] text-text-muted">
                                Unit: LKR {item.unit_price}
                              </span>
                            </td>
                            <td className="py-2.5 text-text-body">{item.reason}</td>
                            <td className="py-2.5 text-center font-medium">
                              {item.total_adjustment_events}
                            </td>
                            <td className="py-2.5 text-right font-semibold text-amber-700">
                              {item.total_units_damaged_or_lost}
                            </td>
                            <td className="py-2.5 text-right font-bold text-status-issue">
                              LKR {Number(item.total_loss_value).toLocaleString()}
                            </td>
                            <td className="py-2.5 text-right text-text-muted text-[11px]">
                              {item.latest_adjustment_at}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Incoming manifests */}
          <section className="glass p-6" aria-labelledby="manifests-title">
            <h2 id="manifests-title" className="mb-4 text-lg font-semibold text-text-heading">
              Incoming Train Manifests
            </h2>

              {loading && <p className="text-sm text-text-muted">Loading...</p>}
              {!loading && manifestsNote && (
                <p className="text-sm text-text-muted">{manifestsNote}</p>
              )}
              {!loading && !manifestsNote && manifests.length === 0 && (
                <p className="text-sm text-text-muted">No manifests for this station yet.</p>
              )}

              <ul className="space-y-3">
                {manifests.map((m) => {
                  const isExpanded = expandedTripId === m.trip_id;
                  const items = cargoItems[m.trip_id] || [];
                  const isLoadingCargo = loadingCargoTripId === m.trip_id;

                  return (
                    <li
                      key={m.manifest_id}
                      className="glass-sm p-4 transition-all"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-text-heading">
                            <Train className="h-4 w-4 text-green-600" />
                            Trip #{m.trip_id} from Kandy
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                            <Calendar className="h-3.5 w-3.5" />
                            {m.departure_datetime} to {m.arrival_datetime}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCargoPreview(m.trip_id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-green-200 hover:bg-green-50 text-green-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                            {isExpanded ? "Hide Cargo" : "Inspect Cargo"}
                          </button>

                          <StatusPill
                            status={m.manifest_status === "RECEIVED" ? "delivered" : "pending"}
                            label={m.manifest_status === "RECEIVED" ? "Received" : "Pending"}
                          />
                          {m.manifest_status === "PENDING" && (
                            <Button
                              size="sm"
                              onClick={() => handleReceive(m.trip_id)}
                              disabled={receivingTripId === m.trip_id}
                            >
                              {receivingTripId === m.trip_id ? "Receiving..." : "Receive"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Collapsible Cargo Items Preview */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-green-100 text-xs">
                          <div className="font-semibold text-text-heading mb-2 flex items-center justify-between">
                            <span>Allocated Train Cargo (Order Items):</span>
                            {items.length > 0 && (
                              <span className="text-text-muted font-normal">
                                Total Space:{" "}
                                {items
                                  .reduce((acc, it) => acc + Number(it.allocated_space), 0)
                                  .toFixed(2)}{" "}
                                m³
                              </span>
                            )}
                          </div>

                          {isLoadingCargo && <p className="text-text-muted">Loading cargo items...</p>}
                          {!isLoadingCargo && items.length === 0 && (
                            <p className="text-text-muted italic">No items allocated to this train trip.</p>
                          )}
                          {!isLoadingCargo && items.length > 0 && (
                            <div className="space-y-1.5 bg-white/60 rounded-xl p-2.5 border border-green-100">
                              {items.map((it, idx) => (
                                <div
                                  key={`cargo-${it.trip_id}-${it.order_item_id}-${idx}`}
                                  className="flex justify-between items-center text-text-body"
                                >
                                  <div>
                                    <span className="font-medium">{it.product_name}</span>
                                    <span className="text-text-muted ml-1.5 text-[11px]">
                                      (Order #{it.order_id})
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-green-700">
                                      {it.allocated_quantity} units
                                    </span>
                                    <span className="text-text-muted ml-2 text-[11px]">
                                      ({it.allocated_space} m³)
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

          {/* Station stock */}
          <section className="glass p-6" aria-labelledby="stock-title">
            <h2 id="stock-title" className="mb-4 text-lg font-semibold text-text-heading">
              Station Stock &amp; Storage Bins
            </h2>

            {loading && <p className="text-sm text-text-muted">Loading...</p>}
            {!loading && stock.length === 0 && (
              <p className="text-sm text-text-muted">No stock recorded at this station yet.</p>
            )}

            <ul className="space-y-3">
              {stock.map((row) => (
                <li key={row.inventory_id} className="glass-sm p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-heading">
                          {row.product_name}
                        </div>
                        <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3 w-3 text-green-600" />
                          <span>Bin:</span>
                          {editingBinInvId === row.inventory_id ? (
                            <div className="flex items-center gap-1">
                              <select
                                className="text-xs py-0.5 px-1.5 rounded border border-green-400 bg-white"
                                defaultValue={
                                  row.bin_code
                                    ? availableBins.find((b) => b.location_code === row.bin_code)?.location_id ?? ""
                                    : ""
                                }
                                onChange={(e) =>
                                  handleAssignBin(
                                    row.inventory_id,
                                    e.target.value ? Number(e.target.value) : null
                                  )
                                }
                                disabled={assigningBin}
                              >
                                <option value="">-- No Bin (Unbind) --</option>
                                {availableBins.map((b) => (
                                  <option key={b.location_id} value={b.location_id}>
                                    {b.location_code} ({b.location_type})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setEditingBinInvId(null)}
                                className="text-[11px] text-text-muted hover:text-text-heading px-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-medium px-1.5 py-0.5 rounded text-[11px] ${
                                  row.bin_code
                                    ? "bg-green-100 text-green-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {row.bin_code ?? "Unassigned"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingBinInvId(row.inventory_id)}
                                className="text-[11px] text-green-600 hover:text-green-700 underline font-medium cursor-pointer"
                              >
                                {row.bin_code ? "Change" : "Assign Bin"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="tabular-nums text-xl font-bold text-text-heading">
                        {row.stored_quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => loadHistory(row.inventory_id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-500"
                      >
                        <History className="h-3 w-3" />
                        {historyFor === row.inventory_id ? "Hide history" : "History"}
                      </button>
                    </div>
                  </div>

                  {historyFor === row.inventory_id && (
                    <div className="mt-3 space-y-1.5 border-t border-green-100 pt-3">
                      {historyLoading && (
                        <p className="text-xs text-text-muted">Loading history...</p>
                      )}
                      {!historyLoading && history.length === 0 && (
                        <p className="text-xs text-text-muted">No adjustments logged yet.</p>
                      )}
                      {!historyLoading &&
                        history.map((h) => (
                          <div
                            key={h.adjustment_id}
                            className="flex justify-between gap-4 text-xs text-text-body"
                          >
                            <span>
                              {h.reason}
                              <span className="ml-2 text-text-muted">{h.adjusted_at}</span>
                            </span>
                            <span
                              className={`tabular-nums font-semibold ${
                                h.quantity_delta < 0 ? "text-status-issue" : "text-green-600"
                              }`}
                            >
                              {h.quantity_delta > 0 ? "+" : ""}
                              {h.quantity_delta}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Log a stock adjustment */}
        <section className="glass mt-6 p-6" aria-labelledby="adjust-title">
          <h2 id="adjust-title" className="mb-1 text-lg font-semibold text-text-heading">
            Log a Stock Adjustment
          </h2>
          <p className="mb-5 text-sm text-text-muted">
            For damaged, missing, or recounted stock. A positive number adds stock, a negative
            number removes it.
          </p>

          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="adjust-product" className="input-label">
                  Product
                </label>
                <select
                  id="adjust-product"
                  className="input"
                  value={adjustInventoryId}
                  onChange={(e) => setAdjustInventoryId(e.target.value)}
                >
                  <option value="">Select a product...</option>
                  {stock.map((row) => (
                    <option key={row.inventory_id} value={row.inventory_id}>
                      {row.product_name} (Current: {row.stored_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="adjust-qty" className="input-label">
                  Quantity (+ adds, - removes)
                </label>
                <input
                  id="adjust-qty"
                  type="number"
                  step="1"
                  className="input"
                  placeholder="-5 or 20"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="adjust-reason-select" className="input-label">
                  Reason Preset
                </label>
                <select
                  id="adjust-reason-select"
                  className="input"
                  value={adjustReasonPreset}
                  onChange={(e) => setAdjustReasonPreset(e.target.value)}
                >
                  {STANDARD_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {adjustReasonPreset === "Custom Reason..." && (
              <div>
                <label htmlFor="adjust-reason-custom" className="input-label">
                  Custom Discrepancy Reason
                </label>
                <input
                  id="adjust-reason-custom"
                  type="text"
                  className="input"
                  placeholder="Detail the specific audit finding or damage cause..."
                  value={adjustReasonCustom}
                  onChange={(e) => setAdjustReasonCustom(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" className="w-full sm:w-auto" disabled={adjustSubmitting}>
                {adjustSubmitting ? "Saving..." : "Save Adjustment"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}