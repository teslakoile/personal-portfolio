"use client";

import { useEffect, useRef, useState } from "react";
import k from "./cursor.module.css";
import { spark, RELEASE, LAND } from "./clickFx";
import { ChevronLoader } from "../samples/loaders/Loaders";
import { ASK_VERBS } from "../samples/states/verbs";

/**
 * Drawn cursor for the redesign. The OS cursor cannot animate between shapes,
 * so this hides it and draws the site pointer at the mouse position. The
 * pointer is one shape that transforms into another, in the sense of UX in
 * Motion's "transformation": one outline changing continuously, no wobble.
 *
 * States, in priority order (the first match wins):
 *   busy      [aria-busy="true"], [data-busy]       the pointer becomes the loader:
 *                                                    chevron and a shimmering verb
 *   blocked   :disabled, [aria-disabled="true"],    the pointer morphs into a coral
 *             [data-blocked]                        prohibit sign (ring and slash)
 *   field     input, textarea, [contenteditable]    I-beam
 *   link      anything clickable                    hand
 *   text      a line of selectable text             I-beam
 *   rest      everything else                       arrow
 *
 * Busy reuses the site's loader: the chevron and a shimmering verb
 * (app/samples/states/verbs.ts) take the pointer's place, with the chevron's
 * centre on the click point.
 *
 * Every shape is sampled into the same number of points. Each point travels a
 * curve (a quadratic Bezier) from where the outline is now, past a soft blob
 * made from the two shapes, to its place in the next shape, so the middle of
 * the change is a rounded blob and the motion never kinks there. A change
 * that is interrupted starts from the outline on screen, never from a jump.
 * Any click, on anything, throws a coral spark (clickFx.ts) while the pointer
 * presses in, then springs back. Touch screens never mount it.
 *
 * Hands are Phosphor (fill weight, MIT).
 */
const CLICKABLE = 'a[href], button:not(:disabled), select, summary, label[for], [role="button"], [role="link"], [role="tab"], [data-clickable], input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"]';
const FIELD = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';
const BUSY = '[aria-busy="true"], [data-busy]';
const BLOCKED = ':disabled, [aria-disabled="true"], [data-blocked]';

/** lucide mouse-pointer-2, as in public/cursors/pointer.svg */
const ARROW = "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z";
/** Phosphor hand-pointing-fill (256 grid) */
const HAND = "M224,104v50.93c0,46.2-36.85,84.55-83,85.06A83.71,83.71,0,0,1,80.6,215.4C58.79,192.33,34.15,136,34.15,136a16,16,0,0,1,6.53-22.23c7.66-4,17.1-.84,21.4,6.62l21,36.44a6.09,6.09,0,0,0,6,3.09l.12,0A8.19,8.19,0,0,0,96,151.74V32a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V104a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V88a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V112a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25v-7.28c0-8.61,6.62-16,15.23-16.43A16,16,0,0,1,224,104Z";
/** an I-beam in cursor pixels, centred on the click point (a polygon: its
    corners round off through the paper edge's round line join) */
const IBEAM = "M-4.5 -10H4.5V-8H1.1V8H4.5V10H-4.5V8H-1.1V-8H-4.5Z";
/** the chevron loader's footprint, 11.8px square, centred on the click point:
    the pointer melts into this, then the square breaks up into the loader's cells */
const SQUARE = "M-5.9 -5.9H5.9V5.9H-5.9Z";
/** a disc, r = 10, centred on the click point: the plate of the prohibit sign */
const DISC = "M0 -10A10 10 0 1 1 0 10A10 10 0 1 1 0 -10Z";

type Pt = [number, number];
const N = 96;

/** Shapes in cursor pixels with the click point at (0, 0): the arrow tilted
    22.5 degrees and 15% larger (its tip at the origin), the pointing hand at
    26px with the fingertip at the origin, the others centred on it. */
const toPx = {
  arrow: ([x, y]: Pt): Pt => {
    const r = (22.5 * Math.PI) / 180, s = 1.15, dx = (x - 4.04) * s, dy = (y - 4.04) * s;
    return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)];
  },
  hand: ([x, y]: Pt): Pt => [x * (26 / 256) - 11.4, y * (26 / 256) - 2.2],
  flat: (p: Pt): Pt => p,
};

export type Shape = "arrow" | "hand" | "ibeam" | "disc" | "square";
/** how the busy pointer holds up over page text: nothing, a paper outline
    around the letters, or a soft paper glow */
export type BusyStyle = "plain" | "outline" | "glow";
/** each shape's source path, how it maps to pixels, and the SVG transform and
    scale that draw the exact source path at rest */
export const SHAPES: Record<Shape, { d: string; map: (p: Pt) => Pt; tf: string | null; sc: number }> = {
  arrow: { d: ARROW, map: toPx.arrow, tf: "scale(1.15) rotate(22.5) translate(-4.04 -4.04)", sc: 1.15 },
  hand: { d: HAND, map: toPx.hand, tf: "translate(-11.4 -2.2) scale(0.1016)", sc: 0.1016 },
  ibeam: { d: IBEAM, map: toPx.flat, tf: null, sc: 1 },
  disc: { d: DISC, map: toPx.flat, tf: null, sc: 1 },
  square: { d: SQUARE, map: toPx.flat, tf: null, sc: 1 },
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

/** time for one shape to melt into another, ms: the same as --m in cursor.module.css */
const MS = 180;
/** how long a state's overlay has to fold away before the next melt starts,
    ms. The melt starts a little before --x ends, so the two overlap. */
const FOLD = 40;
/** how far through the melt (0 to 1 of MS) a state's overlay starts to show.
    By 40% the ease-out curve has covered about 80% of the distance, so the
    loader or the prohibit sign's bar does not wait for the melt to finish. */
const OVERLAY_AT = 0.4;
const clamp = (x: number) => Math.min(Math.max(x, 0), 1);
/** ease out: the move is fastest at the start, so a change answers the pointer at once */
const ease = (x: number) => 1 - (1 - x) ** 3;


/** A line of selectable text under the point: the nearest caret lands in a
    text node whose line box holds the point, and the text is not
    user-select: none. Gaps between words stay inside the line box, so the
    I-beam does not flicker along a sentence or between its lines. */
/** does the element itself hold a run of text, not only child elements? Most
    targets (cards, wrappers, images) do not, and skip the costly caret lookup. */
function hasOwnText(el: Element): boolean {
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === Node.TEXT_NODE && n.nodeValue && /\S/.test(n.nodeValue)) return true;
  }
  return false;
}

function overText(x: number, y: number): boolean {
  const d = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const node = d.caretPositionFromPoint
    ? d.caretPositionFromPoint(x, y)?.offsetNode
    : d.caretRangeFromPoint?.(x, y)?.startContainer;
  if (!node || node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return false;
  const el = node.parentElement;
  if (!el) return false;
  const cs = getComputedStyle(el) as CSSStyleDeclaration & { webkitUserSelect?: string };
  if (cs.userSelect === "none" || cs.webkitUserSelect === "none") return false;
  // a line's glyph box is shorter than its line height; pad each box by half
  // the leading so the gap between two lines of one paragraph still counts
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
  const r = document.createRange();
  r.selectNodeContents(node);
  for (const b of r.getClientRects()) {
    const pad = Math.max(1, (lh - b.height) / 2);
    if (x >= b.left - 1 && x <= b.right + 1 && y >= b.top - pad && y <= b.bottom + pad) return true;
  }
  return false;
}

/** the busy pointer: the site's chevron loader and a verb that changes every
    2.4s. Every verb sits stacked and hidden so the line never changes width. */
export function BusyTag() {
  const [i, setI] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // the verb only changes while busy shows; the loader's own animations are
    // paused in CSS the rest of the time
    const id = setInterval(() => {
      if (!root.current?.closest('[data-state="busy"]')) return;
      setI((n) => (n + 1 + Math.floor(Math.random() * (ASK_VERBS.length - 1))) % ASK_VERBS.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);
  const verb = ASK_VERBS[i];
  return (
    <div ref={root} className={k.tag}>
      <span className={k.tagChevron}><ChevronLoader /></span>
      <span className={k.tagWord}>
        {ASK_VERBS.map((w) => <span key={w} className={k.tagSizer}>{w}…</span>)}
        {/* the outline option: the same word in paper, thickened with a stroke, under the coral one */}
        <span key={`${verb}-halo`} className={k.tagHalo}>{verb}…</span>
        <span key={verb} className={k.tagLive}>{verb}…</span>
      </span>
    </div>
  );
}

export function Cursor({ busy = "outline" }: { busy?: BusyStyle }) {
  const el = useRef<HTMLDivElement>(null);
  const shape = useRef<SVGPathElement>(null);
  const press = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = el.current, path = shape.current, body = press.current;
    if (!c || !path || !body || !matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement;
    root.dataset.kc = "";
    const still = matchMedia("(prefers-reduced-motion: reduce)");

    const sampled = Object.fromEntries(
      (Object.keys(SHAPES) as Shape[]).map((key) => [key, sample(SHAPES[key].d, SHAPES[key].map)]),
    ) as Record<Shape, Pt[]>;

    // the outline on screen: `cur` is the shape it rests on, `A` the points it
    // left from, `H` the points it is heading for, `B` the soft blob between
    let cur: Shape = "arrow", goal: Shape = "arrow";
    let A = sampled.arrow, H = sampled.arrow, B = sampled.arrow;
    let t = 1, began = 0, raf = 0;
    // a quadratic Bezier per point; with B as the control the midpoint sits
    // halfway between the average and the blob, and velocity stays smooth
    const at = (u: number) => {
      const a = (1 - u) ** 2, b = 2 * u * (1 - u), h = u * u;
      // one light melt pass keeps the in-between outline clean; the blob B is
      // already melted, so more passes per frame would only cost
      return melt(A.map(([x, y], i): Pt => [a * x + b * B[i][0] + h * H[i][0], a * y + b * B[i][1] + h * H[i][1]]), 0.1);
    };

    // at rest each shape is drawn from its exact source path, scaled into
    // place; in between, the sampled points are already in cursor pixels. The
    // paper edge stays 2.2px wide (half of it shows, outside the fill).
    const EDGE = 2.2;
    const paint = (d: string, transform: string | null, scale: number) => {
      path.setAttribute("d", d);
      if (transform) path.setAttribute("transform", transform); else path.removeAttribute("transform");
      path.setAttribute("stroke-width", String(EDGE / scale));
    };
    const rest = (key: Shape) => { const { d, tf, sc } = SHAPES[key]; paint(d, tf, sc); };
    rest("arrow");
    let landing = false;
    const step = () => {
      const x = clamp((performance.now() - began) / MS);
      t = ease(x);
      if ((goal === "square" || goal === "disc") && x >= OVERLAY_AT) set("live", "");
      if (x >= 1) {
        t = 1; cur = goal; raf = 0; rest(cur);
        // arriving from busy or blocked: land with a small settle
        if (landing) { landing = false; body.animate(LAND, { duration: 200 }); }
        return;
      }
      paint(smooth(at(t)), null, 1);
      raf = requestAnimationFrame(step);
    };
    const to = (next: Shape) => {
      if (next === goal) return;
      // leave from the outline on screen, so a change that interrupts
      // another starts where it is
      const here = raf ? at(t) : sampled[cur];
      // leaving a state with an overlay (busy, blocked): the overlay folds away
      // first (CSS, --x), then the shape melts into the next one
      const folding = c.dataset.live !== undefined;
      if (folding) set("live", null);
      goal = next;
      landing = folding && next !== "square" && next !== "disc" && !still.matches;
      if (still.matches) { cur = next; rest(next); if (next === "square" || next === "disc") set("live", ""); return; }
      A = here;
      H = align(A, sampled[next]);
      B = inflate(melt(A.map(([x, y], i): Pt => [(x + H[i][0]) / 2, (y + H[i][1]) / 2]), 1.6), 1.2);
      began = performance.now() + (folding ? FOLD : 0);
      if (!raf) raf = requestAnimationFrame(step);
    };

    const set = (key: string, val: string | null) => {
      if ((c.dataset[key] ?? null) === val) return;
      if (val === null) delete c.dataset[key]; else c.dataset[key] = val;
    };

    const read = (target: Element | null, x: number, y: number) => {
      const q = (sel: string) => !!target?.closest(sel);
      let next: Shape = "arrow", state = "rest";
      if (q(BUSY)) { next = "square"; state = "busy"; }
      else if (q(BLOCKED)) { next = "disc"; state = "blocked"; }
      else if (q(FIELD)) { next = "ibeam"; state = "field"; }
      else if (q(CLICKABLE)) { next = "hand"; state = "link"; }
      else if (target && hasOwnText(target) && overText(x, y)) { next = "ibeam"; state = "text"; }
      to(next);
      set("state", state);
    };

    // the pointer can report hundreds of times a second; the position is
    // written at once (it is a compositor-only transform), but what is under
    // it is read at most once a frame, with the latest point
    let px = 0, py = 0, under: Element | null = null, readRaf = 0;
    const flush = () => { readRaf = 0; read(under, px, py); };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      c.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      px = e.clientX; py = e.clientY;
      under = e.target instanceof Element ? e.target : null;
      set("shown", "");
      if (!readRaf) readRaf = requestAnimationFrame(flush);
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      set("down", "");
      if (!still.matches) spark(e.clientX, e.clientY);
    };
    const up = () => {
      if (c.dataset.down === undefined) return;
      set("down", null);
      if (!still.matches) body.animate(RELEASE, { duration: 220 });
    };
    const leave = () => set("shown", null);
    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerdown", down, { passive: true });
    addEventListener("pointerup", up, { passive: true });
    root.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(readRaf);
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", down);
      removeEventListener("pointerup", up);
      root.removeEventListener("pointerleave", leave);
      delete root.dataset.kc;
    };
  }, []);

  return (
    <div ref={el} className={k.cursor} aria-hidden="true" data-busy-style={busy}>
      <div ref={press} className={k.press}>
        {/* drawn in cursor pixels; the click point is (0, 0) */}
        <svg className={k.shape} width="36" height="36" viewBox="-12 -5 36 36">
          <path ref={shape} d={ARROW} transform="scale(1.15) rotate(22.5) translate(-4.04 -4.04)" fill="#f5482d" stroke="#faf9f7" strokeWidth={2.2 / 1.15} strokeLinejoin="round" paintOrder="stroke" />
          {/* the prohibit sign: a paper hole and a coral slash over the disc, shown when blocked */}
          <circle className={k.hole} r="6.6" />
          <path className={k.slash} d="M-6.2 6.2 6.2 -6.2" />
        </svg>
        <BusyTag />
      </div>
    </div>
  );
}

/** A still of one cursor state, drawn with the same markup and CSS as the
    live cursor, for the side-by-side sheet on /samples/cursor-states. */
export function CursorSpecimen({ shape = "arrow", state = "rest", busy = "plain" }: {
  shape?: Shape; state?: "rest" | "link" | "field" | "text" | "blocked" | "busy"; busy?: BusyStyle;
}) {
  const { d, tf, sc } = SHAPES[shape];
  return (
    <div className={k.cursor} aria-hidden="true" data-shown="" data-state={state} data-live={state === "busy" || state === "blocked" ? "" : undefined} data-busy-style={busy} style={{ position: "relative", width: 0, height: 0 }}>
      <div className={k.press}>
        <svg className={k.shape} width="36" height="36" viewBox="-12 -5 36 36">
          <path d={d} transform={tf ?? undefined} fill="#f5482d" stroke="#faf9f7" strokeWidth={2.2 / sc} strokeLinejoin="round" paintOrder="stroke" />
          <circle className={k.hole} r="6.6" />
          <path className={k.slash} d="M-6.2 6.2 6.2 -6.2" />
        </svg>
        <BusyTag />
      </div>
    </div>
  );
}
