"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ReportTable from "@/components/ReportTable";
import { colomboMonday, ReportRow, reportRows } from "@/lib/reports";

async function loadReport(url: string, key: string, signal: AbortSignal) {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Report request failed (${response.status}). Retry or check report availability.`);
  }

  const data = await response.json();
  return reportRows(data, key);
}

export default function ReportsPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);

  const [quarterlySales, setQuarterlySales] = useState<ReportRow[]>([]);
  const [topProducts, setTopProducts] = useState<ReportRow[]>([]);
  const [railCapacity, setRailCapacity] = useState<ReportRow[]>([]);
  const [workforceHours, setWorkforceHours] = useState<ReportRow[]>([]);
  const [truckUtilisation, setTruckUtilisation] = useState<ReportRow[]>([]);
  const [stationInventory, setStationInventory] = useState<ReportRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [week, setWeek] = useState(() => colomboMonday());
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function checkAccessAndLoadReports() {
      try {
        setLoading(true);
        setError("");

        // Check currently logged-in user
        const authResponse = await fetch("/api/v1/auth/me", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        // Not logged in
        if (!authResponse.ok) {
          if (authResponse.status !== 401 && authResponse.status !== 403) {
            throw new Error("Account verification is unavailable. Please retry.");
          }
          setAuthorized(false);
          router.replace("/login?redirect=/admin/reports");
          return;
        }

        const user = await authResponse.json();

        // Only SUPERADMIN can view management reports
        if (user.role !== "SUPERADMIN") {
          setAuthorized(false);
          router.replace("/profile");
          return;
        }

        setAuthorized(true);

        // Load reports only after access is confirmed
        const [
          quarterlySalesData,
          topProductsData,
          railCapacityData,
          workforceHoursData,
          truckUtilisationData,
          stationInventoryData,
        ] = await Promise.all([
          loadReport("/api/v1/reports/quarterly-sales", "quarterly_sales", controller.signal),
          loadReport("/api/v1/reports/top-products", "top_products", controller.signal),
          loadReport("/api/v1/reports/rail-capacity-utilisation", "rail_capacity_utilisation", controller.signal),
          loadReport(`/api/v1/reports/workforce-hours?week_start=${week}`, "workforce_hours", controller.signal),
          loadReport("/api/v1/reports/truck-utilisation", "truck_utilisation", controller.signal),
          loadReport("/api/v1/reports/station-inventory", "station_inventory", controller.signal),
        ]);

        if (controller.signal.aborted) return;
        setQuarterlySales(quarterlySalesData);
        setTopProducts(topProductsData);
        setRailCapacity(railCapacityData);
        setWorkforceHours(workforceHoursData);
        setTruckUtilisation(truckUtilisationData);
        setStationInventory(stationInventoryData);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : "Unable to load management reports."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    checkAccessAndLoadReports();
    return () => controller.abort();
  }, [router, week, refresh]);

  if (!authorized && loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-emerald-50/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />

          <p className="text-sm font-medium text-slate-600">
            Checking access...
          </p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return <main className="p-8" role="alert">{error || "Redirecting to sign in..."}<button className="ml-4" onClick={() => setRefresh(value => value + 1)}>Retry</button></main>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.09),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.06),_transparent_30%),linear-gradient(to_bottom,_#fbfffc,_#f6fbf8,_#ffffff)] px-4 pb-20 pt-28 md:px-8">
      <div className="pointer-events-none absolute left-[-120px] top-[180px] h-72 w-72 rounded-full bg-emerald-100/30 blur-3xl" />

      <div className="pointer-events-none absolute right-[-100px] top-[520px] h-80 w-80 rounded-full bg-emerald-50/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Kandypack Analytics
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Management Reports
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
            Operational and management information generated from the Kandypack
            database.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <label htmlFor="report-week">Workforce week (Colombo Monday)</label>
          <input id="report-week" type="date" value={week} className="rounded border p-2" onChange={event => { if (event.target.value) setWeek(colomboMonday(new Date(`${event.target.value}T12:00:00+05:30`))); }} />
          <button type="button" disabled={loading} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50" onClick={() => setRefresh(value => value + 1)}>Refresh reports</button>
        </div>
        <p className="mb-5 text-sm text-slate-600">Sales show booked goods value excluding cancelled orders. Truck and workforce hours include scheduled, in-transit and completed duties. Stock is current; receipts and adjustments are lifetime movements.</p>
        {loading && <p role="status" className="mb-5">Loading reports...</p>}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200/70 bg-white/80 p-4 text-red-600 shadow-sm backdrop-blur-lg">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-10">
            <ReportTable
              title="1. Quarterly Sales by Route and Product"
              rows={quarterlySales}
              metric="total_sales" metricLabel="Booked sales (LKR)"
              columns={[
                { key: "row_level", label: "Row type" },
                { key: "sales_year", label: "Year" },
                { key: "sales_quarter", label: "Quarter" },
                { key: "route_name", label: "Route" },
                { key: "product_name", label: "Product" },
                { key: "total_quantity", label: "Quantity" },
                { key: "total_sales", label: "Total Sales" },
              ]}
            />

            <ReportTable
              title="2. Top-Selling Products per Quarter"
              rows={topProducts}
              metric="total_quantity" metricLabel="Units ordered"
              columns={[
                { key: "sales_year", label: "Year" },
                { key: "sales_quarter", label: "Quarter" },
                { key: "product_name", label: "Product" },
                { key: "total_quantity", label: "Quantity" },
                { key: "total_sales", label: "Sales" },
                { key: "product_rank", label: "Rank" },
              ]}
            />

            <ReportTable
              title="3. Rail Capacity Utilisation by Station and Month"
              rows={railCapacity}
              metric="utilization_percentage" metricLabel="Rail utilisation (%)"
              columns={[
                { key: "row_level", label: "Row type" },
                { key: "destination_hub", label: "Station" },
                { key: "dep_year", label: "Year" },
                { key: "dep_month", label: "Month" },
                { key: "total_capacity", label: "Total Capacity" },
                { key: "allocated_capacity", label: "Allocated" },
                { key: "remaining_capacity", label: "Remaining" },
                { key: "utilization_percentage", label: "Utilisation %" },
              ]}
            />

            <ReportTable
              title="4. Workforce Hours vs 40h/60h Cap"
              rows={workforceHours}
              metric="accumulated_hours" metricLabel="Scheduled hours"
              columns={[
                { key: "delivery_staff_id", label: "Staff ID" },
                { key: "staff_name", label: "Staff Member" },
                { key: "staff_role", label: "Role" },
                { key: "accumulated_hours", label: "Work Hours" },
                { key: "weekly_cap", label: "Hour Cap" },
                { key: "remaining_hours", label: "Remaining hours" },
                { key: "utilization_pct", label: "Utilisation %" },
                { key: "status_flag", label: "Status" },
              ]}
            />

            <ReportTable
              title="5. Truck Utilisation"
              rows={truckUtilisation}
              metric="total_operating_hours" metricLabel="Operating hours"
              columns={[
                { key: "row_level", label: "Row type" },
                { key: "usage_year", label: "Year" },
                { key: "usage_month", label: "Month" },
                { key: "truck_id", label: "Truck ID" },
                { key: "plate_number", label: "Plate Number" },
                { key: "total_delivery_runs", label: "Delivery Runs" },
                { key: "total_routes", label: "Routes" },
                {
                  key: "total_operating_hours",
                  label: "Operating Hours",
                },
              ]}
            />

            <ReportTable
              title="6. Station Inventory & Stock Adjustment Summary"
              rows={stationInventory}
              metric="stored_quantity" metricLabel="Current units"
              columns={[
                { key: "station", label: "Station" },
                { key: "product_name", label: "Product" },
                { key: "location_code", label: "Bin" },
                { key: "received_quantity", label: "Received units" },
                { key: "stored_quantity", label: "Current stock" },
                {
                  key: "positive_adjustments",
                  label: "Positive Adjustments",
                },
                {
                  key: "negative_adjustments",
                  label: "Negative Adjustments",
                },
                { key: "net_adjustment", label: "Net Adjustment" },
                { key: "damaged_quantity", label: "Damaged units" },
                { key: "net_receipts", label: "Receipts + adjustments" },
              ]}
            />
          </div>
        )}
      </div>
    </main>
  );
}
