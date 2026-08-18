import { sample } from "../../sampleContent";
import styles from "../styles.module.css";
import v from "../../sections/community/final/variations.module.css";
import { Emph } from "../helpers";

/**
 * Community & Speaking — the converged "impact ledger" pick, composed into the
 * home. Two org cards sharing one header grammar (logo · linked name · role ·
 * period), a KPI strip on the lead org, then the quiet "Speaking & talks" list
 * (event / org → title with an optional link → description).
 *
 * Outer chrome uses the quiet .section/.h2 so it slots into the home's rhythm;
 * the inner layout reuses the exploration's final variations module. Source of
 * truth for the design: app/samples/sections/community/final.
 */
type Org = (typeof sample.community)[number];
type Talk = (typeof sample.speaking)[number];

const orgs = sample.community;
const talks = sample.speaking;

/** KPI strip only exists on the lead org; guard keeps its absence TS-clean. */
function orgStats(o: Org): ReadonlyArray<{ fig: string; label: string }> {
  return "stats" in o ? o.stats : [];
}

export function Community() {
  return (
    <section className={styles.section} aria-label="Community and speaking">
      <h2 className={styles.h2}>Community &amp; Speaking</h2>

      <div className={v.orgs}>
        {orgs.map((o, i) => {
          const lead = i === 0;
          const stats = orgStats(o);
          return (
            <article key={o.name} className={`${v.card} ${lead ? "" : v.cardAlt}`}>
              <header className={v.head}>
                <img className={v.logo} src={o.logo} alt={`${o.name} logo`} />
                <h3 className={v.org}>
                  <a className={v.orgLink} href={o.url} target="_blank" rel="noreferrer">
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
                  <a className={v.talkLink} href={t.link} target="_blank" rel="noreferrer">
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
  );
}
