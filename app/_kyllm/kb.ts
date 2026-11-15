import { sample } from "../samples/sampleContent";
import { PROJECTS } from "../_brand/sections/projectsData";
import { getAllPosts, isDev } from "../blog/lib/posts";
import type { DocNode } from "../blog/lib/types";
import type { SectionId } from "./protocol";

/**
 * KYLLM's knowledge base: one plain-text file per item on the site, built
 * from the same data the page renders. The system prompt carries only a
 * catalog line per file; the model reads the files themselves with the
 * list, read, and grep tools (app/_kyllm/tools.ts).
 *
 * New content needs no registration. Each source below turns every item it
 * finds into a file, so a new project in projectsData.ts or a newly published
 * post in content/blog/ shows up on the next deploy. A new kind of content
 * needs one more source here. Only real, shipped content goes in: the mock
 * recommendations, the starter resources list, and draft posts stay out
 * (`next dev` includes drafts, like the rest of the site).
 */

export type Doc = {
  /** the file's path in the knowledge base, e.g. "projects/wishlist.md" */
  path: string;
  title: string;
  /** the page section an answer cites for this file */
  section: SectionId;
  /** one line for the catalog, so the model can pick files without reading them */
  summary: string;
  text: string;
};

export type Kb = { docs: Doc[]; byPath: Map<string, Doc>; catalog: string };

const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** A catalog line: one line, cut at a word near 200 characters. */
const clip = (s: string) => {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > 200 ? `${one.slice(0, 200).replace(/\s+\S*$/, "")}...` : one;
};

// presentation fields the model never needs: logos, image paths, colours, layout hints
const SKIP = new Set(["logo", "mark", "markFill", "mono", "avatar", "image", "cover", "coverAlt", "c", "eyebrow", "stats", "highlights"]);

/** Any data value as indented plain text, so a new field shows up without code changes. */
function toText(v: unknown, indent = ""): string {
  if (v == null || v === "") return "";
  if (typeof v !== "object") return `${indent}${String(v)}`;
  if (Array.isArray(v)) {
    if (v.length === 1 && typeof v[0] !== "object") return `${indent}${String(v[0])}`;
    // short values (tags, tools) on one line; sentences one per bullet
    if (v.every((x) => typeof x !== "object" && String(x).length <= 40)) return `${indent}${v.join(", ")}`;
    return v.map((x) => toText(x, indent + "  ").replace(/^\s*/, `${indent}- `)).join("\n");
  }
  return Object.entries(v as Record<string, unknown>)
    // "#" marks a link that is not set yet
    .filter(([k, x]) => !SKIP.has(k) && x != null && x !== "" && x !== "#" && !(Array.isArray(x) && !x.length))
    .map(([k, x]) => {
      const t = toText(x, indent + "  ");
      return t.includes("\n") || (typeof x === "object" && !Array.isArray(x)) ? `${indent}${k}:\n${t}` : `${indent}${k}: ${t.trim()}`;
    })
    .join("\n");
}

/** A blog post's editor JSON as Markdown, keeping headings, lists, and code. */
function toMarkdown(node: DocNode, depth = 0): string {
  const inner = (n: DocNode) => (n.content ?? []).map((c) => toMarkdown(c, depth)).join("");
  switch (node.type) {
    case "doc": return (node.content ?? []).map((c) => toMarkdown(c, depth)).join("\n\n");
    case "text": return node.text ?? "";
    case "paragraph": return inner(node);
    case "heading": return `${"#".repeat(Number(node.attrs?.level ?? 2))} ${inner(node)}`;
    case "codeBlock": return "```" + String(node.attrs?.language ?? "") + "\n" + inner(node) + "\n```";
    case "bulletList":
    case "orderedList":
      return (node.content ?? []).map((li, i) => `${"  ".repeat(depth)}${node.type === "orderedList" ? `${i + 1}.` : "-"} ${(li.content ?? []).map((c) => toMarkdown(c, depth + 1)).join("\n").trim()}`).join("\n");
    case "embed": return node.attrs?.src ? `[embed: ${String(node.attrs.src)}]` : "";
    default: return inner(node);
  }
}

const file = (path: string, section: SectionId, title: string, summary: string, body: string): Doc =>
  ({ path, section, title, summary: clip(summary), text: `# ${title}\n\n${body.trim()}\n` });

/** Every source of site content. Add one entry per new kind of content. */
const SOURCES: (() => Doc[] | Promise<Doc[]>)[] = [
  () => [file("about.md", "about", "About", sample.hero.headline,
    toText({ headline: sample.hero.headline, subhead: sample.hero.subhead, about: sample.about, focusAreas: sample.focusAreas }))],

  () => PROJECTS.map((p) => file(`projects/${slug(p.name)}.md`, "projects", p.name, `${p.tags.join(", ")}: ${p.about}`,
    toText({ tags: p.tags, about: p.about, tech: p.tech, stack: p.stack, links: p.links?.map((l) => `${l.label}: ${l.href}`) }))),

  // the roles' source data; experienceData.ts rewords it for the page but imports UI code, so it stays out of the API route
  () => {
    const cur = sample.experience.current;
    return [
      file(`experience/${slug(cur.company)}.md`, "experience", `${cur.role}, ${cur.company}`, `${cur.period}: ${cur.summary}`, toText(cur)),
      ...sample.experience.past.map((co) => file(`experience/${slug(co.company)}.md`, "experience", `${co.roles.map((r) => r.title).join(", ")}, ${co.company}`,
        `${co.roles.map((r) => `${r.title}, ${r.period}`).join("; ")}: ${co.roles[0].description}`, toText(co))),
    ];
  },

  () => [file("skills.md", "skills", "Skills", `Skill groups: ${sample.skills.map((s) => s.title).join(", ")}.`, toText(sample.skills))],
  () => [file("education.md", "education", "Education", sample.education.map((e) => `${e.degree}, ${e.school}`).join("; "), toText(sample.education))],
  () => [file("certifications.md", "certifications", "Certifications", `${sample.certifications.length} certifications: ${[...new Set(sample.certifications.map((c) => c.issuer))].join(", ")}.`,
    toText(sample.certifications.map(({ issuer, title, blurb, issued, expires, url }) => ({ issuer, title, blurb, issued, expires, url }))))],

  () => sample.community.map((c) => file(`community/${slug(c.name)}.md`, "community", c.name, `${c.role}, ${c.period}: ${c.description}`, toText(c))),
  () => sample.speaking.map((t) => file(`talks/${slug(t.title)}.md`, "community", t.title, `${t.meta}: ${t.description}`, toText(t))),
  () => [file("recognition.md", "recognition", "Recognition", sample.achievements.map((a) => a.title).join(", "), toText(sample.achievements))],
  () => [file("github.md", "github", "GitHub", `GitHub profile ${sample.github.url}`, toText({ user: sample.github.user, url: sample.github.url }))],

  async () => (await getAllPosts()).map((p) => file(`blog/${p.slug}.md`, "writing", p.title, p.dek,
    `${toText({ tags: p.tags, status: isDev && p.status !== "published" ? "draft" : undefined, published: p.publishedAt?.slice(0, 10), url: `/blog/${p.slug}` })}\n\n${p.dek}\n\n${toMarkdown(p.doc)}`)),
];

async function load(): Promise<Kb> {
  const docs = (await Promise.all(SOURCES.map((s) => s()))).flat();
  const byPath = new Map(docs.map((d) => [d.path, d]));
  const catalog = docs.map((d) => `${d.path} | ${d.section} | ${d.title} | ${d.summary}`).join("\n");
  return { docs, byPath, catalog };
}

let built: Promise<Kb> | null = null;
/** The knowledge base, built once per server instance; `next dev` rebuilds it on every request so edits show at once. */
export function getKb(): Promise<Kb> {
  if (isDev) return load();
  return (built ??= load());
}
