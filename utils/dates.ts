// Firestore stores order dates as calendar dates ("2026-11-19"). `new Date()`
// reads a date-only string as UTC midnight, which shows the previous day for
// everyone west of UTC, so calendar dates are parsed at local noon instead.
export function parseCalendarDate(value: string): Date {
  return new Date(value.includes("T") ? value : `${value}T12:00:00`);
}

export function formatCalendarDate(value: string): string {
  if (!value) return "";

  const date = parseCalendarDate(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-CA");
}
