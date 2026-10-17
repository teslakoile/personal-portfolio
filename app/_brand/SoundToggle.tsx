"use client";

import { useSyncExternalStore } from "react";
import { onSoundChange, setSoundEnabled, soundEnabled } from "../_home/sound";
import b from "./brand.module.css";

/** Rail control for the page's micro-sounds. It shares the landing page's
    "kn-sound" setting, so the choice carries across both. */
export function SoundToggle() {
  const on = useSyncExternalStore((notify) => onSoundChange(notify), soundEnabled, () => true);
  return (
    <button type="button" className={b.util} style={{ width: "100%" }} aria-pressed={on} onClick={() => setSoundEnabled(!on)}>
      Sound
      <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{on ? "On" : "Off"}</span>
    </button>
  );
}
