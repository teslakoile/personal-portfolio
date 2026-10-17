"use client";

import { useEffect, useId, useImperativeHandle, useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type Ref } from "react";
import { animate, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, type MotionValue, type Transition } from "motion/react";
import { AVATAR, FULL } from "../../../_brand/kyllm/rig";
import { RIG } from "../../../_brand/kyllm/rig-data";
import type { KyllmState } from "../../../_brand/kyllm/Kyllm";

/**
 * Exploration: the Motion version reworked with the two motion skills in
 * .claude/skills (motion: Motion's own best practices; motion-design:
 * LottieFiles' principles). What changed from KyllmSpring, and which rule
 * asked for it:
 *
 *   personality   Playful archetype: one signature spring (bounce 0.3) and a
 *                 three-step duration palette, 0.2s / 0.3s / 0.6s
 *   enter > exit  back to idle is quicker and calmer (0.2s, bounce 0.15)
 *   timing        "Can't answer" is slow and firm: 0.6s, no overshoot
 *   anticipation  the hop crouches first (120ms, squash and down 4px)
 *   squash        squash and stretch keep their volume (width = 1 / height)
 *   follow through ears and leaf trail the body on softer springs, 60ms late
 *   secondary     the glasses settle 40ms after the face and dip on landing
 *   arcs          eyes travel on a slight curve, not a straight line
 *   springs       springs set by visualDuration and bounce, as Motion advises
 *   performance   no allocation in the frame loop except the path strings
 *
 * On top of the six chat states it has three more moods (listen, speak,
 * doze), one-shot moves played through a ref (`play("nod")`), and touch:
 * hover to pet, click or Enter to boop. Moves start from wherever each part
 * is (a `null` first keyframe), so a move can interrupt another.
 */
type Pts = readonly (readonly [number, number])[];
type Shape = "wide" | "happy" | "closed";
type Pose = {
  eyes: readonly Pts[]; glasses: readonly number[]; ears: readonly number[]; leaf: number; tilt: number; sink: number;
  /** An eye shape blended over the pose's own eyes, and how far (0 to 1). */
  over?: Shape; amt?: number;
  /** Where the eyes look, -1 to 1 on each axis. */
  look?: readonly [number, number];
  /** Breath depth and rate (radians per second); leaf sway in degrees and rate. */
  breath?: readonly [number, number]; sway: readonly [number, number];
};
export type KyllmMood = KyllmState | "listen" | "speak" | "doze";
export type KyllmMove =
  | "popIn" | "peek" | "dipAway"
  | "nod" | "shake" | "glasses" | "twitch" | "startle" | "wiggle" | "celebrate"
  | "boop" | "ping";
export type KyllmHandle = { play: (move: KyllmMove) => void };

const S = RIG.states;
const N = S.idle.eyes[0].length;
const ys = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, i) => i % 2);
/** Closed eyes: the happy arcs turned upside down, set a little lower. */
const flip = (p: Pts): Pts => {
  const cy = p.reduce((s, [, y]) => s + y, 0) / p.length;
  return p.map(([x, y]) => [x, 2 * cy - y + 8] as const);
};
const SHAPES: Record<Shape, readonly Pts[]> = {
  wide: [S.curious.eyes[0], S.curious.eyes[1]],
  happy: [S.answered.eyes[0], S.answered.eyes[1]],
  closed: [flip(S.answered.eyes[0]), flip(S.answered.eyes[1])],
};
const BREATH = [0.006, 1.6] as const;
const MOODS: Record<KyllmMood, Pose> = {
  idle: { ...S.idle, sway: [3.5, 1.7] },
  think: { ...S.think, sway: [6, 5.2] },
  read: { ...S.read, sway: [1.2, 1.7] },
  answered: { ...S.answered, sway: [1.2, 1.7] },
  curious: { ...S.curious, sway: [1.2, 1.7] },
  sorry: { ...S.sorry, sway: [1.2, 1.7] },
  // Ears and leaf perk up, eyes a third of the way to wide, looking down at the input.
  listen: { ...S.idle, ears: [7, -7], leaf: 6, tilt: -2, over: "wide", amt: 0.35, look: [-0.4, 0.9], sway: [2.5, 2.2] },
  // Looks across at the reply as it streams in; each chunk bobs (play("ping")).
  speak: { ...S.idle, tilt: 2, look: [0.8, 0.1], sway: [2, 1.7] },
  // Eyes shut, ears and leaf droop, glasses slip, a slow deep breath (3.3s).
  doze: { ...S.idle, glasses: [0, 9], ears: [-9, 9], leaf: -12, tilt: 3, sink: 8, over: "closed", amt: 1, breath: [0.018, 1.9], sway: [1.5, 0.9] },
};
/** Where the body disappears: the avatar circle's bottom, or just under the floor. */
const EDGE = { avatar: AVATAR.cy + AVATAR.r, full: RIG.floor[1] + 16 };
const TOP = Math.min(...ys(RIG.leaf.d), ...ys(RIG.ears[0].d), ...ys(RIG.ears[1].d));
const EYE_LOW = Math.max(...S.idle.eyes.flat().map(([, y]) => y));
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function KyllmTuned({ state = "idle", variant = "avatar", size = 36, gaze = true, look, touch = false, ref }: {
  state?: KyllmMood;
  variant?: "avatar" | "full";
  size?: number;
  gaze?: boolean;
  /** Overrides where the eyes look, -1 to 1 on each axis. */
  look?: readonly [number, number] | null;
  /** Hover to pet; click, tap, or Enter to boop. */
  touch?: boolean;
  ref?: Ref<KyllmHandle>;
}) {
  const reduce = useReducedMotion() ?? false;
  const clip = `kt-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const svg = useRef<SVGSVGElement>(null);
  const all = useRef<SVGGElement>(null);
  const earL = useRef<SVGPathElement>(null);
  const earR = useRef<SVGPathElement>(null);
  const leaf = useRef<SVGPathElement>(null);
  const glasses = useRef<SVGGElement>(null);
  const eyeL = useRef<SVGPathElement>(null);
  const eyeR = useRef<SVGPathElement>(null);

  // Pose values: each state springs these.
  const glassX = useMotionValue(0), glassY = useMotionValue(0);
  const earLA = useMotionValue(0), earRA = useMotionValue(0), leafA = useMotionValue(0);
  const tilt = useMotionValue(0), sink = useMotionValue(0);
  const morph = useMotionValue(1), moodOver = useMotionValue(0);
  const breathAmp = useMotionValue<number>(BREATH[0]), breathRate = useMotionValue<number>(BREATH[1]);
  const swayAmp = useMotionValue(3.5), swayRate = useMotionValue(1.7), scanAmp = useMotionValue(0);
  // Move values: added on top of the pose, and back at rest after each move.
  const hop = useMotionValue(0), lift = useMotionValue(0), squash = useMotionValue(0), rot = useMotionValue(0);
  const grow = useMotionValue(1), alpha = useMotionValue(1);
  const earGL = useMotionValue(0), earGR = useMotionValue(0), leafG = useMotionValue(0), spin = useMotionValue(0);
  const glassG = useMotionValue(0), faceX = useMotionValue(0), faceY = useMotionValue(0);
  const blink = useMotionValue(0), close = useMotionValue(0), gestOver = useMotionValue(0), pet = useMotionValue(0);
  const gazeX = useSpring(0, { visualDuration: 0.35, bounce: 0.1 }), gazeY = useSpring(0, { visualDuration: 0.35, bounce: 0.1 });

  const from = useRef<Pts[]>([S.idle.eyes[0], S.idle.eyes[1]]);
  const to = useRef<Pts[]>([S.idle.eyes[0], S.idle.eyes[1]]);
  const moodShape = useRef<Shape | null>(null);
  const gestShape = useRef<Shape | null>(null);
  // Per-frame work stays in these buffers: the pose's eyes, then the eyes with moves on top.
  const buf = useRef([new Float64Array(N * 2), new Float64Array(N * 2)]);
  const fin = useRef([new Float64Array(N * 2), new Float64Array(N * 2)]);
  // Breath and sway phases accumulate, so a change of rate never jumps.
  const phase = useRef(new Float64Array(2));
  const side = useRef(0);
  const looking = useRef(true);
  const prev = useRef<KyllmMood>(state);
  const now = useRef<KyllmMood>(state);

  const spring = (visualDuration: number, bounce: number, delay = 0) =>
    reduce ? { duration: 0 } : { type: "spring" as const, visualDuration, bounce, delay };

  useEffect(() => {
    const p = MOODS[state], was = prev.current;
    now.current = state;
    const toIdle = state === "idle", sad = state === "sorry", calm = state === "doze";
    const waking = was === "doze" && !calm;
    // Calm and sad states are slow with no overshoot; waking up takes its time too.
    const main = calm ? spring(0.9, 0) : sad ? spring(0.6, 0) : waking ? spring(0.5, 0.2) : toIdle ? spring(0.2, 0.15) : spring(0.3, 0.3);
    const trail = calm ? spring(1.1, 0, 0.1) : sad ? spring(0.7, 0, 0.06) : waking ? spring(0.6, 0.3, 0.08) : toIdle ? spring(0.28, 0.2, 0.04) : spring(0.45, 0.4, 0.06);
    const late = calm ? spring(1, 0, 0.08) : sad ? spring(0.6, 0, 0.04) : waking ? spring(0.5, 0.2, 0.04) : toIdle ? spring(0.2, 0.15, 0.04) : spring(0.3, 0.3, 0.04);
    const eyes = calm ? spring(0.9, 0) : sad ? spring(0.6, 0) : waking ? spring(0.45, 0.1) : toIdle ? spring(0.2, 0.1) : spring(0.3, 0.25);
    animate(tilt, p.tilt, main);
    animate(sink, p.sink, main);
    animate(glassX, p.glasses[0], late);
    animate(glassY, p.glasses[1], late);
    animate(earLA, p.ears[0], trail);
    animate(earRA, p.ears[1], trail);
    animate(leafA, p.leaf, trail);
    const amb = spring(0.8, 0);
    animate(breathAmp, (p.breath ?? BREATH)[0], amb);
    animate(breathRate, (p.breath ?? BREATH)[1], amb);
    animate(swayAmp, p.sway[0], amb);
    animate(swayRate, p.sway[1], amb);
    animate(scanAmp, state === "read" ? 10 : 0, spring(0.4, 0));
    // Eyes blend from wherever they are now, mood shape included.
    const b = buf.current;
    from.current = [0, 1].map((i) => Array.from({ length: N }, (_, j) => [b[i][2 * j], b[i][2 * j + 1]] as const));
    if (!b[0][0]) from.current = [MOODS[was].eyes[0], MOODS[was].eyes[1]];
    to.current = [p.eyes[0], p.eyes[1]];
    moodShape.current = p.over ?? null;
    morph.jump(0);
    moodOver.jump(0);
    animate(morph, 1, eyes);
    animate(moodOver, p.amt ?? 0, eyes);
    if (state === "answered" && was !== "answered" && !reduce) {
      // Anticipation (crouch), take-off, landing squash, a small rebound.
      const times = [0, 0.16, 0.42, 0.62, 0.76, 1];
      animate(hop, [null, 4, -40, 0, -6, 0], { duration: 0.75, times, ease: ["easeOut", "easeOut", "easeIn", "easeOut", "easeIn"] });
      animate(squash, [null, -0.06, 0.05, -0.09, 0.01, 0], { duration: 0.75, times });
      animate(glassG, [null, 0, 0, 6, -2, 0], { duration: 0.8, times: [0, 0.16, 0.6, 0.72, 0.86, 1] });
    }
    if (waking && !reduce) {
      // A slow stretch, then the ears come up.
      animate(squash, [null, 0.07, -0.02, 0], { duration: 0.9, times: [0, 0.45, 0.8, 1], ease: "easeInOut" });
      animate(earGL, [null, 6, 0], { duration: 0.6, delay: 0.3 });
      animate(earGR, [null, -6, 0], { duration: 0.6, delay: 0.3 });
    }
    prev.current = state;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- motion values are stable; spring reads reduce
  }, [state, reduce]);

  // Gaze: a mood or the look prop can aim the eyes; idle and curious follow the pointer.
  const lx = look?.[0], ly = look?.[1];
  useEffect(() => {
    const l = lx !== undefined && ly !== undefined ? [lx, ly] : MOODS[state].look;
    looking.current = !l && (state === "idle" || state === "curious");
    if (l) { gazeX.set(l[0] * 16); gazeY.set(l[1] * 12); }
    else if (!looking.current) { gazeX.set(0); gazeY.set(0); }
  }, [lx, ly, state, gazeX, gazeY]);

  // Blinks at random intervals, sometimes twice; quick (0.16s), as micro-feedback should be.
  useEffect(() => {
    if (reduce) return;
    let t: number;
    const once = () => animate(blink, [0, 1, 0], { duration: 0.16, ease: "easeInOut" });
    const next = () => {
      t = window.setTimeout(() => {
        if (now.current !== "doze") {
          once();
          if (Math.random() < 0.25) window.setTimeout(once, 220);
        }
        next();
      }, 2200 + Math.random() * 3800);
    };
    next();
    return () => clearTimeout(t);
  }, [reduce, blink]);

  useEffect(() => {
    if (!gaze || reduce) return;
    const move = (e: PointerEvent) => {
      const r = svg.current?.getBoundingClientRect();
      if (!r || !looking.current) return;
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 400);
      gazeX.set((dx / d) * 16 * k);
      gazeY.set((dy / d) * 12 * k);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [gaze, reduce, gazeX, gazeY]);

  /** One-shot moves. Each keyframe list starts at null: from wherever the part is now. */
  function play(move: KyllmMove) {
    if (reduce) return;
    type Opts = { times?: number[]; ease?: Transition["ease"]; delay?: number };
    const k = (mv: MotionValue<number>, v: (number | null)[], duration: number, o: Opts = {}) => animate(mv, v as number[], { duration, ...o });
    const shape = (s: Shape, v: (number | null)[], duration: number, o: Opts = {}) => { gestShape.current = s; k(gestOver, v, duration, o); };
    const edge = variant === "avatar" ? EDGE.avatar : EDGE.full;
    switch (move) {
      case "popIn": {
        // Emergent entrance, Playful: from 75% scale and 30 below, 10-15% overshoot, about 0.4s.
        // Assembled: body first, ears and leaf 60-80ms after, glasses drop on at 100ms, eyes open last.
        alpha.jump(0); grow.jump(0.75); lift.jump(30); earGL.jump(-18); earGR.jump(18); leafG.jump(-25); glassG.jump(-40); close.jump(1);
        animate(alpha, 1, { duration: 0.12, ease: "easeOut" });
        animate(grow, 1, spring(0.35, 0.35));
        animate(lift, 0, spring(0.35, 0.3));
        animate(earGL, 0, spring(0.45, 0.4, 0.06));
        animate(earGR, 0, spring(0.45, 0.4, 0.06));
        animate(leafG, 0, spring(0.5, 0.45, 0.08));
        animate(glassG, 0, spring(0.3, 0.4, 0.1));
        animate(close, 0, { duration: 0.12, delay: 0.2, ease: "easeOut" });
        break;
      }
      case "dipAway": {
        // Exit at about 70% of the entrance (0.28s), ease-in: a small lift, then down and out.
        k(lift, [null, -6, 60], 0.28, { times: [0, 0.3, 1], ease: ["easeOut", "easeIn"] });
        k(grow, [null, 1.02, 0.85], 0.28, { times: [0, 0.3, 1], ease: ["easeOut", "easeIn"] });
        k(alpha, [null, 1, 0], 0.28, { times: [0, 0.45, 1], ease: "easeIn" });
        k(earGL, [null, -14], 0.2, { ease: "easeIn" });
        k(earGR, [null, 14], 0.2, { ease: "easeIn" });
        k(close, [null, 0.6], 0.2, { ease: "easeIn" });
        break;
      }
      case "peek": {
        // Rises until the eyes clear the edge, looks left and right, dips (anticipation), pops up.
        const hidden = edge - TOP + 20, peek = edge - 24 - EYE_LOW;
        alpha.jump(1); grow.jump(1); close.jump(0); earGL.jump(0); earGR.jump(0);
        k(lift, [hidden, peek, peek, peek + 14, -18, 0], 1.8,
          { times: [0, 0.22, 0.72, 0.8, 0.9, 1], ease: ["easeOut", "linear", "easeInOut", "easeOut", "easeInOut"] });
        k(faceX, [null, 0, -12, -12, 12, 12, 0], 1.8, { times: [0, 0.24, 0.32, 0.44, 0.54, 0.64, 0.72], ease: "easeInOut" });
        break;
      }
      case "nod": {
        // Two nods, the second smaller; glasses lag 40ms, ears tip 60ms behind.
        const times = [0, 0.22, 0.5, 0.72, 1];
        k(faceY, [null, 12, 0, 8, 0], 0.6, { times, ease: "easeInOut" });
        k(glassG, [null, 6, 0, 4, 0], 0.6, { times, ease: "easeInOut", delay: 0.04 });
        k(squash, [null, -0.025, 0, -0.015, 0], 0.6, { times, ease: "easeInOut" });
        k(earGL, [null, 4, 0, 3, 0], 0.6, { times, ease: "easeInOut", delay: 0.06 });
        k(earGR, [null, -4, 0, -3, 0], 0.6, { times, ease: "easeInOut", delay: 0.06 });
        break;
      }
      case "shake": {
        // Error shake: 2-3 cycles, shrinking, 0.45s, no overshoot, settles where it started.
        // The face turns further than the body; the leaf swings the other way, 60ms late.
        k(rot, [null, -6, 5, -3, 1.5, 0], 0.45, { ease: "easeInOut" });
        k(faceX, [null, -10, 8, -5, 2, 0], 0.45, { ease: "easeInOut" });
        k(leafG, [null, 8, -7, 4, -2, 0], 0.5, { ease: "easeInOut", delay: 0.06 });
        k(earGL, [null, 3, -3, 2, -1, 0], 0.5, { ease: "easeInOut", delay: 0.05 });
        k(earGR, [null, 3, -3, 2, -1, 0], 0.5, { ease: "easeInOut", delay: 0.05 });
        break;
      }
      case "glasses": {
        // Glasses slide down under gravity (ease-in), hold, dip a little more (anticipation),
        // snap back up past home, settle. The eyes squint and the ears twitch on the push.
        const times = [0, 0.45, 0.6, 0.68, 0.8, 1];
        k(glassG, [null, 18, 18, 21, -6, 0], 1.1, { times, ease: ["easeIn", "linear", "easeOut", "easeOut", "easeInOut"] });
        k(close, [null, 0, 0.45, 0.1, 0], 1.1, { times: [0, 0.6, 0.7, 0.85, 1] });
        k(faceY, [null, 0, -4, 0], 1.1, { times: [0, 0.66, 0.74, 1], ease: "easeInOut" });
        k(earGL, [null, 0, -8, 0], 1.1, { times: [0, 0.66, 0.72, 0.9] });
        k(earGR, [null, 0, 8, 0], 1.1, { times: [0, 0.68, 0.74, 0.92] });
        break;
      }
      case "twitch": {
        // One ear, twice, fast (urgent: 100-150ms a flick); the leaf answers 80ms later.
        k(earGL, [null, -14, 0, -9, 0], 0.42, { times: [0, 0.18, 0.45, 0.62, 1], ease: "easeOut" });
        k(leafG, [null, 3, 0], 0.4, { delay: 0.08, ease: "easeInOut" });
        break;
      }
      case "startle": {
        // Surprise: a sudden jump with an expo-like ease-out (circOut), stretched on the way up;
        // ears snap up, eyes go wide, glasses jump 40ms late, the leaf whips 60ms late.
        const times = [0, 0.25, 0.6, 0.8, 1];
        k(lift, [null, -26, 0, -4, 0], 0.7, { times, ease: ["circOut", "easeIn", "easeOut", "easeIn"] });
        k(squash, [null, 0.08, -0.06, 0.01, 0], 0.7, { times });
        k(earGL, [null, 10, 10, 0], 0.8, { times: [0, 0.15, 0.6, 1] });
        k(earGR, [null, -10, -10, 0], 0.8, { times: [0, 0.15, 0.6, 1] });
        k(glassG, [null, -12, 3, 0], 0.7, { times: [0, 0.25, 0.6, 1], delay: 0.04 });
        k(leafG, [null, -14, 6, 0], 0.7, { delay: 0.06 });
        shape("wide", [null, 1, 1, 0], 0.9, { times: [0, 0.12, 0.6, 1] });
        break;
      }
      case "wiggle": {
        // A happy side-to-side, bouncy, with happy eyes; the leaf lags the other way.
        k(rot, [null, 7, -7, 5, -3, 0], 0.75, { ease: "easeInOut" });
        k(lift, [null, -5, 0, -5, 0, -2, 0], 0.75, { ease: "easeInOut" });
        k(leafG, [null, -9, 9, -6, 3, 0], 0.8, { ease: "easeInOut", delay: 0.06 });
        k(earGL, [null, -4, 4, -3, 0], 0.8, { ease: "easeInOut", delay: 0.05 });
        k(earGR, [null, -4, 4, -3, 0], 0.8, { ease: "easeInOut", delay: 0.05 });
        shape("happy", [null, 1, 1, 0], 0.95, { times: [0, 0.15, 0.8, 1] });
        break;
      }
      case "celebrate": {
        // Two hops (the second lower), squash and stretch up to 10% (Playful exaggeration),
        // the leaf spins a full turn on the first hop, glasses dip on each landing.
        const times = [0, 0.1, 0.3, 0.44, 0.5, 0.66, 0.78, 0.88, 1];
        k(hop, [null, 5, -46, 0, 4, -30, 0, -5, 0], 1.3, { times, ease: ["easeOut", "easeOut", "easeIn", "easeOut", "easeOut", "easeIn", "easeOut", "easeIn"] });
        k(squash, [null, -0.08, 0.06, -0.1, -0.05, 0.05, -0.08, 0.01, 0], 1.3, { times });
        k(glassG, [null, 0, 0, 7, 0, 0, 6, 0, 0], 1.3, { times, delay: 0.04 });
        animate(spin, [0, 360], { duration: 0.5, delay: 0.13, ease: "easeInOut", onComplete: () => spin.jump(0) });
        shape("happy", [null, 1, 1, 0], 1.4, { times: [0, 0.1, 0.85, 1] });
        break;
      }
      case "boop": {
        // Playful press: squash 10% (60ms), overshoot (80ms), settle (120ms). Eyes squeeze shut;
        // ears fold and spring back; glasses bounce 40ms late; the leaf boings 50ms late.
        k(squash, [null, -0.1, 0.06, 0], 0.28, { times: [0, 0.23, 0.54, 1], ease: ["easeOut", "easeOut", "easeInOut"] });
        k(close, [null, 0.9, 0], 0.3, { times: [0, 0.25, 1] });
        k(earGL, [null, -10, 4, 0], 0.4, { delay: 0.02 });
        k(earGR, [null, 10, -4, 0], 0.4, { delay: 0.02 });
        k(glassG, [null, 6, -2, 0], 0.35, { delay: 0.04 });
        k(leafG, [null, -10, 6, 0], 0.45, { delay: 0.05 });
        break;
      }
      case "ping": {
        // A small beat for each keystroke (listen) or streamed chunk (speak).
        if (now.current === "speak") {
          k(squash, [null, -0.03, 0.015, 0], 0.2, { times: [0, 0.3, 0.65, 1] });
          k(faceY, [null, 2, 0], 0.2);
          k(leafG, [null, 2, 0], 0.25, { delay: 0.04 });
        } else {
          const ear = Math.random() < 0.5 ? earGL : earGR;
          k(ear, [null, ear === earGL ? 5 : -5, 0], 0.14);
          k(leafG, [null, 2, 0], 0.2, { delay: 0.04 });
        }
        break;
      }
    }
  }
  useImperativeHandle(ref, () => ({ play }));

  const EYES = [eyeL, eyeR];
  useAnimationFrame((time, delta) => {
    const t = time / 1000, dt = Math.min(0.05, delta / 1000), live = !reduce;
    const ph = phase.current;
    ph[0] += dt * breathRate.get();
    ph[1] += dt * swayRate.get();
    const fx = RIG.floor[0], fy = RIG.floor[1];
    // Ambient breath stays within 1% (the skill keeps ambient at 10-20% of primary motion).
    const sy = 1 + squash.get() + (live ? Math.sin(ph[0]) * breathAmp.get() : 0);
    const sx = 1 / sy, g = grow.get();
    const pt = pet.get();
    const a = all.current;
    if (a) {
      a.setAttribute("transform", `translate(0 ${hop.get() + sink.get() + lift.get()}) rotate(${tilt.get() + rot.get() + pt * side.current * 4} ${fx} ${fy}) translate(${fx} ${fy}) scale(${sx * g} ${sy * g}) translate(${-fx} ${-fy})`);
      a.style.opacity = String(alpha.get());
    }
    const v = live ? clamp(hop.getVelocity() + lift.getVelocity(), -600, 600) : 0;
    const sway = live ? Math.sin(ph[1]) * swayAmp.get() : 0;
    leaf.current?.setAttribute("transform", `rotate(${leafA.get() + leafG.get() + spin.get() + sway - v * 0.05} ${RIG.leaf.base[0]} ${RIG.leaf.base[1]})`);
    // Ears flare out as the body rises and fold back as it lands; petting folds them back.
    earL.current?.setAttribute("transform", `rotate(${earLA.get() + earGL.get() - pt * 10 + v * 0.012} ${RIG.ears[0].base[0]} ${RIG.ears[0].base[1]})`);
    earR.current?.setAttribute("transform", `rotate(${earRA.get() + earGR.get() + pt * 10 - v * 0.012} ${RIG.ears[1].base[0]} ${RIG.ears[1].base[1]})`);
    const fX = faceX.get(), fY = faceY.get();
    glasses.current?.setAttribute("transform", `translate(${glassX.get() + fX} ${glassY.get() + glassG.get() + fY})`);

    const m = morph.get(), mo = moodOver.get(), go = gestOver.get();
    const ms = moodShape.current ? SHAPES[moodShape.current] : null;
    const gs = gestShape.current ? SHAPES[gestShape.current] : null;
    const happy = SHAPES.happy;
    const gx = gazeX.get() + fX, gy = gazeY.get() + fY;
    const scan = live ? Math.sin(t * 2.6) * scanAmp.get() : 0;
    // Arc-shaped eyes don't blink.
    const shut = Math.max(pt, gestShape.current === "wide" ? 0 : go, moodShape.current === "wide" ? 0 : mo);
    const bl = Math.max((state === "answered" ? 0 : blink.get()) * (1 - shut), close.get());
    for (let i = 0; i < 2; i++) {
      const fa = from.current[i], z = to.current[i], out = buf.current[i], f = fin.current[i];
      // The eye's travel bends on an arc: up to 8px off the straight line, most at mid-travel.
      let ax = 0, ay = 0, zx = 0, zy = 0;
      for (let j = 0; j < N; j++) { ax += fa[j][0]; ay += fa[j][1]; zx += z[j][0]; zy += z[j][1]; }
      const dx = (zx - ax) / N, dy = (zy - ay) / N, len = Math.hypot(dx, dy) || 1;
      const bend = Math.sin(Math.PI * clamp(m, 0, 1)) * Math.min(8, len * 0.3);
      const ox = (-dy / len) * bend, oy = (dx / len) * bend;
      let cy = 0;
      for (let j = 0; j < N; j++) {
        let x = fa[j][0] + (z[j][0] - fa[j][0]) * m + ox, y = fa[j][1] + (z[j][1] - fa[j][1]) * m + oy;
        if (ms) { x += (ms[i][j][0] - x) * mo; y += (ms[i][j][1] - y) * mo; }
        out[2 * j] = x; out[2 * j + 1] = y;
        if (pt) { x += (happy[i][j][0] - x) * pt; y += (happy[i][j][1] - y) * pt; }
        if (gs && go) { x += (gs[i][j][0] - x) * go; y += (gs[i][j][1] - y) * go; }
        f[2 * j] = x; f[2 * j + 1] = y;
        cy += y;
      }
      cy /= N;
      let d = "M";
      for (let j = 0; j < N; j++) {
        const x = f[2 * j] + gx + scan, y = cy + (f[2 * j + 1] - cy) * (1 - 0.88 * bl) + gy;
        d += `${j ? " L" : ""}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      EYES[i].current?.setAttribute("d", d + " Z");
    }
  });

  // Touch: hover enters quicker than it leaves (polished hover), and leans toward the pointer.
  const onEnter = () => { if (!reduce) animate(pet, 1, spring(0.18, 0.2)); };
  const onLeave = () => animate(pet, 0, spring(0.3, 0.1));
  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    side.current = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play("boop"); }
  };

  const avatar = variant === "avatar";
  const C = RIG.colors;
  const pathOf = (p: Pts) => "M" + p.map(([x, y]) => `${x} ${y}`).join(" L") + " Z";
  const body = (
    <g ref={all}>
      <path ref={earL} d={RIG.ears[0].d} fill={C.body} />
      <path ref={earR} d={RIG.ears[1].d} fill={C.body} />
      <path d={RIG.bean} fill={C.body} />
      <path ref={leaf} d={RIG.leaf.d} fill={C.leaf} />
      <path ref={eyeL} d={pathOf(S.idle.eyes[0])} fill={C.ink} />
      <path ref={eyeR} d={pathOf(S.idle.eyes[1])} fill={C.ink} />
      <g ref={glasses} dangerouslySetInnerHTML={{ __html: RIG.glasses }} />
    </g>
  );
  return (
    <svg ref={svg} viewBox={avatar ? AVATAR.viewBox : FULL.viewBox} width={size}
      height={avatar ? size : Math.round((size * FULL.height) / FULL.width)}
      role={touch ? "button" : "img"} aria-label={touch ? "KYLLM: press to boop" : "KYLLM"} tabIndex={touch ? 0 : undefined}
      onPointerEnter={touch ? onEnter : undefined} onPointerLeave={touch ? onLeave : undefined}
      onPointerMove={touch ? onMove : undefined} onPointerDown={touch ? () => play("boop") : undefined}
      onKeyDown={touch ? onKey : undefined} style={touch ? { cursor: "pointer", touchAction: "manipulation" } : undefined}>
      {avatar ? (
        <>
          <clipPath id={clip}><circle cx={AVATAR.cx} cy={AVATAR.cy} r={AVATAR.r} /></clipPath>
          <g clipPath={`url(#${clip})`}>
            <circle cx={AVATAR.cx} cy={AVATAR.cy} r={AVATAR.r} fill={AVATAR.bg} />
            {body}
          </g>
        </>
      ) : (
        <>
          {/* The floor: Peek Up rises out of it and Dip Away sinks into it. */}
          <clipPath id={clip}><rect x={-512} y={-512} width={2048} height={EDGE.full + 512} /></clipPath>
          <g clipPath={`url(#${clip})`}>{body}</g>
        </>
      )}
    </svg>
  );
}
