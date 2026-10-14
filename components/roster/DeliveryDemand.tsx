"use client";

import { useEffect, useState } from "react";
import { Train, CheckCircle2, Clock, PackageCheck, AlertCircle, ArrowRight } from "lucide-react";
import { getCargoDemand, getCargoSchedules, getCargoStores, getIncomingTrainTrips } from "@/lib/roster/api";
import type { CargoOrder, IncomingTrainTrip, RosterCandidates, StationStore, TruckSchedule } from "@/lib/roster/types";
import AssignmentForm from "./AssignmentForm";
import LoadingList, { OrderDetails } from "./LoadingList";

const times = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

export default function DeliveryDemand({ catalog, range, writable, onCreated }: {
  catalog: RosterCandidates; range: { from: string; to: string }; writable: boolean; onCreated: () => void;
}) {
  const [tab, setTab] = useState<"demand" | "trains" | "schedules">("demand");
  const [stores, setStores] = useState<StationStore[]>([]);
  const [station, setStation] = useState("");
  const [orders, setOrders] = useState<CargoOrder[]>([]);
  const [schedules, setSchedules] = useState<TruckSchedule[]>([]);
  const [incomingTrips, setIncomingTrips] = useState<IncomingTrainTrip[]>([]);
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const [loadedStation, setLoadedStation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getCargoStores(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setStores(result);
      setStation((current) => current || String(result[0]?.station_id ?? ""));
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Stores unavailable.");
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!station) return;
    const controller = new AbortController();
    const fromDate = range.from.slice(0, 10);
    const toDate = new Date(Date.parse(`${range.to.slice(0, 10)}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
    Promise.all([
      getCargoDemand(Number(station), fromDate, toDate, controller.signal),
      getCargoSchedules(Number(station), { from: range.from, to: range.to }, controller.signal),
      getIncomingTrainTrips(Number(station), controller.signal),
    ]).then(([demand, runs, trips]) => {
      if (controller.signal.aborted) return;
      setOrders(demand);
      setSchedules(runs);
      setIncomingTrips(trips);
      setLoadedStation(station);
      setMessage(null);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Delivery planning unavailable.");
    });
    return () => controller.abort();
  }, [station, range.from, range.to, refresh]);

  const [hideScheduledDemand, setHideScheduledDemand] = useState(false);
  const [onlyEligibleDemand, setOnlyEligibleDemand] = useState(false);

  function chooseStore(value: string) {
    setStation(value);
    setLoadedStation("");
    setSelectedRun(null);
    setMessage(null);
  }

  let displayedOrders = orders;
  if (hideScheduledDemand) {
    displayedOrders = displayedOrders.filter(
      (o) =>
        o.assigned_roster_id === null &&
        o.delivery_id === null &&
        !o.blocked_reasons?.includes("ORDER_ALREADY_ASSIGNED")
    );
  }
  if (onlyEligibleDemand) {
    displayedOrders = displayedOrders.filter((o) => o.eligible);
  }

  const groups = new Map<string, CargoOrder[]>();
  for (const order of displayedOrders) {
    const key = `${order.route_id}:${order.delivery_date}`;
    groups.set(key, [...(groups.get(key) ?? []), order]);
  }
  const run = schedules.find((schedule) => schedule.roster_id === selectedRun);

  return <section className="mb-10" aria-label="Delivery planning">
    <label className="mb-5 grid max-w-lg gap-2 text-sm font-semibold">Station store
      <select className="input" value={station} onChange={(event) => chooseStore(event.target.value)}>
        <option value="">Select station store</option>{stores.map((store) => <option key={store.station_id} value={store.station_id}>{store.station_name}</option>)}
      </select>
    </label>
    <div role="tablist" aria-label="Delivery planning views" className="mb-5 flex flex-wrap gap-3">
      <button role="tab" aria-selected={tab === "demand"} aria-controls="demand-panel" id="demand-tab" className={tab === "demand" ? "btn-primary px-5 py-3" : "btn-secondary px-5 py-3"} onClick={() => setTab("demand")}>Delivery demand ({orders.length})</button>
      <button role="tab" aria-selected={tab === "trains"} aria-controls="trains-panel" id="trains-tab" className={tab === "trains" ? "btn-primary px-5 py-3 flex items-center gap-2" : "btn-secondary px-5 py-3 flex items-center gap-2"} onClick={() => setTab("trains")}>
        <Train className="h-4 w-4" />
        <span>Arriving Freight Trains ({incomingTrips.length})</span>
      </button>
      <button role="tab" aria-selected={tab === "schedules"} aria-controls="schedules-panel" id="schedules-tab" className={tab === "schedules" ? "btn-primary px-5 py-3" : "btn-secondary px-5 py-3"} onClick={() => setTab("schedules")}>Truck schedules ({schedules.length})</button>
    </div>
    {message && <div role="alert" className="glass mb-5 p-5"><p>{message}</p><button className="btn-secondary mt-3 px-4 py-2" onClick={() => setRefresh((value) => value + 1)}>Retry</button></div>}
    {station && loadedStation !== station && !message && <p role="status">Loading delivery demand and schedules…</p>}
    
    {/* Tab 1: Delivery Demand */}
    {tab === "demand" && loadedStation === station && station && <div role="tabpanel" id="demand-panel" aria-labelledby="demand-tab">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-text-muted hover:text-text-main">
          <input
            type="checkbox"
            checked={hideScheduledDemand}
            onChange={(e) => setHideScheduledDemand(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span>Hide orders already scheduled to a truck</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-text-muted hover:text-text-main">
          <input
            type="checkbox"
            checked={onlyEligibleDemand}
            onChange={(e) => setOnlyEligibleDemand(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span>Only show orders received & eligible for dispatch</span>
        </label>
      </div>
      {groups.size === 0 ? <p className="glass p-6">No orders for this station in the selected week.</p> : [...groups].map(([group, rows]) => <section key={group} className="mb-6">
        <h3 className="mb-3 text-lg font-semibold">{rows[0].route_name} · {rows[0].delivery_date}</h3>
        <ul className="grid gap-4 md:grid-cols-2">{rows.map((order) => <li key={order.order_id} className="glass p-5">
          <OrderDetails order={order} />
          <div className="mt-4 pt-3 border-t border-surface-glass-border flex flex-wrap items-center justify-between gap-2 text-xs">
            {order.trip_id ? (
              <span className="flex items-center gap-1.5 text-text-muted">
                <Train className="h-3.5 w-3.5 text-green-600" />
                <span>Train Trip #{order.trip_id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${order.manifest_status === "RECEIVED" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"}`}>
                  {order.manifest_status === "RECEIVED" ? "Received at Depot" : "In Transit / Awaiting Arrival"}
                </span>
              </span>
            ) : (
              <span className="text-text-muted">Direct Station Stock</span>
            )}
            <p className="font-semibold">{order.eligible ? <span className="text-emerald-700">✓ Eligible for truck assignment</span> : order.assigned_roster_id ? `Planned on run #${order.assigned_roster_id}` : <span className="text-amber-700">Awaiting eligibility</span>}</p>
          </div>
        </li>)}</ul>
      </section>)}
    </div>}

    {/* Tab 2: Arriving Freight Trains */}
    {tab === "trains" && loadedStation === station && station && <div role="tabpanel" id="trains-panel" aria-labelledby="trains-tab">
      <div className="mb-4">
        <p className="text-xs text-text-muted">Inter-hub freight train trips scheduled from Kandy Central Goods Shed to this regional station store.</p>
      </div>
      {incomingTrips.length === 0 ? (
        <p className="glass p-6">No incoming freight trains recorded for this station.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {incomingTrips.map((trip) => (
            <li key={trip.trip_id} className="glass p-5 rounded-2xl hover:border-green-300 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white shadow-xs">
                    <Train className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-heading">
                      Train Trip #{trip.trip_id}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {trip.origin_city} Central Shed → {trip.destination_city} Depot
                    </p>
                  </div>
                </div>

                {trip.manifest_status === "RECEIVED" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>Received at Depot</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    <Clock className="h-3 w-3 text-amber-600" />
                    <span>In Transit / Scheduled</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-surface-glass-border">
                <div>
                  <span className="text-text-muted block">Departure (Kandy)</span>
                  <strong className="text-text-heading">{times.format(new Date(trip.departure_datetime))}</strong>
                </div>
                <div>
                  <span className="text-text-muted block">Arrival ({trip.destination_city})</span>
                  <strong className="text-text-heading">{times.format(new Date(trip.arrival_datetime))}</strong>
                </div>
                <div>
                  <span className="text-text-muted block">Allocated Customer Orders</span>
                  <strong className="text-sm font-bold text-green-700">{trip.allocated_orders_count} orders</strong>
                </div>
                <div>
                  <span className="text-text-muted block">Cargo Weight Carried</span>
                  <strong className="text-sm font-bold text-text-heading">{trip.total_cargo_weight_kg} kg</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-glass-border flex items-center justify-between text-xs">
                <span className="text-text-muted">Train Status: <strong>{trip.trip_status}</strong></span>
                <button
                  type="button"
                  onClick={() => setTab("demand")}
                  className="inline-flex items-center gap-1 text-green-700 hover:text-green-800 font-semibold cursor-pointer"
                >
                  <span>View Demand Orders</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>}

    {/* Tab 3: Truck Schedules */}
    {tab === "schedules" && <div role="tabpanel" id="schedules-panel" aria-labelledby="schedules-tab">
      {writable && <AssignmentForm key={station} catalog={catalog} stores={stores} stationId={station} onStoreChange={chooseStore} demand={orders}
        onCreated={() => { setRefresh((value) => value + 1); onCreated(); }} />}
      {loadedStation === station && station && <>
        {schedules.length === 0 ? <p className="glass p-6">No truck schedules at this station in the selected week.</p> :
          <ul className="grid gap-4 md:grid-cols-2">{schedules.map((schedule) => <li key={schedule.roster_id} className="glass p-5">
            <h3 className="text-lg font-semibold">Run #{schedule.roster_id} · {schedule.route_name}</h3>
            <p className="mt-2 text-sm">{schedule.station_name} · {schedule.plate_number} · {schedule.status.replaceAll("_", " ")}</p>
            <p className="mt-1 text-sm">Driver: {schedule.driver_name} · Assistant: {schedule.assistant_name}</p>
            <p className="mt-1 text-sm">{times.format(new Date(schedule.start_time))} – {times.format(new Date(schedule.end_time))}</p>
            <p className="mt-2 text-sm">{schedule.order_count} orders · {schedule.unit_count} units · {schedule.cargo_weight_kg} kg planned</p>
            <p className="text-sm">Capacity: {schedule.capacity} {schedule.capacity_unit === "KG" ? "kg" : "(unit unverified)"}</p>
            <button className="btn-secondary mt-4 px-4 py-2" onClick={() => setSelectedRun(schedule.roster_id)}>{writable && schedule.status === "SCHEDULED" ? "Manage whole orders / loading list" : "View loading list"}</button>
          </li>)}</ul>}
        {run && <LoadingList key={run.roster_id} schedule={run} demand={orders} writable={writable} onClose={() => setSelectedRun(null)} onSaved={() => setRefresh((value) => value + 1)} />}
      </>}
    </div>}
  </section>;
}
