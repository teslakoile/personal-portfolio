import { ArrowUpRight } from "lucide-react";
import { Chips } from "../../_brand/kit";
import { describe } from "../../_brand/chipNotes";
import b from "../../_brand/brand.module.css";
import s from "../../_brand/sections/sections.module.css";
import o from "./options.module.css";
import { PROJECTS, type Project } from "../../_brand/sections/projectsData";
import { LinkIcon, linkKind } from "../../_brand/linkIcons";

/*
 * Options for the project cards' links and tags, on real cards (Wishlist,
 * huly-cli, Servo: three links, two, and one). Each link option keeps the
 * shipped tags (L1 is what ships); each tag option keeps the shipped links
 * (T1 is what ships).
 */

export type LinkOpt = "L1" | "L2" | "L3" | "L4" | "L5";
export type TagOpt = "T1" | "T2" | "T3" | "T4" | "T5";

export const LINK_OPTS: [LinkOpt, string, string][] = [
  ["L1", "Coral Text Links (Current)", "Coral label with an arrow, under the title."],
  ["L2", "Outlined Buttons", "Rounded outlined buttons with the destination's icon, under the title; coral edge on hover."],
  ["L3", "Icon Buttons", "Square icon buttons at the top right of the card, named on hover; the title stands alone."],
  ["L4", "Ink Links With Icons", "Dark text with the destination's icon, under the title; coral underline on hover."],
  ["L5", "Footer Row", "Links at the bottom of the card above a rule, with icons and arrows, so the head is only logo and name."],
];

export const TAG_OPTS: [TagOpt, string, string][] = [
  ["T1", "Filled Warm Grey (Current)", "Warm-grey pills, no edge."],
  ["T2", "Dark Pills", "Ink pills with white text, the strongest contrast with the white tool chips."],
  ["T3", "Plain Text", "No chip at all: the tags as one grey line, joined by middots."],
  ["T4", "Tinted By Tag", "Each tag tinted with one of the brand's data colours, the same tag always the same colour."],
  ["T5", "Square Labels", "Small square-cornered labels in a light fill with heavier text, closer to a category label than a chip."],
];

const SHOWN = ["Wishlist", "huly-cli", "Servo"].map((n) => PROJECTS.find((p) => p.name === n)!);

/** The brand's data colours as tag tints: light fill, dark text in the same hue. */
const TINTS = [
  ["#fde3dc", "#9e2a16"], ["#dcefe4", "#2f6b4f"], ["#dfe9f3", "#2c4a66"], ["#fbefd6", "#7a4e0c"],
];
const tint = (t: string) => {
  let h = 0;
  for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
};

function Mark({ p }: { p: Project }) {
  return (
    <span className={s.projMark} data-fill={p.markFill ? "" : undefined} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/projects/marks/${p.mark}`} alt="" />
    </span>
  );
}

function Links({ p, opt }: { p: Project; opt: LinkOpt }) {
  if (!p.links?.length) return null;
  if (opt === "L1") {
    return <div className={s.projLinks}>{p.links.map((l) => <a key={l.href} className={s.ext} href={l.href} target="_blank" rel="noreferrer"><ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />{l.label}</a>)}</div>;
  }
  if (opt === "L2") {
    return <div className={o.btnRow}>{p.links.map((l) => <a key={l.href} className={o.btn} href={l.href} target="_blank" rel="noreferrer"><LinkIcon kind={linkKind(l.href)} size={14} />{l.label}</a>)}</div>;
  }
  if (opt === "L3") {
    return <div className={o.iconRow}>{p.links.map((l) => <a key={l.href} className={o.iconBtn} href={l.href} target="_blank" rel="noreferrer" aria-label={l.label} data-tip={l.label}><LinkIcon kind={linkKind(l.href)} size={16} /></a>)}</div>;
  }
  if (opt === "L4") {
    return <div className={o.inkRow}>{p.links.map((l) => <a key={l.href} className={o.ink} href={l.href} target="_blank" rel="noreferrer"><LinkIcon kind={linkKind(l.href)} size={14} /><span>{l.label}</span></a>)}</div>;
  }
  return <div className={o.foot}>{p.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noreferrer"><LinkIcon kind={linkKind(l.href)} size={14} /><span>{l.label}</span><ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" /></a>)}</div>;
}

function Tags({ p, opt }: { p: Project; opt: TagOpt }) {
  if (opt === "T1") return <ul className={s.tags}>{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>;
  if (opt === "T3") return <p className={o.tagText}>{p.tags.join(" · ")}</p>;
  if (opt === "T4") {
    return <ul className={o.tags}>{p.tags.map((t) => { const [bg, fg] = tint(t); return <li key={t} className={o.tagTint} style={{ background: bg, color: fg }}>{t}</li>; })}</ul>;
  }
  return <ul className={o.tags}>{p.tags.map((t) => <li key={t} className={opt === "T2" ? o.tagDark : o.tagSquare}>{t}</li>)}</ul>;
}

function Card({ p, link, tag }: { p: Project; link: LinkOpt; tag: TagOpt }) {
  const head = link === "L3" || link === "L5";
  return (
    <article className={`${s.project} ${o.card}`}>
      <div className={s.projHead}>
        <Mark p={p} />
        <div className={s.projTitle}>
          <h3 className={b.h3}>{p.name}</h3>
          {head ? null : <Links p={p} opt={link} />}
        </div>
        {link === "L3" ? <Links p={p} opt="L3" /> : null}
      </div>
      <div className={s.projBody}><p>{p.about}</p><p>{p.tech}</p></div>
      <Tags p={p} opt={tag} />
      <div className={s.cardTools}><Chips items={p.stack} logos notes={describe(p.stack)} /></div>
      {link === "L5" ? <Links p={p} opt="L5" /> : null}
    </article>
  );
}

export function OptionRow({ id, name, note, link = "L1", tag = "T1" }: { id: string; name: string; note: string; link?: LinkOpt; tag?: TagOpt }) {
  return (
    <section id={id} className={o.opt}>
      <header className={o.optHead}><b>{id}. {name}</b><span>{note}</span></header>
      <div className={o.grid}>{SHOWN.map((p) => <Card key={p.name} p={p} link={link} tag={tag} />)}</div>
    </section>
  );
}
