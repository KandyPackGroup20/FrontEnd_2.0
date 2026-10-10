export type ReportRow = Record<string, string | number | null>;
export type Column = { key: string; label: string };

export function reportRows(data: unknown, key: string): ReportRow[] {
  if (!data || typeof data !== "object") throw new Error("Invalid report response.");
  const rows = (data as Record<string, unknown>)[key];
  if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== "object" || Array.isArray(row)
    || Object.values(row).some(value => value !== null && typeof value !== "string" && typeof value !== "number"))) {
    throw new Error("Invalid report response.");
  }
  return rows as ReportRow[];
}

export function visibleRows(rows: ReportRow[], search: string, sort: string, descending: boolean) {
  const term = search.trim().toLocaleLowerCase();
  return rows.filter(row => Object.values(row).some(value => String(value ?? "").toLocaleLowerCase().includes(term)))
    .sort((a, b) => {
      const left = a[sort], right = b[sort];
      const difference = typeof left === "number" && typeof right === "number"
        ? left - right : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true });
      return descending ? -difference : difference;
    });
}

export function metricRows(rows: ReportRow[], metric: string) {
  // SQL subtotal rows must never be added to their own detail rows.
  return rows.filter(row => (!row.row_level || row.row_level === "detail") && Number.isFinite(Number(row[metric])))
    .sort((a, b) => Number(b[metric]) - Number(a[metric])).slice(0, 8);
}

export function colomboMonday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  const local = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00Z`);
  local.setUTCDate(local.getUTCDate() - (local.getUTCDay() + 6) % 7);
  return local.toISOString().slice(0, 10);
}
