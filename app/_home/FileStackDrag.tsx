"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as RPE } from "react";
import home from "./home.module.css";
import { FileInnards, FileRail, FileTabs, FileUnders, mod, riseOrigin, type Proj } from "./fileParts";

/**
 * Case Files variant — DRAG TO DEAL. The baseline pile (tab-hover previews
 * included), but the open file is also a sheet you can pick up: it follows
 * the pointer with a tilt that flips with grab height (paper pivots around
 * your fingers), sideways glide free, vertical follow damped 4:1. Past
 * min(30% width, 140px) — or a flick — the release deals it away in the
 * drag direction (left = next, right = previous) and the neighbor rises;
 * under the threshold it springs back, so a drag either navigates or costs
 * nothing. Drag is a pointer-only enhancement with no aria of its own.
 */

type Fling = {
  from: number;
  vars: CSSProperties; // --fx0/--fy0/--fr0 → --fx1/--fy1/--fr1
};

const SLOP = 6;
const SLOP_TOUCH = 10;
const SLOP_LINK = 12;

export function FileStackDrag({ projects }: { projects: ReadonlyArray<Proj> }) {
  const flagship = Math.max(0, projects.findIndex((p) => p.flagship));
  const [idx, setIdx] = useState(flagship);
  const [dealt, setDealt] = useState<number | null>(null); // tab/next pulls
  const [fling, setFling] = useState<Fling | null>(null); // committed drags
  const [pose, setPose] = useState<CSSProperties | null>(null); // in hand
  const [spring, setSpring] = useState(false);
  const [riseFrom, setRiseFrom] = useState(1); // pulled card's depth in the sprawl (--d0)
  const [riseUp, setRiseUp] = useState(false); // pulled while risen → continue down, not re-rise
  const [tug, setTug] = useState<number | null>(null);
  const n = projects.length;

  const g = useRef({
    id: -1, x0: 0, y0: 0, w: 1, sign: 1, slop: SLOP,
    origin: "50% 50%", moved: false, dx: 0, dy: 0, vx: 0, lx: 0, lt: 0,
  });

  const pull = (to: number) => {
    const t = mod(to, n);
    if (t === idx) return;
    setRiseFrom(mod(t - idx, n));
    setRiseUp(tug === t);
    setTug(null);
    setFling(null);
    setDealt(idx);
    setIdx(t);
  };

  // leaving the row clears the tug after a short grace, so the pointer can
  // travel up onto the risen folder (re-entering it cancels the drop).
  // tabXs caches each tab's row-slot x (kept through the fall) so the
  // attached tab swaps in — and lands — pixel-aligned.
  const leaveT = useRef<number | null>(null);
  const tabXs = useRef<(number | undefined)[]>([]);
  const hoverTab = (i: number, x?: number) => {
    if (leaveT.current !== null) { clearTimeout(leaveT.current); leaveT.current = null; }
    if (x !== undefined) tabXs.current[i] = x;
    setTug(i === idx ? null : i);
  };
  const leaveTab = () => {
    if (leaveT.current !== null) clearTimeout(leaveT.current);
    leaveT.current = window.setTimeout(() => { leaveT.current = null; setTug(null); }, 220);
  };

  const grabbing = (on: boolean) => {
    document.body.style.cursor = on ? "grabbing" : "";
    document.body.style.userSelect = on ? "none" : "";
  };

  const down = (e: RPE<HTMLElement>) => {
    if (!e.isPrimary || pose || spring) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const onLink = (e.target as HTMLElement).closest("a") !== null;
    g.current = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY, w: r.width,
      sign: e.clientY - r.top < r.height / 2 ? 1 : -1,
      slop: onLink ? SLOP_LINK : e.pointerType === "touch" ? SLOP_TOUCH : SLOP,
      origin: `${e.clientX - r.left}px ${e.clientY - r.top}px`,
      moved: false, dx: 0, dy: 0, vx: 0, lx: e.clientX, lt: e.timeStamp,
    };
  };

  const move = (e: RPE<HTMLElement>) => {
    const s = g.current;
    if (e.pointerId !== s.id) return;
    const dx = e.clientX - s.x0;
    const dy = e.clientY - s.y0;
    if (!s.moved) {
      if (Math.hypot(dx, dy) < s.slop) return;
      s.moved = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* capture is best-effort */ }
      grabbing(true);
    }
    const dt = e.timeStamp - s.lt;
    if (dt > 0) {
      s.vx = 0.6 * ((e.clientX - s.lx) / dt) + 0.4 * s.vx;
      s.lx = e.clientX;
      s.lt = e.timeStamp;
    }
    s.dx = dx;
    s.dy = dy;
    const touch = e.pointerType === "touch";
    const cap = touch ? 4 : 6;
    const tilt = Math.max(-cap, Math.min(cap, dx * 0.045)) * s.sign;
    setPose({
      transform: `translate(${dx}px, ${dy * 0.25}px) rotate(${tilt}deg) scale(1.01)`,
      transformOrigin: s.origin,
    });
  };

  const settle = (commit: boolean) => {
    const s = g.current;
    s.id = -1;
    grabbing(false);
    if (!commit) {
      setPose(null);
      if (s.moved) setSpring(true);
      return;
    }
    const dir = s.dx < 0 ? -1 : 1; // travel direction of the outgoing file
    const to = s.dx < 0 ? idx + 1 : idx - 1; // left = next, right = previous
    setRiseFrom(mod(to - idx, n));
    setRiseUp(false); // drag deals rise from their slot in the pile
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cap = s.slop === SLOP_TOUCH ? 4 : 6;
    const tilt = Math.max(-cap, Math.min(cap, s.dx * 0.045)) * s.sign;
    if (!reduce) {
      setDealt(null);
      setFling({
        from: idx,
        vars: {
          "--fx0": `${s.dx}px`,
          "--fy0": `${s.dy * 0.25}px`,
          "--fr0": `${tilt}deg`,
          "--fx1": `${dir * (0.55 * s.w + 40)}px`,
          "--fy1": "56px",
          "--fr1": `${dir * 8}deg`,
        } as CSSProperties,
      });
    }
    setPose(null);
    setIdx(mod(to, n));
  };

  const up = (e: RPE<HTMLElement>) => {
    const s = g.current;
    if (e.pointerId !== s.id) return;
    if (!s.moved) { s.id = -1; return; }
    const touch = e.pointerType === "touch";
    const threshold = Math.min((touch ? 0.28 : 0.3) * s.w, touch ? 96 : 140);
    const flick = Math.abs(s.vx) >= (touch ? 0.4 : 0.5) && Math.abs(s.dx) >= 24;
    settle(Math.abs(s.dx) >= threshold || flick);
  };

  const clickCapture = (e: React.MouseEvent) => {
    if (!g.current.moved) return;
    g.current.moved = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const topCls = [
    home.fsFile,
    home.fsGrab,
    pose ? home.fsInHand : "",
    spring ? home.fsSpringBack : "",
    !pose && !spring && (dealt !== null || fling !== null) ? (riseUp ? home.fsRiseUp : home.fsRise) : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={home.fsWrap}>
      <div className={home.fsDesk}>
        <FileTabs projects={projects} idx={idx} pull={pull}
          onHover={hoverTab} onLeave={leaveTab} raised={tug} />

        <div className={home.fsWell}>
          <FileUnders projects={projects} idx={idx} tug={tug} tabXs={tabXs.current}
            pull={pull} onHover={hoverTab} onLeave={leaveTab} />

          {dealt !== null && dealt !== idx && (
            <div className={home.fsDealt} aria-hidden="true" onAnimationEnd={() => setDealt(null)}>
              <article className={home.fsFile}><FileInnards p={projects[dealt]} top={false} /></article>
            </div>
          )}

          {fling !== null && fling.from !== idx && (
            <div className={home.fsFlung} style={fling.vars} aria-hidden="true"
              onAnimationEnd={() => setFling(null)}>
              <article className={home.fsFile}><FileInnards p={projects[fling.from]} top={false} /></article>
            </div>
          )}

          <article
            key={projects[idx].slug}
            className={topCls}
            style={{ ...pose, ...riseOrigin(riseFrom) } as CSSProperties}
            role="tabpanel"
            aria-label={projects[idx].title}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => settle(false)}
            onClickCapture={clickCapture}
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && e.propertyName === "transform") setSpring(false);
            }}
          >
            <FileInnards p={projects[idx]} top={true} />
          </article>
        </div>
      </div>

      <FileRail projects={projects} idx={idx} pull={pull} previewIdx={tug}
        hint={
          <>
            <span className={`${home.fsHint} ${home.fsHintWide}`}>Drag the file aside, or pull a tab</span>
            <span className={`${home.fsHint} ${home.fsHintTouch}`}>Swipe the file to deal the next</span>
          </>
        } />
    </div>
  );
}
