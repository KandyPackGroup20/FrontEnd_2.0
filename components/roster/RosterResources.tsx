"use client";

import { useState, useMemo } from "react";
import { Truck, Users, MapPin, Search, ChevronLeft, ChevronRight, Layers, ShieldCheck } from "lucide-react";
import type { RosterCandidates } from "@/lib/roster/types";

function durationLabel(seconds: number): string {
  return `${Number((seconds / 3600).toFixed(2))} h`;
}

type ResourceCategory = "all" | "routes" | "trucks" | "drivers" | "assistants";

interface ResourceItem {
  id: string;
  category: "Route" | "Truck" | "Driver" | "Assistant";
  title: string;
  subtitle: string;
  detail: string;
  status: "ACTIVE" | "INACTIVE" | "ASSIGNED" | "STANDBY";
  meta?: Record<string, string | number>;
}

export default function RosterResources({ catalog }: { catalog: RosterCandidates }) {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Flatten all catalog resources into a unified searchable list
  const allResources: ResourceItem[] = useMemo(() => {
    const list: ResourceItem[] = [];

    // Routes
    catalog.routes.forEach((route) => {
      list.push({
        id: `route-${route.route_id}`,
        category: "Route",
        title: route.route_name,
        subtitle: `Route #${route.route_id} • Depot Station #${route.station_id}`,
        detail: `Max transit window: ${durationLabel(route.max_duration_seconds)}`,
        status: "ACTIVE",
        meta: { "Route ID": route.route_id, "Station ID": route.station_id },
      });
    });

    // Trucks
    catalog.trucks.forEach((truck) => {
      list.push({
        id: `truck-${truck.truck_id}`,
        category: "Truck",
        title: truck.plate_number,
        subtitle: `Truck #${truck.truck_id} • Hub #${truck.station_id || "Unassigned"}`,
        detail: truck.is_active ? "Operational & Roadworthy" : "Out of Service / Maintenance",
        status: truck.is_active ? "ACTIVE" : "INACTIVE",
        meta: { "Truck ID": truck.truck_id, "Registration": truck.plate_number },
      });
    });

    // Drivers
    catalog.drivers.forEach((driver) => {
      list.push({
        id: `driver-${driver.staff_id}`,
        category: "Driver",
        title: driver.name,
        subtitle: `Staff #${driver.staff_id} • Primary Heavy Vehicle Driver`,
        detail: "Commercial logistics driver license validated",
        status: "ACTIVE",
        meta: { "Staff ID": driver.staff_id, "Role": "Heavy Truck Driver" },
      });
    });

    // Assistants
    catalog.assistants.forEach((assistant) => {
      list.push({
        id: `assistant-${assistant.staff_id}`,
        category: "Assistant",
        title: assistant.name,
        subtitle: `Staff #${assistant.staff_id} • Cargo Handling Assistant`,
        detail: "Doorstep delivery & parcel handover crew",
        status: "ACTIVE",
        meta: { "Staff ID": assistant.staff_id, "Role": "Delivery Assistant" },
      });
    });

    return list;
  }, [catalog]);

  // Filter based on category & search query
  const filtered = useMemo(() => {
    return allResources.filter((item) => {
      if (activeCategory === "routes" && item.category !== "Route") return false;
      if (activeCategory === "trucks" && item.category !== "Truck") return false;
      if (activeCategory === "drivers" && item.category !== "Driver") return false;
      if (activeCategory === "assistants" && item.category !== "Assistant") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q)
      );
    });
  }, [allResources, activeCategory, searchQuery]);

  // Reset page when category or search changes
  const handleCategoryChange = (cat: ResourceCategory) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, filtered.length);

  return (
    <section aria-labelledby="resources-title" className="mb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="resources-title" className="text-[clamp(1.5rem,3vw,2rem)]">Roster resources</h2>
          <p className="mt-1 text-sm text-text-muted">
            Directory of active delivery routes, registered fleet trucks, and qualified delivery staff crew.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <MapPin className="h-4 w-4 text-green-700" />
            <span>Delivery Routes</span>
          </div>
          <p className="text-2xl font-bold text-text-heading">{catalog.routes.length}</p>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <Truck className="h-4 w-4 text-green-700" />
            <span>Fleet Trucks</span>
          </div>
          <p className="text-2xl font-bold text-text-heading">{catalog.trucks.length}</p>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <Users className="h-4 w-4 text-green-700" />
            <span>Licensed Drivers</span>
          </div>
          <p className="text-2xl font-bold text-text-heading">{catalog.drivers.length}</p>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <ShieldCheck className="h-4 w-4 text-green-700" />
            <span>Cargo Assistants</span>
          </div>
          <p className="text-2xl font-bold text-text-heading">{catalog.assistants.length}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="glass p-5 rounded-2xl mb-6 border border-slate-200/80">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Pill Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === "all"
                  ? "bg-green-700 text-white font-bold shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              All ({allResources.length})
            </button>
            <button
              onClick={() => handleCategoryChange("routes")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === "routes"
                  ? "bg-green-700 text-white font-bold shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Routes ({catalog.routes.length})
            </button>
            <button
              onClick={() => handleCategoryChange("trucks")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === "trucks"
                  ? "bg-green-700 text-white font-bold shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Trucks ({catalog.trucks.length})
            </button>
            <button
              onClick={() => handleCategoryChange("drivers")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === "drivers"
                  ? "bg-green-700 text-white font-bold shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Drivers ({catalog.drivers.length})
            </button>
            <button
              onClick={() => handleCategoryChange("assistants")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === "assistants"
                  ? "bg-green-700 text-white font-bold shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Assistants ({catalog.assistants.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter resources by name, plate..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-600/30 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Resources Card Grid */}
      {filtered.length === 0 ? (
        <div className="glass p-8 text-center rounded-2xl" role="status">
          <Layers className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <h3 className="text-lg font-semibold text-text-heading">No matching resources</h3>
          <p className="mt-1 text-sm text-text-muted">
            {searchQuery
              ? `No resources match your search query "${searchQuery}".`
              : "No resources found in this category."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-1.5 rounded-lg bg-green-50 text-green-800 text-xs font-semibold hover:bg-green-100 cursor-pointer"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pagedItems.map((item) => {
            const Icon =
              item.category === "Route"
                ? MapPin
                : item.category === "Truck"
                ? Truck
                : item.category === "Driver"
                ? Users
                : ShieldCheck;

            return (
              <div
                key={item.id}
                className="glass p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between hover:shadow-sm transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="p-2 rounded-xl bg-green-50 text-green-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-amber-50 text-amber-700 border border-amber-200/60"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">{item.category}</p>
                  <h3 className="text-base font-bold text-text-heading mt-0.5 leading-snug">{item.title}</h3>
                  <p className="text-xs text-text-muted mt-1">{item.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-600 font-medium">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {filtered.length > pageSize && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 p-4 glass rounded-2xl border border-slate-200/80 text-xs">
          <p className="text-slate-600 font-medium">
            Showing <strong className="text-slate-900">{startIdx}</strong> to{" "}
            <strong className="text-slate-900">{endIdx}</strong> of{" "}
            <strong className="text-slate-900">{filtered.length}</strong> resources
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === num
                      ? "bg-green-700 text-white shadow-xs"
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
