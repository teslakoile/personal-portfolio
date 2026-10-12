"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Transition, type Variants } from "motion/react";
import { bestMatch, emailQuestionHref, SUGGESTIONS, type QA } from "./askContent";
import b from "../brand.module.css";
import s from "./askPanel.module.css";

/**
 * KYLLM's Ask panel for the redesign: the live site's curated Q&A (see
 * askContent.ts) in a brand-token dialog. Render it inside <BrandRoot> (for
 * the tokens) and <MotionRoot> (so reduced motion drops transforms).
 *
 *   <AskPanel />                          modal; ⌘K / ctrl+K and any
 *                                         [data-util="Ask KYLLM"] open it
 *   <AskPanel inline trigger="#replay" /> drawn in place, open on load;
 *                                         its trigger toggles it closed/open
 *   animate={false}                       same panel, every change instant
 *                                         (the "before" of a before/after)
 */

export type AskPanelProps = {
  /** Motion on (default). false: open, close, lists, answers, and height all snap. */
  animate?: boolean;
  /** Render in place (no backdrop, not fixed, open on load) for comparison boxes. */
  inline?: boolean;
  /** CSS selector for opener buttons. Default `[data-util="Ask KYLLM"]` for the
      modal, none for inline. Pass "" to listen to nothing. */
  trigger?: string;
  /** ⌘K / ctrl+K toggles this panel. Default true for the modal, false for inline. */
  hotkey?: boolean;
  /** Extra class on the outer element (inline mode sizing). */
  className?: string;
};

const DEFAULT_TRIGGER = '[data-util="Ask KYLLM"]';
const AVATAR = "/kyllm/kyllm-avatar-56.webp";

/* Motion tokens: one spring for the panel and its height, a quick tween for
   fades, 32ms a word for the answer stream. */
const SPRING: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 };
const HEIGHT: Transition = { type: "spring", stiffness: 380, damping: 38 };
const FADE: Transition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] };
const INSTANT: Transition = { duration: 0 };
const WORD_MS = 32;

export function AskPanel({ animate = true, inline = false, trigger, hotkey, className }: AskPanelProps) {
  const selector = trigger ?? (inline ? "" : DEFAULT_TRIGGER);
  const useHotkey = hotkey ?? !inline;
  const [open, setOpen] = useState(inline);
  const opener = useRef<HTMLElement | null>(null);
  // inline panels are open on load; only an explicit open should take focus
  const [focusOnOpen, setFocusOnOpen] = useState(!inline);

  const show = useCallback((from: Element | null) => {
    opener.current = from instanceof HTMLElement ? from : null;
    setFocusOnOpen(true);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
    const el = opener.current;
    opener.current = null;
    // the opener sits under the backdrop until it leaves, so wait a frame
    if (el) requestAnimationFrame(() => el.focus({ preventScroll: true }));
  }, []);

  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useHotkey && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (openRef.current) hide();
        else show(document.activeElement);
      } else if (e.key === "Escape" && openRef.current && !inline) {
        hide();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!selector) return;
      const el = e.target instanceof Element ? e.target.closest(selector) : null;
      if (!el) return;
      e.preventDefault();
      if (openRef.current) hide();
      else show(el);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [useHotkey, selector, inline, show, hide]);

  // lock page scroll while the modal is up
  useEffect(() => {
    if (!open || inline) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, inline]);

  const t = (x: Transition) => (animate ? x : INSTANT);

  const panel = (
    <motion.div
      key="shell"
      className={inline ? s.shellInline : s.shell}
      role="dialog"
      aria-modal={inline ? undefined : true}
      aria-label="Ask KYLLM"
      initial={animate ? { opacity: 0, scale: 0.96, y: 8 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={animate ? { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.14, ease: "easeIn" } } : { opacity: 0, transition: INSTANT }}
      transition={t(SPRING)}
      onKeyDown={(e) => {
        if (!inline) trapTab(e);
        else if (e.key === "Escape") hide();
      }}
    >
      <Conversation animate={animate} autoFocus={focusOnOpen} onClose={hide} inline={inline} />
    </motion.div>
  );

  if (inline) {
    return (
      <div className={`${s.inlineHost} ${className ?? ""}`}>
        <AnimatePresence>{open ? panel : null}</AnimatePresence>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div key="layer" className={`${s.layer} ${className ?? ""}`}>
          <motion.div
            className={s.backdrop}
            aria-hidden="true"
            onClick={hide}
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: animate ? { duration: 0.16 } : INSTANT }}
            transition={t({ duration: 0.2 })}
          />
          {panel}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ----------------------------- conversation ----------------------------- */

type Asked = { q: string; qa: QA | null; anchorOk: boolean };

const FALLBACK = "I haven't written that one down yet. Send it to me directly and I'll answer for real.";
const answerWords = (asked: Asked) => (asked.qa ? asked.qa.a : FALLBACK).split(" ");

function Conversation({ animate, autoFocus, onClose, inline }: { animate: boolean; autoFocus: boolean; onClose: () => void; inline: boolean }) {
  const [input, setInput] = useState("");
  const [asked, setAsked] = useState<Asked | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();
  const stream = animate && !reduced;
  const t = (x: Transition) => (animate ? x : INSTANT);
  const pos = animate ? ("position" as const) : false;
  // The stream lives here, not in <Answer>, so each new word re-renders the
  // layout panel and Motion animates its height line by line.
  const [shown, setShown] = useState(0);
  // re-render once an exit finishes so the panel animates the collapse too
  const [, bump] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (!asked || !stream) return;
    const total = answerWords(asked).length;
    let i = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    // wait out the previous block's exit, then one word per tick
    const start = setTimeout(() => {
      timer = setInterval(() => {
        i += 1;
        setShown(i);
        if (i >= total && timer) clearInterval(timer);
      }, WORD_MS);
    }, 280);
    return () => { clearTimeout(start); if (timer) clearInterval(timer); };
  }, [asked, stream]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const submit = (q: string) => {
    if (!q.trim()) return;
    const qa = bestMatch(q);
    // an in-page link only makes sense if this page has that section
    const href = qa?.link?.href;
    const anchorOk = !href?.startsWith("#") || !!document.getElementById(href.slice(1));
    setInput(q);
    setShown(0);
    setAsked({ q, qa, anchorOk });
  };

  const list: Variants = {
    hidden: {},
    show: { transition: animate ? { staggerChildren: 0.045, delayChildren: 0.06 } : {} },
  };
  const item: Variants = {
    hidden: animate ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0, transition: t(SPRING) },
  };

  return (
    <LayoutGroup>
      {/* The panel's height follows its content through `layout`; each direct
          child carries layout="position" so the panel's scale never squashes
          the text inside it. */}
      <motion.div layout={animate} transition={t(HEIGHT)} className={s.panel} style={{ borderRadius: 14 }}>
        <motion.div layout={pos} transition={t(HEIGHT)} className={s.head}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 28px mascot avatar, already a sized webp */}
          <img className={s.avatar} src={AVATAR} alt="" width={28} height={28} />
          <span className={s.title}>Ask KYLLM</span>
          {inline ? null : (
            <button type="button" className={s.close} onClick={onClose} aria-label="Close">
              <kbd className={b.kbd}>esc</kbd>
            </button>
          )}
        </motion.div>

        <motion.div layout={pos} transition={t(HEIGHT)} className={s.inputRow}>
          <input
            ref={inputRef}
            className={s.input}
            value={input}
            placeholder="Type a question and press enter…"
            aria-label="Ask a question"
            onChange={(e) => { setInput(e.target.value); if (asked) setAsked(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(input); }}
          />
        </motion.div>

        <motion.div layout={pos} transition={t(HEIGHT)} className={s.body}>
          <AnimatePresence mode="wait" initial={animate} onExitComplete={bump}>
            {!asked ? (
              <motion.ul
                key="suggestions"
                className={s.list}
                variants={list}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: t({ duration: 0.12 }) }}
              >
                {SUGGESTIONS.map((q) => (
                  <motion.li key={q} variants={item}>
                    <button type="button" className={s.item} onClick={() => submit(q)}>
                      <span>{q}</span>
                      <span className={s.enter} aria-hidden="true">↵</span>
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <Answer
                key={asked.q}
                asked={asked}
                stream={stream}
                shown={stream ? shown : Infinity}
                animate={animate}
                onAsk={submit}
                onNavigate={inline ? undefined : onClose}
              />
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div layout={pos} transition={t(HEIGHT)} className={s.foot}>
          <span><kbd className={b.kbd}>↵</kbd> to ask</span>
          {inline ? null : <span><kbd className={b.kbd}>esc</kbd> to close</span>}
        </motion.div>
      </motion.div>
    </LayoutGroup>
  );
}

/* -------------------------------- answer -------------------------------- */

function Answer({ asked, stream, shown, animate, onAsk, onNavigate }: {
  asked: Asked;
  stream: boolean;
  shown: number;
  animate: boolean;
  onAsk: (q: string) => void;
  onNavigate?: () => void;
}) {
  const { qa } = asked;
  const title = qa ? qa.q : "Good Question";
  const words = answerWords(asked);
  const text = words.join(" ");
  const n = Math.min(shown, words.length);
  const done = n >= words.length;

  const link = qa?.link && asked.anchorOk ? qa.link : null;
  const followUps = SUGGESTIONS.filter((q) => q !== qa?.q).slice(0, 3);
  const fade = animate ? FADE : INSTANT;

  return (
    <motion.div
      className={s.answer}
      initial={animate ? { opacity: 0, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={animate ? { opacity: 0, y: -4, transition: { duration: 0.14 } } : { opacity: 0, transition: INSTANT }}
      transition={fade}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 24px mascot avatar */}
      <img className={s.answerAvatar} src={AVATAR} alt="" width={24} height={24} />
      <div className={s.answerMain}>
        <p className={s.answerQ}>{title}</p>
        {/* screen readers get the whole answer once; the stream is visual only */}
        <p className={s.srOnly} aria-live="polite">{text}</p>
        <p className={s.answerA} aria-hidden="true">
          {words.slice(0, n).map((w, i) => (
            <motion.span
              key={i}
              initial={stream ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22 }}
            >
              {w}{i < words.length - 1 ? " " : ""}
            </motion.span>
          ))}
          {!done ? <span className={s.caret} /> : null}
        </p>
        <AnimatePresence initial={animate}>
          {done ? (
            <motion.div
              key="after"
              className={s.after}
              initial={animate ? { opacity: 0, y: 4 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={fade}
            >
              {qa ? (
                link ? (
                  <a
                    className={b.link}
                    href={link.href}
                    onClick={link.external ? undefined : onNavigate}
                  >
                    {link.label} <span aria-hidden="true">→</span>
                  </a>
                ) : null
              ) : (
                <a className={b.link} href={emailQuestionHref(asked.q)}>
                  Email Me This Question <span aria-hidden="true">→</span>
                </a>
              )}
              <div className={s.followUps}>
                {followUps.map((q) => (
                  <button key={q} type="button" className={s.followUp} onClick={() => onAsk(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ------------------------------ focus trap ------------------------------ */

function trapTab(e: ReactKeyboardEvent<HTMLElement>) {
  if (e.key !== "Tab") return;
  const focusables = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'),
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
