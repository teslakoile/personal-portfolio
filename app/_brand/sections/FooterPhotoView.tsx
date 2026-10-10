"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import f from "./footer.module.css";

/**
 * A footer photo, large. Motion's shared layout (`layoutId`) grows the photo
 * from its tile to the middle of the screen and shrinks it back on close.
 *
 * The desktop tiles are painted on a canvas, so the morph starts and ends on
 * a proxy: a copy of the photo placed exactly over the tile's rect, cropped
 * the way the tile crops it (cover). Open is two renders: the proxy, then the
 * large photo with the same layoutId, so Motion animates between them. Close
 * swaps back and the view unmounts once the proxy has landed on the tile.
 * Under reduced motion (MotionConfig reducedMotion="user") the morph is
 * skipped and the view simply appears and goes.
 */
export type Box = { left: number; top: number; width: number; height: number };

/** a light spring, a touch past the end like the tile reveal */
const MORPH = { type: "spring", bounce: 0.2, duration: 0.6 } as const;
const FADE = { duration: 0.25, ease: "easeOut" } as const;
/** keys that would scroll the page behind the view */
const SCROLL_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"]);

/** the photo's own box inside a frame, cropped like object-fit: cover */
const cover = (w: number, h: number, aspect: number): CSSProperties => {
  const iw = Math.max(w, h * aspect), ih = iw / aspect;
  return { width: iw, height: ih, left: (w - iw) / 2, top: (h - ih) / 2 };
};

export function FooterPhotoView({ id, src, aspect, tile, onClosed }: {
  /** a layoutId unique on the page */
  id: string;
  src: string;
  /** the photo's width / height */
  aspect: number;
  /** where the tile is on screen now (measured on open and again on close) */
  tile: () => Box;
  /** the view has gone; return focus to the control that opened it */
  onClosed: () => void;
}) {
  const still = useReducedMotion();
  const [phase, setPhase] = useState<"from" | "open" | "back">(still ? "open" : "from");
  const [box, setBox] = useState(() => tile());
  const dialog = useRef<HTMLDivElement>(null);
  const done = useRef(onClosed);
  useEffect(() => { done.current = onClosed; });

  // one frame on the proxy so Motion has measured it, then grow
  useEffect(() => {
    if (phase !== "from") return;
    const raf = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // shrinking back: finish when the proxy lands (or after a beat, in case the
  // layout animation never reports, e.g. the tile has gone off screen)
  useEffect(() => {
    if (phase !== "back") return;
    const t = setTimeout(() => done.current(), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  const close = () => {
    if (phase === "back") return;
    if (still) { done.current(); return; }
    setBox(tile());
    setPhase("back");
  };
  const closeRef = useRef(close);
  useEffect(() => { closeRef.current = close; });

  // focus the dialog; Escape closes from anywhere; the page behind does not scroll
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); closeRef.current(); } };
    const stop = (e: Event) => e.preventDefault();
    addEventListener("keydown", esc);
    el.addEventListener("wheel", stop, { passive: false });
    el.addEventListener("touchmove", stop, { passive: false });
    return () => {
      removeEventListener("keydown", esc);
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchmove", stop);
    };
  }, []);

  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); close(); }
    else if (e.key === "Tab" || SCROLL_KEYS.has(e.key)) e.preventDefault();   // the dialog is the only stop
  };
  // portals bubble React events to the tile and the wall: keep this click here
  const click = (e: MouseEvent<HTMLDivElement>) => { e.stopPropagation(); close(); };

  const large = phase === "open";
  return createPortal(
    <div
      ref={dialog}
      className={f.view}
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
      tabIndex={-1}
      data-clickable
      onClick={click}
      onKeyDown={key}
    >
      <motion.div className={f.viewBack} initial={{ opacity: 0 }} animate={{ opacity: phase === "back" ? 0 : 1 }} transition={FADE} />
      {large ? (
        <motion.div key="large" layoutId={id} className={f.viewPhoto} style={{ "--a": aspect } as CSSProperties} transition={MORPH}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img layoutId={`${id}-img`} src={src} alt="" className={f.viewImg} style={{ inset: 0, width: "100%", height: "100%" }} transition={MORPH} />
        </motion.div>
      ) : (
        <motion.div
          key="tile"
          layoutId={id}
          className={f.viewTile}
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          transition={MORPH}
          onLayoutAnimationComplete={() => { if (phase === "back") done.current(); }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img layoutId={`${id}-img`} src={src} alt="" className={f.viewImg} style={cover(box.width, box.height, aspect)} transition={MORPH} />
        </motion.div>
      )}
    </div>,
    document.body,
  );
}
