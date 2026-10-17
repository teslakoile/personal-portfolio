"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandRoot, Frame, Row, SectionHead } from "../../_brand/kit";
import { Kyllm, type KyllmState } from "../../_brand/kyllm/Kyllm";
import s from "./review.module.css";

const STATES: { id: KyllmState; name: string; when: string; motion: string }[] = [
  { id: "idle", name: "Idle", when: "Waiting for a question", motion: "Blinks every 4.8s; the leaf sways" },
  { id: "think", name: "Thinking", when: "Before the first word", motion: "Eyes glide up and right; the leaf flutters" },
  { id: "read", name: "Reading", when: "Reading a source", motion: "Eyes look down and left and scan" },
  { id: "answered", name: "Answered", when: "Answer finished", motion: "Happy eyes, a small hop, ears perk" },
  { id: "curious", name: "Curious", when: "Asking to clarify", motion: "Glasses slip down, eyes open wide, head tilts" },
  { id: "sorry", name: "Can't Answer", when: "Off-topic question", motion: "Eyes slant down; ears, leaf, and body droop" },
];

type Msg = { who: "user" | "kyllm"; text: string; meta?: string };

/** A short scripted chat: [delay before this step in ms, state, message?]. */
const SCRIPT: [number, KyllmState, Msg?][] = [
  [400, "idle", { who: "user", text: "How does the MCP server work?" }],
  [400, "think"],
  [1400, "read", { who: "kyllm", text: "", meta: "Reading Projects · MCP Server" }],
  [1600, "answered", { who: "kyllm", text: "It's a proof of concept Kyle built at Thinking Machines: a Model Context Protocol server between ChatGPT and Databricks." }],
  [1800, "idle"],
  [1200, "idle", { who: "user", text: "What would he charge for a 3-month contract?" }],
  [400, "think"],
  [1400, "sorry", { who: "kyllm", text: "Rates aren't in anything Kyle has published, so I won't guess. I can draft an email you can send him." }],
  [2000, "idle", { who: "user", text: "What does a governed path to the warehouse mean?" }],
  [400, "curious", { who: "kyllm", text: "Do you mean the access controls, or how the queries reach Databricks?" }],
  [2200, "idle"],
];

const FILES = [
  { path: "app/_brand/kyllm/Kyllm.tsx", use: "The component for the site. Inline SVG; set state as the chat moves." },
  { path: "public/kyllm/kyllm-rig.svg", use: "The whole character as a standalone animated SVG. Inline it to animate." },
  { path: "public/kyllm/kyllm-avatar-rig.svg", use: "The same in the avatar circle." },
  { path: "public/kyllm/motion/kyllm-{idle,think,read}.webp", use: "Seamless 4.8s loops at 192px, for a README, an email, or a card." },
  { path: "public/kyllm/motion/kyllm-{answered,curious,sorry}.webp", use: "One-second clips from idle into the state; play once." },
  { path: "public/kyllm/motion/kyllm-{state}.png", use: "One still per state at 192px." },
];

export function Review() {
  const [state, setState] = useState<KyllmState>("idle");
  const [still, setStill] = useState(false);
  const [replay, setReplay] = useState(0);

  // Re-entering a state replays its one-shot motion (the hop on Answered).
  function pick(next: KyllmState) {
    if (next === state) {
      setState("idle");
      requestAnimationFrame(() => requestAnimationFrame(() => setState(next)));
    } else setState(next);
    setReplay((n) => n + 1);
  }

  return (
    <BrandRoot>
      <main className={s.main}>
        <Frame>
          <Row>
            <div className={s.intro}>
              <h1 className={s.title}>KYLLM Motion</h1>
              <p className={s.lede}>
                The chat mascot in each state it moves through, from <code>app/_brand/kyllm</code>. Every eye shape and offset is
                measured from a 3D pose render; the body itself never changes. Compare it with a Motion-driven version on{" "}
                <Link href="/samples/kyllm/motion">Motion Libraries</Link>.
              </p>
            </div>
          </Row>

          <Row>
            <SectionHead num="01" title="Playground" note="Pick a state. Pick it again to replay its motion." />
            <div className={s.play}>
              <div className={s.stage}>
                <Kyllm variant="full" state={state} size={300} still={still} />
              </div>
              <div className={s.side}>
                <div className={s.states}>
                  {STATES.map((st) => (
                    <button key={st.id} type="button" className={s.state} aria-pressed={st.id === state} onClick={() => pick(st.id)}>
                      <b>{st.name}</b>
                      <span>{st.when}</span>
                      <small>{st.motion}</small>
                    </button>
                  ))}
                </div>
                <label className={s.toggle}>
                  <input type="checkbox" checked={still} onChange={(e) => setStill(e.target.checked)} />
                  Preview reduced motion: poses change, nothing moves
                </label>
                <div className={s.sizes} data-replay={replay}>
                  {[96, 48, 36, 28].map((px) => (
                    <figure key={px}>
                      <Kyllm state={state} size={px} still={still} />
                      <figcaption>{px}px</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </Row>

          <Row>
            <SectionHead num="02" title="In the Chat" note="A scripted conversation that runs through every state." />
            <Chat />
          </Row>

          <Row>
            <SectionHead num="03" title="Every State" note="Live, side by side, at 160px and 72px." />
            <div className={s.grid}>
              {STATES.map((st) => (
                <figure key={st.id} className={s.cell}>
                  <Kyllm variant="full" state={st.id} size={160} />
                  <Kyllm state={st.id} size={72} />
                  <figcaption>
                    <b>{st.name}</b>
                    <span>{st.when}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Row>

          <Row>
            <SectionHead num="04" title="Exported Files" note="For places that can't run the inline rig. Rendered frame by frame from the rig itself." />
            <div className={s.exports}>
              {STATES.map((st) => (
                <figure key={st.id} className={s.export}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- reviewing the exported file itself */}
                  <img src={`/kyllm/motion/kyllm-${st.id}.webp`} width={96} height={96} alt={`${st.name}, animated WebP`} />
                  {/* eslint-disable-next-line @next/next/no-img-element -- reviewing the exported file itself */}
                  <img src={`/kyllm/motion/kyllm-${st.id}.png`} width={48} height={48} alt={`${st.name}, still PNG`} />
                  <figcaption>
                    <b>{st.name}</b>
                    <a href={`/kyllm/motion/kyllm-${st.id}.webp`} download>.webp</a>
                    <a href={`/kyllm/motion/kyllm-${st.id}.png`} download>.png</a>
                  </figcaption>
                </figure>
              ))}
            </div>
            <ul className={s.files}>
              {FILES.map((f) => (
                <li key={f.path}>
                  <code>{f.path}</code>
                  <span>{f.use}</span>
                </li>
              ))}
            </ul>
            <pre className={s.code}>{`import { Kyllm } from "@/app/_brand/kyllm/Kyllm";

<Kyllm state={streaming ? "read" : "idle"} size={36} />
<Kyllm variant="full" state="answered" size={240} />`}</pre>
          </Row>
        </Frame>
      </main>
    </BrandRoot>
  );
}

function Chat() {
  const [state, setState] = useState<KyllmState>("idle");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);
  const thread = useRef<HTMLDivElement>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  function play() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMsgs([]);
    setState("idle");
    setPlaying(true);
    let t = 0;
    SCRIPT.forEach(([delay, next, msg], i) => {
      t += delay;
      timers.current.push(
        window.setTimeout(() => {
          setState(next);
          if (msg) {
            setMsgs((m) => {
              // A Kyllm message with text fills in the "Reading" placeholder before it.
              const last = m[m.length - 1];
              if (msg.who === "kyllm" && msg.text && last?.who === "kyllm" && !last.text) return [...m.slice(0, -1), msg];
              return [...m, msg];
            });
          }
          if (i === SCRIPT.length - 1) setPlaying(false);
        }, t),
      );
    });
  }

  const lastKyllm = msgs.map((m) => m.who).lastIndexOf("kyllm");
  return (
    <div className={s.chat}>
      <div className={s.chatHead}>
        <Kyllm state={state} size={34} />
        <b>KYLLM</b>
        <span>Answers from Kyle&apos;s CV</span>
        <button type="button" className={s.playBtn} onClick={play} disabled={playing}>
          {playing ? "Playing" : msgs.length ? "Play Again" : "Play Conversation"}
        </button>
      </div>
      <div className={s.thread} ref={thread}>
        {msgs.length === 0 ? <p className={s.empty}>Press Play Conversation to watch KYLLM move through a short chat.</p> : null}
        {msgs.map((m, i) =>
          m.who === "user" ? (
            <div key={i} className={s.user}>{m.text}</div>
          ) : (
            <div key={i} className={s.answer}>
              <Kyllm state={i === lastKyllm ? state : "idle"} size={36} />
              <div>
                {m.meta ? <div className={s.meta}>{m.meta}</div> : null}
                {m.text}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
