"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import Link from "next/link";
import { BrandRoot, Frame, Row, SectionHead } from "../../../_brand/kit";
import { Kyllm, KYLLM_STATES, type KyllmState } from "../../../_brand/kyllm/Kyllm";
import { KyllmSpring } from "./KyllmSpring";
import { KyllmGsap } from "./KyllmGsap";
import { KyllmLottie } from "./KyllmLottie";
import { KyllmTuned } from "./KyllmTuned";
import { KyllmCssTuned } from "./KyllmCssTuned";
import s from "../review.module.css";
import c from "./compare.module.css";

const NAMES: Record<KyllmState, string> = {
  idle: "Idle", think: "Thinking", read: "Reading", answered: "Answered", curious: "Curious", sorry: "Can't Answer",
};

const VERSIONS: { name: string; note: string; El: (p: { state: KyllmState; variant?: "avatar" | "full"; size: number }) => ReactElement }[] = [
  { name: "CSS", note: "Fixed curves; eyes cross-fade to arcs; blinks every 4.8s", El: (p) => <Kyllm {...p} /> },
  { name: "Motion", note: "Springs; eyes blend into arcs; gaze, random blinks, breath, leaf lag", El: (p) => <KyllmSpring {...p} /> },
  { name: "GSAP", note: "Eased tweens; MorphSVG eyes; gaze, random blinks, breath, bounce landing", El: (p) => <KyllmGsap {...p} /> },
  { name: "Lottie", note: "Keyed clips; eyes morph; moves between states through idle", El: (p) => <KyllmLottie {...p} /> },
  { name: "CSS + skills", note: "Sampled spring easings; quicker exits; slow, firm Can't Answer; trailing ears and leaf; crouch before the hop", El: (p) => <KyllmCssTuned {...p} /> },
  { name: "Motion + skills", note: "One signature spring; quicker exits; slow, firm Can't Answer; trailing ears and leaf; glasses settle late; eyes travel on arcs; crouch before the hop", El: (p) => <KyllmTuned {...p} /> },
];

/** What the two motion skills in .claude/skills asked for, and where it landed. */
const AUDIT = [
  { rule: "Pick one personality and keep to it", src: "motion-design", before: "Mixed: 0.45 to 0.5s with a strong overshoot", after: "Playful: one spring (0.3s, bounce 0.3) and three durations, 0.2s, 0.3s, 0.6s" },
  { rule: "Entrances 30 to 50% longer than exits", src: "motion-design", before: "Same timing both ways", after: "Back to idle in 0.2s with less bounce" },
  { rule: "Sad or serious takes 600ms or more; errors feel firm", src: "motion-design", before: "Can't Answer bounced like the others", after: "0.6s, no overshoot" },
  { rule: "Anticipation before an action", src: "motion-design", before: "The hop started from rest", after: "A 120ms crouch first" },
  { rule: "Squash and stretch keep their volume", src: "motion-design", before: "Width and height scaled independently", after: "Width is 1 / height" },
  { rule: "Follow-through: children 50 to 150ms behind, softer springs", src: "motion-design", before: "Every part stopped together", after: "Ears and leaf 60ms late on a softer spring; ears flare with the hop" },
  { rule: "Secondary action 50 to 100ms after the primary", src: "motion-design", before: "Glasses moved with the face", after: "Glasses settle 40ms late and dip on landing" },
  { rule: "Arcs, not straight lines", src: "motion-design", before: "Eyes moved in straight lines", after: "Eyes bend up to 8px off the straight path" },
  { rule: "Springs for interruptible motion, set by visualDuration and bounce", src: "motion", before: "Stiffness and damping by hand", after: "visualDuration and bounce throughout" },
  { rule: "CSS springs as sampled linear() easings", src: "motion", before: "One cubic-bezier with overshoot", after: "Spring curves sampled into linear(), per state" },
  { rule: "No allocation inside the frame loop", src: "motion", before: "New arrays every frame", after: "Reused buffers; only the path strings are new" },
];

const LIBS = [
  { name: "CSS (current)", fit: "Transitions and keyframes inside the SVG.", gain: "No library; works in any page that inlines the SVG (about 20 KB gzipped, the markup itself).", cost: "Fixed easing restarts on interrupt; no pointer awareness; eyes can only cross-fade between shapes." },
  { name: "Motion", fit: "React springs and motion values driving the same parts.", gain: "Interruptible springs, eye shapes that blend, gaze, random blinks, secondary motion.", cost: "About 22 KB gzipped for the hooks used, and each KYLLM becomes a client component running a frame loop." },
  { name: "GSAP", fit: "Tween and timeline library; MorphSVG and the other plugins are free since 2025.", gain: "Precise timelines, robust path morphing, gaze and random blinks like Motion.", cost: "About 36 KB gzipped with MorphSVG. A new tween on each change starts from rest, so a quick switch loses the old motion's speed." },
  { name: "Rive", fit: "A dedicated editor with state machines for characters; plays back a .riv file.", gain: "Best-in-class for characters: blended states, bones, mesh deformation, designer-friendly.", cost: "Shapes are rebuilt and animated by hand in the Rive editor, and the runtime is a canvas/WASM player." },
  { name: "Lottie", fit: "Animation as a JSON file of keyed layers, normally exported from After Effects; here built from the rig by lottie.py.", gain: "One portable file that the native Lottie players for iOS and Android can play too; designers can edit it.", cost: "Clips, not states: it moves through idle, snaps if interrupted mid-clip, and can't follow the pointer. About 45 KB gzipped for the player plus 23 KB for the file." },
];

export function Compare() {
  const [state, setState] = useState<KyllmState>("idle");
  const [stress, setStress] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    if (!stress) return;
    const order: KyllmState[] = ["think", "read", "answered", "curious", "sorry", "idle"];
    let i = 0;
    timer.current = window.setInterval(() => setState(order[i++ % order.length]), 280);
    const stop = window.setTimeout(() => { setStress(false); setState("idle"); }, 280 * 12);
    return () => { clearInterval(timer.current); clearTimeout(stop); };
  }, [stress]);

  return (
    <BrandRoot>
      <main className={s.main}>
        <Frame>
          <Row>
            <div className={s.intro}>
              <h1 className={s.title}>KYLLM Motion Libraries</h1>
              <p className={s.lede}>
                The same rig and the same measured poses, moved six ways: plain CSS, Motion (motion.dev), GSAP, Lottie, and the CSS
                and Motion versions reworked with the motion skills. Move your pointer around the page; the Motion and GSAP
                versions follow it. More moves built on Motion + skills are on <Link href="/samples/kyllm/motion/moves">KYLLM Moves</Link>. Back to the <Link href="/samples/kyllm">motion review</Link>.
              </p>
            </div>
          </Row>

          <Row>
            <SectionHead num="01" title="Side by Side" note="All six follow the same state. Try Rapid Switching to see how each handles an interrupt." />
            <div className={c.controls}>
              {KYLLM_STATES.map((id) => (
                <button key={id} type="button" className={c.chip} aria-pressed={id === state && !stress} onClick={() => { setStress(false); setState(id); }}>
                  {NAMES[id]}
                </button>
              ))}
              <button type="button" className={c.stress} onClick={() => setStress(true)} disabled={stress}>
                {stress ? "Switching" : "Rapid Switching"}
              </button>
            </div>
            <div className={c.pair}>
              {VERSIONS.map(({ name, note, El }) => (
                <figure key={name} className={c.side}>
                  <El variant="full" state={state} size={240} />
                  <figcaption><b>{name}</b><span>{note}</span></figcaption>
                </figure>
              ))}
            </div>
            <div className={c.sizes}>
              {[96, 48, 36, 28].map((px) => (
                <figure key={px}>
                  <div className={c.duo}>
                    {VERSIONS.map(({ name, El }) => <El key={name} state={state} size={px} />)}
                  </div>
                  <figcaption>{px}px · {VERSIONS.map((v) => v.name).join(", ")}</figcaption>
                </figure>
              ))}
            </div>
          </Row>

          <Row>
            <SectionHead num="02" title="Skill Audit" note="Rules from the two skills in .claude/skills, applied in the two + skills versions above." />
            <div className={c.table}>
              <div className={c.thead}><span>Rule</span><span>Skill</span><span>Before</span><span>After</span></div>
              {AUDIT.map((a) => (
                <div key={a.rule} className={c.trow}>
                  <b>{a.rule}</b><span>{a.src}</span><span>{a.before}</span><span>{a.after}</span>
                </div>
              ))}
            </div>
          </Row>

          <Row>
            <SectionHead num="03" title="Options" note="What each library would change for KYLLM." />
            <div className={c.table}>
              <div className={c.thead}><span>Library</span><span>What it is</span><span>What KYLLM gains</span><span>Cost</span></div>
              {LIBS.map((l) => (
                <div key={l.name} className={c.trow}>
                  <b>{l.name}</b><span>{l.fit}</span><span>{l.gain}</span><span>{l.cost}</span>
                </div>
              ))}
            </div>
          </Row>
        </Frame>
      </main>
    </BrandRoot>
  );
}
