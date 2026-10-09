"use client";

import { useEffect, useState } from "react";
import { getCargoDemand, getCargoSchedules, getCargoStores } from "@/lib/roster/api";
import type { CargoOrder, RosterCandidates, StationStore, TruckSchedule } from "@/lib/roster/types";
import AssignmentForm from "./AssignmentForm";
import LoadingList, { OrderDetails } from "./LoadingList";

const times = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

export default function DeliveryDemand({ catalog, range, writable, onCreated }: {
  catalog: RosterCandidates; range: { from: string; to: string }; writable: boolean; onCreated: () => void;
}) {
  const [tab, setTab] = useState<"demand" | "schedules">("demand");
  const [stores, setStores] = useState<StationStore[]>([]);
  const [station, setStation] = useState("");
  const [orders, setOrders] = useState<CargoOrder[]>([]);
  const [schedules, setSchedules] = useState<TruckSchedule[]>([]);
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
    Promise.all([getCargoDemand(Number(station), fromDate, toDate, controller.signal),
      getCargoSchedules(Number(station), { from: range.from, to: range.to }, controller.signal)]).then(([demand, runs]) => {
      if (controller.signal.aborted) return;
      setOrders(demand);
      setSchedules(runs);
      setLoadedStation(station);
      setMessage(null);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Delivery planning unavailable.");
    });
    return () => controller.abort();
  }, [station, range.from, range.to, refresh]);

  function chooseStore(value: string) {
    setStation(value);
    setLoadedStation("");
    setSelectedRun(null);
    setMessage(null);
  }
  const groups = new Map<string, CargoOrder[]>();
  for (const order of orders) {
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
      <button role="tab" aria-selected={tab === "demand"} aria-controls="demand-panel" id="demand-tab" className={tab === "demand" ? "btn-primary px-5 py-3" : "btn-secondary px-5 py-3"} onClick={() => setTab("demand")}>Delivery demand</button>
      <button role="tab" aria-selected={tab === "schedules"} aria-controls="schedules-panel" id="schedules-tab" className={tab === "schedules" ? "btn-primary px-5 py-3" : "btn-secondary px-5 py-3"} onClick={() => setTab("schedules")}>Truck schedules</button>
    </div>
    {message && <div role="alert" className="glass mb-5 p-5"><p>{message}</p><button className="btn-secondary mt-3 px-4 py-2" onClick={() => setRefresh((value) => value + 1)}>Retry</button></div>}
    {station && loadedStation !== station && !message && <p role="status">Loading delivery demand and schedules…</p>}
    {tab === "demand" && loadedStation === station && station && <div role="tabpanel" id="demand-panel" aria-labelledby="demand-tab">
      {groups.size === 0 ? <p className="glass p-6">No orders for this station in the selected week.</p> : [...groups].map(([group, rows]) => <section key={group} className="mb-6">
        <h3 className="mb-3 text-lg font-semibold">{rows[0].route_name} · {rows[0].delivery_date}</h3>
        <ul className="grid gap-4 md:grid-cols-2">{rows.map((order) => <li key={order.order_id} className="glass p-5"><OrderDetails order={order} /><p className="mt-3 text-sm font-semibold">{order.eligible ? "Eligible for whole-order assignment" : order.assigned_roster_id ? `Planned on run #${order.assigned_roster_id}` : "Awaiting eligibility"}</p></li>)}</ul>
      </section>)}
    </div>}
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
