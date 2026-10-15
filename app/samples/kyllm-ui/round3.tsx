"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, AtSign, BookOpen, Check, Copy, Mail, PenLine,
  Terminal, type LucideIcon,
} from "lucide-react";
import { Avatar, Cite, ICON, Kbd, Pill, SendButton } from "./kit";
import { SourceMark, type SiteMark, type SourceKind } from "./brandIcons";
import { Opt, Opts } from "./options";
import { KyllmLive, type Mood, type SorryStyle, type WorkStyle } from "./rig/KyllmLive";
import s from "./kyllm.module.css";
import o from "./options.module.css";
import r from "./round3.module.css";

/*
 * Round 3: Kyle's picks applied, and options for what is still open.
 * Every icon here is Lucide at a 2px stroke (ICON in kit.tsx).
 */

const I = ({ icon: Icon, size = ICON.size }: { icon: LucideIcon; size?: number }) => (
  <Icon size={size} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
);

/* -------------------------------- icon set ------------------------------- */
const SET: [LucideIcon, string, string][] = [
  [ArrowUp, "ArrowUp", "Send"],
  [ArrowRight, "ArrowRight", "Suggestions"],
  [ArrowUpRight, "ArrowUpRight", "Leaves the site"],
  [ArrowDown, "ArrowDown", "Latest, on this page"],
  [Copy, "Copy", "Copy answer"],
  [Check, "Check", "Copied, checking step"],
  [Mail, "Mail", "Email Kyle"],
  [BookOpen, "BookOpen", "Thinking step"],
  [Terminal, "Terminal", "Tool step"],
  [PenLine, "PenLine", "Writing step"],
];

export function IconSet() {
  return (
    <div className={r.icons}>
      {SET.map(([Icon, name, use]) => (
        <div key={name}><span><Icon size={18} strokeWidth={2} aria-hidden="true" /></span><b>{name}</b><small>{use}</small></div>
      ))}
    </div>
  );
}

/* ------------------------------ citation (A) ----------------------------- */
export function CitationStates() {
  return (
    <div className={r.states}>
      <div><small>Rest</small><p className={o.copy}>…a server between ChatGPT and Databricks<Cite n={1} />.</p></div>
      <div><small>Hover: lifts, turns coral, hand cursor</small><p className={o.copy}>…a server between ChatGPT and Databricks<Cite n={1} on />.</p></div>
    </div>
  );
}

/* ---------------------------------- pill --------------------------------- */
const FOLLOW = ["What else has he built with agents?", "Which talks cover this?"];

export function PillR3() {
  return (
    <Opts>
      <Opt id="A" name="Arrow always" rec>
        <div className={o.row}>{FOLLOW.map((q) => <Pill key={q} arrow>{q}</Pill>)}</div>
      </Opt>
      <Opt id="B" name="Arrow slides in on hover">
        <div className={o.row}>{FOLLOW.map((q) => (
          <button key={q} type="button" className={`${s.pill} ${r.pillReveal}`}>{q}<span><I icon={ArrowRight} /></span></button>
        ))}</div>
      </Opt>
    </Opts>
  );
}

const STARTERS = ["Give me the 30-second version", "How does the MCP server work?", "What's his stack day to day?", "Is he open to new roles?"];

export function StarterR3() {
  return (
    <Opts>
      <Opt id="A" name="Pills in a row, like follow-ups" rec>
        <div className={o.row}>{STARTERS.map((q) => <Pill key={q} arrow>{q}</Pill>)}</div>
      </Opt>
      <Opt id="B" name="Pills stacked">
        <div className={r.stackPills}>{STARTERS.map((q) => <Pill key={q} arrow>{q}</Pill>)}</div>
      </Opt>
    </Opts>
  );
}

/* --------------------------------- sources ------------------------------- */
export type Src = { kind: SourceKind; label: string; name: string; host?: string };
const SRC: Src[] = [
  { kind: "site", label: "Projects", name: "MCP Server" },
  { kind: "site", label: "Community", name: "Talks" },
  { kind: "github", label: "GitHub", name: "teslakoile", host: "github.com" },
  { kind: "linkedin", label: "LinkedIn", name: "kyle-naranjo", host: "linkedin.com" },
];
const onSite = (src: Src) => src.kind === "site";

/** One chip for every source: its mark tells where it lives; a right arrow stays on this page, the diagonal one leaves it; hover says where it goes. */
export function SrcChip({ src, site = "kn" }: { src: Src; site?: SiteMark }) {
  const tip = onSite(src) ? `Scrolls to ${src.label} · ${src.name}` : `Opens ${src.host}/${src.name}`;
  return (
    <a href="#" className={r.chip} data-where={onSite(src) ? "site" : "web"} data-tip={tip} onClick={(e) => e.preventDefault()}>
      <SourceMark kind={src.kind} site={site} />
      <b>{src.label}</b>{src.name}
      <I icon={onSite(src) ? ArrowRight : ArrowUpRight} size={13} />
    </a>
  );
}

const SITE_MARKS: [SiteMark, string, string, boolean?][] = [
  ["kn", "KN monogram", "A small ink square with your initials, like a favicon for your own sections.", true],
  ["hash", "Section sign", "A coral # (Lucide Hash): it points to a section of this page."],
  ["none", "No mark", "Only other sites get a logo; the right arrow says it stays here."],
];

/** The open call: what marks this site's own sections, now that the tab icon is KYLLM. */
export function SourceR3() {
  return (
    <Opts>
      {SITE_MARKS.map(([m, name, how, rec], i) => (
        <Opt key={m} id={String.fromCharCode(65 + i)} name={name} rec={rec}>
          <div className={r.srcBlock}>
            <div className={o.row}>{SRC.map((src) => <SrcChip key={src.name} src={src} site={m} />)}</div>
            <small className={r.legend}>{how}</small>
          </div>
        </Opt>
      ))}
    </Opts>
  );
}

/* ------------------------------ citation peek ---------------------------- */
const Sentence = ({ on }: { on?: boolean }) => <p className={o.copy}>…queries Databricks through governed access<Cite n={1} on={on} />.</p>;

export function PeekR3() {
  return (
    <Opts>
      <Opt id="A" name="One-line tooltip" rec>
        <div className={r.peekWrap}><span className={r.tip}>Projects · MCP Server</span><Sentence on /></div>
      </Opt>
      <Opt id="B" name="Lights up its source chip">
        <div className={r.srcBlock}>
          <Sentence on />
          <div className={o.row}>
            <span className={`${r.chip} ${r.chipLit}`} data-where="site"><Cite n={1} on /><b>Projects</b>MCP Server<I icon={ArrowRight} size={13} /></span>
            <span className={r.chip} data-where="site"><Cite n={2} /><b>Community</b>Talks<I icon={ArrowRight} size={13} /></span>
          </div>
        </div>
      </Opt>
      <Opt id="C" name="Slim card">
        <div className={r.peekWrap}>
          <span className={r.slim}><small>Projects</small><b>MCP Server</b><em>Go to section <I icon={ArrowDown} size={12} /></em></span>
          <Sentence on />
        </div>
      </Opt>
      <Opt id="D" name="Nothing on hover; click scrolls">
        <Sentence />
      </Opt>
    </Opts>
  );
}

/* -------------------------------- key hint ------------------------------- */
export function KeyHintStates() {
  return (
    <div className={r.states}>
      <div><small>Rest</small><div className={s.composer}><span>Ask KYLLM about my work…</span><Kbd tip="Ask from anywhere">⌘K</Kbd><SendButton state="wait" /></div></div>
      <div><small>Hover: the hint explains itself</small><div className={`${s.composer} ${r.tipRoom}`}><span>Ask KYLLM about my work…</span><Kbd tip="Ask from anywhere" open>⌘K</Kbd><SendButton state="wait" /></div></div>
    </div>
  );
}

/* ------------------------------ copy button (C) -------------------------- */
export function CopyButton({ forced }: { forced?: "hover" | "done" }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(id);
  }, [done]);
  const isDone = done || forced === "done";
  return (
    <button type="button" className={r.copy} data-done={isDone ? "" : undefined} data-hover={forced === "hover" ? "" : undefined}
      aria-label={isDone ? "Copied" : "Copy answer"} onClick={() => setDone(true)}>
      <span className={r.copyIcons}><I icon={Copy} /><I icon={Check} /></span>
      <span className={r.copyTip}>{isDone ? "Copied" : "Copy"}</span>
    </button>
  );
}

function Stub({ children }: { children: ReactNode }) {
  return <div className={o.stub}><p>He leads GDG Davao and speaks on AI coding agents<Cite n={1} />.</p>{children}</div>;
}

export function CopyStates() {
  return (
    <div className={r.states3}>
      <div><small>Rest (click it)</small><Stub><CopyButton /></Stub></div>
      <div><small>Hover</small><Stub><CopyButton forced="hover" /></Stub></div>
      <div><small>Copied</small><Stub><CopyButton forced="done" /></Stub></div>
    </div>
  );
}

/* -------------------------------- countdown ------------------------------ */
const WAIT = 10_000;
const REST = 1800;
/** A 10-second wait on a loop: ms left, fraction left, and whether it just finished. */
function useCountdown() {
  const [left, setLeft] = useState(WAIT);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = () => { setLeft(WAIT - ((performance.now() - t0) % (WAIT + REST))); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const ms = Math.max(0, left);
  return { secs: Math.ceil(ms / 1000), frac: ms / WAIT, ready: ms === 0 };
}

function Ring({ frac, size, stroke = 2 }: { frac: number; size: number; stroke?: number }) {
  const rad = (size - stroke) / 2;
  const c = 2 * Math.PI * rad;
  return (
    <svg className={r.ring} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={rad} stroke="var(--line)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={rad} stroke="var(--coral)" strokeWidth={stroke} fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

/** The seconds roll: each new number slides up into place. */
const Secs = ({ secs }: { secs: number }) => <span className={r.secs}><span key={secs}>{secs}</span>s</span>;

export function CountdownR3() {
  const { secs, frac, ready } = useCountdown();
  const line = ready ? <>Ready. Ask away.</> : <>Ask again in <Secs secs={secs} /></>;
  return (
    <Opts>
      <Opt id="A" name="Ring beside a notice">
        <div className={r.notice} data-ready={ready ? "" : undefined}>
          {ready ? <span className={r.readyDot}><I icon={Check} size={12} /></span> : <Ring frac={frac} size={18} stroke={2.5} />}
          <span><b>One moment.</b> {line}</span>
        </div>
      </Opt>
      <Opt id="B" name="Ring around Send" rec>
        <div className={ready ? s.composer : `${s.composer} ${r.locked}`} aria-disabled={!ready}>
          <span>{line}</span>
          <span className={r.sendRing} data-ready={ready ? "" : undefined}>
            {ready ? null : <Ring frac={frac} size={42} />}
            <SendButton state={ready ? "send" : "wait"} />
          </span>
        </div>
      </Opt>
      <Opt id="C" name="Bar under the composer">
        <div className={r.barWrap}>
          <div className={ready ? s.composer : `${s.composer} ${r.locked}`} aria-disabled={!ready}><span>{line}</span><SendButton state={ready ? "send" : "wait"} /></div>
          <i className={r.drain} style={{ transform: `scaleX(${frac})` }} />
        </div>
      </Opt>
    </Opts>
  );
}

/* ------------------------------ avatar states ---------------------------- */
const MOODS: [Mood, string, string][] = [
  ["idle", "Idle", "Breathes, blinks, the leaf sways"],
  ["typing", "Visitor is typing", "Looks down at the composer and follows the text"],
  ["working", "In progress", "Looks up at a thought bubble of dots, pondering"],
  ["answered", "Answered", "After the stream ends: one hop, happy eyes"],
  ["sorry", "Sorry", "Sighs, slumps, shakes its head; ears fold"],
];
const TURN: [Mood, number, string][] = [
  ["idle", 2000, "Waiting"],
  ["typing", 2600, "Visitor types a question"],
  ["working", 4200, "Steps run, then the answer streams"],
  ["answered", 2400, "Stream done"],
];

/** Steps through one turn on a loop so the moves can be watched in order. */
function useTurn() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setI((n) => (n + 1) % TURN.length), TURN[i][1]);
    return () => clearTimeout(id);
  }, [i]);
  return TURN[i];
}

/** Remounts every few seconds so a one-shot mood (the answered hop) plays again. */
function useEvery(ms: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return n;
}

export function ThinkingR3() {
  const [mood, , label] = useTurn();
  const again = useEvery(3200);
  return (
    <div className={r.thinking}>
      <div className={r.turn}>
        <KyllmLive mood={mood} size={64} />
        <div><small>One turn, on a loop</small><b>{label}</b><em>{MOODS.find(([m]) => m === mood)?.[1]}</em></div>
      </div>
      <div className={r.moods}>
        {MOODS.map(([m, name, how]) => (
          <div key={m}><KyllmLive key={m === "answered" ? again : m} mood={m} size={52} /><b>{name}</b><small>{how}</small></div>
        ))}
      </div>
    </div>
  );
}

const WORK: [WorkStyle, string, string, boolean?][] = [
  ["ponder", "Pondering with dots", "Eyes up, glancing between spots, a slow sway; three dots rise in turn beside it, no bubble.", true],
  ["orbit", "Eyes circling", "The pupils circle the top of the lenses like a slow spinner."],
  ["leaf", "Leaf ticking", "Eyes up and still; the leaf flicks every 0.6 s like a metronome."],
  ["bubble", "Thought bubble", "A small bubble of dots in the sky, inside the circle (the last round)."],
];

/** In progress, four ways, each at chat size and large. */
export function InProgressR3() {
  return (
    <Opts>
      {WORK.map(([w, name, how, rec], i) => (
        <Opt key={w} id={String.fromCharCode(65 + i)} name={name} rec={rec}>
          <div className={r.work}>
            <KyllmLive mood="working" work={w} size={36} />
            <KyllmLive mood="working" work={w} size={88} />
            <small>{how}</small>
          </div>
        </Opt>
      ))}
    </Opts>
  );
}

const SORRY: [SorryStyle, string, string, boolean?][] = [
  ["sigh", "Sigh", "Breathes in, lets it out into a small slump, slow sad blink. Quietest."],
  ["shake", "Head shake", "Every 3 s a small no: two shakes of the head, the leaf whipping behind."],
  ["shrink", "Shrink back", "Sinks and leans back, glasses slip down, eyes avoid you, a quick peek up."],
  ["bow", "Apologetic bow", "A small rise, then a deep squash with eyes shut and glasses dipping, then back up.", true],
];

/** Sorry, four ways, each at chat size and large; the ears stay as drawn in all four. */
export function SorryR3() {
  return (
    <Opts>
      {SORRY.map(([st, name, how, rec], i) => (
        <Opt key={st} id={String.fromCharCode(65 + i)} name={name} rec={rec}>
          <div className={r.work}>
            <KyllmLive mood="sorry" sorry={st} size={36} />
            <KyllmLive mood="sorry" sorry={st} size={88} />
            <small>{how}</small>
          </div>
        </Opt>
      ))}
    </Opts>
  );
}

/** The animated avatar for server-rendered parts of the page. */
export const LiveAvatar = ({ mood = "idle", size = 64 }: { mood?: Mood; size?: number }) => <KyllmLive mood={mood} size={size} />;

/* ---------------------------------- dock --------------------------------- */
/** Pick A: idle while it waits; on hover it hops and looks up at the cursor, and the site cursor turns to a hand. */
function DockA() {
  const [hover, setHover] = useState(false);
  const [poke, setPoke] = useState(0);
  const on = hover;
  return (
    <button type="button" className={r.dock} data-hover={on ? "" : undefined}
      onMouseEnter={() => { setHover(true); setPoke((p) => p + 1); }} onMouseLeave={() => setHover(false)}>
      <KyllmLive mood={on ? "hover" : "idle"} size={32} poke={poke} />Ask KYLLM<Kbd tip="Open KYLLM">⌘K</Kbd>
    </button>
  );
}

export function DockR3() {
  return <DockA />;
}

/* ------------------------------ email handoff ---------------------------- */
export function EmailR3() {
  return (
    <Opts>
      <Opt id="A" name="Draft card, on brand">
        <div className={r.mail}>
          <div><span>To</span>kyle.naranjo@gmail.com</div>
          <div><span>Subject</span>3-month contract</div>
          <p>Hi Kyle, I&apos;m looking at a 3-month contract and wanted to ask about your rate and availability.</p>
          <footer><Pill arrow>Open in Mail</Pill><button type="button" className={s.iconBtn} aria-label="Copy draft"><I icon={Copy} /></button></footer>
        </div>
      </Opt>
      <Opt id="B" name="One line and a pill" rec>
        <div className={o.said}><Avatar size={28} /><div>That&apos;s one for Kyle. I drafted the email:
          <div className={o.row}><Pill arrow>Email Kyle about a 3-month contract</Pill></div>
        </div></div>
      </Opt>
      <Opt id="C" name="Address only">
        <div className={o.said}><Avatar size={28} /><div>That&apos;s one for Kyle. His email is
          <div className={o.row}><button type="button" className={r.addr}><I icon={AtSign} />kyle.naranjo@gmail.com<I icon={Copy} /></button></div>
        </div></div>
      </Opt>
    </Opts>
  );
}

/* ---------------------------------- offline ------------------------------ */
const WROTE = ["What does he work on now?", "Is he open to new roles?", "Can he speak at my event?"];
function Offline({ children }: { children: ReactNode }) {
  return (
    <div className={o.said}><KyllmLive mood="sorry" size={28} /><div>I&apos;m offline for today. Kyle wrote these answers himself:
      <div className={o.row}>{WROTE.map((q) => <Pill key={q} arrow>{q}</Pill>)}</div>
      <div className={r.emailRow}>{children}</div>
    </div></div>
  );
}

export function OfflineR3() {
  return (
    <Opts>
      <Opt id="A" name="Plain pill with a mail icon" rec>
        <Offline><button type="button" className={`${s.pill} ${r.mailPill}`}><I icon={Mail} />Email Kyle</button></Offline>
      </Opt>
      <Opt id="B" name="Text link under the chips">
        <Offline><span className={r.mailText}>Or email <a href="#" onClick={(e) => e.preventDefault()}>kyle.naranjo@gmail.com</a></span></Offline>
      </Opt>
      <Opt id="C" name="Address that copies">
        <Offline><button type="button" className={r.addr}><I icon={AtSign} />kyle.naranjo@gmail.com<I icon={Copy} /></button></Offline>
      </Opt>
      <Opt id="D" name="Coral button (now)">
        <Offline><Pill kind="primary">Email Kyle</Pill></Offline>
      </Opt>
    </Opts>
  );
}
