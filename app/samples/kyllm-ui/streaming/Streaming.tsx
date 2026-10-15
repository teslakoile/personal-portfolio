"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Cite, Pill } from "../kit";
import { KyllmLive } from "../rig/KyllmLive";
import { ReviewButtons, ReviewCard, ReviewNote, ReviewPick } from "../review/Review";
import { SmoothText } from "./SmoothText";
import s from "../kyllm.module.css";
import h from "../hero.module.css";
import st from "./streaming.module.css";

/*
 * The answer stream, four ways, fed by one arrival schedule so every card gets
 * the same words at the same moments. The model pace sends uneven bursts of 1
 * to 3 words at about 30 words a second, with one 650 ms stall partway through
 * (a slow chunk or a tool call), which is what each treatment has to handle.
 * Only text that has arrived is ever shown: nothing renders ahead of the stream.
 */

type Seg = string | { cite: number };
type Tok = { w: string } | { cite: number };
type Pace = "model" | "steady";

// the AGENTS answer from the demo, word for word
const Q = "What else has he built with agents?";
const TEXT: Seg[] = [
  "At Thinking Machines he works on Snowflake Cortex agent workflows that let investment officers query long-form documents, owning the agent tooling, prompts, evaluation, and incident triage", { cite: 1 },
  ". He also wires AI coding agents into his team's delivery with custom skills, hooks, and commands", { cite: 2 }, ".",
];
const SOURCES: [string, string][] = [["Projects", "Document Intelligence"], ["Experience", "Thinking Machines"]];
const TOKS: Tok[] = TEXT.flatMap((g): Tok[] => (typeof g === "string" ? (g.match(/\s*\S+\s*/g) ?? []).map((w) => ({ w })) : [g]));
const N = TOKS.length;

/** When each token arrives, in ms from the start; the same every replay (seeded). */
function schedule(pace: Pace): number[] {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const at: number[] = [];
  let t = 160, stalled = false;
  while (at.length < N) {
    if (pace === "steady") { t += (1000 / 14) * (0.8 + rnd() * 0.4); at.push(t); continue; }
    const chunk = 1 + Math.floor(rnd() * 3);
    t += ((chunk * 1000) / 30) * (0.6 + rnd() * 0.8);
    if (!stalled && at.length > N * 0.45) { t += 650; stalled = true; }
    for (let k = 0; k < chunk && at.length < N; k++) at.push(t);
  }
  return at;
}

/** How many tokens have arrived, replaying the schedule (slowed by `rate`). Cards remount per replay. */
function useArrived(at: number[], run: number, rate: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    const ids = at.map((ms, i) => window.setTimeout(() => setN((x) => Math.max(x, i + 1)), ms / rate));
    return () => ids.forEach(clearTimeout);
  }, [at, run, rate]);
  return n;
}

/** True once `n` has not changed for `ms` (a stall), until the stream ends. */
function useIdle(n: number, ms: number, done: boolean) {
  const [stalledAt, setStalledAt] = useState(-1);
  useEffect(() => {
    if (done || !n) return;
    const id = window.setTimeout(() => setStalledAt(n), ms);
    return () => clearTimeout(id);
  }, [n, ms, done]);
  return !done && stalledAt === n;
}

/** Lines open smoothly (height eases) or snap in as the paragraph wraps. */
function Grow({ smooth, children }: { smooth: boolean; children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [hgt, setHgt] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHgt(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className={smooth ? st.grow : undefined} style={smooth && hgt !== null ? { height: hgt } : undefined}>
      <div ref={inner}>{children}</div>
    </div>
  );
}

const citeEl = (t: { cite: number }, key: number, className: string) => <span key={key} className={className}><Cite n={t.cite} /></span>;

/* ------------------------------------------------------------- A: current */
function Current({ n, done }: { n: number; done: boolean }) {
  return (
    <p className={st.p}>
      {TOKS.slice(0, n).map((t, i) => ("w" in t ? <span key={i} className={st.blurIn}>{t.w}</span> : citeEl(t, i, st.pop)))}
      {done ? null : <span className={st.block} aria-hidden="true" />}
    </p>
  );
}

/* ---------------------------------------------------------- C: phrase rise */
const ENDS = /[,.;:!?]\s*$/;
/** Phrase ends up to `n`: a comma or full stop, a citation, six words, or a flush after a 0.3 s hold. */
function phrases(n: number, flushed: number[]) {
  const ends: number[] = [];
  let b = 0;
  for (let j = 1; j <= n; j++) {
    const t = TOKS[j - 1];
    if (!("w" in t) || ENDS.test(t.w) || j - b >= 6 || flushed.includes(j)) { ends.push(j); b = j; }
  }
  return ends;
}
function Phrase({ n, done, rate }: { n: number; done: boolean; rate: number }) {
  const [flushed, setFlushed] = useState<number[]>([]);
  const ends = phrases(n, flushed);
  const shown = ends.at(-1) ?? 0;
  // never hold arrived text back for more than 0.3 s, so a stall can't hide it
  useEffect(() => {
    if (n <= shown) return;
    const id = window.setTimeout(() => setFlushed((f) => [...f, n]), 300 / rate);
    return () => clearTimeout(id);
  }, [n, shown, rate]);
  const groups = ends.map((end, k) => [k ? ends[k - 1] : 0, end] as const);
  return (
    <p className={st.p}>
      {groups.map(([start, end]) => (
        <span key={start} className={st.rise}>
          {TOKS.slice(start, end).map((t, i) => ("w" in t ? t.w : citeEl(t, start + i, st.citeSoft)))}
        </span>
      ))}
      {done ? null : <span className={st.bar} aria-hidden="true" />}
    </p>
  );
}

/* ---------------------------------------------------------- D: quiet words */
// each citation backs the words since the previous citation or sentence end
const CLAUSE: number[] = TOKS.map(() => -1);
{
  let from = 0;
  TOKS.forEach((t, i) => {
    if ("cite" in t) { for (let j = from; j < i; j++) CLAUSE[j] = i; from = i + 1; }
    else if (/^\s*[.!?]/.test(t.w)) from = i + 1;
  });
}
function Quiet({ n, done, idle }: { n: number; done: boolean; idle: boolean }) {
  return (
    <p className={st.p}>
      {TOKS.slice(0, n).map((t, i) => {
        if ("cite" in t) return citeEl(t, i, st.fadeIn);
        const lit = CLAUSE[i] >= 0 && CLAUSE[i] < n;
        return <span key={i} className={lit ? `${st.fade} ${st.lit}` : st.fade}>{t.w}</span>;
      })}
      {!done && idle ? <span className={st.dots} aria-hidden="true"><i /><i /><i /></span> : null}
    </p>
  );
}

/* ------------------------------------------------------------------ cards */
type Option = { id: string; name: string; tag: string; how: string; cost: string };
const OPTIONS: Option[] = [
  { id: "A", name: "Current", tag: "Now", how: "Each word fades in from a 3 px blur, a coral block breathes at the end, and citations pop in with an overshoot.", cost: "Bursts land as jumps of 1 to 3 words. The blur on every word and the block caret are loud next to 15 px body text." },
  { id: "B", name: "Smooth Characters", tag: "Picked", how: "A buffer releases the text at an even 55 characters a second, speeding up when it falls behind. Each character fades in over 180 ms, so the newest few form a soft tail. A thin coral bar blinks at the end when the stream pauses, or the whole time with Always.", cost: "Runs about 0.15 s behind the stream, so it finishes a beat after the others. The steadiest motion of the four." },
  { id: "C", name: "Phrase Rise", tag: "New", how: "Holds words until a comma or full stop (or six words), then shows the phrase at once, rising 3 px. A thin coral bar marks the end.", cost: "Easiest to read while it streams, but the text arrives in visible steps. Never holds text more than 0.3 s." },
  { id: "D", name: "Quiet Words", tag: "New", how: "Words fade in over 180 ms with no blur or motion. No caret: three small dots show only during a stall. A citation tints its clause coral for a moment, so you see what it backs.", cost: "The quietest. Bursts still land as small jumps." },
];

function Card({ o, run, at, rate, smooth, always, onAlways }: {
  o: Option; run: number; at: number[]; rate: number; smooth: boolean; always: boolean; onAlways: (v: boolean) => void;
}) {
  const n = useArrived(at, run, rate);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (n < N) return;
    const id = window.setTimeout(() => setDone(true), 250 / rate);
    return () => clearTimeout(id);
  }, [n, rate]);
  const idle = useIdle(n, (o.id === "D" ? 300 : 400) / rate, n >= N);
  const body =
    o.id === "A" ? <Current n={n} done={done} /> :
    o.id === "B" ? <SmoothText className={st.p} toks={TOKS} n={n} done={done} rate={rate} always={always} /> :
    o.id === "C" ? <Phrase n={n} done={done} rate={rate} /> :
    <Quiet n={n} done={done} idle={idle} />;
  return (
    <figure className={st.card} data-option={o.id}>
      <figcaption>
        <div className={st.cardHead}><b>{o.id}. {o.name}</b><span className={o.tag === "Now" ? st.tagNow : st.tagNew}>{o.tag}</span></div>
        <p>{o.how}</p>
        <small>{o.cost}</small>
        {o.id === "B" ? (
          <div className={st.opt}>
            <small>Caret</small>
            <Toggle value={always ? "always" : "pause"} options={[["pause", "On Pauses"], ["always", "Always"]]} onChange={(v) => onAlways(v === "always")} />
          </div>
        ) : null}
      </figcaption>
      <div className={st.mock}>
        <div className={s.user}>{Q}</div>
        <div className={h.answer}>
          <span className={st.av}><KyllmLive touch size={36} mood={done ? "answered" : "idle"} /></span>
          <div className={h.answerBody}>
            <Grow smooth={smooth}>{run ? body : <p className={st.p}>&nbsp;</p>}</Grow>
            {done ? (
              <div className={`${h.sources} ${st.srcs}`}>
                <span>Sources</span>
                {SOURCES.map(([sec, name]) => <Pill key={name} kind="source"><b>{sec}</b>{name}</Pill>)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </figure>
  );
}

function Toggle<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <span className={st.toggle}>
      {options.map(([v, label]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>{label}</button>
      ))}
    </span>
  );
}

export function Streaming() {
  const [run, setRun] = useState(0);
  const [pace, setPace] = useState<Pace>("model");
  const [rate, setRate] = useState(1);
  const [smooth, setSmooth] = useState(false);
  const [always, setAlways] = useState(false);
  const [at, setAt] = useState(() => schedule("model"));
  useEffect(() => { const id = window.setTimeout(() => setRun(1), 500); return () => clearTimeout(id); }, []);
  const replay = () => setRun((r) => r + 1);
  return (
    <div className={st.page}>
      <header className={st.intro}>
        <h1>Answer Streaming</h1>
        <p>
          The answer as it streams in, now (A) and three alternatives, all fed the same words at the same moments. The model pace
          sends uneven bursts at about 30 words a second with one stall partway through, the case each one has to handle.
        </p>
      </header>
      <div className={st.controls}>
        <button type="button" className={st.replay} onClick={replay}>Replay</button>
        <Toggle value={pace} options={[["model", "Model Bursts"], ["steady", "Steady"]]} onChange={(p) => { setPace(p); setAt(schedule(p)); replay(); }} />
        <Toggle value={rate} options={[[1, "1x"], [0.5, "0.5x"], [0.25, "0.25x"]]} onChange={(r) => { setRate(r); replay(); }} />
        <Toggle value={smooth ? "smooth" : "snap"} options={[["snap", "Lines Snap"], ["smooth", "Lines Ease"]]} onChange={(v) => { setSmooth(v === "smooth"); replay(); }} />
      </div>
      <div className={st.grid}>
        {OPTIONS.map((o) => <Card key={`${o.id}-${run}`} o={o} run={run} at={at} rate={rate} smooth={smooth} always={always} onAlways={(v) => { setAlways(v); replay(); }} />)}
      </div>
      <ReviewCard name="Answer streaming" className={st.review}>
        <div className={st.reviewHead}><h3>Your Pick</h3><ReviewButtons name="Answer streaming" /></div>
        <ReviewPick name="Answer streaming" options={OPTIONS.map((o) => o.name)} />
        <ReviewNote name="Answer streaming" />
      </ReviewCard>
    </div>
  );
}
