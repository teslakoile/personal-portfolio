import { Chips, Row, SectionHead } from "../kit";
import b from "../brand.module.css";
import s from "./sections.module.css";

/**
 * Projects, listed alphabetically with no featured case study (Kyle's call on
 * 2026-10-05). The six entries come from the "Portfolio Redesign" canvas, not
 * from sampleContent.ts, whose `projects` still holds the older bank-centred
 * list. Naming the VSenses client, the Servo role, and the financial site
 * still needs his OK before this ships.
 */

type Project = {
  kind: string;
  year: string;
  name: string;
  lede: string;
  detail: string;
  role: string;
  stack: string[];
  link?: { label: string; href: string };
};

const PROJECTS: Project[] = [
  {
    kind: "AI Agents", year: "2026", name: "Financial Services Site",
    lede: "An advice-document generator for a financial advisory firm.",
    detail: "Turns adviser meeting notes into editable Record of Advice and investor summary documents with Google ADK agents on Vertex AI, with tracked edits and DOCX export.",
    role: "Contributor, web app and agents",
    stack: ["Google ADK", "Vertex AI", "React", "TypeScript", "Firebase"],
  },
  {
    kind: "AI Agents", year: "2026", name: "Flee the Faculty",
    lede: "An educational game where players rescue classmates by explaining school concepts out loud.",
    detail: "The backend builds a classroom from the player's schoolwork, judges spoken explanations with Gemini on Vertex AI, and synthesizes speech.",
    role: "Solo",
    stack: ["FastAPI", "Gemini", "Vertex AI", "Cloud Run", "Unity"],
  },
  {
    kind: "Developer Tool", year: "2026", name: "huly-cli",
    lede: "A Python command-line client for Huly workspaces, published on PyPI.",
    detail: "Creates, reads, updates, and deletes issues, documents, components, milestones, and labels from the terminal.",
    role: "Solo",
    stack: ["Python", "PyPI"],
    link: { label: "PyPI", href: "https://pypi.org/project/huly-cli/" },
  },
  {
    kind: "Product", year: "2026", name: "Servo Platform",
    lede: "A hospital information system for the Philippine market, set up as a clinic or a 30 to 50 bed hospital.",
    detail: "Covers registration, scheduling, clinical notes, pharmacy inventory, PhilHealth-ready billing, and accounting on a FHIR R4 data model. Its AI assistants never write to a record without staff confirmation.",
    role: "Technical lead, architecture and build",
    stack: ["FastAPI", "PostgreSQL", "Next.js", "Terraform", "AWS"],
  },
  {
    kind: "Product", year: "2026", name: "VSenses",
    lede: "An operations platform that replaced a Davao City spa's Google Sheets workflow.",
    detail: "Bed-by-time booking with double-booking prevention, digital intake forms, therapist commissions, an end-of-day cash wizard, and a public booking page.",
    role: "Solo",
    stack: ["FastAPI", "PostgreSQL", "Next.js", "Terraform", "GCP"],
  },
  {
    kind: "Product", year: "2026", name: "Wishlist",
    lede: "A gift-list app with a Chrome extension and a hosted MCP server.",
    detail: "The extension reads product pages into a list, and the MCP server lets Claude, ChatGPT, or Codex read and update it.",
    role: "Solo",
    stack: ["Next.js", "FastAPI", "PostgreSQL", "MCP", "GCP"],
    link: { label: "wishlist.fit", href: "https://wishlist.fit" },
  },
];

function Card({ p }: { p: Project }) {
  return (
    <article style={{ display: "flex", flexDirection: "column" }}>
      <span className={b.label}>{p.kind} · {p.year}</span>
      <h3 className={`${b.h3} ${s.cardTitle}`}>{p.name}</h3>
      <p className={s.lede}>{p.lede}</p>
      <p className={s.desc}>{p.detail}</p>
      <span className={s.role}>{p.role}</span>
      <div className={s.chipGap}><Chips items={p.stack} logos /></div>
      {p.link ? <a className={s.ext} href={p.link.href} target="_blank" rel="noreferrer">{p.link.label} <span aria-hidden="true">↗</span></a> : null}
    </article>
  );
}

export function Projects({ num }: { num?: string }) {
  const sorted = [...PROJECTS].sort((a, c) => a.name.localeCompare(c.name, "en", { sensitivity: "base" }));
  return (
    <Row id="projects">
      <SectionHead num={num} title="Projects" />
      <div className={s.grid}>{sorted.slice(0, 3).map((p) => <Card key={p.name} p={p} />)}</div>
      <div className={s.grid}>{sorted.slice(3).map((p) => <Card key={p.name} p={p} />)}</div>
    </Row>
  );
}
