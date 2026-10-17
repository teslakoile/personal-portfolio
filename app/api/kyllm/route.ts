import Anthropic from "@anthropic-ai/sdk";
import { featureEnabled } from "../../flags";
import { SYSTEM } from "../../_kyllm/prompt";
import { take } from "../../_kyllm/rateLimit";
import { LIMITS, LINKS, META_MARK, SECTIONS, type Source, type StreamEvent, type Turn } from "../../_kyllm/protocol";

/**
 * POST /api/kyllm: one KYLLM answer, streamed as newline-delimited JSON
 * (StreamEvent). Claude Sonnet 5.5 at medium effort, with the CV and site
 * content in a cached system prompt (app/_kyllm/prompt.ts) and server-side
 * refusal fallback. The answer text streams as it arrives; the sources and
 * follow-ups the model writes after META_MARK are parsed, checked against the
 * page's sections and links, and sent as one `meta` event.
 *
 * Off unless FEATURE_FLAGS.kyllm is on, KYLLM_API=1 is set (a preview
 * deployment), or the dev server is running. Needs ANTHROPIC_API_KEY, and
 * ANTHROPIC_WORKSPACE_ID when the key is not scoped to a workspace.
 */

const MODEL = "claude-sonnet-5-5";
const enabled = () => featureEnabled("kyllm") || process.env.KYLLM_API === "1" || process.env.NODE_ENV === "development";

let client: Anthropic | null = null;
// a key not scoped to a workspace has to name one on every request
const anthropic = () => (client ??= new Anthropic(
  process.env.ANTHROPIC_WORKSPACE_ID ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } } : {},
));

const fail = (status: number, message: string, headers?: Record<string, string>) =>
  Response.json({ error: message }, { status, headers });

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

/** The sources and follow-ups the model wrote after META_MARK, keeping only valid entries. */
function readMeta(raw: string): { sources: Source[]; next: string[] } {
  const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return { sources: [], next: [] };
  try {
    const m = JSON.parse(raw.slice(start, end + 1)) as { sources?: unknown; next?: unknown };
    const sources: Source[] = (Array.isArray(m.sources) ? m.sources : []).flatMap((s): Source[] => {
      if (s && typeof s === "object" && "section" in s && typeof s.section === "string" && s.section in SECTIONS)
        return [{ section: s.section as keyof typeof SECTIONS, name: typeof s.name === "string" ? s.name.slice(0, 60) : "" }];
      if (s && typeof s === "object" && "link" in s && typeof s.link === "string" && s.link in LINKS)
        return [{ link: s.link as keyof typeof LINKS }];
      return [];
    });
    // one chip per source, even if the model listed one twice
    const seen = new Set<string>();
    const unique = sources.filter((x) => { const k = JSON.stringify(x); return seen.has(k) ? false : (seen.add(k), true); });
    const next = (Array.isArray(m.next) ? m.next : []).filter((x): x is string => typeof x === "string" && x.length < 90).slice(0, 2);
    return { sources: unique, next };
  } catch {
    return { sources: [], next: [] };
  }
}

export async function POST(request: Request) {
  if (!enabled()) return fail(404, "Not found");
  if (!process.env.ANTHROPIC_API_KEY) return fail(503, "KYLLM is not configured.");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const allowed = take(ip);
  if (!allowed.ok) return fail(429, "Too many questions for now. Try again later.", { "Retry-After": String(allowed.retryAfter) });

  let messages: Turn[] | null = null;
  try { messages = readBody(await request.json()); } catch { /* malformed JSON */ }
  if (!messages) return fail(400, "Send a question.");

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

      try {
        const stream = anthropic().beta.messages.stream(
          {
            model: MODEL,
            max_tokens: 4000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            output_config: { effort: "medium" },
            system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral", ttl: "1h" } }],
            messages,
          },
          { signal: request.signal },
        );
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") push(event.delta.text);
        }
        const final = await stream.finalMessage();
        if (!inMeta && held) { send({ t: "text", v: held }); answer += held; }

        if (final.stop_reason === "refusal" && !answer.trim()) {
          send({ t: "text", v: "I can only answer questions about Kyle's work. For anything else, email Kyle at kyle.naranjo@gmail.com." });
          send({ t: "meta", sources: [], next: [] });
        } else {
          send({ t: "meta", ...readMeta(meta) });
        }
        send({ t: "done" });

        const u = final.usage;
        console.log(JSON.stringify({
          kyllm: {
            ms: Date.now() - started, model: final.model, stop: final.stop_reason,
            in: u.input_tokens, cacheRead: u.cache_read_input_tokens, cacheWrite: u.cache_creation_input_tokens, out: u.output_tokens,
            turns: messages!.length, metaOk: inMeta,
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
