import shell from "../../_shared.module.css";
import v from "./variations.module.css";
import { sample } from "../../../sampleContent";
import { Emph } from "../../../quiet/helpers";

type Education = (typeof sample.education)[number];

const edu = sample.education;

/* ============================================================================
   V1 · Refined credential card — the diploma pick, neutralized
   The base layout (two-column card · identity + honours ledger split by a
   hairline) carried forward, but: the coral seal is replaced by the school's
   REAL logo on a neutral ground, every coral accent is swapped for ink/border
   tones, and the type stays inside Geist sans with a deliberate, code-free
   hierarchy — the "Honours" label becomes a tracked sans eyebrow under a rule.
   ========================================================================== */
function VariantOne() {
  return (
    <section className={v.oneWrap} aria-labelledby="edu-one-heading">
      <h2 id="edu-one-heading" className={shell.h2}>Education</h2>
      <div className={v.oneList}>
        {edu.map((e: Education) => (
          <article key={e.school} className={`${shell.card} ${shell.cardHover} ${v.oneCard}`}>
            <div className={v.oneIdentity}>
              <span className={v.oneLogoFrame}>
                <img className={v.oneLogo} src={e.logo} alt={`${e.school} logo`} width={52} height={52} />
              </span>
              <p className={`${v.onePeriod} ${shell.tabular}`}>{e.period}</p>
              <h3 className={v.oneSchool}>{e.school}</h3>
              <p className={v.oneDegree}>{e.degree}</p>
            </div>
            <div className={v.oneHonors}>
              <p className={v.oneHonorsLabel}>Honours</p>
              <ul className={v.onePoints}>
                {e.points.map((p) => (
                  <li key={p} className={v.onePoint}>
                    <span className={v.oneTick} aria-hidden="true">
                      <svg viewBox="0 0 12 12" width="12" height="12">
                        <path d="m2.2 6.2 2.4 2.6L9.8 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className={v.onePointText}><Emph text={p} /></span>
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
   V2 · Diploma — editorial serif credential
   The warmest, most academic take. School names + the "Honours" label + the
   period set in Fraunces serif (with a serif-italic "Conferred" period); the
   logo is framed like a wax seal would be, and honours surface as bordered
   medallion chips. No coral anywhere — ink, paper-alt grounds, and hairlines.
   ========================================================================== */
function VariantTwo() {
  return (
    <section className={v.twoWrap} aria-labelledby="edu-two-heading">
      <h2 id="edu-two-heading" className={shell.h2}>Education</h2>
      <div className={v.twoList}>
        {edu.map((e: Education) => {
          const chips = e.highlights ?? [];
          return (
            <article key={e.school} className={`${shell.card} ${shell.cardHover} ${v.twoCard}`}>
              <div className={v.twoHead}>
                <span className={v.twoLogoFrame}>
                  <img className={v.twoLogo} src={e.logo} alt={`${e.school} logo`} width={56} height={56} />
                </span>
                <div className={v.twoHeadText}>
                  <h3 className={v.twoSchool}>{e.school}</h3>
                  <p className={v.twoDegree}>{e.degree}</p>
                  <p className={`${v.twoPeriod} ${shell.tabular}`}>
                    <span className={v.twoPeriodLabel}>Conferred</span> {e.period}
                  </p>
                </div>
              </div>
              {chips.length > 0 && (
                <ul className={v.twoChips} aria-label={`${e.school} — honours`}>
                  {chips.map((h) => (
                    <li key={h} className={v.twoChip}>{h}</li>
                  ))}
                </ul>
              )}
              <div className={v.twoHonors}>
                <p className={v.twoHonorsLabel}>Honours</p>
                <ul className={v.twoPoints}>
                  {e.points.map((p) => (
                    <li key={p} className={v.twoPoint}>
                      <span className={v.twoMark} aria-hidden="true" />
                      <span className={v.twoPointText}><Emph text={p} /></span>
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

/* ============================================================================
   V3 · Registry — quiet, minimal ledger
   The most restrained reading. A low-contrast card with the logo kept small
   beside a tracked label row; school name in a calm sans, period as a faint
   tabular note. Honours collapse to a plain hairline-led list — no ticks, no
   colour, just rhythm. "Honours" set as a tiny tracked registry caption.
   ========================================================================== */
function VariantThree() {
  return (
    <section className={v.triWrap} aria-labelledby="edu-three-heading">
      <h2 id="edu-three-heading" className={shell.h2}>Education</h2>
      <div className={v.triList}>
        {edu.map((e: Education) => (
          <article key={e.school} className={`${shell.card} ${v.triCard}`}>
            <div className={v.triIdentity}>
              <span className={v.triLogoFrame}>
                <img className={v.triLogo} src={e.logo} alt={`${e.school} logo`} width={40} height={40} />
              </span>
              <div className={v.triMeta}>
                <h3 className={v.triSchool}>{e.school}</h3>
                <p className={v.triDegree}>{e.degree}</p>
              </div>
              <p className={`${v.triPeriod} ${shell.tabular}`}>{e.period}</p>
            </div>
            <div className={v.triHonors}>
              <p className={v.triHonorsLabel}>Honours</p>
              <ul className={v.triPoints}>
                {e.points.map((p) => (
                  <li key={p} className={v.triPoint}><Emph text={p} /></li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function EducationRefined() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Education · refined explorations</p>
        <h1 className={shell.pageTitle}>Refining the diploma-card pick</h1>
        <p className={shell.pageHint}>
          Three refinements of the credential-card direction — real school logos in
          place of the seal, a neutral ink-and-paper palette (no coral; the logos keep
          their own brand colours), and a distinct type treatment per version.
        </p>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>V1 · Refined credential — neutral, deliberate Geist sans</p>
          <VariantOne />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>V2 · Diploma — editorial Fraunces serif accents</p>
          <VariantTwo />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>V3 · Registry — quiet, minimal ledger</p>
          <VariantThree />
        </div>
      </div>
    </div>
  );
}
