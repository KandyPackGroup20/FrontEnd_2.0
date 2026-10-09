/** datetime-local values in this workflow always mean Sri Lanka time. */
export function railTimestamp(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    throw new Error('Enter a valid rail schedule date and time.');
  }
  return `${value}+05:30`;
}

export function railError(detail: unknown, fallback = 'Rail request failed.'): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(item => typeof item?.msg === 'string' ? item.msg : fallback).join('; ');
  }
  return fallback;
}

export function distinctRailTrips(allocations: ReadonlyArray<{trip_id: number}>): number[] {
  return [...new Set(allocations.map(allocation => allocation.trip_id))];
}
