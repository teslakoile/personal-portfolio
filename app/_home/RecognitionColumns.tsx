import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";
import { Emph } from "../samples/quiet/helpers";

/**
 * Recognition, landing treatment: Swiss footnote columns. Three equal columns,
 * each opened by a 2px ink rule (the page's only heavy-rule moment); the one
 * outbound link is a plain underlined accent link. Static by design, the quiet
 * passage between the stat billboard and the quotes. Carded variants: /samples.
 */
export function RecognitionColumns() {
  return (
    <section className={styles.section} aria-label="Recognition">
      <h2 className={styles.h2}>Recognition</h2>
      <div className={home.regCols}>
        {sample.achievements.map((a) => (
          <article key={a.title} className={home.regCol}>
            <p className={home.regMeta}>{a.meta}</p>
            <h3 className={home.regTitle}>{a.title}</h3>
            <p className={home.regDesc}><Emph text={a.desc} /></p>
            {"href" in a && a.href ? (
              <a className={home.regLink} href={a.href} target="_blank" rel="noreferrer">
                Read the Paper ↗
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
