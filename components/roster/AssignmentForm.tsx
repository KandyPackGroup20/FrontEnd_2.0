"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { createRosterAssignment, RosterApiError, serializeColomboDateTime } from "@/lib/roster/api";
import type { CargoOrder, RosterCandidates, StationStore } from "@/lib/roster/types";
import { getCrewAvailability, type CrewAvailability, type EligibleCrew } from "@/lib/roster/api";
import FatigueBadge from "./FatigueBadge";

interface AssignmentFormProps {
  catalog: RosterCandidates;
  onCreated: () => Promise<void> | void;
  stores: StationStore[];
  stationId: string;
  onStoreChange: (value: string) => void;
  demand: CargoOrder[];
}

function newRequestKey(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `roster-${uuid}` : `roster-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AssignmentForm({ catalog, onCreated, stores, stationId, onStoreChange, demand }: AssignmentFormProps) {
  const [routeId, setRouteId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [crew, setCrew] = useState<{ key: string; data: CrewAvailability } | null>(null);
  const [crewError, setCrewError] = useState<{ key: string; message: string } | null>(null);
  const [crewRefresh, setCrewRefresh] = useState(0);
  const crewKey = JSON.stringify([routeId, truckId, startTime, endTime, driverId, assistantId, crewRefresh]);
  const available = crew?.key === crewKey ? crew.data : null;
  const crewMessage = !routeId || !truckId || !startTime || !endTime
    ? "Choose route, truck, and start/end times to check crew availability."
    : crewError?.key === crewKey ? crewError.message
    : !available ? "Checking crew availability…"
    : "Availability is checked again when you create the schedule. Another dispatcher may assign crew meanwhile.";
  useEffect(() => {
    const controller = new AbortController();
    if (!routeId || !truckId || !startTime || !endTime) return () => controller.abort();
    let params: Record<string, string>;
    try {
      params = { route_id: routeId, truck_id: truckId, from: serializeColomboDateTime(startTime), to: serializeColomboDateTime(endTime),
        ...(driverId ? { driver_id: driverId } : {}), ...(assistantId ? { assistant_id: assistantId } : {}) };
    } catch { return () => controller.abort(); }
    getCrewAvailability(params, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      const cleared: string[] = [];
      if (driverId && !data.drivers.some((s) => String(s.staff_id) === driverId)) {
        setDriverId("");
        cleared.push(`Driver cleared: ${data.excluded.find((s) => String(s.staff_id) === driverId)?.message ?? "No longer eligible for these scheduling inputs."}`);
      }
      if (assistantId && !data.assistants.some((s) => String(s.staff_id) === assistantId)) {
        setAssistantId("");
        cleared.push(`Assistant cleared: ${data.excluded.find((s) => String(s.staff_id) === assistantId)?.message ?? "No longer eligible for these scheduling inputs."}`);
      }
      if (cleared.length) setMessage(cleared.join(" "));
      setCrew({ key: crewKey, data });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setCrew(null);
        setCrewError({ key: crewKey, message: error instanceof Error ? error.message : "Crew availability unavailable." });
      }
    });
    return () => controller.abort();
  }, [routeId, truckId, startTime, endTime, driverId, assistantId, crewKey]);
  const requestKey = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const selectedTruck = catalog.trucks.find((truck) => String(truck.truck_id) === truckId);
  const routeDemand = demand.filter((order) => String(order.route_id) === routeId && order.eligible);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || !available) return;
    setMessage(null);
    try {
      const request = {
        route_id: Number(routeId),
        truck_id: Number(truckId),
        driver_id: Number(driverId),
        assistant_id: Number(assistantId),
        start_time: serializeColomboDateTime(startTime),
        end_time: serializeColomboDateTime(endTime),
      };
      submittingRef.current = true;
      setSubmitting(true);
      const result = await createRosterAssignment(request, requestKey.current ??= newRequestKey());
      requestKey.current = null;
      setMessage(result.message);
      setRouteId("");
      setTruckId("");
      setDriverId("");
      setAssistantId("");
      setStartTime("");
      setEndTime("");
      await onCreated();
    } catch (error: unknown) {
      const rosterError = error instanceof RosterApiError ? error : null;
      setMessage(rosterError?.message ?? (error instanceof Error ? error.message : "Assignment could not be submitted."));
      // Start a new submission after a definitive rejection; rejected keys are not stored.
      // Keep the key after network/service failures to recover a committed acceptance.
      if (rosterError && [404, 409, 422].includes(rosterError.status)) requestKey.current = null;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="assignment-form-title" className="glass mb-12 p-6 sm:p-8">
      <div className="mb-6">
        <h2 id="assignment-form-title" className="text-[clamp(1.5rem,3vw,2rem)]">Create truck schedule</h2>
      </div>

      <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
        <Field label="Station store" id="schedule-store">
          <select id="schedule-store" value={stationId} disabled={submitting} required className="input"
            onChange={(event) => { setRouteId(""); onStoreChange(event.target.value); }}>
            <option value="">Select station store</option>{stores.map((store) => <option key={store.station_id} value={store.station_id}>{store.station_name}</option>)}
          </select>
        </Field>
        <Field label="Route" id="roster-route">
          <select id="roster-route" value={routeId} onChange={(event) => setRouteId(event.target.value)} disabled={submitting} required className="input">
            <option value="">Select route</option>
            {catalog.routes.filter((route) => route.station_id === stationId).map((route) => <option key={route.route_id} value={route.route_id}>{route.route_name}</option>)}
          </select>
        </Field>
        <p className="md:col-span-2 text-sm">{routeId ? `${routeDemand.length} receipt-eligible whole orders on this route in the selected week.` : "Select a route to view its demand."}
          {selectedTruck && ` Truck capacity: ${selectedTruck.capacity ?? "Unavailable"} ${selectedTruck.capacity_unit === "KG" ? "kg" : "(unit unverified)"}.`}</p>
        <Field label="Truck" id="roster-truck">
          <select id="roster-truck" value={truckId} onChange={(event) => setTruckId(event.target.value)} disabled={submitting} required className="input">
            <option value="">Select truck</option>
            {catalog.trucks.filter((truck) => truck.is_active).map((truck) => <option key={truck.truck_id} value={truck.truck_id}>{truck.plate_number}</option>)}
          </select>
        </Field>
        <Field label="Driver" id="roster-driver">
          <select id="roster-driver" value={driverId} onChange={(event) => setDriverId(event.target.value)} disabled={submitting || !available} required className="input">
            <option value="">Select driver</option>
            {(available?.drivers ?? []).map((staff) => <option key={staff.staff_id} value={staff.staff_id}>{staff.name}</option>)}
          </select>
        </Field>
        <Field label="Assistant" id="roster-assistant">
          <select id="roster-assistant" value={assistantId} onChange={(event) => setAssistantId(event.target.value)} disabled={submitting || !available} required className="input">
            <option value="">Select assistant</option>
            {(available?.assistants ?? []).map((staff) => <option key={staff.staff_id} value={staff.staff_id}>{staff.name}</option>)}
          </select>
        </Field>
        <Field label="Start time — Sri Lanka time" id="roster-start-time">
          <input id="roster-start-time" type="datetime-local" step="60" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={submitting} required className="input" />
        </Field>
        <Field label="End time — Sri Lanka time" id="roster-end-time">
          <input id="roster-end-time" type="datetime-local" step="60" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={submitting} required className="input" />
        </Field>

        <p role="status" className="md:col-span-2 text-sm">{crewMessage}</p>
        <button type="button" className="btn-secondary px-4 py-2" disabled={submitting || !routeId || !truckId || !startTime || !endTime}
          onClick={() => setCrewRefresh((value) => value + 1)}>Refresh crew availability</button>
        {available && <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
          {[...available.drivers, ...available.assistants].map((person) => <CrewHours key={person.staff_id} person={person} />)}
          {!available.drivers.length && <p>No eligible drivers for this interval and selected crew.</p>}
          {!available.assistants.length && <p>No eligible assistants for this interval and selected crew.</p>}
        </div>}
        <div className="md:col-span-2 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={submitting || !available} className="btn-primary px-7 py-3 text-[0.9375rem] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Creating truck schedule…" : "Create truck schedule"}
          </button>
          {message && <p role="status" aria-live="polite" className="text-sm">{message}</p>}
        </div>
      </form>
    </section>
  );
}

function CrewHours({ person }: { person: EligibleCrew }) {
  const hours = (seconds: number) => Number((seconds / 3600).toFixed(2));
  return <div className="rounded-xl border border-green-100 p-3 text-sm">
    <strong>{person.name} · {person.staff_type === "DRIVER" ? "Driver" : "Assistant"}</strong>
    {person.weeks.map((week) => <div className="mt-2" key={week.week_start}>
      <p className="mb-2">Week of {week.week_start} <FatigueBadge seconds={week.projected_seconds} limit={week.limit_seconds} /></p>
      <p>{hours(week.scheduled_seconds)} h scheduled + {hours(week.proposed_seconds)} h proposed / {hours(week.limit_seconds)} h limit · {hours(week.remaining_seconds)} h remaining after assignment</p>
    </div>)}
  </div>;
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-medium text-text-heading">
      {label}
      {children}
    </label>
  );
}
