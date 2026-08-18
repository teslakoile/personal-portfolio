import { sample } from "../../sampleContent";
import styles from "../styles.module.css";
import v from "../../sections/education/final/variations.module.css";
import shell from "../../sections/_shared.module.css";
import { Emph } from "../helpers";

/**
 * Education — the decluttered "ledger" (Option A), composed into the home: a
 * card-less two-column row per school (logo + period + school + degree in a left
 * identity rail, a plain bulleted honours & activities list on the right),
 * schools parted only by a full-bleed hairline. No card, no chips, no label.
 *
 * Outer chrome uses the quiet .section/.h2; inner layout reuses the final
 * variations module. Source of truth: app/samples/sections/education/final.
 */
type Education = (typeof sample.education)[number];

const edu = sample.education;

export function Education() {
  return (
    <section className={styles.section} aria-label="Education">
      <h2 className={styles.h2}>Education</h2>
      <div className={v.aList} role="list">
        {edu.map((e: Education) => (
          <article key={e.school} className={v.aRow} role="listitem">
            <div className={v.aIdentity}>
              <img
                className={v.aLogo}
                src={e.logo}
                alt={`${e.school} logo`}
                width={52}
                height={52}
              />
              <p className={`${v.aPeriod} ${shell.tabular}`}>{e.period}</p>
              <h3 className={v.aSchool}>{e.school}</h3>
              <p className={v.aDegree}>{e.degree}</p>
            </div>
            <div className={v.aDetail}>
              <ul className={v.aPoints}>
                {e.points.map((p) => (
                  <li key={p} className={v.aPoint}>
                    <Emph text={p} />
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
