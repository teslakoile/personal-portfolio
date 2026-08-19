import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";

/**
 * Recommendations — quote cards (the landing design). Data comes from
 * sampleContent.ts (`recommendations`, currently MOCK entries for layout
 * preview); the section renders nothing when the list is empty, so clearing
 * the mocks hides it. An alternative pull-quote treatment lives below as
 * `RecommendationsQuotes` for the /samples/rework comparison.
 */
export function Recommendations() {
  if (!sample.recommendations.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={styles.sectionNote}>What Teammates Say</span>
      </div>
      <div className={home.recsGrid}>
        {sample.recommendations.map((r) => (
          <figure key={r.name} className={home.recsCard} style={{ margin: 0 }}>
            <blockquote className={home.recsQuote} style={{ margin: 0 }}>{r.quote}</blockquote>
            <figcaption className={home.recsWho}>
              <span className={home.recsName}>{r.name}</span>
              <span className={home.recsTitle}>{r.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment — reference ledger: attribution rail on the left
    (coral tick, name, title), serif quote on the right; hairlines between rows.
    Who said it leads, the way references appear on a resume. */
export function RecommendationsLedger() {
  if (!sample.recommendations.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.refLedger}>
        {sample.recommendations.map((r) => (
          <figure key={r.name} className={home.refRow}>
            <blockquote className={home.refQuote}>{r.quote}</blockquote>
            <figcaption className={home.refWho}>
              <span className={home.refName}>{r.name}</span>
              <span className={home.refTitle}>{r.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment — blurb wall: book-front-matter run-in paragraphs.
    Bold name leads the line, the quote flows on in serif with inline coral
    marks; short top-left rules part the entries. */
export function RecommendationsBlurbs() {
  if (!sample.recommendations.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.blurbs}>
        {sample.recommendations.map((r) => (
          <p key={r.name} className={home.blurb}>
            <span className={home.blurbWho}>{r.name}</span>
            <span className={home.blurbRole}>, {r.title} — </span>
            <span className={home.blurbQuote}>{r.quote}</span>
          </p>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment — single-column pull-quote stack: serif quotes with a
    hanging coral opening mark, the lead quote oversized; no chrome, no hover. */
export function RecommendationsQuotes() {
  if (!sample.recommendations.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.pq}>
        {sample.recommendations.map((r, i) => (
          <figure key={r.name} className={`${home.pqItem} ${i === 0 ? home.pqLead : ""}`}>
            <blockquote className={home.pqQuote}>{r.quote}</blockquote>
            <figcaption className={home.pqWho}>
              <span className={home.pqName}>{r.name}</span>
              <span className={home.pqTitle}>{r.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */
/* Asset-led treatments (options E/F): both derive an initials monogram while
   `avatar` is null; real headshots drop in via sampleContent when they land. */

const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

/** Alternative treatment — speech bubbles: tinted "received message" bubbles
    with hairline tails alternating down a conversation column; avatar (or
    initials chip) + name + title anchored under each tail. */
export function RecommendationsBubbles() {
  if (!sample.recommendations.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.vox}>
        {sample.recommendations.map((r, i) => (
          <figure key={r.name} className={`${home.voxItem} ${i % 2 === 1 ? home.voxFlip : ""}`}>
            <blockquote className={home.voxBubble}>
              <p className={home.voxQuote}>{r.quote}</p>
            </blockquote>
            <figcaption className={home.voxWho}>
              {r.avatar ? (
                <span className={home.voxAvatar}>
                  <img src={r.avatar} alt="" width={36} height={36} />
                </span>
              ) : (
                <span className={`${home.voxAvatar} ${home.voxInitials}`} aria-hidden="true">
                  {initialsOf(r.name)}
                </span>
              )}
              <span className={home.voxId}>
                <span className={home.voxName}>{r.name}</span>
                <span className={home.voxRole}>{r.title}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function ThreadChip({ avatar, name }: { avatar?: string | null; name: string }) {
  return (
    <span className={home.avtChip}>
      {avatar
        ? <img src={avatar} alt="" />
        : <span className={home.avtInitials} aria-hidden="true">{initialsOf(name)}</span>}
    </span>
  );
}

/** Alternative treatment — attribution thread: an avatar-spined log where
    who-said-it leads and the quote follows; a facepile + count sit in the
    section head row. No bubbles, no tails — a maintained record, not a chat. */
export function RecommendationsThread() {
  const recs = sample.recommendations;
  if (!recs.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <div className={home.avtPile} aria-hidden="true">
          <div className={home.avtPileChips}>
            {recs.map((r) => <ThreadChip key={r.name} avatar={r.avatar} name={r.name} />)}
          </div>
          <span className={`${home.secNote} ${home.avtCount}`}>{recs.length} recommendations</span>
        </div>
      </div>
      <ul className={home.avtStack}>
        {recs.map((r, i) => (
          <li key={r.name} className={i === 0 ? `${home.avtItem} ${home.avtLead}` : home.avtItem}>
            <ThreadChip avatar={r.avatar} name={r.name} />
            <figure className={home.avtBody}>
              <figcaption className={home.avtWho}>
                <span className={home.avtName}>{r.name}</span>
                <span className={home.avtTitle}>{r.title}</span>
              </figcaption>
              <blockquote className={home.avtQuote}>{r.quote}</blockquote>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
