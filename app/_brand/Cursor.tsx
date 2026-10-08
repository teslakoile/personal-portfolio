"use client";

import { useEffect, useRef } from "react";
import k from "./cursor.module.css";
import { spark, RELEASE } from "./clickFx";

/**
 * Drawn cursor for the redesign. The OS cursor cannot animate between shapes,
 * so this hides it and draws the site pointer at the mouse position. Over
 * anything clickable the pointer transforms into a hand (Phosphor
 * "hand-pointing", fill weight, MIT), in the sense of UX in Motion's
 * "transformation": one shape changing continuously, no wobble.
 *
 * Both outlines are sampled into the same number of points. Each point
 * travels a curve (a quadratic Bezier) from its arrow position, past a soft
 * blob made from the two shapes, to its hand position, so the middle of the
 * change is a rounded blob and the motion never kinks there. Any click, on
 * anything, throws a coral spark (clickFx.ts) while the pointer presses in,
 * then springs back. Text fields keep the system text cursor; touch screens never
 * mount it.
 */
const CLICKABLE = 'a[href], button:not(:disabled), select, summary, label[for], [role="button"], [role="link"], [role="tab"], [data-clickable], input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"]';
const TEXT = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';

/** lucide mouse-pointer-2, as in public/cursors/pointer.svg */
const ARROW = "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z";
/** Phosphor hand-pointing-fill (256 grid) */
const HAND = "M224,104v50.93c0,46.2-36.85,84.55-83,85.06A83.71,83.71,0,0,1,80.6,215.4C58.79,192.33,34.15,136,34.15,136a16,16,0,0,1,6.53-22.23c7.66-4,17.1-.84,21.4,6.62l21,36.44a6.09,6.09,0,0,0,6,3.09l.12,0A8.19,8.19,0,0,0,96,151.74V32a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V104a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V88a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V112a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25v-7.28c0-8.61,6.62-16,15.23-16.43A16,16,0,0,1,224,104Z";

type Pt = [number, number];
const N = 96;

/** Both shapes in cursor pixels with the click point at (0, 0): the arrow
    tilted 22.5 degrees and 15% larger (its tip at the origin), the hand at
    26px with the fingertip at the origin. */
const toPx = {
  arrow: ([x, y]: Pt): Pt => {
    const r = (22.5 * Math.PI) / 180, s = 1.15, dx = (x - 4.04) * s, dy = (y - 4.04) * s;
    return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)];
  },
  hand: ([x, y]: Pt): Pt => [x * (26 / 256) - 11.4, y * (26 / 256) - 2.2],
};

/** N points evenly spaced along a path's outline, mapped by `map` */
function sample(d: string, map: (p: Pt) => Pt): Pt[] {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  const len = path.getTotalLength();
  return Array.from({ length: N }, (_, i) => { const p = path.getPointAtLength((i / N) * len); return map([p.x, p.y]); });
}

/** Turn b so it runs the same way round as a and starts at the point that
    keeps every pair closest, so the morph never twists. */
function align(a: Pt[], b: Pt[]): Pt[] {
  const area = (q: Pt[]) => q.reduce((s, p, i) => { const n = q[(i + 1) % q.length]; return s + p[0] * n[1] - n[0] * p[1]; }, 0);
  const ring = Math.sign(area(a)) === Math.sign(area(b)) ? b : [...b].reverse();
  let best = 0, bestCost = Infinity;
  for (let k = 0; k < N; k++) {
    let cost = 0;
    for (let i = 0; i < N; i++) { const p = a[i], q = ring[(i + k) % N]; cost += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; }
    if (cost < bestCost) { bestCost = cost; best = k; }
  }
  return a.map((_, i) => ring[(i + best) % N]);
}

/** Melt the outline toward a blob: each pass pulls every point toward the
    mean of its neighbours, so corners and fingers round off. */
function melt(p: Pt[], amount: number): Pt[] {
  let q = p;
  for (let k = 0; k < Math.round(amount * 10); k++) {
    q = q.map((pt, i) => {
      const a = q[(i - 1 + N) % N], b = q[(i + 1) % N];
      return [pt[0] * 0.4 + (a[0] + b[0]) * 0.3, pt[1] * 0.4 + (a[1] + b[1]) * 0.3];
    });
  }
  return q;
}

/** Puff the outline out from its centre by `px`, so the blob looks full. */
function inflate(p: Pt[], px: number): Pt[] {
  const cx = p.reduce((s, q) => s + q[0], 0) / N, cy = p.reduce((s, q) => s + q[1], 0) / N;
  return p.map(([x, y]) => { const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) || 1; return [x + (dx / r) * px, y + (dy / r) * px]; });
}

/** a closed Catmull-Rom curve through the points, as cubic Beziers */
function smooth(p: Pt[]): string {
  const f = (n: number) => n.toFixed(2);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length; i++) {
    const p0 = p[(i - 1 + N) % N], p1 = p[i], p2 = p[(i + 1) % N], p3 = p[(i + 2) % N];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}

/** time for a full change, ms */
const MS = 260;
const clamp = (x: number) => Math.min(Math.max(x, 0), 1);
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export function Cursor() {
  const el = useRef<HTMLDivElement>(null);
  const shape = useRef<SVGPathElement>(null);
  const press = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = el.current, path = shape.current, body = press.current;
    if (!c || !path || !body || !matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement;
    root.dataset.kc = "";
    const still = matchMedia("(prefers-reduced-motion: reduce)");

    // arrow, hand, and the blob between them: the two shapes averaged, then
    // melted round and puffed a little so the middle reads as one soft body
    const A = sample(ARROW, toPx.arrow);
    const H = align(A, sample(HAND, toPx.hand));
    const B = inflate(melt(A.map(([x, y], i): Pt => [(x + H[i][0]) / 2, (y + H[i][1]) / 2]), 1.6), 1.2);
    // a quadratic Bezier per point; with B as the control the midpoint sits
    // halfway between the average and the blob, and velocity stays smooth
    const at = (t: number) => {
      const a = (1 - t) ** 2, b = 2 * t * (1 - t), h = t * t;
      // a light melt as it travels keeps the in-between outline clean
      return melt(A.map(([x, y], i): Pt => [a * x + b * B[i][0] + h * H[i][0], a * y + b * B[i][1] + h * H[i][1]]), Math.sin(Math.PI * t) * 0.5);
    };

    // at rest each end is drawn from its exact source path, scaled into place;
    // in between, the sampled points are already in cursor pixels. The paper
    // edge stays 2.2px wide (half of it shows, outside the fill).
    const EDGE = 2.2;
    const ends: Record<number, [string, string, number]> = {
      0: [ARROW, "scale(1.15) rotate(22.5) translate(-4.04 -4.04)", 1.15],
      1: [HAND, "translate(-11.4 -2.2) scale(0.1016)", 0.1016],
    };
    const paint = (d: string, transform: string | null, scale: number) => {
      path.setAttribute("d", d);
      if (transform) path.setAttribute("transform", transform); else path.removeAttribute("transform");
      path.setAttribute("stroke-width", String(EDGE / scale));
    };

    // t runs from 0 (arrow) to 1 (hand); a reversal mid-way starts from where
    // the shape is, so it never jumps
    let t = 0, goal = 0, from = 0, began = 0, raf = 0;
    const draw = () => {
      if (t === 0 || t === 1) { const [d, tf, sc] = ends[t]; paint(d, tf, sc); return; }
      paint(smooth(at(t)), null, 1);
    };
    const step = () => {
      const x = clamp((performance.now() - began) / (MS * Math.abs(goal - from)));
      t = from + (goal - from) * inOut(x);
      if (x >= 1) { t = goal; raf = 0; draw(); return; }
      draw();
      raf = requestAnimationFrame(step);
    };
    const to = (g: number) => {
      if (g === goal) return;
      goal = g;
      if (still.matches) { t = g; draw(); return; }
      from = t; began = performance.now();
      if (!raf) raf = requestAnimationFrame(step);
    };

    const set = (key: string, val: string | null) => {
      if ((c.dataset[key] ?? null) === val) return;
      if (val === null) delete c.dataset[key]; else c.dataset[key] = val;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      c.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      const target = e.target instanceof Element ? e.target : null;
      const text = !!target?.closest(TEXT), hover = !text && !!target?.closest(CLICKABLE);
      set("state", text ? "text" : hover ? "hover" : "rest");
      to(hover ? 1 : 0);
      set("shown", "");
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      set("down", "");
      if (!still.matches) spark(e.clientX, e.clientY);
    };
    const up = () => {
      if (c.dataset.down === undefined) return;
      set("down", null);
      if (!still.matches) body.animate(RELEASE, { duration: 280 });
    };
    const leave = () => set("shown", null);
    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerdown", down, { passive: true });
    addEventListener("pointerup", up, { passive: true });
    root.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", down);
      removeEventListener("pointerup", up);
      root.removeEventListener("pointerleave", leave);
      delete root.dataset.kc;
    };
  }, []);

  return (
    <div ref={el} className={k.cursor} aria-hidden="true">
      <div ref={press} className={k.press}>
        {/* drawn in cursor pixels; the click point is (0, 0) */}
        <svg className={k.shape} width="36" height="36" viewBox="-12 -5 36 36">
          <path ref={shape} d={ARROW} transform="scale(1.15) rotate(22.5) translate(-4.04 -4.04)" fill="#f5482d" stroke="#faf9f7" strokeWidth={2.2 / 1.15} strokeLinejoin="round" paintOrder="stroke" />
        </svg>
      </div>
    </div>
  );
}
