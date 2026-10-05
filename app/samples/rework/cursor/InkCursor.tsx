"use client";

import { useEffect, useRef } from "react";
import c from "./pointer.module.css";

/**
 * The visitor's own cursor: the ink arrow, drawn in the page so it can move.
 * Its position is written inside the pointer event itself (never a frame
 * late); only the lean is eased. States, all driven by data attributes:
 *
 *   idle     ink arrow, paper edge, soft shadow
 *   link     fills coral, grows 8%, and a small badge says where it goes:
 *            ↗ another site, @ email, ↓ download, → somewhere on this page
 *   grab     the case-file pile: an ↔ badge, and a tighter squeeze on press
 *   text     over body copy it becomes an I-beam sized to the line
 *   field    inputs keep the native text cursor; this one steps aside
 *   pressed  a quick squeeze that springs back on release
 *
 * Mounted only for a fine pointer without reduced motion.
 */

export const ARROW_PATH = "M4 3 L4 19.8 L8.4 15.9 L11.3 22.4 L14.6 21 L11.8 14.7 L17.6 14.7 Z";
const INTERACTIVE = 'a, button, [role="button"], summary, label, select';
const FIELD = 'input, textarea, [contenteditable="true"]';

function badgeFor(link: Element): string {
  const a = link.closest("a");
  if (!a) return "";
  const href = a.getAttribute("href") ?? "";
  if (a.hasAttribute("download")) return "↓";
  if (href.startsWith("mailto:")) return "@";
  try {
    const u = new URL(href, window.location.href);
    return u.host !== window.location.host ? "↗" : "→";
  } catch {
    return "";
  }
}

export function InkCursor() {
  const root = useRef<HTMLDivElement>(null);
  const tiltEl = useRef<HTMLDivElement>(null);
  const badge = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current, tilt = tiltEl.current, bd = badge.current;
    if (!el || !tilt || !bd) return;
    let last = { x: 0, y: 0 }, lean = 0, raf = 0, shown = false;
    let mode = "", glyph = "";

    const settle = () => {
      lean *= 0.82;
      tilt.style.setProperty("--lean", `${lean.toFixed(2)}deg`);
      raf = Math.abs(lean) > 0.05 ? requestAnimationFrame(settle) : 0;
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const x = e.clientX, y = e.clientY;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!shown) { shown = true; el.dataset.shown = "true"; last = { x, y }; }
      // lean a few degrees into fast horizontal moves, eased back upright
      lean = Math.max(-8, Math.min(8, lean * 0.6 + (x - last.x) * 0.35));
      tilt.style.setProperty("--lean", `${lean.toFixed(2)}deg`);
      if (!raf) raf = requestAnimationFrame(settle);
      last = { x, y };

      const t = e.target instanceof Element ? e.target : null;
      const field = t?.closest(FIELD);
      const link = field ? null : t?.closest(INTERACTIVE) ?? null;
      const grab = !field && !link && t?.closest('[class*="fsGrab"]');
      const textual = !field && !link && !grab && t && [...t.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim());
      const next = field ? "field" : link ? "link" : grab ? "grab" : textual ? "text" : "idle";
      if (next !== mode) {
        mode = next;
        el.dataset.mode = next;
        if (next === "text" && t) {
          const fs = parseFloat(getComputedStyle(t).fontSize) || 16;
          el.style.setProperty("--beam", `${Math.round(fs * 1.2)}px`);
        }
      }
      const g = link ? badgeFor(link) : grab ? "↔" : "";
      if (g !== glyph) {
        glyph = g;
        if (g) bd.textContent = g;
        el.dataset.badge = g ? "true" : "false";
      }
    };
    const down = (e: PointerEvent) => { if (e.pointerType === "mouse" || e.pointerType === "pen") el.dataset.pressed = "true"; };
    const up = () => { delete el.dataset.pressed; };
    const leave = () => { shown = false; delete el.dataset.shown; };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={root} className={c.ink} aria-hidden="true">
      <div ref={tiltEl} className={c.inkTilt}>
        <div className={c.inkScale}>
          <svg className={c.inkArrow} width="22" height="22" viewBox="0 0 24 24">
            <path d={ARROW_PATH} stroke="#faf9f7" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <span ref={badge} className={c.inkBadge} />
        </div>
        <span className={c.inkBeam} />
      </div>
    </div>
  );
}
