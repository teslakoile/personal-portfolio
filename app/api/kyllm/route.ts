import Anthropic from "@anthropic-ai/sdk";
import { featureEnabled } from "../../flags";
import { getKb } from "../../_kyllm/kb";
import { system } from "../../_kyllm/prompt";
import { TOOLS, runTool, stepLabel } from "../../_kyllm/tools";
import { take } from "../../_kyllm/rateLimit";
import { LIMITS, LINKS, META_MARK, SECTIONS, type Source, type StreamEvent, type Turn } from "../../_kyllm/protocol";

/**
 * POST /api/kyllm: one KYLLM answer, streamed as newline-delimited JSON
 * (StreamEvent). Claude Sonnet 5.5 at medium effort, with server-side refusal
 * fallback. The cached system prompt holds the CV and a catalog of the
 * knowledge base (app/_kyllm/kb.ts); the model reads files with the list,
 * read, and grep tools (app/_kyllm/tools.ts) for up to MAX_TOOL_ROUNDS
 * rounds, then answers. Each thinking block, tool call, and the answer text
 * stream as `step` events when they start and end. The answer text streams
 * as it arrives; the sources and follow-ups the model writes after META_MARK
 * are parsed, checked against the page's sections and links, and sent as one
 * `meta` event. A `check` step covers that part: it starts at META_MARK and
 * ends with whether every citation in the answer has a valid source.
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

/**
 * The sources and follow-ups the model wrote after META_MARK. sources[n - 1]
 * stays the source for citation [n]; an entry that names no known section or
 * link becomes null, so later numbers keep their place.
 */
function readMeta(raw: string): { sources: (Source | null)[]; next: string[] } {
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
function checkCitations(answer: string, sources: (Source | null)[]): { ok: boolean; detail: string } {
  const cited = [...new Set([...answer.matchAll(/\[(\d+)\]/g)].map((x) => Number(x[1])))];
  const bad = cited.filter((n) => !sources[n - 1]).length;
  const valid = sources.filter(Boolean).length;
  // Title Case, like the chat's other step labels
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  if (bad) return { ok: false, detail: `${plural(bad, "Citation")} Without a Source, Hidden` };
  return { ok: true, detail: cited.length ? `${plural(valid, "Source")}, ${plural(cited.length, "Citation")}` : "No Citations" };
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
      let answer = "", meta = "", inMeta = false, held = "";

      // emit text, but hold back a tail that could be the start of META_MARK
      const push = (delta: string) => {
        if (inMeta) { meta += delta; return; }
        held += delta;
        const at = held.indexOf(META_MARK);
        if (at >= 0) {
          const before = held.slice(0, at).trimEnd();
          if (before) { send({ t: "text", v: before }); answer += before; }
          inMeta = true; meta = held.slice(at + META_MARK.length); held = "";
          return;
        }
        let keep = 0;
        for (let n = Math.min(META_MARK.length - 1, held.length); n > 0; n--) if (META_MARK.startsWith(held.slice(-n))) { keep = n; break; }
        const out = held.slice(0, held.length - keep);
        if (out) { send({ t: "text", v: out }); answer += out; }
        held = held.slice(held.length - keep);
      };

      let stepId = 0, writeId = 0, checkId = 0;
      // the answer's write step: starts with its first text, ends at the sources mark or the end
      const endWrite = () => { if (writeId > 0) { send({ t: "step", id: writeId, end: true }); writeId = -1; } };
      // the check step: starts where the writing ends, while the model writes its sources
      const startCheck = () => { if (!checkId) { checkId = ++stepId; send({ t: "step", id: checkId, kind: "check" }); } };
      let checks: { ok: boolean; detail: string } | null = null;
      const total = { in: 0, cacheRead: 0, cacheWrite: 0, out: 0, rounds: 0, tools: 0 };

      try {
        const convo: Anthropic.Beta.BetaMessageParam[] = messages!.map((m) => ({ role: m.role, content: m.content }));
        let final: Anthropic.Beta.BetaMessage;
        for (let round = 0; ; round++) {
          const stream = anthropic().beta.messages.stream(
            {
              model: MODEL,
              max_tokens: 8000,
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
              output_config: { effort: "medium" },
              tools: TOOLS,
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
                thinking.set(event.index, ++stepId);
                send({ t: "step", id: stepId, kind: "think" });
              } else if (b.type === "text" && writeId === 0) {
                writeId = ++stepId;
                send({ t: "step", id: writeId, kind: "write" });
              }
            } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const wasMeta = inMeta;
              push(event.delta.text);
              if (!wasMeta && inMeta) { endWrite(); startCheck(); }
            } else if (event.type === "content_block_stop") {
              const id = thinking.get(event.index);
              if (id) { send({ t: "step", id, end: true }); thinking.delete(event.index); }
            }
          }
          final = await stream.finalMessage();
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
            const r = runTool(kb, use.name, use.input);
            send({ t: "step", id, end: true, ok: !r.error });
            return { type: "tool_result", tool_use_id: use.id, content: r.text, ...(r.error ? { is_error: true } : {}) };
          });
          convo.push({ role: "assistant", content: final.content }, { role: "user", content: results });
        }
        if (!inMeta && held) { send({ t: "text", v: held }); answer += held; }
        endWrite();

        if (final.stop_reason === "refusal" && !answer.trim()) {
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
            turns: messages!.length, metaOk: inMeta, check: checks,
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
