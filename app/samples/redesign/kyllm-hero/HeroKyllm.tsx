"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowDown, X } from "lucide-react";
import { Cite, Kbd, Pill, SendButton } from "../../kyllm-ui/kit";
import { OPENING_RUN } from "../../kyllm-ui/HeroChat";
import { Steps, type StepData } from "../../kyllm-ui/Steps";
import { CopyButton, SrcChip, type Src } from "../../kyllm-ui/round3";
import { KyllmLive, type Mood } from "../../kyllm-ui/rig/KyllmLive";
import type { SiteMark } from "../../kyllm-ui/brandIcons";
import k from "../../kyllm-ui/kyllm.module.css";
import { KYLLM_OPEN } from "./events";
import { LIMITS, LINKS, SECTIONS, type Source, type StreamEvent, type Turn as ProtocolTurn } from "../../../_kyllm/protocol";
import h from "./hero.module.css";

/*
 * The KYLLM chat for the hero, built only from the parts approved on
 * /samples/kyllm-ui: one live cat avatar, in the header, no
 * tagline and New chat after the first question, arrow pills for starters and
 * follow-ups, the Steps waterfall, text answers at 14 words a second with
 * spaced citation chips, source chips with each source's mark, a copy-only
 * action, and the dashed key hint. One conversation, no history.
 *
 * Answers come live from /api/kyllm (Claude Sonnet 5.5, grounded in the CV
 * and the site), streamed in and revealed a word at a time, with citation
 * chips and source chips linking to the page's sections. The opening exchange
 * stays scripted. Behind FEATURE_FLAGS.kyllm.
 *
 * KYLLM is not in the hero (a chat window there and the sheet open at once
 * was too much; a full-height pane cost the CV 30% of the width). It lives in
 * a dock pill, bottom right, that opens a sheet. The sheet never opens empty:
 * it starts on "Can you tell me more about Kyle?" already answered, so the
 * summary reads at a glance, and stays open while the page scrolls.
 */

type Seg = string | { cite: number };
type Script = { steps: StepData[]; text: Seg[]; sources: Src[]; next: string[] };

const SEED = "Can you tell me more about Kyle?";
const MCP = "How does the MCP server work?";
const AGENTS = "What else has he built with agents?";

/** The opening exchange is scripted, so opening the window costs nothing; every question after it is answered live. */
const SEED_SCRIPT: Script = {
  steps: OPENING_RUN,
  text: ["Kyle builds data pipelines, agentic AI, and cloud infrastructure for enterprise clients in financial services, investment management, education, and compliance. At Thinking Machines he builds Snowflake Cortex agent workflows for investment officers", { cite: 1 }, " and a ChatGPT-to-Databricks MCP server", { cite: 2 }, ". Outside work he leads GDG Davao, 2,000+ participants, and speaks on AI coding agents", { cite: 3 }, "."],
  sources: [
    { kind: "site", label: "Experience", name: "Thinking Machines", href: "#experience" },
    { kind: "site", label: "Experience", name: "MCP Server", href: "#experience" },
    { kind: "site", label: "Community", name: "GDG Davao", href: "#community" },
  ],
  next: [MCP, AGENTS],
};
const seedText = SEED_SCRIPT.text.map((g) => (typeof g === "string" ? g : "")).join("");

/** What the live steps waterfall shows while the answer is fetched. */
const LIVE_RUN: StepData[] = [
  { cat: "think", text: "Reading the question", meta: "", ms: 250 },
  { cat: "tool", text: "Searching his CV", meta: "and the site", ms: 450 },
  { cat: "write", text: "Writing the answer", meta: "", ms: 500 },
  { cat: "check", text: "Linking sources", meta: "", ms: 200 },
];
const WPS = 14;

type Tok = { w: string } | { cite: number };
const tokenize = (segs: Seg[]): Tok[] =>
  segs.flatMap((g): Tok[] => (typeof g === "string" ? (g.match(/\s*\S+\s*/g) ?? []).map((w) => ({ w })) : [g]));
/** Live text to segments: "[2]" becomes a citation chip. */
const toSegs = (text: string): Seg[] => text.split(/(\[\d+\])/).map((p) => (/^\[\d+\]$/.test(p) ? { cite: Number(p.slice(1, -1)) } : p));

const toSrc = (s: Source): Src =>
  "section" in s
    ? { kind: "site", label: SECTIONS[s.section], name: s.name, href: `#${s.section}` }
    : { kind: s.link === "cv" ? "site" : s.link, label: LINKS[s.link].label, name: LINKS[s.link].name, host: LINKS[s.link].host, href: LINKS[s.link].href };

/** One live answer as it streams in. */
type Live = { text: string; sources: Src[]; next: string[]; error?: string; finished: boolean };
const NO_LIVE: Live = { text: "", sources: [], next: [], finished: false };

type Stage = "sent" | "steps" | "fold" | "stream" | "done";

/** One question and its answer: scripted (`script`) or streaming in (`live`). */
function Turn({ q, script, liveState, animate, live, site, onMood, onDone, onPick }: {
  q: string; script?: Script; liveState?: Live; animate: boolean; live: boolean; site: SiteMark;
  onMood: (m: Mood) => void; onDone: () => void; onPick: (q: string) => void;
}) {
  const [stage, setStage] = useState<Stage>(animate ? "sent" : "done");
  const toks = tokenize(script ? script.text : liveState?.error ? [liveState.error] : toSegs(liveState?.text ?? ""));
  const finished = script ? true : !!liveState?.finished;
  const [n, setN] = useState(animate ? 0 : Number.MAX_SAFE_INTEGER);
  const go = useEffectEvent((next: Stage) => {
    setStage(next);
    if (next === "steps") onMood("working");
    if (next === "done") { onMood(liveState?.error ? "sorry" : "answered"); onDone(); }
  });

  useEffect(() => {
    if (stage !== "sent" && stage !== "fold") return;
    const id = setTimeout(() => go(stage === "sent" ? "steps" : "stream"), stage === "sent" ? 380 : 280);
    return () => clearTimeout(id);
  }, [stage]);

  // reveal a word at a time; a long backlog (the model ran ahead) plays faster
  useEffect(() => {
    if (stage !== "stream") return;
    if (n >= toks.length) {
      if (!finished) return; // wait for more text
      const id = setTimeout(() => go("done"), 220);
      return () => clearTimeout(id);
    }
    const backlog = toks.length - n;
    const id = setTimeout(() => setN((x) => x + 1), (1000 / WPS) * (0.8 + Math.random() * 0.4) / (backlog > 40 ? 4 : backlog > 15 ? 2 : 1));
    return () => clearTimeout(id);
  }, [stage, n, toks.length, finished]);

  const shown = toks.slice(0, n);
  const sources = script ? script.sources : liveState?.sources ?? [];
  const next = script ? script.next : liveState?.next ?? [];
  const plain = (script ? seedText : liveState?.error ? "" : liveState?.text ?? "").replace(/\[\d+\]/g, "");
  const showText = stage === "stream" || stage === "done";
  return (
    <>
      <div className={`${k.user} ${h.userIn}`}>{q}</div>
      {stage === "sent" ? null : (
        <div className={h.rowFlat}>
          <div className={h.answerBody}>
            <Steps v="waterfall" steps={script ? script.steps : LIVE_RUN} play={animate ? 1 : 0} onDone={() => setStage("fold")} />
            {showText ? (
              <p className={h.text}>
                {shown.map((t, i) => ("w" in t
                  ? <span key={i} className={h.tok}>{t.w}</span>
                  : <span key={i} className={h.citeIn}><Cite n={t.cite} /></span>))}
                {stage === "stream" ? <span className={h.caret} aria-hidden="true" /> : null}
              </p>
            ) : null}
            {stage === "done" ? (
              <div className={h.after}>
                {sources.length ? <div className={h.sources}>{sources.map((src, i) => <SrcChip key={`${i}-${src.name}`} src={src} site={site} />)}</div> : null}
                {plain ? <CopyButton text={plain} /> : null}
                {live && next.length ? (
                  <div className={h.next}>{next.map((x, i) => (
                    <span key={x} style={{ "--i": i } as CSSProperties}><Pill arrow onClick={() => onPick(x)}>{x}</Pill></span>
                  ))}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

type Thread = { id: number; q: string; seed?: boolean; animate: boolean };
const seedTurn = (animate: boolean): Thread => ({ id: 0, q: SEED, seed: true, animate });
const settled = (ts: Thread[]) => ts.map((t) => ({ ...t, animate: false }));

/** Streams one answer from /api/kyllm into `update`; resolves when the stream ends. */
async function fetchAnswer(question: string, history: ProtocolTurn[], signal: AbortSignal, update: (f: (l: Live) => Live) => void) {
  const fail = (v: string) => update((l) => ({ ...l, error: l.text ? undefined : v, finished: true }));
  try {
    const res = await fetch("/api/kyllm", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal,
      body: JSON.stringify({ question, history }),
    });
    if (!res.ok || !res.body) {
      const msg = res.status === 429 ? "Too many questions for now. Try again later." : "KYLLM couldn't answer just now. Try again, or email Kyle at kyle.naranjo@gmail.com.";
      return fail(msg);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
        if (!line) continue;
        const e = JSON.parse(line) as StreamEvent;
        if (e.t === "text") update((l) => ({ ...l, text: l.text + e.v }));
        else if (e.t === "meta") update((l) => ({ ...l, sources: e.sources.map(toSrc), next: e.next }));
        else if (e.t === "error") return fail(e.v);
        else if (e.t === "done") update((l) => ({ ...l, finished: true }));
      }
    }
    update((l) => (l.finished ? l : { ...l, finished: true }));
  } catch {
    if (signal.aborted) update((l) => ({ ...l, text: l.text || "Stopped.", finished: true }));
    else fail("KYLLM couldn't answer just now. Try again, or email Kyle at kyle.naranjo@gmail.com.");
  }
}

/** One chat: the thread, the live avatar in the header (messages carry none), and the composer. */
function Chat({ initial, site, height, focusKey, pending, onClose }: {
  initial: Thread[]; site: SiteMark; height: number | string;
  /** focuses the composer whenever it changes (each time the sheet opens) */
  focusKey?: number;
  /** a question asked from elsewhere on the page, asked when `n` changes */
  pending?: { q: string; n: number };
  onClose?: () => void;
}) {
  const [turns, setTurns] = useState(initial);
  const [lives, setLives] = useState<Record<number, Live>>({});
  const [busy, setBusy] = useState(() => initial.some((t) => t.animate));
  const [draft, setDraft] = useState("");
  const [mood, setMood] = useState<Mood>(() => (initial.some((t) => t.animate) ? "working" : "idle"));
  const [away, setAway] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  const ask = (q: string) => {
    if (busy || !q.trim()) return;
    const question = q.trim();
    // the conversation so far, as plain text, for context
    const history: ProtocolTurn[] = turns.flatMap((t): ProtocolTurn[] => {
      const answer = t.seed ? seedText : (lives[t.id]?.text ?? "").replace(/\[\d+\]/g, "");
      return answer ? [{ role: "user", content: t.q }, { role: "assistant", content: answer }] : [];
    });
    const id = turns.length ? Math.max(...turns.map((t) => t.id)) + 1 : 1;
    setDraft("");
    follow.current = true;
    setBusy(true);
    setMood("working");
    setTurns((ts) => [...settled(ts), { id, q: question, animate: true }]);
    setLives((m) => ({ ...m, [id]: NO_LIVE }));
    const ctrl = new AbortController();
    abort.current = ctrl;
    void fetchAnswer(question, history, ctrl.signal, (f) => setLives((m) => ({ ...m, [id]: f(m[id] ?? NO_LIVE) })));
  };
  const stop = () => abort.current?.abort();
  const reset = () => { stop(); setTurns([seedTurn(false)]); setLives({}); setBusy(false); setMood("idle"); setDraft(""); };

  // answered plays its hop once, then KYLLM rests
  useEffect(() => {
    if (mood !== "answered" && mood !== "sorry") return;
    const id = setTimeout(() => setMood("idle"), 2200);
    return () => clearTimeout(id);
  }, [mood]);

  useEffect(() => {
    if (focusKey) requestAnimationFrame(() => input.current?.focus());
  }, [focusKey]);

  // each handed-in question once, even when an effect runs twice
  const asked = useRef(0);
  const take = useEffectEvent((q: string, n: number) => { if (n > asked.current) { asked.current = n; ask(q); } });
  useEffect(() => { if (pending?.n) take(pending.q, pending.n); }, [pending?.n, pending?.q]);

  // Esc closes the sheet
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const el = scroller.current, inner = thread.current;
    if (!el || !inner) return;
    const ro = new ResizeObserver(() => { if (follow.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); });
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (fromBottom < 40) follow.current = true;
    setAway(!follow.current && fromBottom > 120);
  };

  const submit = (e: FormEvent) => { e.preventDefault(); if (busy) stop(); else ask(draft); };
  const liveMood: Mood = draft && !busy ? "typing" : mood;
  const sendState = busy ? "stop" : draft.trim() ? "send" : "wait";

  return (
    <div className={h.panel} style={{ height }}>
      <div className={h.head}>
        <KyllmLive mood={liveMood} size={32} />
        <b>KYLLM</b>
        {turns.length > 1 ? <button type="button" className={h.newChat} onClick={reset}>New chat</button> : null}
        {onClose ? (
          <button type="button" className={h.close} onClick={onClose} aria-label="Close KYLLM" data-solo={turns.length > 1 ? undefined : ""}>
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className={h.scrollWrap}>
        <div ref={scroller} className={h.scroll} onScroll={onScroll} onWheel={(e) => { if (e.deltaY < 0) follow.current = false; }}>
          <div ref={thread} className={h.thread} aria-live="polite">
            {turns.map((t, i) => (
              <Turn key={t.id} q={t.q} script={t.seed ? SEED_SCRIPT : undefined} liveState={t.seed ? undefined : lives[t.id] ?? NO_LIVE}
                animate={t.animate} live={i === turns.length - 1} site={site}
                onMood={setMood} onDone={() => setBusy(false)} onPick={ask} />
            ))}
          </div>
        </div>
        <button type="button" className={h.latest} data-show={away ? "" : undefined}
          onClick={() => { follow.current = true; scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }}>
          <ArrowDown size={14} strokeWidth={2} aria-hidden="true" />Latest
        </button>
      </div>
      <form className={`${k.composer} ${h.composer}`} onSubmit={submit}>
        <input ref={input} className={h.input} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={LIMITS.question}
          placeholder={busy ? "KYLLM is answering…" : "Ask KYLLM about my work…"} aria-label="Ask KYLLM" />
        {!draft && !busy ? <Kbd tip="Ask from anywhere">⌘K</Kbd> : null}
        <SendButton state={sendState} onClick={() => (busy ? stop() : ask(draft))} />
      </form>
    </div>
  );
}

/**
 * The dock pill and the sheet it opens. ⌘K opens it too, and so does
 * openKyllm(q) from anywhere on the page (the hero's promo), which also asks
 * q. The sheet mounts on first open and stays mounted, so closing it keeps
 * the conversation.
 */
export function KyllmDock({ site = "kn" }: { site?: SiteMark }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [opens, setOpens] = useState(0);
  const [pending, setPending] = useState({ q: "", n: 0 });
  const show = (q?: string) => {
    setMounted(true); setOpen(true); setOpens((n) => n + 1);
    if (q) setPending((p) => ({ q, n: p.n + 1 }));
  };
  const close = useCallback(() => setOpen(false), []);

  const cmdK = useEffectEvent(() => show());
  const fromPage = useEffectEvent((q?: string) => show(q));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); cmdK(); }
    };
    const onOpen = (e: Event) => fromPage((e as CustomEvent<{ q?: string }>).detail?.q);
    // the rail's "Ask KYLLM" button opens it too
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-util="Ask KYLLM"]')) { e.preventDefault(); cmdK(); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(KYLLM_OPEN, onOpen);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(KYLLM_OPEN, onOpen);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className={h.tokens}>
      {mounted ? (
        <aside className={h.sheet} data-open={open ? "" : undefined} aria-label="KYLLM" aria-hidden={!open}>
          <Chat initial={[seedTurn(false)]} site={site} height="100%" focusKey={opens} pending={pending} onClose={close} />
        </aside>
      ) : null}
      <button type="button" className={h.dockPill} data-show={open ? undefined : ""} onClick={() => show()}>
        <KyllmLive mood="idle" size={30} />Ask KYLLM<Kbd tip="Open KYLLM">⌘K</Kbd>
      </button>
    </div>
  );
}
