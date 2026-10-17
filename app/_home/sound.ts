"use client";

/**
 * Micro sound effects, tiny WebAudio blips, no audio files. Everything is
 * guarded: SSR-safe (functions only run in event handlers), autoplay-safe (the
 * context unlocks on the first user gesture that triggers a sound), and
 * user-controllable (persisted toggle, default ON at a near-subliminal volume).
 */

const KEY = "kn-sound";
let ctx: AudioContext | null = null;
const listeners = new Set<(on: boolean) => void>();

export function soundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) !== "off";
}

export function setSoundEnabled(on: boolean) {
  window.localStorage.setItem(KEY, on ? "on" : "off");
  listeners.forEach((l) => l(on));
  if (on) tick(); // audible confirmation
}

/** Subscribe to toggle changes (useSyncExternalStore-compatible). */
export function onSoundChange(l: (on: boolean) => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function ac(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One short blip. freq/dur/vol tuned per call site. */
function blip(freq: number, dur: number, vol: number, type: OscillatorType = "triangle", glideTo?: number) {
  if (!soundEnabled()) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Nav hover / keystroke, a faint mechanical tick. `rate` scales the pitch
    (1 is the site's tick), for callers that play a scale. */
export function tick(rate = 1) {
  blip(1850 * rate, 0.045, 0.028);
}

/** Chip hover, a soft pitched tick. Pass a frequency so each chip keeps its
    own note; it sits well under the nav tick so a row of chips stays calm. */
export function chipTick(freq = 1100) {
  blip(freq, 0.07, 0.02, "sine");
}

/** Click / confirm, slightly rounder. `rate` scales the pitch as in tick(). */
export function click(rate = 1) {
  blip(940 * rate, 0.07, 0.04, "triangle", 660 * rate);
}

/** Modal open, soft rising pop. */
export function popOpen() {
  blip(320, 0.12, 0.045, "sine", 520);
}

/** Modal close, soft falling pop. */
export function popClose() {
  blip(480, 0.11, 0.04, "sine", 260);
}

/** Typing-test error, low thud. */
export function thud() {
  blip(160, 0.09, 0.05, "sine", 110);
}

/** Typing-test finish, a tiny two-note chime. */
export function chime() {
  blip(660, 0.14, 0.045, "sine");
  setTimeout(() => blip(990, 0.2, 0.045, "sine"), 110);
}

/** KYLLM boop: a soft rising squeak that climbs a step with each quick boop in
    a row (`combo`); the fourth adds a little giggle trill. */
export function boopSound(combo = 1) {
  const step = Math.min(combo - 1, 4);
  const base = 520 * Math.pow(1.12, step);
  blip(base, 0.09, 0.045, "sine", base * 1.5);
  if (combo >= 4) {
    [0, 1, 2].forEach((i) => setTimeout(() => blip(base * (1.6 + i * 0.12), 0.05, 0.03, "sine"), 90 + i * 55));
  }
}

/** Major-pentatonic steps above 620 Hz, so any two named things sound friendly. */
const STEPS = [0, 2, 4, 7, 9, 12, 14, 16];

/** A stable note for a name: the same chip always plays the same pitch. */
export function noteFor(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 620 * 2 ** (STEPS[h % STEPS.length] / 12);
}

/** Button and link hover: a soft, airy lift, lower and rounder than the chip
    tick, so actions and chips sound different. `primary` sits a fourth lower. */
export function hoverSound(primary = false) {
  const f = primary ? 660 : 880;
  blip(f, 0.08, 0.018, "sine", f * 1.12);
}

/** Button and link press: a small body thump under a short click, so it reads
    as a key going down. */
export function pressSound() {
  blip(240, 0.07, 0.04, "sine", 150);
  blip(1400, 0.025, 0.018, "triangle");
}

/** A press on nothing in particular: the faintest tap. */
export function tapSound() {
  blip(520, 0.035, 0.012, "sine", 380);
}

/** A KYLLM trace step starting: a soft rising note per step, `i` steps up. */
export function stepSound(i = 0) {
  blip(784 * 2 ** ((i * 2) / 12), 0.06, 0.014, "sine");
}

/** KYLLM writing: a very faint, slightly random typewriter tick. */
export function streamSound() {
  blip(2200 + Math.random() * 700, 0.014, 0.006, "triangle");
}

/** KYLLM finished an answer: a quiet two-note chime, falling for an error. */
export function answerSound(ok = true) {
  const [a, b] = ok ? [784, 1175] : [523, 392];
  blip(a, 0.12, 0.022, "sine");
  setTimeout(() => blip(b, 0.18, 0.022, "sine"), 90);
}
