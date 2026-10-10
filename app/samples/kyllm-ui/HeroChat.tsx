"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnswerActions, Avatar, Cite, Composer, Highlights, PanelHeader, Pill, UserMsg } from "./kit";
import { MCP_RUN, Steps, type StepData } from "./Steps";
import h from "./hero.module.css";

/*
 * The hero chat: a fixed-height panel whose thread scrolls inside it, like
 * every chat app. Nothing folds; earlier turns stay as they were.
 *   - the panel never changes height, so the page never jumps
 *   - the thread's scroll stays in the thread (overscroll-behavior: contain)
 *   - a fade at the top edge appears once there is something above
 *   - a new question scrolls to the bottom; if the visitor has scrolled up
 *     to reread, a "Latest" pill appears instead of yanking them down
 */

type Turn = { q: string; steps?: StepData[]; a: ReactNode; sources?: [string, string][]; live?: boolean };

export const AGENTS_RUN: StepData[] = [
  { cat: "think", text: "Reading the question", meta: "about agent work", ms: 200 },
  { cat: "tool", text: "Searching the CV", meta: "6 matches", ms: 300 },
  { cat: "tool", text: "Opening Document Intelligence", meta: "In Production", section: "Projects · Document Intelligence", ms: 400 },
  { cat: "tool", text: "Opening Thinking Machines", meta: "Experience", section: "Experience · Thinking Machines", ms: 300 },
  { cat: "write", text: "Writing the answer", meta: "2 sentences", ms: 500 },
  { cat: "check", text: "Linking sources", meta: "2 sources", ms: 200 },
];
export const TALKS_RUN: StepData[] = [
  { cat: "think", text: "Reading the question", meta: "about talks", ms: 200 },
  { cat: "tool", text: "Opening Community", meta: "GDG Davao", section: "Community · Talks", ms: 400 },
  { cat: "write", text: "Writing the answer", meta: "2 sentences", ms: 400 },
  { cat: "check", text: "Linking sources", meta: "1 source", ms: 150 },
];
export const OPENING_RUN: StepData[] = [
  { cat: "think", text: "Reading the question", meta: "overview", ms: 200 },
  { cat: "tool", text: "Opening every section", meta: "8 sections", ms: 500 },
  { cat: "write", text: "Writing the answer", meta: "4 highlights", ms: 600 },
];

const START: Turn[] = [
  {
    q: "Give me the 30-second version of Kyle.",
    steps: OPENING_RUN,
    a: (<><p>4+ years building for enterprise clients in financial services, investment management, education, and compliance. Four things worth knowing:</p><div className={h.block}><Highlights /></div></>),
  },
  {
    q: "How does the MCP server work?",
    steps: MCP_RUN,
    a: <p>It&apos;s a proof of concept Kyle built at Thinking Machines: a Model Context Protocol server between ChatGPT and Databricks. ChatGPT calls a tool on the server, and the server runs the query on the lakehouse through governed access, so there&apos;s no one-off API wrapper per question<Cite n={1} />.</p>,
    sources: [["Projects", "MCP Server"], ["Community", "Talks"]],
  },
];

const NEXT: Record<string, Omit<Turn, "q">> = {
  "What else has he built with agents?": {
    steps: AGENTS_RUN,
    a: <p>At Thinking Machines he works on Snowflake Cortex agent workflows that let investment officers query long-form documents, owning the agent tooling, prompts, evaluation, and incident triage<Cite n={1} />. He also wires AI coding agents into his team&apos;s delivery with custom skills, hooks, and commands<Cite n={2} />.</p>,
    sources: [["Projects", "Document Intelligence"], ["Experience", "Thinking Machines"]],
  },
  "Which talks cover this?": {
    steps: TALKS_RUN,
    a: <p>He speaks on generative AI, AI coding agents, and modern engineering workflows. He leads GDG Davao and has spoken at conferences, startup events, and AWS User Group Davao<Cite n={1} />.</p>,
    sources: [["Community", "Talks"]],
  },
};

function TurnView({ turn, onAnswered }: { turn: Turn; onAnswered?: () => void }) {
  const [answered, setAnswered] = useState(!turn.live);
  const done = useCallback(() => { setAnswered(true); onAnswered?.(); }, [onAnswered]);
  return (
    <>
      <UserMsg>{turn.q}</UserMsg>
      <div className={h.answer}>
        <Avatar size={36} />
        <div className={h.answerBody}>
          {turn.steps ? <Steps v="waterfall" steps={turn.steps} play={turn.live ? 1 : 0} onDone={done} /> : null}
          {answered ? (
            <div className={h.reveal}>
              {turn.a}
              {turn.sources ? (
                <div className={h.sources}>
                  <span>Sources</span>
                  {turn.sources.map(([sec, name]) => <Pill key={name} kind="source"><b>{sec}</b>{name} ↗</Pill>)}
                </div>
              ) : null}
              <AnswerActions />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function HeroChat() {
  const [turns, setTurns] = useState<Turn[]>(START);
  const [busy, setBusy] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [away, setAway] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const follow = useRef(true);

  const toBottom = (smooth = true) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  // open on the latest exchange
  useLayoutEffect(() => { toBottom(false); }, []);

  // keep following the thread while it grows, unless the visitor scrolled up
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { if (follow.current) toBottom(true); });
    [...el.children].forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [turns]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    follow.current = fromBottom < 40;
    setAway(fromBottom > 120);
    setScrolled(el.scrollTop > 4);
  };

  const ask = (q: string) => {
    if (busy || !NEXT[q]) return;
    follow.current = true;
    setBusy(true);
    setTurns((ts) => [...ts, { q, ...NEXT[q], live: true }]);
  };

  const asked = new Set(turns.map((t) => t.q));
  const chips = Object.keys(NEXT).filter((q) => !asked.has(q));

  return (
    <div className={h.panel}>
      <PanelHeader right={<><span>Answers from my CV, powered by Claude</span><button type="button" className={h.newChat} onClick={() => { setTurns(START); setBusy(false); follow.current = true; }}>New chat</button></>} />
      <div className={h.scrollWrap} data-scrolled={scrolled ? "" : undefined}>
        <div ref={scroller} className={h.scroll} onScroll={onScroll}>
          <div className={h.thread}>
            {turns.map((t, i) => <TurnView key={`${i}-${t.q}`} turn={t} onAnswered={t.live ? () => setBusy(false) : undefined} />)}
          </div>
        </div>
        <button type="button" className={h.latest} data-show={away ? "" : undefined} onClick={() => { follow.current = true; toBottom(true); }}>
          ↓ Latest
        </button>
      </div>
      <div className={h.foot}>
        {chips.length && !busy ? (
          <div className={h.chips}>
            {chips.map((q, i) => (
              <button key={q} type="button" className={h.chip} onClick={() => ask(q)}>
                <i style={{ background: `var(--${i ? "b4" : "b2"})` }} />{q}
              </button>
            ))}
          </div>
        ) : null}
        <Composer placeholder={busy ? "KYLLM is answering…" : "Ask a follow-up…"} state={busy ? "stop" : "send"} />
      </div>
    </div>
  );
}
