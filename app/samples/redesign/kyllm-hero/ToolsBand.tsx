"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import s from "../../../_brand/sections/sections.module.css";
import h from "./hero.module.css";

/*
 * The tools band, moving: the six cells cascade to the next six tools, left to
 * right, then rest 3 s, counted from the moment the last name comes to rest
 * (Motion reports it), so the rest is the same every cycle (the "groups" option, picked 2026-10-15, without naming the
 * groups). Built with Motion to the motion-design skill's rules, eased for
 * calm: the old tool eases out over 260 ms on an accelerating curve; the new one
 * starts 60 ms before it is gone (they move apart, so they never cross) and
 * glides in on a critically damped spring, 500 ms, no overshoot. Position and
 * opacity move together, 12 px, never opacity alone. The logo leads and the
 * name follows 70 ms behind (follow-through); cells start 60 ms apart, 300 ms
 * across six, under the skill's 500 ms stagger budget.
 * Hovering pauses it. Reduced motion shows the first six, still.
 * `slow` multiplies every time, for frame captures (?slow=4).
 */

/** [name, logo file, where the name may break]; a "|" in the name marks its one line break,
    taken when the cell is too narrow for one line ("wide" under 150 px, "narrow" under 115 px) */
type Tool = [string, string, ("wide" | "narrow")?];
const GROUPS: { title: string; tools: Tool[] }[] = [
  { title: "Data Engineering", tools: [["Databricks", "databricks.svg"], ["Snowflake", "snowflake.svg"], ["BigQuery", "bigquery.svg"], ["Airflow", "airflow.svg"], ["Dagster", "dagster.svg"], ["dbt", "dbt.svg"]] },
  { title: "AI & Machine Learning", tools: [["OpenAI", "openai.svg"], ["Vertex AI", "vertex-ai.png"], ["Azure AI|Foundry", "azure-ai-foundry.svg", "wide"], ["LangChain", "langchain.svg"], ["TensorFlow", "tensorflow.svg"], ["Keras", "keras.svg"]] },
  { title: "Cloud & Infrastructure", tools: [["AWS", "aws.svg"], ["Azure", "azure.svg"], ["Google|Cloud", "googlecloud.svg", "narrow"], ["Docker", "docker.svg"], ["Terraform", "terraform.svg"], ["Kubernetes", "kubernetes.svg"]] },
  { title: "Developer Tools", tools: [["Claude|Code", "claude.svg", "narrow"], ["Cursor", "cursor.svg"], ["GitHub", "github.svg"], ["Azure|DevOps", "azuredevops.svg", "narrow"], ["Git", "git.svg"], ["Jira", "jira.svg"]] },
];
/** Every tool, interleaved across the skills groups so each set of six mixes kinds. */
const ALL: Tool[] = GROUPS[0].tools.flatMap((_, i) => GROUPS.map((g) => g.tools[i]));

// Motion, eased for calm (the motion-design skill's "calm" and "elegance" rows): an
// accelerating curve out, a critically damped spring in (no overshoot, no bounce), so
// each tool glides to rest instead of stopping on a frame.
const OUT: Transition["ease"] = [0.4, 0, 1, 1];
const RISE = 12;
const EXIT = 0.26; // s, the old tool easing out
const HANDOFF = 0.2; // s, when the new tool starts: 60 ms before the old one is gone, moving apart
const ENTER = 0.5; // s, the spring's visual duration
const LAG = 0.07; // s, the name behind its logo (follow-through)
const STAGGER = 0.06; // s between cells, 300 ms across six, inside the 500 ms budget
/** Still time between changes, counted from the last name coming to rest, so it is the same every cycle. */
const IDLE = 3;

/** Advances `k` IDLE seconds after each change settles (and IDLE seconds after load);
    hovering or reduced motion holds it. `settled` is called when a change is at rest. */
function useCycle(slow: number) {
  const reduce = useReducedMotion();
  const [k, setK] = useState(0);
  const [over, setOver] = useState(false);
  const [restAt, setRestAt] = useState(0);
  useEffect(() => {
    if (reduce || over) return;
    const id = setTimeout(() => setK((x) => x + 1), IDLE * 1000 * slow);
    return () => clearTimeout(id);
  }, [restAt, reduce, over, slow]);
  return {
    k,
    settled: () => setRestAt((n) => n + 1),
    hover: { onMouseEnter: () => setOver(true), onMouseLeave: () => setOver(false) },
  };
}

/** A tool's name, with its one optional line break. */
function Name({ t }: { t: Tool }) {
  const [a, b] = t[0].split("|");
  if (!b) return <>{a}</>;
  return <>{a}<br className={t[2] === "wide" ? h.brWide : h.brNarrow} /><span className={h.brSpace}> </span>{b}</>;
}

/** A tool's logo and name, the logo leading and the name following LAG behind. */
function Swap({ t, id, slow, delay = 0, onRest }: { t: Tool; id: string; slow: number; delay?: number; onRest?: () => void }) {
  const enter = (d: number): Transition => ({ type: "spring", bounce: 0, visualDuration: ENTER * slow, delay: (delay + HANDOFF + d) * slow });
  const exit = (d: number): Transition => ({ duration: EXIT * slow, ease: OUT, delay: (delay + d) * slow });
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <span key={id} className={h.swap} aria-label={t[0].replace("|", " ")}>
        <motion.img src={`/logos/${t[1]}`} alt=""
          initial={{ y: RISE, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: enter(0) }} exit={{ y: -RISE, opacity: 0, transition: exit(0) }} />
        <motion.span aria-hidden="true" onAnimationComplete={(def) => { if (typeof def === "object" && "y" in def && def.y === 0) onRest?.(); }}
          initial={{ y: RISE, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: enter(LAG) }} exit={{ y: -RISE, opacity: 0, transition: exit(LAG / 2) }}>
          <Name t={t} />
        </motion.span>
      </span>
    </AnimatePresence>
  );
}

/** The six cells cascade to the next six tools, then rest IDLE seconds. */
export function ToolsBand({ slow = 1 }: { slow?: number }) {
  const { k, settled, hover } = useCycle(slow);
  const sets = ALL.length / 6;
  const set = k % sets;
  return (
    <div className={`${s.tools} ${h.toolsMotion}`} {...hover}>
      <div>Tools I Work With</div>
      {ALL.slice(set * 6, set * 6 + 6).map((t, i) => (
        <div key={i}><Swap t={t} id={`${set}-${i}`} slow={slow} delay={i * STAGGER} onRest={i === 5 ? settled : undefined} /></div>
      ))}
    </div>
  );
}
