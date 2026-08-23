import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";
import { Emph } from "../samples/quiet/helpers";

/**
 * Community & Speaking, landing treatment: an impact billboard on bare paper.
 * GDG Davao leads with oversized stat numerals parted by vertical hairlines
 * (one of the page's two jumbo-numeral moments, twinned with the GitHub total);
 * Global Shapers is a one-line ledger footnote; talks are a numbered index.
 * Zero surfaces. The carded version lives on at /samples.
 */

const [lead, sibling] = sample.community;
const talks = sample.speaking;

export function CommunityBillboard() {
  const stats = "stats" in lead ? lead.stats : [];
  return (
    <section className={styles.section} aria-label="Community and speaking">
      <h2 className={styles.h2}>Community &amp; Speaking</h2>

      {/* lead org, header row, blurb, stat billboard */}
      <div className={home.comHead}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={home.comLogo} src={lead.logo} alt="" aria-hidden="true" />
        <h3 className={home.comOrg}>
          <a className={home.comOrgLink} href={lead.url} target="_blank" rel="noreferrer">
            {lead.name} <span className={home.comArrow} aria-hidden="true">↗</span>
          </a>
        </h3>
        <span className={home.comMeta}>{lead.role} · {lead.period}</span>
      </div>
      <p className={home.comBlurb}><Emph text={lead.description} /></p>

      {stats.length > 0 ? (
        <dl className={home.comStats} aria-label={`${lead.name} impact`}>
          {stats.map((s) => (
            <div key={s.label} className={home.comStat}>
              <dt className={home.comFig}>{s.fig}</dt>
              <dd className={home.comCap}>{s.label}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* sibling org, a deliberate one-line ledger footnote */}
      <a className={home.comSibling} href={sibling.url} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={home.comSibLogo} src={sibling.logo} alt="" aria-hidden="true" />
        <span className={home.comSibName}>{sibling.name}</span>
        <span className={home.comSibRole}>{sibling.role}</span>
        <span className={home.comMeta}>{sibling.period}</span>
      </a>

      {/* speaking, numbered index rows */}
      <p className={home.comSubHead}>Speaking &amp; Talks</p>
      <div>
        {talks.map((t, i) => (
          <article key={t.title} className={home.talkRow}>
            <span className={home.talkIdx}>{String(i + 1).padStart(2, "0")}</span>
            <span>
              <h4 className={home.talkTitle}>
                {t.link ? (
                  <a className={home.talkTitleLink} href={t.link} target="_blank" rel="noreferrer">
                    {t.title} <span className={home.comArrow} aria-hidden="true">↗</span>
                  </a>
                ) : (
                  t.title
                )}
              </h4>
              <p className={home.talkDesc}>{t.description}</p>
            </span>
            <span className={home.talkMetaCol}>{t.meta}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
