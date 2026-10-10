"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Loading } from "../states/States";
import { ASK_VERBS } from "../states/verbs";
import t from "./steps.module.css";

/*
 * Steps: what KYLLM did before answering (formerly "agent trace").
 *
 * Every step has a category, shown as an icon on a tinted chip and, in the
 * waterfall, as its bar colour. The four block colours are data colours, and
 * here they encode data: what kind of work each step was.
 *   think  reading and reasoning      b3 blue
 *   tool   searching, opening pages   b4 amber
 *   write  composing the answer       b1 coral-red
 *   check  verifying, linking sources b2 sage
 *
 * One lifecycle for every design:
 *   working  the loading line heads the block; steps arrive one at a time
 *   done     the header crossfades to "Read the CV for 2.5s"; the list folds
 *            700ms later unless the visitor opened it
 */

export type StepsVariant = "rail" | "waterfall" | "sources";
type Phase = "working" | "done";
type Cat = "think" | "tool" | "write" | "check";
type RowState = "done" | "live" | "wait";

export const CATS: Record<Cat, { label: string; icon: string }> = {
  think: { label: "Thinking", icon: "M2 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H2zM22 5h-6a3 3 0 0 0-3 3v11a2 2 0 0 1 2-2h7z" },
  tool: { label: "Tool use", icon: "M4 17l6-6-6-6M12 19h8" },
  write: { label: "Writing", icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" },
  check: { label: "Checking", icon: "M20 6L9 17l-5-5" },
};

export type StepData = { cat: Cat; text: string; meta: string; section?: string; ms: number };
/** The demo run: "How does the MCP server work?" */
export const MCP_RUN: StepData[] = [
  { cat: "think", text: "Reading the question", meta: "about the MCP server", ms: 200 },
  { cat: "tool", text: "Searching the CV", meta: "4 matches", ms: 300 },
  { cat: "tool", text: "Opening MCP Server", meta: "Proof of Concept", section: "Projects · MCP Server", ms: 400 },
  { cat: "think", text: "Reading the write-up", meta: "2 paragraphs", section: "Projects · MCP Server", ms: 500 },
  { cat: "tool", text: "Checking Community talks", meta: "2 talks", section: "Community · Talks", ms: 300 },
  { cat: "write", text: "Writing the answer", meta: "3 sentences", ms: 600 },
  { cat: "check", text: "Linking sources", meta: "2 sources", ms: 200 },
];
type Run = { steps: StepData[]; total: number; starts: number[] };
const toRun = (steps: StepData[]): Run => ({
  steps,
  total: steps.reduce((a, s) => a + s.ms, 0),
  starts: steps.map((_, i) => steps.slice(0, i).reduce((a, s) => a + s.ms, 0)),
});
const sec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export function CatIcon({ cat, state = "done", size = 22 }: { cat: Cat; state?: RowState; size?: number }) {
  return (
    <span className={t.cat} data-cat={cat} data-state={state} style={{ "--s": `${size}px` } as CSSProperties} title={CATS[cat].label}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={CATS[cat].icon} /></svg>
    </span>
  );
}

export function Legend() {
  return (
    <div className={t.legend}>
      {(Object.keys(CATS) as Cat[]).map((c) => <span key={c}><CatIcon cat={c} size={18} />{CATS[c].label}</span>)}
    </div>
  );
}

function Chev({ open }: { open: boolean }) {
  return (
    <svg className={t.chev} data-open={open ? "" : undefined} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

/** Proportional strip of the whole run, one segment per step in its category colour. */
function Strip({ run }: { run: Run }) {
  return (
    <span className={t.strip} aria-hidden="true">
      {run.steps.map((s) => <i key={s.text} data-cat={s.cat} style={{ flexGrow: s.ms }} />)}
    </span>
  );
}

/**
 * Waterfall bar on the run's timeline. `span` is the timeline's length in ms:
 * the expected total, or longer once a slow step overruns it, so the whole
 * waterfall zooms out instead of the live bar running off the edge.
 */
function Bar({ run, i, state, span, liveMs }: { run: Run; i: number; state: RowState; span: number; liveMs: number }) {
  const s = run.steps[i];
  if (state === "wait") return null;
  const ms = state === "live" ? liveMs : s.ms;
  const style = {
    left: `${(run.starts[i] / span) * 100}%`,
    width: `max(2px, ${(ms / span) * 100}%)`,
    "--dur": `${s.ms}ms`,
  } as CSSProperties;
  return (
    <span className={t.bar} data-cat={s.cat} data-state={state} style={style}
      data-tip={`${sec(run.starts[i])} to ${sec(run.starts[i] + s.ms)}`}>
      {state === "live" ? <i className={t.edge} /> : null}
    </span>
  );
}

function Row({ v, run, i, state, span, liveMs }: { v: StepsVariant; run: Run; i: number; state: RowState; span: number; liveMs: number }) {
  const s = run.steps[i];
  return (
    <li className={t.row} data-state={state} data-cat={s.cat} style={{ "--i": i, "--r": i + 1 } as CSSProperties}>
      <CatIcon cat={s.cat} state={state} />
      <span className={t.text}>{s.text}{state === "live" ? "…" : ""}</span>
      {v === "waterfall" ? (
        <>
          <span className={t.track}><Bar run={run} i={i} state={state} span={span} liveMs={liveMs} /></span>
          <time data-state={state}>{state === "done" ? sec(s.ms) : state === "live" ? sec(liveMs) : ""}</time>
        </>
      ) : v === "sources" ? (
        s.section && state !== "wait"
          ? <a className={t.src} href="#" onClick={(e) => e.preventDefault()}>{s.section}<span aria-hidden="true">↗</span></a>
          : <em>{state === "done" ? s.meta : ""}</em>
      ) : (
        <em>{state === "done" ? s.meta : ""}</em>
      )}
    </li>
  );
}

/**
 * One Steps block. `play` runs the live sequence on mount (remount with a new
 * key to replay); `freeze` pins a phase for screenshots. `rate` below 1 plays
 * it in slow motion while the bars and seconds still show the run's own time;
 * a change applies from the next step.
 */
export function Steps({ v, steps = MCP_RUN, play = 0, loop = false, freeze, defaultOpen = false, onDone, rate = 1 }: {
  v: StepsVariant; steps?: StepData[]; play?: number; loop?: boolean; freeze?: { phase: Phase; shown?: number }; defaultOpen?: boolean; onDone?: () => void; rate?: number;
}) {
  const [run] = useState(() => toRun(steps));
  const STEPS = run.steps;
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);
  const rateRef = useRef(rate);
  useEffect(() => { rateRef.current = rate; }, [rate]);
  const [phase, setPhase] = useState<Phase>(freeze?.phase ?? (play ? "working" : "done"));
  const [shown, setShown] = useState(freeze?.shown ?? (play ? 0 : STEPS.length));
  const [open, setOpen] = useState(freeze ? defaultOpen : play ? true : defaultOpen);
  const touched = useRef(false);
  const t0 = useRef(0);
  const [took, setTook] = useState(run.total);
  const stepT0 = useRef(0);
  const shownRef = useRef(0);
  // tagged with its step, so a new step never inherits the last one's length for a frame
  const [clock, setClock] = useState({ i: -1, ms: 0 });
  const id = useId();

  useEffect(() => {
    if (freeze || !play) return;
    if (phase === "working") {
      if (shown === 0 && !t0.current) t0.current = performance.now();
      stepT0.current = performance.now();
      shownRef.current = shown;
      const r = rateRef.current;
      const id = shown < STEPS.length
        ? setTimeout(() => setShown((n) => n + 1), STEPS[shown].ms / r)
        : setTimeout(() => { setTook((performance.now() - t0.current) * r); setPhase("done"); done.current?.(); }, 150 / r);
      return () => clearTimeout(id);
    }
    // done: a looping demo starts over; otherwise fold unless the visitor opened it
    const id = loop
      ? setTimeout(() => { t0.current = 0; setShown(0); setPhase("working"); }, 1400 / rateRef.current)
      : setTimeout(() => { if (!touched.current) setOpen(false); }, 700 / rateRef.current);
    return () => clearTimeout(id);
  }, [phase, shown, play, freeze, STEPS, loop]);

  // the live step's own clock: drives its bar length and its counting seconds
  useEffect(() => {
    if (freeze || !play || phase !== "working") return;
    let raf = 0;
    const tick = () => { setClock({ i: shownRef.current, ms: (performance.now() - stepT0.current) * rateRef.current }); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, play, freeze]);

  const working = phase === "working";
  const stateOf = (i: number): RowState => (!working || i < shown ? "done" : i === shown ? "live" : "wait");
  const live = working && shown < STEPS.length;
  const liveMs = clock.i === shown ? clock.ms : 0;
  const span = live ? Math.max(run.total, run.starts[shown] + liveMs) : run.total;

  return (
    <div className={t.block} data-v={v} data-phase={phase} data-run={play && !freeze ? "" : undefined} data-open={open ? "" : undefined}>
      <button type="button" className={t.head} aria-expanded={open} aria-controls={id} disabled={working}
        onClick={() => { touched.current = true; setOpen((o) => !o); }}>
        <span className={t.headSwap}>
          <span className={t.headWorking} aria-hidden={!working}>{working ? <Loading verbs={ASK_VERBS} timer rate={rate} /> : null}</span>
          <span className={t.headDone} aria-hidden={working}>
            <span>Read the CV for {sec(took)}</span>
            <em>{STEPS.length} steps</em>
            {v === "waterfall" && !working ? <Strip run={run} /> : null}
          </span>
        </span>
        {working ? null : <Chev open={open} />}
      </button>
      <div id={id} className={t.body} data-open={open ? "" : undefined} inert={!open}>
        <div className={t.inner}>
          <ol className={t.list}>
            {STEPS.map((s, i) => <Row key={s.text} v={v} run={run} i={i} state={stateOf(i)} span={span} liveMs={live && i === shown ? liveMs : 0} />)}
          </ol>
        </div>
      </div>
    </div>
  );
}

/** Live run with a replay button, then the three resting states. */
export function StepsOption({ v }: { v: StepsVariant }) {
  const [run, setRun] = useState(1);
  return (
    <div className={t.matrix}>
      <div className={t.cell}>
        <div className={t.cellHead}><small>Live</small><button type="button" className={t.replay} onClick={() => setRun((r) => r + 1)}>Replay</button></div>
        <Steps key={run} v={v} play={run} />
      </div>
      <div className={t.cell}><small>Working, on a loop</small><Steps v={v} play={1} loop /></div>
      <div className={t.cell}><small>Done, folded</small><Steps v={v} freeze={{ phase: "done" }} /></div>
      <div className={t.cell}><small>Done, open</small><Steps v={v} freeze={{ phase: "done" }} defaultOpen /></div>
    </div>
  );
}
