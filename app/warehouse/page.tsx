"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Train, Package, Calendar, History } from "lucide-react";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import GradientBlobs from "@/components/ui/GradientBlobs";
import { apiFetch, describeError, ApiError } from "@/lib/api";

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

type AdjustmentRow = {
  adjustment_id: number;
  inventory_id: number;
  quantity_delta: number;
  reason: string;
  adjusted_by: number | null;
  adjusted_at: string;
};

type Banner = { type: "success" | "error"; text: string } | null;

export default function WarehousePage() {
  const [stationId, setStationId] = useState(1);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [manifests, setManifests] = useState<ManifestRow[]>([]);
  const [manifestsNote, setManifestsNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<Banner>(null);

  // Receive a manifest
  const [receivingTripId, setReceivingTripId] = useState<number | null>(null);

  // Adjustment form
  const [adjustInventoryId, setAdjustInventoryId] = useState("");
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Adjustment history (open for one stock row at a time)
  const [historyFor, setHistoryFor] = useState<number | null>(null);
  const [history, setHistory] = useState<AdjustmentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetches stock + manifests for the chosen station.
  // Stock is required. Manifests are optional: Warehouse Staff may view stock
  // but only Store Managers may view manifests, so a 403 there is not fatal.
  const fetchStationData = useCallback(async (id: number) => {
    const [stockResult, manifestResult] = await Promise.allSettled([
      apiFetch<{ inventory: StockRow[] }>(`/inventory/?station_id=${id}`),
      apiFetch<{ manifests: ManifestRow[] }>(`/inventory/manifests?station_id=${id}`),
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
  }, []);

  // Load data whenever the station changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchStationData(stationId);
        if (!cancelled) setBanner(null);
      } catch (err) {
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
        text: `Trip #${tripId} received. Station stock has been updated.`,
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

    if (!adjustInventoryId || !adjustDelta || !adjustReason.trim()) {
      setBanner({ type: "error", text: "Please choose a product, a quantity, and a reason." });
      return;
    }
    if (!Number.isInteger(delta) || delta === 0) {
      setBanner({ type: "error", text: "Quantity must be a whole number and cannot be 0." });
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
          reason: adjustReason.trim(),
        }),
      });
      setBanner({
        type: "success",
        text: `Adjustment saved. New stock level: ${res.new_stored_quantity}.`,
      });
      setAdjustDelta("");
      setAdjustReason("");
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
              className="input"
              value={stationId}
              onChange={(e) => handleStationChange(Number(e.target.value))}
            >
              {STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
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
              {manifests.map((m) => (
                <li
                  key={m.manifest_id}
                  className="glass-sm flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
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

                  <div className="flex items-center gap-3">
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
                </li>
              ))}
            </ul>
          </section>

          {/* Station stock */}
          <section className="glass p-6" aria-labelledby="stock-title">
            <h2 id="stock-title" className="mb-4 text-lg font-semibold text-text-heading">
              Station Stock
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
                        <div className="text-xs text-text-muted">
                          Bin: {row.bin_code ?? "Not yet binned"}
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

          <form onSubmit={handleAdjustSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                    {row.product_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adjust-qty" className="input-label">
                Quantity
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
              <label htmlFor="adjust-reason" className="input-label">
                Reason
              </label>
              <input
                id="adjust-reason"
                type="text"
                className="input"
                placeholder="e.g. water damage"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={adjustSubmitting}>
                {adjustSubmitting ? "Saving..." : "Save Adjustment"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}