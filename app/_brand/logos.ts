import { techLogoKey } from "../samples/quiet/Logo";

/**
 * Logos for the redesign, resolved by name from /public/logos. Real brand marks
 * only: a name with no verified mark returns null and the caller shows text.
 * Tools reuse the landing page's map (techLogoKey) plus the extras below;
 * organizations are matched by the start of their name.
 */

/** Tools the landing page's map does not cover. First-party services take
    their parent's mark, as the landing map does for Vertex AI. */
const EXTRA_TOOLS: Record<string, string> = {
  React: "react",
  TypeScript: "typescript",
  Firebase: "firebase",
  Gemini: "gemini",
  Unity: "unity",
  PyPI: "pypi",
  "Next.js": "nextjs",
  MCP: "mcp",
  Cursor: "cursor",
  "Cloud Run": "googlecloud",
  "Google ADK": "googlecloud",
  "AWS Glue": "aws",
  "Azure Data Factory": "azure",
  "Codex CLI": "openai",
};

export function toolLogo(name: string): string | null {
  const key = techLogoKey(name) ?? EXTRA_TOOLS[name];
  return key ? `/logos/${key}.svg` : null;
}

/** Employers, communities, schools, and publishers, keyed by the start of the
    name as sampleContent.ts writes it. Thinking Machines has no mark here yet. */
const ORGS: [prefix: string, file: string][] = [
  ["Ingenuity Software", "ingenuity.svg"],
  ["UP Diliman", "up-diliman.png"],
  ["University of the Philippines Diliman", "up-diliman.png"],
  ["GCash", "gcash.svg"],
  ["Google Developer Group", "gdg.svg"],
  ["IEEE", "ieee.svg"],
  ["Apache Software Foundation", "apache.svg"],
];

export function orgLogo(name: string): string | null {
  const hit = ORGS.find(([prefix]) => name.startsWith(prefix));
  return hit ? `/logos/${hit[1]}` : null;
}
