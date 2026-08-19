import { sample } from "../../sampleContent";
import styles from "../styles.module.css";
import alt from "./Skills.alt.module.css";
import { Pill } from "../helpers";
import type { SectionVariant } from "./Hero";

const groups = sample.skills;
const idx = (i: number) => String(i + 1).padStart(2, "0");

/** Skills — a spec sheet: numbered rows, domain + blurb on the left, general
    skills (outlined chips) over specific tooling (logo pills) on the right.
    `eyebrow` is the landing page's numbered section label (absent on samples). */
function SkillsMain({ eyebrow }: { eyebrow?: React.ReactNode }) {
  return (
    <section className={styles.section}>
      {eyebrow}
      <h2 className={styles.h2}>Skills</h2>
      <div className={alt.rows}>
        {groups.map((g, i) => (
          <div key={g.title} className={alt.row}>
            <div className={alt.rowLeft}>
              <p className={alt.rowIndex}>{idx(i)}</p>
              <h3 className={alt.rowTitle}>{g.title}</h3>
              <p className={alt.rowDesc}>{g.blurb}</p>
            </div>
            <div className={alt.rowRight}>
              {g.general.length > 0 ? (
                <ul className={alt.capChips} aria-label={`${g.title} — general`}>
                  {g.general.map((c) => <li key={c} className={alt.capChip}>{c}</li>)}
                </ul>
              ) : null}
              <div className={`${alt.cardPills} ${g.general.length > 0 ? alt.cardPillsDivided : ""}`}>
                {g.tools.map((t) => <Pill key={t} name={t} />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// One locked design now (the spec-sheet rows); variant kept for the API.
export function Skills({ variant = 1, eyebrow }: { variant?: SectionVariant; eyebrow?: React.ReactNode }) {
  void variant;
  return <SkillsMain eyebrow={eyebrow} />;
}
