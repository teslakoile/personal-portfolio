"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowDown, X } from "lucide-react";
import { Cite, Kbd, Pill, SendButton } from "../../kyllm-ui/kit";
import { AGENTS_RUN, OPENING_RUN, TALKS_RUN } from "../../kyllm-ui/HeroChat";
import { MCP_RUN, Steps, type StepData } from "../../kyllm-ui/Steps";
import { CopyButton, SrcChip, type Src } from "../../kyllm-ui/round3";
import { KyllmLive, type Mood } from "../../kyllm-ui/rig/KyllmLive";
import type { SiteMark } from "../../kyllm-ui/brandIcons";
import k from "../../kyllm-ui/kyllm.module.css";
import { KYLLM_OPEN } from "./events";
import h from "./hero.module.css";

/*
 * The KYLLM chat for the hero, built only from the parts approved on
 * /samples/kyllm-ui: one live cat avatar, in the header, no
 * tagline and New chat after the first question, arrow pills for starters and
 * follow-ups, the Steps waterfall, text answers at 14 words a second with
 * spaced citation chips, source chips with each source's mark, a copy-only
 * action, and the dashed key hint. One conversation, no history.
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
const TALKS = "Which talks has he given?";

const S = {
  exp: { kind: "site", label: "Experience", name: "Thinking Machines" },
  mcp: { kind: "site", label: "Projects", name: "MCP Server" },
  doc: { kind: "site", label: "Projects", name: "Document Intelligence" },
  gdg: { kind: "site", label: "Community", name: "GDG Davao" },
  talks: { kind: "site", label: "Community", name: "Talks" },
} satisfies Record<string, Src>;

const SCRIPTS: Record<string, Script> = {
  [SEED]: {
    steps: OPENING_RUN,
    text: ["Kyle builds data pipelines, agentic AI, and cloud infrastructure for enterprise clients in financial services, investment management, education, and compliance. At Thinking Machines he builds Snowflake Cortex agent workflows for investment officers", { cite: 1 }, " and a ChatGPT-to-Databricks MCP server", { cite: 2 }, ". Outside work he leads GDG Davao, 2,000+ participants, and speaks on AI coding agents", { cite: 3 }, "."],
    sources: [S.exp, S.mcp, S.gdg],
    next: [MCP, AGENTS],
  },
  [MCP]: {
    steps: MCP_RUN,
    text: ["A proof of concept between ChatGPT and Databricks. ChatGPT calls a tool on the server, and the server runs the query on the lakehouse through governed access, so there's no one-off API wrapper per question", { cite: 1 }, "."],
    sources: [S.mcp],
    next: [AGENTS, TALKS],
  },
  [AGENTS]: {
    steps: AGENTS_RUN,
    text: ["Snowflake Cortex agent workflows that let investment officers query long-form documents, where he owns the agent tooling, prompts, evaluation, and incident triage", { cite: 1 }, ". He also wires AI coding agents into his team's delivery with custom skills, hooks, and commands", { cite: 2 }, "."],
    sources: [S.doc, S.exp],
    next: [TALKS, MCP],
  },
  [TALKS]: {
    steps: TALKS_RUN,
    text: ["Generative AI, AI coding agents, and modern engineering workflows, at conferences, startup events, and AWS User Group Davao", { cite: 1 }, "."],
    sources: [S.talks],
    next: [AGENTS, MCP],
  },
};
const WPS = 14;

function match(q: string) {
  if (SCRIPTS[q]) return q;
  const t = q.toLowerCase();
  if (/mcp|databricks|chatgpt/.test(t)) return MCP;
  if (/agent|built|project|cortex/.test(t)) return AGENTS;
  if (/talk|speak|gdg|community/.test(t)) return TALKS;
  return SEED;
}

type Tok = { w: string } | { cite: number };
const tokenize = (segs: Seg[]): Tok[] =>
  segs.flatMap((g): Tok[] => (typeof g === "string" ? (g.match(/\s*\S+\s*/g) ?? []).map((w) => ({ w })) : [g]));

type Stage = "sent" | "steps" | "fold" | "stream" | "done";

function Turn({ q, script, animate, live, site, onMood, onDone, onPick }: {
  q: string; script: Script; animate: boolean; live: boolean; site: SiteMark;
  onMood: (m: Mood) => void; onDone: () => void; onPick: (q: string) => void;
}) {
  const [stage, setStage] = useState<Stage>(animate ? "sent" : "done");
  const [toks] = useState(() => tokenize(script.text));
  const [n, setN] = useState(animate ? 0 : toks.length);
  const go = useEffectEvent((next: Stage) => {
    setStage(next);
    if (next === "steps") onMood("working");
    if (next === "done") { onMood("answered"); onDone(); }
  });

  useEffect(() => {
    if (stage !== "sent" && stage !== "fold") return;
    const id = setTimeout(() => go(stage === "sent" ? "steps" : "stream"), stage === "sent" ? 380 : 280);
    return () => clearTimeout(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== "stream") return;
    const id = n >= toks.length
      ? setTimeout(() => go("done"), 220)
      : setTimeout(() => setN((x) => x + 1), (1000 / WPS) * (0.8 + Math.random() * 0.4));
    return () => clearTimeout(id);
  }, [stage, n, toks.length]);

  const showText = stage === "stream" || stage === "done";
  return (
    <>
      <div className={`${k.user} ${h.userIn}`}>{q}</div>
      {stage === "sent" ? null : (
        <div className={h.rowFlat}>
          <div className={h.answerBody}>
            <Steps v="waterfall" steps={script.steps} play={animate ? 1 : 0} onDone={() => setStage("fold")} />
            {showText ? (
              <p className={h.text}>
                {toks.slice(0, n).map((t, i) => ("w" in t
                  ? <span key={i} className={h.tok}>{t.w}</span>
                  : <span key={i} className={h.citeIn}><Cite n={t.cite} /></span>))}
                {stage === "stream" ? <span className={h.caret} aria-hidden="true" /> : null}
              </p>
            ) : null}
            {stage === "done" ? (
              <div className={h.after}>
                <div className={h.sources}>{script.sources.map((src) => <SrcChip key={src.name} src={src} site={site} />)}</div>
                <CopyButton />
                {live ? (
                  <div className={h.next}>{script.next.map((x, i) => (
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

type Thread = { id: number; q: string; key: string; animate: boolean };
const seedTurn = (animate: boolean): Thread => ({ id: 0, q: SEED, key: SEED, animate });
const settled = (ts: Thread[]) => ts.map((t) => ({ ...t, animate: false }));

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
  const [busy, setBusy] = useState(() => initial.some((t) => t.animate));
  const [draft, setDraft] = useState("");
  const [mood, setMood] = useState<Mood>(() => (initial.some((t) => t.animate) ? "working" : "idle"));
  const [away, setAway] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const input = useRef<HTMLInputElement>(null);

  const ask = (q: string) => {
    if (busy || !q.trim()) return;
    setDraft("");
    follow.current = true;
    setBusy(true);
    setMood("working");
    setTurns((ts) => [...settled(ts), { id: ts.length, q: q.trim(), key: match(q), animate: true }]);
  };
  const reset = () => { setTurns([seedTurn(false)]); setBusy(false); setMood("idle"); setDraft(""); };

  // answered plays its hop once, then KYLLM rests
  useEffect(() => {
    if (mood !== "answered") return;
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

  const submit = (e: FormEvent) => { e.preventDefault(); ask(draft); };
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
          <div ref={thread} className={h.thread}>
            {turns.map((t, i) => (
              <Turn key={t.id} q={t.q} script={SCRIPTS[t.key]} animate={t.animate} live={i === turns.length - 1} site={site}
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
        <input ref={input} className={h.input} value={draft} onChange={(e) => setDraft(e.target.value)}
          placeholder={busy ? "KYLLM is answering…" : "Ask KYLLM about my work…"} aria-label="Ask KYLLM" />
        {!draft && !busy ? <Kbd tip="Ask from anywhere">⌘K</Kbd> : null}
        <SendButton state={sendState} onClick={() => ask(draft)} />
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
