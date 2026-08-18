import { sample } from "../../sampleContent";
import styles from "../styles.module.css";
import alt from "./About.alt.module.css";
import { Emph } from "../helpers";
import type { SectionVariant } from "./Hero";

/** V1 — current locked about: prose left, focus-area bullet list right. */
function AboutV1() {
  return (
    <section className={styles.about}>
      <div className={styles.aboutBody}>
        <p><Emph text={sample.about[0]} /></p>
        <p><Emph text={sample.about[1]} /></p>
      </div>
      <ul className={styles.focusList} aria-label="Focus areas">
        {sample.focusAreas.map((f) => <li key={f} className={styles.focusItem}>{f}</li>)}
      </ul>
    </section>
  );
}

/** V2 — lead statement: the first line set as a focal statement, supporting
    line below, focus areas as a full-width chip row. */
function AboutV2() {
  return (
    <section className={alt.v2}>
      <p className={alt.lead}><Emph text={sample.about[0]} /></p>
      <p className={alt.leadSub}><Emph text={sample.about[1]} /></p>
      <ul className={alt.chipRow} aria-label="Focus areas">
        {sample.focusAreas.map((f) => <li key={f} className={alt.chip}>{f}</li>)}
      </ul>
    </section>
  );
}

/** V3 — editorial: a display lead + supporting line, a de-boxed at-a-glance
    column, and focus-area chips spanning below. All from existing content. */
function AboutV3() {
  return (
    <section className={alt.v3}>
      <div className={alt.v3Narrative}>
        <p className={alt.v3Lead}><Emph text={sample.about[0]} /></p>
        <p className={alt.v3Support}><Emph text={sample.about[1]} /></p>
      </div>
      <dl className={alt.glance}>
        <div className={alt.glanceRow}>
          <dt className={alt.glanceLabel}>Currently</dt>
          <dd className={alt.glanceValue}>
            {sample.role} ·{" "}
            <a href={sample.companyUrl} target="_blank" rel="noreferrer">{sample.company}</a>
          </dd>
        </div>
        <div className={alt.glanceRow}>
          <dt className={alt.glanceLabel}>Industries</dt>
          <dd className={alt.glanceValue}>Financial services, investment management, education, compliance</dd>
        </div>
        <div className={alt.glanceRow}>
          <dt className={alt.glanceLabel}>Speaking</dt>
          <dd className={alt.glanceValue}>Generative AI, AI coding agents, modern engineering workflows</dd>
        </div>
      </dl>
      <ul className={alt.focusChips} aria-label="Focus areas">
        {sample.focusAreas.map((f) => <li key={f} className={alt.focusChip}>{f}</li>)}
      </ul>
    </section>
  );
}

export function About({ variant = 1 }: { variant?: SectionVariant }) {
  if (variant === 2) return <AboutV2 />;
  if (variant === 3) return <AboutV3 />;
  return <AboutV1 />;
}
