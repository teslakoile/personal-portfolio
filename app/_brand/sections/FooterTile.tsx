"use client";

import { useId, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { FooterPhotoView } from "./FooterPhotoView";
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
    only keeps the layout and passes the click on.

    With `fullView`, an open photo also shows a small expand button that
    grows the photo to a large view (FooterPhotoView). The button sits above
    the canvas and keeps its click from toggling the tile. */
export function FooterTile({ n, ink, i, fullView = false }: { n: number; ink: string; i?: number; fullView?: boolean }) {
  const [on, setOn] = useState(false);
  /** the open large view's photo aspect (width / height), or null */
  const [view, setView] = useState<number | null>(null);
  const id = useId();
  const tile = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const expand = useRef<HTMLButtonElement>(null);
  const file = `life-${String(n).padStart(2, "0")}`;
  const src = `/footer/draft/fx-plain/${file}.webp`;
  const expandable = fullView && on;

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

  const rect = () => {
    const { left, top, width, height } = tile.current!.getBoundingClientRect();
    return { left, top, width, height };
  };
  const open = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();   // not a tile click: FooterTile and FooterWall would toggle the reveal
    const img = photo.current;
    setView(img?.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1);
  };

  return (
    <div ref={tile} className={`${f.tile} ${on ? f.on : ""}`} aria-hidden={expandable ? undefined : true} data-clickable data-tile={i} onClick={click}>
      <i style={{ "--src": `url(/footer/draft/${file}.webp)`, "--tile-ink": ink } as CSSProperties} aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={photo} src={src} alt="" width={256} height={256} loading="lazy" />
      {expandable ? (
        <button
          ref={expand}
          type="button"
          className={f.expand}
          aria-label="View Photo"
          aria-haspopup="dialog"
          onClick={open}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8.5 1.5h4v4M12.5 1.5 8 6M5.5 12.5h-4v-4M1.5 12.5 6 8" />
          </svg>
        </button>
      ) : null}
      {view ? (
        <FooterPhotoView
          id={`photo${id}`}
          src={src}
          aspect={view}
          tile={rect}
          onClosed={() => { setView(null); expand.current?.focus({ preventScroll: true }); }}
        />
      ) : null}
    </div>
  );
}
