"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { onSoundChange, setSoundEnabled, soundEnabled } from "../_home/sound";
import b from "./brand.module.css";
import r from "./rail.module.css";

/** The site-wide sound switch, the same persisted setting as the landing
    page's sidebar; `icon` draws it as a speaker icon button. Sound is on by
    default; the calendar's key sounds and every other micro-sound follow it. */
export function RailSound({ icon = false }: { icon?: boolean } = {}) {
  const on = useSyncExternalStore(onSoundChange, soundEnabled, () => true);
  if (icon) return (
    <button type="button" className={r.soundIcon} aria-pressed={on} aria-label="Sound" data-tip={on ? "Sound on" : "Sound off"}
      onClick={() => setSoundEnabled(!on)}>
      {on ? <Volume2 size={16} strokeWidth={1.8} aria-hidden="true" /> : <VolumeX size={16} strokeWidth={1.8} aria-hidden="true" />}
    </button>
  );
  return (
    <button type="button" className={b.util} aria-pressed={on} onClick={() => setSoundEnabled(!on)}>
      Sound
      <span>{on ? "On" : "Off"}</span>
    </button>
  );
}
