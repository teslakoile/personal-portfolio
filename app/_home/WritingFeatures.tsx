import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";

/**
 * Writing — landing treatment: open editorial feature spreads. Uncarded
 * alternating image/text rows with oversized serif titles; the chip wall folds
 * into one mono meta line. Rows become links (image zoom + accent title on
 * hover) only when a post's `href` lands; today both are in progress, so the
 * honest postSoon note stays. The carded variants live on at /samples.
 */

const posts = sample.blog.posts;

function FeatureRow({ post, index }: { post: (typeof posts)[number]; index: number }) {
  const flip = index % 2 === 1;
  const meta = [
    String(index + 1).padStart(2, "0"),
    post.date,
    post.readTime,
    post.topic,
  ].join(" · ");

  const body = (
    <div>
      <p className={home.featMeta}>{meta}</p>
      <h3 className={home.featTitle}>{post.title}</h3>
      <p className={home.featDek}>{post.dek}</p>
      {post.href ? (
        <span className={styles.postRead}>
          Read the Explainer <span aria-hidden="true" className={styles.ctaArrow}>→</span>
        </span>
      ) : (
        <span className={styles.postSoon}>
          <span className={styles.postSoonDot} aria-hidden="true" />
          Explainer in Progress
        </span>
      )}
    </div>
  );

  const media = post.image ? (
    <div className={home.featMedia}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.image} alt={post.title} />
    </div>
  ) : null;

  const inner = (
    <>
      {body}
      {media}
    </>
  );

  const cls = `${home.featRow} ${flip ? home.featRowFlip : ""}`;
  if (post.href) {
    return <a href={post.href} className={cls}>{inner}</a>;
  }
  return <article className={cls}>{inner}</article>;
}

export function WritingFeatures() {
  return (
    <section className={styles.section} aria-label="Writing">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Writing</h2>
        <span className={home.secNote}>Interactive Explainers</span>
      </div>
      <div>
        {posts.map((post, i) => (
          <FeatureRow key={post.title} post={post} index={i} />
        ))}
      </div>
    </section>
  );
}
