"use client";

import { useId, useRef } from "react";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { useGSAP } from "@gsap/react";
import { AVATAR, FULL } from "../../../_brand/kyllm/rig";
import { RIG } from "../../../_brand/kyllm/rig-data";
import type { KyllmState } from "../../../_brand/kyllm/Kyllm";

gsap.registerPlugin(useGSAP, MorphSVGPlugin);

/**
 * Exploration: the same KYLLM rig driven by GSAP. Same parts and measured
 * poses as the CSS and Motion versions; GSAP tweens each part to its pose
 * with eased curves, MorphSVG morphs the eye outlines into one another, and
 * repeating tweens carry the idle life (sway, breath, random blinks, scan).
 * A state change mid-move starts a fresh tween from wherever the part is, so
 * nothing jumps, but the new tween starts from rest rather than carrying
 * the old one's speed the way a spring does.
 */
type Pts = readonly (readonly [number, number])[];
const S = RIG.states;
const toD = (p: Pts) => "M" + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L") + " Z";
const at = (p: readonly number[]) => `${p[0]} ${p[1]}`;

export function KyllmGsap({ state = "idle", variant = "avatar", size = 36, gaze = true }: {
  state?: KyllmState;
  variant?: "avatar" | "full";
  size?: number;
  gaze?: boolean;
}) {
  const clip = `kg-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const root = useRef<SVGSVGElement>(null);
  const prev = useRef<KyllmState | null>(null);

  // Idle life, set up once: breath, random blinks, and the pointer gaze.
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const q = gsap.utils.selector(root);
    gsap.fromTo(q(".g-breath"), { scaleY: 1, scaleX: 1 }, { scaleY: 1.008, scaleX: 0.995, svgOrigin: at(RIG.floor), duration: 1.9, ease: "sine.inOut", yoyo: true, repeat: -1 });
    const blink = () => {
      gsap.timeline()
        .to(q(".g-blink"), { scaleY: 0.12, transformOrigin: "50% 50%", duration: 0.07, ease: "power1.in" })
        .to(q(".g-blink"), { scaleY: 1, duration: 0.1, ease: "power1.out" });
      if (Math.random() < 0.25) gsap.delayedCall(0.22, () => {
        gsap.timeline().to(q(".g-blink"), { scaleY: 0.12, duration: 0.07 }).to(q(".g-blink"), { scaleY: 1, duration: 0.1 });
      });
      gsap.delayedCall(2.2 + Math.random() * 3.8, blink);
    };
    gsap.delayedCall(1.5, blink);
    if (!gaze) return;
    const gx = gsap.quickTo(q(".g-gaze"), "x", { duration: 0.5, ease: "power3.out" });
    const gy = gsap.quickTo(q(".g-gaze"), "y", { duration: 0.5, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const svg = root.current;
      if (!svg) return;
      const looking = svg.dataset.state === "idle" || svg.dataset.state === "curious";
      const r = svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = looking ? Math.min(1, d / 400) : 0;
      gx((dx / d) * 16 * k);
      gy((dy / d) * 12 * k);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, { scope: root });

  // Each state: tween every part to its pose; morph the eyes; restart the
  // state's loops (leaf sway speed, the reading scan); hop into "answered".
  useGSAP(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = gsap.utils.selector(root);
    const p = S[state];
    const d = (s: number) => (reduce ? 0 : s);
    const back = { ease: "back.out(1.6)", overwrite: "auto" as const };
    gsap.to(q(".g-glasses"), { x: p.glasses[0], y: p.glasses[1], duration: d(0.5), ...back });
    gsap.to(q(".g-ear-l"), { rotation: p.ears[0], svgOrigin: at(RIG.ears[0].base), duration: d(0.5), ...back });
    gsap.to(q(".g-ear-r"), { rotation: p.ears[1], svgOrigin: at(RIG.ears[1].base), duration: d(0.5), ...back });
    gsap.to(q(".g-leaf"), { rotation: p.leaf, svgOrigin: at(RIG.leaf.base), duration: d(0.5), ...back });
    gsap.to(q(".g-pose"), { rotation: p.tilt, y: p.sink, svgOrigin: at(RIG.floor), duration: d(0.5), ...back });
    gsap.to(q(".g-eye-l"), { morphSVG: toD(p.eyes[0]), duration: d(0.45), ease: "back.out(1.4)", overwrite: true });
    gsap.to(q(".g-eye-r"), { morphSVG: toD(p.eyes[1]), duration: d(0.45), ease: "back.out(1.4)", overwrite: true });
    if (reduce) return;
    const sway = state === "think" ? 1.2 : 2.4;
    const amp = state === "idle" || state === "think" ? 1 : 0.4;
    gsap.fromTo(q(".g-sway"), { rotation: -3 * amp }, { rotation: 4 * amp, svgOrigin: at(RIG.leaf.base), duration: sway, ease: "sine.inOut", yoyo: true, repeat: -1, overwrite: true });
    if (state === "read") gsap.fromTo(q(".g-scan"), { x: -10 }, { x: 10, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: -1, overwrite: true });
    else gsap.to(q(".g-scan"), { x: 0, duration: 0.3, overwrite: true });
    if (state === "answered" && prev.current !== null && prev.current !== "answered") {
      gsap.timeline({ defaults: { svgOrigin: at(RIG.floor) } })
        .to(q(".g-hop"), { y: -38, scaleY: 1.04, scaleX: 0.98, duration: 0.22, ease: "power2.out" })
        .to(q(".g-hop"), { y: 0, scaleY: 0.93, scaleX: 1.05, duration: 0.18, ease: "power2.in" })
        .to(q(".g-hop"), { y: -8, scaleY: 1.01, scaleX: 1, duration: 0.14, ease: "power1.out" })
        .to(q(".g-hop"), { y: 0, scaleY: 1, scaleX: 1, duration: 0.2, ease: "bounce.out" });
      gsap.timeline({ defaults: { svgOrigin: at(RIG.ears[0].base) } })
        .to(q(".g-flick"), { rotation: -6, duration: 0.25 }).to(q(".g-flick"), { rotation: 0, duration: 0.35 });
    }
    prev.current = state;
  }, { scope: root, dependencies: [state] });

  const avatar = variant === "avatar";
  const C = RIG.colors;
  const body = (
    <g className="g-pose">
      <g className="g-hop">
        <g className="g-breath">
          <g className="g-flick"><path className="g-ear-l" d={RIG.ears[0].d} fill={C.body} /></g>
          <path className="g-ear-r" d={RIG.ears[1].d} fill={C.body} />
          <path d={RIG.bean} fill={C.body} />
          <g className="g-leaf"><path className="g-sway" d={RIG.leaf.d} fill={C.leaf} /></g>
          <g className="g-gaze">
            <g className="g-scan">
              <g className="g-blink"><path className="g-eye-l" d={toD(S.idle.eyes[0])} fill={C.ink} /></g>
              <g className="g-blink"><path className="g-eye-r" d={toD(S.idle.eyes[1])} fill={C.ink} /></g>
            </g>
          </g>
          <g className="g-glasses" dangerouslySetInnerHTML={{ __html: RIG.glasses }} />
        </g>
      </g>
    </g>
  );
  return (
    <svg
      ref={root}
      data-state={state}
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
