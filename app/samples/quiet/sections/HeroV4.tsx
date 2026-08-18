"use client";

import { useRef, type MouseEvent } from "react";
import Link from "next/link";
import { sample } from "../../sampleContent";
import styles from "../styles.module.css";
import alt from "./Hero.alt.module.css";
import { Emph, CONTACT_KIND } from "../helpers";
import { ContactIcon } from "../Logo";

/**
 * V4 hero — photo layout, with experiments in micro-interaction:
 *  • staggered entrance on load (eyebrow → headline → sub → actions / photo)
 *  • cursor-reactive blueprint: the graph-paper lines glow coral near the pointer
 *    (a radial mask tracks the cursor over an accent-tinted copy of the grid).
 * Pure pointer response — no effect until the mouse moves, reduced-motion safe.
 */
export function HeroV4() {
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--spot-x", "-9999px");
    el.style.setProperty("--spot-y", "-9999px");
  };

  return (
    <section ref={ref} className={alt.v4} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className={styles.heroGrid} aria-hidden="true" />
      <div className={alt.heroSpot} aria-hidden="true" />
      <div className={alt.v4Main}>
        <p className={`${styles.eyebrow} ${styles.rise} ${styles.d0}`}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          {sample.hero.eyebrow}
        </p>
        <h1 className={`${alt.headlineMix} ${styles.rise} ${styles.d1}`}>
          I build the <span className={alt.headlineAccent}>data and AI infrastructure</span> enterprises run on.
        </h1>
        <p className={`${alt.subMix} ${styles.rise} ${styles.d2}`}><Emph text={sample.hero.subhead} /></p>
        <div className={`${alt.v4Actions} ${styles.rise} ${styles.d3}`}>
          <div className={alt.ctaGroup}>
            <Link href={sample.hero.primaryCta.href} className={styles.ctaPrimary}>
              {sample.hero.primaryCta.label}
              <span aria-hidden="true" className={styles.ctaArrowBox} />
            </Link>
            <a href={sample.cvUrl} download className={styles.ctaSecondary}>
              <span aria-hidden="true" className={styles.ctaDownload}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="m7 11 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
              </span>
              Download CV
            </a>
          </div>
          <div className={styles.contactRow}>
            {sample.contacts.map((c) => (
              <a key={c.label} href={c.href} className={styles.contactLink}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noreferrer" : undefined}>
                <span className={styles.contactIcon}><ContactIcon kind={CONTACT_KIND[c.label] ?? "email"} /></span>
                {c.value}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className={`${alt.photoFrame} ${styles.rise} ${styles.d2}`}>
        {/* Swap this block for: <img className={alt.photoImg} src="/me.jpg" alt="Kyle Naranjo" /> */}
        <div className={alt.photoPlaceholder}>
          <div className={alt.photoGridLines} aria-hidden="true" />
          <span className={alt.photoMono}>KN</span>
          <span className={alt.photoCaption}>Photo placeholder</span>
        </div>
      </div>
    </section>
  );
}
