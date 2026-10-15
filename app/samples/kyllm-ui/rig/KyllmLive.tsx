"use client";

import { useEffect, useRef } from "react";
import { Kyllm } from "./Kyllm";
import l from "./live.module.css";

/*
 * KYLLM, alive: the rig (Kyllm.tsx) driven by springs every frame, with the
 * numbers of the shipped animated favicon (nice-lalande session:
 * scripts/kyllm/favicon_physics.py BIG, favicon_alive.py BEAT_30,
 * favicon_snappy.py AB) and the motion-design skill's rules.
 *
 *   body   one vertical strain s about the bottom-centre pivot, a spring
 *          (2.5 Hz, damping 0.16) chasing a muscle command u(t); width keeps
 *          the area (sx = 1 / sy), so a crouch squashes and the push
 *          overshoots into a stretch that rings down
 *   leaf   a torsion spring (2.2 Hz, 0.35) at its base, pushed by the body's
 *          acceleration: pressed toward the head at launch, then whipping
 *          back, still swinging after the body settles; stopped at -34 deg so
 *          it never lies on the head; counter-scaled so it never bends
 *   eyes   glances take 180 ms on a minimum-jerk curve, then hold; they
 *          squint with the crouch but never close past 0.75
 *   blink  33 ms half, 67 ms closed, 33 ms half
 *   idle   never fully still: a 2 s drift in the body with the leaf a quarter
 *          period behind, breath pops, glances, and a hop now and then
 *
 *   gaze   the pupils sit on a sphere behind each lens: a look is a gaze
 *          direction (gx, gy in -1..1), and each pupil moves that way and
 *          foreshortens along it (shorter when it looks up or down, thinner
 *          when it looks aside), with a slight tilt on the diagonals, so its
 *          shape always agrees with where it looks
 *
 * Moods follow the chat: idle; typing looks down at the composer and follows
 * the text as it grows; working looks up and
 * ponders with three dots rising in the sky beside it, no bubble; answered (after the stream ends) does the big hop with happy eyes;
 * sorry keeps its ears as drawn and acts with body, leaf, glasses, and eyes, in one of
 * four styles (SorryStyle); hover looks up at the cursor. Each `poke` change fires a small hop. Reduced motion holds each
 * mood's pose, with no motion.
 */

export type Mood = "idle" | "typing" | "working" | "answered" | "sorry" | "hover";
/** How "working" shows: pondering glances beside three rising dots, eyes circling, or the leaf ticking. */
export type WorkStyle = "ponder" | "orbit" | "leaf";
/** How "sorry" shows: a sigh, a head shake, shrinking back sheepishly, or an apologetic bow. Ears never change. */
export type SorryStyle = "sigh" | "shake" | "shrink" | "bow";

type Eye = [tx: number, ty: number, r: number, sx: number, sy: number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
/** minimum jerk, for glances */
const mj = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 - 15 * t + 6 * t * t));

/* Each pupil is a capsule whose long axis is its local x (121 x 63 rig units),
   turned about 81 degrees so it stands upright. Each sits off its lens centre
   (both lean toward the nose), and the lenses differ (the near one is larger).
   Real eyes move together, so a look moves both pupils by the same amount:
   the distance between them never changes (no crossing, no drifting apart).
   If that move would take either pupil within 14 units of its rim, both stop
   short together. */
const REST_R = [82.72, 80.42];
const HALF = { long: 60, short: 31 };
const MARGIN = 14;
const TRAVEL = { x: 52, y: 46 };
/** Each eye's offset from its lens centre at rest, and that lens's inner semi-axes, in rig units (measured from the rig). */
const LENS = [
  { dx: 28, dy: 5, a: 100, b: 131 },
  { dx: -40, dy: 5, a: 93, b: 124 },
];
/** The largest share (0..1) of the move (tx, ty) that keeps a pupil at (dx, dy) inside the ellipse A x B. */
function reach(dx: number, dy: number, tx: number, ty: number, A: number, B: number) {
  const qa = (tx / A) ** 2 + (ty / B) ** 2;
  if (qa === 0) return 1;
  const qb = 2 * ((dx * tx) / (A * A) + (dy * ty) / (B * B));
  const qc = (dx / A) ** 2 + (dy / B) ** 2 - 1;
  return Math.max(0, Math.min(1, (-qb + Math.sqrt(Math.max(0, qb * qb - 4 * qa * qc))) / (2 * qa)));
}
/** Both eyes for a gaze direction: move together toward it, foreshorten along it, tilt a little on diagonals. */
function look(gx: number, gy: number): [Eye, Eye] {
  const x = Math.max(-1, Math.min(1, gx)), y = Math.max(-1, Math.min(1, gy));
  const sl = 1 - 0.26 * y * y; // the long axis is vertical, so a look up or down shortens it
  const ss = 1 - 0.3 * x * x; // a look aside thins it
  const tx = x * TRAVEL.x, ty = y * TRAVEL.y;
  const f = Math.min(...LENS.map((L) => reach(L.dx, L.dy, tx, ty, L.a - HALF.short * ss - MARGIN, L.b - HALF.long * sl - MARGIN)));
  return [0, 1].map((e) => [f * tx, f * ty, REST_R[e] - 7 * x * y, sl, ss]) as [Eye, Eye];
}
/** Sorry: eyes cast down and shorter, each tilted 10 degrees off true vertical with the tops leaning in,
    exactly mirrored (the rest angles differ by eye, so the tilt is set absolutely, not added). */
const SORRY: [Eye, Eye] = (() => {
  const [l, r] = look(0, 0.55);
  return [[l[0], l[1], 90 + 10, 0.72, 0.95], [r[0], r[1], 90 - 10, 0.72, 0.95]];
})();
const SORRY_LID = 1;
const REST = look(0, 0);

const BODY = { w: 2 * Math.PI * 2.5, z: 0.16 };
const LEAF = { w: 2 * Math.PI * 2.2, z: 0.35, push: 90, stop: -34 };
const GLASS = { w: 2 * Math.PI * 5, z: 0.35, lag: 22 };
const GLANCE = 0.18;

const BLINK = [0.033, 0.067, 0.033];


/** BEAT_30's command at `d` seconds in: crouch 160 ms, hold 30, rise 50, push 30, fall 80. */
function beat(d: number, crouch = 0.105, push = 0.055, k = 1) {
  const T = [0.16, 0.03, 0.05, 0.03, 0.08].map((x) => x * k);
  if (d < 0) return 0;
  let t = d;
  if (t < T[0]) return -crouch * ease(t / T[0]);
  t -= T[0]; if (t < T[1]) return -crouch;
  t -= T[1]; if (t < T[2]) return lerp(-crouch, push, ease(t / T[2]));
  t -= T[2]; if (t < T[3]) return push;
  t -= T[3]; if (t < T[4]) return lerp(push, 0, ease(t / T[4]));
  return 0;
}

export function KyllmLive({ mood = "idle", size = 48, poke = 0, variant = "avatar", work = "ponder", sorry = "bow" }: {
  mood?: Mood; size?: number; poke?: number; variant?: "avatar" | "full"; work?: WorkStyle; sorry?: SorryStyle;
}) {
  const workRef = useRef(work);
  useEffect(() => { workRef.current = work; }, [work]);
  const sorryRef = useRef(sorry);
  useEffect(() => { sorryRef.current = sorry; }, [sorry]);
  const wrap = useRef<HTMLSpanElement>(null);
  const moodRef = useRef(mood);
  const moodAt = useRef(0);
  const pokeAt = useRef(-10);

  useEffect(() => { moodRef.current = mood; moodAt.current = performance.now() / 1000; }, [mood]);
  useEffect(() => { if (poke) pokeAt.current = performance.now() / 1000; }, [poke]);

  useEffect(() => {
    // the rig's markup is set as inner HTML, which hydration can replace after this
    // effect runs, so the parts are looked up again whenever they leave the page
    type Parts = Record<"all" | "leaf" | "blink" | "glasses" | "open" | "arcs" | "eyeL" | "eyeR", SVGGraphicsElement>;
    const NAMES: Record<keyof Parts, string> = {
      all: "k-all", leaf: "k-leaf", blink: "k-blink", glasses: "k-glasses", open: "k-open",
      arcs: "k-arcs", eyeL: "k-eye-l", eyeR: "k-eye-r",
    };
    let parts: Parts | null = null;
    const find = (): Parts | null => {
      if (parts?.all.isConnected) return parts;
      const root = wrap.current?.querySelector("svg");
      if (!root) return null;
      const found = {} as Parts;
      for (const [k, cls] of Object.entries(NAMES) as [keyof Parts, string][]) {
        const el = root.querySelector<SVGGraphicsElement>(`.${cls}`);
        if (!el) return null;
        found[k] = el;
      }
      return (parts = found);
    };
    const still = matchMedia("(prefers-reduced-motion: reduce)");

    let s = 0, sv = 0, th = 0, thv = 0, gy = 0, gyv = 0;
    // each glance tweens from where the eyes are to the new pose, then holds
    let from: [Eye, Eye] = [[...REST[0]], [...REST[1]]];
    let to: [Eye, Eye] = from;
    let toKey = "idle:0";
    let glanceAt = -1;
    const eyes: [Eye, Eye] = [[...REST[0]], [...REST[1]]];
    let blinkAt = -1, nextBlink = 0.8 + Math.random() * 2, double = false;
    let nextHop = 3 + Math.random() * 3, idleHopAt = -10;
    let keyAt = -10, nextKey = 0, typed = 0;
    let rock = 0, rockv = 0, lastTick = -1, gd = 0, gdv = 0;
    const seed = Math.random() * 10; // so several avatars on a page don't move in step
    let last = performance.now() / 1000;
    let raf = 0;

    const frame = () => {
      const now = performance.now() / 1000;
      const dt = Math.min(0.033, now - last);
      last = now;
      const m = moodRef.current;
      const since = now - moodAt.current;
      const t = now + seed;

      // ---- command for the body, the leaf's rest angle, and the gaze, by mood
      let u = 0.024 * Math.sin((2 * Math.PI * t) / 2); // drift bed, AB idle
      let leafRest = 4.2 * Math.sin((2 * Math.PI * (t - 0.5)) / 2); // a quarter period behind
      let gaze: [Eye, Eye] = REST;
      let key: string = m;
      let happy = false;
      let rockTo = 0;
      let continuous = false;
      let glassDrop = 0;
      let sadLid = 1;

      if (m === "idle") {
        // breath pops: 80 ms rise, 750 ms eased fall, twice a 6 s ring
        const ring = t % 6;
        for (const [at, a] of [[2.1, 0.022], [4.95, 0.018]] as const) {
          const d = ring - at;
          if (d >= 0 && d < 0.08) u += a * ease(d / 0.08);
          else if (d >= 0.08 && d < 0.83) u += a * (1 - ease((d - 0.08) / 0.75));
        }
        // glances that hold, then a hop now and then
        const g = ring < 0.4 ? null : ring < 2.9 ? [0.36, -0.55] : ring < 4.7 ? [-0.08, 0.2] : [0.24, -0.15];
        if (g) { gaze = look(g[0], g[1]); key = `idle:${g.join(",")}`; }
        if (now > nextHop) { idleHopAt = now; nextHop = now + 5 + Math.random() * 4; }
        u += beat(now - idleHopAt, 0.07, 0.04);
      } else if (m === "typing") {
        // eyes on the composer, following the text left to right as it grows
        if (now > nextKey) { keyAt = now; nextKey = now + 0.11 + Math.random() * 0.16; typed = (typed + 1) % 18; }
        u += -0.014 * Math.exp(-(now - keyAt) / 0.05);
        gaze = look(-0.4 + (typed / 17) * 0.8, 0.9);
        key = `type:${typed}`;
      } else if (m === "working") {
        const w = workRef.current;
        if (w === "orbit") {
          // eyes circle the top of the lenses like a slow spinner, the body bobbing with each lap
          const a = (since * 2 * Math.PI) / 1.8;
          gaze = look(0.7 * Math.cos(a), -0.4 + 0.45 * Math.sin(a));
          key = "orbit";
          continuous = true;
          u += 0.01 * Math.sin(2 * a);
        } else if (w === "leaf") {
          // eyes up and still; the leaf ticks like a metronome, one flick every 0.6 s
          gaze = look(0.45, -0.8);
          const n = Math.floor(since / 0.6);
          if (n !== lastTick) { lastTick = n; thv += n % 2 ? 220 : -220; }
          u += -0.008 * Math.exp(-((since % 0.6) / 0.08));
        } else {
          // ponder: eyes up, small glances between three spots, a slow sway
          const n = Math.floor(since / 1.4);
          const spots = [[0.55, -0.85], [0.35, -0.95], [0.65, -0.7]];
          gaze = look(spots[n % 3][0], spots[n % 3][1]);
          key = `work:${n % 3}`;
          u += 0.012 * Math.sin((2 * Math.PI * since) / 1.4) + beat(since - n * 1.4 - 0.7, 0.03, 0.018, 0.9);
          rockTo = 1.6 * Math.sin((2 * Math.PI * since) / 2.8);
          leafRest = 7 * Math.sin((2 * Math.PI * (since - 0.35)) / 1.4);
        }
      } else if (m === "answered") {
        u += beat(since - 0.05, 0.105, 0.055);
        happy = since > 0.25 && since < 2.2;
      } else if (m === "sorry") {
        // ears stay exactly as drawn in every sorry style; only the body, leaf, glasses, and eyes act
        const st = sorryRef.current;
        gaze = SORRY;
        if (st === "shake") {
          // a small no: every 3 s the head shakes twice, the leaf whipping behind it
          const c2 = since % 3;
          u = -0.03 + (c2 < 0.15 ? 0.015 * ease(c2 / 0.15) : 0);
          rockTo = c2 > 0.15 && c2 < 1.15 ? 5 * Math.sin((2 * Math.PI * (c2 - 0.15)) / 0.5) * (1 - (c2 - 0.15) * 0.4) : 0;
          leafRest = -12;
        } else if (st === "shrink") {
          // sheepish: sinks and leans back, glasses slip down, eyes avoid you, a quick peek up now and then
          const c2 = since % 3.2;
          u = -0.05 + 0.006 * Math.sin((2 * Math.PI * t) / 3.2);
          rockTo = -3;
          glassDrop = 16;
          leafRest = -18;
          const peek = c2 > 2.2 && c2 < 2.8;
          gaze = peek ? look(0.15, -0.3) : look(0.6, 0.8); // away and down (toward the nose the eyes barely move)
          key = peek ? "peek" : "avoid";
        } else if (st === "bow") {
          // apologetic bow: a small rise, then a deep squash with eyes shut, glasses and leaf dipping, then back up
          const c2 = since % 3.4;
          u = c2 < 0.2 ? 0.015 * ease(c2 / 0.2) : c2 < 0.6 ? lerp(0.015, -0.085, ease((c2 - 0.2) / 0.4)) : c2 < 1.4 ? -0.085 : c2 < 2 ? lerp(-0.085, -0.02, ease((c2 - 1.4) / 0.6)) : -0.02;
          glassDrop = c2 > 0.3 && c2 < 1.6 ? 14 : 0;
          leafRest = c2 > 0.3 && c2 < 1.6 ? -26 : -10; // the leaf flops down with the bow
          sadLid = c2 > 0.45 && c2 < 1.45 ? 0.1 : 1;
        } else {
          // sigh: breathe in, let it out into a small slump, a slow sad blink; no head shake
          const c2 = since % 3.6;
          u = c2 < 0.7 ? 0.022 * ease(c2 / 0.7) : c2 < 1.6 ? lerp(0.022, -0.045, ease((c2 - 0.7) / 0.9)) : lerp(-0.045, -0.025, ease((c2 - 1.6) / 2));
          leafRest = -16 + 4 * Math.sin((2 * Math.PI * (c2 - 0.4)) / 3.6);
          const sb = c2 - 2.6;
          sadLid = sb > 0 && sb < 0.5 ? 1 - 0.8 * Math.sin((Math.PI * sb) / 0.5) : 1;
        }
      } else if (m === "hover") {
        gaze = look(0.15, -0.7);
      }
      u += beat(now - pokeAt.current, 0.07, 0.045, 0.8);

      if (key !== toKey) { from = [[...eyes[0]], [...eyes[1]]]; to = gaze; toKey = key; glanceAt = now; }

      if (still.matches) {
        s = m === "sorry" ? -0.03 : 0; sv = 0; th = m === "sorry" ? -14 : 0; gy = 0; gd = m === "sorry" && sorryRef.current === "shrink" ? 16 : 0; rock = 0;
        eyes[0] = [...gaze[0]]; eyes[1] = [...gaze[1]];
      } else {
        const sa = BODY.w ** 2 * (u - s) - 2 * BODY.z * BODY.w * sv;
        sv += sa * dt; s += sv * dt;
        const tha = LEAF.w ** 2 * (leafRest - th) - 2 * LEAF.z * LEAF.w * thv - LEAF.push * sa;
        thv += tha * dt; th += thv * dt;
        if (th < LEAF.stop) { th = LEAF.stop; thv = Math.abs(thv) * 0.3; }
        const rw = 2 * Math.PI * 3;
        const ra = rw ** 2 * (rockTo - rock) - 2 * 0.45 * rw * rockv;
        rockv += ra * dt; rock += rockv * dt;
        const ga = GLASS.w ** 2 * (-GLASS.lag * s - gy) - 2 * GLASS.z * GLASS.w * gyv;
        gyv += ga * dt; gy += gyv * dt;
        const gda = (2 * Math.PI * 3) ** 2 * (glassDrop - gd) - 2 * 0.5 * (2 * Math.PI * 3) * gdv;
        gdv += gda * dt; gd += gdv * dt;
        if (continuous) {
          const f = 1 - Math.exp(-dt / 0.06);
          for (let e = 0; e < 2; e++) for (let i = 0; i < 5; i++) eyes[e][i] = lerp(eyes[e][i], gaze[e][i], f);
          toKey = key; glanceAt = now; from = [[...eyes[0]], [...eyes[1]]]; to = gaze;
        } else {
          const k = mj((now - glanceAt) / GLANCE);
          for (let e = 0; e < 2; e++) for (let i = 0; i < 5; i++) eyes[e][i] = lerp(from[e][i], to[e][i], k);
        }
      }

      // ---- lids: the crouch squints (never past 0.75), blinks close them
      let lid = Math.min(sadLid, m === "sorry" ? SORRY_LID : 1, Math.max(0.75, 1 + Math.min(0, s) * 2.4));
      if (!still.matches && !happy && m !== "sorry") {
        if (blinkAt < 0 && now > nextBlink) { blinkAt = now; double = Math.random() < 0.2; }
        if (blinkAt >= 0) {
          const total = BLINK[0] + BLINK[1] + BLINK[2];
          const d = now - blinkAt, one = d % (total + 0.08);
          if (d < (double ? total * 2 + 0.08 : total)) {
            if (one < BLINK[0]) lid = Math.min(lid, 0.5);
            else if (one < BLINK[0] + BLINK[1]) lid = 0.1;
            else if (one < total) lid = Math.min(lid, 0.5);
          } else { blinkAt = -1; nextBlink = now + 2.5 + Math.random() * 3.5; }
        }
      }

      // ---- write the pose (transform and opacity only)
      const p = find();
      if (!p) { raf = requestAnimationFrame(frame); return; }
      const { all, leaf, blink, glasses, open, arcs } = p;
      const eyeEls = [p.eyeL, p.eyeR];
      const sy = 1 + s, sx = 1 / sy;
      all.style.transform = `rotate(${rock.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
      leaf.style.transform = `scale(${(1 / sx).toFixed(4)}, ${(1 / sy).toFixed(4)}) rotate(${th.toFixed(2)}deg)`;
      glasses.style.transform = `translateY(${(gy + gd).toFixed(2)}px)`;
      blink.style.transform = `scaleY(${lid.toFixed(3)})`;
      open.style.opacity = happy ? "0" : "1";
      arcs.style.opacity = happy ? "1" : "0";
      for (let e = 0; e < 2; e++) {
        const [tx, ty, r, ex, ey] = eyes[e];
        const el = eyeEls[e];
        el.style.setProperty("--tx", `${tx.toFixed(1)}px`);
        el.style.setProperty("--ty", `${ty.toFixed(1)}px`);
        el.style.setProperty("--r", `${r.toFixed(2)}deg`);
        el.style.setProperty("--sx", ex.toFixed(3));
        el.style.setProperty("--sy", ey.toFixed(3));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span ref={wrap} className={l.wrap} style={{ fontSize: size }}>
      <Kyllm still variant={variant} size={size} state="idle" />
      <span className={variant === "avatar" ? `${l.layer} ${l.round}` : l.layer} aria-hidden="true">
        <span className={l.dots} data-on={mood === "working" && work === "ponder" ? "" : undefined}><Dots /></span>
      </span>
    </span>
  );
}

/**
 * Three dots as SVG circles. HTML boxes with border-radius are snapped to whole device pixels, so at avatar
 * sizes a 2 px dot came out as a 2 x 2 or 3 x 2 block and read as a square; an SVG circle is drawn at its
 * true size with antialiased edges, so it stays round at every size and pixel ratio.
 */
function Dots() {
  return (
    <svg viewBox="0 0 11 3" aria-hidden="true">
      <circle cx="1.5" cy="1.5" r="1.5" />
      <circle cx="5.5" cy="1.5" r="1.5" />
      <circle cx="9.5" cy="1.5" r="1.5" />
    </svg>
  );
}
