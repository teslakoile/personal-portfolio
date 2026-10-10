"use client";

import { motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import b from "./brand.module.css";

export type RailNavItem = { id: string; label: string; num?: string };

/* The band of the viewport that decides the active section: a section is
   "on screen" while it crosses the line 40% to 45% down the window. */
const BAND = "-40% 0px -55% 0px";
/* After a click, scroll-spy stays quiet until the smooth scroll settles, so
   the marker goes straight to the clicked row instead of visiting each row
   the page scrolls past. */
const SETTLE_MS = 160;
const MAX_LOCK_MS = 1600;

const SPRING = { type: "spring", stiffness: 500, damping: 40 } as const;

/** Numbered section links for the sidebar rail. The coral tick follows the
    section on screen (IntersectionObserver on the elements whose ids match
    the items) and jumps to a link as soon as it is clicked. With animate,
    the tick slides between rows as one shared Motion layout element; without
    it, the tick swaps rows instantly, as the original static rail did. When
    none of the item ids exist on the page, `active` stays put. */
export function RailNav({ items, active, animate = true }: {
  items: RailNavItem[];
  active?: string;
  animate?: boolean;
}) {
  const [current, setCurrent] = useState(active);
  const markerId = `rail-marker-${useId()}`;
  const lock = useRef<{ settle?: number; max?: number } | null>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const ids = items.map((x) => x.id).join(" ");

  useEffect(() => {
    const order = ids.split(" ");
    const els = order.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;

    const inBand = new Set<string>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) inBand.add(e.target.id);
        else inBand.delete(e.target.id);
      }
      if (lock.current) return;
      const first = order.find((id) => inBand.has(id));
      if (first) setCurrent(first);
    }, { rootMargin: BAND });
    els.forEach((el) => io.observe(el));

    const release = () => {
      const l = lock.current;
      if (!l) return;
      window.clearTimeout(l.settle);
      window.clearTimeout(l.max);
      lock.current = null;
      const first = order.find((id) => inBand.has(id));
      if (first) setCurrent(first);
    };
    const onScroll = () => {
      const l = lock.current;
      if (!l) return;
      window.clearTimeout(l.settle);
      l.settle = window.setTimeout(release, SETTLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    // The click handler starts the lock; it hands release over through the ref.
    releaseRef.current = release;

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll, { capture: true });
      const l = lock.current;
      if (l) { window.clearTimeout(l.settle); window.clearTimeout(l.max); }
      lock.current = null;
      releaseRef.current = null;
    };
  }, [ids]);

  const onPick = (id: string) => {
    setCurrent(id);
    const release = releaseRef.current;
    if (!release) return; // no tracked sections on this page
    const prev = lock.current;
    if (prev) { window.clearTimeout(prev.settle); window.clearTimeout(prev.max); }
    lock.current = {
      // If the page does not scroll at all (already there), release soon.
      settle: window.setTimeout(release, SETTLE_MS * 2),
      max: window.setTimeout(release, MAX_LOCK_MS),
    };
  };

  return (
    <nav className={`${b.nav} ${animate ? b.navLive : ""}`} aria-label="Sections">
      {items.map((x, i) => {
        const on = x.id === current;
        return (
          <a key={x.id} href={`#${x.id}`} className={`${b.navItem} ${on ? b.navActive : ""}`}
            aria-current={on ? "true" : undefined} onClick={() => onPick(x.id)}>
            {animate && on ? (
              <motion.i layoutId={markerId} className={b.navMarker} transition={SPRING} aria-hidden />
            ) : null}
            <span>{x.num ?? String(i + 1).padStart(2, "0")}</span>{x.label}
          </a>
        );
      })}
    </nav>
  );
}
