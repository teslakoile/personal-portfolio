"use client";

import { useEffect, useState, type CSSProperties } from "react";
import s from "../../../_brand/sections/sections.module.css";
import h from "./hero.module.css";

/*
 * The tools band, moving. The tools are from the skills groups in
 * sampleContent.ts, each with its mark from public/logos. Five ways (?tools=):
 *   flip     the six cells stay on the strip's columns; every 1.8s one cell
 *            rolls over to a tool not on show, like a departure board
 *   marquee  the label stays put and the cells slide left in a loop, rules
 *            and all
 *   wave     every 3.6s all six roll over in a wave, left to right, to the
 *            next skills group
 *   groups   the same wave, and the label names the group, with a block per
 *            group marking which one is showing
 *   slot     every 4.2s each cell spins through a few tools and lands on the
 *            next group, left to right, like a slot machine
 * Hovering pauses every one. Reduced motion shows the first six, still.
 */

export type ToolsMotion = "flip" | "marquee" | "wave" | "groups" | "slot";

const TOOLS: [string, string][] = [
  ["Databricks", "databricks.svg"], ["Snowflake", "snowflake.svg"], ["BigQuery", "bigquery.svg"],
  ["Airflow", "airflow.svg"], ["Kubernetes", "kubernetes.svg"], ["Terraform", "terraform.svg"],
  ["OpenAI", "openai.svg"], ["Dagster", "dagster.svg"], ["PostgreSQL", "postgresql.svg"],
  ["Vertex AI", "vertex-ai.png"], ["Docker", "docker.svg"], ["dbt", "dbt.svg"],
  ["LangChain", "langchain.svg"], ["AWS", "aws.svg"], ["FastAPI", "fastapi.svg"],
  ["Azure", "azure.svg"], ["Google Cloud", "googlecloud.svg"], ["Python", "python.svg"],
];
const N = 6;
/** which cell rolls next: spread across the row, never the same twice running */
const ORDER = [2, 5, 0, 3, 1, 4];

function Tool({ t, className, style }: { t: [string, string]; className?: string; style?: CSSProperties }) {
  return (
    <span className={className} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/logos/${t[1]}`} alt="" />
      {t[0]}
    </span>
  );
}

const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Flip() {
  // shown: the tool index in each cell; prev: what it rolled over from; next: the next tool to bring in
  const [st, setSt] = useState({ shown: [0, 1, 2, 3, 4, 5], prev: Array<number | null>(N).fill(null), next: N, k: 0 });
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || still()) return;
    const id = setInterval(() => setSt(({ shown, next, k }) => {
      const cell = ORDER[k % N];
      const prev = Array<number | null>(N).fill(null);
      prev[cell] = shown[cell];
      const s2 = [...shown];
      s2[cell] = next;
      return { shown: s2, prev, next: (next + 1) % TOOLS.length, k: k + 1 };
    }), 1800);
    return () => clearInterval(id);
  }, [paused]);
  return (
    <div className={`${s.tools} ${h.toolsFlip}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div>Tools I Work With</div>
      {st.shown.map((t, i) => (
        <div key={i}>
          {st.prev[i] !== null ? <Tool key={`o${st.k}`} t={TOOLS[st.prev[i]!]} className={h.flipOut} /> : null}
          <Tool key={`i${t}`} t={TOOLS[t]} className={st.prev[i] !== null ? h.flipIn : undefined} />
        </div>
      ))}
    </div>
  );
}

function Marquee() {
  return (
    <div className={h.marquee}>
      <div className={h.marqueeLabel}>Tools I Work With</div>
      <div className={h.marqueeView}>
        {/* the list twice, so a -50% slide loops seamlessly; the copy is hidden from screen readers */}
        <div className={h.marqueeTrack}>
          {[0, 1].map((copy) => TOOLS.map((t) => (
            <div key={`${copy}${t[0]}`} className={h.marqueeCell} aria-hidden={copy ? true : undefined}><Tool t={t} /></div>
          )))}
        </div>
      </div>
    </div>
  );
}

/** Six from each skills group in sampleContent.ts that has a mark for all six. */
const GROUPS: { title: string; tools: [string, string][] }[] = [
  { title: "Data Engineering", tools: [["Databricks", "databricks.svg"], ["Snowflake", "snowflake.svg"], ["BigQuery", "bigquery.svg"], ["Airflow", "airflow.svg"], ["Dagster", "dagster.svg"], ["dbt", "dbt.svg"]] },
  { title: "AI & Machine Learning", tools: [["OpenAI", "openai.svg"], ["Vertex AI", "vertex-ai.png"], ["Azure AI Foundry", "azure-ai-foundry.svg"], ["LangChain", "langchain.svg"], ["TensorFlow", "tensorflow.svg"], ["Keras", "keras.svg"]] },
  { title: "Cloud & Infrastructure", tools: [["AWS", "aws.svg"], ["Azure", "azure.svg"], ["Google Cloud", "googlecloud.svg"], ["Docker", "docker.svg"], ["Terraform", "terraform.svg"], ["Kubernetes", "kubernetes.svg"]] },
  { title: "Developer Tools", tools: [["Claude Code", "claude.svg"], ["Cursor", "cursor.svg"], ["GitHub", "github.svg"], ["Azure DevOps", "azuredevops.svg"], ["Git", "git.svg"], ["Jira", "jira.svg"]] },
];
const ALL = GROUPS.flatMap((g) => g.tools);
const STAGGER = 70;

/** Steps through GROUPS on a timer; hovering pauses it. */
function useGroups(ms: number) {
  const [st, setSt] = useState({ g: 0, prev: -1, k: 0 });
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || still()) return;
    const id = setInterval(() => setSt(({ g, k }) => ({ g: (g + 1) % GROUPS.length, prev: g, k: k + 1 })), ms);
    return () => clearInterval(id);
  }, [paused, ms]);
  return { ...st, hover: { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) } };
}

function Label({ g, k, named }: { g: number; k: number; named: boolean }) {
  if (!named) return <div>Tools I Work With</div>;
  return (
    <div>
      <span className={h.groupLabel}>
        <small>Tools I Work With</small>
        <b key={k} className={k ? h.flipIn : undefined}>{GROUPS[g].title}</b>
        <span className={h.groupBlocks} aria-hidden="true">{GROUPS.map((x, i) => <i key={x.title} data-on={i === g ? "" : undefined} />)}</span>
      </span>
    </div>
  );
}

/** wave and groups: the six roll over together, staggered left to right */
function Wave({ named }: { named: boolean }) {
  const { g, prev, k, hover } = useGroups(3600);
  return (
    <div className={`${s.tools} ${h.toolsFlip} ${named ? h.toolsNamed : ""}`} {...hover}>
      <Label g={g} k={k} named={named} />
      {GROUPS[g].tools.map((t, i) => {
        const d = { animationDelay: `${i * STAGGER}ms` } as CSSProperties;
        return (
          <div key={i}>
            {prev >= 0 ? <Tool key={`o${k}`} t={GROUPS[prev].tools[i]} className={h.flipOut} style={d} /> : null}
            <Tool key={`i${k}`} t={t} className={prev >= 0 ? h.flipIn : undefined} style={d} />
          </div>
        );
      })}
    </div>
  );
}

/** slot: each cell spins through three other tools and lands, left to right */
function Slot() {
  const { g, prev, k, hover } = useGroups(4200);
  return (
    <div className={`${s.tools} ${h.toolsFlip} ${h.toolsSlot}`} {...hover}>
      <div>Tools I Work With</div>
      {GROUPS[g].tools.map((t, i) => {
        if (prev < 0) return <div key={i}><span className={h.slotReel} style={{ animation: "none" }}><Tool t={t} /></span></div>;
        // three in-between tools, none the one it leaves or lands on
        const others = ALL.filter((x) => x !== t && x !== GROUPS[prev].tools[i]);
        const blur = [1, 2, 3].map((j) => others[(k * 7 + i * 5 + j * 3) % others.length]);
        return (
          <div key={i}>
            <span key={k} className={h.slotReel} style={{ animationDuration: `${700 + i * 110}ms` } as CSSProperties}>
              {[GROUPS[prev].tools[i], ...blur, t].map((x, j) => <Tool key={j} t={x} />)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ToolsBand({ v }: { v: ToolsMotion }) {
  if (v === "marquee") return <Marquee />;
  if (v === "wave" || v === "groups") return <Wave named={v === "groups"} />;
  if (v === "slot") return <Slot />;
  return <Flip />;
}
