/**
 * KYLLM eval on local Claude Code: each question runs through `claude -p`
 * with KYLLM's system prompt, model, and effort, and KYLLM's own tools from
 * the MCP server in mcp.mts, so it uses your Claude Code login instead of the
 * API key. Grading is code only: which tools ran, which block was drawn, and
 * what the answer says (cases.mts).
 *
 *   npx tsx scripts/kyllm-eval/run.mts                  every case, 4 at a time
 *   npx tsx scripts/kyllm-eval/run.mts --only d-servo,c-years
 *   npx tsx scripts/kyllm-eval/run.mts --prompt my-prompt.txt --label casual
 *   npx tsx scripts/kyllm-eval/run.mts --runs 3         each case three times
 *
 * Writes results.json and report.md (every answer, for reading the tone) to
 * scripts/kyllm-eval/results/<time>-<label>/. Sign in with `claude` then
 * /login first; an expired login fails every case.
 *
 * Differences from the live route: tool names carry Claude Code's
 * mcp__kyllm__ prefix, and the round limit is --max-turns, not the route's
 * forced answer round.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CASES, type Case } from "./cases.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
process.chdir(ROOT);
const { getKb } = await import("../../app/_kyllm/kb");
const { system } = await import("../../app/_kyllm/prompt");
const { META_MARK } = await import("../../app/_kyllm/protocol");
const { readMeta, checkCitations } = await import("../../app/_kyllm/meta");
const { JOIN, REWRITE_MODEL, REWRITE_SYSTEM, acceptRewrite, hasJoin, takeSentences } = await import("../../app/_kyllm/joins");
const noRewrite = process.argv.includes("--no-rewrite");

const MODEL = "claude-sonnet-5-5", EFFORT = "medium";
const arg = (k: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined; };
const only = arg("only")?.split(",");
const runs = Number(arg("runs") ?? 1), limit = Number(arg("concurrency") ?? 4);
const label = arg("label") ?? "base";
const promptText = arg("prompt") ? readFileSync(resolve(arg("prompt")!), "utf8") : system((await getKb()).catalog);

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const OUT = join(HERE, "results", `${stamp}-${label}`);
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "system.txt"), promptText);
const TOOLS = ["read_cv", "list", "read", "grep", "show_chart", "show_diagram"].map((t) => `mcp__kyllm__${t}`);

type Call = { tool?: string; input?: Record<string, unknown>; ok?: boolean; error?: string; block?: string };
type Result = { id: string; run: number; q: string; group: string; ms: number; turns: number; answer: string; next: string[];
  calls: Call[]; block: string; joins: number; rewrites: number; checks: Record<string, boolean>; error?: string };

/** The route's rewrite step, through local Claude Code: each sentence with a ", so" or ", and" join goes to the small model. */
function rewriteJoins(answer: string): { text: string; rewrites: number; joins: number } {
  const { done, rest } = takeSentences(answer + " ");
  const parts = rest.trim() ? [...done, rest] : done;
  let rewrites = 0, joins = 0;
  const out = parts.map((s) => {
    if (!hasJoin(s)) return s;
    joins++;
    if (noRewrite) return s;
    const cwd = mkdtempSync(join(tmpdir(), "kyllm-rewrite-"));
    const r = spawnSync("claude", ["-p", s.trim(), "--system-prompt", REWRITE_SYSTEM, "--model", REWRITE_MODEL, "--tools", "", "--setting-sources", "", "--strict-mcp-config", "--no-session-persistence"], { cwd, encoding: "utf8", timeout: 60_000 });
    rmSync(cwd, { recursive: true, force: true });
    const ok = acceptRewrite(s, r.stdout ?? "");
    if (ok) rewrites++;
    return ok ?? s;
  });
  return { text: out.join("").trim(), rewrites, joins };
}

/** One question through local Claude Code. */
function ask(c: Case, run: number): Promise<Result> {
  const dir = join(OUT, "runs", `${c.id}-${run}`);
  mkdirSync(dir, { recursive: true });
  const logFile = join(dir, "tools.jsonl");
  writeFileSync(join(dir, "mcp.json"), JSON.stringify({ mcpServers: { kyllm: { command: "npx", args: ["--yes", "tsx", join(HERE, "mcp.mts")], env: { KYLLM_EVAL_LOG: logFile } } } }));
  const args = ["-p", c.q, "--system-prompt-file", join(OUT, "system.txt"), "--model", MODEL, "--effort", EFFORT,
    "--tools", "", "--mcp-config", join(dir, "mcp.json"), "--strict-mcp-config", "--allowedTools", TOOLS.join(","),
    "--setting-sources", "", "--no-session-persistence", "--max-turns", "8", "--output-format", "stream-json", "--verbose"];
  const t0 = Date.now();
  return new Promise((done) => {
    // runs from an empty temp folder outside the repo, so no CLAUDE.md or project memory reaches KYLLM's instructions
    const cwd = mkdtempSync(join(tmpdir(), "kyllm-eval-"));
    const p = spawn("claude", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
    const kill = setTimeout(() => p.kill(), 240_000);
    p.on("close", () => {
      clearTimeout(kill);
      rmSync(cwd, { recursive: true, force: true });
      writeFileSync(join(dir, "stream.ndjson"), out);
      const events = out.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } });
      const result = events.find((e) => e.type === "result");
      const raw: string = result?.result ?? "";
      const calls: Call[] = existsSync(logFile) ? readFileSync(logFile, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
      const at = raw.indexOf(META_MARK);
      const fixed = rewriteJoins((at < 0 ? raw : raw.slice(0, at)).trim());
      const answer = fixed.text;
      const meta = readMeta(at < 0 ? "" : raw.slice(at + META_MARK.length));
      const block = calls.find((x) => x.block)?.block ?? "none";
      const failed = result?.is_error || /Failed to authenticate|OAuth/.test(raw) ? (raw || err).slice(0, 200) : undefined;
      done({ id: c.id, run, q: c.q, group: c.group, ms: Date.now() - t0, turns: result?.num_turns ?? 0, answer, next: meta.next,
        calls: calls.filter((x) => x.tool), block, joins: fixed.joins, rewrites: fixed.rewrites, checks: grade(c, answer, at >= 0, meta, calls, block), ...(failed ? { error: failed } : {}) });
    });
  });
}

const EMAIL = "kyle.naranjo@gmail.com";
// tics from the declauding skill's linter (declaude/, MIT, oaustegard/claude-skills v0.13.0). A list that starts
// with ", including" is not a tic. Its triad and
// repetition flags fire on real lists and on one-answer text, so they don't count.
const LOOSE = new Set(["triad", "density", "reuse"]);
function tics(answer: string): string[] {
  const r = spawnSync("python3", ["-I", join(HERE, "declaude", "declaude_lint.py"), "--json", "-"], { input: answer, encoding: "utf8" });
  try { return (JSON.parse(r.stdout).hits as { category: string; match: string }[]).filter((h) => !LOOSE.has(h.category) && !(h.category === "participle" && /^,\s*including\b/i.test(h.match))).map((h) => `${h.category}: ${h.match.trim()}`); }
  catch { return []; }
}
function grade(c: Case, answer: string, hasMeta: boolean, meta: ReturnType<typeof readMeta>, calls: Call[], block: string): Record<string, boolean> {
  const used = (t: string) => calls.some((x) => x.tool === t && x.ok);
  const readPaths = calls.filter((x) => x.tool === "read" && x.ok).map((x) => String(x.input?.path ?? "").replace(/^\.?\/+/, ""));
  const low = answer.toLowerCase();
  const k: Record<string, boolean> = {
    format: hasMeta && meta.next.length === 2,
    citations: checkCitations(answer, meta.sources).ok,
    "no em dash": !answer.includes("—"),
    "no markdown": !/\*\*|^#+ /m.test(answer),
    "no AI tics": tics(answer).length === 0,
    // "The A does B, so C." and "A, and B." joining two statements read as AI-written; "so that" and lists are fine
    'no ", so" join': !/,\s*so (?!that\b)/i.test(answer),
    'no ", and" join': !JOIN.test(answer),
  };
  if (c.cv !== undefined) k[c.cv ? "reads CV" : "skips CV"] = used("read_cv") === c.cv;
  if (c.files) k["reads its file"] = c.files.every((f) => readPaths.includes(f));
  if (c.block) k[c.block === "none" ? "no block" : `draws ${c.block}`] = block === c.block;
  if (c.decline !== undefined) k[c.decline ? "declines" : "answers"] = low.includes(EMAIL) === c.decline;
  if (c.unknown) k["says not covered"] = low.includes(EMAIL) || /\b(doesn't|does not|don't|do not|no mention|isn't|not (listed|mentioned|covered))\b/i.test(answer);
  if (c.mention) k["mentions facts"] = c.mention.every((m) => low.includes(m.toLowerCase()));
  if (c.avoid) k["avoids leaks"] = c.avoid.every((r) => !r.test(answer));
  return k;
}

// run the cases, a few at a time
const queue = CASES.filter((c) => !only || only.includes(c.id)).flatMap((c) => Array.from({ length: runs }, (_, r) => ({ c, r })));
const results: Result[] = [];
let next = 0;
await Promise.all(Array.from({ length: Math.min(limit, queue.length) }, async () => {
  while (next < queue.length) {
    const { c, r } = queue[next++];
    const res = await ask(c, r);
    results.push(res);
    const bad = Object.entries(res.checks).filter(([, v]) => !v).map(([n]) => n);
    console.log(`${res.error ? "ERROR" : bad.length ? "FAIL " : "pass "} ${c.id}${runs > 1 ? `#${r}` : ""} ${(res.ms / 1000).toFixed(1)}s ${res.error ?? bad.join(", ")}`);
  }
}));
results.sort((a, b) => CASES.findIndex((c) => c.id === a.id) - CASES.findIndex((c) => c.id === b.id) || a.run - b.run);

// pass rate per check, across the cases that have it
const byCheck = new Map<string, [number, number]>();
for (const r of results) for (const [n, v] of Object.entries(r.checks)) { const t = byCheck.get(n) ?? [0, 0]; byCheck.set(n, [t[0] + (v ? 1 : 0), t[1] + 1]); }
const summary = [...byCheck].map(([n, [p, t]]) => `${n.padEnd(18)} ${p}/${t}`).join("\n");
const allPass = results.filter((r) => !r.error && Object.values(r.checks).every(Boolean)).length;
const ms = results.map((r) => r.ms).sort((a, b) => a - b);
const joined = results.reduce((n, r) => n + r.joins, 0), fixedN = results.reduce((n, r) => n + r.rewrites, 0);
console.log(`\n${label}: ${allPass}/${results.length} answers pass every check; median ${(ms[Math.floor(ms.length / 2)] / 1000).toFixed(1)}s\nsentences with a join before the rewrite: ${joined}; rewritten: ${fixedN}\n${summary}\nResults in ${OUT}`);

writeFileSync(join(OUT, "results.json"), JSON.stringify({ label, model: MODEL, effort: EFFORT, results }, null, 2));
writeFileSync(join(OUT, "report.md"), [`# KYLLM eval: ${label}`, "", `${allPass}/${results.length} answers pass every check.`, "", "```", summary, "```", "",
  ...results.map((r) => {
    const bad = Object.entries(r.checks).filter(([, v]) => !v).map(([n]) => n);
    return [`## ${r.id}: ${r.q}`, "", `${bad.length ? `Fails: ${bad.join(", ")}` : "Passes"}${tics(r.answer).length ? ` · tics: ${tics(r.answer).join("; ")}` : ""} · ${(r.ms / 1000).toFixed(1)}s · tools: ${r.calls.map((x) => `${x.tool}${x.ok ? "" : " (error)"}`).join(", ") || "none"} · block: ${r.block}`, "", r.error ?? r.answer, ""].join("\n");
  })].join("\n"));
