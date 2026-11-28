import { LINKS, SECTIONS, type Source } from "./protocol";

/** Reading what the model writes after META_MARK, shared by the route and the eval (scripts/kyllm-eval). */

/**
 * The sources and follow-ups the model wrote after META_MARK. sources[n - 1]
 * stays the source for citation [n]; an entry that names no known section or
 * link becomes null, so later numbers keep their place.
 */
export function readMeta(raw: string): { sources: (Source | null)[]; next: string[] } {
  const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return { sources: [], next: [] };
  try {
    const m = JSON.parse(raw.slice(start, end + 1)) as { sources?: unknown; next?: unknown };
    const sources = (Array.isArray(m.sources) ? m.sources.slice(0, 20) : []).map((s): Source | null => {
      if (s && typeof s === "object" && "section" in s && typeof s.section === "string" && s.section in SECTIONS)
        return { section: s.section as keyof typeof SECTIONS, name: typeof s.name === "string" ? s.name.slice(0, 60) : "" };
      if (s && typeof s === "object" && "link" in s && typeof s.link === "string" && s.link in LINKS)
        return { link: s.link as keyof typeof LINKS };
      return null;
    });
    const next = (Array.isArray(m.next) ? m.next : []).filter((x): x is string => typeof x === "string" && x.length < 90).slice(0, 2);
    return { sources, next };
  } catch {
    return { sources: [], next: [] };
  }
}

/** The check step's result: every [n] in the answer needs a valid sources[n - 1]. */
export function checkCitations(answer: string, sources: (Source | null)[]): { ok: boolean; detail: string } {
  const cited = [...new Set([...answer.matchAll(/\[(\d+)\]/g)].map((x) => Number(x[1])))];
  const bad = cited.filter((n) => !sources[n - 1]).length;
  const valid = sources.filter(Boolean).length;
  // Title Case, like the chat's other step labels
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  if (bad) return { ok: false, detail: `${plural(bad, "Citation")} Without a Source, Hidden` };
  return { ok: true, detail: cited.length ? `${plural(valid, "Source")}, ${plural(cited.length, "Citation")}` : "No Citations" };
}
