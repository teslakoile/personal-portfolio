import { ArrowUpRight, FileText } from "lucide-react";
import { Chips, Row, SectionHead } from "../kit";
import { describe } from "../chipNotes";
import b from "../brand.module.css";
import s from "./sections.module.css";
import { PROJECTS, type Project } from "./projectsData";

/** Projects, alphabetical with no featured case study. The entries live in
    projectsData.ts. Each card leads with the project's mark in a tile (its own
    logo where it has one, a document icon for the Financial Services Site)
    beside its name, with links to the live site or repo under the name for
    the public ones. Then two short paragraphs in one style (what it does, the
    engineering behind it), its tags as rounded pills, and its stack as the
    dashed tool chips. */

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
          {p.links?.length ? (
            <div className={s.projLinks}>
              {p.links.map((l) => (
                <a key={l.href} className={s.ext} href={l.href} target="_blank" rel="noreferrer"><ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />{l.label}</a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className={s.projBody}>
        <p>{p.about}</p>
        <p>{p.tech}</p>
      </div>
      <ul className={s.tags}>{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
      <div className={s.cardTools}><Chips items={p.stack} logos notes={describe(p.stack)} /></div>
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
