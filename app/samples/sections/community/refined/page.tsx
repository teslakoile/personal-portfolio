import shell from "../../_shared.module.css";
import v from "./variations.module.css";
import { sample } from "../../../sampleContent";
import { Emph } from "../../../quiet/helpers";

/* Refinements of the chosen base, Variant C, the "impact ledger".
   Each version below keeps that DNA (a stat-forward lead org + a quieter
   sibling + a talk rail) but resolves two pieces of user feedback:
   · org cohesion, both orgs now read as one family, and
   · typography, the indices / talk meta / stat figures each get a distinct,
     intentional treatment instead of the off-system code-mono. */

type Org = (typeof sample.community)[number];
type Talk = (typeof sample.speaking)[number];

const orgs = sample.community;
const talks = sample.speaking;

const idx = (i: number) => String(i + 1).padStart(2, "0");

/* The KPI strip only exists on the lead org. A small type guard keeps the
   absence of `stats` graceful (TS-strict clean) while both cards still share
   the same header grammar, so the relationship never breaks. */
function orgStats(o: Org): ReadonlyArray<{ fig: string; label: string }> {
  return "stats" in o ? o.stats : [];
}

/* =====================================================================
   V1 · GEIST, REFINED
   The whole section stays in the Geist sans; numerals + labels are re-tuned
   with deliberate size / weight / tracking / colour. Both orgs are cards cut
   from one shell (the sibling on a recessed surface), so they read as a set.
   ===================================================================== */
function Version1() {
  return (
    <section className={v.v1} aria-label="Community and speaking, Geist refined">
      <h2 className={shell.h2}>Community &amp; Speaking</h2>

      <div className={v.v1Orgs}>
        {orgs.map((o, i) => {
          const lead = i === 0;
          const stats = orgStats(o);
          return (
            <article
              key={o.name}
              className={`${v.v1Card} ${lead ? "" : v.v1CardAlt}`}
            >
              <header className={v.v1Head}>
                <p className={v.v1Eyebrow}>
                  <span className={v.v1Dot} aria-hidden="true" />
                  {lead ? "Leadership" : "Membership"}
                </p>
                <h3 className={v.v1Org}>{o.name}</h3>
                <p className={v.v1Meta}>
                  {o.role} · {o.period}
                </p>
              </header>
              <p className={v.v1Blurb}>
                <Emph text={o.description} />
              </p>
              {stats.length > 0 ? (
                <dl className={v.v1Stats} aria-label={`${o.name} impact`}>
                  {stats.map((s) => (
                    <div key={s.label} className={v.v1Stat}>
                      <dt className={v.v1Fig}>{s.fig}</dt>
                      <dd className={v.v1Cap}>{s.label}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <span className={v.v1Spacer} aria-hidden="true" />
              )}
            </article>
          );
        })}
      </div>

      <div className={v.v1TalksBlock}>
        <h3 className={v.v1SubHead}>
          <span className={v.v1Dot} aria-hidden="true" />
          Speaking &amp; talks
        </h3>
        <div className={v.v1Rail}>
          {talks.map((t: Talk, i) => (
            <article key={t.title} className={v.v1Talk}>
              <span className={v.v1Index} aria-hidden="true">
                {idx(i)}
              </span>
              <p className={v.v1TalkMeta}>{t.meta}</p>
              <div className={v.v1TalkMain}>
                <h4 className={v.v1TalkTitle}>{t.title}</h4>
                <p className={v.v1TalkDesc}>{t.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   V2 · EDITORIAL SERIF
   Fraunces carries the heading, org names, and stat figures; Source Serif
   italic handles the eyebrows, captions, and talk meta, a warmer register.
   Both orgs live inside ONE panel split by a hairline, so they are literally
   one object.
   ===================================================================== */
function Version2() {
  const [lead, ...rest] = orgs;
  const leadStats = orgStats(lead);
  return (
    <section className={v.v2} aria-label="Community and speaking, editorial serif">
      <h2 className={v.v2Heading}>Community &amp; Speaking</h2>

      <article className={v.v2Panel}>
        {/* lead org */}
        <div className={v.v2Org}>
          <div className={v.v2OrgHead}>
            <p className={v.v2Eyebrow}>Leadership</p>
            <h3 className={v.v2Name}>{lead.name}</h3>
            <p className={v.v2Meta}>
              {lead.role} · {lead.period}
            </p>
          </div>
          <p className={v.v2Blurb}>
            <Emph text={lead.description} />
          </p>
          {leadStats.length > 0 ? (
            <dl className={v.v2Stats} aria-label={`${lead.name} impact`}>
              {leadStats.map((s) => (
                <div key={s.label} className={v.v2Stat}>
                  <dt className={v.v2Fig}>{s.fig}</dt>
                  <dd className={v.v2Cap}>{s.label}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* quieter siblings, same panel, same header grammar */}
        {rest.map((o) => (
          <div key={o.name}>
            <hr className={v.v2Sep} aria-hidden="true" />
            <div className={`${v.v2Org} ${v.v2OrgAlt}`}>
              <div className={v.v2OrgHead}>
                <p className={v.v2Eyebrow}>Membership</p>
                <h3 className={v.v2Name}>{o.name}</h3>
                <p className={v.v2Meta}>
                  {o.role} · {o.period}
                </p>
              </div>
              <p className={v.v2Blurb}>
                <Emph text={o.description} />
              </p>
            </div>
          </div>
        ))}
      </article>

      <div className={v.v2TalksBlock}>
        <h3 className={v.v2SubHead}>Speaking &amp; talks</h3>
        <div className={v.v2Rail}>
          {talks.map((t: Talk, i) => (
            <article key={t.title} className={v.v2Talk}>
              <span className={v.v2Index} aria-hidden="true">
                {idx(i)}
              </span>
              <div className={v.v2TalkMain}>
                <p className={v.v2TalkMeta}>{t.meta}</p>
                <h4 className={v.v2TalkTitle}>{t.title}</h4>
                <p className={v.v2TalkDesc}>{t.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   V3 · QUIET
   Indices and uppercase eyebrows are dropped; spacing + scale carry the
   hierarchy. Both orgs are stacked rows inside one bare surface, separated
   by a hairline, no card chrome to split them. Talk meta becomes a small
   accent kicker rather than code-mono.
   ===================================================================== */
function Version3() {
  return (
    <section className={v.v3} aria-label="Community and speaking, quiet">
      <h2 className={shell.h2}>Community &amp; Speaking</h2>

      <div className={v.v3Stack}>
        {orgs.map((o, i) => {
          const lead = i === 0;
          const stats = orgStats(o);
          return (
            <div
              key={o.name}
              className={`${v.v3Org} ${lead ? "" : v.v3OrgAlt}`}
            >
              <div className={v.v3OrgHead}>
                <h3 className={v.v3Name}>{o.name}</h3>
                <p className={v.v3Meta}>{o.period}</p>
              </div>
              <p className={v.v3Role}>{o.role}</p>
              <p className={v.v3Blurb}>
                <Emph text={o.description} />
              </p>
              {stats.length > 0 ? (
                <dl className={v.v3Stats} aria-label={`${o.name} impact`}>
                  {stats.map((s) => (
                    <div key={s.label} className={v.v3Stat}>
                      <dt className={v.v3Fig}>{s.fig}</dt>
                      <dd className={v.v3Cap}>{s.label}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={v.v3TalksBlock}>
        <h3 className={v.v3SubHead}>Speaking &amp; talks</h3>
        <div className={v.v3Rail}>
          {talks.map((t: Talk) => (
            <article key={t.title} className={v.v3Talk}>
              <p className={v.v3TalkMeta}>{t.meta}</p>
              <h4 className={v.v3TalkTitle}>{t.title}</h4>
              <p className={v.v3TalkDesc}>{t.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CommunityRefined() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Community &amp; Speaking · refined explorations</p>
        <h1 className={shell.pageTitle}>The impact ledger, refined</h1>
        <p className={shell.pageHint}>
          Three refinements of the chosen base (the impact ledger). Each keeps both
          community orgs reading as one family, a primary org and a quieter sibling
          built from the same shell, and gives the indices, talk labels, and stat
          figures a distinct, intentional type treatment.
        </p>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>V1 · Geist, refined, re-tuned numerals, no code-mono</p>
          <Version1 />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>V2 · Editorial serif, Fraunces headings &amp; figures</p>
          <Version2 />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>V3 · Quiet, indices dropped, spacing carries it</p>
          <Version3 />
        </div>
      </div>
    </div>
  );
}
