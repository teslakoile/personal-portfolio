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
  Unity: "unity",
  PyPI: "pypi",
  "Next.js": "nextjs",
  MCP: "mcp",
  Cursor: "cursor",
  "Google ADK": "googlecloud",
  "AWS Glue": "aws-glue",
  "Cloud Run": "cloud-run",
  "Azure Data Factory": "azure-data-factory",
  "Azure AI Foundry": "azure-ai-foundry",
  Codex: "openai",
  SQL: "sql",
  Java: "java",
  Dagster: "dagster",
  Dataflow: "dataflow",
};

/** Full-color raster marks Kyle supplied. They win over the landing map, so a
    landing SVG (monochrome pandas, the generic Google Cloud mark for Vertex AI)
    stays as it is for the landing. */
const RASTER_TOOLS: Record<string, string> = {
  Pandas: "pandas.png",
  SQLAlchemy: "sqlalchemy.png",
  Dataform: "dataform.png",
  "Looker Studio": "looker-studio.png",
  Splink: "splink.png",
  "Vertex AI": "vertex-ai.png",
  Gemini: "gemini.png",
};

export function toolLogo(name: string): string | null {
  const raster = RASTER_TOOLS[name];
  if (raster) return `/logos/${raster}`;
  const key = techLogoKey(name) ?? EXTRA_TOOLS[name];
  return key ? `/logos/${key}.svg` : null;
}

/** Employers, communities, schools, and publishers, keyed by the start of the
    name as sampleContent.ts writes it. */
const ORGS: [prefix: string, file: string][] = [
  ["Thinking Machines", "thinking-machines.png"],
  ["Global Shapers", "global-shapers.svg"],
  ["Ingenuity Software", "ingenuity.png"],
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
