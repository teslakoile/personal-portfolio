import type Anthropic from "@anthropic-ai/sdk";
import type { Kb } from "./kb";
import { PART_KINDS, type Diagram, type PartKind } from "./protocol";
import { sourceLine, written } from "./chart";
import { G, textWidth } from "./diagramLayout";
import { chipGroup, place, type Plan } from "./diagramPlace";

/**
 * The show_diagram tool: the model sends the parts and links of a system, the
 * route checks them against a knowledge-base file read in the same answer,
 * and the chat draws them (app/samples/kyllm-ui/AnswerDiagram.tsx).
 *
 * The model names parts, groups, and links; the route places them on the
 * grid (app/_kyllm/diagramPlace.ts). Every part name, group label, and stack
 * item must appear in the source file. Every other word in a detail or link
 * label must appear in the file too, except a short list of plain words such
 * as "the" or "app", and every number must be written there. Names and
 * details must fit their boxes. A spec that fails comes back to the model
 * with every problem listed, and nothing is drawn.
 */

export const SHOW_DIAGRAM: Anthropic.Beta.BetaTool = {
  name: "show_diagram",
  description: [
    "Draw one architecture diagram under your answer, from a knowledge-base file you have read in this answer. Use it when the visitor asks how a project works or how it is built and the file names at least three parts and what one does with another. Otherwise answer in text.",
    "Name the parts and the links between them; the chat places them on its grid. Every part name must appear in the file, and every word of a detail or link label must come from the file. Keep names to about 13 characters and details to about 18, and give links one- or two-word verb labels or none.",
    "Group parts that belong together, such as the parts that run inside one system. A list the file names, such as \"Claude, ChatGPT, or Codex\", is one part per name in a group (parts with no details in a group are drawn as small chips), and the link goes from the group. Put the tools from the file's stack line in stack, never as parts.",
  ].join(" "),
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "The finding, in sentence case, under 50 characters: \"Assistants write only after staff confirm\"" },
      source: { type: "string", description: "Path of the file the parts come from, e.g. \"projects/wishlist.md\"" },
      parts: {
        type: "array",
        description: "3 to 8 parts",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Short lowercase id, e.g. \"mcp\"" },
            label: { type: "string", description: "The part's name as the file writes it" },
            detail: { type: "string", description: "A few words from the file, e.g. \"runs Gemma\"" },
            kind: { type: "string", enum: [...PART_KINDS], description: "person: someone who uses it; assistant: an outside AI that calls it (Claude, ChatGPT); model: a model or AI feature inside it; app, service, pipeline, database, storage, extension, browser, external (a third-party API), cloud, container, loadbalancer, dns, cache, registry, monitor" },
            group: { type: "string", description: "The id of the group the part sits in" },
          },
          required: ["id", "label", "kind"],
        },
      },
      groups: {
        type: "array",
        description: "Boxes drawn around parts that belong together, e.g. the AI assistants, or the parts inside one system",
        items: { type: "object", properties: { id: { type: "string" }, label: { type: "string" } }, required: ["id", "label"] },
      },
      links: {
        type: "array",
        description: "Arrows between parts or groups, as the file describes them",
        items: {
          type: "object",
          properties: { from: { type: "string" }, to: { type: "string" }, label: { type: "string", description: "One or two words, e.g. \"manage\"" } },
          required: ["from", "to"],
        },
      },
      subject: { type: "string", description: "The id of the part or group the answer is about, drawn in light blue" },
      stack: { type: "array", items: { type: "string" }, description: "Tools from the file's stack line, shown under the drawing" },
    },
    required: ["title", "source", "parts", "links"],
  },
};

// a word's stem, so "explain" matches "explaining" and "saves" matches "saved"
const stem = (w: string) => w.replace(/'s$/, "").replace(/(?<=\w{3})(ing|ed|es|e|s)$/, "");
// plain words a detail, group, or link label may use without the file writing them: function words and the part kinds' own nouns
const PLAIN = new Set(("a an the of in on at to for and or by with from into via its it his their each one all no not ai " +
  "app web api server service backend frontend database store storage file browser device user visitor person people " +
  "assistant agent client model pipeline job cloud extension container cache registry data").split(" ").map((w) => stem(w)));
const ID = /^[a-z0-9][a-z0-9_-]{0,23}$/;
// the label of a group made from a list, by the parts' kind; every word is a plain word, so it passes the wording check
const KIND_PLURAL: Record<PartKind, string> = {
  person: "People", assistant: "AI assistants", model: "Models", app: "Apps", service: "Services", pipeline: "Pipelines",
  database: "Databases", storage: "Storage", extension: "Extensions", browser: "Browsers", external: "Services", cloud: "Cloud",
  container: "Containers", loadbalancer: "Services", dns: "Services", cache: "Caches", registry: "Registries", monitor: "Services",
};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const low = (s: string) => s.toLowerCase();
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const words = (s: string) => low(s).split(/[^a-z0-9']+/).filter(Boolean);

export type DiagramResult = { diagram: Diagram; text: string } | { error: string };

/** Checks a show_diagram call. `read` holds the paths the model read in this answer. */
export function checkDiagram(kb: Kb, read: Set<string>, input: unknown): DiagramResult {
  const a = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const path = str(a.source).replace(/^\.?\/+/, "");
  const doc = kb.byPath.get(path);
  if (!doc) return { error: `No file "${path}". Use a path from the catalog.` };
  if (!read.has(path)) return { error: `Read ${path} first: a diagram can only use a file you read in this answer.` };
  const text = low(doc.text);
  const vocab = new Set(words(doc.text).map(stem));
  const inFile = (s: string) => text.includes(low(s));
  // a detail or link label: each word from the file or the plain list, each number written in the file
  const grounded = (s: string) => {
    for (const w of words(s)) {
      if (/^\d/.test(w)) { if (!written(doc.text, Number(w))) return w; }
      else if (!PLAIN.has(stem(w)) && !vocab.has(stem(w))) return w;
    }
    return null;
  };

  // every problem is reported at once, so one retry can fix them all
  const errs: string[] = [];
  const fail = (): DiagramResult => ({ error: `Nothing is drawn yet. Fix all of these, then call show_diagram again:\n${[...new Set(errs)].map((e) => `- ${e}`).join("\n")}` });

  const title = str(a.title);
  if (!title || title.length > 60) errs.push("Give a title under 50 characters that states the finding.");
  const all: string[] = [title];

  // a part named as a list the file writes ("Claude, ChatGPT, or Codex") becomes a group of chips, one per name, under the part's id
  const listGroups: { id: string; label: string }[] = [];
  const rawParts = (Array.isArray(a.parts) ? a.parts : []).flatMap((p) => {
    const o = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
    const names = str(o.label).split(/\s*,\s*(?:or\s+|and\s+)?|\s+(?:or|and)\s+/).map((x) => x.trim()).filter(Boolean);
    if (names.length < 2 || names.length > 4 || str(o.group) || !names.every(inFile) || !PART_KINDS.includes(o.kind as PartKind)) return [p];
    listGroups.push({ id: str(o.id), label: KIND_PLURAL[o.kind as PartKind] });
    return names.map((n, i) => ({ id: `${str(o.id)}-${i + 1}`, label: n, kind: o.kind, group: str(o.id) }));
  });
  if (rawParts.length < 3 || rawParts.length > 8) errs.push("A diagram takes 3 to 8 parts. With fewer than three, answer in text.");
  const rawGroups = [...(Array.isArray(a.groups) ? a.groups : []), ...listGroups];
  if (rawGroups.length > 3) errs.push("Use at most 3 groups.");
  const ids = new Set<string>();
  const groups: NonNullable<Diagram["groups"]> = [];
  for (const g of rawGroups) {
    const o = (g && typeof g === "object" ? g : {}) as Record<string, unknown>;
    const id = str(o.id), label = cap(str(o.label));
    if (!ID.test(id) || ids.has(id)) { errs.push(`Group id "${id}" must be short, lowercase, and unique.`); continue; }
    if (!label || (!inFile(label) && grounded(label))) errs.push(`The group label "${label}" must use words from ${path}.`);
    ids.add(id); groups.push({ id, label }); all.push(label);
  }

  const parts: Plan["parts"] = [];
  for (const p of rawParts) {
    const o = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
    const id = str(o.id), label = str(o.label), detail = cap(str(o.detail)), group = str(o.group);
    const kind = o.kind as PartKind;
    if (!ID.test(id) || ids.has(id)) { errs.push(`Part id "${id}" must be short, lowercase, and unique across parts and groups.`); continue; }
    if (!PART_KINDS.includes(kind)) { errs.push(`"${label}" needs a kind from the list.`); continue; }
    if (!label || label.length > 24) { errs.push(`Part names need 1 to 24 characters; "${label}" does not fit.`); continue; }
    if (!inFile(label)) errs.push(`"${label}" does not appear in ${path}. Name each part as the file does.`);
    if (detail) { const w = grounded(detail); if (w) errs.push(`The detail "${detail}" uses "${w}", which ${path} does not. Use the file's words or drop the detail.`); }
    if (group && !groups.some((g) => g.id === group)) { errs.push(`"${label}" names group "${group}", which is not in groups.`); continue; }
    ids.add(id);
    parts.push({ id, label, ...(detail ? { detail } : {}), kind, ...(group ? { group } : {}) });
    all.push(label, detail);
  }
  for (const g of groups) {
    const n = parts.filter((p) => p.group === g.id).length;
    if (!n) errs.push(`Group "${g.label}" has no parts.`);
    if (n > 4) errs.push(`Group "${g.label}" has ${n} parts; a group holds at most 4.`);
  }
  // a name or detail has 90px beside a box's icon and 104px beside a chip's, 16px less inside a group
  const plan0 = { parts } as Plan;
  for (const p of parts) {
    const room = (p.group && chipGroup(plan0, p.group) ? 104 : 90) - (p.group ? 2 * G.inset : 0);
    for (const [t, font, what] of [[p.label, "label", "name"], [p.detail ?? "", "detail", "detail"]] as const)
      if (t && textWidth(t, font) > room) errs.push(`The ${what} "${t}" needs ${Math.ceil(textWidth(t, font))}px but has ${room}px. Shorten it${what === "name" ? " (about 13 characters fit)" : ""}.`);
  }

  const rawLinks = Array.isArray(a.links) ? a.links : [];
  if (rawLinks.length < 1 || rawLinks.length > 10) errs.push("A diagram takes 1 to 10 links.");
  const links: Diagram["links"] = [];
  const groupOf = (id: string) => parts.find((p) => p.id === id)?.group;
  for (const l of rawLinks) {
    const o = (l && typeof l === "object" ? l : {}) as Record<string, unknown>;
    const from = str(o.from), to = str(o.to), label = cap(str(o.label));
    if (!ids.has(from) || !ids.has(to)) { errs.push(`A link from "${from}" to "${to}" names an id that is not a part or group.`); continue; }
    if (from === to) { errs.push(`A link from "${from}" goes to itself.`); continue; }
    if (links.some((x) => x.from === from && x.to === to)) { errs.push(`The link from "${from}" to "${to}" appears twice.`); continue; }
    if (groupOf(to) === from || groupOf(from) === to) { errs.push(`A group cannot link to its own part ("${from}" to "${to}").`); continue; }
    const g = groupOf(from);
    if (g && g === groupOf(to) && chipGroup(plan0, g)) { errs.push(`"${from}" and "${to}" are chips in one group, so no arrow fits between them. Give one a detail or link the group instead.`); continue; }
    if (label) {
      if (label.length > 16) errs.push(`Link labels need one or two words; "${label}" is too long.`);
      const w = grounded(label); if (w) errs.push(`The link label "${label}" uses "${w}", which ${path} does not. Use the file's words or no label.`);
    }
    links.push({ from, to, ...(label ? { label } : {}) });
    all.push(label);
  }
  // several ungrouped parts of one kind that all point at the same part read as a list: ask for a group
  const fans = new Map<string, string[]>(); // "kind>target" -> labels of ungrouped parts of that kind linking to that target
  for (const l of links) {
    const p = parts.find((x) => x.id === l.from);
    if (p && !p.group) fans.set(`${p.kind}>${l.to}`, [...(fans.get(`${p.kind}>${l.to}`) ?? []), p.label]);
  }
  for (const [k, labels] of fans) if (labels.length >= 3)
    errs.push(`${labels.map((t) => `"${t}"`).join(", ")} all link to "${k.split(">")[1]}". Put them in one group and link the group instead.`);
  for (const p of parts) if (!links.some((l) => [l.from, l.to].includes(p.id) || (p.group && [l.from, l.to].includes(p.group))))
    errs.push(`"${p.label}" has no link. Link it, put it in a group that has one, or leave it out.`);

  const subject = str(a.subject);
  if (subject && !ids.has(subject)) errs.push(`subject "${subject}" is not a part or group id.`);
  const stack = (Array.isArray(a.stack) ? a.stack : []).map(str).filter(Boolean);
  if (stack.length > 8) errs.push("List at most 8 tools in stack.");
  for (const t of stack) if (!inFile(t)) errs.push(`"${t}" in stack does not appear in ${path}.`);
  if (/[—<>]/.test(all.join(" ") + stack.join(" "))) errs.push("No em dashes or angle brackets in any text.");
  if (errs.length) return fail();

  const placed = place({ title, parts, ...(groups.length ? { groups } : {}), links, ...(subject ? { subject } : {}), ...(stack.length ? { stack } : {}), source: sourceLine(doc) });
  if ("problems" in placed) {
    errs.push(`No arrangement on the grid keeps every arrow clear. The closest one: ${placed.problems.join("; ")}. Drop a link or a part, or group parts that act together.`);
    return fail();
  }
  const note = placed.dropped.length ? ` The link labels ${placed.dropped.map((t) => `"${t}"`).join(", ")} did not fit and were left off.` : "";
  return { diagram: placed.diagram, text: `The diagram is shown under your answer.${note} Now write the answer text; it should still explain how the parts connect.` };
}
