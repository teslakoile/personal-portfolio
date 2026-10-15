import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChevronLoader } from "../loaders/Loaders";
import { Loading, MonthStrip } from "../states/States";
import { ASK_VERBS, SEND_VERBS } from "../states/verbs";
import {
  Answer, Avatar, CareerTimeline, Cite, CitedHighlight, Composer, FlowDiagram,
  Highlights, Pill, ProjectCard, Segmented, SendButton,
  Status, UserMsg,
} from "./kit";
import { Cursor } from "../../_brand/Cursor";
import { HeroChat } from "./HeroChat";
import { Legend, Steps, StepsOption } from "./Steps";
import { ReviewButtons, ReviewCard, ReviewNote, ReviewPick, ReviewProvider, RevisedTag } from "./review/Review";
import { HeaderOptions, OffTopicOptions } from "./options";
import { CitationStates, CopyStates, CountdownR3, DockR3, EmailR3, IconSet, InProgressR3, KeyHintStates, SorryR3, LiveAvatar, OfflineR3, PeekR3, PillR3, SourceR3, StarterR3, ThinkingR3, TouchR3 } from "./round3";
import { isDev, readReviews } from "./review/store";
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

/** When round 4 changed parts Kyle had already marked; they stay visible until marked again. */
const ROUND_4 = "2026-10-11T13:50:00Z";
const ROUND_5 = "2026-10-11T14:10:00Z";
const ROUND_6 = "2026-10-11T14:20:00Z";
const ROUND_9 = "2026-10-11T14:49:00Z";

function Item({ name, tag, note, used, source, wide, col, options, take, revised, children }: {
  name: string; tag: Tag; note: string; used: string; source: string; wide?: boolean; col?: boolean;
  /** set when the part changed after Kyle's mark, so it shows again for another look */
  revised?: string;
  /** option names, shown as A, B, C... with a picker under the note */
  options?: string[];
  /** my answer to a question in Kyle's note */
  take?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ReviewCard name={name} revised={revised} className={wide ? `${s.item} ${s.wide}` : s.item}>
      <div className={s.itemHead}><h3>{name}</h3><T t={tag} />{revised ? <RevisedTag name={name} revised={revised} /> : null}<ReviewButtons name={name} /></div>
      <div className={s.itemNote}>{note}</div>
      <ReviewNote name={name} />
      {take ? <div className={s.take}><b>My take</b>{take}</div> : null}
      {options ? <ReviewPick name={name} options={options} /> : null}
      <div className={col ? `${s.stage} ${s.col}` : s.stage}>{children}</div>
      <div className={s.meta}><span><b>Used in</b> {used}</span><span><b>Source</b> {source}</span></div>
    </ReviewCard>
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

export default async function KyllmParts() {
  const reviews = await readReviews();
  return (
    <div className={s.root}>
    <Cursor />
    <ReviewProvider initial={reviews} enabled={isDev}>
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
        <p className={s.lede}>
          Mark each part Approve, Change, or Drop, and add a note where it needs one. Marks save as you go, and only the
          approved parts get built into the production kit.
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
          <Item wide name="Icons" tag="new" note="Round 3: one icon set for every part, Lucide at a 2px stroke. The text arrows are gone." used="Every part" source="lucide-react 1.48.0">
            <IconSet />
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
          <Item name="Avatar" tag="have" note="The cat in a sky circle, the latest locked avatar. Answers at 36px, header at 32, small tags at 20." used="Header, answers, dock, tags" source="public/kyllm, built by scripts/kyllm">
            <St label="20"><Avatar size={20} /></St><St label="32"><Avatar size={32} /></St><St label="36"><Avatar size={36} /></St><St label="64"><Avatar size={64} /></St><St label="96"><Avatar size={96} /></St><St label="Animated, idle"><LiveAvatar size={64} /></St>
          </Item>
          <Item name="Pet and Boop" tag="new" note="Click, tap, or press Enter on KYLLM to boop it: a quick squash that springs back into a stretch, eyes squeezed shut, then happy. Quick boops press deeper, and the fourth in a row giggles. Hover to have it look at the pointer; stroke across it to pet it." used="Every live avatar; the dock boops it on click" source="KyllmLive touch, avatar-animation rules">
            <TouchR3 />
          </Item>
          <Item name="Send button" tag="new" note="Coral to send, ink square to stop a stream, sunk grey while rate limited." used="Composer" source="Boards">
            <St label="Send"><SendButton /></St><St label="Stop"><SendButton state="stop" /></St><St label="Waiting"><SendButton state="wait" /></St>
          </Item>
          <Item wide name="Pill" tag="new" note="Round 3: your C, with a Lucide arrow so it matches every other icon. Should the arrow always show, or slide in on hover?" used="Follow-ups, starters" source="Round 2 pick C" options={["Arrow always", "Arrow slides in on hover"]}>
            <PillR3 />
          </Item>
          <Item wide name="Citation" tag="new" note="Round 3: your pick A, now a real button: it lifts and turns coral on hover, and the site cursor turns to a hand. Clicking it scrolls to the section (Section highlight is dropped)." used="Answers" source="Round 2 pick A">
            <CitationStates />
          </Item>
          <Item wide name="Icon button" tag="new" note="Round 3: your pick C, copy only. A Lucide icon that swaps to a check with a Copied tooltip; click the first one." used="Answer actions" source="Round 2 pick C">
            <CopyStates />
          </Item>
          <Item name="Status" tag="have" note="Project status, same chip as the Projects section." used="Project card" source="sampleContent.ts statuses">
            <Status kind="live" /><Status kind="poc" /><Status kind="done" />
          </Item>
          <Item wide name="Key hint" revised={ROUND_4} tag="have" note="Round 4: your D is now clickable (it opens KYLLM), so the site cursor turns to a hand over it, and the tooltip shows on hover. The sidebar's Ask KYLLM row will use the same hint." used="Composer, rail, dock" source="Round 2 pick D">
            <KeyHintStates />
          </Item>
          <Item name="Segmented control" tag="flag" note="The “I'm a…” switch. Decide: does it change starter questions only, or answers too?" used="Hero starters" source="Boards"
            take={<>It&apos;s the &ldquo;I&apos;m a…&rdquo; switch from the boards. It sits above the starter questions in an empty chat and picks which starters show: a recruiter sees availability and roles, an engineer sees architecture. It disappears after the first question. Drop it: four good starters cover every visitor, and it&apos;s one more control in a panel you want simple.</>}>
            <Segmented options={["Recruiter", "Engineer", "Founder", "Just curious"]} on="Engineer" />
          </Item>
          <Item wide name="Countdown ring" revised={ROUND_4} tag="new" note="Round 4: while you can't send, the composer greys out with a not-allowed cursor, and comes back when the wait ends. Your pick is B." used="Rate limit" source="Boards" options={["Ring beside a notice", "Ring around Send", "Bar under the composer"]}>
            <CountdownR3 />
          </Item>
        </Section>

        <Section id="conversation" n="03" title="Conversation" note="The thread and its frame">
          <Item wide name="Panel header" tag="new" note="Round 2: no chat history and no tagline. One conversation at a time; New chat clears it, and KYLLM forgets everything said before." used="Hero panel, floating panel" source="Boards" options={["New chat appears after a question", "Icon button", "Always there, off when empty"]}>
            <HeaderOptions />
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
          <Item name="Follow-ups" tag="new" note="Round 3: the suggestion pill above, no topic block." used="After each answer" source="Pill">
            <Pill arrow>What else has he built with agents?</Pill><Pill arrow>Which talks cover this?</Pill>
          </Item>
          <Item name="Answer actions" tag="new" note="Round 3: copy only, the Icon button above. No link to the answer and no thumbs." used="Under each answer" source="Icon button, pick C" col>
            <CopyStates />
          </Item>
        </Section>

        <Section id="steps" n="03b" title="Steps" note="Press Replay to watch a run.">
          <Item wide name="Waterfall" tag="new" note="Each step is a solid bar on the run's timeline, coloured by category and as long as the step took. The live bar grows in real time; hover a row to see when it ran. Folded, a strip keeps the run's shape." used="Every answer" source="Brand rule: blocks encode data" col>
            <Legend />
            <StepsOption v="waterfall" />
          </Item>
        </Section>

        <Section id="blocks" n="04" title="Answer blocks" note="Attached only when a question calls for one">
          <Item wide name="Source chips" revised={ROUND_6} tag="new" note="Round 6: one chip for every source; the mark tells where it lives, a right arrow means this page, the diagonal arrow another site. Hover shows where it goes, the chip lifts with a coral edge, and the cursor turns to a hand." used="Answers with citations" source="Round 3 pick A"
            take={<>KYLLM should cite only your own material: sections of this site, plus your own GitHub, LinkedIn, and IEEE paper. No general web search; it can&apos;t vouch for other people&apos;s pages, and it&apos;s where wrong facts would come from.</>}>
            <SourceR3 />
          </Item>
          <Item wide name="Citation peek" tag="borrow" note="Round 3: four lighter ways to show what a citation points to." used="Citation hover" source="Round 3" options={["One-line tooltip", "Lights up its source chip", "Slim card", "Nothing on hover; click scrolls"]}>
            <PeekR3 />
          </Item>
          <Item name="Highlights grid" tag="new" note="The 30-second version: four topics, each linking to its section." used="Opening answer" source="KYLLM hero" wide
            take={<>Only one question uses it: the &ldquo;30-second version&rdquo; starter. A real model would have to call a tool to draw it. Drop the grid and answer that starter in text with four section links; it reads the same and costs nothing to build.</>}>
            <Highlights />
          </Item>
          <Item name="Project card" tag="have" note="Same card as the Projects section: status, client, stack, one real metric." used="Project answers" source="Projects section" wide
            take={<>Projects are likely the most common topic, so this would show up often. Each card needs the model to call a tool with a project name, and the page already shows the same card in Projects. Drop it, and let project answers link to the card on the page with Section highlight.</>}>
            <ProjectCard />
          </Item>
          <Item name="Flow diagram" tag="new" note="Three nodes for how-it-works answers; data blocks on the wires." used="Architecture answers" source="Boards; brand kit Pipeline" wide
            take={<>Only &ldquo;how does X work&rdquo; questions about two or three projects would use it. Drop it: a diagram the model assembles is the easiest place to get facts wrong.</>}>
            <FlowDiagram />
          </Item>
          <Item name="Career timeline" tag="new" note="One block per month per role from real dates. The month strip below answers on hover." used="Time questions" source="Boards; MonthStrip" wide col
            take={<>Only time questions (&ldquo;how long at Thinking Machines?&rdquo;) would use it, and the Experience section already draws the timeline. Drop it, and link to Experience instead.</>}>
            <CareerTimeline />
            <MonthStrip months={Array.from({ length: 27 }, (_, i) => new Date(2024, 7 + i).toLocaleString("en", { month: "short", year: "numeric" }))} label="at Thinking Machines" />
          </Item>
          <Item wide name="Email handoff" tag="new" note="Round 3: checked against the brand. The old card broke two rules: a coral button outside the composer, and a raised card that read as a form." used="Off-topic answers" source="Round 3" options={["Draft card, on brand", "One line and a pill", "Address only"]}>
            <EmailR3 />
          </Item>
        </Section>

        <Section id="states" n="05" title="States" note="Waiting, limits, and failure">
          <Item wide name="Thinking" revised={ROUND_9} tag="new" note="Round 10: sorry no longer moves the ears and uses your pick, D Apologetic bow. Both pupils move together, so they never cross or drift apart; sorry ears flatten about their bases instead of turning, so the head keeps its shape; in progress now uses Pondering (options below). The avatar moves on springs every frame, after the favicon's physics: the body squashes and stretches about its feet, the leaf whips and trails, the eyes ease between poses, blinks are scheduled. Your five states, with think and read merged into In progress." used="Every answer, header, dock" source="rig/KyllmLive.tsx on the gifted-heisenberg rig">
            <ThinkingR3 />
          </Item>
          <Item wide name="In progress" tag="new" note="Round 8: A is pondering with an ellipsis and no bubble. Three ways to show KYLLM working, quietest first. Each shown at chat size (36) and large." used="Thinking, while steps run and the answer streams" source="rig/KyllmLive.tsx" options={["Pondering with dots", "Eyes circling", "Leaf ticking"]}>
            <InProgressR3 />
          </Item>
          <Item wide name="Sorry" tag="new" note="Round 10: the ears stay exactly as drawn in all four; each style acts with the body, leaf, glasses, and eyes. Shown at chat size (36) and large. Used for off-topic questions, offline, and rate limits." used="Off-topic, offline, rate limit" source="rig/KyllmLive.tsx" options={["Sigh", "Head shake", "Shrink back", "Apologetic bow"]}>
            <SorryR3 />
          </Item>
          <Item name="Rate limit" tag="new" note="Round 3: merged into Countdown ring above. Whichever countdown you pick is the whole rate-limit state; there's no separate notice." used="Composer" source="Countdown ring">
            <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>See Countdown ring in Primitives.</span>
          </Item>
          <Item wide name="Offline fallback" tag="new" note="Round 3: four ways to offer email under the chips. KYLLM uses its sorry mood here." used="Whole panel" source="Round 3" options={["Plain pill with a mail icon", "Text link under the chips", "Address that copies", "Coral button (now)"]}>
            <OfflineR3 />
          </Item>
          <Item wide name="Off-topic" tag="new" note="Round 2: four replies to a question outside the CV, each with a way back." used="Answers" source="Boards" options={["Decline, then starters", "Hand off to Kyle", "Closest topic", "Playful"]}>
            <OffTopicOptions />
          </Item>
          <Item name="First visit" tag="new" note="One line under the composer until the first question." used="Composer" source="Boards" col>
            <Composer />
            <span style={{ fontSize: 12, color: "var(--ink-3)", alignSelf: "center" }}>KYLLM can be wrong. Check the linked sources.</span>
          </Item>
          <Item wide name="Starter tiles" tag="flag" note="Round 3: starters as the same pills as the follow-ups, before the first question." used="Hero, empty chat" source="Pill" options={["Pills in a row", "Pills stacked"]}>
            <StarterR3 />
          </Item>
        </Section>

        <Section id="surfaces" n="06" title="Surfaces" note="Where the parts are assembled">
          <Item wide name="Dock pill" revised={ROUND_5} tag="new" note="Round 5: the hover version. It breathes and blinks at rest; hover it and it lifts, KYLLM hops and looks up at the cursor, and the site cursor turns to a hand." used="Every section after the hero" source="Round 3 pick A">
            <DockR3 />
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
            <li><b>Hero panel.</b> We iterate on it in chat next.</li>
            <li><b>Avatar.</b> The only part not reviewed yet.</li>
            <li><b>Diagrams.</b> Flow diagram is dropped; revisit as a diagramming skill later.</li>
          </ol>
        </section>
      </div>
    </ReviewProvider>
    </div>
  );
}
