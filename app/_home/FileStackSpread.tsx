"use client";

import { useEffect, useRef, useState } from "react";
import home from "./home.module.css";
import { FileInnards, FileRail, FileTabs, FileUnders, mod, riseOrigin, type Proj } from "./fileParts";

/**
 * Case Files variant, SPREAD THE FILES. The baseline pile (tab-hover
 * previews included), plus a footer control that slides all six dossiers
 * out of the pile's center and lays them across the desk in a loose,
 * hand-placed arrangement (fixed jitter table, the same slightly crooked
 * desk every visit): every tab strip, client line, and screenshot crop
 * readable at once. While spread, the pile steps back (buried sheets and
 * strips fade, the open file closes). Clicking any cover sweeps the desk
 * back into a pile with that file on top, deepest covers gathering first.
 * Covers are persistent elements moved only by transforms, so rapid clicks
 * bend trajectories. Without JS the toggle stays hidden and the section is
 * the plain baseline pile.
 */

export function FileStackSpread({ projects }: { projects: ReadonlyArray<Proj> }) {
  const flagship = Math.max(0, projects.findIndex((p) => p.flagship));
  const [idx, setIdx] = useState(flagship);
  const [dealt, setDealt] = useState<number | null>(null);
  const [riseFrom, setRiseFrom] = useState(1); // pulled card's depth in the sprawl (--d0)
  const [riseUp, setRiseUp] = useState(false); // pulled while risen → continue down, not re-rise
  const [tug, setTug] = useState<number | null>(null);
  const [mode, setMode] = useState<"pile" | "spread">("pile");
  const [hydrated, setHydrated] = useState(false); // toggle needs JS, hidden until the island mounts
  useEffect(() => setHydrated(true), []);
  const n = projects.length;

  const pull = (to: number) => {
    const t = mod(to, n);
    setTug(null);
    if (mode === "pile" && t !== idx) {
      setRiseFrom(mod(t - idx, n));
      setRiseUp(tug === t);
      setDealt(idx); // baseline deal for in-pile pulls
    }
    setIdx(t);
    setMode("pile");
  };

  // leaving the row clears the tug after a short grace, so the pointer can
  // travel up onto the risen folder (re-entering it cancels the drop).
  // tabXs caches each tab's row-slot x (kept through the fall) so the
  // attached tab swaps in, and lands, pixel-aligned.
  const leaveT = useRef<number | null>(null);
  const tabXs = useRef<(number | undefined)[]>([]);
  const hoverTab = (i: number, x?: number) => {
    if (leaveT.current !== null) { clearTimeout(leaveT.current); leaveT.current = null; }
    if (x !== undefined) tabXs.current[i] = x;
    setTug(i === idx || mode === "spread" ? null : i);
  };
  const leaveTab = () => {
    if (leaveT.current !== null) clearTimeout(leaveT.current);
    leaveT.current = window.setTimeout(() => { leaveT.current = null; setTug(null); }, 220);
  };

  return (
    <div className={home.fsWrap}>
      <div
        className={home.spdDesk}
        data-mode={mode}
        onKeyDown={(e) => { if (e.key === "Escape" && mode === "spread") setMode("pile"); }}
      >
        <FileTabs projects={projects} idx={idx} pull={pull}
          onHover={hoverTab} onLeave={leaveTab} raised={tug} />

        <div className={`${home.fsWell} ${home.spdWell}`}>
          {/* retired variant, kept for possible revival; the live island
              (FileStack) holds this geometry in state instead */}
          {/* eslint-disable-next-line react-hooks/refs */}
          <FileUnders projects={projects} idx={idx} tug={tug} tabXs={tabXs.current}
            pull={pull} onHover={hoverTab} onLeave={leaveTab} />

          {/* the six covers, hidden at the pile's center while piled, laid
              across the desk while spread */}
          {projects.map((p, i) => {
            const s = mod(i - idx, n);
            return (
              <a
                key={p.slug}
                href={`/projects#${p.slug}`}
                className={`${home.spdCover} ${home[`spdS${s}`]} ${home[`spdG${i}`]}`}
                aria-label={`File ${String(i + 1).padStart(2, "0")}, ${p.title}, pull to top`}
                aria-current={mode === "spread" && i === idx ? "true" : undefined}
                onClick={(e) => { e.preventDefault(); pull(i); }}
              >
                <span className={home.spdTab} aria-hidden="true">
                  <span className={home.spdNum}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={home.spdName}>{p.title}</span>
                </span>
                <span className={home.spdClient} aria-hidden="true">{p.client}</span>
                <span className={home.spdShot} aria-hidden="true">
                  <img src={`/projects/${p.slug}.png`} alt="" loading="lazy" draggable={false} />
                </span>
              </a>
            );
          })}

          {mode === "pile" && dealt !== null && dealt !== idx && (
            <div className={home.fsDealt} aria-hidden="true" onAnimationEnd={() => setDealt(null)}>
              <article className={home.fsFile}><FileInnards p={projects[dealt]} top={false} /></article>
            </div>
          )}

          <article
            key={projects[idx].slug}
            className={[
              home.fsFile,
              home.spdReader,
              mode === "pile" && dealt !== null ? (riseUp ? home.fsRiseUp : home.fsRise) : "",
            ].filter(Boolean).join(" ")}
            style={riseOrigin(riseFrom)}
            role="tabpanel"
            aria-label={projects[idx].title}
            aria-hidden={mode === "spread"}
          >
            <FileInnards p={projects[idx]} top={true} />
          </article>
        </div>
      </div>

      <FileRail projects={projects} idx={idx} pull={pull} previewIdx={tug}
        extra={hydrated ? (
          <button
            type="button"
            className={home.spdToggle}
            aria-expanded={mode === "spread"}
            onClick={() => setMode(mode === "pile" ? "spread" : "pile")}
          >
            {mode === "pile" ? "Spread the Files" : "Stack the Files"}
          </button>
        ) : null}
        hint={
          <span className={home.fsHint}>
            {mode === "pile" ? "Spread the files to see the whole desk" : "Pick a file to pull it to the top"}
          </span>
        } />
    </div>
  );
}
