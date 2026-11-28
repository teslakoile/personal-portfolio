import Anthropic from "@anthropic-ai/sdk";
import { featureEnabled } from "../../flags";
import { getKb } from "../../_kyllm/kb";
import { system } from "../../_kyllm/prompt";
import { TOOLS, runTool, stepLabel } from "../../_kyllm/tools";
import { SHOW_CHART, checkChart } from "../../_kyllm/chart";
import { SHOW_DIAGRAM, checkDiagram } from "../../_kyllm/diagram";
import { take } from "../../_kyllm/rateLimit";
import { checkCitations, readMeta } from "../../_kyllm/meta";
import { LIMITS, META_MARK, type StreamEvent, type Turn } from "../../_kyllm/protocol";
import { REWRITE_MODEL, REWRITE_SYSTEM, acceptRewrite, hasJoin, takeSentences } from "../../_kyllm/joins";

/**
 * POST /api/kyllm: one KYLLM answer, streamed as newline-delimited JSON
 * (StreamEvent). Claude Sonnet 5.5 at medium effort, with server-side refusal
 * fallback. The cached system prompt holds a catalog of the knowledge base
 * (app/_kyllm/kb.ts); the model reads his CV with read_cv and files with the
 * list, read, and grep tools (app/_kyllm/tools.ts) for up to MAX_TOOL_ROUNDS
 * rounds, then answers. With show_chart (app/_kyllm/chart.ts) or show_diagram
 * (app/_kyllm/diagram.ts) it can add one block, a chart or a diagram, checked
 * against a file it read and sent as a `chart` or `diagram` event. Each thinking block, tool call, and the answer text
 * stream as `step` events when they start and end. The answer text streams
 * as it arrives; the sources and follow-ups the model writes after META_MARK
 * are parsed, checked against the page's sections and links, and sent as one
 * `meta` event. A `check` step covers that part: it starts at META_MARK and
 * ends with whether every citation in the answer has a valid source. Every
 * round opens with a `think` step, from the request (or the tool results)
 * until the model's first text or tool call; after the first round its label
 * is "Reading What It Found".
 *
 * Off unless FEATURE_FLAGS.kyllm is on, KYLLM_API=1 is set (a preview
 * deployment), or the dev server is running. Needs ANTHROPIC_API_KEY, and
 * ANTHROPIC_WORKSPACE_ID when the key is not scoped to a workspace.
 */

const MODEL = "claude-sonnet-5-5";
/** tool rounds before the model must answer */
const MAX_TOOL_ROUNDS = 3;
const enabled = () => featureEnabled("kyllm") || process.env.KYLLM_API === "1" || process.env.NODE_ENV === "development";

let client: Anthropic | null = null;
// a key not scoped to a workspace has to name one on every request
const anthropic = () => (client ??= new Anthropic(
  process.env.ANTHROPIC_WORKSPACE_ID ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } } : {},
));

const fail = (status: number, message: string, headers?: Record<string, string>) =>
  Response.json({ error: message }, { status, headers });

/**
 * False when a browser on another site sends the request. Browsers always set
 * Origin on a cross-origin POST, so this keeps other pages from running KYLLM
 * on this key. Scripts can forge the header; the rate limit covers those.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try { return new URL(origin).host === host; } catch { return false; }
}

/** The visitor's question and the conversation so far, trimmed to the limits; null if malformed. */
function readBody(body: unknown): Turn[] | null {
  if (!body || typeof body !== "object") return null;
  const { question, history } = body as { question?: unknown; history?: unknown };
  if (typeof question !== "string") return null;
  const q = question.trim().slice(0, LIMITS.question);
  if (!q) return null;
  const turns: Turn[] = [];
  if (Array.isArray(history)) {
    let chars = 0;
    for (const t of history.slice(-LIMITS.history).reverse()) {
      if (!t || (t.role !== "user" && t.role !== "assistant") || typeof t.content !== "string" || !t.content.trim()) continue;
      chars += t.content.length;
      if (chars > LIMITS.historyChars) break;
      turns.unshift({ role: t.role, content: t.content });
    }
  }
  // the API wants user first and turns alternating; drop anything that breaks that
  while (turns[0]?.role === "assistant") turns.shift();
  const alternating = turns.filter((t, i) => i === 0 || t.role !== turns[i - 1].role);
  if (alternating.at(-1)?.role === "user") alternating.pop();
  return [...alternating, { role: "user", content: q }];
}

export async function POST(request: Request) {
  if (!enabled()) return fail(404, "Not found");
  if (!process.env.ANTHROPIC_API_KEY) return fail(503, "KYLLM is not configured.");
  if (!sameOrigin(request)) return fail(403, "Forbidden");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const allowed = take(ip);
  if (!allowed.ok) return fail(429, "Too many questions for now. Try again later.", { "Retry-After": String(allowed.retryAfter) });

  let messages: Turn[] | null = null;
  try { messages = readBody(await request.json()); } catch { /* malformed JSON */ }
  if (!messages) return fail(400, "Send a question.");

  const kb = await getKb();
  const started = Date.now();
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      let answer = "", meta = "", inMeta = false, held = "", pending = "", rewrites = 0;

      // one sentence with a ", so" or ", and" join, rewritten by a small model; the original when that fails or the rewrite can't be trusted
      const fix = async (sentence: string) => {
        try {
          const r = await anthropic().messages.create(
            { model: REWRITE_MODEL, max_tokens: 300, system: REWRITE_SYSTEM, messages: [{ role: "user", content: sentence.trim() }] },
            { timeout: 5000, maxRetries: 0 },
          );
          const text = r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
          const ok = acceptRewrite(sentence, text);
          if (ok) { rewrites++; return ok; }
        } catch { /* show the original sentence */ }
        return sentence;
      };
      // answer text goes out one finished sentence at a time, so a sentence with a join can be rewritten before anyone sees it
      const say = async (text: string, last = false) => {
        pending += text;
        const { done, rest } = takeSentences(pending);
        if (last && rest) done.push(rest);
        pending = last ? "" : rest;
        for (const s of done) {
          const v = hasJoin(s) ? await fix(s) : s;
          send({ t: "text", v }); answer += v;
        }
      };

      // emit text, but hold back a tail that could be the start of META_MARK
      const push = async (delta: string) => {
        if (inMeta) { meta += delta; return; }
        held += delta;
        const at = held.indexOf(META_MARK);
        if (at >= 0) {
          const before = held.slice(0, at).trimEnd();
          inMeta = true; meta = held.slice(at + META_MARK.length); held = "";
          await say(before, true);
          return;
        }
        let keep = 0;
        for (let n = Math.min(META_MARK.length - 1, held.length); n > 0; n--) if (META_MARK.startsWith(held.slice(-n))) { keep = n; break; }
        const out = held.slice(0, held.length - keep);
        held = held.slice(held.length - keep);
        if (out) await say(out);
      };

      let stepId = 0, writeId = 0, checkId = 0;
      // the answer's write step: starts with its first text, ends at the sources mark or the end
      const endWrite = () => { if (writeId > 0) { send({ t: "step", id: writeId, end: true }); writeId = -1; } };
      // the check step: starts where the writing ends, while the model writes its sources
      const startCheck = () => { if (!checkId) { checkId = ++stepId; send({ t: "step", id: checkId, kind: "check" }); } };
      let checks: { ok: boolean; detail: string } | null = null;
      const total = { in: 0, cacheRead: 0, cacheWrite: 0, out: 0, rounds: 0, tools: 0 };
      // files read in this answer, which a chart or diagram may use; and which block, if any, is drawn
      const read = new Set<string>();
      let block: "none" | "chart" | "diagram" | "rejected" = "none";
      // a think step opens every round: from the request (or the tool results) until the model's first text or tool call,
      // any thinking included. After a tool round the API often holds the answer text until it is all written, so this
      // step also covers that wait.
      let readId = ++stepId;
      send({ t: "step", id: readId, kind: "think" });
      const endRead = () => { if (readId) { send({ t: "step", id: readId, end: true }); readId = 0; } };

      try {
        const convo: Anthropic.Beta.BetaMessageParam[] = messages!.map((m) => ({ role: m.role, content: m.content }));
        let final: Anthropic.Beta.BetaMessage;
        for (let round = 0; ; round++) {
          if (round > 0) { readId = ++stepId; send({ t: "step", id: readId, kind: "think", label: "Reading What It Found" }); }
          const stream = anthropic().beta.messages.stream(
            {
              model: MODEL,
              max_tokens: 8000,
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
              output_config: { effort: "medium" },
              tools: [...TOOLS, SHOW_CHART, SHOW_DIAGRAM],
              // after the last tool round the model has to answer with what it has read
              tool_choice: round < MAX_TOOL_ROUNDS ? { type: "auto" } : { type: "none" },
              system: [{ type: "text", text: system(kb.catalog), cache_control: { type: "ephemeral", ttl: "1h" } }],
              messages: convo,
            },
            { signal: request.signal },
          );
          const thinking = new Map<number, number>(); // content block index -> step id
          for await (const event of stream) {
            if (event.type === "content_block_start") {
              const b = event.content_block;
              if (b.type === "thinking" || b.type === "redacted_thinking") {
                if (readId) continue; // part of the first step
                thinking.set(event.index, ++stepId);
                send({ t: "step", id: stepId, kind: "think" });
              } else if (b.type === "text") {
                // after a tool round the API sends the answer in one burst at the end, so the round's wait was the
                // model writing: the step becomes the write step, from the round's start. A tool call ends the step
                // once the call is complete, when its own step starts.
                if (readId && round > 0 && writeId === 0) { writeId = readId; readId = 0; send({ t: "step", id: writeId, kind: "write" }); }
                else endRead();
              }
              if (b.type === "text" && writeId === 0) {
                writeId = ++stepId;
                send({ t: "step", id: writeId, kind: "write" });
              }
            } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const wasMeta = inMeta;
              await push(event.delta.text);
              if (!wasMeta && inMeta) { endWrite(); startCheck(); }
            } else if (event.type === "content_block_stop") {
              const id = thinking.get(event.index);
              if (id) { send({ t: "step", id, end: true }); thinking.delete(event.index); }
            }
          }
          final = await stream.finalMessage();
          endRead();
          const u = final.usage;
          total.in += u.input_tokens; total.cacheRead += u.cache_read_input_tokens ?? 0; total.cacheWrite += u.cache_creation_input_tokens ?? 0; total.out += u.output_tokens;
          total.rounds = round + 1;

          const uses = final.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
          if (final.stop_reason !== "tool_use" || !uses.length) break;

          // run every call of this round together and return all results in one message
          total.tools += uses.length;
          const results = uses.map((use): Anthropic.Beta.BetaToolResultBlockParam => {
            const id = ++stepId;
            send({ t: "step", id, kind: "tool", name: use.name, ...stepLabel(kb, use.name, use.input), args: use.input });
            let r: { text: string; error?: boolean };
            const drawn = block === "chart" || block === "diagram";
            if (use.name === SHOW_CHART.name) {
              const c = drawn ? { error: `A ${block} is already shown in this answer; an answer takes one.` } : checkChart(kb, read, use.input);
              if ("chart" in c) { send({ t: "chart", chart: c.chart }); block = "chart"; r = { text: c.text }; }
              else { r = { text: c.error, error: true }; if (!drawn) block = "rejected"; }
            } else if (use.name === SHOW_DIAGRAM.name) {
              const c = drawn ? { error: `A ${block} is already shown in this answer; an answer takes one.` } : checkDiagram(kb, read, use.input);
              if ("diagram" in c) { send({ t: "diagram", diagram: c.diagram }); block = "diagram"; r = { text: c.text }; }
              else { r = { text: c.error, error: true }; if (!drawn) block = "rejected"; }
            } else {
              r = runTool(kb, use.name, use.input);
              const path = (use.input as { path?: unknown })?.path;
              if (use.name === "read" && !r.error && typeof path === "string") read.add(path.trim().replace(/^\.?\/+/, ""));
            }
            send({ t: "step", id, end: true, ok: !r.error });
            // the last tool round: say so, or the model may spend the answer round on another call and write nothing
            const text = round === MAX_TOOL_ROUNDS - 1 ? `${r.text}\n\nThat was your last tool call. Write the answer now from what you have read.` : r.text;
            return { type: "tool_result", tool_use_id: use.id, content: text, ...(r.error ? { is_error: true } : {}) };
          });
          convo.push({ role: "assistant", content: final.content }, { role: "user", content: results });
        }
        if (!inMeta) { await say(held, true); held = ""; }
        endWrite();

        if (!answer.trim() && final.stop_reason !== "refusal") {
          // the model ended without writing anything: say so instead of showing an empty answer
          send({ t: "text", v: "KYLLM couldn't put an answer together for that one. Try asking it another way, or email Kyle at kyle.naranjo@gmail.com." });
          send({ t: "meta", sources: [], next: [] });
        } else if (final.stop_reason === "refusal" && !answer.trim()) {
          send({ t: "text", v: "I can only answer questions about Kyle's work. For anything else, email Kyle at kyle.naranjo@gmail.com." });
          send({ t: "meta", sources: [], next: [] });
        } else {
          startCheck();
          const m = readMeta(meta);
          const result = checkCitations(answer, m.sources);
          send({ t: "meta", ...m });
          send({ t: "step", id: checkId, end: true, ...result });
          checks = result;
        }
        send({ t: "done" });

        console.log(JSON.stringify({
          kyllm: {
            ms: Date.now() - started, model: final.model, stop: final.stop_reason, ...total,
            turns: messages!.length, metaOk: inMeta, check: checks, block, rewrites,
          },
        }));
      } catch (err) {
        if (request.signal.aborted) { controller.close(); return; }
        const status = err instanceof Anthropic.APIError ? err.status : undefined;
        console.error(JSON.stringify({ kyllm: { error: err instanceof Error ? err.message.slice(0, 300) : "unknown", status, ms: Date.now() - started } }));
        send({ t: "error", v: status === 429 || status === 529 ? "KYLLM is busy right now. Try again in a minute." : "KYLLM couldn't answer just now. Try again, or email Kyle at kyle.naranjo@gmail.com." });
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
