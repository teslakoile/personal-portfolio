import { sample } from "../../sampleContent";
import styles from "../styles.module.css";
import alt from "./Writing.alt.module.css";
import { ConceptThreshold } from "../helpers";
import type { SectionVariant } from "./Hero";

const posts = sample.blog.posts;

function Media({ post }: { post: (typeof posts)[number] }) {
  if (post.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={alt.img} src={post.image} alt={post.title} />;
  }
  // fallback only, every real post carries a static thumbnail image
  return (
    <figure className={`${styles.conceptFig} ${alt.mediaConcept}`}>
      <ConceptThreshold />
      <figcaption className={styles.conceptCap}>Concept · interactive in the post</figcaption>
    </figure>
  );
}

function PostBody({ post }: { post: (typeof posts)[number] }) {
  return (
    <>
      <div className={alt.meta}>
        <time className={styles.postDate}>{post.date}</time>
        <span className={alt.metaSep} aria-hidden="true">·</span>
        <span className={styles.postDate}>{post.readTime}</span>
      </div>
      <h3 className={styles.postTitle}>{post.title}</h3>
      <p className={styles.postDek}>{post.dek}</p>
      <div className={alt.tagRow}>
        {post.tags.map((t) => <span key={t} className={styles.postTopic}>{t}</span>)}
      </div>
      {post.href ? (
        <a href={post.href} className={styles.postRead}>
          Read the Explainer <span aria-hidden="true" className={styles.ctaArrow}>→</span>
        </a>
      ) : (
        <span className={styles.postSoon}>
          <span className={styles.postSoonDot} aria-hidden="true" />
          Explainer in Progress
        </span>
      )}
    </>
  );
}

/** V1, current locked writing: horizontal cards, text left + image/concept right. */
function WritingV1() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Writing</h2>
        <span className={styles.sectionNote}>Interactive Explainers</span>
      </div>
      <div className={styles.postList}>
        {posts.map((post) => (
          <article key={post.title} className={styles.postCard}>
            <div className={styles.postLeft}>
              <PostBody post={post} />
            </div>
            {post.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.postThumb} src={post.image} alt={post.title} />
            ) : (
              <figure className={styles.conceptFig}>
                <ConceptThreshold />
                <figcaption className={styles.conceptCap}>Concept · interactive in the post</figcaption>
              </figure>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

/** V2, stacked feature: first post large (media on top), second compact. */
function WritingV2() {
  return (
    <section className={alt.section}>
      <div className={alt.headRow}>
        <h2 className={styles.h2}>Writing</h2>
        <span className={styles.sectionNote}>Interactive Explainers</span>
      </div>
      <div className={alt.featList}>
        <article className={alt.feature}>
          <div className={alt.featMedia}><Media post={posts[0]} /></div>
          <div className={alt.featBody}><PostBody post={posts[0]} /></div>
        </article>
        <article className={alt.compact}>
          <div><PostBody post={posts[1]} /></div>
          <div className={alt.compactMedia}><Media post={posts[1]} /></div>
        </article>
      </div>
    </section>
  );
}

/** V3, two-up vertical cards: media on top, text below. */
function WritingV3() {
  return (
    <section className={alt.section}>
      <div className={alt.headRow}>
        <h2 className={styles.h2}>Writing</h2>
        <span className={styles.sectionNote}>Interactive Explainers</span>
      </div>
      <div className={alt.grid2}>
        {posts.map((post) => (
          <article key={post.title} className={alt.vcard}>
            <div className={alt.vMedia}><Media post={post} /></div>
            <div className={alt.vBody}><PostBody post={post} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Writing({ variant = 1 }: { variant?: SectionVariant }) {
  if (variant === 2) return <WritingV2 />;
  if (variant === 3) return <WritingV3 />;
  return <WritingV1 />;
}
