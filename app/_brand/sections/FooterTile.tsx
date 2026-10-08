"use client";

import { useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import f from "./footer.module.css";

/** A soft pulse: the tile dips, swells a touch past rest, and settles. The
    click's answer when the photo is already showing. */
const PULSE: Keyframe[] = [
  { transform: "scale(1)", easing: "cubic-bezier(0.33, 1, 0.68, 1)" },
  { transform: "scale(0.96)", offset: 0.3, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
  { transform: "scale(1.015)", offset: 0.65, easing: "cubic-bezier(0.33, 1, 0.68, 1)" },
  { transform: "scale(1)" },
];

/** One footer photo: halftone at rest; on hover the original opens in a
    circle from where the pointer came in and closes toward where it left.
    A click (or a tap, since touch has no hover) keeps it open and pulses
    the tile so the click registers even over an open photo. */
export function FooterTile({ n, ink }: { n: number; ink: string }) {
  const [on, setOn] = useState(false);
  const file = `life-${String(n).padStart(2, "0")}`;

  // circle centre at the pointer, radius just long enough to reach the far corner
  const aim = (e: PointerEvent<HTMLDivElement>) => {
    if (on) return;   // moving the centre of an open circle would uncover a corner mid-move
    const t = e.currentTarget, b = t.getBoundingClientRect();
    const x = e.clientX - b.left, y = e.clientY - b.top;
    t.style.setProperty("--lx", `${x}px`);
    t.style.setProperty("--ly", `${y}px`);
    t.style.setProperty("--full", `${Math.ceil(Math.hypot(Math.max(x, b.width - x), Math.max(y, b.height - y)))}px`);
  };

  const click = (e: MouseEvent<HTMLDivElement>) => {
    setOn((v) => !v);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.currentTarget.animate(PULSE, { duration: 420 });
    navigator.vibrate?.(12);   // Android only; a no-op elsewhere
  };

  return (
    <div className={`${f.tile} ${on ? f.on : ""}`} aria-hidden="true" data-clickable onPointerEnter={aim} onPointerLeave={aim} onClick={click}>
      <i style={{ "--src": `url(/footer/draft/${file}.webp)`, "--tile-ink": ink } as CSSProperties} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/footer/draft/fx-plain/${file}.webp`} alt="" width={256} height={256} loading="lazy" />
    </div>
  );
}
