"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { click as clickSound, tick as tickSound } from "../_home/sound";
import b from "./brand.module.css";

export type RailNavItem = { id: string; label: string; num?: string };

/** How the active row moves to a new section, on a click or as the page
    scrolls:
      slide   one shared Motion element springs from the old row to the new
              (the classic rail's coral tick)
      ripple  the new row fills as a circle growing from the click point (from
              the left edge when scrolling moved it) and the old row fades out
              (the ruled rail, picked 2026-10-15) */
export type RailMove = "slide" | "ripple";
const SPRING: Transition = { type: "spring", stiffness: 500, damping: 40 };
const FILL: Transition = { duration: 0.34, ease: [0.22, 1, 0.36, 1] };

/* The active section is the last one whose top has passed this line, a
   fraction of the window down from the top. */
const LINE = 0.3;
/* A click pins its section until the visitor scrolls on their own: a wheel,
   touch, or scroll key, or the page moving this far from where the click's
   scroll came to rest (a scrollbar drag). This keeps a short section active
   after its click even when the line falls in the next section. */
const DRIFT_PX = 80;
const SETTLE_MS = 140;
/* Row hover ticks rise in pitch down the list, a small scale. */
const PITCH_STEP = 0.035;

/** Numbered section links for the sidebar rail. The active row follows the
    section on screen and jumps to a link as soon as it is clicked.

    Tracking is cheap and frame-exact: section tops are measured once (again
    on resize or when a section changes size) in page coordinates, and each
    scroll schedules at most one update per animation frame that compares
    those cached tops with scrollY, so scrolling reads no layout. Fast scrolls
    land on the right row on the next frame (no band to skip past), the last
    section wins at the bottom of the page even when it is too short to reach
    the line, and a clicked section stays pinned (see DRIFT_PX).

    Rows tick on hover (pitch rising down the list) and click on press, via
    the site's sound setting. When none of the item ids exist on the page,
    `active` stays put. animate={false} swaps the row instantly. */
export function RailNav({ items, active, animate = true, move = "slide" }: {
  items: RailNavItem[];
  active?: string;
  animate?: boolean;
  move?: RailMove;
}) {
  const [current, setCurrent] = useState(active);
  const markerId = `rail-marker-${useId()}`;
  const reduced = useReducedMotion();
  // where the last click landed inside its row, for ripple
  const [origin, setOrigin] = useState<{ id: string; x: number; y: number } | null>(null);
  const pin = useRef<{ id: string; settledY: number | null; settle?: number } | null>(null);
  const ids = items.map((x) => x.id).join(" ");

  useEffect(() => {
    const order = ids.split(" ");
    const els = order.map((id) => document.getElementById(id));
    if (!els.some(Boolean)) return;

    let tops: number[] = [];
    let raf = 0;
    const measure = () => {
      const y = window.scrollY;
      tops = els.map((el) => (el ? el.getBoundingClientRect().top + y : Infinity));
    };
    const update = () => {
      raf = 0;
      const p = pin.current;
      if (p) {
        // still travelling to the clicked section, or resting near where it stopped
        if (p.settledY === null || Math.abs(window.scrollY - p.settledY) < DRIFT_PX) return;
        pin.current = null;
      }
      const y = window.scrollY, vh = window.innerHeight;
      const atBottom = y + vh >= document.documentElement.scrollHeight - 2;
      let i = 0;
      if (atBottom) {
        // the last section that has come into view, however short it is
        for (let k = tops.length - 1; k >= 0; k--) if (tops[k] < y + vh) { i = k; break; }
      } else {
        const line = y + vh * LINE;
        for (let k = 0; k < tops.length; k++) if (tops[k] <= line) i = k;
      }
      setCurrent(order[i]);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

    const onScroll = () => {
      const p = pin.current;
      if (p && p.settledY === null) {
        // the click's smooth scroll is still moving: rest once it stops
        window.clearTimeout(p.settle);
        p.settle = window.setTimeout(() => { if (pin.current === p) p.settledY = window.scrollY; }, SETTLE_MS);
      }
      schedule();
    };
    // the visitor scrolling on their own ends a pin at once
    const release = () => { if (pin.current) { window.clearTimeout(pin.current.settle); pin.current = null; schedule(); } };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) release();
    };
    const remeasure = () => { measure(); schedule(); };

    measure();
    update();
    const ro = new ResizeObserver(remeasure);
    els.forEach((el) => el && ro.observe(el));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchstart", release, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      window.removeEventListener("keydown", onKey);
      if (pin.current) window.clearTimeout(pin.current.settle);
    };
  }, [ids]);

  const onPick = useCallback((id: string, e: MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ id, x: e.clientX - r.left, y: e.clientY - r.top });
    setCurrent(id);
    clickSound();
    if (!document.getElementById(id)) return; // no tracked section on this page
    const p: { id: string; settledY: number | null; settle?: number } = { id, settledY: null };
    if (pin.current) window.clearTimeout(pin.current.settle);
    pin.current = p;
    // if the page is already there and never scrolls, rest right away
    p.settle = window.setTimeout(() => { if (pin.current === p) p.settledY = window.scrollY; }, SETTLE_MS * 3);
  }, []);

  return (
    // layoutRoot (slide only): the rail is sticky, so Motion measures the
    // marker inside the nav rather than on the page; otherwise page scroll
    // reads as the marker moving and it drifts off its row mid-scroll
    <motion.nav layoutRoot={move === "slide"} className={`${b.nav} ${animate ? b.navLive : ""}`} data-move={animate ? move : undefined} aria-label="Sections" data-own-sound>
      {items.map((x, i) => {
        const on = x.id === current;
        const o = origin?.id === x.id ? `${origin.x}px ${origin.y}px` : "0px 50%";
        return (
          <a key={x.id} href={`#${x.id}`} className={`${b.navItem} ${on ? b.navActive : ""}`}
            aria-current={on ? "true" : undefined} onClick={(e) => onPick(x.id, e)} onMouseEnter={() => tickSound(1 + i * PITCH_STEP)}>
            {animate && move === "slide" && on ? (
              <motion.i layoutId={markerId} className={b.navMarker} transition={SPRING} aria-hidden />
            ) : null}
            {animate && move === "ripple" ? (
              <AnimatePresence initial={false}>
                {on ? (
                  <motion.i key="m" className={b.navMarker} aria-hidden
                    initial={reduced ? false : { clipPath: `circle(0px at ${o})` }}
                    animate={{ clipPath: `circle(260px at ${o})` }}
                    exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.2 } }} transition={FILL} />
                ) : null}
              </AnimatePresence>
            ) : null}
            <span>{x.num ?? String(i + 1).padStart(2, "0")}</span>{x.label}
          </a>
        );
      })}
    </motion.nav>
  );
}
