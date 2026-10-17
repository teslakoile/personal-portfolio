"use client";

import { useEffect } from "react";
import { chipTick, hoverSound, noteFor, pressSound, tapSound } from "../_home/sound";

/**
 * The page's sound layer for everything that has no sound of its own. Mount it
 * once inside the page; it listens at the document, like ChipFx:
 *
 *   hover  a button or link plays a soft lift (lower for the primary button);
 *          a chip in the KYLLM chat ([data-tone]: follow-ups, sources,
 *          citations) plays the chip tick, pitched by its text
 *   press  a button or link plays a press; a press anywhere else, the
 *          faintest tap; Enter or Space on a button plays the press too
 *
 * Elements that make their own sounds opt out with [data-own-sound] (the rail
 * rows, the sound switch, the contribution calendar), as do the page's chips
 * ([data-chip], ChipFx) and a boopable KYLLM ([data-touch]). Hover is mouse
 * only. Everything follows the site's sound switch.
 */
const ACTION = 'a[href], button:not(:disabled), [role="button"], summary, label[for], input[type="checkbox"], input[type="radio"]';
const OWN = "[data-own-sound], [data-chip], [data-touch]";

export function UiSound() {
  useEffect(() => {
    let current: Element | null = null;
    let last = 0;
    const of = (e: Event) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return { own: false, el: null };
      if (t.closest(OWN)) return { own: true, el: null };
      return { own: false, el: t.closest(ACTION) };
    };

    const over = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const { el } = of(e);
      if (el === current) return;
      current = el;
      const now = performance.now();
      if (!el || now - last < 45) return;
      last = now;
      const tone = el.closest<HTMLElement>("[data-tone]");
      if (tone) chipTick(noteFor(tone.textContent ?? ""));
      else hoverSound(el.matches("[data-contact], [data-primary]"));
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const { own, el } = of(e);
      if (own) return;
      if (el) pressSound();
      else tapSound();
    };
    // a keyboard activation fires click with detail 0
    const key = (e: MouseEvent) => {
      if (e.detail !== 0) return;
      const { el } = of(e);
      if (el) pressSound();
    };

    addEventListener("pointerover", over, { passive: true });
    addEventListener("pointerdown", down, { passive: true });
    addEventListener("click", key, { passive: true });
    return () => {
      removeEventListener("pointerover", over);
      removeEventListener("pointerdown", down);
      removeEventListener("click", key);
    };
  }, []);
  return null;
}
