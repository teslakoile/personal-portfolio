/**
 * KYLLM's tools as a stdio MCP server, so the eval can run KYLLM on local
 * Claude Code (`claude -p`) instead of the API. It runs the same code the
 * route runs (app/api/kyllm/route.ts): the knowledge base, list/read/grep,
 * read_cv, and the show_chart and show_diagram checks, with the same
 * per-answer state (files read, one block per answer).
 *
 * Every call is appended to the JSONL file in KYLLM_EVAL_LOG, which the
 * runner (run.mts) grades from. One server process serves one question.
 */
import { appendFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

// the knowledge base reads content/ relative to the repo root
process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), "../.."));
const { getKb } = await import("../../app/_kyllm/kb");
const { TOOLS, runTool } = await import("../../app/_kyllm/tools");
const { SHOW_CHART, checkChart } = await import("../../app/_kyllm/chart");
const { SHOW_DIAGRAM, checkDiagram } = await import("../../app/_kyllm/diagram");

const kb = await getKb();
const LOG = process.env.KYLLM_EVAL_LOG;
const log = (x: unknown) => { if (LOG) appendFileSync(LOG, `${JSON.stringify(x)}\n`); };
const read = new Set<string>();
let block: "none" | "chart" | "diagram" = "none";

function call(name: string, input: unknown): { text: string; error?: boolean } {
  if (name === SHOW_CHART.name || name === SHOW_DIAGRAM.name) {
    if (block !== "none") return { text: `A ${block} is already shown in this answer; an answer takes one.`, error: true };
    const r = name === SHOW_CHART.name ? checkChart(kb, read, input) : checkDiagram(kb, read, input);
    if ("error" in r) return { text: r.error, error: true };
    block = name === SHOW_CHART.name ? "chart" : "diagram";
    log({ block, spec: "chart" in r ? r.chart : r.diagram });
    return { text: r.text };
  }
  const r = runTool(kb, name, input);
  const path = (input as { path?: unknown })?.path;
  if (name === "read" && !r.error && typeof path === "string") read.add(path.trim().replace(/^\.?\/+/, ""));
  return r;
}

const send = (msg: unknown) => process.stdout.write(`${JSON.stringify(msg)}\n`);
const tools = [...TOOLS, SHOW_CHART, SHOW_DIAGRAM].map((t) => ({ name: t.name, description: t.description, inputSchema: t.input_schema }));

createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  const m = JSON.parse(line) as { id?: number | string; method: string; params?: Record<string, unknown> };
  if (m.id === undefined) return; // notifications need no reply
  if (m.method === "initialize")
    return send({ jsonrpc: "2.0", id: m.id, result: { protocolVersion: m.params?.protocolVersion ?? "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "kyllm", version: "1" } } });
  if (m.method === "tools/list") return send({ jsonrpc: "2.0", id: m.id, result: { tools } });
  if (m.method === "tools/call") {
    const name = String(m.params?.name ?? ""), input = m.params?.arguments ?? {};
    const r = call(name, input);
    log({ tool: name, input, ok: !r.error, ...(r.error ? { error: r.text.slice(0, 600) } : {}) });
    return send({ jsonrpc: "2.0", id: m.id, result: { content: [{ type: "text", text: r.text }], isError: !!r.error } });
  }
  if (m.method === "ping") return send({ jsonrpc: "2.0", id: m.id, result: {} });
  send({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: `No method ${m.method}` } });
});
