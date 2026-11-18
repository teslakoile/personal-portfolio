"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BookOpen, ChevronRight, MessageSquareText, PenLine, ShieldCheck, Square, Wrench, X, type LucideIcon } from "lucide-react";
import type { StepKind } from "../../_kyllm/protocol";
import s from "./liveSteps.module.css";

/*
 * LiveSteps: what KYLLM did for one answer, drawn from the route's real
 * `step` events (C2 Aligned Strip, picked 2026-11-14 in the "KYLLM Live
 * Steps" artifact). A row appears when its step starts and its bar stops when
 * the step ends; nothing runs on a timer of its own.
 *
 * While KYLLM works, the list is open and the header reads "Answering", with
 * the live step's icon, a strip of the whole run in the bar column on the
 * same time scale as the bars, and the clock. Once the answer is done the
 * list folds and the header is one summary row: "Answered in 5.8s, 6 Steps".
 * Labels are Title Case, like the site's other UI labels.
 *
 * Step colours: Understanding the question yellow (b4), Using tools blue
 * (b3), Writing the answer coral (b1), Checking the answer green (b2). The
 * done header shows a neutral answer icon, kept apart from the check's
 * shield, or a cross when the check flagged a citation.
 */

export type StepState = "live" | "done" | "failed" | "stopped";
export type StepRow = {
  id: number; kind: StepKind; label: string; detail: string;
  /** ms from the question being sent */
  start: number; end?: number;
  /** how it ended; unset while live */
  state?: Exclude<StepState, "live">;
};
export type StepRun = {
  /** performance.now() when the question was sent */
  t0: number;
  steps: StepRow[];
  /** ms from send to the end of the stream */
  end?: number;
  outcome?: "ok" | "stopped" | "failed";
};

const ICON: Record<StepKind, LucideIcon> = { think: BookOpen, tool: Wrench, write: PenLine, check: ShieldCheck };
const LABEL: Record<Exclude<StepKind, "tool">, string> = { think: "Understanding the Question", write: "Writing the Answer", check: "Checking the Answer" };
export const stepLabel = (kind: StepKind, label?: string) => (kind === "tool" ? label || "Looking Up a File" : LABEL[kind]);

const sec = (ms: number) => `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
// no-break spaces keep "0.8s to 1.9s" on one line when a note wraps
const nb = (x: string) => x.replace(/ /g, " ");

function Icon({ kind, state }: { kind: StepKind; state: StepState }) {
  const G = state === "failed" ? X : state === "stopped" ? Square : ICON[kind];
  return <span className={s.ic} data-cat={kind} data-state={state}><G aria-hidden="true" /></span>;
}

/** The header for several tool calls at once: "Looking Up 3 Files" when all are reads. */
const manyTools = (xs: { label: string }[]) => (xs.every((x) => x.label.startsWith("Looking Up ")) ? `Looking Up ${xs.length} Files` : `${xs.length} Tool Calls`);

type Shown = Omit<StepRow, "state"> & { state: StepState; to: number };
type Hover = { hot: number[]; title: string; text: string; x: number; y: number; scrub?: { top: number; height: number } } | null;

/** One answer's steps. `onStep` gets the index of each step as it starts. */
export function LiveSteps({ run, onStep }: { run: StepRun; onStep?: (i: number) => void }) {
  const working = !run.outcome;
  const [now, setNow] = useState(() => (working ? performance.now() - run.t0 : run.end ?? 0));
  const [open, setOpen] = useState(working);
  const touched = useRef(false);
  const [hover, setHover] = useState<Hover>(null);
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const id = useId();

  // the clock: every frame while working
  useEffect(() => {
    if (!working) return;
    let raf = 0;
    const tick = () => { setNow(performance.now() - run.t0); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [working, run.t0]);

  // a sound per step as it starts
  const reported = useRef(run.steps.length);
  const step = useRef(onStep);
  useEffect(() => { step.current = onStep; }, [onStep]);
  useEffect(() => {
    for (; reported.current < run.steps.length; reported.current++) step.current?.(reported.current);
  }, [run.steps.length]);

  // fold once done, unless the visitor opened or closed it
  useEffect(() => {
    if (working || touched.current) return;
    const t = setTimeout(() => { if (!touched.current) setOpen(false); }, 900);
    return () => clearTimeout(t);
  }, [working]);

  const t = working ? Math.max(now, run.steps.at(-1)?.start ?? 0) : run.end ?? now;
  const span = Math.max(t, 1);
  const steps: Shown[] = run.steps.map((x) => {
    const state: StepState = x.end === undefined ? (working ? "live" : "stopped") : x.state ?? "done";
    return { ...x, state, to: x.end ?? t };
  });
  const live = steps.filter((x) => x.state === "live");
  const liveTools = live.filter((x) => x.kind === "tool");
  const head = open ? "Answering" : liveTools.length > 1 ? manyTools(liveTools) : live.at(-1) ? stepLabel(live.at(-1)!.kind, live.at(-1)!.label) : "Answering";
  const total = run.outcome === "ok" ? `Answered in ${sec(t)}` : run.outcome === "stopped" ? `Stopped After ${sec(t)}` : `No Answer After ${sec(t)}`;
  const leadKind = live.at(-1)?.kind;
  // the done header carries the check's result: its shield, or a cross when it flagged a citation
  const checked: StepState = steps.find((x) => x.kind === "check")?.state === "failed" ? "failed" : "done";
  const lead = working
    ? leadKind ? <Icon key={leadKind} kind={leadKind} state="live" /> : <span key="spin" className={s.spin} />
    : run.outcome === "ok" && checked === "done"
      ? <span key="answered" className={s.ic} data-cat="answer"><MessageSquareText aria-hidden="true" /></span>
      : <Icon key={`end-${run.outcome}`} kind={run.outcome === "ok" ? "check" : "write"} state={run.outcome === "ok" ? "failed" : run.outcome!} />;
  const chev = <ChevronRight className={s.chev} aria-hidden="true" />;
  const pos = (x: Shown) => ({ left: `${(x.start / span) * 100}%`, width: `max(2px, ${((x.to - x.start) / span) * 100}%)` });

  // hover: a note for the step under the pointer; on the strip, every step running at that moment
  const fxOf = (el: Element | null | undefined, x: number) => {
    const r = el?.getBoundingClientRect();
    return r && r.width ? Math.min(1, Math.max(0, (x - r.left) / r.width)) : 0;
  };
  const range = (a: number, b: number, isLive: boolean) => nb(isLive ? `${sec(a)} to now` : `${sec(a)} to ${sec(b)}`);
  const one = (x: Shown) => {
    const when = range(x.start, x.to, x.state === "live");
    return { title: stepLabel(x.kind, x.label), text: x.detail ? `${x.detail}\u00a0·\u00a0${when}` : when };
  };
  const onList = (e: ReactPointerEvent) => {
    const box = root.current?.getBoundingClientRect();
    const li = (e.target as Element).closest("li");
    const i = li ? [...(list.current?.children ?? [])].indexOf(li) : -1;
    const tr = li?.querySelector(`.${s.track}`)?.getBoundingClientRect();
    if (!box || !tr || i < 0 || !steps[i]) return setHover(null);
    const x = steps[i];
    const b0 = tr.left + (x.start / span) * tr.width, b1 = Math.max(b0 + 2, tr.left + (x.to / span) * tr.width);
    setHover({ hot: [i], ...one(x), x: Math.min(b1, Math.max(b0, e.clientX)) - box.left, y: tr.top + 6 - box.top });
  };
  const onHead = (e: ReactPointerEvent) => {
    const box = root.current?.getBoundingClientRect();
    const rr = strip.current?.getBoundingClientRect();
    const near = rr && rr.width > 0 && e.clientX >= rr.left - 4 && e.clientX <= rr.right + 4 && Math.abs(e.clientY - (rr.top + rr.height / 2)) <= 10;
    if (!box || !rr || !near || !steps.length) return setHover(null);
    const fx = fxOf(strip.current, e.clientX), at = fx * span;
    let hot = steps.flatMap((x, i) => (x.start <= at && at <= x.to ? [i] : []));
    if (!hot.length) {
      // between steps: the nearest one
      const d = steps.map((x) => Math.min(Math.abs(x.start - at), Math.abs(x.to - at)));
      hot = [d.indexOf(Math.min(...d))];
    }
    const ss = hot.map((i) => steps[i]);
    const reads = ss.every((x) => x.kind === "tool" && x.label.startsWith("Looking Up "));
    const names = ss.map((x) => nb(reads ? x.label.replace(/^Looking Up /, "") : stepLabel(x.kind, x.label)));
    const joined = names.length > 2 ? `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}` : names.join(" and ");
    const a = Math.min(...ss.map((x) => x.start)), b = Math.max(...ss.map((x) => x.to));
    // with the list open, the scrub line runs down through every row
    const lr = list.current?.getBoundingClientRect();
    const bottom = open && lr && lr.height > 0 ? lr.bottom : rr.bottom + 3;
    setHover({
      hot,
      ...(ss.length === 1 ? one(ss[0]) : { title: ss.every((x) => x.kind === "tool") ? manyTools(ss) : `${ss.length} Steps`, text: `${joined}\u00a0·\u00a0${range(a, b, ss.some((x) => x.state === "live"))}` }),
      x: rr.left + fx * rr.width - box.left, y: rr.top - 2 - box.top,
      scrub: { top: rr.top - box.top - 3, height: bottom - rr.top + 3 },
    });
  };

  // centre the note over the pointer, kept inside the block
  const tipEl = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = tipEl.current, box = root.current;
    if (!el || !box || !hover) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = `${Math.min(Math.max(0, hover.x - w / 2), Math.max(0, box.offsetWidth - w))}px`;
    el.style.top = `${hover.y - h - 8}px`;
  }, [hover]);
  const hot = hover?.hot ?? [];

  return (
    <div ref={root} className={s.steps} data-phase={working ? "working" : "done"} data-open={open ? "" : undefined} data-hover={hover ? "" : undefined}>
      <button type="button" className={s.head} aria-expanded={open} aria-controls={id}
        onClick={() => { touched.current = true; setOpen((o) => !o); }}
        onPointerMove={onHead} onPointerLeave={() => setHover(null)}>
        <span className={s.lead}>{lead}</span>
        <span className={s.swap}>
          <span className={s.hw} aria-hidden={!working}><span key={head} className={s.lbl}>{head}</span>{chev}</span>
          <span className={s.hd} aria-hidden={working}><span>{total}</span>{steps.length ? <em>{steps.length} {steps.length === 1 ? "Step" : "Steps"}</em> : null}{steps.length ? chev : null}</span>
        </span>
        <span ref={strip} className={s.strip} aria-hidden="true">
          {steps.map((x, i) => <i key={x.id} data-cat={x.kind} data-state={x.state} data-hot={hot.includes(i) ? "" : undefined} style={pos(x)} />)}
        </span>
        <span className={s.htime}>{sec(t)}</span>
      </button>
      <div id={id} className={s.fold} inert={!open}>
        <div>
          <ol ref={list} className={s.list} onPointerMove={onList} onPointerLeave={() => setHover(null)}>
            {steps.map((x, i) => (
              <li key={x.id} className={s.row} data-cat={x.kind} data-state={x.state} data-hot={hot.includes(i) ? "" : undefined}>
                <Icon kind={x.kind} state={x.state} />
                <span className={s.txt}><span className={s.lab}>{stepLabel(x.kind, x.label)}</span>{x.detail ? <em>{x.detail}</em> : null}</span>
                <span className={s.track}><span className={s.bar} data-cat={x.kind} data-state={x.state} style={pos(x)} /></span>
                <time data-state={x.state}>{sec(x.to - x.start)}</time>
              </li>
            ))}
          </ol>
        </div>
      </div>
      {hover ? (
        <>
          <div ref={tipEl} className={s.tip} role="tooltip"><b>{hover.title}</b><span>{hover.text}</span></div>
          {hover.scrub ? <i className={s.scrub} style={{ left: hover.x, top: hover.scrub.top, height: hover.scrub.height }} aria-hidden="true" /> : null}
        </>
      ) : null}
    </div>
  );
}
