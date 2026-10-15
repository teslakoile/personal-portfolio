"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { onSoundChange, popClose, popOpen, setSoundEnabled, soundEnabled } from "../_home/sound";
import b from "./brand.module.css";
import r from "./rail.module.css";

/** The site-wide sound switch, the same persisted setting as the landing
    page's sidebar; `icon` draws it as a speaker icon button. Sound is on by
    default; the calendar's key sounds and every other micro-sound follow it. */
export function RailSound({ icon = false }: { icon?: boolean } = {}) {
  const on = useSyncExternalStore(onSoundChange, soundEnabled, () => true);
  if (icon) return <SoundIcon on={on} />;
  return (
    <button type="button" className={b.util} aria-pressed={on} onClick={() => setSoundEnabled(!on)}>
      Sound
      <span>{on ? "On" : "Off"}</span>
    </button>
  );
}

/* The speaker, drawn from Lucide's volume-2 and volume-x so its parts can
   move on their own. */
const BODY = "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z";
const WAVES = ["M16 9a5 5 0 0 1 0 6", "M19.364 18.364a9 9 0 0 0 0-12.728"];
const CROSS = ["m16.5 9.5 5 5", "m16.5 14.5 5-5"];
const POP: Transition = { type: "spring", stiffness: 520, damping: 16 };
const DRAW = { duration: 0.28, ease: [0.22, 1, 0.36, 1] } as const;

/** The rail's sound switch as a speaker. Turning sound on, the speaker pops,
    its two waves draw out one after the other, and a coral ring pulses out
    behind it, with the site's rising pop sound; turning it off, the waves
    pull back, a cross draws in, and the speaker dips, with the falling pop
    (played before sound goes off, so it is heard). Coral while on, grey
    while off. Nothing animates on first render. */
function SoundIcon({ on }: { on: boolean }) {
  // count presses, so the pop and the ring replay on every toggle but not on load
  const [n, setN] = useState(0);
  const toggle = () => {
    setN((x) => x + 1);
    if (on) { popClose(); setSoundEnabled(false); }
    else { setSoundEnabled(true); popOpen(); }
  };
  return (
    <button type="button" className={r.soundIcon} aria-pressed={on} aria-label="Sound" data-tip={on ? "Sound on" : "Sound off"} onClick={toggle}>
      {n > 0 && on ? <motion.span key={`ring${n}`} className={r.soundRing} aria-hidden="true"
        initial={{ scale: 0.55, opacity: 0.45 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} /> : null}
      <motion.svg key={`icon${n}`} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        initial={n > 0 ? { scale: on ? 0.72 : 0.86 } : false} animate={{ scale: 1 }} transition={POP}>
        <path d={BODY} />
        <AnimatePresence initial={false}>
          {on ? WAVES.map((d, i) => (
            <motion.path key={d} d={d} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.16 } }} transition={{ ...DRAW, delay: 0.06 + i * 0.09 }} />
          )) : CROSS.map((d, i) => (
            <motion.path key={d} d={d} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.12 } }} transition={{ ...DRAW, delay: 0.08 + i * 0.07 }} />
          ))}
        </AnimatePresence>
      </motion.svg>
    </button>
  );
}
