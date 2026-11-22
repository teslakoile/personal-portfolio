import type Anthropic from "@anthropic-ai/sdk";
import type { Kb } from "./kb";
import { SECTIONS } from "./protocol";
import { CV } from "./cv";

/**
 * The tools KYLLM reads its knowledge base with. Every file is raw text from
 * app/_kyllm/kb.ts, held in memory, so a call never touches the filesystem or
 * the network.
 */

export const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "read_cv",
    description: "Read Kyle's CV: his roles, employers, dates, education, certifications, awards, and skills. It is the source to trust first.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list",
    description: "List the files in a folder of Kyle's knowledge base, with each file's title. Pass \"\" for the top level, or a folder such as \"projects\" or \"talks\".",
    input_schema: { type: "object", properties: { dir: { type: "string", description: "Folder to list, \"\" for the top level" } }, required: ["dir"] },
  },
  {
    name: "read",
    description: "Read one file of Kyle's knowledge base as raw text with line numbers. Long files come back in pages: pass offset to read further.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path from the catalog, e.g. \"projects/wishlist.md\"" },
        offset: { type: "integer", description: "First line to return, 1-based. Default 1" },
      },
      required: ["path"],
    },
  },
  {
    name: "grep",
    description: "Find lines that contain a word or phrase across Kyle's knowledge base, case-insensitive. Separate alternatives with |, e.g. \"Dagster|Airflow\". Returns path, line number, and the line.",
    input_schema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Text to find; | separates alternatives" },
        dir: { type: "string", description: "Limit the search to one folder. Omit to search everything" },
      },
      required: ["pattern"],
    },
  },
];

const PAGE = 200; // lines per read
const MAX_CHARS = 20_000; // per tool result
const MAX_MATCHES = 40;

export type ToolResult = { text: string; error?: boolean };

const cap = (s: string) => (s.length > MAX_CHARS ? `${s.slice(0, MAX_CHARS)}\n[cut at ${MAX_CHARS} characters]` : s);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const dirOf = (v: unknown) => str(v).trim().replace(/^\.?\/+|\/+$/g, "");

function list(kb: Kb, dir: string): ToolResult {
  const prefix = dir ? `${dir}/` : "";
  const files = kb.docs.filter((d) => d.path.startsWith(prefix));
  if (!files.length) return { text: `No folder "${dir}". Top-level entries: ${top(kb).join(", ")}`, error: true };
  const here = new Map<string, string>();
  for (const d of files) {
    const rest = d.path.slice(prefix.length);
    const cut = rest.indexOf("/");
    if (cut < 0) here.set(rest, d.title);
    else {
      const sub = rest.slice(0, cut + 1);
      here.set(sub, `${files.filter((f) => f.path.startsWith(prefix + sub)).length} files`);
    }
  }
  return { text: [...here].map(([name, info]) => `${prefix}${name}  ${info}`).join("\n") };
}

const top = (kb: Kb) => [...new Set(kb.docs.map((d) => (d.path.includes("/") ? `${d.path.split("/")[0]}/` : d.path)))];

function read(kb: Kb, path: string, offset: unknown): ToolResult {
  const doc = kb.byPath.get(path.trim().replace(/^\.?\/+/, ""));
  if (!doc) {
    const near = kb.docs.filter((d) => d.path.includes(path.split("/").pop()?.replace(/\.md$/, "") || "\0")).map((d) => d.path);
    return { text: `No file "${path}".${near.length ? ` Did you mean: ${near.join(", ")}?` : " Use list or the catalog for exact paths."}`, error: true };
  }
  const lines = doc.text.split("\n");
  const from = Math.max(1, Math.min(lines.length, Number.isInteger(offset) ? (offset as number) : 1));
  const to = Math.min(lines.length, from + PAGE - 1);
  const body = lines.slice(from - 1, to).map((l, i) => `${String(from + i).padStart(4)}| ${l}`).join("\n");
  const more = to < lines.length ? `\n[lines ${from}-${to} of ${lines.length}; read again with offset ${to + 1} for more]` : "";
  return { text: cap(`${doc.path}\n${body}${more}`) };
}

function grep(kb: Kb, pattern: string, dir: string): ToolResult {
  const terms = pattern.split("|").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10);
  if (!terms.length) return { text: "Give a word or phrase to find.", error: true };
  const prefix = dir ? `${dir}/` : "";
  const hits: string[] = [];
  let total = 0;
  for (const d of kb.docs) {
    if (!d.path.startsWith(prefix)) continue;
    d.text.split("\n").forEach((line, i) => {
      const low = line.toLowerCase();
      if (!terms.some((t) => low.includes(t))) return;
      total++;
      if (hits.length < MAX_MATCHES) hits.push(`${d.path}:${i + 1}: ${line.trim().slice(0, 200)}`);
    });
  }
  if (!hits.length) return { text: `No lines match "${pattern}"${dir ? ` in ${dir}/` : ""}.` };
  return { text: cap(hits.join("\n") + (total > hits.length ? `\n[${total - hits.length} more matches; narrow the pattern or the folder]` : "")) };
}

/** Runs one tool call. Inputs come from the model, so every field is checked here. */
export function runTool(kb: Kb, name: string, input: unknown): ToolResult {
  const a = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (name === "read_cv") return { text: CV };
  if (name === "list") return list(kb, dirOf(a.dir));
  if (name === "read") return str(a.path) ? read(kb, str(a.path), a.offset) : { text: "Give a file path.", error: true };
  if (name === "grep") return grep(kb, str(a.pattern).slice(0, 200), dirOf(a.dir));
  return { text: `No tool named "${name}".`, error: true };
}

/** The row a tool call shows in the chat's steps, in Title Case: "Looking Up Wishlist", with the file's section as detail. Search terms keep their own case. */
export function stepLabel(kb: Kb, name: string, input: unknown): { label: string; detail: string } {
  const a = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  // "MCP|agent" reads as "MCP or agent"; the folder shows only when the search is limited to one
  const terms = (p: string) => {
    const xs = p.split("|").map((x) => x.trim()).filter(Boolean).slice(0, 4);
    return xs.length > 2 ? `${xs.slice(0, -1).join(", ")}, or ${xs.at(-1)}` : xs.join(" or ");
  };
  if (name === "read_cv") return { label: "Looking Up His CV", detail: "CV" };
  if (name === "read") {
    const doc = kb.byPath.get(str(a.path).trim().replace(/^\.?\/+/, ""));
    return doc ? { label: `Looking Up ${doc.title}`, detail: SECTIONS[doc.section] } : { label: `Looking Up ${str(a.path)}`, detail: "" };
  }
  if (name === "show_chart" || name === "show_diagram") {
    const doc = kb.byPath.get(str(a.source).trim().replace(/^\.?\/+/, ""));
    return { label: name === "show_chart" ? "Drawing a Chart" : "Drawing a Diagram", detail: doc ? SECTIONS[doc.section] : "" };
  }
  if (name === "grep") return { label: `Searching for ${terms(str(a.pattern).slice(0, 80))}`, detail: dirOf(a.dir) ? `In ${dirOf(a.dir)}/` : "" };
  return { label: `Listing ${dirOf(a.dir) ? `${dirOf(a.dir)}/` : "All Files"}`, detail: "" };
}
