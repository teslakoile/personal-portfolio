"use client";

import { useEffect, useRef } from "react";
import { ARROW_PATH } from "./InkCursor";
import c from "./pointer.module.css";

/**
 * KYLLM, a companion cursor that behaves like a computer-use agent sharing
 * the page with the visitor. Behavior, as a ladder of states:
 *
 *   join     on the first pointer entry it comes in from the sidebar's
 *            Ask Anything button and says "joined", once per page load
 *   follow   rides beside the visitor's cursor on a soft spring, and
 *            narrates what they point at as a tool call after a 140ms dwell
 *            (so sweeping across links doesn't flicker); fast moves quiet it
 *   select   when the visitor highlights text: select(12 words)
 *   think    1.5s of stillness: "thinking", with a shimmer
 *   wander   3.5s: walks to the nearest heading or link it hasn't visited
 *            yet, frames it like a Figma selection, and reads it out. One
 *            trip per pause, and it never revisits a target in a session
 *   sleep    20s: dims, says "idle", and waits
 *   listen   ⌘K open: moves into the Ask Anything field, "listening"
 *   hidden   ⌘J typing test open, or the pointer left the window
 *
 * Any movement or scroll brings it back to follow. It rides on the right of
 * the cursor and flips to the left near the window's right edge. Every label
 * comes from the element itself (href, download, section id, button text,
 * or the actual selection), never invented.
 */

const TARGETS = 'a, button, [role="button"]';
const SIDE = { x: 26, y: 28 };
const THINK_AFTER = 1500, WANDER_AFTER = 3500, SLEEP_AFTER = 20000, DWELL = 140;

type Pt = { x: number; y: number };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** What an element does, as a tool call. Real attributes only. */
export function actionFor(el: Element): string | null {
  const a = el.closest("a");
  if (a) {
    const href = a.getAttribute("href") ?? "";
    if (a.hasAttribute("download")) return "download(cv)";
    if (href.startsWith("mailto:")) return "compose(email)";
    if (href.startsWith("#")) return `scroll(${href.slice(1) || "top"})`;
    try {
      const u = new URL(href, window.location.href);
      return u.host !== window.location.host ? `open(${u.host.replace(/^www\./, "")})` : `open(${u.pathname})`;
    } catch {
      return null;
    }
  }
  const b = el.closest('button, [role="button"]');
  if (b) {
    const text = (b.getAttribute("aria-label") ?? b.textContent ?? "").trim();
    if (/ask anything/i.test(text)) return "ask(kyllm)";
    if (/typing test/i.test(text)) return "start(typing_test)";
    if (/sound/i.test(text)) return "toggle(sound)";
    const word = text.split(/\s+/).slice(0, 3).join("_").toLowerCase().replace(/[^a-z0-9_]/g, "");
    return word ? `click(${word})` : null;
  }
  const h = el.closest("h2");
  if (h) {
    const sec = h.closest("[id]");
    return `read(${sec ? sec.id : (h.textContent ?? "").trim().toLowerCase()})`;
  }
  return null;
}

function visible(r: DOMRect) {
  return r.width > 0 && r.bottom > 40 && r.top < window.innerHeight - 40;
}

/** The nearest visible heading or link it hasn't visited, within reach. */
function nextVisit(p: Pt, visited: Set<Element>, exclude: Element | null): Element | null {
  let best: Element | null = null, bestD = Infinity;
  for (const el of document.querySelectorAll("main h2, main a, aside a, aside button")) {
    if (visited.has(el) || (exclude && exclude.contains(el))) continue;
    const r = el.getBoundingClientRect();
    if (!visible(r)) continue;
    const d = Math.hypot(Math.max(r.left, Math.min(p.x, r.right)) - p.x, Math.max(r.top, Math.min(p.y, r.bottom)) - p.y);
    if (d > 40 && d < 520 && d < bestD) { best = el; bestD = d; } // not what's already under the pointer
  }
  return best;
}

export function Companion({ exclude }: { exclude?: React.RefObject<HTMLElement | null> }) {
  const root = useRef<HTMLDivElement>(null);
  const action = useRef<HTMLSpanElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current, act = action.current, fr = frame.current;
    if (!el || !act || !fr) return;

    const pointer: Pt = { x: -200, y: -200 }, pos: Pt = { x: -200, y: -200 }, vel: Pt = { x: 0, y: 0 };
    let state: "join" | "follow" | "think" | "travel" | "present" | "sleep" | "listen" | "hidden" = "follow";
    let joined = false, shown = false, raf = 0;
    let lastMove = performance.now(), speed = 0, flip = false;
    let hovered: Element | null = null, hoveredAt = 0, selection = "";
    let visit: Element | null = null, wanderedThisPause = false;
    const visited = new Set<Element>();
    let trip: { from: Pt; ctrl: Pt; t0: number; dur: number; to: () => Pt } | null = null;
    let label = "", joinedUntil = 0;

    const say = (text: string, thinking = false) => {
      el.dataset.thinking = thinking ? "true" : "false";
      if (text === label) return;
      label = text;
      act.textContent = text;
      el.dataset.hasAction = text ? "true" : "false";
      if (text) act.animate([{ opacity: 0, filter: "blur(3px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 180, easing: "ease-out" });
    };
    const setState = (s: typeof state) => { state = s; el.dataset.state = s; };

    const side = (): Pt => ({ x: pointer.x + (flip ? -SIDE.x - 8 : SIDE.x), y: pointer.y + SIDE.y });
    const pointAt = (t: Element): Pt => {
      const r = t.getBoundingClientRect();
      if (t.tagName === "H2") return { x: r.left - 4, y: r.top + r.height * 0.6 };
      if (t.tagName === "INPUT") return { x: r.left + 18, y: r.top + r.height / 2 };
      return { x: r.left + Math.min(r.width / 2, 40), y: r.top + r.height / 2 };
    };
    const go = (to: () => Pt, now: number) => {
      const a = to(), dx = a.x - pos.x, dy = a.y - pos.y, d = Math.hypot(dx, dy);
      // a gentle arc bowed to one side, like a hand moving a mouse
      trip = { from: { ...pos }, ctrl: { x: pos.x + dx / 2 - dy * 0.22, y: pos.y + dy / 2 + dx * 0.22 }, t0: now, dur: Math.min(1100, 360 + d * 1.1), to };
    };
    const showFrame = (t: Element | null) => {
      if (!t) { delete fr.dataset.on; return; }
      const r = t.getBoundingClientRect(), pad = 5;
      Object.assign(fr.style, { transform: `translate3d(${r.left - pad}px, ${r.top - pad}px, 0)`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
      fr.dataset.on = "true";
    };
    const backToFollow = () => {
      if (state === "follow" || state === "join") return;
      setState("follow"); visit = null; trip = null; showFrame(null);
      delete el.dataset.sleep;
      say("");
    };

    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');

    const tick = (now: number) => {
      const idle = now - lastMove;
      const dlg = dialog();

      // overlays win over everything else
      if (dlg && /typing/i.test(dlg.getAttribute("aria-label") ?? "")) {
        if (state !== "hidden") { setState("hidden"); el.dataset.hidden = "true"; showFrame(null); }
      } else if (dlg) {
        const input = dlg.querySelector("input");
        if (state !== "listen" && input) { setState("listen"); delete el.dataset.hidden; showFrame(null); go(() => pointAt(input), now); say("listening", true); }
      } else if (state === "listen" || state === "hidden") {
        delete el.dataset.hidden; backToFollow();
      }

      if (state === "follow" && idle > THINK_AFTER) { setState("think"); say("thinking", true); }
      if (state === "think" && idle > WANDER_AFTER && !wanderedThisPause) {
        wanderedThisPause = true;
        visit = nextVisit(pointer, visited, exclude?.current ?? null);
        if (visit) { const v = visit; visited.add(v); setState("travel"); go(() => pointAt(v), now); }
      }
      if ((state === "think" || state === "present") && idle > SLEEP_AFTER) {
        setState("sleep"); el.dataset.sleep = "true"; showFrame(null); say("idle");
      }

      // movement
      if (trip && (state === "travel" || state === "listen" || state === "join")) {
        const t = Math.min(1, (now - trip.t0) / trip.dur), e = ease(t), u = 1 - e, to = trip.to();
        const x = u * u * trip.from.x + 2 * u * e * trip.ctrl.x + e * e * to.x;
        const y = u * u * trip.from.y + 2 * u * e * trip.ctrl.y + e * e * to.y;
        vel.x = x - pos.x; vel.y = y - pos.y; pos.x = x; pos.y = y;
        if (t >= 1) {
          trip = null;
          if (state === "travel" && visit) { setState("present"); showFrame(visit); say(actionFor(visit) ?? ""); }
          if (state === "join") setState("follow");
        }
      } else if ((state === "present" || state === "listen") && (visit || dlg)) {
        const to = state === "present" && visit ? pointAt(visit) : pointAt(dlg!.querySelector("input") ?? dlg!);
        vel.x = (to.x - pos.x) * 0.3; vel.y = (to.y - pos.y) * 0.3; pos.x += vel.x; pos.y += vel.y;
        if (state === "present" && visit) showFrame(visit); // stays on it while the page moves
      } else {
        // a slightly underdamped spring: it lags, then settles with a hint of overshoot
        const to = side();
        vel.x = (vel.x + (to.x - pos.x) * 0.07) * 0.74;
        vel.y = (vel.y + (to.y - pos.y) * 0.07) * 0.74;
        pos.x += vel.x; pos.y += vel.y;
      }

      // narration while following: the selection first, then what's hovered
      if (state === "follow") {
        if (now < joinedUntil) say("joined");
        else if (selection) say(selection);
        else if (speed > 22) say(""); // quiet while the visitor is flicking around
        else if (hovered && now - hoveredAt > DWELL) say(actionFor(hovered) ?? "");
        else if (!hovered && now - hoveredAt > 260) say("");
      }

      el.style.transform = `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0)`;
      el.style.setProperty("--tilt", `${Math.max(-10, Math.min(10, vel.x * 0.8)).toFixed(2)}deg`);
      speed *= 0.85;

      const target = state === "follow" || state === "think" ? side() : pos;
      const settled = !trip && Math.hypot(target.x - pos.x, target.y - pos.y) < 0.3 && Math.hypot(vel.x, vel.y) < 0.05 && now > joinedUntil;
      raf = shown && !settled ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const now = performance.now();
      speed = Math.max(speed, Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y));
      pointer.x = e.clientX; pointer.y = e.clientY;
      flip = pointer.x > window.innerWidth - 230;
      el.dataset.flip = flip ? "true" : "false";
      if (!shown) {
        shown = true; el.dataset.shown = "true";
        if (!joined) {
          // enter from the Ask Anything button if it is on screen, else from the right edge
          joined = true;
          const ask = [...document.querySelectorAll("aside button")].find((b) => /ask anything/i.test(b.textContent ?? ""));
          const r = ask?.getBoundingClientRect();
          Object.assign(pos, r && visible(r) ? { x: r.left + 20, y: r.top + r.height / 2 } : { x: window.innerWidth + 30, y: pointer.y + 40 });
          setState("join"); go(side, now); joinedUntil = now + 1600; say("joined");
        } else {
          Object.assign(pos, side());
        }
      }
      lastMove = now; wanderedThisPause = false;
      if (state !== "join" && state !== "listen" && state !== "hidden") backToFollow();
      const t = e.target instanceof Element ? e.target.closest(TARGETS) : null;
      const h = t && !exclude?.current?.contains(t) ? t : null;
      if (h !== hovered) { hovered = h; hoveredAt = now; }
      wake();
    };
    const down = () => { if (shown) el.animate([{ scale: 1 }, { scale: 0.86 }, { scale: 1 }], { duration: 240, easing: "ease-out" }); };
    const leave = () => { shown = false; delete el.dataset.shown; showFrame(null); };
    const scroll = () => { lastMove = performance.now(); wanderedThisPause = false; if (state !== "listen" && state !== "hidden") backToFollow(); wake(); };
    const onSelect = () => {
      const s = window.getSelection()?.toString().trim() ?? "";
      const n = s ? s.split(/\s+/).length : 0;
      selection = n ? `select(${n} word${n === 1 ? "" : "s"})` : "";
      wake();
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("selectionchange", onSelect);
    document.documentElement.addEventListener("pointerleave", leave);
    // the idle ladder and overlays still need checking while the frame loop sleeps
    const clock = window.setInterval(() => { if (shown) wake(); }, 250);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(clock);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("scroll", scroll);
      document.removeEventListener("selectionchange", onSelect);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [exclude]);

  return (
    <>
      <div ref={frame} className={c.companionFrame} aria-hidden="true">
        <i /><i /><i /><i />
      </div>
      <div ref={root} className={c.companion} aria-hidden="true">
        <svg className={c.companionArrow} width="22" height="22" viewBox="0 0 24 24">
          <path d={ARROW_PATH} fill="#f5482d" stroke="#faf9f7" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <div className={c.companionTag}>
          <b>KYLLM</b>
          <span ref={action} className={c.companionAction} />
        </div>
      </div>
    </>
  );
}
