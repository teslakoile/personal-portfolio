/**
 * The contribution calendar's two grid-wide animations, drawn on one canvas
 * laid over the squares: the entrance scan and the idle sweep. The squares
 * stay in the DOM for hover, press, and keyboard, and the canvas paints the
 * frames in between, so about 370 squares cost one layer and a few hundred
 * fillRect calls a frame.
 *
 * The timings and easings here are the design's own. They were CSS keyframes
 * on every square (entrance) and a Motion animation on every square (sweep).
 */

/** A square's box on the canvas, in device pixels. */
export type Tile = { x: number; y: number; w: number; h: number };

export const DURATION = 1.7; // s, scan line end to end
const [X1, Y1, X2, Y2] = [0.5, 0, 0.2, 1]; // the scan line's easing, also set in CSS
const WAKE = 0.6; // s, a square's bump and its color growing in
const FLASH = 0.42; // s, the coral flash over a waking square

// idle sweep: the front crosses the grid in SWEEP s; each tile glows for GLOW s,
// so the lit chevron is about GLOW / SWEEP of the grid thick. LEAD is how many
// columns each row steps back from the middle row, which sets the ">" angle.
const SWEEP = 3.4;
const GLOW = 0.42;
const LEAD = 1.8;

/** Point on one axis of a cubic bezier with end points 0 and 1. */
const B = (s: number, a: number, b: number) => 3 * (1 - s) ** 2 * s * a + 3 * (1 - s) * s * s * b + s ** 3;

/** The curve parameter at which a bezier axis reaches `v`. */
function solve(v: number, a: number, b: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (B(mid, a, b) < v) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** A CSS cubic-bezier() as a function of progress, 0 to 1. */
const bezier = (x1: number, y1: number, x2: number, y2: number) => (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : B(solve(p, x1, x2), y1, y2));

const easeOut = bezier(0, 0, 0.58, 1);
const easeInOut = bezier(0.42, 0, 0.58, 1);
const grow = bezier(0.34, 1.4, 0.64, 1); // overshoots, so the color lands with a small bounce

/** Seconds into the scan at which the line reaches fraction `f` of the width. */
export const reachedAt = (f: number) => B(solve(f, Y1, Y2), X1, X2) * DURATION;

/**
 * Sizes the canvas to its box in device pixels and returns every square's box,
 * indexed by week * 7 + weekday. Edges are rounded to device pixels the way
 * browsers round the squares themselves, so a square drawn here covers its DOM
 * square. Boxes are worked out from the week columns and one square's size,
 * and not read from each square, because a hovered or focused square is
 * scaled.
 */
export function fit(canvas: HTMLCanvasElement, columns: HTMLElement): Tile[] {
  const k = window.devicePixelRatio || 1;
  const box = canvas.getBoundingClientRect();
  const ox = Math.round(box.left * k);
  const oy = Math.round(box.top * k);
  const width = Math.round(box.right * k) - ox;
  const height = Math.round(box.bottom * k) - oy;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const tiles: Tile[] = [];
  const first = columns.firstElementChild;
  const still = columns.querySelector("i:not(:hover, [data-kb], [data-down], [data-up])");
  if (!first || !still) return tiles;
  const size = still.getBoundingClientRect().width; // a square's side; a column's own box can be a hair narrower
  const gap = parseFloat(getComputedStyle(first).rowGap) || 0;
  Array.from(columns.children).forEach((column, w) => {
    const r = column.getBoundingClientRect();
    const x = Math.round(r.left * k);
    for (let d = 0; d < 7; d++) {
      const top = r.top + d * (size + gap);
      const y = Math.round(top * k);
      tiles[w * 7 + d] = { x: x - ox, y: y - oy, w: Math.round((r.left + size) * k) - x, h: Math.round((top + size) * k) - y };
    }
  });
  return tiles;
}

function rect(c: CanvasRenderingContext2D, t: Tile, scale: number, color: string, alpha: number) {
  c.globalAlpha = alpha;
  c.fillStyle = color;
  if (scale === 1) {
    c.fillRect(t.x, t.y, t.w, t.h);
    return;
  }
  const w = t.w * scale;
  const h = t.h * scale;
  c.fillRect(t.x + (t.w - w) / 2, t.y + (t.h - h) / 2, w, h);
}

/**
 * One frame of the entrance, `t` seconds after the scan line starts. A column
 * wakes when the line reaches it (`delays`, one per week): its ghost squares
 * bump, their color grows in, and a coral flash fades over them. Only the
 * waking columns are drawn. One the line has not reached is left clear, so the
 * DOM's ghost squares show, and one that has settled is left clear for the
 * DOM's colored squares. Returns how many columns have settled, counted from
 * the left; the caller shows those in the DOM in the same frame.
 * `levels[i]` is a square's contribution level and undefined where the grid
 * has no day; `colors[0]` is the ghost color.
 */
export function drawEntrance(c: CanvasRenderingContext2D, tiles: Tile[], levels: (number | undefined)[], colors: string[], coral: string, delays: number[], t: number) {
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  let settled = 0;
  for (let w = 0; w < delays.length; w++) {
    const u = t - delays[w];
    if (u < 0) break; // the line moves left to right, so the rest are still asleep
    const p = u / WAKE;
    if (p >= 1) { settled = w + 1; continue; }
    const bump = p <= 0.3 ? 1 + 0.18 * easeOut(p / 0.3) : 1.18 - 0.18 * easeOut((p - 0.3) / 0.7);
    const grown = grow(p);
    const q = u / FLASH;
    const flash = q >= 1 ? 0 : q <= 0.18 ? 0.5 * easeOut(q / 0.18) : 0.5 - 0.5 * easeOut((q - 0.18) / 0.82);
    for (let d = 0; d < 7; d++) {
      const level = levels[w * 7 + d];
      const tile = tiles[w * 7 + d];
      if (level === undefined || !tile) continue;
      rect(c, tile, bump, colors[0], 1);
      if (level > 0) rect(c, tile, bump * (0.5 + 0.5 * grown), colors[level], Math.min(1, grown));
      if (flash > 0) rect(c, tile, bump, coral, flash);
    }
  }
  c.globalAlpha = 1;
  return settled;
}

let glint: HTMLCanvasElement | null = null;

/** The diagonal glint a lit square carries: white at 60% in its top left
    corner, clear from 62% of the way to the opposite corner. */
function glintImage() {
  if (glint) return glint;
  glint = document.createElement("canvas");
  glint.width = glint.height = 32;
  const c = glint.getContext("2d");
  if (c) {
    const fade = c.createLinearGradient(0, 0, 32, 32);
    fade.addColorStop(0, "rgb(255 255 255 / 0.6)");
    fade.addColorStop(0.62, "rgb(255 255 255 / 0)");
    c.fillStyle = fade;
    c.fillRect(0, 0, 32, 32);
  }
  return glint;
}

/**
 * One frame of the idle sweep, `t` seconds after it starts: a ">" of light
 * made of the squares. Each square lightens (white at up to 28%) and carries
 * the glint, rising and falling over GLOW s, delayed by its distance to the
 * front. `fade` scales the whole frame, for a sweep that is giving way to the
 * pointer; `skip` is a square to leave alone (the keyboard's, which is
 * scaled). Returns false once every square has finished.
 */
export function drawSweep(c: CanvasRenderingContext2D, tiles: Tile[], levels: (number | undefined)[], weeks: number, t: number, fade = 1, skip = -1) {
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  const image = glintImage();
  let live = false;
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    if (levels[i] === undefined || !tile) continue;
    const d = i % 7;
    const front = Math.floor(i / 7) - (3 - Math.abs(d - 3)) * LEAD; // middle row leads
    const p = (t - ((front + 3 * LEAD) / (weeks + 3 * LEAD)) * SWEEP) / GLOW;
    if (p < 1) live = true;
    if (p <= 0 || p >= 1 || i === skip) continue;
    const gloss = (p < 0.5 ? easeInOut(p * 2) : 1 - easeInOut(p * 2 - 1)) * fade;
    rect(c, tile, 1, "#fff", 0.28 * gloss);
    c.globalAlpha = gloss;
    c.drawImage(image, tile.x, tile.y, tile.w, tile.h);
  }
  c.globalAlpha = 1;
  return live;
}
