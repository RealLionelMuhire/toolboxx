import { z } from "zod";

// Analytics periods shown in the insights filters, in display order
export const TIME_RANGE_OPTIONS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "this_month", label: "This month" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "this_year", label: "This year" },
  { value: "last_year", label: "Last year" },
  { value: "all", label: "All time" },
] as const;

export type TimeRange = (typeof TIME_RANGE_OPTIONS)[number]["value"];

export const timeRangeSchema = z.enum(
  TIME_RANGE_OPTIONS.map((option) => option.value) as [TimeRange, ...TimeRange[]],
);

/** Minutes the viewer's clock is behind UTC, as Date#getTimezoneOffset reports it (Kigali is -120). */
export const tzOffsetSchema = z.number().int().min(-14 * 60).max(14 * 60).optional();

export const getViewerTzOffset = () => new Date().getTimezoneOffset();

/**
 * Turns a period into a [from, to) window. Calendar periods (today, this month, ...) start at
 * midnight in the viewer's timezone, so "Today" means the viewer's day, not the server's UTC day.
 * Returns null for "all".
 */
export function getTimeRangeBounds(
  range: TimeRange,
  tzOffsetMinutes = 0,
  now = new Date(),
): { from: Date; to?: Date } | null {
  if (range === "all") return null;

  const offsetMs = tzOffsetMinutes * 60_000;
  // A Date whose UTC fields read as the viewer's wall-clock time
  const local = new Date(now.getTime() - offsetMs);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  // Converts a wall-clock date in the viewer's timezone back to a real instant
  const at = (year: number, month: number, day: number) =>
    new Date(Date.UTC(year, month, day) + offsetMs);
  // Same day N months back, clamped so May 31 - 3 months is Feb 28, not Mar 3
  const monthsBack = (months: number) => {
    const lastDay = new Date(Date.UTC(y, m - months + 1, 0)).getUTCDate();
    return at(y, m - months, Math.min(d, lastDay));
  };

  switch (range) {
    case "24h":
      return { from: new Date(now.getTime() - 24 * 60 * 60_000) };
    case "today":
      return { from: at(y, m, d) };
    case "yesterday":
      return { from: at(y, m, d - 1), to: at(y, m, d) };
    case "7d":
      return { from: new Date(now.getTime() - 7 * 24 * 60 * 60_000) };
    case "this_month":
      return { from: at(y, m, 1) };
    case "30d":
      return { from: new Date(now.getTime() - 30 * 24 * 60 * 60_000) };
    case "3m":
      return { from: monthsBack(3) };
    case "6m":
      return { from: monthsBack(6) };
    case "this_year":
      return { from: at(y, 0, 1) };
    case "last_year":
      return { from: at(y - 1, 0, 1), to: at(y, 0, 1) };
  }
}

/** Payload `where` clause restricting createdAt to the window. */
export const createdAtInRange = (bounds: { from: Date; to?: Date }) => ({
  createdAt: {
    greater_than_equal: bounds.from.toISOString(),
    ...(bounds.to ? { less_than: bounds.to.toISOString() } : {}),
  },
});
