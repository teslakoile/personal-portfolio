"use client";

import { useId, useMemo, useRef, useState } from "react";
import s from "./embeds.module.css";

/**
 * Determinant explorer: a 2×2 matrix A acting on the plane. The faint grid is
 * the original plane, the dark grid is the plane after A, and the shaded
 * parallelogram is the image of the unit square, so its area is |det A|.
 * Presets drive A from one slider; dragging the coral tips of u and v edits
 * the columns directly.
 */

type Mat = [number, number, number, number]; // [a, b, c, d], columns u = (a, c), v = (b, d)

type Preset = {
  id: string;
  label: string;
  param: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  matrix: (t: number) => Mat;
  note: string;
};

const PRESETS: Preset[] = [
  {
    id: "shear",
    label: "Shear",
    param: "Shear",
    min: -2,
    max: 2,
    step: 0.05,
    initial: 1,
    matrix: (t) => [1, t, 0, 1],
    note: "Shear slants the whole grid. The unit square leans into a parallelogram, but its area stays 1.",
  },
  {
    id: "stretch",
    label: "Stretch",
    param: "Stretch x",
    min: 0.25,
    max: 3,
    step: 0.05,
    initial: 2,
    matrix: (t) => [t, 0, 0, 1],
    note: "Stretching x by a factor scales every area by that factor. The determinant is the scale.",
  },
  {
    id: "flip",
    label: "Flip",
    param: "Mirror",
    min: -1.5,
    max: 1.5,
    step: 0.05,
    initial: -1,
    matrix: (t) => [t, 0.6, 0, 1],
    note: "As the mirror crosses zero, u passes through the line of v and the grid turns over. A negative determinant means orientation is reversed.",
  },
  {
    id: "collapse",
    label: "Collapse",
    param: "Lean",
    min: 0,
    max: 1,
    step: 0.01,
    initial: 0.7,
    matrix: (t) => [1, -0.5 + 2.5 * t, 0.5, 1],
    note: "As v leans toward u, the parallelogram thins out. When v lands on the line of u, the plane collapses to a line and the determinant is 0.",
  },
];

const CUSTOM_NOTE = "The shaded parallelogram is where the unit square lands. Its area is always |det A|.";

const TRIES: { label: string; m: Mat }[] = [
  { label: "det = 1, not identity", m: [1, 1.5, 0, 1] },
  { label: "det = 0, no zero column", m: [1, 2, 0.5, 1] },
  { label: "det = -2", m: [-2, 0, 0, 1] },
];

// view: x in [-4.06, 4.06], y in [-3.125, 3.125] at 64 px per unit
const W = 520;
const H = 400;
const UNIT = 64;
const CX = W / 2;
const CY = H / 2;
const px = (x: number, y: number) => [CX + x * UNIT, CY - y * UNIT] as const;
const EPS = 1e-6;

const fmt = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return (Object.is(r, -0) ? 0 : r).toFixed(2);
};

function snap(n: number) {
  const q = Math.round(n * 4) / 4;
  return Math.abs(q - n) < 0.12 ? q : Math.round(n * 100) / 100;
}

export function Determinant({ props }: { props: Record<string, string> }) {
  const start = PRESETS.find((p) => p.id === props.preset) ?? PRESETS[0];
  const [presetId, setPresetId] = useState<string>(start.id);
  const [t, setT] = useState(start.initial);
  const [custom, setCustom] = useState<Mat>(start.matrix(start.initial));
  const [dragging, setDragging] = useState<"u" | "v" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, "");

  const preset = PRESETS.find((p) => p.id === presetId) ?? null;
  const m: Mat = preset ? preset.matrix(t) : custom;
  const [a, b, c, d] = m;
  const det = a * d - b * c;
  const singular = Math.abs(det) < 0.005;

  const choosePreset = (p: Preset) => {
    setPresetId(p.id);
    setT(p.initial);
  };

  const pointerToMath = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    return [snap((x - CX) / UNIT), snap((CY - y) / UNIT)] as const;
  };

  const onDown = (which: "u" | "v") => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    setCustom(m);
    setPresetId("custom");
    setDragging(which);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const [x, y] = pointerToMath(e);
    const cx = Math.max(-3.75, Math.min(3.75, x));
    const cy = Math.max(-2.9, Math.min(2.9, y));
    setCustom((prev) => (dragging === "u" ? [cx, prev[1], cy, prev[3]] : [prev[0], cx, prev[2], cy]));
  };

  const grid = useMemo(() => {
    const lines: string[] = [];
    for (let i = -6; i <= 6; i++) {
      const [x1, y1] = px(i, -5);
      const [x2, y2] = px(i, 5);
      lines.push(`M${x1} ${y1}L${x2} ${y2}`);
      const [x3, y3] = px(-6, i);
      const [x4, y4] = px(6, i);
      lines.push(`M${x3} ${y3}L${x4} ${y4}`);
    }
    return lines.join("");
  }, []);

  // image of the integer grid lines under A, long enough to span the view
  const tGrid = useMemo(() => {
    const N = 14;
    const parts: string[] = [];
    for (let i = -N; i <= N; i++) {
      // i*u + s*v
      const [p1x, p1y] = px(i * a - N * b, i * c - N * d);
      const [p2x, p2y] = px(i * a + N * b, i * c + N * d);
      parts.push(`M${p1x} ${p1y}L${p2x} ${p2y}`);
      // i*v + s*u
      const [q1x, q1y] = px(i * b - N * a, i * d - N * c);
      const [q2x, q2y] = px(i * b + N * a, i * d + N * c);
      parts.push(`M${q1x} ${q1y}L${q2x} ${q2y}`);
    }
    return parts.join("");
  }, [a, b, c, d]);

  const [ox, oy] = px(0, 0);
  const [ux, uy] = px(a, c);
  const [vx, vy] = px(b, d);
  const [wx, wy] = px(a + b, c + d);

  // labels sit just past each tip, along the vector
  const labelAt = (x: number, y: number, tx: number, ty: number) => {
    const l = Math.hypot(x, y) || 1;
    return { x: tx + (x / l) * 18 - 4, y: ty - (y / l) * 18 + 5 };
  };
  const uLabel = labelAt(a, c, ux, uy);
  const vLabel = labelAt(b, d, vx, vy);

  // orientation arc from u toward v, sweeping the way det says
  const arc = (() => {
    const lu = Math.hypot(a, c);
    const lv = Math.hypot(b, d);
    if (singular || lu < EPS || lv < EPS) return null;
    const r = Math.min(lu, lv, 1.4) * 0.42;
    const au = Math.atan2(c, a);
    const sweep = Math.atan2(det, a * b + c * d); // signed angle u → v
    const a0 = au + sweep * 0.12;
    const a1 = au + sweep * 0.82;
    const [sx, sy] = px(r * Math.cos(a0), r * Math.sin(a0));
    const [ex, ey] = px(r * Math.cos(a1), r * Math.sin(a1));
    return `M${sx} ${sy}A${r * UNIT} ${r * UNIT} 0 0 ${det > 0 ? 0 : 1} ${ex} ${ey}`;
  })();

  const orientation = singular ? "Collapsed" : det > 0 ? "Preserved" : "Reversed";
  const note = preset ? preset.note : CUSTOM_NOTE;

  const pick = (mat: Mat) => {
    setCustom(mat);
    setPresetId("custom");
  };

  return (
    <div className={s.shell}>
      <div className={s.bar}>
        <div className={s.pills} role="group" aria-label="Transformation">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={s.pill} data-active={presetId === p.id || undefined} onClick={() => choosePreset(p)}>
              {p.label}
            </button>
          ))}
          <button type="button" className={s.pill} data-active={presetId === "custom" || undefined} onClick={() => pick(m)}>
            Free Drag
          </button>
        </div>
        <output className={s.readout} aria-live="polite">
          <span className={s.label}>det A</span>
          <span className={s.figure}>{fmt(det)}</span>
        </output>
      </div>

      <div className={s.cells}>
        <div className={s.plotCell}>
          <figure className={s.plot}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className={s.svg}
              onPointerMove={onMove}
              onPointerUp={() => setDragging(null)}
              onPointerCancel={() => setDragging(null)}
              role="img"
              aria-label={`Matrix A with columns u = (${fmt(a)}, ${fmt(c)}) and v = (${fmt(b)}, ${fmt(d)}), determinant ${fmt(det)}`}
            >
              <defs>
                <clipPath id={`clip-${uid}`}>
                  <rect width={W} height={H} />
                </clipPath>
                <marker id={`arrow-${uid}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10z" className={s.arcHead} />
                </marker>
              </defs>
              <g clipPath={`url(#clip-${uid})`}>
                <path d={grid} className={s.gridOld} />
                <path d={tGrid} className={s.gridNew} />
                <path d={`M0 ${CY}H${W}M${CX} 0V${H}`} className={s.axis} />
                <polygon
                  points={`${ox},${oy} ${ux},${uy} ${wx},${wy} ${vx},${vy}`}
                  className={s.area}
                  data-sign={singular ? "zero" : det < 0 ? "neg" : "pos"}
                />
                {arc ? <path d={arc} className={s.arc} markerEnd={`url(#arrow-${uid})`} /> : null}
                <line x1={ox} y1={oy} x2={vx} y2={vy} className={s.vecV} />
                <line x1={ox} y1={oy} x2={ux} y2={uy} className={s.vecU} />
                <text x={uLabel.x} y={uLabel.y} className={s.vecLabel}>u</text>
                <text x={vLabel.x} y={vLabel.y} className={`${s.vecLabel} ${s.vecLabelV}`}>v</text>
                {(["u", "v"] as const).map((k) => {
                  const [hx, hy] = k === "u" ? [ux, uy] : [vx, vy];
                  return (
                    <g key={k} className={s.handle} data-dragging={dragging === k || undefined} onPointerDown={onDown(k)}>
                      <circle cx={hx} cy={hy} r={18} className={s.handleHit} />
                      <circle cx={hx} cy={hy} r={6.5} className={s.handleDot} />
                    </g>
                  );
                })}
              </g>
            </svg>
          </figure>
          <div className={s.legend}>
            <span><i className={s.keyOld} />original grid</span>
            <span><i className={s.keyNew} />grid after A</span>
            <span><i className={s.keyU} />u, first column</span>
            <span><i className={s.keyV} />v, second column</span>
            <span><i className={det < 0 ? s.keyAreaNeg : s.keyArea} />unit square after A</span>
          </div>
        </div>

        <div className={s.side}>
          <div className={s.sideBlock}>
            {preset ? (
              <label className={s.slider}>
                <span className={s.sliderHead}>
                  <span className={s.label}>{preset.param}</span>
                  <span className={s.value}>{fmt(t)}</span>
                </span>
                <input type="range" min={preset.min} max={preset.max} step={preset.step} value={t} onChange={(e) => setT(Number(e.target.value))} />
              </label>
            ) : (
              <p className={s.label}>Drag the coral tips to set the columns.</p>
            )}
          </div>

          <div className={s.sideBlock}>
            <div className={s.matrix} aria-label="Matrix A">
              <span className={s.matrixName}>A =</span>
              <span className={s.matrixBody}>
                <span>{fmt(a)}</span>
                <span className={s.colV}>{fmt(b)}</span>
                <span>{fmt(c)}</span>
                <span className={s.colV}>{fmt(d)}</span>
              </span>
            </div>
            <p className={s.formula}>ad − bc = {fmt(a * d)} − {fmt(b * c)} = {fmt(det)}</p>
          </div>

          <p className={`${s.sideBlock} ${s.note}`}>{note}</p>

          <dl className={s.kvs}>
            <div><dt className={s.label}>Area Scale</dt><dd>{fmt(Math.abs(det))}×</dd></div>
            <div><dt className={s.label}>Orientation</dt><dd>{orientation}</dd></div>
            <div><dt className={s.label}>Inverse</dt><dd>{singular ? "None" : "Exists"}</dd></div>
          </dl>

          <div className={s.sideBlock}>
            <p className={s.label} style={{ marginBottom: 8 }}>Try to Build</p>
            <div className={s.chipRow}>
              {TRIES.map((x) => (
                <button key={x.label} type="button" className={s.chip} onClick={() => pick(x.m)}>{x.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
