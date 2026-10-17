import { ArrowUpRight } from "lucide-react";
import { Chips, Row, SectionHead } from "../kit";
import { describe } from "../chipNotes";
import b from "../brand.module.css";
import s from "./sections.module.css";
import { PROJECTS, type Project } from "./projectsData";

/** Projects, alphabetical with no featured case study. The entries live in
    projectsData.ts. */

function Card({ p }: { p: Project }) {
  return (
    <article className={s.project}>
      <span className={b.label}>{p.kind} · {p.year}</span>
      <h3 className={`${b.h3} ${s.cardTitle}`}>{p.name}</h3>
      <p className={s.lede}>{p.lede}</p>
      <p className={s.desc}>{p.detail}</p>
      <span className={s.role}>{p.role}</span>
      <div className={s.chipGap}><Chips items={p.stack} logos notes={describe(p.stack)} /></div>
      {p.link ? <a className={s.ext} href={p.link.href} target="_blank" rel="noreferrer"><ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" />{p.link.label}</a> : null}
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
