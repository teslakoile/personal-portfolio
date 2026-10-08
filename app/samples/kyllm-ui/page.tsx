import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChevronLoader } from "../loaders/Loaders";
import { Loading, MonthStrip } from "../states/States";
import { ASK_VERBS, SEND_VERBS } from "../states/verbs";
import {
  Answer, AnswerActions, Avatar, CareerTimeline, Cite, CitedHighlight, Composer, Dock, EmailDraft, FlowDiagram,
  Highlights, IconButton, Kbd, OfflineList, PanelHeader, Peek, Pill, ProjectCard, Ring, Segmented, SendButton,
  Status, StarterTiles, UserMsg,
} from "./kit";
import { HeroChat } from "./HeroChat";
import { Legend, Steps, StepsOption } from "./Steps";
import s from "./kyllm.module.css";

export const metadata: Metadata = { title: "KYLLM Parts | Samples", robots: { index: false, follow: false } };

/**
 * /samples/kyllm-ui: every primitive and component the KYLLM chat needs, for
 * review. Built from the KYLLM boards (design-explorations/2026-10-kyllm-ui),
 * the decided loading line (/samples/states, PR #20), and the cat avatar.
 */

type Tag = "new" | "have" | "borrow" | "flag";
const TAGS: Record<Tag, [string, string]> = {
  new: [s.tagNew, "New"],
  have: [s.tagHave, "Already built"],
  borrow: [s.tagBorrow, "Borrow"],
  flag: [s.tagFlag, "Needs a call"],
};
const T = ({ t }: { t: Tag }) => <span className={`${s.tag} ${TAGS[t][0]}`}>{TAGS[t][1]}</span>;

function Item({ name, tag, note, used, source, wide, col, children }: {
  name: string; tag: Tag; note: string; used: string; source: string; wide?: boolean; col?: boolean; children: ReactNode;
}) {
  return (
    <div className={wide ? `${s.item} ${s.wide}` : s.item}>
      <div className={s.itemHead}><h3>{name}</h3><T t={tag} /></div>
      <div className={s.itemNote}>{note}</div>
      <div className={col ? `${s.stage} ${s.col}` : s.stage}>{children}</div>
      <div className={s.meta}><span><b>Used in</b> {used}</span><span><b>Source</b> {source}</span></div>
    </div>
  );
}

const St = ({ label, children }: { label: string; children: ReactNode }) => <div className={s.state}>{children}<small>{label}</small></div>;

function Section({ id, n, title, note, children }: { id: string; n: string; title: string; note: string; children: ReactNode }) {
  return (
    <section id={id} className={s.sec}>
      <div className={s.secHead}><span>{n}</span><h2>{title}</h2><p>{note}</p></div>
      <div className={s.grid}>{children}</div>
    </section>
  );
}

const COLORS: [string, string, string][] = [
  ["paper", "#faf9f7", "Page"], ["surface", "#ffffff", "Panels, cards"], ["sunk", "#f3f1ed", "Hover, chips"], ["line", "#e7e3de", "Dividers"],
  ["ink", "#1c1917", "Text, user bubble"], ["ink-2", "#57534e", "Secondary text"], ["ink-3", "#a8a29e", "Meta, placeholders"], ["coral", "#f5482d", "Send, citations, loader"],
  ["b1", "#f26a4b", "Topic: Cloud"], ["b2", "#7fb99a", "Topic: AI Agents, done tick"], ["b3", "#86a9c8", "Topic: Data Platforms"], ["b4", "#e9b65c", "Topic: Community"],
];

export default function KyllmParts() {
  return (
    <div className={s.root}>
      <nav className={s.top}>
        <b>KYLLM parts</b>
        <a href="#foundations">Foundations</a><a href="#primitives">Primitives</a><a href="#conversation">Conversation</a>
        <a href="#steps">Steps</a><a href="#blocks">Answer Blocks</a><a href="#states">States</a><a href="#surfaces">Surfaces</a><a href="#open">Open Calls</a>
      </nav>
      <div className={s.wrap}>
        <h1 className={s.h1}>KYLLM interface: parts inventory</h1>
        <p className={s.lede}>
          Every primitive and component the chat needs, rendered live with real content. Built from our KYLLM boards, the
          loading line decided in /samples/states, and the cat avatar. Nothing here is on the live site yet.
        </p>
        <div className={s.legend}>
          <span><T t="new" />Designed on the boards, not built</span>
          <span><T t="have" />Built in another sample, reuse as is</span>
          <span><T t="borrow" />Take the pattern from the Beautiful UI parts bin</span>
          <span><T t="flag" />Built, but needs your decision</span>
        </div>

        <Section id="foundations" n="01" title="Foundations" note="Tokens every part reads">
          <Item wide name="Color" tag="have" note="Brand kit tokens. Coral is the only UI accent; b1 to b4 mark topics and data only." used="Every part" source="Brand kit (app/_brand)">
            <div className={s.swatches}>
              {COLORS.map(([k, hex, use]) => (
                <div key={k} className={s.swatch}><i style={{ background: hex }} /><div>{k}<code>{hex} · {use}</code></div></div>
              ))}
            </div>
          </Item>
          <Item name="Type" tag="have" note="Geist only, tabular digits everywhere. No mono labels, no all-caps." used="Every part" source="app/fonts.ts">
            <div className={s.ramp}>
              <div><small>Answer · 15 / 1.6</small><span style={{ fontSize: 15 }}>4+ years building for enterprise clients.</span></div>
              <div><small>User bubble · 14.5</small><span style={{ fontSize: 14.5 }}>How does the MCP server work?</span></div>
              <div><small>Chip, meta · 13</small><span style={{ fontSize: 13, color: "var(--ink-2)" }}>Which talks cover this?</span></div>
              <div><small>Fine print · 12</small><span style={{ fontSize: 12, color: "var(--ink-3)" }}>KYLLM can be wrong. Check the linked sources.</span></div>
            </div>
          </Item>
          <Item name="Shape" tag="have" note="Square structure, round touch: full pills for buttons, 14px only on floating layers." used="Every part" source="Brand rules">
            <div className={s.radii}>
              {[[6, "6 · chips"], [10, "10 · cards"], [14, "14 · panels"], [999, "pill · buttons"]].map(([r, l]) => (
                <div key={l}><i style={{ borderRadius: r as number }} />{l}</div>
              ))}
            </div>
          </Item>
          <Item wide name="Loading line" tag="have" note="Chevron, one word from the ask list every 3.4s with the synced shimmer, elapsed seconds in the chat only." used="Thinking, trace header, send button" source="/samples/states (PR #20)">
            <St label="Chat, with timer"><Loading verbs={ASK_VERBS} timer /></St>
            <St label="Send button, no timer"><Loading verbs={SEND_VERBS} /></St>
            <St label="Chevron at 14, 20, 32px">
              <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontSize: 14 }}><ChevronLoader /></span><span style={{ fontSize: 20 }}><ChevronLoader /></span><span style={{ fontSize: 32 }}><ChevronLoader /></span>
              </span>
            </St>
          </Item>
        </Section>

        <Section id="primitives" n="02" title="Primitives" note="Single-purpose parts">
          <Item name="Avatar" tag="have" note="The cat in a cream circle with a hairline ring. Answers at 36px, header at 32, folded turns at 20." used="Header, answers, dock, tags" source="scripts/kyllm (gifted-heisenberg)">
            <St label="20"><Avatar size={20} /></St><St label="32"><Avatar size={32} /></St><St label="36"><Avatar size={36} /></St><St label="64"><Avatar size={64} /></St><St label="96"><Avatar size={96} /></St>
          </Item>
          <Item name="Send button" tag="new" note="Coral to send, ink square to stop a stream, sunk grey while rate limited." used="Composer" source="Boards">
            <St label="Send"><SendButton /></St><St label="Stop"><SendButton state="stop" /></St><St label="Waiting"><SendButton state="wait" /></St>
          </Item>
          <Item name="Pill" tag="new" note="Suggestions carry a topic dot. Primary is coral and only for the main action in a block." used="Follow-ups, starters, handoff" source="Boards; brand pill buttons">
            <St label="Suggestion"><Pill dot="b2">How does the MCP server work?</Pill></St>
            <St label="Primary"><Pill kind="primary">Open in Mail</Pill></St>
            <St label="Plain"><Pill>Copy</Pill></St>
            <St label="Source"><Pill kind="source"><b>Projects</b>MCP Server ↗</Pill></St>
          </Item>
          <Item name="Citation" tag="new" note="Numbered chip after a claim. Coral on hover or while its source is open." used="Answers" source="Boards; Streaming Text pattern">
            <St label="Rest"><span>…query Databricks directly<Cite n={2} />.</span></St>
            <St label="Hover or open"><span>…owning the prompts and evals<Cite n={1} on />.</span></St>
          </Item>
          <Item name="Icon button" tag="new" note="Quiet until hover. Thumbs turn coral once pressed." used="Answer actions" source="Boards">
            <St label="Rest"><IconButton icon="copy" label="Copy" /></St><St label="With label"><IconButton icon="link" label="Link to answer" /></St><St label="Pressed"><IconButton icon="up" on /></St>
          </Item>
          <Item name="Status" tag="have" note="Project status, same chip as the Projects section." used="Project card" source="sampleContent.ts statuses">
            <Status kind="live" /><Status kind="poc" /><Status kind="done" />
          </Item>
          <Item name="Key hint" tag="have" note="⌘K focuses the composer from anywhere; esc closes floating chat." used="Composer, dock, dialog" source="Site sidebar">
            <Kbd>⌘K</Kbd><Kbd>esc</Kbd><Kbd>↑</Kbd>
          </Item>
          <Item name="Segmented control" tag="flag" note="The “I'm a…” switch. Decide: does it change starter questions only, or answers too?" used="Hero starters" source="Boards">
            <Segmented options={["Recruiter", "Engineer", "Founder", "Just curious"]} on="Engineer" />
          </Item>
          <Item name="Countdown ring" tag="new" note="Shows time left when a visitor hits the rate limit." used="Rate-limit notice" source="Boards">
            <Ring /><span style={{ fontSize: 13, color: "var(--ink-2)" }}>Ask again in 20s</span>
          </Item>
        </Section>

        <Section id="conversation" n="03" title="Conversation" note="The thread and its frame">
          <Item name="Panel header" tag="new" note="Avatar, name, one line on where answers come from. New chat appears after the first question." used="Hero panel, floating panel" source="Boards" col>
            <div style={{ width: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)" }}><PanelHeader /></div>
            <div style={{ width: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)" }}><PanelHeader right={<><span>Answers from my CV, powered by Claude</span><Pill>New chat</Pill></>} /></div>
          </Item>
          <Item name="Composer" tag="new" note="One rounded field. The placeholder says what is happening; the button follows." used="Every chat surface" source="Boards" col>
            <St label="Idle"><Composer /></St>
            <St label="Streaming"><Composer placeholder="KYLLM is answering…" state="stop" /></St>
            <St label="Rate limited"><Composer placeholder="Ask again in 20s" state="wait" /></St>
          </Item>
          <Item name="Messages" tag="new" note="Ink bubble for the visitor; the avatar marks KYLLM's answers, no name label." used="Thread" source="Boards" col>
            <div className={s.thread}>
              <UserMsg>How does the MCP server work?</UserMsg>
              <Answer>It&apos;s a proof of concept Kyle built at Thinking Machines: a Model Context Protocol server between ChatGPT and Databricks<Cite n={1} />.</Answer>
            </div>
          </Item>
          <Item name="Steps" tag="have" note="What KYLLM looked up before answering. The loading line heads it while steps arrive, then it folds to one line. Designs compared in 03b." used="Every answer" source="/samples/states AskTrace" col>
            <St label="Done, folded"><Steps v="waterfall" /></St>
          </Item>
          <Item name="Follow-ups" tag="new" note="Two suggestions drawn from the answer, topic-colored." used="After each answer" source="Boards; Streaming Text pattern">
            <Pill dot="b2">What else has he built with agents?</Pill><Pill dot="b4">Which talks cover this?</Pill>
          </Item>
          <Item name="Answer actions" tag="new" note="Copy, a link to this answer, thumbs. Thumbs only if ratings get stored." used="Under each answer" source="Boards">
            <AnswerActions />
          </Item>
        </Section>

        <Section id="steps" n="03b" title="Steps" note="Press Replay to watch a run.">
          <Item wide name="Waterfall" tag="new" note="Each step is a solid bar on the run's timeline, coloured by category and as long as the step took. The live bar grows in real time; hover a row to see when it ran. Folded, a strip keeps the run's shape." used="Every answer" source="Brand rule: blocks encode data" col>
            <Legend />
            <StepsOption v="waterfall" />
          </Item>
        </Section>

        <Section id="blocks" n="04" title="Answer blocks" note="Attached only when a question calls for one">
          <Item name="Source chips" tag="new" note="Under the answer: where each fact came from. Opens the peek or jumps to the section." used="Answers with citations" source="Boards; Streaming Text pattern">
            <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Sources</span>
            <Pill kind="source"><b>Projects</b>ChatGPT-to-Databricks MCP Server ↗</Pill><Pill kind="source"><b>Community</b>Talks ↗</Pill>
          </Item>
          <Item name="Citation peek" tag="borrow" note="Hover card with the source's own text and Show on page. Take Context Cards' layout." used="Citation hover" source="Boards; Context Cards">
            <Peek />
          </Item>
          <Item name="Highlights grid" tag="new" note="The 30-second version: four topics, each linking to its section." used="Opening answer" source="KYLLM hero" wide>
            <Highlights />
          </Item>
          <Item name="Project card" tag="have" note="Same card as the Projects section: status, client, stack, one real metric." used="Project answers" source="Projects section" wide>
            <ProjectCard />
          </Item>
          <Item name="Flow diagram" tag="new" note="Three nodes for how-it-works answers; data blocks on the wires." used="Architecture answers" source="Boards; brand kit Pipeline" wide>
            <FlowDiagram />
          </Item>
          <Item name="Career timeline" tag="new" note="One block per month per role from real dates. The month strip below answers on hover." used="Time questions" source="Boards; MonthStrip" wide col>
            <CareerTimeline />
            <MonthStrip months={Array.from({ length: 27 }, (_, i) => new Date(2024, 7 + i).toLocaleString("en", { month: "short", year: "numeric" }))} label="at Thinking Machines" />
          </Item>
          <Item name="Email handoff" tag="new" note="For anything outside the CV: KYLLM declines to guess and drafts the email. Nothing sends by itself." used="Off-topic answers" source="Boards" wide>
            <EmailDraft />
          </Item>
        </Section>

        <Section id="states" n="05" title="States" note="Waiting, limits, and failure">
          <Item name="Thinking" tag="have" note="Before the first token: the loading line next to the avatar." used="Every answer" source="/samples/states">
            <Answer><Loading verbs={ASK_VERBS} timer /></Answer>
          </Item>
          <Item name="Rate limit" tag="new" note="Plain words and a countdown; the composer waits." used="Composer" source="Boards" col>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", background: "#fff", fontSize: 13.5, color: "var(--ink-2)" }}>
              <Ring /><div><b style={{ color: "var(--ink)", fontWeight: 500 }}>One moment.</b> You can ask again in 20s.</div>
            </div>
          </Item>
          <Item name="Offline fallback" tag="new" note="API down or daily budget spent: answers Kyle wrote himself, plus email." used="Whole panel" source="Boards" col>
            <OfflineList />
          </Item>
          <Item name="Off-topic" tag="new" note="One polite line and a way back." used="Answers" source="Boards">
            <Answer>I only know Kyle&apos;s work, so I&apos;ll pass on the pirates.<div style={{ marginTop: 8 }}><Pill>Give me the 30-second version</Pill></div></Answer>
          </Item>
          <Item name="First visit" tag="new" note="One line under the composer until the first question." used="Composer" source="Boards" col>
            <Composer />
            <span style={{ fontSize: 12, color: "var(--ink-3)", alignSelf: "center" }}>KYLLM can be wrong. Check the linked sources.</span>
          </Item>
          <Item name="Starter tiles" tag="flag" note="Shown before the first question, ordered by the “I'm a…” switch." used="Hero, empty chat" source="Boards" col>
            <StarterTiles items={[["How does the MCP server work?", "Architecture"], ["How do you evaluate agents?", "Evals and triage"], ["What's the stack day to day?", "Tools"], ["Show me his GitHub", "Code"]]} />
          </Item>
        </Section>

        <Section id="surfaces" n="06" title="Surfaces" note="Where the parts are assembled">
          <Item name="Dock pill" tag="new" note="Past the hero, KYLLM shrinks to the corner and keeps the conversation." used="Every section after the hero" source="Boards">
            <Dock />
          </Item>
          <Item name="Section highlight" tag="new" note="Show on page scrolls to the cited section and outlines it, with a small tag." used="Citations" source="Boards" col>
            <div style={{ paddingTop: 14, width: "100%" }}><CitedHighlight /></div>
          </Item>
          <Item wide name="Hero panel" tag="new" note="The parts assembled. Fixed height; the thread scrolls inside it like any chat, and nothing folds. Click a follow-up to watch a live answer arrive; scroll up to reread and a Latest pill brings you back." used="Landing hero" source="Boards" col>
            <HeroChat />
          </Item>
        </Section>

        <section id="open" className={s.sec}>
          <div className={s.secHead}><span>07</span><h2>Open calls</h2><p>Decisions that change what gets built</p></div>
          <ol className={s.open}>
            <li><b>Persona switch.</b> Starter questions only, or answers too?</li>
            <li><b>Thumbs.</b> Store ratings for review, or drop the buttons?</li>
                      </ol>
        </section>
      </div>
    </div>
  );
}
