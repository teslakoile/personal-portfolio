import { sample } from "../../sampleContent";
import styles from "../styles.module.css";
import alt from "./Recognition.alt.module.css";
import { Emph } from "../helpers";
import type { SectionVariant } from "./Hero";

function Body({ a }: { a: (typeof sample.achievements)[number] }) {
  return (
    <>
      <p className={styles.recMeta}>{a.meta}</p>
      <h3 className={styles.recTitle}>{a.title}</h3>
      <p className={styles.recDesc}><Emph text={a.desc} /></p>
      {"href" in a && a.href ? (
        <a href={a.href} className={styles.recLink} target="_blank" rel="noreferrer">
          Read the Paper <span aria-hidden="true" className={styles.ctaArrow}>↗</span>
        </a>
      ) : null}
    </>
  );
}

/** V1, current locked recognition: two cards side by side. */
function RecognitionV1() {
  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Recognition</h2>
      <div className={styles.recGrid}>
        {sample.achievements.map((a) => (
          <article key={a.title} className={styles.recCard}><Body a={a} /></article>
        ))}
      </div>
    </section>
  );
}

/** V2, inline list, dashed rule between items (quieter, less boxy). */
function RecognitionV2() {
  return (
    <section className={alt.section}>
      <h2 className={styles.h2}>Recognition</h2>
      <div className={alt.list}>
        {sample.achievements.map((a) => (
          <article key={a.title} className={alt.item}><Body a={a} /></article>
        ))}
      </div>
    </section>
  );
}

/** V3, accent-marked cards: a restrained coral rule down the left edge. */
function RecognitionV3() {
  return (
    <section className={alt.section}>
      <h2 className={styles.h2}>Recognition</h2>
      <div className={alt.grid}>
        {sample.achievements.map((a) => (
          <article key={a.title} className={alt.accentCard}><Body a={a} /></article>
        ))}
      </div>
    </section>
  );
}

export function Recognition({ variant = 1 }: { variant?: SectionVariant }) {
  if (variant === 2) return <RecognitionV2 />;
  if (variant === 3) return <RecognitionV3 />;
  return <RecognitionV1 />;
}
