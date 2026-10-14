"use client";

import { useEffect, useRef, useState } from "react";
import { Train } from "lucide-react";
import { assignWholeOrders, getLoadingList } from "@/lib/roster/api";
import type { CargoOrder, LoadingListData, TruckSchedule } from "@/lib/roster/types";

const reasons: Record<string, string> = {
  ORDER_NOT_FULLY_RECEIVED: "All ordered goods must be received at this station.",
  ORDER_ALREADY_ASSIGNED: "Already assigned to a truck schedule.",
  ORDER_ROUTE_MISMATCH: "Rail destination does not match the saved delivery route.",
  ORDER_CLOSED: "This order is closed.",
  INVALID_PRODUCT_WEIGHT: "A product needs a verified positive weight.",
  ORDER_DESTINATION_UNVERIFIED: "Delivery destination details are incomplete.",
};

export function OrderDetails({ order }: { order: CargoOrder }) {
  return <div>
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="font-semibold">Order #{order.order_id} · {order.customer_name}</p>
        <p className="mt-1 text-sm">{order.recipient_name} · {order.recipient_phone}</p>
        <p className="text-sm">{order.delivery_address}</p>
      </div>
      {order.trip_id && (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
          order.manifest_status === "RECEIVED"
            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
            : "bg-amber-50 text-amber-800 border-amber-300"
        }`}>
          <Train className="h-3 w-3" />
          <span>Train #{order.trip_id}</span>
        </span>
      )}
    </div>
    <p className="mt-1 text-sm text-text-muted">Delivery date: {order.delivery_date} · {order.assigned_weight_kg ?? order.weight_kg} kg</p>
    <ul className="mt-3 space-y-1 text-sm" aria-label={`Order ${order.order_id} products`}>
      {order.items.map((item) => <li key={item.order_item_id}>
        {item.product_name}: <strong>{item.ordered_quantity}</strong> ordered · {item.received_quantity} received
      </li>)}
    </ul>
    {order.blocked_reasons.length > 0 && <ul className="mt-3 text-sm text-text-muted">
      {order.blocked_reasons.map((reason) => <li key={reason}>{reasons[reason] ?? "This order is currently unavailable for assignment."}</li>)}
    </ul>}
  </div>;
}

export default function LoadingList({ schedule, demand, writable, onSaved, onClose }: {
  schedule: TruckSchedule; demand: CargoOrder[]; writable: boolean;
  onSaved: () => void; onClose: () => void;
}) {
  const [data, setData] = useState<LoadingListData | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const submitting = useRef(false);

  const [showIneligible, setShowIneligible] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getLoadingList(schedule.roster_id, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Loading list unavailable.");
    });
    return () => controller.abort();
  }, [schedule.roster_id, refresh]);

  const current = data?.schedule ?? schedule;
  const assigned = new Set(data?.orders.map((o) => o.order_id));
  const routeCandidates = demand.filter(
    (o) =>
      o.route_id === schedule.route_id &&
      !assigned.has(o.order_id) &&
      o.assigned_roster_id === null &&
      o.delivery_id === null &&
      !o.blocked_reasons?.includes("ORDER_ALREADY_ASSIGNED") &&
      !["DELIVERED", "COMPLETED", "CANCELLED"].includes((o.order_status || "").toUpperCase())
  );
  const eligibleCandidates = routeCandidates.filter(
    (o) => Boolean(o.eligible) && (!o.blocked_reasons || o.blocked_reasons.length === 0)
  );
  const ineligibleCount = routeCandidates.length - eligibleCandidates.length;

  const candidates = showIneligible ? routeCandidates : eligibleCandidates;
  const selectedWeight = candidates.filter((o) => selected.includes(o.order_id)).reduce((sum, o) => sum + Number(o.weight_kg), 0);
  const total = Number(current.cargo_weight_kg) + selectedWeight;
  const verified = current.capacity_unit === "KG";
  const canAssign = writable && current.status === "SCHEDULED" && verified && current.is_active;

  async function save() {
    if (submitting.current || !selected.length) return;
    submitting.current = true;
    setBusy(true);
    setMessage(null);
    try {
      await assignWholeOrders(schedule.roster_id, selected);
      setSelected([]);
      setMessage("Whole orders assigned to the planned loading list.");
      setRefresh((value) => value + 1);
      onSaved();
    } catch (error: unknown) {
      setMessage((error instanceof Error ? error.message : "Assignment unavailable.") + " Refresh the loading list before retrying the same selection.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <section className="glass mt-6 p-6" aria-labelledby="loading-title">
    <div className="flex flex-wrap justify-between gap-3">
      <h3 id="loading-title" className="text-xl">Planned loading list · Run #{schedule.roster_id}</h3>
      <button className="btn-secondary px-4 py-2" disabled={busy} onClick={onClose}>Close</button>
    </div>
    <p className="mt-2 text-sm">{current.station_name} · {current.route_name} · {current.plate_number}</p>
    <p className="mt-2 text-sm">{current.order_count} orders · {current.unit_count} units · {current.cargo_weight_kg} kg planned.</p>
    <p className="mt-1 text-sm text-text-muted">Capacity: {current.capacity} {verified ? "kg" : "(unit unverified)"}</p>
    <button className="btn-secondary mt-3 px-4 py-2" disabled={busy} onClick={() => setRefresh((value) => value + 1)}>Refresh loading list</button>
    {!data ? <p className="mt-5" role="status">Loading assigned orders…</p> : data.orders.length === 0 ? <p className="mt-5">No orders assigned yet.</p> :
      <ul className="mt-5 grid gap-5 md:grid-cols-2">{data.orders.map((order) => <li key={order.order_id} className="rounded-2xl border border-green-100 p-4"><OrderDetails order={order} /></li>)}</ul>}
    {writable && <div className="mt-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold">Add whole orders on this route</h4>
        {ineligibleCount > 0 && (
          <label className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showIneligible}
              onChange={(e) => setShowIneligible(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Show unreceived / pending orders ({ineligibleCount})</span>
          </label>
        )}
      </div>

      {!canAssign && <p className="mt-2 text-sm">{!verified ? "Verify the truck capacity unit before assigning orders." : "Only active trucks on scheduled runs accept orders."}</p>}

      {candidates.length === 0 ? (
        <div className="mt-3 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-sm text-text-muted">
          <p className="font-medium text-text-main">No orders currently ready for loading on this route.</p>
          {ineligibleCount > 0 && !showIneligible && (
            <p className="mt-1 text-xs text-slate-500">
              There are {ineligibleCount} order{ineligibleCount === 1 ? "" : "s"} on this route in the selected date range, but goods must be received at this station depot before they can be loaded onto a truck.
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {candidates.map((order) => (
            <li
              key={order.order_id}
              className={`rounded-2xl border p-4 ${
                order.eligible ? "border-green-100 bg-white" : "border-slate-200 bg-slate-50/60 opacity-80"
              }`}
            >
              <label className="mb-3 flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(order.order_id)}
                  disabled={busy || !canAssign || !order.eligible || !data}
                  onChange={(event) =>
                    setSelected((ids) =>
                      event.target.checked
                        ? [...ids, order.order_id]
                        : ids.filter((id) => id !== order.order_id)
                    )
                  }
                />
                <span className={order.eligible ? "font-medium" : "text-text-muted"}>
                  Select whole order #{order.order_id}
                </span>
                {!order.eligible && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Awaiting goods receipt
                  </span>
                )}
              </label>
              <OrderDetails order={order} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm" aria-live="polite">{selected.length} selected · planned total {total.toFixed(2)} kg</p>
      {verified && total > Number(current.capacity) && <p className="text-sm" role="alert">This selection exceeds truck capacity.</p>}
      <button className="btn-primary mt-3 px-6 py-3 disabled:opacity-50" onClick={save}
        disabled={busy || !canAssign || !data || !selected.length || total > Number(current.capacity)}>{busy ? "Assigning…" : "Assign whole orders"}</button>
    </div>}
    {message && <p role="status" className="mt-4 text-sm">{message}</p>}
  </section>;
}
