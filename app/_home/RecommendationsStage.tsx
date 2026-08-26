"use client";

import { useState } from "react";
import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";
import { initialsOf, WhoLink } from "./Recommendations";

/**
 * Recommendations option I, spotlight stage: one oversized serif quote on
 * stage at a time, a facepile tab rail below to switch speakers, and a mono
 * counter keeping score. The active chip wears the coral ring (same grammar
 * as the thread's lead chip); the quote block remounts per pick so the enter
 * animation replays (skipped under reduced motion). Client component, the
 * only interactive treatment in the set.
 */
export function RecommendationsStage() {
  const recs = sample.recommendations;
  const [idx, setIdx] = useState(0);
  if (!recs.length) return null;
  const r = recs[Math.min(idx, recs.length - 1)];
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.stg}>
        <figure key={r.name} className={home.stgItem}>
          <blockquote className={home.stgQuote}>{r.quote}</blockquote>
          <figcaption className={home.stgWho}>
            <WhoLink href={r.href} className={home.stgName} name={r.name} />
            <span className={home.stgTitle}>{r.title}</span>
          </figcaption>
        </figure>
        <div className={home.stgRail}>
          {recs.map((p, i) => (
            <button
              key={p.name}
              type="button"
              className={i === idx ? `${home.stgChip} ${home.stgChipActive}` : home.stgChip}
              aria-pressed={i === idx}
              aria-label={`Show recommendation from ${p.name}`}
              onClick={() => setIdx(i)}
            >
              {p.avatar ? (
                <img src={p.avatar} alt="" width={40} height={40} />
              ) : (
                <span className={home.stgInitials} aria-hidden="true">{initialsOf(p.name)}</span>
              )}
            </button>
          ))}
          <span className={`${home.secNote} ${home.stgCount}`} aria-hidden="true">
            {idx + 1} / {recs.length}
          </span>
        </div>
      </div>
    </section>
  );
}
