"use client";

import { Fragment, useId, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import home from "./home.module.css";

/**
 * Shared parts of the Case Files baseline (Projects) — per Kyle's spec:
 * every card renders AS-IS (the same card it is when open) and the pile is
 * simply those cards stacked at their slots, occlusion following pile
 * order. A labeled tab row sits along the top edge; hovering a filed tab
 * lifts that whole card straight up as the preview; clicking pulls it to
 * the top. The dossier innards, tab row, filed cards, and rail live here
 * so the baseline island (FileStack) and the variants on
 * /samples/rework/projects all render the same pile.
 */

export type Proj = {
  slug: string;
  flagship?: boolean;
  title: string;
  client: string;
  period: string;
  status: string;
  oneLiner: string;
  metrics: ReadonlyArray<{ value: string; label: string }>;
  links: ReadonlyArray<{ label: string; href: string }>;
};

// Each dossier's stamp: its single strongest claim (Title Case, mono).
// The top file's filled stamp is the section's one static coral moment.
export const STAMPS: Record<string, string> = {
  "single-customer-view": "748,000 Pairs Surfaced",
  "investment-data-platform": "10+ Services Live",
  "document-intelligence": "Cortex Agents Live",
  "student-at-risk": "3 Systems via API",
  "mcp-databricks": "Chat to Lakehouse",
  aicomprehend: "Published in IEEE",
};

export const mod = (n: number, m: number) => ((n % m) + m) % m;

// Hand-placed sprawl: fixed per-depth jitter, in multiples of the base
// step (--sprX/--sprY in CSS). ONE pose per slot, shared by the buried
// sheet, the preview card's rest dock, AND the row tab's stagger (tab ty =
// y·sprY + 2), so a lift is a single continuous motion from exactly the
// state the pile showed — nothing pops or doubles at hover-start. The
// varied x gaps carry the hand-stacked look; `r` is a slight lean the
// folder gains only IN FLIGHT (a static lean would crack the pixel-exact
// tab handoff at rest).
// Slots are FIXED PER INDEX — the pile is always ordered 01..0n top to
// bottom (Kyle's model: leftmost = topmost); opening a file takes it OUT
// of the pile (its slot gaps) and the rest never re-sort.
export const SPRAWL: ReadonlyArray<{ x: number; y: number; r: number }> = [
  { x: 0.45, y: 0.3, r: -0.2 }, // 01's slot (visible only while 01 is filed)
  { x: 1, y: 0.6, r: -0.25 },
  { x: 2.1, y: 1.15, r: 0.3 },
  { x: 3.05, y: 1.65, r: -0.2 },
  { x: 4.15, y: 2.1, r: 0.25 },
  { x: 5.1, y: 2.5, r: -0.3 },
];

// index → the CSS vars that place that slot (clamped to the table's tail)
export const sprawlVars = (i: number): CSSProperties => {
  const s = SPRAWL[Math.min(i, SPRAWL.length - 1)];
  return { "--jx": s.x, "--jy": s.y, "--jr": `${s.r}deg` } as CSSProperties;
};

// the open file sits square on the desk — its tab carries no slot offset
export const zeroVars: CSSProperties = { "--jx": 0, "--jy": 0, "--jr": "0deg" } as CSSProperties;

// index → the fsRise start pose. fsRise (slot pull) uses --d0x/--d0y —
// straight, like the pile at rest; fsRiseUp (pulling the risen preview)
// uses --d0x/--d0r to continue down from the lifted pose.
export const riseOrigin = (i: number): CSSProperties => {
  const s = SPRAWL[Math.min(i, SPRAWL.length - 1)];
  return { "--d0x": s.x, "--d0y": s.y, "--d0r": `${s.r}deg` } as CSSProperties;
};

// Dossier innards. `top` gates real links (dealt/preview clones get inert
// spans so the page never grows duplicate anchors).
export function FileInnards({ p, top }: { p: Proj; top: boolean }) {
  return (
    <>
      <div className={home.fsHead}>
        <div className={home.fsIdent}>
          <h3 className={home.fsTitle}>
            {top
              ? <Link href={`/projects#${p.slug}`} className={home.fsTitleLink}>{p.title}</Link>
              : p.title}
          </h3>
          <p className={home.fsClient}>{p.client}</p>
        </div>
        <span className={home.fsStamp}>{STAMPS[p.slug] ?? p.status}</span>
      </div>
      <p className={home.fsDek}>{p.oneLiner}</p>
      <div className={home.fsShotWell}>
        <figure className={home.fsShot} aria-hidden="true">
          <img src={`/projects/${p.slug}.png`} alt="" loading="lazy" draggable={false} />
        </figure>
      </div>
      {p.metrics.length > 0 && (
        <p className={home.fsLedger}>
          {p.metrics.map((m, j) => (
            <Fragment key={m.label}>
              {j > 0 && <span className={home.fsLedgerSep} aria-hidden="true">·</span>}
              <span><strong>{m.value}</strong> {m.label}</span>
            </Fragment>
          ))}
        </p>
      )}
      <div className={home.fsFoot}>
        {top ? (
          <>
            <Link href={`/projects#${p.slug}`} className={home.fsCase}>
              Read the Full Case <span className={home.fsCaseArrow} aria-hidden="true">→</span>
            </Link>
            {p.links.map((l) => (
              <a key={l.href} href={l.href} className={home.fsExt} target="_blank" rel="noreferrer">
                {l.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </>
        ) : (
          <span className={home.fsCase}>
            Read the Full Case <span className={home.fsCaseArrow} aria-hidden="true">→</span>
          </span>
        )}
        <span className={home.fsMeta}>{p.status} · {p.period}</span>
      </div>
    </>
  );
}

// The drawer index — labeled folder tabs along the pile's top edge, each
// resting 2px above its folder's sheet top (the slot's SPRAWL y), so the
// row reads as the stack; pulls re-settle the stagger around the new top.
// Hovering (or focusing) a filed tab tugs its whole folder via
// `onHover`/`onLeave` (passing the tab's row-slot x): the row tab in
// `raised` hands off to the tab attached to its rising sheet (fsTabUp
// hides it for the duration). Clicking pulls. Each tab carries a visually
// hidden summary (claim + lead metric) so screen readers get the preview
// payoff on focus.
export function FileTabs({ projects, idx, pull, onHover, onLeave, raised, fan, measure }: {
  projects: ReadonlyArray<Proj>;
  idx: number;
  pull: (i: number) => void;
  onHover?: (i: number, tabX?: number) => void;
  onLeave?: () => void;
  raised?: number | null;
  fan?: boolean; // island also fans its open card → the active tab rides along
  measure?: (i: number, left: number, width: number) => void; // row-slot geometry, reported at mount
}) {
  const uid = useId();
  const n = projects.length;
  return (
    <div
      className={raised != null && fan ? `${home.fsTabs} ${home.fsTabsFan}` : home.fsTabs}
      role="tablist"
      aria-label="Project files"
      onPointerLeave={onLeave}
    >
      {projects.map((p, i) => {
        const m = p.metrics[0];
        return (
          <a
            key={p.slug}
            href={`/projects#${p.slug}`}
            ref={measure ? (el) => { if (el) measure(i, el.offsetLeft, el.offsetWidth); } : undefined}
            role="tab"
            aria-selected={i === idx}
            aria-label={p.title}
            aria-describedby={`${uid}-${p.slug}`}
            style={{
              ...(i === idx ? zeroVars : sprawlVars(i)),
              // stack order = index order: 01 in front of 02, 02 in front
              // of 03… (interleaves with the filed cards at 27 − 2i; the
              // open file's tab keeps its class z above them all)
              ...(i === idx ? null : { zIndex: 28 - 2 * i }),
              // fan grade: row distance from the hovered tab (--fdc caps
              // the lean, matching the cards)
              ...(raised != null && i !== raised
                ? { "--fd": Math.abs(i - raised), "--fdc": Math.min(Math.abs(i - raised), 2) }
                : null),
            } as CSSProperties}
            className={[
              home.fsTab,
              i === idx ? home.fsTabOn : "",
              raised === i ? home.fsTabUp : "",
              // the other filed tabs part around a lifted folder, with
              // their cards
              raised != null && i !== raised && i !== idx
                ? (i < raised ? home.fsTabFanL : home.fsTabFanR)
                : "",
            ].filter(Boolean).join(" ")}
            onClick={(e) => { e.preventDefault(); pull(i); }}
            onPointerEnter={onHover ? (e) => onHover(i, e.currentTarget.offsetLeft) : undefined}
            onFocus={onHover ? (e) => onHover(i, e.currentTarget.offsetLeft) : undefined}
            onBlur={onLeave}
          >
            <span className={home.fsTabNum} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <span className={home.fsTabName} aria-hidden="true">{p.title}</span>
            <span id={`${uid}-${p.slug}`} className={home.fsSrOnly}>
              {STAMPS[p.slug] ?? p.status}.{m ? ` ${m.value} ${m.label}.` : ""}
            </span>
          </a>
        );
      })}
    </div>
  );
}

// Filed cards — every filed dossier is the SAME card it is when open,
// rendered as-is (inert innards) and resting in its FIXED index slot,
// interleaved into the index-ordered z ladder with the tabs (27 − 2i vs
// 28 − 2i) so occlusion follows pile order alone. While `tug` points at
// one, the row tab hands off to the tab attached to the card
// (fsUnderTab) and the whole folder rises straight up as the preview;
// risen it's also a click target (`pull`), and hovering it keeps the tug
// alive so the pointer can travel onto it. Always aria-hidden — the tabs
// are the semantic path; their summary spans carry the same payoff for
// screen readers.
export function FileUnders({ projects, idx, tug, tabXs, tabCs, pull, onHover, onLeave }: {
  projects: ReadonlyArray<Proj>;
  idx: number;
  tug?: number | null;
  tabXs?: ReadonlyArray<number | undefined>;
  tabCs?: ReadonlyArray<number | undefined>; // tab centers — each card's fan pivot
  pull?: (i: number) => void;
  onHover?: (i: number) => void;
  onLeave?: () => void;
}) {
  return (
    <>
      {projects.map((p, i) => {
        if (i === idx) return null;
        return (
          <div key={p.slug}
            className={[
              home.fsUnder,
              tug === i ? home.fsUnderUp : "",
              // the pile fans open around a lift, leaning away from it
              tug != null && tug !== i
                ? (i < tug ? home.fsUnderFanL : home.fsUnderFanR)
                : "",
            ].filter(Boolean).join(" ")}
            style={{
              ...sprawlVars(i),
              zIndex: 27 - 2 * i,
              // fan grade: row distance from the hovered tab (--fdc caps
              // the lean so no far card's corner climbs into the head air)
              ...(tug != null && tug !== i
                ? { "--fd": Math.abs(i - tug), "--fdc": Math.min(Math.abs(i - tug), 2) }
                : null),
              // this folder's row-slot x (cached at hover time, kept
              // through the fall so the attached tab never jumps
              // mid-flight); CSS subtracts the card's own offset
              ...(tabXs?.[i] != null ? { "--tabx": `${tabXs[i]}px` } : null),
              // its tab's center — the fan's rotation pivot, shared with
              // the row tab so the pair swings as one object
              ...(tabCs?.[i] != null ? { "--tabc": `${tabCs[i]}px` } : null),
            } as CSSProperties}
            aria-hidden="true"
            onClick={pull ? () => pull(i) : undefined}
            onPointerEnter={onHover ? () => onHover(i) : undefined}
            onPointerLeave={onLeave}
          >
            <span className={home.fsUnderTab}>
              <span className={home.fsTabNum}>{String(i + 1).padStart(2, "0")}</span>
              <span className={home.fsTabName}>{p.title}</span>
            </span>
            <article className={home.fsFile}><FileInnards p={p} top={false} /></article>
          </div>
        );
      })}
    </>
  );
}

// Counter · Next File · hint (plus optional extra control, e.g. a spread
// toggle). The visible counter can tick with a live preview (`previewIdx`,
// muted); announcements come from a hidden live region that only follows
// committed pulls, so previews are never read out.
export function FileRail({ projects, idx, pull, hint, extra, previewIdx }: {
  projects: ReadonlyArray<Proj>;
  idx: number;
  pull: (i: number) => void;
  hint: ReactNode;
  extra?: ReactNode;
  previewIdx?: number | null;
}) {
  const n = projects.length;
  const next = projects[mod(idx + 1, n)];
  const shown = previewIdx ?? idx;
  return (
    <div className={home.fsRail}>
      <span
        className={previewIdx != null ? `${home.fsCount} ${home.fsCountPreview}` : home.fsCount}
        aria-hidden="true"
      >
        {String(shown + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
      </span>
      <span className={home.fsSrOnly} aria-live="polite">
        File {idx + 1} of {n}, {projects[idx].title}
      </span>
      <a href={`/projects#${next.slug}`} className={home.fsNext}
        onClick={(e) => { e.preventDefault(); pull(idx + 1); }}>
        Next File <span aria-hidden="true">→</span>
      </a>
      {extra}
      {hint}
    </div>
  );
}
