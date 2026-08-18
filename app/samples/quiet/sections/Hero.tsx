import Link from "next/link";
import { sample } from "../../sampleContent";
import styles from "../styles.module.css";
import alt from "./Hero.alt.module.css";
import { Emph, Pill, CONTACT_KIND } from "../helpers";
import { ContactIcon } from "../Logo";
import { HeroV4 } from "./HeroV4";

export type SectionVariant = 1 | 2 | 3;
export type HeroVariant = 1 | 2 | 3 | 4;

function ContactRow({ center = false }: { center?: boolean }) {
  return (
    <div className={`${styles.contactRow} ${center ? alt.contactsCenter : ""}`}>
      {sample.contacts.map((c) => (
        <a key={c.label} href={c.href} className={styles.contactLink}
          target={c.href.startsWith("http") ? "_blank" : undefined}
          rel={c.href.startsWith("http") ? "noreferrer" : undefined}>
          <span className={styles.contactIcon}><ContactIcon kind={CONTACT_KIND[c.label] ?? "email"} /></span>
          {c.value}
        </a>
      ))}
    </div>
  );
}

function Cta() {
  return (
    <Link href={sample.hero.primaryCta.href} className={styles.ctaPrimary}>
      {sample.hero.primaryCta.label}
      <span aria-hidden="true" className={styles.ctaArrowBox} />
    </Link>
  );
}

/** V1 — current locked hero: graph-paper backdrop, two-tone headline, CTA + contact row. */
function HeroV1() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroGrid} aria-hidden="true" />
      <p className={`${styles.eyebrow} ${styles.rise} ${styles.d0}`}>
        <span className={styles.eyebrowDot} aria-hidden="true" />
        {sample.hero.eyebrow}
      </p>
      <h1 className={`${styles.heroHeadline} ${styles.rise} ${styles.d1}`}>
        I build the data and AI infrastructure{" "}
        <span className={styles.heroHeadlineMuted}>enterprises run on.</span>
      </h1>
      <p className={`${styles.heroSub} ${styles.rise} ${styles.d2}`}>
        <Emph text={sample.hero.subhead} />
      </p>
      <div className={`${styles.heroActions} ${styles.rise} ${styles.d3}`}>
        <Cta />
        <ContactRow />
      </div>
    </section>
  );
}

/** V2 — stat-anchored: headline left, a "selected outcome" proof panel right so
    the first screen shows concrete proof, not just a claim. */
function HeroV2() {
  return (
    <section className={alt.v2}>
      <div className={styles.heroGrid} aria-hidden="true" />
      <div className={alt.v2Main}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          {sample.hero.eyebrow}
        </p>
        <h1 className={alt.headlineSm}>
          I build the data and AI infrastructure{" "}
          <span className={styles.heroHeadlineMuted}>enterprises run on.</span>
        </h1>
        <p className={alt.subSm}><Emph text={sample.hero.subhead} /></p>
        <div className={alt.v2Actions}>
          <Cta />
          <ContactRow />
        </div>
      </div>
      <aside className={alt.proofCard}>
        <p className={alt.proofLabel}>Selected outcome</p>
        <p className={alt.proofTitle}>Single Customer View — a major Philippine bank</p>
        <dl className={alt.proofMetrics}>
          {[sample.outcome.metrics[1], sample.outcome.metrics[2]].map((m) => (
            <div key={m.label} className={alt.proofRow}>
              <dt className={alt.proofVal}>{m.value}</dt>
              <dd className={alt.proofMlabel}>{m.label}</dd>
            </div>
          ))}
        </dl>
        <div className={alt.proofStack}>
          {sample.outcome.stack.slice(0, 3).map((s) => <Pill key={s} name={s} />)}
        </div>
      </aside>
    </section>
  );
}

/** V3 — centered editorial: no grid backdrop, larger headline, calmer and more
    confident. Eyebrow, headline, subhead and actions all centered. */
function HeroV3() {
  return (
    <section className={alt.v3}>
      <p className={styles.eyebrow}>
        <span className={styles.eyebrowDot} aria-hidden="true" />
        {sample.hero.eyebrow}
      </p>
      <h1 className={alt.headlineLg}>
        I build the data and AI infrastructure{" "}
        <span className={styles.heroHeadlineMuted}>enterprises run on.</span>
      </h1>
      <p className={alt.subCenter}><Emph text={sample.hero.subhead} /></p>
      <div className={alt.v3Actions}>
        <Cta />
        <ContactRow center />
      </div>
    </section>
  );
}

export function Hero({ variant = 1 }: { variant?: HeroVariant }) {
  if (variant === 2) return <HeroV2 />;
  if (variant === 3) return <HeroV3 />;
  if (variant === 4) return <HeroV4 />;
  return <HeroV1 />;
}
