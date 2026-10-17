"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";
import { BrandRoot, Frame, Row, SectionHead } from "../../../../_brand/kit";
import { KyllmTuned, type KyllmHandle, type KyllmMood, type KyllmMove } from "../KyllmTuned";
import s from "../../review.module.css";
import m from "./moves.module.css";

type Card = { move: KyllmMove; name: string; when: string; rule: string; then?: KyllmMove; after?: number };

const ENTRANCES: Card[] = [
  { move: "popIn", name: "Pop In", when: "The chat panel opens.", rule: "Scale-in entrance, Playful: from 75%, 10 to 15% overshoot, 0.4s. Body first, then ears and leaf, glasses drop on at 100ms, eyes open last." },
  { move: "peek", name: "Peek Up", when: "The avatar first comes into view.", rule: "Rises until the eyes clear the edge, looks left and right, dips (anticipation), then pops up past its spot and settles." },
  { move: "dipAway", name: "Dip Away", when: "The chat panel closes. Pop In plays after it here.", rule: "Exit at 70% of the entrance (0.28s), ease-in, same easing family as Pop In.", then: "popIn", after: 700 },
];
const GESTURES: Card[] = [
  { move: "nod", name: "Nod", when: "A message is sent, or KYLLM agrees.", rule: "Two beats, the second smaller. Glasses follow 40ms late, ears 60ms late." },
  { move: "shake", name: "Shake", when: "KYLLM gently says no, or an input is invalid.", rule: "Error shake: 2 to 3 shrinking cycles in 0.45s, no overshoot, ends where it started." },
  { move: "glasses", name: "Glasses Push", when: "Just before Reading, while it looks something up.", rule: "The glasses slide down with an ease-in, hold, dip (anticipation), and snap back past home. The squint is the secondary action." },
  { move: "twitch", name: "Ear Twitch", when: "Now and then while idle, or when a notification arrives.", rule: "Urgent timing, 100 to 150ms a flick. One ear only, so the motion is uneven." },
  { move: "startle", name: "Startle", when: "A new message arrives while KYLLM is idle.", rule: "Surprise: a sudden ease-out jump, stretched on the way up, eyes wide. Glasses and leaf trail." },
  { move: "wiggle", name: "Happy Wiggle", when: "The visitor says hi or thanks.", rule: "Playful: bouncy side-to-side arcs in 0.75s, happy eyes, the leaf swinging the other way." },
  { move: "celebrate", name: "Celebrate", when: "A long answer finishes.", rule: "Exaggeration: squash and stretch up to 10%, two hops, the leaf spins a full turn." },
];

/** A move card: KYLLM full size and as a 48px avatar, both playing the move. */
function MoveCard({ card, tick, delay }: { card: Card; tick: number; delay: number }) {
  const a = useRef<KyllmHandle>(null), b = useRef<KyllmHandle>(null);
  const timers = useRef<number[]>([]);
  const play = () => {
    timers.current.forEach(clearTimeout);
    a.current?.play(card.move);
    b.current?.play(card.move);
    if (card.then) {
      const next = card.then;
      timers.current = [window.setTimeout(() => { a.current?.play(next); b.current?.play(next); }, card.after ?? 600)];
    }
  };
  const playRef = useRef(play);
  useEffect(() => { playRef.current = play; });
  useEffect(() => {
    if (!tick) return;
    const t = window.setTimeout(() => playRef.current(), delay);
    return () => clearTimeout(t);
  }, [tick, delay]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (
    <figure className={m.card}>
      <div className={m.pair}>
        <KyllmTuned ref={a} variant="full" size={150} />
        <KyllmTuned ref={b} size={48} />
      </div>
      <figcaption>
        <div className={m.head}><b>{card.name}</b><button type="button" className={m.replay} onClick={play}>Replay</button></div>
        <span className={m.when}>{card.when}</span>
        <span className={m.rule}>{card.rule}</span>
      </figcaption>
    </figure>
  );
}

function Shell({ name, when, rule, mood, look, touch, ka, kb, children }: {
  name: string; when: string; rule: string; mood: KyllmMood; look?: readonly [number, number];
  touch?: boolean; ka?: React.RefObject<KyllmHandle | null>; kb?: React.RefObject<KyllmHandle | null>; children?: React.ReactNode;
}) {
  return (
    <figure className={m.card}>
      <div className={m.pair}>
        <KyllmTuned ref={ka} variant="full" size={150} state={mood} look={look} touch={touch} />
        <KyllmTuned ref={kb} size={48} state={mood} look={look} touch={touch} />
      </div>
      <figcaption>
        <div className={m.head}><b>{name}</b></div>
        {children}
        <span className={m.when}>{when}</span>
        <span className={m.rule}>{rule}</span>
      </figcaption>
    </figure>
  );
}

/** Typing into the box puts KYLLM in Listening; each keystroke is a beat, and the eyes follow the caret. */
function ListenCard() {
  const [text, setText] = useState("");
  const [focus, setFocus] = useState(false);
  const ka = useRef<KyllmHandle>(null), kb = useRef<KyllmHandle>(null);
  const ping = (move: KyllmMove) => { ka.current?.play(move); kb.current?.play(move); };
  const look = focus ? ([-0.7 + Math.min(1, text.length / 36) * 1.4, 0.9] as const) : undefined;
  return (
    <Shell name="Listening" mood={focus ? "listen" : "idle"} look={look} ka={ka} kb={kb}
      when="The visitor is typing a message."
      rule="Ears and leaf perk up, eyes a third of the way to wide. Each keystroke flicks one ear, and the eyes follow the caret.">
      <input className={m.input} value={text} placeholder="Type a question" aria-label="Type a question"
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChange={(e) => { setText(e.target.value); ping("ping"); }} />
    </Shell>
  );
}

const REPLY = "Here is a short reply, streamed a few words at a time so you can see each chunk land.";

/** Streams a reply in chunks; each chunk is a small bob, then Answered when it finishes. */
function SpeakCard() {
  const [mood, setMood] = useState<KyllmMood>("idle");
  const [shown, setShown] = useState("");
  const ka = useRef<KyllmHandle>(null), kb = useRef<KyllmHandle>(null);
  const ping = (move: KyllmMove) => { ka.current?.play(move); kb.current?.play(move); };
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const run = () => {
    timers.current.forEach(clearTimeout);
    const words = REPLY.split(" ");
    setShown("");
    setMood("speak");
    let at = 120;
    timers.current = words.map((_, i) => {
      at += 70 + ((i * 37) % 90);
      return window.setTimeout(() => {
        setShown(words.slice(0, i + 1).join(" "));
        ping("ping");
      }, at);
    });
    timers.current.push(window.setTimeout(() => setMood("answered"), at + 250));
    timers.current.push(window.setTimeout(() => setMood("idle"), at + 1700));
  };
  return (
    <Shell name="Speaking" mood={mood} ka={ka} kb={kb}
      when="A reply is streaming in."
      rule="Looks across at the reply. Each streamed chunk is a 0.2s bob with a 3% squash, and the leaf answers 40ms later.">
      <div className={m.reply} aria-live="polite">{shown || " "}</div>
      <button type="button" className={m.replay} onClick={run}>Stream a Reply</button>
    </Shell>
  );
}

function DozeCard() {
  const [doze, setDoze] = useState(false);
  return (
    <Shell name="Dozing" mood={doze ? "doze" : "idle"}
      when="Nobody has typed for a while, say 30 seconds."
      rule="Calm: 0.9s with no overshoot. Eyes close, ears and leaf droop, glasses slip, breath slows to 3.3s at 2%. Waking up is a slow stretch.">
      <button type="button" className={m.replay} onClick={() => setDoze((d) => !d)}>{doze ? "Wake Up" : "Doze"}</button>
    </Shell>
  );
}

/** KYLLM chases the pointer around a stage: a spring for position, velocity for lean and stretch. */
function Companion() {
  const reduce = useReducedMotion() ?? false;
  const stage = useRef<HTMLDivElement>(null);
  const tx = useMotionValue(0), ty = useMotionValue(0);
  const x = useSpring(tx, { visualDuration: 0.5, bounce: 0.25 }), y = useSpring(ty, { visualDuration: 0.5, bounce: 0.25 });
  const vx = useVelocity(x), vy = useVelocity(y);
  const rotate = useTransform(vx, [-1600, 1600], [-14, 14], { clamp: true });
  const speed = useTransform(() => Math.hypot(vx.get(), vy.get()));
  const scaleY = useTransform(speed, [0, 2400], [1, 1.08], { clamp: true });
  const scaleX = useTransform(() => 1 / scaleY.get());
  const home = () => { tx.set(0); ty.set(0); };
  return (
    <div ref={stage} className={m.stage}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        // Sit just left of and below the pointer, so the pointer stays visible beside the glasses.
        tx.set(e.clientX - (r.left + r.width / 2) - 54);
        ty.set(e.clientY - (r.top + r.height / 2) + 30);
      }}
      onPointerLeave={home}>
      <motion.div className={m.buddy} style={reduce ? { x: tx, y: ty } : { x, y, rotate, scaleX, scaleY }}>
        <KyllmTuned variant="full" size={96} />
      </motion.div>
      <span className={m.stageNote}>Move your pointer in this box.</span>
    </div>
  );
}

/** The moves in context: one scripted chat, start to finish. */
const FLOW: { label: string; mood?: KyllmMood; move?: KyllmMove; ms: number; type?: string; pings?: number }[] = [
  { label: "Panel opens", move: "popIn", mood: "idle", ms: 900 },
  { label: "Visitor types", mood: "listen", type: "What do you work on?", ms: 1700 },
  { label: "Message sent", mood: "idle", move: "nod", ms: 700 },
  { label: "Thinking", mood: "think", ms: 1500 },
  { label: "Looks it up", mood: "idle", move: "glasses", ms: 1100 },
  { label: "Reading", mood: "read", ms: 1400 },
  { label: "Streams the reply", mood: "speak", pings: 14, ms: 1800 },
  { label: "Answered", mood: "answered", ms: 1400 },
  { label: "Visitor says thanks", mood: "idle", move: "wiggle", ms: 1200 },
  { label: "Goes quiet", mood: "doze", ms: 2600 },
  { label: "Visitor comes back", mood: "idle", move: "startle", ms: 1200 },
];

function Conversation() {
  const [mood, setMood] = useState<KyllmMood>("idle");
  const [step, setStep] = useState(-1);
  const [typed, setTyped] = useState("");
  const ka = useRef<KyllmHandle>(null), kb = useRef<KyllmHandle>(null);
  const ping = (move: KyllmMove) => { ka.current?.play(move); kb.current?.play(move); };
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)); };
  const run = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setTyped("");
    let at = 0;
    FLOW.forEach((f, i) => {
      const start = at;
      later(start, () => {
        setStep(i);
        if (f.mood) setMood(f.mood);
        if (f.move) ping(f.move!);
      });
      if (f.type) [...f.type].forEach((_, j) => later(start + 80 + j * 70, () => {
        setTyped(f.type!.slice(0, j + 1));
        ping("ping");
      }));
      if (f.label === "Message sent") later(start, () => setTyped(""));
      if (f.pings) for (let j = 0; j < f.pings; j++) later(start + 60 + j * 120, () => ping("ping"));
      at += f.ms;
    });
    later(at, () => setStep(-1));
  };
  const look = mood === "listen" ? ([-0.7 + Math.min(1, typed.length / 24) * 1.4, 0.9] as const) : undefined;
  return (
    <div className={m.flow}>
      <div className={m.flowStage}>
        <KyllmTuned ref={ka} variant="full" size={220} state={mood} look={look} />
        <div className={m.flowAvatar}>
          <KyllmTuned ref={kb} size={36} state={mood} look={look} />
          <span className={m.input} aria-hidden="true">{typed || "Ask about Kyle"}</span>
        </div>
      </div>
      <div className={m.flowSide}>
        <button type="button" className={s.playBtn} style={{ marginLeft: 0, alignSelf: "flex-start" }} onClick={run}>Play the Conversation</button>
        <ol className={m.steps}>
          {FLOW.map((f, i) => (
            <li key={f.label} aria-current={i === step ? "step" : undefined}>
              <b>{f.label}</b><span>{[f.mood && f.mood !== "idle" ? f.mood : null, f.move].filter(Boolean).join(" + ") || "idle"}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function Moves() {
  const [tick, setTick] = useState(0);
  return (
    <BrandRoot>
      <main className={s.main}>
        <Frame>
          <Row>
            <div className={s.intro}>
              <h1 className={s.title}>KYLLM Moves</h1>
              <p className={s.lede}>
                More animations for KYLLM, all built on the Motion + skills version and timed with the rules from the two motion
                skills. Each card shows KYLLM full size and as a 48px chat avatar. Back to the{" "}
                <Link href="/samples/kyllm/motion">motion libraries</Link>.
              </p>
            </div>
          </Row>

          <Row>
            <SectionHead num="01" title="In a Conversation" note="One scripted chat that uses the moves and states below, in order." />
            <Conversation />
          </Row>

          <Row>
            <SectionHead num="02" title="Entrances and Exits" note="For opening and closing the chat panel." />
            <div className={m.controls}>
              <button type="button" className={s.playBtn} style={{ marginLeft: 0 }} onClick={() => setTick((t) => t + 1)}>Play Every Move</button>
            </div>
            <div className={m.grid}>
              {ENTRANCES.map((c, i) => <MoveCard key={c.move} card={c} tick={tick} delay={i * 450} />)}
            </div>
          </Row>

          <Row>
            <SectionHead num="03" title="Gestures" note="One-shot moves, played on top of any state." />
            <div className={m.grid}>
              {GESTURES.map((c, i) => <MoveCard key={c.move} card={c} tick={tick} delay={1400 + i * 450} />)}
            </div>
          </Row>

          <Row>
            <SectionHead num="04" title="New States" note="Held for as long as the condition lasts, like the six chat states." />
            <div className={m.grid}>
              <ListenCard />
              <SpeakCard />
              <DozeCard />
            </div>
          </Row>

          <Row>
            <SectionHead num="05" title="Touch and Companion" note="Reactions to the visitor's pointer." />
            <div className={m.grid}>
              <Shell name="Pet and Boop" mood="idle" touch
                when="Hover to pet; click, tap, or press Enter to boop."
                rule="Hover enters in 0.18s and leaves in 0.3s. The boop is the Playful press: 10% squash, overshoot, settle, about 0.28s in all." />
            </div>
            <Companion />
          </Row>
        </Frame>
      </main>
    </BrandRoot>
  );
}
