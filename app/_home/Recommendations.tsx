import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";

/**
 * Recommendations treatments. The LANDING design is `RecommendationsMosaic`
 * (option N, further down): staggered ghost-card masonry, settled after the
 * /samples/rework/recommendations comparison. Data comes from
 * sampleContent.ts (`recommendations`, currently MOCK entries for layout
 * preview); every treatment renders nothing when the list is empty, so
 * clearing the mocks hides the section. Everything else in this file is an
 * alternate kept for the comparison page.
 *
 * `Recommendations` below is option A, the original three-card row.
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
              <WhoLink href={r.href} className={home.recsName} name={r.name} />
              <span className={home.recsTitle}>{r.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment, reference ledger: attribution rail on the left
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
              <WhoLink href={r.href} className={home.refName} name={r.name} />
              <span className={home.refTitle}>{r.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment, blurb wall: book-front-matter run-in paragraphs.
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
            <WhoLink href={r.href} className={home.blurbWho} name={r.name} />
            <span className={home.blurbRole}>, {r.title}. </span>
            <span className={home.blurbQuote}>{r.quote}</span>
          </p>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment, single-column pull-quote stack: serif quotes with a
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
              <WhoLink href={r.href} className={home.pqName} name={r.name} />
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

/** Renders the recommender's name, as a link to `href` (their LinkedIn
    profile) when it is set. Source-linked attribution is the one pattern
    every credible testimonial section shares, so all treatments route
    through this. */
export function WhoLink({ href, className, name }: { href?: string | null; className: string; name: string }) {
  return href ? (
    <a className={`${home.whoLink} ${className}`} href={href} target="_blank" rel="noreferrer">{name}</a>
  ) : (
    <span className={className}>{name}</span>
  );
}

export const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

/** Alternative treatment, speech bubbles: tinted "received message" bubbles
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
                <WhoLink href={r.href} className={home.voxName} name={r.name} />
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

/** Alternative treatment, attribution thread: an avatar-spined log where
    who-said-it leads and the quote follows; a facepile + count sit in the
    section head row. No bubbles, no tails, a maintained record, not a chat. */
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
                <WhoLink href={r.href} className={home.avtName} name={r.name} />
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

/* ------------------------------------------------------------------------- */
/* Artifact-led treatments (options G/H/J; the interactive I lives in
   RecommendationsStage.tsx because it needs "use client"). */

/** Shared profile chip for G/H/J: circular, initials while `avatar` is null,
    photo drops in unchanged. Size comes from the per-treatment class. */
function Pfp({ avatar, name, className }: { avatar?: string | null; name: string; className: string }) {
  return (
    <span className={className}>
      {avatar
        ? <img src={avatar} alt="" />
        : <span className={home.pfpInitials} aria-hidden="true">{initialsOf(name)}</span>}
    </span>
  );
}

/** Alternative treatment, reference letters: three paper sheets fanned a
    degree or two off square, a mono "Re: Kyle Naranjo" letterhead line up
    top, the recommendation as letter body (no quote marks, letters don't
    quote themselves), and a signature block over a short coral pen rule
    pinned to the foot. Hover squares and lifts the sheet, the same paper
    physics as the case files. */
export function RecommendationsLetters() {
  if (!sample.recommendations.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.lttRow}>
        {sample.recommendations.map((r) => (
          <figure key={r.name} className={home.lttSheet}>
            <span className={home.lttRe} aria-hidden="true">Re: Kyle Naranjo</span>
            <blockquote className={home.lttQuote}>{r.quote}</blockquote>
            <figcaption className={home.lttSign}>
              <span className={home.lttSignRow}>
                <Pfp avatar={r.avatar} name={r.name} className={`${home.pfp} ${home.pfpLtt}`} />
                <span className={home.lttId}>
                  <WhoLink href={r.href} className={home.lttName} name={r.name} />
                  <span className={home.lttTitle}>{r.title}</span>
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Splits `quote` around its `highlight` phrase for the margin-notes
    treatment; null when the phrase is missing so the quote renders unmarked. */
const splitHighlight = (
  quote: string,
  highlight?: string | null,
): [string, string, string] | null => {
  if (!highlight) return null;
  const at = quote.indexOf(highlight);
  if (at < 0) return null;
  return [quote.slice(0, at), highlight, quote.slice(at + highlight.length)];
};

/** Alternative treatment, margin notes: the quote runs as manuscript text
    with its load-bearing phrase held in a coral wash, and the recommender
    sits in the right margin as a doc-review comment chip, caret aimed at the
    text it annotates. Hover deepens the wash and lifts the chip. */
export function RecommendationsMarginNotes() {
  if (!sample.recommendations.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.mgn}>
        {sample.recommendations.map((r) => {
          const parts = splitHighlight(r.quote, r.highlight);
          return (
            <figure key={r.name} className={home.mgnRow}>
              <blockquote className={home.mgnQuote}>
                {parts ? (
                  <>
                    {parts[0]}
                    <mark className={home.mgnMark}>{parts[1]}</mark>
                    {parts[2]}
                  </>
                ) : (
                  r.quote
                )}
              </blockquote>
              <figcaption className={home.mgnNote}>
                <Pfp avatar={r.avatar} name={r.name} className={`${home.pfp} ${home.pfpMgn}`} />
                <span className={home.mgnId}>
                  <WhoLink href={r.href} className={home.mgnName} name={r.name} />
                  <span className={home.mgnTitle}>{r.title}</span>
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

type Rec = (typeof sample.recommendations)[number];

function MosCard({ r }: { r: Rec }) {
  return (
    <figure className={home.mosCard}>
      <figcaption className={home.mosWho}>
        <Pfp avatar={r.avatar} name={r.name} className={`${home.pfp} ${home.pfpMos}`} />
        <span className={home.mosId}>
          <WhoLink href={r.href} className={home.mosName} name={r.name} />
          <span className={home.mosRole}>{r.title}</span>
        </span>
      </figcaption>
      <blockquote className={home.mosQuote}>{r.quote}</blockquote>
      {r.href ? (
        <a className={home.mosVia} href={r.href} target="_blank" rel="noreferrer">
          via LinkedIn <span className={home.mosViaArrow} aria-hidden="true">↗</span>
        </a>
      ) : null}
    </figure>
  );
}

/** Skeleton stand-in for a recommendation card: same anatomy (chip, name
    and role bars, quote bars), no words, dissolving toward `fade` as if the
    wall continues past the frame. Decoration only, hidden from readers. */
function MosGhost({ lines, fade = "up" }: { lines: number; fade?: "up" | "down" }) {
  return (
    <div
      className={`${home.mosGhost} ${fade === "up" ? home.mosGhostUp : home.mosGhostDown}`}
      aria-hidden="true"
    >
      <span className={home.mosGhostHead}>
        <span className={home.mosGhostChip} />
        <span className={home.mosGhostId}>
          <span className={home.mosGhostName} />
          <span className={home.mosGhostRole} />
        </span>
      </span>
      <span className={home.mosGhostBody}>
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className={home.mosGhostBar} />
        ))}
      </span>
    </div>
  );
}

/** Alternative treatment, mosaic (the research pick): staggered masonry
    where the stagger is CAUSED by content. Quotes deal round-robin into
    three column stacks; the left and right quote cards share the same top
    line, and only the middle column drops behind a GHOST card (same card
    anatomy, skeleton bars, fading at the edge), so the composition is a
    deliberate V rather than an arbitrary scatter. Ghosts also close the
    outer columns at the bottom, and the one under the left column is the
    recommendation not yet written: the "Write One on LinkedIn" pill floats
    on it. On phones the ghosts drop and the invite moves to the end of the
    single column. */
export function RecommendationsMosaic() {
  const recs = sample.recommendations;
  if (!recs.length) return null;
  const linkedin = sample.contacts.find((c) => c.label === "LinkedIn");
  const cols: Rec[][] = [[], [], []];
  recs.forEach((r, i) => cols[i % 3].push(r));
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.mos}>
        <div className={home.mosCol}>
          {cols[0].map((r) => <MosCard key={r.name} r={r} />)}
          {linkedin ? (
            <div className={home.mosInvite}>
              <MosGhost lines={2} fade="down" />
              <a className={home.mosInviteLink} href={linkedin.href} target="_blank" rel="noreferrer">
                <span className={home.mosInvitePill}>
                  Write One on LinkedIn
                  <span className={home.mosViaArrow} aria-hidden="true">↗</span>
                </span>
              </a>
            </div>
          ) : null}
        </div>
        <div className={home.mosCol}>
          <MosGhost lines={3} />
          {cols[1].map((r) => <MosCard key={r.name} r={r} />)}
        </div>
        <div className={home.mosCol}>
          {cols[2].map((r) => <MosCard key={r.name} r={r} />)}
          <MosGhost lines={2} fade="down" />
        </div>
      </div>
    </section>
  );
}

/** Deterministic 7-hex short hash for the commit-log treatment (FNV-1a). */
const shortHash = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").slice(0, 7);
};

/* ------------------------------------------------------------------------- */
/* Shaped treatments (options K/L/M): the container IS the idea, a comic
   balloon, an OS dialog, a chat window. */

/** Alternative treatment, comic balloons: each quote sits in a proper speech
    balloon, ink-outlined with a pointed tail aimed at the speaker below, and
    a halftone dot-grid shadow offset behind it (the hero portrait's print
    grammar). Hover lifts the balloon off its dots. */
export function RecommendationsComic() {
  if (!sample.recommendations.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.kom}>
        {sample.recommendations.map((r) => (
          <figure key={r.name} className={home.komItem}>
            <blockquote className={home.komBalloon}>
              <p className={home.komQuote}>{r.quote}</p>
            </blockquote>
            <figcaption className={home.komWho}>
              <Pfp avatar={r.avatar} name={r.name} className={`${home.pfp} ${home.pfpKom}`} />
              <span className={home.komId}>
                <WhoLink href={r.href} className={home.komName} name={r.name} />
                <span className={home.komRole}>{r.title}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment, dialog boxes: each recommendation is an OS dialog,
    title bar with window lights (the close light is the coral gesture) and a
    mono filename, the quote as the dialog message, and a footer with the
    speaker on the left and a deadpan OK button on the right. The three
    windows cascade like a desktop. */
export function RecommendationsDialogs() {
  if (!sample.recommendations.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.dlgRow}>
        {sample.recommendations.map((r, i) => (
          <figure key={r.name} className={home.dlg}>
            <span className={home.dlgBar} aria-hidden="true">
              <span className={`${home.dlgDot} ${home.dlgDotClose}`} />
              <span className={home.dlgDot} />
              <span className={home.dlgDot} />
              <span className={home.dlgTitle}>recommendation_{String(i + 1).padStart(2, "0")}.txt</span>
            </span>
            <blockquote className={home.dlgQuote}>{r.quote}</blockquote>
            <figcaption className={home.dlgFoot}>
              <span className={home.dlgWho}>
                <Pfp avatar={r.avatar} name={r.name} className={`${home.pfp} ${home.pfpDlg}`} />
                <span className={home.dlgId}>
                  <WhoLink href={r.href} className={home.dlgName} name={r.name} />
                  <span className={home.dlgRole}>{r.title}</span>
                </span>
              </span>
              <span className={home.dlgOk} aria-hidden="true">OK</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Alternative treatment, chat window: one app window holds the whole
    section, a title bar with window lights and a mono #channel name, message
    rows (avatar, name, role, text) that highlight on hover, and a footer
    where the message input would be that instead invites a new
    recommendation on LinkedIn. */
export function RecommendationsChat() {
  if (!sample.recommendations.length) return null;
  const linkedin = sample.contacts.find((c) => c.label === "LinkedIn");
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.chw}>
        <span className={home.chwBar} aria-hidden="true">
          <span className={home.dlgDot} />
          <span className={home.dlgDot} />
          <span className={home.dlgDot} />
          <span className={home.chwTitle}>#what-teammates-say</span>
        </span>
        <div className={home.chwList}>
          {sample.recommendations.map((r) => (
            <figure key={r.name} className={home.chwMsg}>
              <Pfp avatar={r.avatar} name={r.name} className={`${home.pfp} ${home.pfpChw}`} />
              <span className={home.chwBody}>
                <figcaption className={home.chwWho}>
                  <WhoLink href={r.href} className={home.chwName} name={r.name} />
                  <span className={home.chwRole}>{r.title}</span>
                </figcaption>
                <blockquote className={home.chwText}>{r.quote}</blockquote>
              </span>
            </figure>
          ))}
        </div>
        {linkedin ? (
          <a className={home.chwFoot} href={linkedin.href} target="_blank" rel="noreferrer">
            <span className={home.chwPrompt}>Write One on LinkedIn</span>
            <span className={home.chwArrow} aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}

/** Alternative treatment, commit log: each recommendation formatted as git
    log output, coral mono short-hash then author, the quote indented below
    as the commit message. A faint `$ git log` command line opens the block;
    pairs with the contributions graph two sections up. */
export function RecommendationsLog() {
  if (!sample.recommendations.length) return null;
  return (
    <section className={styles.section} aria-label="Recommendations">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Recommendations</h2>
        <span className={home.secNote}>What Teammates Say</span>
      </div>
      <div className={home.gitLog}>
        <p className={home.gitCmd} aria-hidden="true">git log --author=teammates</p>
        {sample.recommendations.map((r) => (
          <figure key={r.name} className={home.gitEntry}>
            <figcaption className={home.gitMeta}>
              <span className={home.gitHash} aria-hidden="true">{shortHash(r.name + r.title)}</span>
              <Pfp avatar={r.avatar} name={r.name} className={`${home.pfp} ${home.pfpGit}`} />
              <WhoLink href={r.href} className={home.gitName} name={r.name} />
              <span className={home.gitRole}>{r.title}</span>
            </figcaption>
            <blockquote className={home.gitQuote}>{r.quote}</blockquote>
          </figure>
        ))}
      </div>
    </section>
  );
}
