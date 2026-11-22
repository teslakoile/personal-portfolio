import type Anthropic from "@anthropic-ai/sdk";
import type { Kb } from "./kb";
import { SECTIONS, type Chart } from "./protocol";

/**
 * The show_chart tool: the model sends a small spec, the route checks it
 * against a knowledge-base file read in the same answer, and the chat draws
 * it (app/samples/kyllm-ui/AnswerChart.tsx). The model never writes markup.
 *
 * Every label must appear in the source file. Every value must either be a
 * number written in the file, or the count of the file's list items whose
 * `count_field` line contains the label (4 certifications with "issuer:
 * Google Cloud"). A spec that fails a check comes back to the model as an
 * error it can fix, and nothing is drawn.
 */

export const SHOW_CHART: Anthropic.Beta.BetaTool = {
  name: "show_chart",
  description: [
    "Draw one chart under your answer, from a knowledge-base file you have read in this answer. Use it only when the visitor asks about a pattern, a trend, or a comparison across three or more items, such as certifications by year or by issuer. For one or two numbers, write them in the answer instead.",
    "Use \"columns\" for an ordered scale such as years, and \"bars\" for categories such as issuers or tools. Every label must appear in the source file. Every value must be a number written in the file, or a count of the file's list items: then set count_field to the field whose line contains the label, such as \"issuer\" or \"issued\".",
    "The chart shows at most once per answer. Your answer text still states the finding.",
  ].join(" "),
  input_schema: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["columns", "bars"] },
      title: { type: "string", description: "The finding, in sentence case, under 50 characters: \"Half came in 2025\"" },
      unit: { type: "string", description: "What one unit is, plural and lowercase: \"certifications\"" },
      source: { type: "string", description: "Path of the file the numbers come from, e.g. \"certifications.md\"" },
      count_field: { type: "string", description: "When the values are counts of list items, the field to match each label against" },
      rows: {
        type: "array",
        description: "Columns: 2 to 6 rows in scale order, labels up to 9 characters. Bars: 2 to 8 rows, largest first, labels up to 22 characters.",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            value: { type: "number" },
            detail: { type: "string", description: "One line for the hover note, under 100 characters, e.g. the items counted" },
          },
          required: ["label", "value"],
        },
      },
      highlight: { type: "string", description: "The label of the one row the answer is about, drawn in orange. Omit if none stands out." },
    },
    required: ["kind", "title", "unit", "source", "rows"],
  },
};

const LIMITS = { columns: { rows: 6, label: 9 }, bars: { rows: 8, label: 22 } } as const;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const low = (s: string) => s.toLowerCase();

/** The file's top-level list items ("- issuer: OpenAI" and the lines under it). */
function items(text: string): string[][] {
  const out: string[][] = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("- ")) out.push([line.slice(2)]);
    else if (out.length && line.startsWith("  ")) out.at(-1)!.push(line.trim());
    else if (line.trim() && out.length) out.push([]); // a heading or paragraph ends the item
  }
  return out.filter((x) => x.length);
}

/** Whether `value` is written in the file as a word of its own: not part of "2025", "3.5", or a URL's ID. */
export const written = (text: string, value: number) =>
  new RegExp(`(?<![\\w.,-])${String(value).replace(".", "\\.")}(?![\\w-]|\\.\\d)`)
    .test(text.replace(/https?:\/\/\S+/g, " ").replace(/(\d),(\d{3})/g, "$1$2"));

/** The line under a block naming the file's page section and item: "From Projects · Wishlist". */
export const sourceLine = (doc: Kb["docs"][number]) =>
  `From ${doc.title === SECTIONS[doc.section] ? doc.title : `${SECTIONS[doc.section]} · ${doc.title}`}`;

export type ChartResult = { chart: Chart; text: string } | { error: string };

/** Checks a show_chart call. `read` holds the paths the model read in this answer. */
export function checkChart(kb: Kb, read: Set<string>, input: unknown): ChartResult {
  const a = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const kind = a.kind === "bars" || a.kind === "columns" ? a.kind : null;
  if (!kind) return { error: "kind must be \"columns\" or \"bars\"." };
  const path = str(a.source).replace(/^\.?\/+/, "");
  const doc = kb.byPath.get(path);
  if (!doc) return { error: `No file "${path}". Use a path from the catalog.` };
  if (!read.has(path)) return { error: `Read ${path} first: a chart can only use a file you read in this answer.` };

  const title = str(a.title), unit = low(str(a.unit));
  if (!title || title.length > 60) return { error: "Give a title under 50 characters that states the finding." };
  if (!unit || unit.length > 24) return { error: "Give a short plural unit, such as \"certifications\"." };
  if (/[—<>]/.test(title + unit)) return { error: "No em dashes or angle brackets in the title or unit." };

  const lim = LIMITS[kind];
  const raw = Array.isArray(a.rows) ? a.rows : [];
  if (raw.length < 2 || raw.length > lim.rows) return { error: `A ${kind} chart takes 2 to ${lim.rows} rows.` };

  const field = low(str(a.count_field));
  const list = items(doc.text);
  const text = low(doc.text);
  const rows: Chart["rows"] = [];
  for (const r of raw) {
    const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
    const label = str(o.label), value = o.value, detail = str(o.detail).slice(0, 120);
    if (!label || label.length > lim.label) return { error: `Each ${kind} label needs 1 to ${lim.label} characters; "${label}" does not fit.` };
    if (rows.some((x) => low(x.label) === low(label))) return { error: `"${label}" appears twice.` };
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1e9) return { error: `"${label}" needs a value of 0 or more.` };
    if (!text.includes(low(label))) return { error: `"${label}" does not appear in ${path}. Use the file's own wording.` };
    const counted = list.filter((it) => it.some((l) => (!field || low(l).startsWith(`${field}:`)) && low(l).includes(low(label)))).length;
    if (value !== counted && !written(doc.text, value))
      return { error: `${value} for "${label}" is neither written in ${path} nor the count of its list items${field ? ` whose ${field} contains "${label}"` : " that contain it"} (${counted}). Fix the value or count_field.` };
    rows.push(detail ? { label, value, detail } : { label, value });
  }

  const hl = str(a.highlight);
  const highlight = rows.find((x) => low(x.label) === low(hl))?.label;
  if (hl && !highlight) return { error: `highlight "${hl}" is not one of the row labels.` };

  const chart: Chart = { kind, title, unit, rows, ...(highlight ? { highlight } : {}), source: sourceLine(doc) };
  return { chart, text: "The chart is shown under your answer. Now write the answer text; it should still state the finding." };
}
