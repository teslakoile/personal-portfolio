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
 *   blink  33 ms half, 67 ms closed, 33 ms half; one per 3 s cycle at a fixed
 *          phase, never at random
 *   idle   the shipped tab-icon loop (.claude/skills/avatar-animation, which
 *          rules over this file): a strict 3.000 s cycle, a moving hold. A
 *          small breath bed, one breath pop, one leaf flick, and one bounce
 *          at 0.6 s with the face script: squint and pupils drop in the
 *          crouch, pupils lift in the stretch, a glint across the lenses at
 *          the first stretch peak, one blink 0.12 s after it, then the eyes
 *          settle. No idle glances, no randomness.
 *   hold   `hold` freezes an avatar in its pose (past answers in a thread),
 *          so only the live one moves
 *
 *   gaze   the pupils sit on a sphere behind each lens: a look is a gaze
 *          direction (gx, gy in -1..1), and each pupil moves that way and
 *          foreshortens along it (shorter when it looks up or down, thinner
 *          when it looks aside), with a slight tilt on the diagonals, so its
 *          shape always agrees with where it looks
 *
 * Moods follow the chat: idle; typing looks down at the composer and follows
 * the text as it grows; working looks up at a thought bubble of dots and
 * ponders with three dots rising in the sky beside it, no bubble; answered (after the stream ends) does the big hop with happy eyes;
 * sorry keeps its ears as drawn and acts with body, leaf, glasses, and eyes, in one of
 * four styles (SorryStyle); hover looks up at the cursor. Each `poke` change fires a small hop. Reduced motion holds each
 * mood's pose, with no motion.
 */

export type Mood = "idle" | "typing" | "working" | "answered" | "sorry" | "hover";
/** How "working" shows: a thought bubble of dots, pondering glances, eyes circling, or the leaf ticking. */
export type WorkStyle = "bubble" | "ponder" | "orbit" | "leaf";
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
const MARGIN = 15;
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

/* The glint lives on the glasses (so it rides their lag) and is clipped to the two lens
   openings, inset from the inner rims so it never paints over the black frames. */
const LENS_OPENINGS = [[495, 499, 96, 124], [781, 486, 86, 116]];
let glintIds = 0;
function addGlint(glasses: SVGGraphicsElement): SVGGraphicsElement {
  const ns = "http://www.w3.org/2000/svg";
  const old = glasses.querySelector<SVGGraphicsElement>(":scope > .k-glint");
  if (old) return old;
  const id = `k-glint-clip-${++glintIds}-${Math.round(Math.random() * 1e6)}`;
  const clip = document.createElementNS(ns, "clipPath");
  clip.setAttribute("id", id);
  for (const [cx, cy, rx, ry] of LENS_OPENINGS) {
    const e = document.createElementNS(ns, "ellipse");
    e.setAttribute("cx", String(cx)); e.setAttribute("cy", String(cy)); e.setAttribute("rx", String(rx)); e.setAttribute("ry", String(ry));
    clip.appendChild(e);
  }
  const g = document.createElementNS(ns, "g") as SVGGraphicsElement;
  g.setAttribute("class", "k-glint");
  g.setAttribute("clip-path", `url(#${id})`);
  g.style.opacity = "0";
  const bar = document.createElementNS(ns, "g");
  const rect = document.createElementNS(ns, "rect");
  rect.setAttribute("x", "-22"); rect.setAttribute("y", "-260"); rect.setAttribute("width", "44"); rect.setAttribute("height", "520");
  rect.setAttribute("rx", "22"); rect.setAttribute("fill", "#fff");
  bar.appendChild(rect);
  g.appendChild(bar);
  glasses.appendChild(clip);
  glasses.appendChild(g);
  return g;
}

export function KyllmLive({ mood = "idle", size = 48, poke = 0, variant = "avatar", work = "ponder", sorry = "bow", hold = false }: {
  mood?: Mood; size?: number; poke?: number; variant?: "avatar" | "full"; work?: WorkStyle; sorry?: SorryStyle; hold?: boolean;
}) {
  const holdRef = useRef(hold);
  useEffect(() => { holdRef.current = hold; }, [hold]);
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
    type Parts = Record<"all" | "leaf" | "blink" | "glasses" | "open" | "arcs" | "eyeL" | "eyeR" | "glint", SVGGraphicsElement>;
    const NAMES: Record<Exclude<keyof Parts, "glint">, string> = {
      all: "k-all", leaf: "k-leaf", blink: "k-blink", glasses: "k-glasses", open: "k-open",
      arcs: "k-arcs", eyeL: "k-eye-l", eyeR: "k-eye-r",
    };
    let parts: Parts | null = null;
    const find = (): Parts | null => {
      if (parts?.all.isConnected) return parts;
      const root = wrap.current?.querySelector("svg");
      if (!root) return null;
      const found = {} as Parts;
      for (const [k, cls] of Object.entries(NAMES) as [Exclude<keyof Parts, "glint">, string][]) {
        const el = root.querySelector<SVGGraphicsElement>(`.${cls}`);
        if (!el) return null;
        found[k] = el;
      }
      found.glint = addGlint(found.glasses);
      return (parts = found);
    };
    const still = matchMedia("(prefers-reduced-motion: reduce)");

    let s = 0, sv = 0, th = 0, thv = 0, gy = 0, gyv = 0, lastFlick = -1;
    // each glance tweens from where the eyes are to the new pose, then holds
    let from: [Eye, Eye] = [[...REST[0]], [...REST[1]]];
    let to: [Eye, Eye] = from;
    let toKey = "idle:0";
    let glanceAt = -1;
    const eyes: [Eye, Eye] = [[...REST[0]], [...REST[1]]];
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
      const c3 = t % 3; // every period divides the strict 3 s cycle
      let u = 0.012 * Math.sin((2 * Math.PI * t) / 3); // the breath bed: small, never a drift
      let leafRest = 0;
      let glintU = -1; // 0..1 while the glint crosses the lenses
      let blinkStart = 2.4; // where in the 3 s cycle this mood blinks
      let gaze: [Eye, Eye] = REST;
      let key: string = m;
      let happy = false;
      let rockTo = 0;
      let continuous = false;
      let glassDrop = 0;
      let sadLid = 1;

      if (m === "idle") {
        // one breath pop (80 ms in, 750 ms out) and one leaf flick per cycle
        const dp = c3 - 2.1;
        if (dp >= 0 && dp < 0.08) u += 0.02 * ease(dp / 0.08);
        else if (dp >= 0.08 && dp < 0.83) u += 0.02 * (1 - ease((dp - 0.08) / 0.75));
        const cycle = Math.floor(t / 3);
        if (c3 > 1.3 && lastFlick !== cycle) { lastFlick = cycle; thv -= 140; }
        // the bounce at 0.6 s, with the face script (gaze scale 0.6)
        const bd = c3 - 0.6;
        u += beat(bd, 0.105, 0.055);
        if (bd > 0 && bd < 0.19) { gaze = look(0, 0.25 * 0.6); key = "crouch"; }
        else if (bd >= 0.19 && bd < 0.85) { gaze = look(0, -0.4 * 0.6); key = "lift"; }
        if (bd > 0.27 && bd < 0.57) glintU = (bd - 0.27) / 0.3;
        blinkStart = 0.6 + 0.69;
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
          // ponder (and bubble): eyes up, small glances between three spots, a slow sway
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

      const frozen = still.matches || holdRef.current;
      if (frozen) {
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

      // ---- lids: the crouch squints (never past 0.75); one blink per cycle at a fixed phase
      let lid = Math.min(sadLid, m === "sorry" ? SORRY_LID : 1, Math.max(0.75, 1 + Math.min(0, s) * 2.4));
      if (!frozen && !happy && m !== "sorry") {
        const d = c3 - blinkStart;
        if (d >= 0 && d < BLINK[0]) lid = Math.min(lid, 0.5);
        else if (d >= BLINK[0] && d < BLINK[0] + BLINK[1]) lid = 0.1;
        else if (d >= BLINK[0] + BLINK[1] && d < BLINK[0] + BLINK[1] + BLINK[2]) lid = Math.min(lid, 0.5);
      }

      // ---- write the pose (transform and opacity only)
      const p = find();
      if (!p) { raf = requestAnimationFrame(frame); return; }
      const { all, leaf, blink, glasses, open, arcs, glint } = p;
      // the glint: a soft bar sweeping left to right, opacity on a specular lobe sin(pi u)^0.6
      if (!frozen && glintU >= 0) {
        glint.style.opacity = (0.75 * Math.sin(Math.PI * glintU) ** 0.6).toFixed(3);
        glint.firstElementChild?.setAttribute("transform", `translate(${(380 + glintU * 520).toFixed(1)} 470) rotate(24)`);
      } else glint.style.opacity = "0";
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
        <span className={l.bubble} data-on={mood === "working" && work === "bubble" ? "" : undefined}><i /><i /><i /></span>
        <span className={l.dots} data-on={mood === "working" && work === "ponder" ? "" : undefined}><i /><i /><i /></span>
      </span>
    </span>
  );
}
