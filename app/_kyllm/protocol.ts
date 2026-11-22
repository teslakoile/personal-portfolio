/**
 * What the KYLLM route and the chat window share: the sections an answer can
 * cite, the outside links, the stream's event shape, and the input limits.
 */

/** Sections of the page, by element id, with the label a source chip shows. */
export const SECTIONS = {
  about: "About",
  projects: "Projects",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  certifications: "Certifications",
  community: "Community",
  recognition: "Recognition",
  github: "GitHub",
  writing: "Writing",
} as const;
export type SectionId = keyof typeof SECTIONS;

/** Places off the page an answer can cite. */
export const LINKS = {
  linkedin: { label: "LinkedIn", name: "kyle-naranjo", host: "linkedin.com", href: "https://linkedin.com/in/kyle-naranjo" },
  github: { label: "GitHub", name: "teslakoile", host: "github.com", href: "https://github.com/teslakoile" },
  ieee: { label: "IEEE", name: "AIComprehend", host: "ieeexplore.ieee.org", href: "https://ieeexplore.ieee.org/document/10323847" },
  cv: { label: "CV", name: "Kyle-Naranjo-CV.pdf", host: "kylenaranjo.cv", href: "/Kyle-Naranjo-CV.pdf" },
} as const;
export type LinkId = keyof typeof LINKS;

/** One cited source, as the model names it: a section and the item in it, or an outside link. */
export type Source = { section: SectionId; name: string } | { link: LinkId };

/**
 * What KYLLM did, as it happens: a step starts with its kind and ends with
 * `end`, both carrying the same id. Steps can overlap (parallel reads). A
 * second start with an id already open changes that step's kind and label,
 * keeping its start time: a round's think step becomes the write step when
 * the round turns out to be the answer.
 *   think  the model's thinking block
 *   tool   one list, read, or grep call; `label` is the row's text
 *          ("Looking Up Wishlist") and `detail` the file's section ("Projects")
 *   write  the answer text, from its first word to the sources mark
 *   check  the model writing its source list, then the route checking that
 *          every citation in the answer has a valid source; its end carries
 *          the result as `detail` ("2 sources, 3 citations") and `ok`
 */
export type StepKind = "think" | "tool" | "write" | "check";
export type StepEvent =
  | { t: "step"; id: number; kind: StepKind; name?: string; label?: string; detail?: string; args?: unknown }
  | { t: "step"; id: number; end: true; ok?: boolean; detail?: string };

/**
 * A chart the chat draws under the answer, from a spec the model sends with
 * the show_chart tool and the route checks against a file read that turn.
 *   bars     one horizontal bar per category, with the category's logo
 *   columns  one vertical column per step of an ordered scale, such as years
 */
export type Chart = {
  kind: "bars" | "columns";
  /** the finding, in sentence case: "Half came in 2025" */
  title: string;
  /** what one unit is, plural: "certifications" */
  unit: string;
  rows: { label: string; value: number; detail?: string }[];
  /** the one row drawn in orange */
  highlight?: string;
  /** the source line under the chart: "From Certifications" */
  source: string;
};

/** What a diagram part is; the kind picks its icon and tile colour (app/_kyllm/diagram.ts). */
export const PART_KINDS = [
  "person", "assistant", "model", "app", "service", "pipeline", "database", "storage", "extension",
  "browser", "external", "cloud", "container", "loadbalancer", "dns", "cache", "registry", "monitor",
] as const;
export type PartKind = (typeof PART_KINDS)[number];

/**
 * An architecture diagram the chat draws under the answer, from a spec the
 * model sends with the show_diagram tool and the route checks against a file
 * read that turn. Parts sit on a two-column, four-row grid; links run between
 * parts or groups. Laid out by app/_kyllm/diagramLayout.ts.
 */
export type Diagram = {
  /** the finding, in sentence case: "Assistants write only after staff confirm" */
  title: string;
  parts: { id: string; label: string; detail?: string; kind: PartKind; col: 0 | 1; row: number; chip?: boolean; group?: string }[];
  groups?: { id: string; label: string }[];
  links: { from: string; to: string; label?: string }[];
  /** the part or group the answer is about, drawn in light blue */
  subject?: string;
  /** the tools listed under the drawing */
  stack?: string[];
  /** the source line: "From Projects · Wishlist" */
  source: string;
};

/** The route streams newline-delimited JSON, one of these per line. */
export type StreamEvent =
  | StepEvent
  | { t: "text"; v: string }
  | { t: "chart"; chart: Chart }
  | { t: "diagram"; diagram: Diagram }
  /** sources[n - 1] is the source for citation [n]; null when the model named an invalid one */
  | { t: "meta"; sources: (Source | null)[]; next: string[] }
  | { t: "error"; v: string }
  | { t: "done" };

export type Turn = { role: "user" | "assistant"; content: string };

export const LIMITS = {
  /** characters in one question */
  question: 600,
  /** earlier messages sent along for context */
  history: 12,
  /** characters across the history */
  historyChars: 8000,
};

/** The line the model writes between its answer and the sources and follow-ups. */
export const META_MARK = "<<<META>>>";
