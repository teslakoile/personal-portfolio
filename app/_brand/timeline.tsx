import type { ReactNode } from "react";
import b from "./brand.module.css";
import { Legend, type BlockColor, type Cell } from "./kit";

/**
 * Block timelines: one lane per item, one block per unit (a month, a school
 * year). Shared by the career, certification, and education diagrams. Server
 * rendered; the frame scrolls sideways on narrow screens instead of shrinking
 * blocks, so a block keeps meaning one unit.
 */

export type YM = [year: number, month: number];
export const monthIndex = ([y, m]: YM) => y * 12 + (m - 1);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Mar 2026" → [2026, 3]. Throws on anything else, so bad data fails the build. */
export function parseMonth(s: string): YM {
  const [mon, year] = s.trim().split(/\s+/);
  const m = MONTHS.indexOf(mon);
  if (m < 0 || !/^\d{4}$/.test(year)) throw new Error(`parseMonth: cannot read "${s}"`);
  return [Number(year), m + 1];
}

export const monthLabel = ([y, m]: YM) => `${MONTHS[m - 1]} ${y}`;

/**
 * Month cells for one lane between `from` and `to`.
 *   end = YM         filled through `end`; with `expires`, grey (raw) once
 *                    `end` has passed (a lapsed credential, not a past job)
 *   end = "present"  filled through today, empty after
 *   end = "none"     no expiry: filled through today, faded after
 */
export function monthCells({ from, to, start, end, c, today, expires = false }: {
  from: YM; to: YM; start: YM; end: YM | "present" | "none"; c: BlockColor; today: YM; expires?: boolean;
}): Cell[] {
  const f = monthIndex(from), t = monthIndex(to), s = monthIndex(start), now = monthIndex(today);
  const cells: Cell[] = [];
  for (let i = f; i <= t; i++) {
    if (i < s) cells.push({ c: null });
    else if (end === "present") cells.push({ c: i <= now ? c : null });
    else if (end === "none") cells.push(i <= now ? { c } : { c, o: 0.28 });
    else {
      const e = monthIndex(end);
      cells.push({ c: i <= e ? (expires && e < now ? "raw" : c) : null });
    }
  }
  return cells;
}

export type Lane = { label: ReactNode; cells: Cell[] };

export function BlockTimeline({ lanes, ticks, today, legend, blockW = 10, blockH = 9, labelW = 260, gap = 2 }: {
  lanes: Lane[];
  ticks: { at: number; label: string }[];
  today?: { at: number; label: string };
  legend?: { c: BlockColor; label: string }[];
  blockW?: number;
  blockH?: number;
  labelW?: number;
  gap?: number;
}) {
  const step = blockW + gap;
  return (
    <div className={b.timeline}>
      <div className={b.timelineInner}>
        <div className={b.axis} style={{ marginLeft: labelW }} aria-hidden="true">
          {ticks.map((t) => <span key={t.label} style={{ left: t.at * step }}>{t.label}</span>)}
        </div>
        {lanes.map((lane, li) => (
          <div key={li} className={b.lane} style={{ gridTemplateColumns: `${labelW}px auto` }}>
            <div className={b.laneLabel}>{lane.label}</div>
            <div className={b.blocks} style={{ gap }} aria-hidden="true">
              {lane.cells.map((x, i) => (
                <i key={i} style={{ width: blockW, height: blockH, background: x.c ? `var(--${x.c})` : "transparent", opacity: x.o }} />
              ))}
              {today ? (
                <div className={b.today} style={{ left: today.at * step + blockW + 1 }}>
                  {li === lanes.length - 1 ? <span>{today.label}</span> : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {legend ? <div className={b.legendWrap} style={{ marginLeft: labelW }}><Legend items={legend} /></div> : null}
      </div>
    </div>
  );
}
