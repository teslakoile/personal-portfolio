"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent as ReactMouseEvent } from "react";
import { ArrowDown, X } from "lucide-react";
import { Cite, Kbd, Pill, SendButton } from "../../kyllm-ui/kit";
import { SmoothText } from "../../kyllm-ui/streaming/SmoothText";
import { LiveSteps, type StepRun } from "../../kyllm-ui/LiveSteps";
import { AnswerChart } from "../../kyllm-ui/AnswerChart";
import { AnswerDiagram } from "../../kyllm-ui/AnswerDiagram";
import { CopyButton, SrcChip, type Src } from "../../kyllm-ui/round3";
import { KyllmLive, type Mood } from "../../kyllm-ui/rig/KyllmLive";
import type { SiteMark } from "../../kyllm-ui/brandIcons";
import k from "../../kyllm-ui/kyllm.module.css";
import { KYLLM_OPEN } from "./events";
import { answerSound, stepSound, streamSound } from "../../../_home/sound";
import { LIMITS, LINKS, SECTIONS, type Chart, type Diagram, type Source, type StreamEvent, type Turn as ProtocolTurn } from "../../../_kyllm/protocol";
import h from "./hero.module.css";

/*
 * The KYLLM chat for the hero, built only from the parts approved on
 * /samples/kyllm-ui: one live cat avatar, in the header, no
 * tagline and New chat after the first question, arrow pills for starters and
 * follow-ups, the Steps waterfall, text answers released at an even pace with
 * a soft fade (SmoothText) and spaced citation chips, source chips with each source's mark, a copy-only
 * action, and the dashed key hint. One conversation, no history.
 *
 * Answers come live from /api/kyllm (Claude Sonnet 5.5, grounded in the CV
 * and the site), streamed in and released a few characters at a time, with citation
 * chips and source chips linking to the page's sections. The chat opens empty:
 * KYLLM, a line, and three starters. Every KYLLM avatar in it can be booped
 * (KyllmLive touch), with a sound. Behind FEATURE_FLAGS.kyllm.
 *
 * KYLLM is not in the hero (a chat window there and the sheet open at once
 * was too much; a full-height pane cost the CV 30% of the width). It lives in
 * a dock pill, bottom right, that opens a sheet. The sheet stays open while
 * the page scrolls.
 *
 * Each answer's steps (LiveSteps) come from the route's `step` events: a row
 * appears when the route starts thinking, a tool call, or the answer text,
 * and stops when that ends. The answer text shows as soon as it arrives.
 */

type Seg = string | { cite: number };

/** Starters for the empty chat. */
/** the width where the sheet goes full screen (hero.module.css), and a touch screen */
const PHONE = "(max-width: 760px)";
const TOUCH = "(pointer: coarse)";

/*
 * Suggestion pills keep the composer focused through the tap (audit #17). A
 * tap that blurred the field first would close the keyboard, the sheet would
 * grow back to full height, and the centred pills would slide out from under
 * the finger, so the first tap could land on nothing. The question is sent
 * with the keyboard still up, and only then does the keyboard close.
 */
const keepFocus = (e: ReactMouseEvent) => e.preventDefault();

const STARTERS = ["Tell me more about Kyle", "What has he built with AI agents?", "Which talks has he given?"];

/** One tick sound for every this many characters released. */
const TICK_EVERY = 8;
/** If text piles up faster than it is released, close that backlog over about a second. */
const CATCH_UP = 1.2;

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
/** sources[n - 1] is the source for citation [n], or null when the route found it invalid; `meta` is true once they arrive */
type Live = { text: string; chart?: Chart; diagram?: Diagram; sources: (Src | null)[]; meta: boolean; next: string[]; error?: string; finished: boolean; run: StepRun };
const NO_RUN: StepRun = { t0: 0, steps: [] };
const NO_LIVE: Live = { text: "", sources: [], meta: false, next: [], finished: false, run: NO_RUN };

type Stage = "sent" | "working" | "done";

/**
 * A citation chip with its source. Hovering or focusing it shows the source
 * in the site's note and lights that source's chip below the answer. It has
 * no click action: only the source chips scroll or open a link. The note opens
 * toward the side of the answer with more room.
 */
function CiteNote({ n, src, onLight }: { n: number; src: Src; onLight: (src: Src | null) => void }) {
  const [side, setSide] = useState<"left" | "right">("left");
  const enter = (el: HTMLElement) => {
    const box = el.closest("p")?.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (box) setSide(r.left - box.left > box.width / 2 ? "right" : "left");
    onLight(src);
  };
  const leave = () => onLight(null);
  return (
    <span className={h.citeWrap} data-side={side} onPointerEnter={(e) => enter(e.currentTarget)} onPointerLeave={leave}
      onFocus={(e) => enter(e.currentTarget)} onBlur={leave}>
      {/* a press never focuses it, so a click leaves nothing pinned; Tab still reaches it */}
      <span className={k.cite} tabIndex={0} onMouseDown={(e) => e.preventDefault()} aria-label={`Source ${n}: ${src.label}${src.name ? `, ${src.name}` : ""}`}>{n}</span>
      <span className={h.citeNote} role="tooltip">
        <b>{src.label}</b>
        <span>{src.host ? `${src.name} · ${src.host}` : src.name}</span>
      </span>
    </span>
  );
}

/** One question and its answer, streaming in. */
function Turn({ q, liveState, animate, live, site, onMood, onDone, onPick }: {
  q: string; liveState: Live; animate: boolean; live: boolean; site: SiteMark;
  onMood: (m: Mood) => void; onDone: () => void; onPick: (q: string) => void;
}) {
  const [stage, setStage] = useState<Stage>(animate ? "sent" : "done");
  // a citation still arriving ("[2") is held back until its "]" comes
  const text = liveState.error ? "" : liveState.finished ? liveState.text : liveState.text.replace(/\[\d*$/, "");
  const toks = tokenize(liveState.error ? [liveState.error] : toSegs(text));
  const [settled, setSettled] = useState(!animate);
  // the source chip lit by the citation under the pointer
  const [lit, setLit] = useState<Src | null>(null);
  const ticked = useRef(0);
  const go = useEffectEvent((next: Stage) => {
    setStage(next);
    if (next === "working") onMood("working");
    if (next === "done") { onMood(liveState.error ? "sorry" : "answered"); onDone(); if (animate) answerSound(!liveState.error); }
  });

  useEffect(() => {
    if (stage !== "sent") return;
    const id = setTimeout(() => go("working"), 380);
    return () => clearTimeout(id);
  }, [stage]);

  // SmoothText releases the text at an even pace; once the stream has ended and every character shows, finish
  useEffect(() => {
    if (stage !== "working" || !settled || !liveState.finished) return;
    const id = setTimeout(() => go("done"), 220);
    return () => clearTimeout(id);
  }, [stage, settled, liveState.finished]);

  const tick = (shown: number) => {
    if (stage !== "working") return;
    if (shown - ticked.current >= TICK_EVERY) { ticked.current = shown; streamSound(); }
  };

  const { next } = liveState;
  // one chip per source, in citation order
  const sources = liveState.sources.filter((x, i, all): x is Src => !!x && all.findIndex((y) => y && JSON.stringify(y) === JSON.stringify(x)) === i);
  // a citation shows its source on hover; once the sources arrive, one without a valid source is hidden
  const cite = (n: number) => {
    const src = liveState.sources[n - 1];
    return src ? <CiteNote n={n} src={src} onLight={setLit} /> : liveState.meta ? null : <Cite n={n} />;
  };
  const plain = (liveState.error ? "" : liveState.text).replace(/\[\d+\]/g, "");
  const showText = toks.length > 0 || liveState.finished;
  return (
    <>
      <div className={`${k.user} ${h.userIn}`}>{q}</div>
      {stage === "sent" ? null : (
        <div className={h.rowFlat}>
          <div className={h.answerBody}>
            {liveState.run.t0 ? <LiveSteps run={liveState.run} onStep={animate ? stepSound : undefined} /> : null}
            {showText ? (
              <SmoothText
                className={h.text}
                toks={toks}
                n={toks.length}
                done={liveState.finished}
                always={!toks.length}
                instant={!animate}
                catchUp={CATCH_UP}
                onRelease={tick}
                onSettled={() => setSettled(true)}
                cite={cite}
              />
            ) : null}
            {/* the chart or diagram sits between the answer and its sources, once the answer is written */}
            {stage === "done" && liveState.chart && !liveState.error ? <AnswerChart chart={liveState.chart} /> : null}
            {stage === "done" && liveState.diagram && !liveState.error ? <AnswerDiagram diagram={liveState.diagram} /> : null}
            {stage === "done" ? (
              <div className={h.after}>
                {sources.length ? <div className={h.sources}>{sources.map((src, i) => <SrcChip key={`${i}-${src.name}`} src={src} site={site} lit={!!lit && JSON.stringify(lit) === JSON.stringify(src)} />)}</div> : null}
                {plain ? <CopyButton text={plain} /> : null}
                {live && next.length ? (
                  <div className={h.next} onMouseDown={keepFocus}>{next.map((x, i) => (
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

type Thread = { id: number; q: string; animate: boolean };
const settled = (ts: Thread[]) => ts.map((t) => ({ ...t, animate: false }));

/** Streams one answer from /api/kyllm into `update`; resolves when the stream ends. */
async function fetchAnswer(question: string, history: ProtocolTurn[], signal: AbortSignal, update: (f: (l: Live) => Live) => void) {
  const at = (l: Live) => performance.now() - l.run.t0;
  const end = (l: Live, outcome: NonNullable<StepRun["outcome"]>): StepRun => (l.run.outcome ? l.run : { ...l.run, end: at(l), outcome });
  const fail = (v: string) => update((l) => ({ ...l, error: l.text ? undefined : v, finished: true, run: end(l, l.text ? "ok" : "failed") }));
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
        if (e.t === "step") {
          update((l) => {
            const ms = at(l);
            const steps = "end" in e
              ? l.run.steps.map((x) => (x.id === e.id ? { ...x, end: ms, state: e.ok === false ? "failed" as const : "done" as const, detail: e.detail ?? x.detail } : x))
              : l.run.steps.some((x) => x.id === e.id)
                // a step that turns out to be another kind keeps its start
                ? l.run.steps.map((x) => (x.id === e.id ? { ...x, kind: e.kind, label: e.label ?? "", detail: e.detail ?? x.detail } : x))
                : [...l.run.steps, { id: e.id, kind: e.kind, label: e.label ?? "", detail: e.detail ?? "", start: ms }];
            return { ...l, run: { ...l.run, steps } };
          });
        }
        else if (e.t === "text") update((l) => ({ ...l, text: l.text + e.v }));
        else if (e.t === "chart") update((l) => ({ ...l, chart: e.chart }));
        else if (e.t === "diagram") update((l) => ({ ...l, diagram: e.diagram }));
        else if (e.t === "meta") update((l) => ({ ...l, sources: e.sources.map((x) => (x ? toSrc(x) : null)), meta: true, next: e.next }));
        else if (e.t === "error") return fail(e.v);
        else if (e.t === "done") update((l) => ({ ...l, finished: true, run: end(l, "ok") }));
      }
    }
    update((l) => (l.finished ? l : { ...l, finished: true, run: end(l, l.text ? "ok" : "failed") }));
  } catch {
    if (signal.aborted) update((l) => ({ ...l, text: l.text || "Stopped.", finished: true, run: end(l, "stopped") }));
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
      const answer = (lives[t.id]?.text ?? "").replace(/\[\d+\]/g, "");
      return answer ? [{ role: "user", content: t.q }, { role: "assistant", content: answer }] : [];
    });
    const id = turns.length ? Math.max(...turns.map((t) => t.id)) + 1 : 1;
    setDraft("");
    follow.current = true;
    setBusy(true);
    setMood("working");
    setTurns((ts) => [...settled(ts), { id, q: question, animate: true }]);
    setLives((m) => ({ ...m, [id]: { ...NO_LIVE, run: { t0: performance.now(), steps: [] } } }));
    const ctrl = new AbortController();
    abort.current = ctrl;
    void fetchAnswer(question, history, ctrl.signal, (f) => setLives((m) => ({ ...m, [id]: f(m[id] ?? NO_LIVE) })));
  };
  // a suggestion pill: ask it, then on a touch screen close the keyboard so
  // the answer has the screen
  const pick = (q: string) => {
    ask(q);
    if (window.matchMedia(TOUCH).matches) input.current?.blur();
  };
  const stop = () => abort.current?.abort();
  const reset = () => { stop(); setTurns([]); setLives({}); setBusy(false); setMood("idle"); setDraft(""); };

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
        <KyllmLive mood={liveMood} size={32} touch />
        <b>KYLLM</b>
        {turns.length ? <button type="button" className={h.newChat} onClick={reset}>New chat</button> : null}
        {onClose ? (
          <button type="button" className={h.close} onClick={onClose} aria-label="Close KYLLM" data-solo={turns.length ? undefined : ""}>
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className={h.scrollWrap}>
        <div ref={scroller} className={h.scroll} onScroll={onScroll} onWheel={(e) => { if (e.deltaY < 0) follow.current = false; }}>
          <div ref={thread} className={turns.length ? h.thread : `${h.thread} ${h.threadEmpty}`} aria-live="polite">
            {turns.length ? null : (
              <div className={h.empty}>
                <KyllmLive mood={liveMood} size={72} touch />
                <p>Ask me about Kyle&apos;s work</p>
                <div className={h.next} onMouseDown={keepFocus}>{STARTERS.map((x, i) => (
                  <span key={x} style={{ "--i": i } as CSSProperties}><Pill arrow onClick={() => pick(x)}>{x}</Pill></span>
                ))}</div>
              </div>
            )}
            {turns.map((t, i) => (
              <Turn key={t.id} q={t.q} liveState={lives[t.id] ?? NO_LIVE}
                animate={t.animate} live={i === turns.length - 1} site={site}
                onMood={setMood} onDone={() => setBusy(false)} onPick={pick} />
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
          placeholder={busy ? "KYLLM is answering…" : "Ask KYLLM about Kyle's work…"} aria-label="Ask KYLLM" />
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
/** `avoid` hides the pill while it would sit on something that does its job
    or that it covers: the hero's question bar (any screen) and the footer's
    links (wide screens; phones leave room under the links instead). Those
    elements carry data-kyllm-avoid="always" or "wide". */
export function KyllmDock({ site = "favicon", avoid = false }: { site?: SiteMark; avoid?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [opens, setOpens] = useState(0);
  const [pending, setPending] = useState({ q: "", n: 0 });
  const [tuck, setTuck] = useState(false);
  const [covering, setCovering] = useState(false);
  const sheet = useRef<HTMLElement>(null);
  const show = (q?: string) => {
    setMounted(true); setOpen(true);
    // a question asked from the page answers at once; on a touch screen the
    // keyboard would cover that answer, so the composer is not focused
    if (!(q && window.matchMedia(TOUCH).matches)) setOpens((n) => n + 1);
    if (q) setPending((p) => ({ q, n: p.n + 1 }));
  };
  const close = useCallback(() => setOpen(false), []);

  // phones: fit the open sheet to the visual viewport, the part of the screen
  // above the on-screen keyboard, so the composer stays in view while typing
  useEffect(() => {
    const vv = window.visualViewport, el = sheet.current;
    if (!open || !vv || !el) return;
    const sync = () => {
      if (!window.matchMedia(PHONE).matches) { el.style.removeProperty("--vv-top"); el.style.removeProperty("--vv-bottom"); return; }
      el.style.setProperty("--vv-top", `${vv.offsetTop}px`);
      el.style.setProperty("--vv-bottom", `${Math.max(0, el.clientHeight - vv.offsetTop - vv.height)}px`);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => { vv.removeEventListener("resize", sync); vv.removeEventListener("scroll", sync); };
  }, [open, mounted]);

  // phones: the dock pill steps aside while the page scrolls down, so it does
  // not sit on the text being read, and comes back on the way up
  useEffect(() => {
    const phone = window.matchMedia(PHONE);
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (!phone.matches) { setTuck(false); last = y; return; }
      if (Math.abs(y - last) < 8) return;
      setTuck(y > last && y > 80);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!avoid) return;
    const phone = window.matchMedia(PHONE).matches;
    const els = [...document.querySelectorAll("[data-kyllm-avoid]")].filter((el) => !(phone && el.getAttribute("data-kyllm-avoid") === "wide"));
    if (!els.length) return;
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); }
      setCovering(seen.size > 0);
    });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [avoid]);

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
        <aside ref={sheet} className={h.sheet} data-open={open ? "" : undefined} aria-label="KYLLM" aria-hidden={!open}>
          <Chat initial={[]} site={site} height="100%" focusKey={opens} pending={pending} onClose={close} />
        </aside>
      ) : null}
      <button type="button" className={h.dockPill} data-show={open || covering ? undefined : ""} data-tuck={tuck ? "" : undefined} onClick={() => show()}>
        <KyllmLive mood="idle" size={30} />Ask KYLLM<Kbd tip="Open KYLLM">⌘K</Kbd>
      </button>
    </div>
  );
}
