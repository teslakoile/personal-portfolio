/**
 * Loading verbs: plain data words a visitor can follow, mixed with playful
 * everyday ones. Rules: one word, a present participle, no em dashes, no
 * jargon a visitor would not know (Vacuuming, Backfilling), nothing that claims
 * a fact about Kyle the site does not state, and none of Claude Code's own
 * spinner words, so the set stays ours.
 */

export type VerbContext = "page" | "ask" | "send";

/**
 * Every loading word once, tagged with each context it fits. A word that
 * reads right in two places (Reading while a page loads or while ⌘K searches)
 * appears in both lists without being written twice.
 *   page  page and data loads
 *   ask   ⌘K: an agent reading the CV
 *   send  sending an email or a form
 */
export const VERBS: { word: string; in: VerbContext[] }[] = [
  // plain data words anyone can read
  { word: "Reading", in: ["page", "ask"] },
  { word: "Scanning", in: ["page", "ask"] },
  { word: "Indexing", in: ["page", "ask"] },
  { word: "Querying", in: ["page", "ask"] },
  { word: "Linking", in: ["page", "ask"] },
  { word: "Matching", in: ["ask"] },
  { word: "Compiling", in: ["page"] },
  { word: "Validating", in: ["page", "send"] },
  { word: "Cross-checking", in: ["ask"] },
  { word: "Citing", in: ["ask"] },
  // playful everyday words
  { word: "Untangling", in: ["page", "ask"] },
  { word: "Sifting", in: ["page", "ask"] },
  { word: "Rummaging", in: ["page", "ask"] },
  { word: "Distilling", in: ["ask"] },
  { word: "Sleuthing", in: ["ask"] },
  { word: "Polishing", in: ["page", "send"] },
  { word: "Tidying", in: ["page"] },
  { word: "Daydreaming", in: ["page"] },
  // sending
  { word: "Drafting", in: ["ask", "send"] },
  { word: "Proofreading", in: ["ask", "send"] },
  { word: "Dispatching", in: ["send"] },
  { word: "Sending", in: ["send"] },
];

const pick = (c: VerbContext) => VERBS.filter((v) => v.in.includes(c)).map((v) => v.word);
export const PIPELINE_VERBS = pick("page");
export const ASK_VERBS = pick("ask");
export const SEND_VERBS = pick("send");
