"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Kbd } from "../../kyllm-ui/kit";
import { KyllmLive } from "../../kyllm-ui/rig/KyllmLive";
import { openKyllm } from "./events";
import h from "./hero.module.css";

/*
 * KYLLM promoted in the hero, under the contact links (the bar, picked
 * 2026-10-14 over question pills and a one-line link): a composer-like bar
 * that types example questions. A click opens the bottom-right sheet and asks
 * the question shown.
 */

const QUESTIONS = [
  "How does the MCP server work?",
  "What has he built with AI agents?",
  "Which talks has he given?",
];

/** Holds each question, clears it, types the next. Starts on the first one in
    full, so the server render and reduced motion both show a whole question. */
function useTypewriter(items: string[]) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(items[0].length);
  const [phase, setPhase] = useState<"type" | "hold" | "clear">("hold");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const full = items[i].length;
    const id = phase === "type"
      ? setTimeout(() => (n < full ? setN(n + 1) : setPhase("hold")), n === 0 ? 400 : 38 + Math.random() * 40)
      : phase === "hold"
        ? setTimeout(() => setPhase("clear"), 2400)
        : setTimeout(() => { if (n > 0) setN(n - 1); else { setI((i + 1) % items.length); setPhase("type"); } }, 16);
    return () => clearTimeout(id);
  }, [i, n, phase, items]);
  return { q: items[i], shown: items[i].slice(0, n), typing: phase !== "hold" };
}

export function KyllmPromo() {
  const { q, shown, typing } = useTypewriter(QUESTIONS);
  return (
    <div className={`${h.tokens} ${h.promo}`}>
      <button type="button" className={h.promoBar} onClick={() => openKyllm(q)} aria-label={`Ask KYLLM: ${q}`}>
        <KyllmLive mood={typing ? "typing" : "idle"} size={30} />
        <span className={h.promoQ}>{shown}<i className={h.promoCaret} aria-hidden="true" /></span>
        <Kbd>⌘K</Kbd>
        <span className={h.promoGo} aria-hidden="true"><ArrowRight size={15} strokeWidth={2} /></span>
      </button>
    </div>
  );
}
