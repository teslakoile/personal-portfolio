"use client";

import { useEffect, useId, useRef } from "react";
import { animate, useAnimationFrame, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { AVATAR, FULL } from "../../../_brand/kyllm/rig";
import { RIG } from "../../../_brand/kyllm/rig-data";
import type { KyllmState } from "../../../_brand/kyllm/Kyllm";

/**
 * Exploration: the same KYLLM rig driven by Motion (motion.dev) instead of
 * CSS. Same parts and the same measured poses (app/_brand/kyllm/rig-data.ts);
 * what changes is how it moves:
 *
 *   springs      every part follows a spring, so a state change mid-move
 *                bends the motion toward the new pose instead of restarting
 *   eye shapes   each eye is a 48-point outline blended point by point, so a
 *                capsule eye turns into a happy arc rather than cross-fading
 *   gaze         idle and curious eyes follow the pointer, within the lens
 *   life         blinks at random intervals (sometimes twice), a slow breath,
 *                the occasional ear flick, and a leaf that lags behind the hop
 *
 * prefers-reduced-motion snaps to each pose and drops the idle motion.
 */
type Pts = readonly (readonly [number, number])[];
const SPRING = { stiffness: 260, damping: 18, mass: 0.9 };
const SOFT = { stiffness: 120, damping: 16 };
const S = RIG.states;

const toD = (p: Pts) => "M" + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L") + " Z";

export function KyllmSpring({
  state = "idle",
  variant = "avatar",
  size = 36,
  gaze = true,
}: {
  state?: KyllmState;
  variant?: "avatar" | "full";
  size?: number;
  gaze?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  const clip = `ks-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const svg = useRef<SVGSVGElement>(null);
  const all = useRef<SVGGElement>(null);
  const earL = useRef<SVGPathElement>(null);
  const earR = useRef<SVGPathElement>(null);
  const leaf = useRef<SVGPathElement>(null);
  const glasses = useRef<SVGGElement>(null);
  const eyeL = useRef<SVGPathElement>(null);
  const eyeR = useRef<SVGPathElement>(null);

  const spring = reduce ? { duration: 0 } : SPRING;
  const glassX = useSpring(0, spring), glassY = useSpring(0, spring);
  const earLA = useSpring(0, spring), earRA = useSpring(0, spring);
  const leafA = useSpring(0, SOFT), tilt = useSpring(0, SOFT), sink = useSpring(0, SOFT);
  const gazeX = useSpring(0, SOFT), gazeY = useSpring(0, SOFT);
  const hop = useMotionValue(0), squash = useMotionValue(0), blink = useMotionValue(0), morph = useMotionValue(1);
  const flick = useMotionValue(0);
  const from = useRef<Pts[]>([S.idle.eyes[0], S.idle.eyes[1]]);
  const to = useRef<Pts[]>([S.idle.eyes[0], S.idle.eyes[1]]);
  const shown = useRef<Pts[]>([S.idle.eyes[0], S.idle.eyes[1]]);
  const prev = useRef<KyllmState>(state);

  // A new state: every part springs toward its pose; the eyes blend from
  // wherever they are now. Entering "answered" also hops.
  useEffect(() => {
    const p = S[state];
    glassX.set(p.glasses[0]); glassY.set(p.glasses[1]);
    earLA.set(p.ears[0]); earRA.set(p.ears[1]);
    leafA.set(p.leaf); tilt.set(p.tilt); sink.set(p.sink);
    from.current = shown.current;
    to.current = [p.eyes[0], p.eyes[1]];
    morph.jump(0);
    animate(morph, 1, reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 20 });
    if (state === "answered" && prev.current !== "answered" && !reduce) {
      animate(hop, [0, -38, 0, -8, 0], { duration: 0.75, times: [0, 0.3, 0.55, 0.75, 1], ease: "easeOut" });
      animate(squash, [0, -0.05, 0.08, -0.02, 0], { duration: 0.75, times: [0, 0.3, 0.55, 0.75, 1] });
    }
    prev.current = state;
  }, [state, reduce, glassX, glassY, earLA, earRA, leafA, tilt, sink, morph, hop, squash]);

  // Blinks at random intervals, sometimes a double blink.
  useEffect(() => {
    if (reduce) return;
    let t: number;
    const once = () => animate(blink, [0, 1, 0], { duration: 0.16, ease: "easeInOut" });
    const next = () => {
      t = window.setTimeout(() => {
        once();
        if (Math.random() < 0.25) window.setTimeout(once, 220);
        if (Math.random() < 0.2) animate(flick, [0, 1, 0], { duration: 0.35 });
        next();
      }, 2200 + Math.random() * 3800);
    };
    next();
    return () => clearTimeout(t);
  }, [reduce, blink, flick]);

  // Gaze: the eyes lean toward the pointer, a few pixels inside the lens.
  useEffect(() => {
    if (!gaze || reduce) return;
    const move = (e: PointerEvent) => {
      const r = svg.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 400);
      gazeX.set((dx / d) * 16 * k);
      gazeY.set((dy / d) * 12 * k);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [gaze, reduce, gazeX, gazeY]);

  useAnimationFrame((time) => {
    const t = time / 1000;
    const live = !reduce;
    const [fx, fy] = RIG.floor;
    // Breath: a slow, slight squash and stretch about the floor.
    const breath = live ? Math.sin(t * 1.6) * 0.008 : 0;
    const sq = squash.get() + breath;
    all.current?.setAttribute(
      "transform",
      `translate(0 ${hop.get() + sink.get()}) rotate(${tilt.get()} ${fx} ${fy}) translate(${fx} ${fy}) scale(${1 - sq * 0.6} ${1 + sq}) translate(${-fx} ${-fy})`,
    );
    // Leaf: idle sway, faster while thinking, and it lags behind the hop.
    const swayAmp = !live ? 0 : state === "think" ? 6 : state === "idle" ? 3.5 : 1.5;
    const swaySpeed = state === "think" ? 5.2 : 1.7;
    const lag = live ? -hop.getVelocity() * 0.05 : 0;
    leaf.current?.setAttribute("transform", `rotate(${leafA.get() + Math.sin(t * swaySpeed) * swayAmp + lag} ${RIG.leaf.base[0]} ${RIG.leaf.base[1]})`);
    const f = flick.get() * 7;
    earL.current?.setAttribute("transform", `rotate(${earLA.get() - f} ${RIG.ears[0].base[0]} ${RIG.ears[0].base[1]})`);
    earR.current?.setAttribute("transform", `rotate(${earRA.get()} ${RIG.ears[1].base[0]} ${RIG.ears[1].base[1]})`);
    glasses.current?.setAttribute("transform", `translate(${glassX.get()} ${glassY.get()})`);
    // Eyes: blend the outlines, then add gaze, the reading scan, and the blink.
    const m = morph.get();
    const looks = state === "idle" || state === "curious";
    const gx = looks ? gazeX.get() : 0, gy = looks ? gazeY.get() : 0;
    const scan = live && state === "read" ? Math.sin(t * 2.6) * 10 : 0;
    const b = state === "answered" ? 0 : blink.get();
    shown.current = [0, 1].map((i) => {
      const a = from.current[i], z = to.current[i];
      const pts = a.map(([x, y], j) => [x + (z[j][0] - x) * m, y + (z[j][1] - y) * m] as const);
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const out = pts.map(([x, y]) => [x + gx + scan, cy + (y - cy) * (1 - 0.88 * b) + gy] as const);
      (i === 0 ? eyeL : eyeR).current?.setAttribute("d", toD(out));
      return pts;
    });
  });

  const avatar = variant === "avatar";
  const C = RIG.colors;
  const body = (
    <g ref={all}>
      <path ref={earL} d={RIG.ears[0].d} fill={C.body} />
      <path ref={earR} d={RIG.ears[1].d} fill={C.body} />
      <path d={RIG.bean} fill={C.body} />
      <path ref={leaf} d={RIG.leaf.d} fill={C.leaf} />
      <path ref={eyeL} d={toD(S.idle.eyes[0])} fill={C.ink} />
      <path ref={eyeR} d={toD(S.idle.eyes[1])} fill={C.ink} />
      <g ref={glasses} dangerouslySetInnerHTML={{ __html: RIG.glasses }} />
    </g>
  );
  return (
    <svg
      ref={svg}
      viewBox={avatar ? AVATAR.viewBox : FULL.viewBox}
      width={size}
      height={avatar ? size : Math.round((size * FULL.height) / FULL.width)}
      role="img"
      aria-label="KYLLM"
    >
      {avatar ? (
        <>
          <clipPath id={clip}><circle cx={AVATAR.cx} cy={AVATAR.cy} r={AVATAR.r} /></clipPath>
          <g clipPath={`url(#${clip})`}>
            <circle cx={AVATAR.cx} cy={AVATAR.cy} r={AVATAR.r} fill={AVATAR.bg} />
            {body}
          </g>
        </>
      ) : body}
    </svg>
  );
}
