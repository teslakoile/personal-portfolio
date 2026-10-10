"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import f from "./footer.module.css";

/** A soft pulse: the tile dips, swells a touch past rest, and settles. */
const PULSE: Keyframe[] = [
  { transform: "scale(1)", easing: "cubic-bezier(0.33, 1, 0.68, 1)" },
  { transform: "scale(0.96)", offset: 0.3, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
  { transform: "scale(1.015)", offset: 0.65, easing: "cubic-bezier(0.33, 1, 0.68, 1)" },
  { transform: "scale(1)" },
];

/** One footer photo: halftone at rest. A click (or a tap) opens the original
    photo in a circle from the click point with a light spring, and a second
    click closes it toward that click. On the desktop grid FooterWall draws
    the same thing in WebGL over this tile, with the bulge; this tile then
    only keeps the layout and passes the click on. */
export function FooterTile({ n, ink, i }: { n: number; ink: string; i?: number }) {
  const [on, setOn] = useState(false);
  const file = `life-${String(n).padStart(2, "0")}`;

  const click = (e: MouseEvent<HTMLDivElement>) => {
    const t = e.currentTarget, b = t.getBoundingClientRect();
    const x = e.clientX - b.left, y = e.clientY - b.top;
    // centre the circle on the click; its full radius reaches the far corner
    t.style.setProperty("--lx", `${x}px`);
    t.style.setProperty("--ly", `${y}px`);
    t.style.setProperty("--full", `${Math.ceil(Math.hypot(Math.max(x, b.width - x), Math.max(y, b.height - y)))}px`);
    setOn((v) => !v);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    t.animate(PULSE, { duration: 420 });
    navigator.vibrate?.(12);   // Android only; a no-op elsewhere
  };

  return (
    <div className={`${f.tile} ${on ? f.on : ""}`} aria-hidden="true" data-clickable data-tile={i} onClick={click}>
      <i style={{ "--src": `url(/footer/draft/${file}.webp)`, "--tile-ink": ink } as CSSProperties} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/footer/draft/fx-plain/${file}.webp`} alt="" width={256} height={256} loading="lazy" />
    </div>
  );
}
