import { sample } from "../samples/sampleContent";
import { sectionEnabled } from "../flags";
import { fontVariant } from "../fonts";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";
import { ContactIcon } from "../samples/quiet/Logo";
import { CONTACT_KIND } from "../samples/quiet/helpers";
import { Reveal } from "../samples/quiet/Reveal";
import { StackLine } from "../samples/quiet/StackLine";
import { Hero } from "../samples/quiet/sections/Hero";
import { About } from "../samples/quiet/sections/About";
import { Experience } from "../samples/quiet/sections/Experience";
import { Skills } from "../samples/quiet/sections/Skills";
import { Writing } from "../samples/quiet/sections/Writing";
import { Certifications } from "../samples/quiet/sections/Certifications";
import { Community } from "../samples/quiet/sections/Community";
import { Education } from "../samples/quiet/sections/Education";
import { Recognition } from "../samples/quiet/sections/Recognition";
import { Sidebar } from "./Sidebar";
import { Overlays } from "./Overlays";
import { RecommendationsMosaic } from "./Recommendations";
import { Resources } from "./Resources";
import { Contributions } from "./Contributions";
import { Projects } from "./Projects";

/**
 * Landing shell, the Quiet Blueprint sections inside a bryllim.com-inspired
 * sidebar layout, plus the new sections: recommendations, resources, and the
 * GitHub contribution graph. Kyle's locked picks: photo hero V4, about V3,
 * timeline experience, spec-sheet skills, writing V1, cert badges, inline
 * recognition V2, quiet-line stack band (alternatives at /samples/sections/stack). Alternative per-section treatments are being explored at
 * /samples/rework, the landing keeps this composition until a pick lands.
 * The prior top-nav composition still lives at /samples/home; the text-dense
 * original at /classic.
 */
export function HomeShell() {
  return (
    <div className={styles.root} data-variant={fontVariant}>
      <div className={home.layout}>
        <Sidebar />
        <div className={home.main}>
          <main className={styles.container}>
            <Hero variant={4} portrait="/hero/portrait-hero-black.webp" />
            <StackLine />
            {sectionEnabled("about") ? <Reveal id="about"><About variant={3} /></Reveal> : null}
            {sectionEnabled("projects") ? <Reveal id="projects"><Projects /></Reveal> : null}
            {sectionEnabled("experience") ? <Reveal id="experience"><Experience variant={1} /></Reveal> : null}
            {sectionEnabled("skills") ? <Reveal id="skills"><Skills variant={3} /></Reveal> : null}
            {sectionEnabled("education") ? <Reveal id="education"><Education /></Reveal> : null}
            {sectionEnabled("certifications") ? <Reveal id="certifications"><Certifications variant={1} /></Reveal> : null}
            {sectionEnabled("writing") ? <Reveal id="writing"><Writing variant={1} /></Reveal> : null}
            {sectionEnabled("community") ? <Reveal id="community"><Community /></Reveal> : null}
            {sectionEnabled("recognition") ? <Reveal id="recognition"><Recognition variant={2} /></Reveal> : null}
            {sectionEnabled("recommendations") && sample.recommendations.length > 0 ? (
              <Reveal id="recommendations"><RecommendationsMosaic /></Reveal>
            ) : null}
            {sectionEnabled("resources") ? <Reveal id="resources"><Resources /></Reveal> : null}
            {sectionEnabled("github") ? <Reveal id="github"><Contributions /></Reveal> : null}
          </main>

          <footer className={styles.footer}>
            <div className={`${styles.container} ${styles.footerInner} ${home.fInner}`}>
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
      </div>
      <Overlays />
    </div>
  );
}
