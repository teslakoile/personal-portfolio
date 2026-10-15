import type { Day } from "../../../_home/Contributions";

/**
 * The contribution year, reshaped for the calendar. Everything is derived from
 * the public contributions fragment (one count per day), so every figure is
 * exact. Plain objects only: the result crosses the server/client boundary as
 * props.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type Cell = { date: string; count: number; level: number; week: number; weekday: number };

export type Year = {
  total: number;
  /** false when GitHub's markup lost the per-day counts and only levels remain */
  hasCounts: boolean;
  /** every day, oldest first */
  days: Cell[];
  /** week columns, 0 to weeks - 1 */
  weeks: number;
  /** first week column of each month, for the labels */
  monthStarts: { week: number; label: string }[];
  bestDay: Cell;
};

const parts = (iso: string) => iso.split("-").map(Number) as [number, number, number];

/** "Sun, May 31, 2026", from an ISO date, without a time zone round trip. */
export function fullDate(c: Pick<Cell, "date" | "weekday">) {
  const [y, m, d] = parts(c.date);
  return `${WEEKDAYS[c.weekday]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

export function buildYear(days: Day[], total: number): Year {
  const cells: Cell[] = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const weeks = Math.max(...cells.map((c) => c.week)) + 1;

  // a month's label sits over the week holding its first drawn day; a leading
  // partial month is dropped when the next label is under 3 weeks away
  const seen = new Set<string>();
  const monthStarts: Year["monthStarts"] = [];
  for (const c of cells) {
    const key = c.date.slice(0, 7);
    if (seen.has(key)) continue;
    seen.add(key);
    monthStarts.push({ week: c.week, label: MONTHS[parts(c.date)[1] - 1] });
  }
  if (monthStarts.length > 1 && monthStarts[1].week - monthStarts[0].week < 3) monthStarts.shift();

  return {
    total,
    hasCounts: cells.some((c) => c.count > 0),
    days: cells,
    weeks,
    monthStarts,
    bestDay: cells.reduce((a, c) => (c.count > a.count ? c : a)),
  };
}
