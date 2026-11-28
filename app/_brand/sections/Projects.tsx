import type { CSSProperties } from "react";
import { Chips, Row, SectionHead } from "../kit";
import { describe } from "../chipNotes";
import b from "../brand.module.css";
import s from "./sections.module.css";
import { PROJECTS, type Project } from "./projectsData";
import { LinkIcon, linkKind } from "../linkIcons";

/** Projects, in the order of projectsData.ts. Each card leads with the
    project's mark in a tile beside its name, with links to the live site or repo under the name for
    the public ones. Then two short paragraphs in one style (what it does, the
    engineering behind it), its tags as rounded pills, and its stack as the
    dashed tool chips. */

function Mark({ p }: { p: Project }) {
  return (
    <span className={s.projMark} data-fill={p.markFill ? "" : undefined} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/projects/marks/${p.mark}`} alt="" />
    </span>
  );
}

/* Covers (SitePage option "covers", on the landing page since 2026-11-28 and
   switchable at /samples/polished/options). Two sets on the same
   grounds: COVERS_REDESIGN is the one shown, picked by Kyle on 2026-11-28, and
   COVERS is the earlier set, kept as the fallback (option "fallback").
   The standard, from
   Kyle's reference and notes (2026-11-27): a ground of a few soft, clearly
   separate shapes, and on it the one screen that best represents the product,
   centred, with clear ground on every side. Nothing overlaps another piece or
   is cut by the tile, and nothing floats loose beside the main piece.
     Zervo             the Zervo AI panel answering from live hospital data, with its sources
     VSenses           the bed grid, the booking board the spa runs on
     Wishlist          Kyle's own public page: his profile card over his list of items
     Leafmark          the extension's popup under the toolbar button it opens from
     Flee the Faculty  the students-helped count, a line the player says, and AraBOT's reply
     huly-cli          `huly --help` in a terminal window
   Every piece comes from the product as it is now, never from a marketing
   demo with stock photos, and is then tidied once for a thumbnail: fewer
   rows, no truncated text, larger type (Kyle, 2026-11-27). The tidying keeps
   each product's own markup and styles and changes only what is shown.
   Zervo's panel and the VSenses bed grid are redrawn from each product's
   current markup, styles, and strings (output/zervo-capture.mjs,
   output/vsenses-capture.mjs) with made-up records: Zervo's last docs
   screenshot predates its rename from Servo, and the VSenses one truncated
   every card.
   Wishlist is the live page app.wishlist.fit/kyle, signed out, in list view,
   with the changes listed at the top of output/wl-demo.mjs. Leafmark's popup
   is the extension's own page with its demo data, staged from the current
   extension folder; the toolbar strip above it is a plain mock.
   huly-cli is the tool's real output. Flee the Faculty is a mock drawn for
   this page: the lines are the game's own strings and the classmates, mic,
   and check are its own sprites, but the cards are not the game's UI.
   `w` is the column's width as a percent of the tile's, `wn` the same on a
   narrow tile (three across, or a phone). The CSS sizes it from the tile's
   height, so a tile that is a little narrower than 16:10 keeps the same piece. A `flat` piece carries its own corners and
   takes its shadow from its outline. Each image is exported at the exact
   pixel width it shows at on a 467px tile at 2x, so the browser does not
   rescale it there. `tone` shows while the ground loads. Grounds come from
   scripts/covers/grounds.py; a ground's colour is chosen to set off the UI, not
   to repeat the product's own colour.

   COVERS_REDESIGN is the set shown. The fallback set scales a full-size screen down to the tile, so its text shows
   at about 7px. This set redraws one feature of each product at the size of
   the tile, with fewer and larger elements (Kyle, 2026-11-28: "feel free to
   even redesign"). Fonts, colours, marks, and strings are each product's own;
   the layouts are new and the records are made up. The flat pieces are
   lossless WebP, so small coloured text keeps its edges.
     Zervo             the card that asks before the assistant changes a record, with the old and new value
     VSenses           the bed grid with three lines a booking: guest, service, length
     Wishlist          Kyle's profile row over three of his items as photo tiles with Reserve buttons
     Leafmark          the popup's folder suggestions as rows with their scores
     Flee the Faculty  a classmate's wrong idea, the player's spoken answer, the classmate's reply
     huly-cli          `huly issues list` with three of its five columns
   Each has a second drawing for a narrow tile (`narrow`, three across or a
   phone), with fewer elements at the same type size.
   Sources: scripts/covers/pieces.html, and scripts/covers/wishlist-live.mjs,
   which lists what differs from Kyle's real list. `w` is also the width
   scripts/covers/export.py saves each file at, so change it here and export
   again. To add a project's cover: .claude/skills/project-cover/SKILL.md.

   The fallback set's sources are local only (output/, gitignored). */
type Piece = { file: string; /** the same feature drawn for a narrow tile */ narrow?: string; /** the image carries its own corners; "wide" when only the wide drawing does */ flat?: boolean | "wide" };
type Cover = { ground: string; tone: string; w: number; wn: number; pieces: Piece[] };
const COVERS: Record<string, Cover> = {
  Zervo: { ground: "zervo", tone: "#5a9cf0", w: 54, wn: 78, pieces: [{ file: "zervo-ai", narrow: "zervo-ai-short" }] },
  VSenses: { ground: "vsenses", tone: "#ee8b55", w: 72, wn: 84, pieces: [{ file: "vsenses-grid" }] },
  Wishlist: { ground: "wishlist", tone: "#7fb99a", w: 72, wn: 84, pieces: [{ file: "wishlist-profile" }, { file: "wishlist-table" }] },
  Leafmark: { ground: "leafmark", tone: "#8a78d6", w: 46, wn: 48, pieces: [{ file: "leafmark-popup", flat: true }] },
  "Flee the Faculty": { ground: "flee-the-faculty", tone: "#4fc0dc", w: 68, wn: 84, pieces: [{ file: "flee-cards", flat: true }] },
  "huly-cli": { ground: "huly-cli", tone: "#f39a3a", w: 56, wn: 58, pieces: [{ file: "huly-terminal" }] },
};

const COVERS_REDESIGN: Record<string, Cover> = {
  Zervo: { ground: "zervo", tone: "#5a9cf0", w: 58, wn: 81, pieces: [{ file: "r-zervo", narrow: "r-zervo-n" }] },
  VSenses: { ground: "vsenses", tone: "#ee8b55", w: 76, wn: 79, pieces: [{ file: "r-vsenses", narrow: "r-vsenses-n" }] },
  Wishlist: { ground: "wishlist", tone: "#7fb99a", w: 72, wn: 79, pieces: [{ file: "r-wishlist", narrow: "r-wishlist-n" }] },
  Leafmark: { ground: "leafmark", tone: "#8a78d6", w: 56, wn: 81, pieces: [{ file: "r-leafmark", narrow: "r-leafmark-n", flat: "wide" }] },
  "Flee the Faculty": { ground: "flee-the-faculty", tone: "#4fc0dc", w: 64, wn: 82, pieces: [{ file: "r-flee", narrow: "r-flee-n" }] },
  "huly-cli": { ground: "huly-cli", tone: "#f39a3a", w: 72, wn: 82, pieces: [{ file: "r-huly", narrow: "r-huly-n" }] },
};
export type CoverSet = "redesign" | "fallback";

/** "app.zervo.tech" as "zervo.tech": a site link's label when it would repeat the card's title. */
const host = (href: string) => new URL(href).hostname.replace(/^(app|www)\./, "");

function Card({ p, cover, coverSet, hostLabels }: { p: Project; cover: boolean; coverSet: CoverSet; hostLabels: boolean }) {
  const shot = (coverSet === "fallback" ? COVERS : COVERS_REDESIGN)[p.name];
  return (
    <article className={s.project}>
      {cover && shot ? (
        <div className={s.projCover} role="img" aria-label={`${p.name} preview`} style={{ "--c": shot.tone, backgroundImage: `url(/projects/covers/bg-${shot.ground}.webp)` } as CSSProperties}>
          <div className={s.coverStack} style={{ "--w": shot.w, "--wn": shot.wn } as CSSProperties}>
            {shot.pieces.flatMap((x) => [x.file, x.narrow].map((file, n) => (file ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={file} data-on={x.narrow ? (n ? "narrow" : "wide") : undefined} data-flat={x.flat === true || (x.flat === "wide" && n === 0) ? "" : undefined} src={`/projects/covers/${file}.webp`} alt="" loading="lazy" />
            ) : null)))}
          </div>
        </div>
      ) : null}
      <div className={s.projHead}>
        <Mark p={p} />
        <div className={s.projTitle}>
          <h3 className={b.h3}>{p.name}</h3>
          {p.links?.length ? (
            <div className={s.projLinks}>
              {p.links.map((l) => (
                <a key={l.href} className={s.projLink} href={l.href} target="_blank" rel="noreferrer">
                  <LinkIcon kind={linkKind(l.href)} size={14} favicon={`/projects/marks/${p.mark}`} /><span>{hostLabels && l.label === p.name ? host(l.href) : l.label}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <ul className={s.tags}>{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
      <div>
        <div className={s.projBody}>
          <p>{p.about}</p>
          <p>{p.tech}</p>
        </div>
        <div className={s.cardTools}><Chips items={p.stack} logos notes={describe(p.stack)} /></div>
      </div>
    </article>
  );
}

export function Projects({ num, covers = false, coverSet = "redesign", hostLabels = false }: { num?: string; /** a cover image on each card */ covers?: boolean; /** which set of covers: each UI redrawn for the tile, or the earlier scaled-down screens */ coverSet?: CoverSet; /** a site link shows its host name in place of the project's name */ hostLabels?: boolean }) {
  return (
    <Row id="projects">
      <SectionHead num={num} title="Projects" />
      <div className={`${s.grid} ${s.projGrid}`}>{PROJECTS.map((p) => <Card key={p.name} p={p} cover={covers} coverSet={coverSet} hostLabels={hostLabels} />)}</div>
    </Row>
  );
}
