"use client";

import { useRef, useState, type CSSProperties } from "react";
import home from "./home.module.css";
import { FileInnards, FileRail, FileTabs, FileUnders, mod, type Proj } from "./fileParts";

/**
 * Case Files variant, RIFFLE. Instead of the baseline's header-strip
 * preview, scrubbing across the tab row thumbs through WHOLE files live:
 * as the pointer crosses each tab, that file flicks down out of the drawer
 * and lies loose on the pile, slightly high, half a degree askew, lighter
 * shadow, visibly not yet filed, while the open file is pressed beneath
 * it. Click squares the loose sheet up into a real pull; sweeping away
 * costs nothing (the pile falls back). The flick is direction-aware, the
 * counter ticks the preview numeral in muted ink, and previews are
 * aria-hidden and never announced.
 */

export function FileStackRiffle({ projects }: { projects: ReadonlyArray<Proj> }) {
  const flagship = Math.max(0, projects.findIndex((p) => p.flagship));
  const [idx, setIdx] = useState(flagship);
  const [preview, setPreview] = useState<number | null>(null);
  const [flick, setFlick] = useState(1); // rotation sign of the incoming flutter
  const [dealt, setDealt] = useState<number | null>(null);
  const [settling, setSettling] = useState(false);
  const last = useRef<number | null>(null);
  const n = projects.length;

  const hover = (i: number) => {
    const from = last.current ?? idx;
    if (i !== from) setFlick(i > from ? 1 : -1);
    last.current = i;
    setPreview(i === idx ? null : i); // crossing home: the pile recognizes it
  };

  const leave = () => {
    last.current = null;
    setPreview(null); // leaving without clicking always cancels
  };

  const pull = (to: number) => {
    if (to === idx) { setPreview(null); return; }
    const wasPreviewing = preview === mod(to, n);
    setPreview(null);
    last.current = null;
    setDealt(idx);
    setIdx(mod(to, n));
    setSettling(wasPreviewing); // loose sheet squares up instead of rising
  };

  return (
    <div className={home.fsWrap}>
      <div className={home.fsDesk}>
        <FileTabs projects={projects} idx={idx} pull={pull} onHover={hover} onLeave={leave} />

        <div className={home.fsWell}>
          <FileUnders projects={projects} idx={idx} />

          {/* committing from a preview reshuffles UNDER the loose sheet
              (frDealtUnder drops the clone below the settling file) */}
          {dealt !== null && dealt !== idx && (
            <div
              className={settling ? `${home.fsDealt} ${home.frDealtUnder}` : home.fsDealt}
              aria-hidden="true"
              onAnimationEnd={() => setDealt(null)}
            >
              <article className={home.fsFile}><FileInnards p={projects[dealt]} top={false} /></article>
            </div>
          )}

          <article
            key={projects[idx].slug}
            className={[
              home.fsFile,
              preview !== null ? home.frPressed : "",
              settling ? home.frSettle : dealt !== null ? home.fsRise : "",
            ].filter(Boolean).join(" ")}
            role="tabpanel"
            aria-label={projects[idx].title}
            onAnimationEnd={() => setSettling(false)}
          >
            <FileInnards p={projects[idx]} top={true} />
          </article>

          {/* the loose preview sheet, remounts per tab crossed, so fast
              scrubs read as one continuous flutter */}
          {preview !== null && preview !== idx && (
            <article
              key={projects[preview].slug}
              className={`${home.fsFile} ${home.frSheet}`}
              style={{ "--flick": `${flick * 0.8}deg` } as CSSProperties}
              aria-hidden="true"
            >
              <FileInnards p={projects[preview]} top={false} />
            </article>
          )}
        </div>
      </div>

      <FileRail projects={projects} idx={idx} pull={pull} previewIdx={preview}
        hint={<span className={home.fsHint}>Scrub the tabs to riffle, click to pull a file</span>} />
    </div>
  );
}
