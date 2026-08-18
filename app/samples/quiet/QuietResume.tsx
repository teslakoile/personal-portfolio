import Link from "next/link";
import { sample } from "../sampleContent";
import styles from "./styles.module.css";
import { ContactIcon } from "./Logo";
import { CONTACT_KIND } from "./helpers";
import { Reveal } from "./Reveal";
import { Marquee } from "./Marquee";
import { Hero, type HeroVariant, type SectionVariant } from "./sections/Hero";
import { About } from "./sections/About";
import { Experience } from "./sections/Experience";
import { Skills } from "./sections/Skills";
import { Writing } from "./sections/Writing";
import { Certifications } from "./sections/Certifications";
import { Community } from "./sections/Community";
import { Education } from "./sections/Education";
import { Recognition } from "./sections/Recognition";

/** Per-section layout picks. Omitted sections fall back to variant 1, so the
    plain <QuietResume /> (quiet-a) keeps its original all-V1 design. */
export type SectionPicks = {
  hero?: HeroVariant;
  about?: SectionVariant;
  experience?: SectionVariant;
  skills?: SectionVariant;
  writing?: SectionVariant;
  certifications?: SectionVariant;
  recognition?: SectionVariant;
};

/**
 * Quiet Blueprint resume — Geist type system, real multicolor logos, no mono
 * label tells, no folder-tab. Font swapped via `variant` (data-variant on root).
 * Each section is its own component (variant 1 = this locked design) so the
 * section-variation comparison pages render the real thing, not a copy.
 */
export function QuietResume({
  variant,
  picks,
}: {
  variant?: "swiss" | "editorial" | "mono";
  picks?: SectionPicks;
}) {
  return (
    <div className={styles.root} data-variant={variant}>
      {/* ============================== HEADER ============================= */}
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <Link href="/samples" className={styles.wordmark}>Kyle&nbsp;Naranjo</Link>
          <nav className={styles.nav} aria-label="Primary">
            {sample.nav.map((n) => {
              const active = n.label === "Home";
              return (
                <Link key={n.label} href={n.href}
                  className={`${styles.navLink} ${active ? styles.navActive : ""}`}
                  aria-current={active ? "page" : undefined}>
                  {n.label}
                </Link>
              );
            })}
            <Link href={sample.hero.primaryCta.href} className={styles.navCta}>Get in touch</Link>
          </nav>
        </div>
      </header>

      <main className={styles.container}>
        <Hero variant={picks?.hero} />
        <Marquee />
        <Reveal><About variant={picks?.about} /></Reveal>
        <Reveal><Experience variant={picks?.experience} /></Reveal>
        <Reveal><Skills variant={picks?.skills} /></Reveal>
        <Reveal><Education /></Reveal>
        <Reveal><Certifications variant={picks?.certifications} /></Reveal>
        <Reveal><Writing variant={picks?.writing} /></Reveal>
        <Reveal><Community /></Reveal>
        <Reveal><Recognition variant={picks?.recognition} /></Reveal>
      </main>

      {/* ============================== FOOTER ============================= */}
      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <span className={styles.footerCopy}>© 2026 Kyle Naranjo</span>
          <div className={styles.footerLinks}>
            {sample.contacts.map((c) => (
              <a key={c.label} href={c.href} className={styles.footerLink}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noreferrer" : undefined}>
                <span className={styles.contactIcon}><ContactIcon kind={CONTACT_KIND[c.label] ?? "email"} size={14} /></span>
                {c.label}
              </a>
            ))}
            <a href={sample.cvUrl} download className={styles.footerLink}>
              <span className={styles.contactIcon} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="m7 11 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
              </span>
              Download CV
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
