"use client";

import { useState, type CSSProperties } from "react";
import f from "./footer.module.css";

/** One footer photo: halftone at rest, the original on hover; a tap (touch
    has no hover) keeps the original showing until the next tap. */
export function FooterTile({ n, ink }: { n: number; ink: string }) {
  const [on, setOn] = useState(false);
  const file = `life-${String(n).padStart(2, "0")}`;
  return (
    <div className={`${f.tile} ${on ? f.on : ""}`} aria-hidden="true" onClick={() => setOn((v) => !v)}>
      <i style={{ "--src": `url(/footer/draft/${file}.webp)`, "--tile-ink": ink } as CSSProperties} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/footer/draft/fx-plain/${file}.webp`} alt="" width={256} height={256} loading="lazy" />
    </div>
  );
}
