"use client";

import { useEffect, useRef, useState } from "react";
import home from "./home.module.css";
import { FileInnards, FileRail, FileTabs, FileUnders, mod, riseOrigin, type Proj } from "./fileParts";

/**
 * File-stack client island, the Case Files BASELINE for Projects, per
 * Kyle's spec: every card renders AS-IS and the pile is simply those
 * cards stacked on top of each other at their slots. (1) labeled tab row
 * up top, the open file square beneath, filed card edges stair-stepping
 * below; (2) hovering a filed tab lifts that whole card straight up as
 * the preview while the rest of the pile fans open around it, leaning
 * away by row distance; (3) clicking pulls that project to
 * the top (the open file deals away, the chosen file rises). Server
 * renders the flagship on top; tabs and the Next control are real
 * anchors to /projects#slug, so without JS every file still deep-links.
 * Optional extra interactions live at /samples/rework/projects.
 */

export function FileStack({ projects }: { projects: ReadonlyArray<Proj> }) {
  const flagship = Math.max(0, projects.findIndex((p) => p.flagship));
  const [idx, setIdx] = useState(flagship);
  const [dealt, setDealt] = useState<number | null>(null);
  const [riseFrom, setRiseFrom] = useState(1); // pulled card's depth in the sprawl (--d0)
  const [riseUp, setRiseUp] = useState(false); // pulled while risen → continue down, not re-rise
  const [tug, setTug] = useState<number | null>(null);
  const leaveT = useRef<number | null>(null);
  const n = projects.length;

  const pull = (to: number) => {
    const t = mod(to, n);
    if (t === idx) return;
    setRiseFrom(t); // fixed index slots: the card rises from ITS slot
    setRiseUp(tug === t);
    setTug(null);
    setDealt(idx);
    setIdx(t);
  };

  // the dealt clone normally unmounts on its animation's end; this timer
  // is the safety net for environments where animation events don't fire
  // (frozen background tabs, embedded webviews) so the clone can never
  // linger and swallow the NEXT pull's deal animation
  useEffect(() => {
    if (dealt === null) return;
    const t = window.setTimeout(() => setDealt(null), 600);
    return () => clearTimeout(t);
  }, [dealt]);

  // leaving the row clears the tug after a short grace, so the pointer can
  // travel up onto the risen folder (re-entering it cancels the drop).
  // Tab geometry lives in state (refreshed by the row's ref callbacks
  // every commit, change-guarded so it settles): xs is each tab's
  // row-slot x, so the card's attached tab swaps in, and lands,
  // pixel-aligned; cs is each tab's center, the point its card pivots
  // around when the pile fans.
  const [geom, setGeom] = useState<{ xs: (number | undefined)[]; cs: (number | undefined)[] }>({ xs: [], cs: [] });
  const measure = (i: number, left: number, width: number) => {
    const c = left + width / 2;
    setGeom((g) => {
      if (g.xs[i] === left && g.cs[i] === c) return g;
      const xs = g.xs.slice(); const cs = g.cs.slice();
      xs[i] = left; cs[i] = c;
      return { xs, cs };
    });
  };
  const hover = (i: number) => {
    if (leaveT.current !== null) { clearTimeout(leaveT.current); leaveT.current = null; }
    setTug(i === idx ? null : i);
  };
  const leave = () => {
    if (leaveT.current !== null) clearTimeout(leaveT.current);
    leaveT.current = window.setTimeout(() => { leaveT.current = null; setTug(null); }, 220);
  };

  // the open card fans AWAY from the hovered tab like every other card:
  // pushed and leaned by row distance, signed by row position (left when
  // its own tab sits left of the hovered one, right otherwise), pivoting
  // at its own tab's center. The lean caps at two steps, matching the
  // filed cards' --fdc. --tabc (the pivot) outlives the tug, dropping
  // it mid-fall would re-aim the easing rotation and tear tab from card.
  const fanVars = (() => {
    const pivot = geom.cs[idx] != null
      ? ({ "--tabc": `${geom.cs[idx]}px` } as React.CSSProperties)
      : undefined;
    if (tug === null) return pivot;
    const fd = Math.abs(idx - tug);
    const s = idx < tug ? -1 : 1;
    return {
      ...pivot,
      "--fanx": `${s * (16 + 8 * fd)}px`,
      "--fanr": `${s * 2 * Math.min(fd, 2)}deg`,
    } as React.CSSProperties;
  })();

  return (
    <div className={home.fsWrap} style={fanVars}>
      <div className={home.fsDesk}>
        <FileTabs projects={projects} idx={idx} pull={pull}
          onHover={hover} onLeave={leave} raised={tug} fan measure={measure} />

        {/* the filed cards live OUTSIDE the well's stacking context so
            they interleave with the tab row in the desk's context by
            index (tab 28−2i, card 27−2i): a lifted folder covers
            everything below it in the pile and slides behind everything
            above it */}
        <div className={home.fsWellWrap}>
          <FileUnders projects={projects} idx={idx} tug={tug}
            tabXs={geom.xs} tabCs={geom.cs}
            pull={pull} onHover={hover} onLeave={leave} />

          <div className={home.fsWell}>

          {dealt !== null && dealt !== idx && (
            <div className={home.fsDealt} aria-hidden="true" onAnimationEnd={() => setDealt(null)}>
              <article className={home.fsFile}><FileInnards p={projects[dealt]} top={false} /></article>
            </div>
          )}

          <article
            key={projects[idx].slug}
            className={[
              home.fsFile,
              home.fsFileEase,
              tug !== null ? home.fsFileFan : "",
              dealt !== null ? (riseUp ? home.fsRiseUp : home.fsRise) : "",
            ].filter(Boolean).join(" ")}
            style={riseOrigin(riseFrom)}
            role="tabpanel"
            aria-label={projects[idx].title}
          >
            <FileInnards p={projects[idx]} top={true} />
          </article>
          </div>
        </div>
      </div>

      <FileRail projects={projects} idx={idx} pull={pull} previewIdx={tug}
        hint={<span className={home.fsHint}>Hover a tab to peek, click to pull the file out</span>} />
    </div>
  );
}
