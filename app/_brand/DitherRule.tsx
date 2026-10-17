"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A dithered underline: solid on the left, breaking into square pixels that
 * thin out to nothing on the right, like a gradient printed with a Bayer
 * screen. Place it inside a positioned element (the link); it spans that
 * element's full width along its bottom edge and redraws when the width
 * changes, so the pixels stay square at any size.
 */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function DitherRule({ px = 2, rows = 2, solid = 0.4, color = "var(--coral)", className }: {
  /** pixel size, CSS px */
  px?: number;
  /** pixel rows (the line's thickness is px * rows) */
  rows?: number;
  /** share of the width that stays solid before it starts to break up */
  solid?: number;
  color?: string;
  className?: string;
}) {
  const box = useRef<SVGSVGElement>(null);
  const [cols, setCols] = useState(0);

  useEffect(() => {
    const host = box.current?.parentElement;
    if (!host) return;
    const ro = new ResizeObserver(() => setCols(Math.max(1, Math.round(host.getBoundingClientRect().width / px))));
    ro.observe(host);
    return () => ro.disconnect();
  }, [px]);

  // one rect per run of lit pixels in a row, so a wide solid stretch is one shape
  const rects: { x: number; y: number; w: number }[] = [];
  for (let y = 0; y < rows; y++) {
    let start = -1;
    for (let x = 0; x <= cols; x++) {
      const t = (x + 0.5) / cols;
      const density = 1 - smooth(solid, 1, t);
      const lit = x < cols && density > (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
      if (lit && start < 0) start = x;
      if (!lit && start >= 0) { rects.push({ x: start, y, w: x - start }); start = -1; }
    }
  }

  return (
    <svg
      ref={box}
      className={className}
      aria-hidden="true"
      width={cols * px}
      height={rows * px}
      viewBox={`0 0 ${Math.max(cols, 1)} ${rows}`}
      shapeRendering="crispEdges"
      style={{ position: "absolute", left: 0, bottom: 0, display: "block", fill: color, pointerEvents: "none" }}
    >
      {rects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1} />)}
    </svg>
  );
}
