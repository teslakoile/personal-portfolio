/**
 * How often the shipped tab icon bounces, by running the real ring player (app/_brand/faviconControl.ts
 * runRing) on a virtual clock. The shipped loop starts a bounce at every opening, so every gap should be
 * exactly 3000 ms.
 *
 *   node --experimental-strip-types scripts/kyllm/check-favicon-rhythm.mjs
 */
import { runRing } from "../../app/_brand/faviconControl.ts";
import { FAVICON_RING } from "../../app/_brand/faviconFrames.ts";

const HOURS = 3;
let seed = 7;
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const ring = FAVICON_RING;
const loopFrames = new Set(ring.loop.map(([f]) => f));
const beatOnly = new Set(ring.beats.flatMap((b) => b.frames.map(([f]) => f)).filter((f) => !loopFrames.has(f)));

let now = 0;
let inBeat = false;
const queue = [];
const starts = [];
runRing(
  ring,
  (f) => {
    const b = beatOnly.has(f);
    if (b && !inBeat) starts.push(now);
    inBeat = b;
  },
  (ms, next) => queue.push({ t: now + ms, fn: next }),
  random,
);
while (queue.length) {
  queue.sort((a, b) => a.t - b.t);
  const e = queue.shift();
  now = e.t;
  if (now > HOURS * 3600 * 1000) break;
  e.fn();
}
const gaps = starts.slice(1).map((s, i) => s - starts[i]);
console.log({
  bounces: starts.length,
  perMinute: +(starts.length / (HOURS * 60)).toFixed(1),
  gapMs: [...new Set(gaps.map(Math.round))],
  shortestMs: Math.min(...gaps),
  longestMs: Math.max(...gaps),
});
