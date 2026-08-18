import shell from "../../_shared.module.css";
import v from "./variations.module.css";
import { sample } from "../../../sampleContent";
import { Emph } from "../../../quiet/helpers";

type Education = (typeof sample.education)[number];

const edu = sample.education;

const idx = (i: number) => String(i + 1).padStart(2, "0");

/* ============================================================================
   Option A · Ledger — a card-less two-column CV row (decluttered)
   Real logo, school / degree / period in a left identity rail; the honours &
   activities as a plain, decoration-free list on the right — no chips, no
   label, no tick marks. No card, no surface, no shadow: each school is a bare
   row on the paper, the two schools parted only by a full-bleed hairline. Type
   stays Geist-refined; neutral throughout — the logos alone carry brand colour.
   ========================================================================== */
function OptionA() {
  return (
    <section className={v.aWrap} aria-labelledby="edu-a-heading">
      <h2 id="edu-a-heading" className={shell.h2}>Education</h2>
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
                  <li key={p} className={v.aPoint}><Emph text={p} /></li>
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
   Option B · Registry — a card-less numbered index
   A stacked, full-width registry: each school is a hairline-ruled row keyed by a
   quiet ordinal index in a left margin. School names lean editorial in Fraunces;
   degree + period sit as a tabular sans note. Honours collapse to a plain
   hairline-led list (V3 rhythm), with highlights as soft tinted --surface-alt
   pills. No card, no box — just index, rules, spacing, and type on the paper.
   ========================================================================== */
function OptionB() {
  return (
    <section className={v.bWrap} aria-labelledby="edu-b-heading">
      <h2 id="edu-b-heading" className={shell.h2}>Education</h2>
      <ol className={v.bList}>
        {edu.map((e: Education, i) => {
          const chips = e.highlights ?? [];
          return (
            <li key={e.school} className={v.bRow}>
              <div className={v.bMargin}>
                <span className={`${v.bIndex} ${shell.tabular}`} aria-hidden="true">
                  {idx(i)}
                </span>
                <img
                  className={v.bLogo}
                  src={e.logo}
                  alt={`${e.school} logo`}
                  width={44}
                  height={44}
                />
              </div>
              <div className={v.bBody}>
                <div className={v.bHead}>
                  <h3 className={v.bSchool}>{e.school}</h3>
                  <p className={v.bMeta}>
                    {e.degree}
                    <span className={v.bDot} aria-hidden="true">·</span>
                    <span className={shell.tabular}>{e.period}</span>
                  </p>
                </div>
                {chips.length > 0 && (
                  <ul className={v.bChips} aria-label={`${e.school} — honours`}>
                    {chips.map((h) => (
                      <li key={h} className={v.bChip}>{h}</li>
                    ))}
                  </ul>
                )}
                <ul className={v.bPoints}>
                  {e.points.map((p) => (
                    <li key={p} className={v.bPoint}><Emph text={p} /></li>
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

export default function EducationFinal() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Education · final · card-less</p>
        <h1 className={shell.pageTitle}>Card-less education — V1 completeness × V3 registry</h1>
        <p className={shell.pageHint}>
          Two card-less directions: no surface boxes, no shadowed panels — content sits
          directly on the paper, organized only by layout, hairline rules, spacing, and
          type. Both keep the real school logos and a neutral ink-and-paper palette (no
          coral; the logos carry their own brand colours).
        </p>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>Option A · Ledger — logo + identity rail, plain honours list on the right (decluttered)</p>
          <OptionA />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>Option B · Registry — numbered index, full-width hairline rows, Fraunces school names</p>
          <OptionB />
        </div>
      </div>
    </div>
  );
}
