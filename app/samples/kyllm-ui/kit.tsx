import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Copy, Link, ThumbsDown, ThumbsUp } from "lucide-react";
import s from "./kyllm.module.css";

/** One icon set for every KYLLM part: Lucide, drawn at a 2px stroke. */
export const ICON = { size: 14, strokeWidth: 2 } as const;

/*
 * KYLLM parts, static and server-safe, for the inventory. Interactive pieces
 * (the loading line, the live trace, the month strip) come from
 * /samples/states, where they were decided.
 */

export const AVATAR = "/kyllm/kyllm-avatar.svg";

export function Avatar({ size = 36 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={s.av} src={AVATAR} width={size} height={size} alt="" />;
}

/** Dashed key hint (round 3 pick D). With a `tip` it is a shortcut you can also click: the tip shows above it on hover, and the site cursor turns to a hand. */
export const Kbd = ({ children, tip, open }: { children: ReactNode; tip?: string; open?: boolean }) => (
  <kbd className={open ? `${s.kbd} ${s.kbdOpen}` : s.kbd} data-tip={tip} data-clickable={tip ? "" : undefined}>{children}</kbd>
);

/** `arrow` marks a suggestion (follow-ups, starters): outline pill, Lucide arrow at the end. */
export function Pill({ children, dot, kind, arrow, onClick }: { children: ReactNode; dot?: string; kind?: "primary" | "source"; arrow?: boolean; onClick?: () => void }) {
  const cls = [s.pill, kind === "primary" && s.pillPrimary, kind === "source" && s.pillSource, arrow && s.pillArrow].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} onClick={onClick}>
      {dot ? <i style={{ background: `var(--${dot})` }} /> : null}
      {children}
      {arrow ? <ArrowRight className={s.pillIcon} size={ICON.size} strokeWidth={ICON.strokeWidth} aria-hidden="true" /> : null}
      {kind === "source" ? <ArrowUpRight className={s.pillIcon} size={13} strokeWidth={ICON.strokeWidth} aria-hidden="true" /> : null}
    </button>
  );
}

export const LatestIcon = () => <ArrowDown size={ICON.size} strokeWidth={ICON.strokeWidth} aria-hidden="true" />;

export function SendButton({ state = "send", onClick }: { state?: "send" | "stop" | "wait"; onClick?: () => void }) {
  const cls = [s.send, state === "stop" && s.sendStop, state === "wait" && s.sendWait].filter(Boolean).join(" ");
  return <button type="button" className={cls} aria-label={state} onClick={onClick}>{state === "stop" ? null : <ArrowUp size={18} strokeWidth={2.25} aria-hidden="true" />}</button>;
}

const ICONS = { copy: Copy, link: Link, up: ThumbsUp, down: ThumbsDown };

export function IconButton({ icon, label, on }: { icon: keyof typeof ICONS; label?: string; on?: boolean }) {
  const I = ICONS[icon];
  return (
    <button type="button" className={on ? `${s.iconBtn} ${s.iconBtnOn}` : s.iconBtn} aria-label={label ?? icon}>
      <I size={ICON.size} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
      {label}
    </button>
  );
}

/** Citation, round 3 pick A: a spaced chip and a real button, so it gets the hand cursor; coral on hover. */
export const Cite = ({ n, on }: { n: number; on?: boolean }) => (
  <button type="button" className={on ? `${s.cite} ${s.citeOn}` : s.cite} aria-label={`Source ${n}`}>{n}</button>
);

export function Status({ kind }: { kind: "live" | "poc" | "done" }) {
  const map = { live: [s.statusLive, "In Production"], poc: [s.statusPoc, "Proof of Concept"], done: [s.statusDone, "Delivered"] } as const;
  return <span className={`${s.status} ${map[kind][0]}`}>{map[kind][1]}</span>;
}

export function Segmented({ options, on }: { options: string[]; on: string }) {
  return <span className={s.seg}>{options.map((o) => <span key={o} className={o === on ? s.segOn : undefined}>{o}</span>)}</span>;
}

export const Ring = () => <span className={s.ring} aria-hidden="true" />;

export function PanelHeader({ right, avatar }: { right?: ReactNode; avatar?: ReactNode }) {
  return (
    <div className={s.panelHead}>
      {avatar ?? <Avatar size={32} />}KYLLM
      <span className={s.r}>
        {right ?? "Answers from my CV, powered by Claude"}
      </span>
    </div>
  );
}

export const UserMsg = ({ children }: { children: ReactNode }) => <div className={s.user}>{children}</div>;

export function Answer({ children }: { children: ReactNode }) {
  return <div className={s.answer}><Avatar size={36} /><div>{children}</div></div>;
}

export function Composer({ placeholder = "Ask KYLLM about my work…", state = "send", kbd = true }: { placeholder?: string; state?: "send" | "stop" | "wait"; kbd?: boolean }) {
  return (
    <div className={state === "wait" ? `${s.composer} ${s.composerOff}` : s.composer}>
      <span>{placeholder}</span>
      {kbd && state === "send" ? <Kbd>⌘K</Kbd> : null}
      <SendButton state={state} />
    </div>
  );
}

export function Peek() {
  return (
    <div className={s.peek}>
      <div className={s.s}>Experience · Thinking Machines</div>
      <div className={s.t}>Enterprise Document Intelligence Platform</div>
      <p>Owned agent tooling, prompt engineering, evaluation, workflow tuning, and production incident triage…</p>
      <div className={s.go}>Show on page ↓</div>
    </div>
  );
}

export function ProjectCard() {
  return (
    <div className={s.proj}>
      <div className={s.projTop}>
        <div className={s.projRow}><b>Enterprise Document Intelligence Platform</b><Status kind="live" /></div>
        <div className={s.projCl}>A large Singaporean investment holding company · 2025 to Present</div>
        <div className={s.stack}>{["Snowflake Cortex", "OpenAI API", "FastAPI", "Kubernetes"].map((t) => <span key={t}>{t}</span>)}</div>
      </div>
      <div className={s.projFt}>
        <div><b>~15</b><span>person team</span></div>
        <div><b>Agent tooling</b><span>prompts, evals, triage</span></div>
        <a href="#">Open project ↗</a>
      </div>
    </div>
  );
}

const flow = (c: string) => <div>{[0, 1, 2, 3].map((i) => <i key={i} style={{ background: `var(--${c})` }} />)}</div>;

export function FlowDiagram() {
  return (
    <div className={s.flow}>
      <div className={s.node}><b>ChatGPT</b><span>calls a tool</span></div>
      <div className={s.wire}>{flow("b3")}MCP request</div>
      <div className={`${s.node} ${s.nodeHi}`}><b>MCP server</b><span>Python · Kyle&apos;s PoC</span></div>
      <div className={s.wire}>{flow("b2")}governed query</div>
      <div className={s.node}><b>Databricks</b><span>lakehouse</span></div>
    </div>
  );
}

const blocks = (n: number, c: string, last?: number) =>
  Array.from({ length: n }, (_, i) => <i key={i} style={{ background: `var(--${c})`, opacity: last && i === n - 1 ? last : 1 }} />);

/** One block per month per role, from real start and end dates. */
export function CareerTimeline() {
  return (
    <div style={{ display: "grid", gap: 10, width: "100%" }}>
      <div className={s.lane}><div><b>Ingenuity Software</b><span>Backend Software Engineer</span></div><div className={s.blocks}>{blocks(31, "b3")}</div></div>
      <div className={s.lane}><div><b>Thinking Machines</b><span>Data Engineer II</span></div><div className={s.blocks}><span style={{ width: 31 * 7, flex: "none" }} />{blocks(27, "b2", 0.45)}</div></div>
    </div>
  );
}

export function AnswerActions() {
  return <div style={{ display: "flex", gap: 4 }}><IconButton icon="copy" label="Copy" /><IconButton icon="link" label="Link to answer" /><IconButton icon="up" /><IconButton icon="down" /></div>;
}


export function EmailDraft() {
  return (
    <div className={s.mail}>
      <div className={s.mailRow}><span>To</span>kyle.naranjo@gmail.com</div>
      <div className={s.mailRow}><span>Subject</span>3-month contract</div>
      <div className={s.mailBody}>Hi Kyle, I&apos;m looking at a 3-month contract and wanted to ask about your rate and availability. Scope: …</div>
      <div className={s.mailAct}><Pill kind="primary">Open in Mail</Pill><Pill>Copy</Pill></div>
    </div>
  );
}

export function OfflineList() {
  return (
    <div style={{ display: "grid", gap: 10, width: "100%" }}>
      <div className={s.notice}><div><b>KYLLM is offline for today.</b> Here are answers Kyle wrote himself, or email him.</div></div>
      <div className={s.faq}><span>What does he work on now? <b>→</b></span><span>Is he open to new roles? <b>→</b></span><span>Can he speak at my event? <b>→</b></span></div>
    </div>
  );
}

export function StarterTiles({ items }: { items: [string, string][] }) {
  return <div className={s.tiles}>{items.map(([q, t]) => <div key={q} className={s.tile}><b>{q}</b><span>{t}</span></div>)}</div>;
}

export function Highlights() {
  const T: [string, string, string][] = [
    ["b2", "AI Agents", "Snowflake Cortex agent workflows for investment officers, and a ChatGPT-to-Databricks MCP server."],
    ["b3", "Data Platforms", "Backend services across 10+ microservices, on vendor data from PitchBook, Bloomberg, and MSCI."],
    ["b1", "Cloud", "Terraform, Kubernetes, and Databricks across AWS, Azure, and GCP, backed by 10 certifications."],
    ["b4", "Community", "Leads GDG Davao, 2,000+ participants. Speaks on AI coding agents. Published in IEEE."],
  ];
  return (
    <div className={s.tiles4}>
      {T.map(([c, t, p]) => <div key={t}><b><span className={s.topicDot} style={{ background: `var(--${c})` }} />{t}<em>↗</em></b><p>{p}</p></div>)}
    </div>
  );
}

export const Dock = () => <span className={s.dock}><Avatar size={32} />Ask KYLLM<Kbd tip="Open KYLLM">⌘K</Kbd></span>;

export function CitedHighlight() {
  return (
    <div className={s.highlight}>
      <span className={s.citedTag}><Avatar size={20} />Cited in answer 1</span>
      <b>Data Engineer II · Thinking Machines</b>
      <p>Agent workflows on Snowflake Cortex for investment officers; backend services across 10+ microservices.</p>
    </div>
  );
}
