/**
 * The six projects, listed alphabetically on the page with no featured case
 * study (Kyle's call on 2026-10-05). They come from the "Portfolio Redesign"
 * canvas, not from sampleContent.ts, whose `projects` still holds the older
 * bank-centred list. Kyle turned the section on on 2026-10-17.
 *
 * Each card says what the product does and what is unique about it (`about`),
 * then the interesting engineering behind it (`tech`), one short paragraph
 * each in one text style, per Kyle on 2026-10-17; no year and no role. A
 * project carries as many `tags` as fit it (Title Case). The facts come from
 * each project's own repo (READMEs, specs, and docs).
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
  name: string;
  tags: string[];
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
    name: "Financial Services Site",
    tags: ["AI Agents", "Financial Services", "Document Generation"],
    about: "Turns an adviser's meeting notes into a Record of Advice or a Wholesale Investor Summary, with every edit reviewed before export.",
    tech: "Google ADK agents on Vertex AI draft the document, and the final version exports to DOCX.",
    stack: ["Google ADK", "Vertex AI", "React", "TypeScript", "Firebase"],
  },
  {
    name: "Flee the Faculty",
    tags: ["Game", "Education", "Voice AI"],
    about: "An educational game where players rescue classmates by explaining school concepts out loud, in a classroom built from their own schoolwork.",
    tech: "Gemini generates each classroom and judges the explanations. Speech recognition runs in the browser, so a child's voice never leaves the device.",
    stack: ["FastAPI", "Gemini", "Vertex AI", "Cloud Run", "Unity"],
    mark: "flee-the-faculty.png",
    links: [{ label: "Game on GitHub", href: "https://github.com/Uhan7/Flee-the-Faculty" }],
  },
  {
    name: "huly-cli",
    tags: ["Developer Tool", "CLI", "Open Source"],
    about: "Manages and searches a Huly workspace from the terminal: issues, documents, components, milestones, and labels.",
    tech: "JSON and plain Markdown output let coding agents use it as easily as people.",
    stack: ["Python", "PyPI"],
    mark: "huly.svg",
    links: [{ label: "PyPI", href: "https://pypi.org/project/huly-cli/" }, { label: "GitHub", href: "https://github.com/teslakoile/huly-cli" }],
  },
  {
    name: "Servo Platform",
    tags: ["Product", "Healthcare", "AI Assistants"],
    about: "A hospital information system for Philippine clinics and 30 to 50 bed hospitals, from registration and clinical notes to PhilHealth-ready billing.",
    tech: "Patient data follows the FHIR R4 standard, and its AI assistants never write to a record without staff confirmation.",
    stack: ["FastAPI", "PostgreSQL", "Next.js", "Terraform", "AWS"],
    mark: "servo.png", markFill: true,
  },
  {
    name: "VSenses",
    tags: ["Product", "Wellness", "Operations"],
    about: "Replaced a Davao City spa's Google Sheets with booking, intake forms, therapist commissions, and an end-of-day cash wizard.",
    tech: "Every API route checks permissions, and financial sign-offs need a second login step.",
    stack: ["FastAPI", "PostgreSQL", "Next.js", "Terraform", "GCP"],
    mark: "vsenses.png",
  },
  {
    name: "Wishlist",
    tags: ["Product", "MCP", "Chrome Extension", "On-Device AI"],
    about: "A gift-list app for friends and family, with a Chrome extension that saves items from any shop and a gift picker for ideas.",
    tech: "A custom MCP server lets Claude, ChatGPT, or Codex manage a wishlist with the app's own 29 actions. The gift picker runs Gemma in the browser, so nothing leaves the page.",
    stack: ["Next.js", "FastAPI", "PostgreSQL", "MCP", "GCP"],
    mark: "wishlist.png", markFill: true,
    links: [{ label: "wishlist.fit", href: "https://wishlist.fit" }, { label: "MCP on GitHub", href: "https://github.com/teslakoile/wishlist-mcp" }],
  },
];
