/**
 * The six projects, listed alphabetically on the page with no featured case
 * study (Kyle's call on 2026-10-05). They come from the "Portfolio Redesign"
 * canvas, not from sampleContent.ts, whose `projects` still holds the older
 * bank-centred list. Kyle turned the section on on 2026-10-17.
 *
 * Each card says what the product does and what is unique about it (`about`),
 * then the interesting engineering behind it (`tech`), per Kyle on
 * 2026-10-17; no year and no role. The facts come from each project's own
 * repo (READMEs, specs, and docs).
 *
 * Servo Platform, Financial Services Site, and VSenses are private: never give
 * them a link to a repo or source. The others link their live site, package,
 * or public repo.
 *
 * `mark` is the project's own logo from its repo (public/projects/marks), or
 * the platform it is built for (Huly); the Financial Services Site has no mark
 * of its own, so the card shows a document icon instead.
 */

export type ProjectKind = "Product" | "AI Agents" | "Developer Tool" | "Game";

export type Project = {
  kind: ProjectKind;
  name: string;
  /** what it does and what is unique about it */
  about: string;
  /** the interesting engineering behind it */
  tech: string;
  stack: string[];
  mark?: string;
  /** the mark is a full app icon that fills its tile, rather than a symbol set inside it */
  markFill?: boolean;
  links?: { label: string; href: string }[];
};

export const PROJECTS: Project[] = [
  {
    kind: "AI Agents", name: "Financial Services Site",
    about: "Turns an adviser's meeting notes into a Record of Advice or a Wholesale Investor Summary, ready to edit and export. Advisers review every change side by side and note why they made it before the document goes out.",
    tech: "Google ADK agents on Vertex AI draft the document from the notes. A rich-text editor tracks each edit, and the final version exports to DOCX.",
    stack: ["Google ADK", "Vertex AI", "React", "TypeScript", "Firebase"],
  },
  {
    kind: "Game", name: "Flee the Faculty",
    about: "An educational game where players rescue classmates by explaining school concepts out loud. Players bring their own schoolwork, a topic or a photo of a worksheet, and the game builds a classroom around it.",
    tech: "Gemini on Vertex AI generates each classroom and judges the spoken explanations, and the backend synthesizes the classmates' voices. Speech recognition runs in the browser, so a child's voice never leaves the device.",
    stack: ["FastAPI", "Gemini", "Vertex AI", "Cloud Run", "Unity"],
    mark: "flee-the-faculty.png",
    links: [{ label: "Game on GitHub", href: "https://github.com/Uhan7/Flee-the-Faculty" }],
  },
  {
    kind: "Developer Tool", name: "huly-cli",
    about: "A command-line client for Huly workspaces, published on PyPI. It creates, reads, updates, and deletes issues, documents, components, milestones, and labels, and searches the whole workspace from the terminal.",
    tech: "A JSON mode and plain Markdown output let coding agents drive it as easily as people. Issue and document bodies convert between Markdown and Huly's ProseMirror rich text over its Collaborator RPC.",
    stack: ["Python", "PyPI"],
    mark: "huly.svg",
    links: [{ label: "PyPI", href: "https://pypi.org/project/huly-cli/" }, { label: "GitHub", href: "https://github.com/teslakoile/huly-cli" }],
  },
  {
    kind: "Product", name: "Servo Platform",
    about: "A hospital information system for the Philippine market, set up as a clinic or a 30 to 50 bed hospital. It covers registration, scheduling, clinical notes, pharmacy inventory, PhilHealth-ready billing, and accounting.",
    tech: "Patient data follows the FHIR R4 standard. Its AI assistants never write to a record without staff confirmation.",
    stack: ["FastAPI", "PostgreSQL", "Next.js", "Terraform", "AWS"],
    mark: "servo.png", markFill: true,
  },
  {
    kind: "Product", name: "VSenses",
    about: "An operations platform that replaced a Davao City spa's Google Sheets workflow. It runs bed-by-time booking with no double bookings, digital intake forms, therapist commissions, an end-of-day cash wizard, and a public booking page.",
    tech: "Every API route checks permissions, and CI fails any build that adds a route without the check. Commission and end-of-day records are append-only, and signing them off takes a second authentication step.",
    stack: ["FastAPI", "PostgreSQL", "Next.js", "Terraform", "GCP"],
    mark: "vsenses.png",
  },
  {
    kind: "Product", name: "Wishlist",
    about: "A gift-list app for friends and family. Save items from any shop with the Chrome extension, share your list with your circle, and get reminded before occasions. A gift picker suggests ideas for a friend after a short quiz.",
    tech: "A custom-deployed MCP server lets Claude, ChatGPT, or Codex read and update a wishlist with the same 29 actions as the app, by passing the user's own OAuth token to the wishlist API. The gift picker runs Gemma in the visitor's browser on WebGPU, so nothing about them leaves the page.",
    stack: ["Next.js", "FastAPI", "PostgreSQL", "MCP", "GCP"],
    mark: "wishlist.png", markFill: true,
    links: [{ label: "wishlist.fit", href: "https://wishlist.fit" }, { label: "MCP server on GitHub", href: "https://github.com/teslakoile/wishlist-mcp" }],
  },
];
