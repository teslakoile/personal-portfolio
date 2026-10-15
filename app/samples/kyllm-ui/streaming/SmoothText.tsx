"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Cite } from "../kit";
import m from "./smooth.module.css";

/*
 * The answer stream, picked on /samples/kyllm-ui/streaming (option B with the
 * thin bar caret). The model sends text in uneven bursts; this releases what has
 * arrived at an even 55 characters a second, faster when it falls behind (any gap
 * closes with a 0.15 s time constant), and each character fades in over 180 ms,
 * so the newest few form a soft tail. A thin coral bar blinks at the end only
 * when the stream pauses (`always` keeps it on). Nothing renders ahead of what
 * has arrived. Reduced motion shows text as it arrives and a steady bar.
 */

export type StreamTok = { w: string } | { cite: number };
type Unit = { ch: string } | { cite: number };

const FADE = 0.18; // seconds each character takes to fade in
const PAUSE = 0.4; // seconds without new text before the bar shows

export function SmoothText({ toks, n, done, rate = 1, always = false, className }: {
  /** the whole answer, split into words and citations */
  toks: StreamTok[];
  /** how many tokens have arrived */
  n: number;
  /** the stream has ended: drop the bar and settle the tail */
  done: boolean;
  /** slow motion for demos: 0.5 runs everything at half speed */
  rate?: number;
  always?: boolean;
  className?: string;
}) {
  const { units, ends } = useMemo(() => {
    const units: Unit[] = [], ends: number[] = [];
    for (const t of toks) {
      if ("w" in t) for (const ch of t.w) units.push({ ch });
      else units.push(t);
      ends.push(units.length);
    }
    return { units, ends };
  }, [toks]);
  const target = n ? ends[n - 1] : 0;
  const tgt = useRef(target);
  useEffect(() => { tgt.current = target; }, [target]);

  // c: characters released so far; clock: stream time; seen: when each character was released
  const [frame, setFrame] = useState<{ c: number; clock: number; seen: number[] }>({ c: 0, clock: 0, seen: [] });
  useEffect(() => {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000) * rate; // a slow frame still releases its share
      last = now;
      setFrame(({ c, clock, seen }) => {
        const t = clock + dt, back = tgt.current - c;
        const next = back <= 0 ? c : still ? tgt.current : Math.min(tgt.current, c + Math.max(55, back / 0.15) * dt);
        const fresh = Math.ceil(next) - Math.ceil(c);
        return { c: next, clock: t, seen: fresh > 0 ? [...seen, ...Array<number>(fresh).fill(still ? -1 : t)] : seen };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rate]);

  // a pause: no new tokens for PAUSE seconds (of stream time)
  const [pausedAt, setPausedAt] = useState(-1);
  useEffect(() => {
    if (done || !n) return;
    const id = window.setTimeout(() => setPausedAt(n), (PAUSE * 1000) / rate);
    return () => clearTimeout(id);
  }, [n, done, rate]);

  const shown = Math.ceil(frame.c);
  const settled = done && shown >= units.length;
  const out: ReactNode[] = [];
  let run = "";
  const flush = () => { if (run) { out.push(run); run = ""; } };
  for (let u = 0; u < shown; u++) {
    const unit = units[u];
    const op = settled ? 1 : Math.min(1, (frame.clock - frame.seen[u]) / FADE);
    if (op >= 1) {
      if ("ch" in unit) run += unit.ch;
      else { flush(); out.push(<Cite key={u} n={unit.cite} />); }
    } else {
      flush();
      const o = Math.max(0.06, op);
      out.push("ch" in unit ? <span key={u} style={{ opacity: o }}>{unit.ch}</span> : <span key={u} style={{ opacity: o }}><Cite n={unit.cite} /></span>);
    }
  }
  flush();
  const paused = pausedAt === n && shown >= target;
  return (
    <p className={className}>
      {out}
      {!done && (always || paused) ? <span className={m.pipe} aria-hidden="true" /> : null}
    </p>
  );
}
