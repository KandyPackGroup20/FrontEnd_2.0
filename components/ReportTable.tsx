"use client";

import { useId, useState } from "react";
import { Column, metricRows, ReportRow, visibleRows } from "@/lib/reports";

export default function ReportTable({ title, rows, columns, metric, metricLabel }: {
  title: string; rows: ReportRow[]; columns: Column[]; metric: string; metricLabel: string;
}) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(columns[0].key);
  const [descending, setDescending] = useState(false);
  const [page, setPage] = useState(0);
  const filtered = visibleRows(rows, search, sort, descending);
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  const currentPage = Math.min(page, pages - 1);
  const chart = metricRows(filtered, metric);
  const maximum = Math.max(1, ...chart.map(row => Number(row[metric])));
  const label = (row: ReportRow) => [row.sales_year, row.sales_quarter && `Q${row.sales_quarter}`,
    row.dep_year, row.dep_month, row.usage_year, row.usage_month,
    row.station, row.destination_hub, row.route_name, row.product_name, row.staff_name, row.plate_number]
    .filter(value => value !== undefined && value !== null).join(" / ");
  return <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-sm md:p-8" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} className="text-xl font-semibold text-slate-900">{title}</h2>
    <label className="my-4 block text-sm" htmlFor={`${id}-search`}>Search this report
      <input id={`${id}-search`} className="ml-3 rounded border p-2" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} />
    </label>
    {chart.length > 0 && <figure className="mb-5 overflow-x-auto">
      <figcaption className="text-sm text-slate-600">{metricLabel}: up to eight largest matching detail rows. Subtotals excluded.</figcaption>
      <svg role="img" aria-label={`${title}: ${metricLabel}`} viewBox={`0 0 720 ${chart.length * 34 + 10}`} className="w-full min-w-[560px]">
        {chart.map((row, index) => <g key={index} transform={`translate(0 ${index * 34 + 5})`}>
          <title>{`${label(row)}: ${row[metric]}`}</title>
          <text x="0" y="18" fontSize="12">{label(row).slice(0, 34)}</text>
          <rect x="250" y="1" width={Math.max(0, Number(row[metric])) / maximum * 380} height="24" rx="3" fill="#059669" />
          <text x="640" y="18" fontSize="12">{Number(row[metric]).toLocaleString(undefined, { maximumFractionDigits: 2 })}</text>
        </g>)}
      </svg>
    </figure>}
    <p className="text-sm text-slate-600">{filtered.length} rows. Totals include the report&apos;s full period; search filters displayed rows only.</p>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <caption className="sr-only">{title}</caption>
        <thead><tr>{columns.map(column => <th key={column.key} scope="col" className="p-3 text-left" aria-sort={sort === column.key ? descending ? "descending" : "ascending" : "none"}>
          <button type="button" onClick={() => { setSort(column.key); setDescending(sort === column.key && !descending); setPage(0); }}>{column.label} {sort === column.key ? descending ? "▼" : "▲" : "↕"}</button>
        </th>)}</tr></thead>
        <tbody>{filtered.slice(currentPage * 25, currentPage * 25 + 25).map((row, index) => <tr key={index} className={`border-t ${row.row_level && row.row_level !== "detail" ? "bg-emerald-50 font-semibold" : ""}`}>
          {columns.map(column => <td key={column.key} className="p-3">{row[column.key] ?? "—"}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    {!filtered.length && <p className="py-4">No matching report data.</p>}
    <nav aria-label={`${title} pages`} className="mt-4 flex gap-4 text-sm">
      <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="disabled:opacity-40">Previous</button>
      <span>Page {currentPage + 1} of {pages}</span>
      <button type="button" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)} className="disabled:opacity-40">Next</button>
    </nav>
  </section>;
}
