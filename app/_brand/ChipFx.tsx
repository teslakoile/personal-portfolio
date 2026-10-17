"use client";

import { useEffect, useRef } from "react";
import { chipTick } from "../_home/sound";
import f from "./chipFx.module.css";

/**
 * The hover layer for chips (kit `Chips` with `notes`). Mount it once inside
 * the page's BrandRoot. It listens at the document, so every chip on the page
 * is covered without a handler per chip:
 *
 *   note    the site's dark tooltip above the chip (below when there is no
 *           room): the chip's name as the title, then its description
 *   sound   a soft tick, pitched by the chip's name so a tool always gives the
 *           same note; mouse and keyboard only, and only while sound is on
 *   cursor  the standard hand: Cursor.tsx treats [data-chip] as hoverable
 *
 * Keyboard focus shows the note too. Touch shows it on tap (the chip takes
 * focus) with no sound.
 */

/** Major-pentatonic steps above the base note, so any two chips sound friendly. */
const STEPS = [0, 2, 4, 7, 9, 12, 14, 16];
const BASE = 620;
const GAP = 8;
const EDGE = 12;

function pitch(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return BASE * 2 ** (STEPS[h % STEPS.length] / 12);
}

export function ChipFx() {
  const tip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = tip.current;
    if (!box) return;
    const name = box.querySelector<HTMLElement>("[data-name]")!;
    const text = box.querySelector<HTMLElement>("[data-text]")!;

    let current: HTMLElement | null = null;
    let lastTick = 0;

    const place = (chip: HTMLElement) => {
      const r = chip.getBoundingClientRect();
      const w = box.offsetWidth, h = box.offsetHeight;
      const x = Math.min(Math.max(r.left + r.width / 2 - w / 2, EDGE), window.innerWidth - w - EDGE);
      const above = r.top - h - GAP;
      const below = above < EDGE;
      box.dataset.side = below ? "below" : "above";
      box.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(below ? r.bottom + GAP : above)}px, 0)`;
    };

    const show = (chip: HTMLElement, sound: boolean) => {
      current?.removeAttribute("data-open");
      current = chip;
      chip.setAttribute("data-open", "");
      name.textContent = chip.dataset.chip ?? "";
      const t = chip.dataset.note ?? "";
      text.textContent = t; text.hidden = !t;
      place(chip);
      box.dataset.open = "";
      const now = performance.now();
      if (sound && now - lastTick > 45) { lastTick = now; chipTick(pitch(chip.dataset.chip ?? "")); }
    };

    const hide = () => {
      current?.removeAttribute("data-open");
      current = null;
      delete box.dataset.open;
    };

    const chipOf = (e: Event) => (e.target instanceof Element ? e.target.closest<HTMLElement>("[data-chip]") : null);

    const over = (e: PointerEvent) => {
      const chip = chipOf(e);
      if (!chip) { if (current) hide(); return; }
      if (chip === current) return;
      show(chip, e.pointerType === "mouse");
    };
    const focusIn = (e: FocusEvent) => {
      const chip = chipOf(e);
      if (chip && chip !== current) show(chip, false);
    };
    const focusOut = (e: FocusEvent) => { if (chipOf(e) === current) hide(); };

    addEventListener("pointerover", over, { passive: true });
    addEventListener("focusin", focusIn);
    addEventListener("focusout", focusOut);
    addEventListener("scroll", hide, { passive: true, capture: true });
    document.documentElement.addEventListener("pointerleave", hide);
    return () => {
      hide();
      removeEventListener("pointerover", over);
      removeEventListener("focusin", focusIn);
      removeEventListener("focusout", focusOut);
      removeEventListener("scroll", hide, { capture: true });
      document.documentElement.removeEventListener("pointerleave", hide);
    };
  }, []);

  return (
    <div ref={tip} className={f.tip} aria-hidden="true">
      <div className={f.card}>
        <b data-name className={f.name} />
        <p data-text className={f.text} />
      </div>
    </div>
  );
}
