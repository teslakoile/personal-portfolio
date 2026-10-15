"use client";

import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { click, tick } from "../../../_home/sound";
import { fullDate, type Cell, type Year } from "./year";
import g from "./github.module.css";

/**
 * The GitHub section's calendar: 53 week-columns by 7 weekdays, one square a
 * day, month and weekday labels, one static line below.
 *
 * Entrance: a coral scan line crosses the grid once, and each column wakes as
 * the line reaches it (ghost square, then its color grows in under a coral
 * flash, with a small bump). Everything is opacity and transform, and the
 * per-column delays are the inverse of the line's easing so the two stay in
 * step.
 * Hover: the square lifts like a keycap and a tooltip glides to it on a spring.
 * Press: only that square moves. It sinks on pointer down or Enter and springs
 * back on release; a quick click still holds the key down for MIN_PRESS so the
 * push reads. Sound is the site's own micro-sounds (_home/sound.ts), the same
 * tick the sidebar plays on hover: tick on hover, click on press, tick on
 * release. Pitch follows the day's contributions up a pentatonic scale, so a
 * sweep across the year rises with the busy stretches. The site's global
 * toggle controls it.
 * Idle: once the entrance is done, a chevron of light travels across the grid
 * every ~11 seconds. It is made of the tiles themselves: Motion animates each
 * tile's own --gloss (0 to 1 to 0), which lightens its color and draws a glint
 * across it, with each tile's delay set by its distance to a ">" shaped front.
 * It stops while the pointer is on the grid and is off under reduced motion.
 */

const DURATION = 1.7; // s, scan line end to end
const [X1, Y1, X2, Y2] = [0.5, 0, 0.2, 1]; // the scan line's easing, also set in CSS
const TIP_W = 176;
const MIN_PRESS = 150; // ms a key stays down, even on the quickest click
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // pentatonic semitones, 8 steps
const LEVEL = [g.k0, g.k1, g.k2, g.k3, g.k4];

/** Point on one axis of a cubic bezier with end points 0 and 1. */
const B = (s: number, a: number, b: number) => 3 * (1 - s) ** 2 * s * a + 3 * (1 - s) * s * s * b + s ** 3;

/** Seconds into the scan at which the line reaches fraction `f` of the width. */
function reachedAt(f: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (B(mid, Y1, Y2) < f) lo = mid; else hi = mid;
  }
  return B((lo + hi) / 2, X1, X2) * DURATION;
}

/** Pitch rate for tick() and click(): 0.62 for an empty day up to about 1.56
    for the busiest, on a square-root scale of the day's count. */
function rateFor(count: number, max: number) {
  const step = count > 0 && max > 0 ? 1 + Math.round(Math.sqrt(count / max) * (SCALE.length - 2)) : 0;
  return 0.62 * 2 ** (SCALE[step] / 12);
}

// idle sweep: the front crosses the grid in SWEEP s; each tile glows for GLOW s,
// so the lit chevron is about GLOW / SWEEP of the grid thick. LEAD is how many
// columns each row steps back from the middle row, which sets the ">" angle.
const SWEEP = 3.4;
const GLOW = 0.42;
const LEAD = 1.8;
const REST = 8000; // ms between sweeps

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

const plural = (n: number) => (n === 1 ? "1 contribution" : `${n.toLocaleString("en-US")} contributions`);

type Tip = { i: number; x: number; y: number };

export function ContributionCalendar({ year }: { year: Year }) {
  const reduce = useReducedMotion();
  const hovering = useRef(false);
  const sweep = useRef<ReturnType<typeof animate> | null>(null);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const els = useRef<HTMLElement[]>([]);
  const lastOver = useRef(-1);
  const kb = useRef(-1);
  const down = useRef<{ el: HTMLElement; at: number; rate: number } | null>(null);
  const lifting = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inView = useInView(root, { once: true, amount: 0.4 });
  const visible = useInView(root, { amount: 0.2 });
  const mounted = useMounted();
  const [tip, setTip] = useState<Tip | null>(null);

  const { byIdx, max, delays, monthDelays } = useMemo(() => {
    const byIdx: (Cell | undefined)[] = [];
    year.days.forEach((c) => { byIdx[c.week * 7 + c.weekday] = c; });
    return {
      byIdx,
      max: Math.max(...year.days.map((c) => c.count)),
      delays: Array.from({ length: year.weeks }, (_, w) => reachedAt((w + 0.5) / year.weeks)),
      monthDelays: year.monthStarts.map((m) => reachedAt(m.week / year.weeks)),
    };
  }, [year]);

  // index the squares by week * 7 + weekday
  useEffect(() => {
    const list: HTMLElement[] = [];
    grid.current?.querySelectorAll<HTMLElement>("i[data-i]").forEach((el) => { list[Number(el.dataset.i)] = el; });
    els.current = list;
  }, [year]);

  // the idle sweep starts once the entrance scan has finished
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setReady(true), (DURATION + 1) * 1000);
    return () => clearTimeout(t);
  }, [inView]);

  // idle: one Motion animation over every tile, delayed by its distance to a
  // ">" front, then a rest, again and again
  useEffect(() => {
    if (!ready || !visible || reduce) return;
    const tiles: HTMLElement[] = [];
    const order: number[] = [];
    els.current.forEach((el, i) => { if (el) { tiles.push(el); order.push(i); } });
    const delayOf = (k: number) => {
      const w = Math.floor(order[k] / 7);
      const d = order[k] % 7;
      const front = w - (3 - Math.abs(d - 3)) * LEAD; // middle row leads
      return ((front + 3 * LEAD) / (year.weeks + 3 * LEAD)) * SWEEP;
    };
    let stopped = false;
    let wait: ReturnType<typeof setTimeout>;
    const pass = () => {
      if (stopped) return;
      if (document.hidden || hovering.current) { wait = setTimeout(pass, 1500); return; }
      sweep.current = animate(tiles, { "--gloss": [0, 1, 0] }, { duration: GLOW, ease: "easeInOut", delay: (k: number) => delayOf(k) });
      sweep.current.then(() => { if (!stopped) wait = setTimeout(pass, REST); });
    };
    wait = setTimeout(pass, 700);
    return () => {
      stopped = true;
      clearTimeout(wait);
      sweep.current?.stop();
    };
  }, [ready, visible, reduce, year.weeks]);

  const show = (i: number) => {
    const el = els.current[i];
    const box = grid.current;
    if (!el || !box) return;
    const half = TIP_W / 2 + 4;
    const x = Math.min(Math.max(el.offsetLeft + el.offsetWidth / 2, half), box.offsetWidth - half);
    setTip({ i, x, y: el.offsetTop });
  };

  const rateOf = (i: number) => rateFor(byIdx[i]?.count ?? 0, max);

  /** The key goes down: only this square moves. */
  const press = (i: number, at: number) => {
    const el = els.current[i];
    if (!el) return;
    if (lifting.current) { clearTimeout(lifting.current); lifting.current = null; }
    release(null);
    delete el.dataset.up;
    el.dataset.down = "";
    down.current = { el, at, rate: rateOf(i) };
    click(down.current.rate);
  };

  /** The key comes back up, with a small overshoot (CSS, data-up). */
  const release = (at: number | null) => {
    const d = down.current;
    if (!d) return;
    down.current = null;
    const lift = () => {
      lifting.current = null;
      delete d.el.dataset.down;
      d.el.dataset.up = "";
      setTimeout(() => { delete d.el.dataset.up; }, 420);
    };
    if (at === null) {
      lift();
      return;
    }
    lifting.current = setTimeout(lift, Math.max(0, MIN_PRESS - (at - d.at)));
    tick(d.rate);
  };

  const cellOf = (e: React.SyntheticEvent) => (e.target as HTMLElement).closest<HTMLElement>("i[data-i]");

  const onOver = (e: React.PointerEvent) => {
    const el = cellOf(e);
    if (!el) return;
    const i = Number(el.dataset.i);
    if (i === lastOver.current) return;
    lastOver.current = i;
    show(i);
    if (e.pointerType !== "touch") tick(rateOf(i));
  };

  const onLeave = () => {
    hovering.current = false;
    lastOver.current = -1;
    if (kb.current < 0) setTip(null);
    else show(kb.current);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const el = cellOf(e);
    if (!el || e.button > 0) return;
    press(Number(el.dataset.i), e.timeStamp);
    // the key comes up wherever the pointer is let go
    const up = (ev: Event) => release(ev.timeStamp);
    window.addEventListener("pointerup", up, { once: true });
    window.addEventListener("pointercancel", up, { once: true });
  };

  const moveKb = (i: number) => {
    if (!els.current[i]) return;
    if (kb.current >= 0) els.current[kb.current]?.removeAttribute("data-kb");
    kb.current = i;
    els.current[i].setAttribute("data-kb", "");
    show(i);
    tick(rateOf(i));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = kb.current;
    const step: Record<string, number> = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 };
    if (e.key in step && i >= 0) {
      e.preventDefault();
      const n = i + step[e.key];
      // stay in the same column when moving up or down
      if (Math.abs(step[e.key]) === 1 && Math.floor(n / 7) !== Math.floor(i / 7)) return;
      moveKb(n);
    } else if (e.key === "Home") {
      e.preventDefault();
      moveKb(year.days[0].week * 7 + year.days[0].weekday);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = year.days[year.days.length - 1];
      moveKb(last.week * 7 + last.weekday);
    } else if ((e.key === "Enter" || e.key === " ") && i >= 0) {
      e.preventDefault();
      if (!e.repeat) press(i, e.timeStamp);
    }
  };

  const onKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") release(e.timeStamp);
  };

  useEffect(() => () => { if (lifting.current) clearTimeout(lifting.current); }, []);

  const onFocus = (e: React.FocusEvent) => {
    if (!e.currentTarget.matches(":focus-visible") || kb.current >= 0) return;
    moveKb(year.bestDay.week * 7 + year.bestDay.weekday);
  };

  const onBlur = () => {
    release(null);
    if (kb.current >= 0) els.current[kb.current]?.removeAttribute("data-kb");
    kb.current = -1;
    setTip(null);
  };

  const cell = tip ? byIdx[tip.i] : undefined;
  const tipNote = (c: Cell) => {
    if (!year.hasCounts) return `Level ${c.level} of 4`;
    return c.date === year.bestDay.date ? "Busiest day of the year" : null;
  };

  const state = !mounted ? undefined : inView ? "in" : "armed";

  return (
    <>
      <div
        ref={root}
        className={g.cal}
        data-state={state}
        data-idle-on={ready ? "" : undefined}
        style={{ "--dur": `${DURATION}s` } as CSSProperties}
      >
        <div className={g.calBody}>
          <div className={g.months} style={{ "--weeks": year.weeks } as CSSProperties} aria-hidden="true">
            {year.monthStarts.map((m, k) => (
              <span key={m.week} style={{ gridColumn: `${m.week + 1} / span 4`, "--d": `${monthDelays[k].toFixed(3)}s` } as CSSProperties}>{m.label}</span>
            ))}
          </div>
          <div className={g.wdays} aria-hidden="true">
            {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div
            ref={grid}
            className={g.grid}
            role="group"
            tabIndex={0}
            aria-label={`Contribution calendar, ${year.total.toLocaleString("en-US")} contributions in the last year. Use the arrow keys to move between days and Enter to press one.`}
            onPointerEnter={() => {
              // an idle sweep in flight gives way to the pointer
              hovering.current = true;
              if (sweep.current) {
                sweep.current.stop();
                sweep.current = null;
                animate(els.current.filter(Boolean), { "--gloss": 0 }, { duration: 0.25 });
              }
            }}
            onPointerOver={onOver}
            onPointerLeave={onLeave}
            onPointerDown={onPointerDown}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            <div className={g.weeks} style={{ "--weeks": year.weeks } as CSSProperties}>
              {Array.from({ length: year.weeks }, (_, w) => (
                <div key={w} className={g.week}>
                  {Array.from({ length: 7 }, (_, d) => {
                    const c = byIdx[w * 7 + d];
                    if (!c) return <i key={d} className={g.empty} />;
                    return (
                      <i
                        key={d}
                        className={`${g.cell} ${LEVEL[c.level]}`}
                        data-i={w * 7 + d}
                        data-clickable=""
                        style={{ "--d": `${delays[w].toFixed(3)}s` } as CSSProperties}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className={g.scan} aria-hidden="true"><i /></div>

            <AnimatePresence>
              {tip && cell ? (
                <motion.div
                  key="tip"
                  className={g.tip}
                  role="status"
                  initial={{ opacity: 0, scale: 0.9, x: tip.x, y: tip.y }}
                  animate={{ opacity: 1, scale: 1, x: tip.x, y: tip.y }}
                  exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.1 } }}
                  transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.7 }}
                >
                  <div className={g.tipCard} style={{ width: TIP_W }}>
                    <b>{year.hasCounts ? (cell.count ? plural(cell.count) : "No contributions") : "Contributions"}</b>
                    <span>{fullDate(cell)}</span>
                    {tipNote(cell) ? <em>{tipNote(cell)}</em> : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className={g.readout}>
        <span><b>{year.total.toLocaleString("en-US")}</b> contributions in the last year</span>
        <span className={g.legend} aria-hidden="true">
          Less <span /> {LEVEL.map((l, i) => <i key={i} className={l} />)} <span /> More
        </span>
      </div>
    </>
  );
}
