"use client";

import { useEffect, useState } from "react";
import { LiveSteps, type StepRow, type StepRun } from "../kyllm-ui/LiveSteps";
import c from "./compare.module.css";

/**
 * Both header options driven by one clock, replaying the step timings of a
 * real answer to "Tell me more about Kyle" (localhost, 2026-11-22). Each loop
 * runs the answer, holds the finished state, then starts again.
 */

const TIMELINE: (Omit<StepRow, "end" | "state"> & { end: number })[] = [
  { id: 1, kind: "think", label: "", detail: "", start: 0, end: 1400 },
  { id: 2, kind: "tool", label: "Looking Up His CV", detail: "CV", start: 1400, end: 1403 },
  { id: 3, kind: "tool", label: "Looking Up About", detail: "About", start: 1400, end: 1404 },
  { id: 4, kind: "write", label: "", detail: "", start: 1404, end: 3900 },
  { id: 5, kind: "check", label: "", detail: "2 Sources, 2 Citations", start: 3900, end: 3915 },
];
const DONE = 3930, HOLD = 3500;

function runAt(t0: number, now: number): StepRun {
  const t = now - t0;
  const steps: StepRow[] = TIMELINE.filter((x) => x.start <= t).map((x) => (x.end <= t ? { ...x, state: "done" } : { ...x, end: undefined }));
  return t >= DONE ? { t0, steps, end: DONE, outcome: "ok" } : { t0, steps };
}

export function Compare() {
  const [t0, setT0] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    let raf = 0, start = -Infinity;
    const tick = () => {
      const n = performance.now();
      // the first frame starts the loop; each loop restarts after the hold
      if (n - start > DONE + HOLD) { start = n; setT0(n); }
      setNow(n);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (t0 === null) return null;
  const run = runAt(t0, now);
  return (
    <div className={c.grid}>
      {(["step", "loader"] as const).map((h) => (
        <section key={h} className={c.col}>
          <h2 className={c.name}>{h === "step" ? "A. Step Icon and Label" : "B. Chevron Loading Line, Picked"}</h2>
          <p className={c.note}>
            {h === "step"
              ? "While working, the header shows the running step's icon and name, such as Understanding the Question."
              : "While working, the header shows the site's chevron loader and a rotating verb, as on the busy cursor."}
          </p>
          <div className={c.chat}>
            <div className={c.ask}>Tell me more about Kyle</div>
            {/* a new key per loop, so each option starts open and fresh */}
            <LiveSteps key={`${h}-${t0}`} run={run} head={h} />
          </div>
        </section>
      ))}
    </div>
  );
}
