"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { sample } from "../samples/sampleContent";
import { ContactIcon } from "../samples/quiet/Logo";
import home from "./home.module.css";
import { NAV_SECTIONS } from "./nav";
import { tick, click, soundEnabled, setSoundEnabled, onSoundChange } from "./sound";

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6.5 8.5H3v7h3.5L11 19V5Z" />
      {muted ? (
        <path d="m16 9.5 5 5M21 9.5l-5 5" />
      ) : (
        <>
          <path d="M14.5 9.2a4 4 0 0 1 0 5.6" />
          <path d="M17 6.8a7.4 7.4 0 0 1 0 10.4" />
        </>
      )}
    </svg>
  );
}

/**
 * The left rail: wordmark, numbered section nav with a scrollspy, the ⌘K / ⌘J
 * launchers, and the reach-me block. Collapses to a sticky top bar on mobile
 * (nav + launchers hidden there — the anchors remain reachable by scrolling).
 */
export function Sidebar() {
  const [active, setActive] = useState<string>("");
  // localStorage-backed toggle; server snapshot matches the "on" default
  const sound = useSyncExternalStore(onSoundChange, soundEnabled, () => true);

  // Scrollspy — the section nearest the upper third of the viewport wins.
  useEffect(() => {
    const els = NAV_SECTIONS
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const openOverlay = (name: "ask" | "type") => {
    click();
    window.dispatchEvent(new CustomEvent(`kn-open-${name}`));
  };

  return (
    <aside className={home.sidebar}>
      <Link href="/" className={home.sbWordmark}>Kyle&nbsp;Naranjo</Link>

      <nav className={home.sbNav} aria-label="Sections">
        {NAV_SECTIONS.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`${home.sbNavItem} ${active === s.id ? home.sbNavActive : ""}`}
            aria-current={active === s.id ? "true" : undefined}
            onMouseEnter={() => tick()}
            onClick={() => click()}
          >
            <span className={home.sbNavNum}>{String(i + 1).padStart(2, "0")}</span>
            {s.label}
          </a>
        ))}
      </nav>

      <hr className={home.sbDivider} />

      <div className={home.sbUtil}>
        <button type="button" className={home.sbUtilBtn} onClick={() => openOverlay("ask")} onMouseEnter={() => tick()}>
          Ask Anything
          <span className={home.sbKbd}><kbd>⌘</kbd><kbd>K</kbd></span>
        </button>
        <button type="button" className={home.sbUtilBtn} onClick={() => openOverlay("type")} onMouseEnter={() => tick()}>
          Typing Test
          <span className={home.sbKbd}><kbd>⌘</kbd><kbd>J</kbd></span>
        </button>
      </div>

      <div className={home.sbFoot}>
        <button
          type="button"
          className={home.sbSound}
          onClick={() => setSoundEnabled(!sound)}
          aria-pressed={sound}
        >
          <SpeakerIcon muted={!sound} />
          <span className={home.sbSoundText}>{sound ? "Sound On" : "Sound Off"}</span>
        </button>

        <p className={home.sbReach}>For work, talks &amp; everything else, reach me at</p>
        <a href={sample.contacts[0].href} className={home.sbEmail} onMouseEnter={() => tick()}>
          <ContactIcon kind="email" size={14} />
          {sample.contacts[0].value}
        </a>
        <div className={home.sbIconRow}>
          <a href={sample.contacts[1].href} className={home.sbIconLink} target="_blank" rel="noreferrer" aria-label="LinkedIn" onMouseEnter={() => tick()}>
            <ContactIcon kind="linkedin" size={15} />
          </a>
          <a href={sample.contacts[2].href} className={home.sbIconLink} target="_blank" rel="noreferrer" aria-label="GitHub" onMouseEnter={() => tick()}>
            <ContactIcon kind="github" size={15} />
          </a>
        </div>

        <a href={sample.hero.primaryCta.href} className={home.sbCta} onClick={() => click()}>
          Get in Touch
        </a>
      </div>
    </aside>
  );
}
