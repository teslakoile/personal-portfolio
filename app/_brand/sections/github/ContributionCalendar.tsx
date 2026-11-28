"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { click, tick } from "../../../_home/sound";
import { DURATION, drawEntrance, drawSweep, fit, reachedAt, type Tile } from "./calendarFx";
import { fullDate, type Cell, type Year } from "./year";
import g from "./github.module.css";

/**
 * The GitHub section's calendar: 53 week-columns by 7 weekdays, one square a
 * day, month and weekday labels, one static line below.
 *
 * Entrance: a coral scan line crosses the grid once, and each column wakes as
 * the line reaches it (ghost square, then its color grows in under a coral
 * flash, with a small bump). The per-column delays are the inverse of the
 * line's easing so the two stay in step.
 * Hover: the square lifts like a keycap and a tooltip glides to it on a spring.
 * Press: only that square moves. It sinks on pointer down or Enter and springs
 * back on release; a quick click still holds the key down for MIN_PRESS so the
 * push reads. Sound is the site's own micro-sounds (_home/sound.ts), the same
 * tick the sidebar plays on hover: tick on hover, click on press, tick on
 * release. Pitch follows the day's contributions up a pentatonic scale, so a
 * sweep across the year rises with the busy stretches. The site's global
 * toggle controls it.
 * Idle: once the entrance is done, a chevron of light travels across the grid
 * every ~11 seconds. It is made of the tiles themselves: each one lightens and
 * carries a glint for a moment, delayed by its distance to a ">" shaped front.
 * It stops while the pointer is on the grid and is off under reduced motion.
 *
 * The entrance and the idle sweep are drawn on one canvas over the squares
 * (calendarFx.ts), because animating about 370 squares one by one dropped
 * frames. The squares stay in the DOM, and only the hovered or pressed one
 * ever animates there. During the entrance a column shows its ghost color
 * under the canvas, and takes its own color (data-on on the column) in the
 * frame the canvas stops drawing it. A square that has just stopped moving
 * hides any one-pixel difference between the two.
 */

const TIP_W = 176;
const MIN_PRESS = 150; // ms a key stays down, even on the quickest click
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // pentatonic semitones, 8 steps
const LEVEL = [g.k0, g.k1, g.k2, g.k3, g.k4];

/** Pitch rate for tick() and click(): 0.62 for an empty day up to about 1.56
    for the busiest, on a square-root scale of the day's count. */
function rateFor(count: number, max: number) {
  const step = count > 0 && max > 0 ? 1 + Math.round(Math.sqrt(count / max) * (SCALE.length - 2)) : 0;
  return 0.62 * 2 ** (SCALE[step] / 12);
}

const FIRST_SWEEP = 1100; // ms from the end of the entrance to the first idle sweep
const REST = 8000; // ms between sweeps
const GIVE_WAY = 250; // ms a sweep takes to fade when the pointer arrives

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

const plural = (n: number) => (n === 1 ? "1 contribution" : `${n.toLocaleString("en-US")} contributions`);

type Tip = { i: number; x: number; y: number };

export function ContributionCalendar({ year }: { year: Year }) {
  const reduce = useReducedMotion();
  const hovering = useRef(false);
  const [scanned, setScanned] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const columns = useRef<HTMLDivElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const scan = useRef<HTMLElement>(null);
  const legend = useRef<HTMLSpanElement>(null);
  const tiles = useRef<Tile[]>([]);
  // where the calendar is wider than its box (a phone, refined layout), it
  // opens scrolled to the present; elsewhere the box never scrolls
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth;
  }, []);
  const els = useRef<HTMLElement[]>([]);
  const lastOver = useRef(-1);
  const kb = useRef(-1);
  const down = useRef<{ el: HTMLElement; at: number; rate: number } | null>(null);
  const lifting = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inView = useInView(root, { once: true, amount: 0.4 });
  const visible = useInView(root, { amount: 0.2 });
  const mounted = useMounted();
  const [tip, setTip] = useState<Tip | null>(null);

  // with reduced motion there is no entrance, so the squares are done on sight
  const done = scanned || (inView && !!reduce);

  const { byIdx, levels, max, delays, monthDelays } = useMemo(() => {
    const byIdx: (Cell | undefined)[] = [];
    year.days.forEach((c) => { byIdx[c.week * 7 + c.weekday] = c; });
    return {
      byIdx,
      levels: Array.from({ length: year.weeks * 7 }, (_, i) => byIdx[i]?.level),
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

  // keep the canvas and the squares' boxes in step with the layout
  useEffect(() => {
    const canvas = fx.current;
    const cols = columns.current;
    if (!canvas || !cols) return;
    const ro = new ResizeObserver(() => { tiles.current = fit(canvas, cols); });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [year]);

  // entrance: the canvas draws the waking columns on the scan line's own clock
  // (its CSS animation) and hands each settled column back to the DOM
  useEffect(() => {
    if (!inView || done) return;
    const canvas = fx.current;
    const cols = columns.current;
    const c = canvas?.getContext("2d");
    const swatches = legend.current?.querySelectorAll("i");
    let id = 0;
    if (!canvas || !cols || !c || !swatches || swatches.length < LEVEL.length) {
      id = requestAnimationFrame(() => setScanned(true));
      return () => cancelAnimationFrame(id);
    }
    const colors = LEVEL.map((_, k) => getComputedStyle(swatches[k]).backgroundColor);
    const coral = getComputedStyle(canvas).getPropertyValue("--coral").trim() || "#f5482d";
    const line = scan.current?.getAnimations()[0];
    let at = 0; // ms on the line's clock when it was last read
    let read = performance.now();
    let shown = 0; // columns already handed to the DOM
    const frame = () => {
      const now = line && line.playState !== "finished" ? line.currentTime : null;
      if (typeof now === "number") { at = now; read = performance.now(); }
      const settled = drawEntrance(c, tiles.current, levels, colors, coral, delays, (at + performance.now() - read) / 1000);
      for (; shown < settled; shown++) cols.children[shown]?.setAttribute("data-on", "");
      if (settled >= delays.length) { setScanned(true); return; }
      id = requestAnimationFrame(frame);
    };
    tiles.current = fit(canvas, cols);
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [inView, done, delays, levels]);

  // idle: one sweep on the canvas, then a rest, again and again
  useEffect(() => {
    if (!scanned || !visible || reduce) return;
    const canvas = fx.current;
    const cols = columns.current;
    const c = canvas?.getContext("2d");
    if (!canvas || !cols || !c) return;
    let stopped = false;
    let wait: ReturnType<typeof setTimeout>;
    let id = 0;
    const pass = () => {
      if (stopped) return;
      if (document.hidden || hovering.current) { wait = setTimeout(pass, 1500); return; }
      tiles.current = fit(canvas, cols);
      let start = 0;
      let held: { t: number; at: number } | null = null; // where the sweep stood when the pointer arrived
      const frame = (now: number) => {
        start ||= now;
        if (hovering.current) held ??= { t: (now - start) / 1000, at: now };
        const fade = held ? 1 - (now - held.at) / GIVE_WAY : 1;
        const live = fade > 0 && drawSweep(c, tiles.current, levels, year.weeks, held ? held.t : (now - start) / 1000, fade, kb.current);
        if (live) { id = requestAnimationFrame(frame); return; }
        c.clearRect(0, 0, canvas.width, canvas.height);
        wait = setTimeout(pass, REST);
      };
      id = requestAnimationFrame(frame);
    };
    wait = setTimeout(pass, FIRST_SWEEP);
    return () => {
      stopped = true;
      clearTimeout(wait);
      cancelAnimationFrame(id);
      c.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [scanned, visible, reduce, levels, year.weeks]);

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
  // the site tooltip's note form: what the day holds, then its date
  const tipTitle = (c: Cell) => {
    if (!year.hasCounts) return `Contribution level ${c.level} of 4`;
    return c.count ? plural(c.count) : "No contributions";
  };

  const state = !mounted ? undefined : done ? "done" : inView ? "in" : "armed";

  // the squares never change, so a hover (which moves the tooltip) skips them
  const squares = useMemo(() => Array.from({ length: year.weeks }, (_, w) => (
    <div key={w} className={g.week}>
      {Array.from({ length: 7 }, (_, d) => {
        const c = byIdx[w * 7 + d];
        if (!c) return <i key={d} className={g.empty} />;
        return <i key={d} className={`${g.cell} ${LEVEL[c.level]}`} data-i={w * 7 + d} data-clickable="" />;
      })}
    </div>
  )), [byIdx, year.weeks]);

  return (
    <>
      <div
        ref={root}
        className={g.cal}
        data-state={state}
        style={{ "--dur": `${DURATION}s` } as CSSProperties}
      >
        <div ref={scroller} className={g.calScroll}>
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
            data-own-sound
            aria-label={`Contribution calendar, ${year.total.toLocaleString("en-US")} contributions in the last year. Use the arrow keys to move between days and Enter to press one.`}
            // an idle sweep in flight sees this and gives way to the pointer
            onPointerEnter={() => { hovering.current = true; }}
            onPointerOver={onOver}
            onPointerLeave={onLeave}
            onPointerDown={onPointerDown}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            <div ref={columns} className={g.weeks} style={{ "--weeks": year.weeks } as CSSProperties}>{squares}</div>
            <canvas ref={fx} className={g.fx} aria-hidden="true" />
            <div className={g.scan} aria-hidden="true"><i ref={scan} /></div>

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
                  <div className={g.tipCard}>
                    <b>{tipTitle(cell)}</b>
                    <span>{fullDate(cell)}</span>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
        </div>
      </div>

      <div className={g.readout}>
        <span><b>{year.total.toLocaleString("en-US")}</b> contributions in the last year</span>
        <span ref={legend} className={g.legend} aria-hidden="true">
          Less <span /> {LEVEL.map((l, i) => <i key={i} className={l} />)} <span /> More
        </span>
      </div>
    </>
  );
}
