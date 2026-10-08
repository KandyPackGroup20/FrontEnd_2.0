"use client";

import { useEffect, useState } from "react";

type ReportRow = Record<string, any>;

type Column = {
  key: string;
  label: string;
};

function ReportTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: ReportRow[];
  columns: Column[];
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-100/70 bg-white/75 shadow-[0_10px_30px_rgba(16,185,129,0.06)] backdrop-blur-xl">
      <div className="border-b border-emerald-100/60 bg-gradient-to-r from-emerald-50/80 via-white/90 to-white/70 px-6 py-5 md:px-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
          {title}
        </h2>
      </div>

      {rows.length === 0 ? (
        <div className="m-6 rounded-2xl border border-emerald-100/60 bg-emerald-50/40 p-5 text-sm text-slate-500">
          No report data available.
        </div>
      ) : (
        <div className="overflow-x-auto p-5 md:p-6">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-emerald-100/70 bg-emerald-50/55">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3.5 text-left text-sm font-semibold text-emerald-900"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100/80 transition-colors hover:bg-emerald-50/35"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-4 text-slate-700"
                    >
                      {row[column.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function getFirstArray(data: any): ReportRow[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) {
        return value as ReportRow[];
      }
    }
  }

  return [];
}

async function loadReport(url: string) {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }

  const data = await response.json();
  return getFirstArray(data);
}

export default function ReportsPage() {
  const [quarterlySales, setQuarterlySales] = useState<ReportRow[]>([]);
  const [topProducts, setTopProducts] = useState<ReportRow[]>([]);
  const [railCapacity, setRailCapacity] = useState<ReportRow[]>([]);
  const [workforceHours, setWorkforceHours] = useState<ReportRow[]>([]);
  const [truckUtilisation, setTruckUtilisation] = useState<ReportRow[]>([]);
  const [stationInventory, setStationInventory] = useState<ReportRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAllReports() {
      try {
        setLoading(true);
        setError("");

        const [
          quarterlySalesData,
          topProductsData,
          railCapacityData,
          workforceHoursData,
          truckUtilisationData,
          stationInventoryData,
        ] = await Promise.all([
          loadReport("/api/v1/reports/quarterly-sales"),
          loadReport("/api/v1/reports/top-products"),
          loadReport("/api/v1/reports/rail-capacity-utilisation"),
          loadReport("/api/v1/reports/workforce-hours"),
          loadReport("/api/v1/reports/truck-utilisation"),
          loadReport("/api/v1/reports/station-inventory"),
        ]);

        setQuarterlySales(quarterlySalesData);
        setTopProducts(topProductsData);
        setRailCapacity(railCapacityData);
        setWorkforceHours(workforceHoursData);
        setTruckUtilisation(truckUtilisationData);
        setStationInventory(stationInventoryData);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load one or more reports. Please make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAllReports();
  }, []);

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

        {loading && (
          <div className="rounded-[28px] border border-emerald-100/60 bg-white/75 p-10 text-center shadow-[0_8px_24px_rgba(16,185,129,0.05)] backdrop-blur-xl">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />

            <p className="font-medium text-slate-600">
              Loading management reports...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200/70 bg-white/80 p-4 text-red-600 shadow-sm backdrop-blur-lg">
            {error}
          </div>
        )}

        {!loading && (
          <div className="space-y-10">
            <ReportTable
              title="1. Quarterly Sales by Route and Product"
              rows={quarterlySales}
              columns={[
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
              columns={[
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
              columns={[
                { key: "delivery_staff_id", label: "Staff ID" },
                { key: "staff_name", label: "Staff Member" },
                { key: "staff_role", label: "Role" },
                { key: "accumulated_hours", label: "Work Hours" },
                { key: "weekly_cap", label: "Hour Cap" },
                { key: "utilization_pct", label: "Utilisation %" },
                { key: "status_flag", label: "Status" },
              ]}
            />

            <ReportTable
              title="5. Truck Utilisation"
              rows={truckUtilisation}
              columns={[
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
              columns={[
                { key: "station", label: "Station" },
                { key: "product_name", label: "Product" },
                { key: "stored_quantity", label: "Stored Quantity" },
                {
                  key: "positive_adjustments",
                  label: "Positive Adjustments",
                },
                {
                  key: "negative_adjustments",
                  label: "Negative Adjustments",
                },
                { key: "net_adjustment", label: "Net Adjustment" },
                { key: "adjusted_stock", label: "Adjusted Stock" },
              ]}
            />
          </div>
        )}
      </div>
    </main>
  );
}