"use client";

import { useSyncExternalStore } from "react";
import { onSoundChange, setSoundEnabled, soundEnabled } from "../_home/sound";
import b from "./brand.module.css";

/** The site-wide sound switch, the same persisted setting as the landing
    page's sidebar. Sound is on by default; the calendar's key sounds and every
    other micro-sound follow it. */
export function RailSound() {
  const on = useSyncExternalStore(onSoundChange, soundEnabled, () => true);
  return (
    <button type="button" className={b.util} aria-pressed={on} onClick={() => setSoundEnabled(!on)}>
      Sound
      <span>{on ? "On" : "Off"}</span>
    </button>
  );
}
