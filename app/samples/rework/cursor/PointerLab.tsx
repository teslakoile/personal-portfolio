"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ARROW_PATH, InkCursor } from "./InkCursor";
import { Companion } from "./Companion";
import c from "./pointer.module.css";

/**
 * Round eight: the base cursor animated, and KYLLM's behavior worked out.
 * Kyle picked the companion idea over a clean ink arrow; the dot, ring,
 * squish, tag, and adaptive cursors from round seven are retired.
 * Previewed over the real landing page, with a switcher at the bottom.
 *
 * Every option keeps text fields on the native text cursor, and touch
 * pointers or reduced motion get the native cursor with no companion.
 */
type Option = { id: string; key: string; name: string; note: string };

const OPTIONS: Option[] = [
  { id: "native", key: "0", name: "Site Cursor", note: "What the site ships, from app/globals.css: 4 · Tilted." },
  { id: "icon-coral", key: "1", name: "Icon · Coral", note: "The site's line-icon pointer, coral with a paper edge and a very subtle shadow. Drawn by the OS: sharp, zero lag. Same cursor everywhere for now." },
  { id: "icon-ink", key: "2", name: "Icon · Ink", note: "The same pointer in ink with a paper edge and the same very subtle shadow." },
  { id: "icon-coral-bare", key: "3", name: "Icon · Coral, No Edge", note: "Coral with no paper edge, only the very subtle shadow." },
  { id: "icon-tilt", key: "4", name: "Tilted", note: "Icon · Coral turned 22.5° so its left edge stands vertical and it points like the native arrow, and 15% larger." },
  { id: "ring-box", key: "5a", name: "Ring · Box", note: "4 with a thin coral ring centered on the pointer's bounding box (the first version). The tip sits closest to the ring." },
  { id: "ring-half", key: "5b", name: "Ring · Halfway", note: "The ring centered halfway between the bounding box and even clearance." },
  { id: "ring-even", key: "5c", name: "Ring · Even", note: "The smallest circle around the pointer: equal space at the tip, the right point, and the bottom point." },
  { id: "icon-ring-tip", key: "6", name: "Tilted + Tip Ring", note: "4 with the thin ring centered on the tip instead, so it marks exactly where a click lands." },
  { id: "static", key: "A", name: "Ink Arrow", note: "Round seven's arrow, drawn by the OS: zero lag, but no animation. Coral over links." },
  { id: "ink", key: "B", name: "Ink Cursor", note: "The same arrow drawn in the page so it can move: fills coral with a small badge over links (↗ another site, @ email, ↓ download, → this page), squeezes on click, becomes an I-beam over text, and leans into fast moves." },
  { id: "companion", key: "C", name: "Ink Cursor + KYLLM", note: "B plus KYLLM: it joins from Ask Anything, narrates what you point at, thinks when you pause, walks over to something nearby and frames it, listens when ⌘K opens, and dims after 20s." },
];

/** The site's line-icon pointer (tip at about 4, 4 on a 24px canvas). */
const ICON_PATH = "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z";
/** A very subtle shadow: half a pixel down, half a pixel of blur, 18% ink. */
const iconSvg = (fill: string, edge: boolean, scale: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${24 * scale}" height="${24 * scale}" viewBox="0 0 24 24"><filter id="s" x="-20%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="0.5" stdDeviation="0.5" flood-color="#1c1917" flood-opacity="0.18"/></filter><path d="${ICON_PATH}" fill="${fill}"${edge ? ' stroke="#faf9f7" stroke-width="1.6"' : ""} stroke-linejoin="round" filter="url(#s)"/></svg>`;
const uri = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
/** 1x and 2x so it stays sharp on retina screens; hotspot on the tip. */
const iconCursor = (fill: string, edge: boolean) =>
  `image-set(${uri(iconSvg(fill, edge, 1))} 1x, ${uri(iconSvg(fill, edge, 2))} 2x) 4 4, auto`;
/**
 * Tilted: the icon's axis runs at 45°, the native arrow's at about 67.5°
 * (vertical left edge), so it turns 22.5° about its tip, grows 15%, and the
 * tip lands at (TIP, TIP) on the canvas. Optional thin coral ring, either
 * around the whole pointer or centered on the tip.
 */
const TIP = 17;
type Ring = "none" | "box" | "half" | "even" | "tip";
/** Ring centers measured from the tip. Radius = the pointer's farthest point
    + 8px, wide enough to read as a locator halo rather than an outline. */
const RINGS: Record<string, [number, number, number]> = {
  box: [7.29, 10.62, 20.8], // bounding-box center
  half: [5.85, 10.64, 20],
  even: [4.41, 10.65, 19.4], // minimal enclosing circle
};
const tiltedSvg = (ring: Ring, scale: number) => {
  const W = 52;
  const c = RINGS[ring];
  const ringEl = c
    ? `<circle cx="${TIP + c[0]}" cy="${TIP + c[1]}" r="${c[2]}" fill="none" stroke="#f5482d" stroke-opacity="0.5" stroke-width="1"/>`
    : ring === "tip" ? `<circle cx="${TIP}" cy="${TIP}" r="5" fill="none" stroke="#f5482d" stroke-opacity="0.55" stroke-width="1"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * scale}" height="${W * scale}" viewBox="0 0 ${W} ${W}"><filter id="s" x="-20%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="0.5" stdDeviation="0.5" flood-color="#1c1917" flood-opacity="0.18"/></filter>${ringEl}<path d="${ICON_PATH}" transform="translate(${TIP} ${TIP}) scale(1.15) rotate(22.5) translate(-4.04 -4.04)" fill="#f5482d" stroke="#faf9f7" stroke-width="1.4" stroke-linejoin="round" filter="url(#s)"/></svg>`;
};
const tiltedCursor = (ring: Ring) =>
  `image-set(${uri(tiltedSvg(ring, 1))} 1x, ${uri(tiltedSvg(ring, 2))} 2x) ${TIP} ${TIP}, auto`;

const ICON_CURSORS: Record<string, string> = {
  "icon-coral": iconCursor("#f5482d", true),
  "icon-ink": iconCursor("#1c1917", true),
  "icon-coral-bare": iconCursor("#f5482d", false),
  "icon-tilt": tiltedCursor("none"),
  "ring-box": tiltedCursor("box"),
  "ring-half": tiltedCursor("half"),
  "ring-even": tiltedCursor("even"),
  "icon-ring-tip": tiltedCursor("tip"),
};

const arrowCursor = (fill: string) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><filter id="s" x="-20%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="0.6" stdDeviation="0.6" flood-color="#1c1917" flood-opacity="0.3"/></filter><path d="${ARROW_PATH}" fill="${fill}" stroke="#faf9f7" stroke-width="1.6" stroke-linejoin="round" filter="url(#s)"/></svg>`,
  )}") 4 3`;

export function PointerLab({ children }: { children: ReactNode }) {
  const [active, setActive] = useState("ring-half");
  const [ok, setOk] = useState(false);
  const switcher = useRef<HTMLDivElement>(null);
  const opt = OPTIONS.find((o) => o.id === active)!;

  // custom cursors only for a fine pointer without reduced motion
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setOk(window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  const drawn = ok && (active === "ink" || active === "companion");
  const icon = ICON_CURSORS[active];
  const vars = (icon
    ? { "--kn-arrow": icon, "--kn-arrow-link": icon }
    : { "--kn-arrow": `${arrowCursor("#1c1917")}, auto`, "--kn-arrow-link": `${arrowCursor("#f5482d")}, pointer` }) as CSSProperties;
  const osCursor = ok && (active === "static" || Boolean(icon));

  return (
    <div className={`${c.lab} ${osCursor ? c.cssArrow : ""} ${drawn ? c.hideNative : ""}`} style={vars}>
      <div className={c.content}>{children}</div>

      {drawn ? <InkCursor key={active} /> : null}
      {ok && active === "companion" ? <Companion exclude={switcher} /> : null}

      <div ref={switcher} className={c.switcher} role="radiogroup" aria-label="Cursor option">
        <p className={c.note}><b>{opt.key === "0" ? opt.name : `${opt.key} · ${opt.name}`}</b> {opt.note}</p>
        <div className={c.buttons}>
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={o.id === active}
              className={`${c.btn} ${o.id === active ? c.btnOn : ""}`}
              onClick={() => setActive(o.id)}
            >
              {o.key === "0" ? o.name : <><span>{o.key}</span>{o.name}</>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
