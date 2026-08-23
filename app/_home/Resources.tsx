import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";

/**
 * Resources, card grid (the landing design). Content lives in
 * sampleContent.ts (`resources`) and is meant to be curated by hand. An
 * alternative bibliography treatment lives below as `ResourcesBib` for the
 * /samples/rework comparison.
 */
export function Resources() {
  return (
    <section className={styles.section} aria-label="Resources">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Resources</h2>
        <span className={styles.sectionNote}>Things I Actually Hand People</span>
      </div>
      <div className={home.resGrid}>
        {sample.resources.map((r) => (
          <a key={r.title} href={r.url} className={home.resCard} target="_blank" rel="noreferrer">
            <span className={home.resTop}>
              <span className={home.resKind}>{r.kind}</span>
              <span className={home.resSource}>{r.source}</span>
            </span>
            <h3 className={home.resTitle}>{r.title}</h3>
            <p className={home.resNote}>{r.note}</p>
            <span className={home.resArrow} aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment, contents page: numbered rows with bookish dot
    leaders running from title to a mono kind · source column; the personal
    note hangs beneath each entry. */
export function ResourcesContents() {
  return (
    <section className={styles.section} aria-label="Resources">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Resources</h2>
        <span className={home.secNote}>Things I Actually Hand People</span>
      </div>
      <div className={home.tocList}>
        {sample.resources.map((r) => (
          <a key={r.title} href={r.url} className={home.tocRow} target="_blank" rel="noreferrer">
            <span className={home.tocLine}>
              <span className={home.tocTitle}>{r.title}</span>
              <span className={home.tocLeader} aria-hidden="true" />
              <span className={home.tocMeta}>{r.kind} · {r.source}</span>
              <span className={home.tocArrow} aria-hidden="true">↗</span>
            </span>
            <span className={home.tocNote}>{r.note}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment, appendix split: the heading sits in a sticky left
    rail (the page's only side-set heading) while entries stack as ruled
    typographic blocks with the note at its largest. */
export function ResourcesSplit() {
  return (
    <section className={styles.section} aria-label="Resources">
      <div className={home.splitSec}>
        <div className={home.splitHead}>
          <h2 className={styles.h2} style={{ margin: 0 }}>Resources</h2>
          <span className={home.splitCount}>{sample.resources.length} picks, all external links</span>
        </div>
        <div className={home.splitList}>
          {sample.resources.map((r) => (
            <a key={r.title} href={r.url} className={home.splitRow} target="_blank" rel="noreferrer">
              <span className={home.splitKind}>{r.kind} · {r.source}</span>
              <span className={home.splitTitle}>
                {r.title} <span className={home.splitArrow} aria-hidden="true">↗</span>
              </span>
              <span className={home.splitNote}>{r.note}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Alternative treatment, annotated bibliography: whole-row links on a
    hanging-indent grid (mono kind + source gutter), no hairlines, sidebar-style
    surface wash on hover. */
export function ResourcesBib() {
  return (
    <section className={styles.section} aria-label="Resources">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Resources</h2>
        <span className={home.secNote}>Things I Actually Hand People</span>
      </div>
      <div className={home.bib}>
        {sample.resources.map((r) => (
          <a key={r.title} href={r.url} className={home.bibRow} target="_blank" rel="noreferrer">
            <span className={home.bibGutter}>
              <span className={home.bibKind}>{r.kind}</span>
              <span className={home.bibSource}>{r.source}</span>
            </span>
            <span>
              <span className={home.bibTitle}>{r.title}</span>
              <span className={home.bibNote}>{r.note}</span>
            </span>
            <span className={home.bibArrow} aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */
/* Imagery-led treatments (options E/F): thumbnails are LOCAL files declared
   per-entry in sampleContent (`image`), no runtime requests. */

/** Alternative treatment, cover shelf: all five picks stand as objects on
    hairline ledges (the DDIA book as a 3D-ish cover with a coral bookmark,
    web picks as favicons seated on surface-alt plates), with the personal
    note hanging beneath each as a shelf talker. */
export function ResourcesShelf() {
  return (
    <section className={styles.section} aria-label="Resources">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Resources</h2>
        <span className={home.secNote}>Things I Actually Hand People</span>
      </div>
      <div className={home.cshShelf}>
        {sample.resources.map((r) => (
          <a key={r.title} href={r.url} className={home.cshItem} target="_blank" rel="noreferrer">
            <span className={home.cshStage} aria-hidden="true">
              {r.kind === "Book" ? (
                <span className={`${home.cshCover} ${home.cshBook}`}>
                  <img src={r.image} alt="" width={66} height={88} loading="lazy" />
                </span>
              ) : (
                <span className={`${home.cshCover} ${home.cshPlate}`}>
                  <img src={r.image} alt="" width={30} height={30} loading="lazy" />
                </span>
              )}
            </span>
            <span className={home.cshMeta}>{r.kind} · {r.source}</span>
            <h3 className={home.cshTitle}>
              {r.title}<span className={home.cshArrow} aria-hidden="true">↗</span>
            </h3>
            <p className={home.cshNote}>{r.note}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment, icon plate list: app-store row grammar; a fixed
    surface-alt plate holds each thumbnail, identity is a structured column,
    and the personal note gets the widest measure in the row. */
export function ResourcesPlates() {
  return (
    <section className={styles.section} aria-label="Resources">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Resources</h2>
        <span className={home.secNote}>Things I Actually Hand People</span>
      </div>
      <div className={home.plList}>
        {sample.resources.map((r) => (
          <a key={r.title} href={r.url} className={home.plRow} target="_blank" rel="noreferrer">
            <span className={home.plThumb} aria-hidden="true">
              <img src={r.image} alt="" width={38} height={38} loading="lazy" />
            </span>
            <span className={home.plHead}>
              <span className={home.plTitle}>{r.title}</span>
              <span className={home.plMeta}>{r.kind} · {r.source}</span>
            </span>
            <span className={home.plNote}>{r.note}</span>
            <span className={home.plArrow} aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}
