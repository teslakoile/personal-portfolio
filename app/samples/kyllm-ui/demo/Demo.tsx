"use client";

import { useEffect, useEffectEvent, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { AnswerActions, Avatar, Cite, Highlights, Kbd, PanelHeader, Pill } from "../kit";
import { AGENTS_RUN, OPENING_RUN, TALKS_RUN } from "../HeroChat";
import { MCP_RUN, Steps, type StepData } from "../Steps";
import s from "../kyllm.module.css";
import h from "../hero.module.css";
import d from "./demo.module.css";

/*
 * One exchange end to end, with every animation in order:
 *   typing   the question types into the composer; Send lights up
 *   sent     the bubble rises; Send becomes Stop; the chips hide
 *   steps    the loading line, then the live waterfall
 *   stream   Steps fold; words fade in behind a caret; citations pop in
 *   blocks   tiles, then sources, then actions, staggered
 *   next     follow-up chips rise in
 * Autoplay types the first question, then picks a follow-up chip, then loops.
 * Typing or clicking anything hands control to the visitor.
 */

type Seg = string | { cite: number };
type Tok = { w: string } | { cite: number };
type Script = { steps: StepData[]; text: Seg[]; tiles?: boolean; sources?: [string, string][]; next: string[] };
type Stage = "sent" | "steps" | "fold" | "stream" | "blocks" | "done";
type Beat = "idle" | "typing" | "sent" | "steps" | "stream" | "blocks" | "next";

const OPEN = "Give me the 30-second version of Kyle.";
const MCP = "How does the MCP server work?";
const AGENTS = "What else has he built with agents?";
const TALKS = "Which talks cover this?";
const MISS = "miss";

const SCRIPTS: Record<string, Script> = {
  [OPEN]: {
    steps: OPENING_RUN,
    text: ["4+ years building for enterprise clients in financial services, investment management, education, and compliance. Four things worth knowing:"],
    tiles: true,
    next: [MCP, AGENTS],
  },
  [MCP]: {
    steps: MCP_RUN,
    text: ["It's a proof of concept Kyle built at Thinking Machines: a Model Context Protocol server between ChatGPT and Databricks. ChatGPT calls a tool on the server, and the server runs the query on the lakehouse through governed access, so there's no one-off API wrapper per question", { cite: 1 }, "."],
    sources: [["Projects", "MCP Server"], ["Community", "Talks"]],
    next: [AGENTS, TALKS],
  },
  [AGENTS]: {
    steps: AGENTS_RUN,
    text: ["At Thinking Machines he works on Snowflake Cortex agent workflows that let investment officers query long-form documents, owning the agent tooling, prompts, evaluation, and incident triage", { cite: 1 }, ". He also wires AI coding agents into his team's delivery with custom skills, hooks, and commands", { cite: 2 }, "."],
    sources: [["Projects", "Document Intelligence"], ["Experience", "Thinking Machines"]],
    next: [TALKS, MCP],
  },
  [TALKS]: {
    steps: TALKS_RUN,
    text: ["He speaks on generative AI, AI coding agents, and modern engineering workflows. He leads GDG Davao and has spoken at conferences, startup events, and AWS User Group Davao", { cite: 1 }, "."],
    sources: [["Community", "Talks"]],
    next: [OPEN, AGENTS],
  },
  [MISS]: {
    steps: [
      { cat: "think", text: "Reading the question", meta: "off the CV", ms: 200 },
      { cat: "tool", text: "Searching the CV", meta: "0 matches", ms: 300 },
      { cat: "write", text: "Writing the answer", meta: "1 sentence", ms: 300 },
    ],
    text: ["I only answer from Kyle's CV, and it doesn't cover that. Try one of these, or email him."],
    next: [OPEN, MCP, AGENTS],
  },
};
const STARTERS = [OPEN, MCP];

/** Free text goes to the closest script, or to the polite miss. */
function match(q: string) {
  if (SCRIPTS[q]) return q;
  const k = q.toLowerCase();
  if (/mcp|databricks|chatgpt/.test(k)) return MCP;
  if (/agent|built|project|cortex/.test(k)) return AGENTS;
  if (/talk|speak|gdg|community/.test(k)) return TALKS;
  if (/30|who is|summary|overview|version|tell me about/.test(k)) return OPEN;
  return MISS;
}

const tokenize = (segs: Seg[]): Tok[] =>
  segs.flatMap((g): Tok[] => (typeof g === "string" ? (g.match(/\s*\S+\s*/g) ?? []).map((w) => ({ w })) : [g]));

/**
 * How fast the answer text appears, in words per second. A model sends text
 * in uneven bursts at about 30 words a second; the paced and typing settings
 * show it one word at a time at a steady speed.
 */
export type Pace = "model" | "paced" | "typing";
export const PACES: Record<Pace, { label: string; wps: number; burst: boolean }> = {
  model: { label: "Model", wps: 30, burst: true },
  paced: { label: "Paced", wps: 14, burst: false },
  typing: { label: "Typing", wps: 6, burst: false },
};
export const RATES = [1, 0.5, 0.25];
type Meter = { words: number; ms: number; live: boolean };

const BEATS: [Beat, string, string][] = [
  ["typing", "Typing", "The question types into the composer. Send turns coral once there is text."],
  ["sent", "Sent", "The bubble rises from the composer. Send becomes Stop and the chips hide."],
  ["steps", "Steps", "The loading line heads the block, then each bar grows on the waterfall while its seconds count."],
  ["stream", "Streaming", "Steps fold to one line. Words fade in behind a coral caret, and citations pop in as they land."],
  ["blocks", "Blocks and sources", "Highlight tiles, then source pills, then the actions, each one staggered."],
  ["next", "Follow-ups", "Suggested questions rise in. Autoplay picks one, and you can too."],
];

function TurnView({ q, script, pace, rate, onBeat, onFinish, onMeter }: {
  q: string; script: Script; pace: Pace; rate: number; onBeat: (b: Beat) => void; onFinish: () => void; onMeter: (m: Meter) => void;
}) {
  const [stage, setStage] = useState<Stage>("sent");
  const [toks] = useState(() => tokenize(script.text));
  // words shown after each token, for the meter (citations are not words)
  const [wordsAt] = useState(() => toks.reduce<number[]>((a, t) => [...a, (a.at(-1) ?? 0) + ("w" in t ? 1 : 0)], []));
  const [n, setN] = useState(0);
  const streamMs = useRef(0);
  const go = useEffectEvent((next: Stage) => {
    if (next === "blocks") onMeter({ words: wordsAt.at(-1) ?? 0, ms: streamMs.current, live: false });
    setStage(next);
    if (next === "done") onFinish();
    else if (next !== "fold") onBeat(next);
  });

  // a beat of latency before KYLLM starts working, and a beat after Steps finish
  useEffect(() => {
    if (stage !== "sent" && stage !== "fold") return;
    const id = setTimeout(() => go(stage === "sent" ? "steps" : "stream"), (stage === "sent" ? 380 : 280) / rate);
    return () => clearTimeout(id);
  }, [stage, rate]);

  // stream at the chosen pace: a model's uneven bursts, or one steady word at a time.
  // streamMs keeps the run's own time, so the meter reads the same in slow motion.
  const report = useEffectEvent((shown: number, ms: number) => onMeter({ words: wordsAt[shown - 1] ?? 0, ms, live: true }));
  useEffect(() => {
    if (stage !== "stream") return;
    if (n >= toks.length) {
      const id = setTimeout(() => go("blocks"), 220 / rate);
      return () => clearTimeout(id);
    }
    const { wps, burst } = PACES[pace];
    const chunk = burst ? 1 + Math.floor(Math.random() * 3) : 1;
    const wait = (chunk * 1000 / wps) * (burst ? 0.6 + Math.random() * 0.8 : 0.8 + Math.random() * 0.4);
    const id = setTimeout(() => {
      const next = Math.min(toks.length, n + chunk);
      streamMs.current += wait;
      setN(next);
      report(next, streamMs.current);
    }, wait / rate);
    return () => clearTimeout(id);
  }, [stage, n, toks.length, pace, rate]);

  // tiles, then sources, then actions
  const srcAt = script.tiles ? 460 : 0;
  const actAt = srcAt + (script.sources ? 120 + script.sources.length * 90 : 0);
  useEffect(() => {
    if (stage !== "blocks") return;
    const id = setTimeout(() => go("done"), (actAt + 420) / rate);
    return () => clearTimeout(id);
  }, [stage, actAt, rate]);

  const showText = stage === "stream" || stage === "blocks" || stage === "done";
  const showAfter = stage === "blocks" || stage === "done";

  return (
    <>
      <div className={`${s.user} ${d.userIn}`}>{q}</div>
      {stage === "sent" ? null : (
        <div className={h.answer}>
          <Avatar size={36} />
          <div className={h.answerBody}>
            <Steps v="waterfall" steps={script.steps} play={1} rate={rate} onDone={() => setStage("fold")} />
            {showText ? (
              <p className={d.stream}>
                {toks.slice(0, n).map((t, i) => ("w" in t
                  ? <span key={i} className={d.tok}>{t.w}</span>
                  : <span key={i} className={d.citeIn}><Cite n={t.cite} /></span>))}
                {stage === "stream" ? <span className={d.caret} aria-hidden="true" /> : null}
              </p>
            ) : null}
            {showAfter ? (
              <>
                {script.tiles ? <div className={`${h.block} ${d.tiles}`}><Highlights /></div> : null}
                {script.sources ? (
                  <div className={`${h.sources} ${d.srcs}`} style={{ "--d": `${srcAt}ms` } as CSSProperties}>
                    <span>Sources</span>
                    {script.sources.map(([sec, name]) => <Pill key={name} kind="source"><b>{sec}</b>{name} ↗</Pill>)}
                  </div>
                ) : null}
                <div className={d.actions} style={{ "--d": `${actAt}ms` } as CSSProperties}><AnswerActions /></div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

type Turn = { id: number; q: string; key: string };

function Chat({ auto, pace, rate, controls, onTakeOver, onReplay }: {
  auto: boolean; pace: Pace; rate: number; controls: ReactNode; onTakeOver: () => void; onReplay: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [beat, setBeat] = useState<Beat>("idle");
  const [pressed, setPressed] = useState<string | null>(null);
  const [looping, setLooping] = useState(false);
  const [away, setAway] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const [meter, setMeter] = useState<Meter | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const rateRef = useRef(rate);
  useEffect(() => { rateRef.current = rate; }, [rate]);

  // slow motion for the CSS side too: every animation and transition in the panel plays at the rate
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      for (const a of el.getAnimations({ subtree: true })) if (a.playbackRate !== rate) a.playbackRate = rate;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [rate]);

  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms / rateRef.current)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const stopAll = useEffectEvent(clearTimers);

  const send = (q: string) => {
    follow.current = true;
    setBusy(true);
    setDraft("");
    setBeat("sent");
    setTurns((ts) => [...ts, { id: ts.length, q, key: match(q) }]);
  };

  const press = (target: string, fn: () => void) => {
    setPressed(target);
    later(target === "send" ? 170 : 280, () => { setPressed(null); fn(); });
  };

  const typeThenSend = (q: string) => {
    let i = 0;
    const tick = () => {
      i += 1;
      setDraft(q.slice(0, i));
      if (i < q.length) later(26 + Math.random() * 54 + (q[i - 1] === " " ? 45 : 0), tick);
      else later(420, () => press("send", () => send(q)));
    };
    later(700, () => { setBeat("typing"); tick(); });
  };

  // autoplay: type the opener; follow-ups come from onFinish
  const start = useEffectEvent(() => { if (auto) typeThenSend(OPEN); });
  useEffect(() => {
    start();
    return () => stopAll();
  }, []);
  useEffect(() => { if (!auto) stopAll(); }, [auto]);

  const asked = new Set(turns.map((t) => t.key));
  const last = turns.at(-1);
  const chips = busy ? [] : (last ? SCRIPTS[last.key].next : STARTERS).filter((k) => !asked.has(k));

  const finished = () => {
    setBusy(false);
    setBeat(chips.length || turns.length ? "next" : "idle");
    if (!auto) return;
    const pick = turns.length < 2 && last ? SCRIPTS[last.key].next.find((k) => !asked.has(k)) : undefined;
    if (pick) later(1500, () => press(pick, () => send(pick)));
    else { setLooping(true); later(5000, onReplay); }
  };

  const takeOver = () => {
    if (!auto) return;
    clearTimers();
    setLooping(false);
    setPressed(null);
    onTakeOver();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy || !draft.trim()) return;
    takeOver();
    send(draft.trim());
  };

  // keep the newest line in view while the thread grows, unless the visitor scrolled up
  useEffect(() => {
    const el = scroller.current;
    const inner = thread.current;
    if (!el || !inner) return;
    const ro = new ResizeObserver(() => { if (follow.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); });
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  // only the visitor's own wheel or touch stops the follow; the smooth scroll's
  // own in-between positions must not, or the "Latest" pill flashes mid-follow
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (fromBottom < 40) follow.current = true;
    setAway(!follow.current && fromBottom > 120);
    setScrolled(el.scrollTop > 4);
  };
  const leave = () => { follow.current = false; };

  const sendState = busy ? "stop" : draft.trim() ? "send" : "wait";
  const at = BEATS.findIndex(([b]) => b === beat);

  return (
    <>
      <div ref={panel} className={h.panel} style={{ height: 680, alignSelf: "start" }}>
        <PanelHeader />
        <div className={h.scrollWrap} data-scrolled={scrolled ? "" : undefined}>
          <div ref={scroller} className={h.scroll} onScroll={onScroll} onWheel={(e) => { if (e.deltaY < 0) leave(); }} onTouchMove={leave}>
            <div ref={thread} className={h.thread}>
              <div className={h.answer}>
                <Avatar size={36} />
                <div className={h.answerBody}><p>Hi, I&apos;m KYLLM. Ask me about Kyle&apos;s work, and I&apos;ll answer from his CV and link where each fact comes from.</p></div>
              </div>
              {turns.map((t) => (
                <TurnView key={t.id} q={t.q} script={SCRIPTS[t.key]} pace={pace} rate={rate} onBeat={setBeat} onFinish={finished} onMeter={setMeter} />
              ))}
            </div>
          </div>
          <button type="button" className={h.latest} data-show={away ? "" : undefined} onClick={() => { follow.current = true; scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }}>
            ↓ Latest
          </button>
        </div>
        <div className={h.foot}>
          {chips.length ? (
            <div className={h.chips} key={turns.length}>
              {chips.map((q, i) => (
                <button key={q} type="button" className={`${h.chip} ${d.chipIn}`} data-press={pressed === q ? "" : undefined}
                  style={{ "--i": i } as CSSProperties} onClick={() => { takeOver(); send(q); }}>
                  <i style={{ background: `var(--${i ? "b4" : "b2"})` }} />{q}
                </button>
              ))}
            </div>
          ) : null}
          <form className={`${s.composer} ${d.composer}`} data-has={draft ? "" : undefined} onSubmit={submit}>
            {auto ? (
              <span className={d.fake} data-empty={draft ? undefined : ""}>
                {draft || (busy ? "KYLLM is answering…" : "Ask KYLLM about my work…")}
                {beat === "typing" ? <span className={d.typeCaret} aria-hidden="true" /> : null}
              </span>
            ) : (
              <input className={d.input} value={draft} placeholder={busy ? "KYLLM is answering…" : "Ask KYLLM about my work…"} aria-label="Ask KYLLM"
                onChange={(e) => { setDraft(e.target.value); setBeat(e.target.value ? "typing" : last ? "next" : "idle"); }} />
            )}
            {!draft && !busy ? <Kbd>⌘K</Kbd> : null}
            <button type="submit" aria-label={sendState} data-press={pressed === "send" ? "" : undefined}
              className={[s.send, d.send, sendState === "stop" && s.sendStop, sendState === "wait" && s.sendWait].filter(Boolean).join(" ")}>
              {sendState === "stop" ? null : "↑"}
            </button>
          </form>
        </div>
      </div>

      <aside className={d.rail}>
        <div className={d.ctl}>
          {controls}
          <div className={d.meter} data-live={meter?.live ? "" : undefined}>
            {meter ? (
              <>
                <b>{meter.ms ? Math.round(meter.words / (meter.ms / 1000)) : 0} words/s</b>
                <span>{meter.live ? "Streaming" : "Last answer"}: {meter.words} words in {(meter.ms / 1000).toFixed(1)}s</span>
              </>
            ) : <span>The text speed shows here once an answer streams.</span>}
          </div>
        </div>
        <ol className={d.beats}>
          {BEATS.map(([b, name, note], i) => (
            <li key={b} className={d.beat} data-state={i === at ? "now" : at > i || (beat === "idle" && turns.length) ? "done" : undefined}>
              <span className={d.dot}>{i + 1}</span>
              <b>{name}</b>
              <p>{note}</p>
            </li>
          ))}
        </ol>
        {looping ? <small className={d.loopNote}>Replaying in 5 seconds</small> : null}
      </aside>
    </>
  );
}

function Toggle<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <div className={d.ctlRow}>
      <small>{label}</small>
      <span className={d.toggle} role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={String(v)} type="button" data-on={v === value ? "" : undefined} aria-pressed={v === value} onClick={() => onChange(v)}>{text}</button>
        ))}
      </span>
    </div>
  );
}

export function Demo() {
  const [run, setRun] = useState(0);
  const [auto, setAuto] = useState(true);
  const [pace, setPace] = useState<Pace>("paced");
  const [rate, setRate] = useState(1);
  const replay = (a = auto) => { setAuto(a); setRun((r) => r + 1); };

  return (
    <div className={d.page}>
      <div className={d.bar}>
        <div>
          <h1>One exchange, end to end</h1>
          <p>Autoplay types a question, then picks a follow-up. Type or click anything to take over.</p>
        </div>
        <div className={d.controls}>
          <span className={d.toggle} role="group" aria-label="Mode">
            <button type="button" data-on={auto ? "" : undefined} onClick={() => replay(true)}>Autoplay</button>
            <button type="button" data-on={auto ? undefined : ""} onClick={() => setAuto(false)}>Try it</button>
          </span>
          <button type="button" className={d.btn} onClick={() => replay()}>Replay</button>
        </div>
      </div>
      <div className={d.stage}>
        <Chat key={run} auto={auto} pace={pace} rate={rate} onTakeOver={() => setAuto(false)} onReplay={() => replay(true)}
          controls={(
            <>
              <Toggle label="Text speed" value={pace} onChange={setPace}
                options={(Object.keys(PACES) as Pace[]).map((p) => [p, `${PACES[p].label} · ${PACES[p].wps}/s`])} />
              <Toggle label="Slow motion" value={rate} onChange={setRate} options={RATES.map((r) => [r, r === 1 ? "Off" : `${r}x`])} />
            </>
          )} />
      </div>
    </div>
  );
}
