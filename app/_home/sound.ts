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

/** Nav hover / keystroke, a faint mechanical tick. */
export function tick() {
  blip(1850, 0.045, 0.028);
}

/** Click / confirm, slightly rounder. */
export function click() {
  blip(940, 0.07, 0.04, "triangle", 660);
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
