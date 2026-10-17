"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";
import { AVATAR, FULL } from "../../../_brand/kyllm/rig";
import type { KyllmState } from "../../../_brand/kyllm/Kyllm";

/**
 * Exploration: KYLLM as a Lottie animation (public/kyllm/kyllm.lottie.json,
 * built by scripts/kyllm/lottie.py from the same rig), played with
 * lottie-web's light SVG player.
 *
 * Lottie plays clips, not states. To change state the player backs out of
 * the current state's enter clip to idle, then plays the next state's enter
 * clip, then its loop. A change that lands mid-clip snaps to the end of that
 * clip first: Lottie has no way to blend from wherever it is.
 */
type Seg = [number, number];
let data: Promise<{ markers: { tm: number; cm: string; dr: number }[] }> | null = null;
const load = () => (data ??= fetch("/kyllm/kyllm.lottie.json").then((r) => r.json()));
const LOOPS = new Set<KyllmState>(["idle", "think", "read"]);

export function KyllmLottie({ state = "idle", variant = "avatar", size = 36 }: {
  state?: KyllmState;
  variant?: "avatar" | "full";
  size?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationItem | null>(null);
  const clips = useRef<Record<string, Seg>>({});
  const settled = useRef<KyllmState>("idle");
  const queue = useRef<{ seg: Seg; loop: boolean }[]>([]);
  const target = useRef(state);

  function next() {
    const a = anim.current, step = queue.current.shift();
    if (!a || !step) return;
    a.loop = step.loop;
    a.playSegments(step.seg, true);
  }

  function go(to: KyllmState) {
    const a = anim.current, c = clips.current;
    if (!a) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      a.goToAndStop(LOOPS.has(to) ? c[`loop_${to}`][0] : c[`enter_${to}`][1], true);
      settled.current = to;
      return;
    }
    // Mid-clip: snap to the end of what was playing (Lottie can't blend).
    if (!a.isPaused && queue.current.length) a.goToAndStop(a.totalFrames - 1);
    const from = settled.current, q: { seg: Seg; loop: boolean }[] = [];
    if (from !== "idle") q.push({ seg: [c[`enter_${from}`][1], c[`enter_${from}`][0]], loop: false });
    if (to !== "idle") q.push({ seg: c[`enter_${to}`], loop: false });
    if (LOOPS.has(to)) q.push({ seg: c[`loop_${to}`], loop: true });
    queue.current = q;
    settled.current = to;
    next();
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ default: lottie }, json] = await Promise.all([import("lottie-web/build/player/lottie_light"), load()]);
      if (!alive || !box.current) return;
      for (const m of json.markers) clips.current[m.cm] = [m.tm, m.tm + m.dr];
      const a = lottie.loadAnimation({ container: box.current, renderer: "svg", loop: false, autoplay: false, animationData: structuredClone(json) });
      a.addEventListener("complete", next);
      anim.current = a;
      settled.current = "idle";
      go(target.current);
    })();
    return () => { alive = false; anim.current?.destroy(); anim.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once; state changes go through the effect below
  }, []);

  useEffect(() => {
    target.current = state;
    go(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- go reads refs only
  }, [state]);

  // The avatar shows the same circle of the comp as the other versions.
  const [vx, vy, vw] = AVATAR.viewBox.split(" ").map(Number);
  const inner = (size * FULL.width) / vw;
  if (variant === "full") {
    return <div ref={box} role="img" aria-label="KYLLM" style={{ width: size, height: (size * FULL.height) / FULL.width }} />;
  }
  return (
    <div role="img" aria-label="KYLLM" style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: AVATAR.bg, position: "relative", flex: "none" }}>
      <div ref={box} style={{ position: "absolute", width: inner, height: inner, left: (-vx * size) / vw, top: (-vy * size) / vw }} />
    </div>
  );
}
