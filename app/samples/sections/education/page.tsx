import shell from "../_shared.module.css";
import v from "./variations.module.css";
import { sample } from "../../sampleContent";
import { Emph } from "../../quiet/helpers";

type Education = (typeof sample.education)[number];

const edu = sample.education;

/* ============================================================================
   A · Credential Certificate, sealed diploma cards
   Each school is an elevated credential card with a coral seal node, a vertical
   hairline divider, and an honours ledger on the right.
   ========================================================================== */
function VariantA() {
  return (
    <section className={v.aWrap} aria-labelledby="edu-a-heading">
      <h2 id="edu-a-heading" className={shell.h2}>Education</h2>
      <div className={v.aList}>
        {edu.map((e: Education) => (
          <article key={e.school} className={`${shell.card} ${shell.cardHover} ${v.aCard}`}>
            <span className={v.aEdge} aria-hidden="true" />
            <div className={v.aIdentity}>
              <span className={v.aSeal} aria-hidden="true">
                <span className={v.aSealRings} />
                <svg viewBox="0 0 24 24" className={v.aSealMark} aria-hidden="true">
                  <circle cx="12" cy="9" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M9.2 13.4 7.6 20l4.4-2.4L16.4 20l-1.6-6.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
                  <path d="m9.7 9 1.7 1.7L14.5 7.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className={`${v.aPeriod} ${shell.tabular}`}>{e.period}</p>
              <h3 className={v.aSchool}>{e.school}</h3>
              <p className={v.aDegree}>{e.degree}</p>
            </div>
            <div className={v.aHonors}>
              <p className={v.aHonorsLabel}>Honours</p>
              <ul className={v.aPoints}>
                {e.points.map((p) => (
                  <li key={p} className={v.aPoint}>
                    <span className={v.aTick} aria-hidden="true">
                      <svg viewBox="0 0 12 12" width="12" height="12">
                        <path d="m2.2 6.2 2.4 2.6L9.8 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className={v.aPointText}><Emph text={p} /></span>
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

/* ============================================================================
   B · Academic Timeline Rail, coral-node date rail with degree dossiers
   A single vertical timeline; the period years anchor the left rail, coral
   diamond nodes thread a continuous hairline, dossiers sit on the right.
   ========================================================================== */
function railYears(period: string): [string, string] {
  // Tolerate "to" or a hyphen, with or without surrounding whitespace, and
  // future-proof open-ended periods like "2024 to Present". A missing end
  // simply yields an empty trailing label.
  const [a = period.trim(), b] = period.split(/\s+to\s+|\s*-\s*/);
  return [a, b ? `to ${b}` : ""];
}

function VariantB() {
  return (
    <section className={v.bSection} aria-labelledby="edu-b-heading">
      <h2 id="edu-b-heading" className={shell.h2}>Education</h2>
      <ol className={v.bRail}>
        {edu.map((e: Education) => {
          const [start, end] = railYears(e.period);
          return (
            <li key={e.school} className={v.bStop}>
              <div className={v.bDate}>
                <span className={v.bNode} aria-hidden="true" />
                <time className={`${v.bYear} ${shell.tabular}`}>{start}</time>
                <span
                  className={`${v.bYearEnd} ${shell.tabular}`}
                  aria-hidden={end ? undefined : "true"}
                >
                  {end}
                </span>
              </div>
              <div className={v.bBody}>
                <h3 className={v.bSchool}>{e.school}</h3>
                <p className={v.bDegree}>{e.degree}</p>
                <ul className={v.bPoints}>
                  {e.points.map((p) => (
                    <li key={p} className={v.bPoint}>
                      <span className={v.bMark} aria-hidden="true" />
                      <span><Emph text={p} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ============================================================================
   C · Transcript, hairline registry with honour highlights
   One flush registry panel; numbered rows separated by hairlines, each leading
   with a strip of honour chips before the full prose points.
   ========================================================================== */
function VariantC() {
  return (
    <section className={v.cSection} aria-labelledby="edu-c-heading">
      <h2 id="edu-c-heading" className={shell.h2}>Education</h2>
      <div className={v.cTranscript} role="list">
        {edu.map((e: Education, i) => {
          const index = String(i + 1).padStart(2, "0");
          const chips = e.highlights ?? [];
          return (
            <article key={e.school} className={v.cRow} role="listitem">
              <span className={`${v.cIndex} ${shell.tabular}`} aria-hidden="true">{index}</span>
              <div className={v.cIdentity}>
                <h3 className={v.cSchool}>{e.school}</h3>
                <p className={v.cDegree}>{e.degree}</p>
                <p className={`${v.cPeriod} ${shell.tabular}`}>
                  <span className={v.cPeriodMark} aria-hidden="true" />
                  {e.period}
                </p>
              </div>
              <div className={v.cBody}>
                {chips.length > 0 && (
                  <ul className={v.cHonors} aria-label={`${e.school}, honours`}>
                    {chips.map((h) => (
                      <li key={h} className={`${v.cChip} ${shell.tabular}`}>{h}</li>
                    ))}
                  </ul>
                )}
                <ul className={v.cPoints}>
                  {e.points.map((p) => (
                    <li key={p} className={v.cPoint}>
                      <span className={v.cBullet} aria-hidden="true" />
                      <span><Emph text={p} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function EducationExplore() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Education · layout explorations</p>
        <h1 className={shell.pageTitle}>Three ways to frame the credentials</h1>
        <p className={shell.pageHint}>
          Same two schools, three directions. Every variant keeps the school, degree,
          period, and full honours points, the standout metrics bold automatically.
        </p>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>A · Credential certificate, sealed diploma cards</p>
          <VariantA />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>B · Academic timeline rail, coral-node date rail</p>
          <VariantB />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>C · Transcript, hairline registry with honour highlights</p>
          <VariantC />
        </div>
      </div>
    </div>
  );
}
