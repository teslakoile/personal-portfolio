import type { CSSProperties } from "react";
import l from "./loaders.module.css";

/*
 * Chevron loaders, built on beautifului.dev's base: a small pixel grid where
 * every cell rests at 15% and pulses to full in turn. A cell's delay index
 * (d) decides the shape of the moving front; the tip leads, so the lit band
 * reads as an arrow. Every loader is a 1em square, so it sizes with the text
 * beside it, and --t scales all timing (1 = normal, 3 = slow motion).
 */

type V = CSSProperties & Record<`--${string}`, string | number>;
type Px = { x: number; y: number; d: number };
type Wave = "pulse" | "comet" | "snap";

const grid3 = (delay: (x: number, y: number) => number): Px[] =>
  Array.from({ length: 9 }, (_, i) => ({ x: i % 3, y: Math.floor(i / 3), d: delay(i % 3, Math.floor(i / 3)) }));

/**
 * One pixel-wave loader.
 *   gap     space between cells as a share of one cell pitch (0 = flush)
 *   radius  cell corner radius as a share of a full circle (0 = square, 1 = circle)
 *   hub     keeps the center cell lit, for orbits
 */
function PixelWave({ px, step = 90, dur = 650, wave = "pulse", gap = 0.22, radius = 0, hub = false, turn = false, bounce = false }: {
  px: Px[]; step?: number; dur?: number; wave?: Wave; gap?: number; radius?: number; hub?: boolean; turn?: boolean; bounce?: boolean;
}) {
  const cls = [l.ld, l.pw, l[wave], turn && l.turning, bounce && l.bounce].filter(Boolean).join(" ");
  const pitch = 0.84 / 3; // em per cell, gap included
  return (
    <span className={cls} aria-hidden="true">
      <span style={{ gap: `${(pitch * gap).toFixed(3)}em`, "--step": `${step}ms`, "--dur": `${dur}ms`, "--rad": `${radius * 50}%` } as V}>
        {px.map((p) => (
          <i key={`${p.x}-${p.y}`} className={hub && p.x === 1 && p.y === 1 ? l.hub : undefined}
            style={{ gridColumn: p.x + 1, gridRow: p.y + 1, "--d": p.d } as V} />
        ))}
      </span>
    </span>
  );
}

/** Eight cells on a true circle instead of a grid's perimeter. */
function RingWave({ step = 110, radius = 0 }: { step?: number; radius?: number }) {
  return (
    <span className={`${l.ld} ${l.ring} ${l.comet}`} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <i key={i} style={{ "--a": `${i * 45}deg`, "--d": i, "--step": `${step}ms`, "--dur": `${step * 8}ms`, "--rad": `${radius * 50}%` } as V} />
      ))}
    </span>
  );
}

/* ------------------------------ chevron ------------------------------ */

const RIGHT = grid3((x, y) => x + Math.abs(y - 1));
const DOWN = grid3((x, y) => y + Math.abs(x - 1));
const UP = grid3((x, y) => 2 - y + Math.abs(x - 1));
const DIAGONAL = grid3((x, y) => x + y);
const CONVERGE = grid3((x, y) => (1 - Math.abs(x - 1)) * 2 + Math.abs(y - 1));
const DIVERGE = grid3((x, y) => Math.abs(x - 1) * 2 + Math.abs(y - 1));

/* ------------------------------ circular ----------------------------- */

const RING_ORDER = [0, 1, 2, 5, 8, 7, 6, 3]; // clockwise around a 3×3, top-left first
const orbit = (lanes = 8): Px[] =>
  grid3((x, y) => {
    const i = RING_ORDER.indexOf(y * 3 + x);
    return i < 0 ? 0 : i % lanes;
  }).filter((p) => !(p.x === 1 && p.y === 1));
const ORBIT = orbit();
const TWIN = orbit(4); // opposite cells share a delay, so two heads chase each other
const ORBIT_HUB = [...ORBIT, { x: 1, y: 1, d: 0 }];

/** The chosen loader: Chevron, Right at 28% spacing, 700ms pulse and 100ms step. */
export const ChevronLoader = () => <PixelWave px={RIGHT} gap={0.28} dur={700} step={100} />;

// the comet chevron is the base for the packing and corner experiments
const COMET = { px: RIGHT, wave: "comet" as const, step: 110, dur: 900 };

export const GROUPS = [
  {
    title: "Chosen",
    note: "Chevron, Right at 28% spacing. Cells rest at 15% and light in turn: 700ms a pulse, 100ms a step.",
    items: [{ name: "Chevron, 28%", note: "The loader the site will use.", C: ChevronLoader }],
  },
  {
    title: "Timing",
    note: "The chosen chevron at eight speeds. Pulse is how long one cell glows; step is the delay before the next cell starts.",
    items: [
      { name: "650 / 90", note: "beautifului.dev's exact timing.", C: () => <PixelWave px={RIGHT} gap={0.28} dur={650} step={90} /> },
      { name: "700 / 100, Chosen", note: "Nearly identical, but your own numbers.", C: () => <PixelWave px={RIGHT} gap={0.28} dur={700} step={100} /> },
      { name: "750 / 110", note: "A touch calmer.", C: () => <PixelWave px={RIGHT} gap={0.28} dur={750} step={110} /> },
      { name: "900 / 120", note: "Slow and relaxed.", C: () => <PixelWave px={RIGHT} gap={0.28} dur={900} step={120} /> },
      { name: "600 / 80", note: "Snappier.", C: () => <PixelWave px={RIGHT} gap={0.28} dur={600} step={80} /> },
      { name: "550 / 70", note: "Fast, energetic.", C: () => <PixelWave px={RIGHT} gap={0.28} dur={550} step={70} /> },
      { name: "800 / 90", note: "Same travel speed, longer glow, so a wider arrow.", C: () => <PixelWave px={RIGHT} gap={0.28} dur={800} step={90} /> },
      { name: "650 / 120", note: "Same glow, slower travel, so a thinner arrow.", C: () => <PixelWave px={RIGHT} gap={0.28} dur={650} step={120} /> },
    ],
  },
  {
    title: "Chevron",
    note: "Cells rest at 15% and light in turn so the bright band reads as an arrow. The first card matches beautifului.dev's timing.",
    items: [
      { name: "Chevron, Right", note: "The base: 650ms pulse, 90ms per step.", C: () => <PixelWave px={RIGHT} /> },
      { name: "Comet", note: "Sharp rise, slow fade, so a trail follows the tip.", C: () => <PixelWave {...COMET} /> },
      { name: "Snap", note: "Cells switch on and off with no easing.", C: () => <PixelWave px={RIGHT} wave="snap" step={110} dur={660} /> },
      { name: "Dots", note: "Round cells instead of square.", C: () => <PixelWave px={RIGHT} radius={1} /> },
      { name: "Down", note: "The arrow points down.", C: () => <PixelWave px={DOWN} /> },
      { name: "Up", note: "The arrow points up, for uploads and sends.", C: () => <PixelWave px={UP} /> },
      { name: "Diagonal", note: "A corner leads; the band sweeps across.", C: () => <PixelWave px={DIAGONAL} /> },
      { name: "Converge", note: "Both sides close in on the middle.", C: () => <PixelWave px={CONVERGE} step={100} dur={800} /> },
      { name: "Diverge", note: "The middle pushes out to both sides.", C: () => <PixelWave px={DIVERGE} step={100} dur={800} /> },
      { name: "Turning", note: "Each pass points a quarter turn further.", C: () => <PixelWave px={RIGHT} turn /> },
      { name: "Bounce", note: "Each pass flips direction, right then left.", C: () => <PixelWave px={RIGHT} bounce /> },
    ],
  },
  {
    title: "Circular Motion",
    note: "The light travels around the grid instead of across it. One lap is eight steps.",
    items: [
      { name: "Orbit", note: "One soft pulse circling clockwise.", C: () => <PixelWave px={ORBIT} step={110} dur={880} /> },
      { name: "Orbit, Comet", note: "A bright head with a fading tail.", C: () => <PixelWave px={ORBIT} wave="comet" step={110} dur={880} /> },
      { name: "Orbit, Snap", note: "One cell at a time, ticking like a clock.", C: () => <PixelWave px={ORBIT} wave="snap" step={110} dur={880} /> },
      { name: "Twin Orbit", note: "Two heads on opposite sides, chasing.", C: () => <PixelWave px={TWIN} wave="comet" step={120} dur={480} /> },
      { name: "Orbit, Hub", note: "A comet around a lit center cell.", C: () => <PixelWave px={ORBIT_HUB} wave="comet" step={110} dur={880} hub /> },
      { name: "Ring", note: "Eight cells on a true circle, comet tail.", C: () => <RingWave /> },
      { name: "Ring, Rounded", note: "The same ring with rounded cells.", C: () => <RingWave radius={0.5} /> },
    ],
  },
  {
    title: "Packing",
    note: "The comet chevron at five spacings. Gap is the space between cells as a share of one cell's pitch.",
    items: [
      { name: "Flush", note: "No gap; the grid reads as one square.", C: () => <PixelWave {...COMET} gap={0} /> },
      { name: "Tight", note: "A hairline gap, 6%.", C: () => <PixelWave {...COMET} gap={0.06} /> },
      { name: "Base", note: "The current spacing, 22%.", C: () => <PixelWave {...COMET} gap={0.22} /> },
      { name: "Airy", note: "More room between cells, 38%.", C: () => <PixelWave {...COMET} gap={0.38} /> },
      { name: "Sparse", note: "Small cells far apart, 55%.", C: () => <PixelWave {...COMET} gap={0.55} /> },
    ],
  },
  {
    title: "Rounded Squares",
    note: "The comet chevron with softer corners, from square to nearly round.",
    items: [
      { name: "Square", note: "Sharp corners, 0%.", C: () => <PixelWave {...COMET} radius={0} /> },
      { name: "Soft", note: "A slight round, 15%.", C: () => <PixelWave {...COMET} radius={0.15} /> },
      { name: "Rounded", note: "Clearly rounded, 30%.", C: () => <PixelWave {...COMET} radius={0.3} /> },
      { name: "Squircle", note: "Nearly round, 50%.", C: () => <PixelWave {...COMET} radius={0.5} /> },
      { name: "Rounded, Airy", note: "30% corners with 38% gaps.", C: () => <PixelWave {...COMET} radius={0.3} gap={0.38} /> },
      { name: "Rounded Orbit", note: "30% corners on the orbit comet.", C: () => <PixelWave px={ORBIT} wave="comet" step={110} dur={880} radius={0.3} gap={0.3} /> },
    ],
  },
];
