import shell from "../../_shared.module.css";
import v from "./variations.module.css";
import { sample } from "../../../sampleContent";
import { Emph } from "../../../quiet/helpers";

/* =====================================================================
   COMMUNITY & SPEAKING — FINAL (converged)

   Carries forward Version1 ("Geist refined") from the refined round — two
   community org cards sharing one header grammar + a KPI stat strip on the
   lead org + a numbered "Speaking & talks" index — and folds in the user's
   feedback:
     1. eyebrow category kickers ("LEADERSHIP" / "MEMBERSHIP") removed;
     2. both org cards now sit on white (--surface) — the quieter sibling
        reads as family through shared shell + scale, not a recessed tint;
     3. org logos: BOTH orgs show a mark now (GDG official; Global Shapers a
        neutral placeholder until the real logo is supplied), and each org
        name links out to `org.url`;
     4. KPI stat strip kept on the lead org (reads community[0].stats);
     5. "Speaking & talks" uses the V3 "quiet" layout (bare hairline-separated
        rows): each talk leads with its event / org (`meta`) in the accent
        colour, then the title (which links to `talk.link` when a write-up /
        recording exists), then the description.
   ===================================================================== */

type Org = (typeof sample.community)[number];
type Talk = (typeof sample.speaking)[number];

const orgs = sample.community;
const talks = sample.speaking;

/* The KPI strip only exists on the lead org. A type guard keeps the absence
   of `stats` graceful (TS-strict clean) while both cards keep the same header
   grammar — so the relationship never breaks. */
function orgStats(o: Org): ReadonlyArray<{ fig: string; label: string }> {
  return "stats" in o ? o.stats : [];
}

export default function CommunityFinal() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Community &amp; Speaking · converged</p>
        <h1 className={shell.pageTitle}>The impact ledger</h1>
        <p className={shell.pageHint}>
          The converged pick: category kickers removed, both org cards on white
          (family by shared shell + scale), both orgs now carrying a logo + a
          link out, the lead org&rsquo;s KPI strip kept, and the V3 quiet
          &ldquo;Speaking &amp; talks&rdquo; layout — event / org, then title
          (with an optional link), then description.
        </p>

        <section className={v.section} aria-label="Community and speaking">
          <h2 className={shell.h2}>Community &amp; Speaking</h2>

          <div className={v.orgs}>
            {orgs.map((o, i) => {
              const lead = i === 0;
              const stats = orgStats(o);
              return (
                <article
                  key={o.name}
                  className={`${v.card} ${lead ? "" : v.cardAlt}`}
                >
                  <header className={v.head}>
                    <img className={v.logo} src={o.logo} alt={`${o.name} logo`} />
                    <h3 className={v.org}>
                      <a
                        className={v.orgLink}
                        href={o.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {o.name}
                        <span className={v.orgArrow} aria-hidden="true"> ↗</span>
                      </a>
                    </h3>
                    <p className={v.meta}>
                      {o.role} · {o.period}
                    </p>
                  </header>

                  <p className={v.blurb}>
                    <Emph text={o.description} />
                  </p>

                  {stats.length > 0 ? (
                    <dl className={v.stats} aria-label={`${o.name} impact`}>
                      {stats.map((s) => (
                        <div key={s.label} className={v.stat}>
                          <dt className={v.fig}>{s.fig}</dt>
                          <dd className={v.cap}>{s.label}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <span className={v.spacer} aria-hidden="true" />
                  )}
                </article>
              );
            })}
          </div>

          <div className={v.talksBlock}>
            <h3 className={v.subHead}>Speaking &amp; talks</h3>
            <div className={v.rail}>
              {talks.map((t: Talk) => (
                <article key={t.title} className={v.talk}>
                  <p className={v.talkMeta}>{t.meta}</p>
                  <h4 className={v.talkTitle}>
                    {t.link ? (
                      <a
                        className={v.talkLink}
                        href={t.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.title}
                        <span className={v.talkArrow} aria-hidden="true"> ↗</span>
                      </a>
                    ) : (
                      t.title
                    )}
                  </h4>
                  <p className={v.talkDesc}>{t.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
