/**
 * The six projects, listed alphabetically on the page with no featured case
 * study (Kyle's call on 2026-10-05). They come from the "Portfolio Redesign"
 * canvas, not from sampleContent.ts, whose `projects` still holds the older
 * bank-centred list. Kyle turned the section on on 2026-10-17.
 *
 * Servo Platform, Financial Services Site, and VSenses are private: never give
 * them a link to a repo or source. The others link their live site, package,
 * or public repo.
 *
 * `mark` is the project's own logo from its repo (public/projects/marks), or
 * the platform it is built for (Huly); the Financial Services Site has no mark
 * of its own, so the card shows a document icon instead.
 */

export type Project = {
  kind: string;
  year: string;
  name: string;
  lede: string;
  detail: string;
  role: string;
  stack: string[];
  mark?: string;
  /** the mark is a full app icon that fills its tile, rather than a symbol set inside it */
  markFill?: boolean;
  links?: { label: string; href: string }[];
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
    mark: "flee-the-faculty.png",
    links: [{ label: "Game on GitHub", href: "https://github.com/Uhan7/Flee-the-Faculty" }],
  },
  {
    kind: "Developer Tool", year: "2026", name: "huly-cli",
    lede: "A Python command-line client for Huly workspaces, published on PyPI.",
    detail: "Creates, reads, updates, and deletes issues, documents, components, milestones, and labels from the terminal.",
    role: "Solo",
    stack: ["Python", "PyPI"],
    mark: "huly.svg",
    links: [{ label: "PyPI", href: "https://pypi.org/project/huly-cli/" }, { label: "GitHub", href: "https://github.com/teslakoile/huly-cli" }],
  },
  {
    kind: "Product", year: "2026", name: "Servo Platform",
    lede: "A hospital information system for the Philippine market, set up as a clinic or a 30 to 50 bed hospital.",
    detail: "Covers registration, scheduling, clinical notes, pharmacy inventory, PhilHealth-ready billing, and accounting on a FHIR R4 data model. Its AI assistants never write to a record without staff confirmation.",
    role: "Technical lead, architecture and build",
    stack: ["FastAPI", "PostgreSQL", "Next.js", "Terraform", "AWS"],
    mark: "servo.png", markFill: true,
  },
  {
    kind: "Product", year: "2026", name: "VSenses",
    lede: "An operations platform that replaced a Davao City spa's Google Sheets workflow.",
    detail: "Bed-by-time booking with double-booking prevention, digital intake forms, therapist commissions, an end-of-day cash wizard, and a public booking page.",
    role: "Solo",
    stack: ["FastAPI", "PostgreSQL", "Next.js", "Terraform", "GCP"],
    mark: "vsenses.png",
  },
  {
    kind: "Product", year: "2026", name: "Wishlist",
    lede: "A gift-list app with a Chrome extension and a hosted MCP server.",
    detail: "The extension reads product pages into a list, and the MCP server lets Claude, ChatGPT, or Codex read and update it.",
    role: "Solo",
    stack: ["Next.js", "FastAPI", "PostgreSQL", "MCP", "GCP"],
    mark: "wishlist.png", markFill: true,
    links: [{ label: "wishlist.fit", href: "https://wishlist.fit" }, { label: "MCP server on GitHub", href: "https://github.com/teslakoile/wishlist-mcp" }],
  },
];
