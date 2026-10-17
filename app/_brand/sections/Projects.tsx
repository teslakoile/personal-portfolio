import { ArrowUpRight, FileText } from "lucide-react";
import { Chips, Row, SectionHead } from "../kit";
import { describe } from "../chipNotes";
import b from "../brand.module.css";
import s from "./sections.module.css";
import { PROJECTS, type Project, type ProjectKind } from "./projectsData";

/** Projects, alphabetical with no featured case study. The entries live in
    projectsData.ts. Each card leads with the project's mark in a tile (its own
    logo where it has one, a document icon for the Financial Services Site),
    its name, and its kind as a rounded tag with a colour key, a different
    shape from the dashed stack chips. Then what it does, the engineering
    behind it, its stack, and links for the public ones. */

const KIND_KEY: Record<ProjectKind, string> = {
  Product: "var(--b1)", "AI Agents": "var(--b2)", "Developer Tool": "var(--b3)", Game: "var(--b4)",
};

function Mark({ p }: { p: Project }) {
  return (
    <span className={s.projMark} data-fill={p.markFill ? "" : undefined} aria-hidden="true">
      {p.mark
        /* eslint-disable-next-line @next/next/no-img-element */
        ? <img src={`/projects/marks/${p.mark}`} alt="" />
        : <FileText size={20} strokeWidth={1.7} />}
    </span>
  );
}

function Card({ p }: { p: Project }) {
  return (
    <article className={s.project}>
      <div className={s.projHead}>
        <Mark p={p} />
        <div className={s.projTitle}>
          <h3 className={b.h3}>{p.name}</h3>
          <span className={s.kind}><i style={{ background: KIND_KEY[p.kind] }} aria-hidden="true" />{p.kind}</span>
        </div>
      </div>
      <p className={s.lede}>{p.about}</p>
      <p className={s.desc}>{p.tech}</p>
      <div className={s.chipGap}><Chips items={p.stack} logos notes={describe(p.stack)} /></div>
      {p.links?.length ? (
        <div className={s.extRow}>
          {p.links.map((l) => (
            <a key={l.href} className={s.ext} href={l.href} target="_blank" rel="noreferrer"><ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" />{l.label}</a>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function Projects({ num }: { num?: string }) {
  const sorted = [...PROJECTS].sort((a, c) => a.name.localeCompare(c.name, "en", { sensitivity: "base" }));
  return (
    <Row id="projects">
      <SectionHead num={num} title="Projects" />
      <div className={`${s.grid} ${s.projGrid}`}>{sorted.map((p) => <Card key={p.name} p={p} />)}</div>
    </Row>
  );
}
