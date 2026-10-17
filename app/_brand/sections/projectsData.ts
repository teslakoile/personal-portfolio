/**
 * The projects, in Kyle's order (2026-10-17): Servo, VSenses, Wishlist,
 * Leafmark, Flee the Faculty, huly-cli. They come from the "Portfolio
 * Redesign" canvas and each project's repo, not from sampleContent.ts, whose
 * `projects` still holds the older bank-centred list. Confidential client
 * work stays off this list (and so out of KYLLM).
 *
 * Each card says what the product does and what is unique about it (`about`),
 * then the interesting engineering behind it (`tech`), one short paragraph
 * each in one text style, per Kyle on 2026-10-17; no year and no role. A
 * project carries as many `tags` as fit it (Title Case). The facts come from
 * each project's own repo (READMEs, specs, and docs).
 *
 * Servo, VSenses, and Leafmark have private repos: never link their source.
 * Servo and VSenses link their live apps; the others link their live site,
 * package, game page, or public repo.
 *
 * `mark` is the project's own logo from its repo (public/projects/marks), or
 * the platform it is built for (Huly).
 */

export type Project = {
  name: string;
  tags: string[];
  /** what it does and what is unique about it */
  about: string;
  /** the interesting engineering behind it */
  tech: string;
  stack: string[];
  mark: string;
  /** the mark is a full app icon that fills its tile, rather than a symbol set inside it */
  markFill?: boolean;
  links?: { label: string; href: string }[];
};

export const PROJECTS: Project[] = [
  {
    name: "Servo",
    tags: ["Product", "Healthcare", "AI Assistants"],
    about: "A hospital information system for Philippine clinics and 30 to 50 bed hospitals, from registration and clinical notes to PhilHealth-ready billing.",
    tech: "Patient data follows the FHIR R4 standard, and its AI assistants never write to a record without staff confirmation.",
    stack: ["FastAPI", "PostgreSQL", "Next.js", "Terraform", "AWS"],
    mark: "servo.png", markFill: true,
    links: [{ label: "app.servoplatform.com", href: "https://app.servoplatform.com/" }],
  },
  {
    name: "VSenses",
    tags: ["Product", "Wellness", "Operations"],
    about: "Replaced a Davao City spa's Google Sheets with booking, intake forms, therapist commissions, and an end-of-day cash wizard.",
    tech: "Every API route checks permissions, and financial sign-offs need a second login step.",
    stack: ["FastAPI", "PostgreSQL", "Next.js", "Terraform", "GCP"],
    mark: "vsenses.png",
    links: [{ label: "app.vsensesmassage.com", href: "https://app.vsensesmassage.com/" }],
  },
  {
    name: "Wishlist",
    tags: ["Product", "Chrome Extension", "MCP", "On-Device AI"],
    about: "A gift-list app for friends and family. Its Chrome extension saves items from any shop in one click, and a gift picker suggests ideas for a friend.",
    tech: "A custom MCP server lets Claude, ChatGPT, or Codex manage a wishlist with the app's own 29 actions. The gift picker runs Gemma in the browser, so nothing leaves the page.",
    stack: ["Next.js", "FastAPI", "PostgreSQL", "MCP", "GCP"],
    mark: "wishlist.png", markFill: true,
    links: [{ label: "wishlist.fit", href: "https://wishlist.fit" }, { label: "MCP on GitHub", href: "https://github.com/teslakoile/wishlist-mcp" }],
  },
  {
    name: "Leafmark",
    tags: ["Chrome Extension", "LLM Classification", "Productivity"],
    about: "A Chrome extension that files each new bookmark into the right folder, and asks only when it isn't sure.",
    tech: "A model picks the folder with a confidence score, files the sure ones silently, and learns from bookmarks you move. Your own rules run locally first, and URLs with tokens are never sent.",
    stack: ["JavaScript", "OpenRouter"],
    mark: "leafmark.png",
  },
  {
    name: "Flee the Faculty",
    tags: ["Game", "Education", "Voice AI"],
    about: "An educational game where players rescue classmates by explaining school concepts out loud, in a classroom built from their own schoolwork.",
    tech: "Gemini generates each classroom and judges the explanations. Speech recognition runs in the browser, so a child's voice never leaves the device.",
    stack: ["FastAPI", "Gemini", "Vertex AI", "Cloud Run", "Unity"],
    mark: "flee-the-faculty.png",
    links: [{ label: "Play on itch.io", href: "https://uhan.itch.io/flee-the-faculty" }, { label: "GitHub", href: "https://github.com/Uhan7/Flee-the-Faculty" }],
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
];
