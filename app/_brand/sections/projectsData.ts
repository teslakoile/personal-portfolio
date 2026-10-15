/**
 * The six projects, listed alphabetically on the page with no featured case
 * study (Kyle's call on 2026-10-05). They come from the "Portfolio Redesign"
 * canvas, not from sampleContent.ts, whose `projects` still holds the older
 * bank-centred list. Naming the VSenses client, the Servo role, and the
 * financial site still needs his OK before this ships.
 */

export type Project = {
  kind: string;
  year: string;
  name: string;
  lede: string;
  detail: string;
  role: string;
  stack: string[];
  link?: { label: string; href: string };
};

export const PROJECTS: Project[] = [
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
