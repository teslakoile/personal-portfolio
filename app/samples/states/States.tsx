"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import s from "./states.module.css";
import { ASK_VERBS, PIPELINE_VERBS, SEND_VERBS } from "./verbs";
import { ChevronLoader } from "../loaders/Loaders";

/*
 * Loading and hover experiments for the proposed "data blocks" brand.
 * The one idea that ties them together: things on this site load the way
 * Kyle's pipelines run. Raw grey blocks get processed into color, and the
 * waiting copy speaks his trade (deduplicating, backfilling, Splinking).
 */

/* ------------------------------ helpers ------------------------------- */

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Seconds since `running` became true, ticking every 100ms. */
function useElapsed(running: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const id = setInterval(() => setT((performance.now() - start) / 1000), 100);
    return () => { clearInterval(id); setT(0); };
  }, [running]);
  return t;
}

const SWAP_MS = 420; // how long the outgoing word takes to fade away

/**
 * Next verb every `ms`, never the same one twice in a row. Also returns the
 * outgoing verb for SWAP_MS after a change, so both can crossfade.
 */
function useVerb(verbs: string[], ms: number, running = true) {
  const [state, setState] = useState<{ i: number; prev: number | null }>({ i: 0, prev: null });
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setState(({ i }) => {
        const r = Math.floor(Math.random() * (verbs.length - 1));
        return { i: r >= i ? r + 1 : r, prev: i };
      });
    }, ms);
    return () => clearInterval(id);
  }, [verbs, ms, running]);
  useEffect(() => {
    if (state.prev === null) return;
    const id = setTimeout(() => setState((s) => ({ ...s, prev: null })), SWAP_MS);
    return () => clearTimeout(id);
  }, [state]);
  return { verb: verbs[state.i], prev: state.prev === null ? null : verbs[state.prev] };
}

type Effect = "shimmer" | "shimmerCoral" | "shimmerSync" | "wave" | "blur" | "type" | "roll" | "resolve" | "plain";

/** Every word effect, in the order the comparison grid shows them. */
export const EFFECTS: { v: Effect; label: string; note: string }[] = [
  { v: "shimmer", label: "Shimmer", note: "A light pass across the word, grey to ink, every 1.7s." },
  { v: "shimmerCoral", label: "Shimmer, Coral", note: "The light pass is coral, matching the chevron." },
  { v: "shimmerSync", label: "Shimmer, Synced", note: "A faster pass, close to one chevron sweep. The chosen effect." },
  { v: "wave", label: "Letter Wave", note: "Letters brighten in turn, like the chevron's cells." },
  { v: "blur", label: "Blur In", note: "Each new word sharpens out of a soft blur." },
  { v: "type", label: "Typewriter", note: "Each new word types in behind a caret." },
  { v: "roll", label: "Roll", note: "Each new word slides up into place." },
  { v: "resolve", label: "Resolve", note: "Grey blocks turn into letters, left to right." },
  { v: "plain", label: "Plain", note: "No effect; only the word changes." },
];

/* ------------------------------ verbs --------------------------------- */

/**
 * "Resolve": a new verb arrives as raw blocks, one per letter, that process
 * into type left to right. Each block is the width of the letter it hides,
 * so nothing jitters.
 */
/** How many characters of a new word have arrived, animated over `ms`. */
function useReveal(text: string, ms: number) {
  const [done, setDone] = useState(text.length);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    let raf = 0;
    const start = performance.now();
    const dur = prefersReduced() ? 0 : ms;
    const step = (now: number) => {
      const p = dur ? Math.min(1, (now - start) / dur) : 1;
      setDone(Math.round(p * text.length));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, ms]);
  return done;
}

function Resolve({ text }: { text: string }) {
  const done = useReveal(text, 380);
  return (
    <span className={s.resolve} aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={i} aria-hidden="true" className={i < done || ch === " " ? undefined : i === done ? s.charHot : s.charRaw}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/** "Typewriter": the new word types in behind a coral caret. */
function Typewriter({ text }: { text: string }) {
  const done = useReveal(text, text.length * 45);
  return (
    <span className={s.typed} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, done)}</span>
      <span className={s.caret} aria-hidden="true" />
    </span>
  );
}

export function Verb({ text, effect }: { text: string; effect: Effect }) {
  switch (effect) {
    case "resolve": return <Resolve text={text} />;
    case "type": return <Typewriter text={text} />;
    case "roll": return <span className={s.rollBox}><span key={text} className={s.roll}>{text}</span></span>;
    case "blur": return <span key={text} className={s.blurIn}>{text}</span>;
    case "wave":
      return (
        <span className={s.wave} aria-label={text}>
          {[...text].map((ch, i) => <span key={i} aria-hidden="true" style={{ "--i": i } as CSSProperties}>{ch}</span>)}
        </span>
      );
    case "plain": return <span className={s.plain}>{text}</span>;
    default: return <span className={s[effect]}>{text}</span>;
  }
}

/**
 * Chevron loader + verb. Each verb holds for `ms`, then crossfades into the
 * next. Without a timer (buttons), the verb sits in a slot as wide as the
 * longest verb, so the button never changes width. With a timer (⌘K and the
 * chat, where a wait is open-ended), the slot instead eases to the current
 * verb's width so the seconds stay close to the word.
 */
export function Loading({ verbs = PIPELINE_VERBS, effect = "shimmerSync", running = true, ms = 3400, timer = false, rate = 1 }: {
  verbs?: string[]; effect?: Effect; running?: boolean; ms?: number; timer?: boolean; rate?: number;
}) {
  const { verb, prev } = useVerb(verbs, ms, running);
  const t = useElapsed(running);
  const slot = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = slot.current;
    if (!el || !timer) return;
    const sizer = [...el.children].find((c) => (c as HTMLElement).dataset.w === verb) as HTMLElement | undefined;
    if (sizer) el.style.width = `${sizer.offsetWidth}px`;
  }, [verb, timer]);
  return (
    <span className={s.loading} role="status" aria-label={`${verb}…`}>
      <span className={s.loadingRow}>
        <ChevronLoader />
        <span ref={slot} className={timer ? `${s.slot} ${s.slotFit}` : s.slot} aria-hidden="true">
          {verbs.map((w) => <span key={`w-${w}`} data-w={w} className={s.slotSizer}>{w}…</span>)}
          {prev ? <span key={`out-${prev}`} className={s.wordOut}><Verb text={prev} effect={effect} />…</span> : null}
          <span key={`in-${verb}`} className={prev ? s.wordIn : s.wordOn}><Verb text={verb} effect={effect} />…</span>
        </span>
        {timer ? <span className={s.elapsed}>{(t * rate).toFixed(1)}s</span> : null}
      </span>
    </span>
  );
}

/* ---------------------------- playground ------------------------------ */

function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className={s.seg} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={o.v === value}
          className={o.v === value ? s.segOn : undefined} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const VERB_SETS = { pipeline: PIPELINE_VERBS, ask: ASK_VERBS, send: SEND_VERBS };

export function LoadingPlayground() {
  const [effect, setEffect] = useState<Effect>("shimmerSync");
  const [set, setSet] = useState<keyof typeof VERB_SETS>("pipeline");
  const [run, setRun] = useState(0); // remount to restart the clock
  return (
    <div className={s.stage}>
      <div className={s.stageCenter}>
        <Loading key={`${run}-${set}`} verbs={VERB_SETS[set]} effect={effect} timer={set === "ask"} />
      </div>
      <div className={s.controls}>
        <Segmented label="Verb effect" value={effect} onChange={setEffect} options={EFFECTS} />
        <Segmented label="Verb set" value={set} onChange={setSet}
          options={[{ v: "pipeline", label: "Page" }, { v: "ask", label: "Ask" }, { v: "send", label: "Send" }]} />
        <button type="button" className={s.ghost} onClick={() => setRun((r) => r + 1)}>Restart Clock</button>
      </div>
    </div>
  );
}

/** Every word effect running at once, each with the chevron and the page words. */
export function EffectGrid() {
  return (
    <div className={s.cells} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
      {EFFECTS.map((e) => (
        <div key={e.v} className={s.effectCell}>
          <span className={s.label}>{e.label}</span>
          <div className={s.effectStage}><Loading verbs={PIPELINE_VERBS} effect={e.v} /></div>
          <p>{e.note}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ ⌘K trace ------------------------------ */

type Phase = "idle" | "thinking" | "steps" | "answer";

export function AskTrace({ question, steps, answer, offScript }: {
  question: string;
  steps: { text: string; meta?: string }[];
  answer: ReactNode;
  offScript?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [shown, setShown] = useState(0);
  const [open, setOpen] = useState(false);
  const [took, setTook] = useState(0);
  const t0 = useRef(0);

  useEffect(() => {
    if (phase === "thinking") {
      const id = setTimeout(() => { setShown(0); setPhase("steps"); }, 2200);
      return () => clearTimeout(id);
    }
    if (phase !== "steps") return;
    // one step every 520ms; after the last one, a beat, then the answer
    const id = shown < steps.length - 1
      ? setTimeout(() => setShown((n) => n + 1), 520)
      : setTimeout(() => { setTook((performance.now() - t0.current) / 1000); setPhase("answer"); }, 650);
    return () => clearTimeout(id);
  }, [phase, shown, steps.length]);

  const ask = () => { t0.current = performance.now(); setOpen(false); setPhase("thinking"); };

  return (
    <div className={s.ask}>
      <div className={s.askBar}>
        <span className={s.askQ}>{question}</span>
        <button type="button" className={s.askBtn} onClick={ask} disabled={phase === "thinking" || phase === "steps"}>
          {phase === "idle" ? "Ask" : "Ask Again"}
        </button>
      </div>
      <div className={s.askBody}>
        {phase === "idle" ? <span className={s.dim}>Press Ask to run the trace.</span> : null}
        {phase === "thinking" ? <Loading verbs={ASK_VERBS} timer /> : null}
        {phase === "steps" || phase === "answer" ? (
          <>
            {phase === "answer" ? (
              <button type="button" className={s.traceHead} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                <span className={s.tick} aria-hidden="true" />
                {offScript ? "Searched the CV" : "Read the CV"} for {took.toFixed(1)}s
                <span className={s.chev} data-open={open ? "" : undefined}>›</span>
              </button>
            ) : null}
            {phase === "steps" || open ? (
              <ol className={s.steps}>
                {steps.slice(0, phase === "steps" ? shown + 1 : steps.length).map((st, i) => (
                  <li key={st.text} data-live={phase === "steps" && i === shown ? "" : undefined}>
                    <span className={s.tick} aria-hidden="true" />
                    {st.text}
                    {st.meta ? <em>{st.meta}</em> : null}
                  </li>
                ))}
              </ol>
            ) : null}
            {phase === "answer" ? <div className={s.answer}>{answer}</div> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

/* --------------------------- skeleton resolve -------------------------- */

/** Text that waits as raw blocks (one per word) and resolves word by word. */
export function SkeletonResolve({ text }: { text: string }) {
  const words = text.split(" ");
  const [n, setN] = useState(words.length);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (run === 0) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= words.length) clearInterval(id);
    }, prefersReduced() ? 0 : 55);
    return () => clearInterval(id);
  }, [run, words.length]);
  return (
    <div className={s.skel}>
      <p>
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className={i < n ? s.word : i === n ? s.wordHot : s.wordRaw}>{w}</span>{" "}
          </Fragment>
        ))}
      </p>
      <button type="button" className={s.ghost} onClick={() => { setN(0); setRun((r) => r + 1); }}>Replay</button>
    </div>
  );
}

/* ------------------------------ hover lab ------------------------------ */

/** One highlight that glides between rows instead of each row lighting up. */
export function GlideNav({ items }: { items: string[] }) {
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);
  const [active, setActive] = useState(1);
  return (
    <nav className={s.glide} onMouseLeave={() => setBox(null)} aria-label="Example navigation">
      <span className={s.glideBg} style={box ? { transform: `translateY(${box.top}px)`, height: box.height, opacity: 1 } : { opacity: 0 }} />
      {items.map((label, i) => (
        <a key={label} href="#hover" data-on={i === active ? "" : undefined}
          onMouseEnter={(e) => setBox({ top: e.currentTarget.offsetTop, height: e.currentTarget.offsetHeight })}
          onClick={(e) => { e.preventDefault(); setActive(i); }}>
          <span>{String(i + 1).padStart(2, "0")}</span>{label}
        </a>
      ))}
    </nav>
  );
}

/** Download CV: hover fills the pill with blocks and swaps in the file facts. */
export function DownloadButton({ href, size }: { href: string; size: string }) {
  return (
    <a href={href} download className={s.dl}>
      <span className={s.dlFill} aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ "--o": i } as CSSProperties} />)}</span>
      <span className={s.dlA}>↓ Download CV</span>
      <span className={s.dlB} aria-hidden="true">PDF · {size}</span>
    </a>
  );
}

/** Copy email: the confirmation resolves out of blocks, then settles back. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);
  return (
    <button type="button" className={s.copy} onClick={() => { navigator.clipboard?.writeText(email).catch(() => {}); setCopied(true); }}>
      <Resolve text={copied ? "Copied to clipboard" : email} />
    </button>
  );
}

/** Tool chip: hover shows where the tool sits in the skills data. */
export function ToolChip({ name, logo, group, index, total }: { name: string; logo?: string; group: string; index: number; total: number }) {
  return (
    <span className={s.chip} tabIndex={0}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/logos/${logo}.svg`} alt="" width={14} height={14} />
      ) : null}
      {name}
      <span className={s.tip} role="tooltip">
        {group}
        <span className={s.tipBlocks} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => <i key={i} data-on={i === index ? "" : undefined} />)}
        </span>
        <span>tool {index + 1} of {total}</span>
      </span>
    </span>
  );
}

/** Timeline blocks: each month answers on hover. */
export function MonthStrip({ months, label }: { months: string[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className={s.months}>
      <div className={s.monthRow} onMouseLeave={() => setHover(null)}>
        {months.map((m, i) => (
          <i key={m} data-on={hover !== null && i <= hover ? "" : undefined} onMouseEnter={() => setHover(i)} />
        ))}
      </div>
      <span className={s.monthTip}>
        {hover === null ? `${months.length} months. Hover a block.` : `${months[hover]} · month ${hover + 1} ${label}`}
      </span>
    </div>
  );
}
