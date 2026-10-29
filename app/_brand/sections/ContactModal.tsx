"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { ArrowUpRight, Check, Copy, Mail, Phone, X } from "lucide-react";
import { sample } from "../../samples/sampleContent";
import { trapTab } from "./AskPanel";
import s from "./contactModal.module.css";

/**
 * The Get in Touch modal: every way to reach Kyle in one place, in place of a
 * bare mailto link. Any [data-contact] opens it (Button's `contact` prop sets
 * that, on the rail and in the hero); the button's href still works on a page
 * without it. Esc or the backdrop closes it, and focus goes back to the button
 * that opened it. Render inside <BrandRoot> and <MotionRoot>.
 *
 * The title and a close button, then one row per channel, in the business
 * card's order: email, LinkedIn, GitHub, and phone. Each row is an icon tile,
 * the channel's name in ink-3, and the address as the link, the handle in ink
 * and the generic rest in ink-3. Email and phone have a copy button; LinkedIn
 * and GitHub show an open arrow on hover. Email and phone use plain glyphs that
 * turn coral on hover; LinkedIn and GitHub keep their own logos.
 */

const TRIGGER = "[data-contact]";
const SPRING: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 };

const EMAIL = sample.contacts.find((c) => c.label === "Email")!;
const LINKEDIN = sample.contacts.find((c) => c.label === "LinkedIn")!;
const GITHUB = sample.contacts.find((c) => c.label === "GitHub")!;
const PHONE = sample.phone;

/** `parts` splits the address into its handle (ink) and the generic rest (ink-3). */
type Channel = { name: string; text: string; parts: [string, boolean][]; href: string; icon: ReactNode; copy?: string; external?: boolean };
/* eslint-disable @next/next/no-img-element */
const CHANNELS: Channel[] = [
  { name: "Email", text: EMAIL.value, parts: [["kyle.naranjo", false], ["@gmail.com", true]], href: EMAIL.href,
    icon: <Mail strokeWidth={1.8} aria-hidden="true" />, copy: EMAIL.value },
  { name: "LinkedIn", text: LINKEDIN.value, parts: [["linkedin.com/in/", true], ["kyle-naranjo", false]], href: LINKEDIN.href,
    icon: <img src="/logos/linkedin.svg" alt="" />, external: true },
  { name: "GitHub", text: GITHUB.value, parts: [["github.com/", true], ["teslakoile", false]], href: GITHUB.href,
    icon: <img src="/logos/github.svg" alt="" />, external: true },
  { name: "Phone", text: PHONE.value, parts: [["+63 ", true], ["906 561 4027", false]], href: PHONE.href,
    icon: <Phone strokeWidth={1.8} aria-hidden="true" />, copy: PHONE.value },
];
/* eslint-enable @next/next/no-img-element */

export function ContactModal() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  const hide = useCallback(() => {
    setOpen(false);
    const el = opener.current;
    opener.current = null;
    if (el) requestAnimationFrame(() => el.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target.closest(TRIGGER) : null;
      if (!el) return;
      e.preventDefault();
      opener.current = el instanceof HTMLElement ? el : null;
      setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") hide(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, hide]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div key="layer" className={s.layer}>
          <motion.div className={s.backdrop} aria-hidden="true" onClick={hide}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }} transition={{ duration: 0.2 }} />
          <motion.div className={s.shell} role="dialog" aria-modal="true" aria-labelledby="contact-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.14, ease: "easeIn" } }} transition={SPRING}
            onKeyDown={trapTab}>
            <Card onClose={hide} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Card({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  // focus the panel itself, so screen readers start at the title and no link
  // opens wearing a focus ring
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { panel.current?.focus({ preventScroll: true }); }, []);

  const copy = async (c: Channel) => {
    try { await navigator.clipboard.writeText(c.copy!); } catch { return; }
    setCopied(c.name);
    window.setTimeout(() => setCopied((x) => (x === c.name ? null : x)), 1800);
  };

  return (
    <div ref={panel} className={s.panel} tabIndex={-1}>
      <div className={s.head}>
        <h2 id="contact-title" className={s.title}>Get in Touch</h2>
        <button type="button" className={s.close} onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      <ul className={s.rows}>
        {CHANNELS.map((c, i) => (
          <motion.li key={c.name} className={s.row}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.05 + i * 0.04 }}>
            <a href={c.href} aria-label={`${c.name}: ${c.text}`}
              target={c.external ? "_blank" : undefined} rel={c.external ? "noreferrer" : undefined}>
              <span className={s.icon}>{c.icon}</span>
              <span className={s.body}>
                <span className={s.name}>{c.name}</span>
                <span className={s.text}>{c.parts.map(([t, muted], j) => <span key={j} data-muted={muted ? "" : undefined}>{t}</span>)}</span>
              </span>
              {c.copy ? null : <ArrowUpRight className={s.end} size={16} strokeWidth={1.8} aria-hidden="true" />}
            </a>
            {c.copy ? (
              <button type="button" className={s.copy} onClick={() => copy(c)} aria-label={`Copy ${c.text}`}
                data-tip={copied === c.name ? "Copied" : "Copy"} data-on={copied === c.name ? "" : undefined}>
                {copied === c.name ? <Check size={15} strokeWidth={2} aria-hidden="true" /> : <Copy size={15} strokeWidth={1.8} aria-hidden="true" />}
              </button>
            ) : null}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
