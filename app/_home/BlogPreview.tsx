import Link from "next/link";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";
import { getAllPosts, isDev } from "../blog/lib/posts";
import { postDateLabel } from "../blog/lib/types";

/**
 * Writing, landing treatment: the newest posts from content/blog as the
 * locked V1 horizontal cards, linking through to /blog for the full list.
 * Under `next dev` drafts show too, marked Draft, so the preview can be
 * checked before publishing.
 */
const PREVIEW_COUNT = 3;

export async function BlogPreview() {
  const all = await getAllPosts();
  const posts = all.slice(0, PREVIEW_COUNT);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Writing</h2>
        <Link href="/blog" className={styles.postRead}>
          All Posts <span aria-hidden="true" className={styles.ctaArrow}>→</span>
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className={styles.postDek}>No posts yet.</p>
      ) : (
        <div className={styles.postList}>
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className={`${styles.postCard} ${home.blogCard} ${p.cover ? "" : home.blogCardText}`}
            >
              <div>
                <div className={styles.postMeta}>
                  <time className={styles.postDate} dateTime={p.publishedAt ?? p.updatedAt}>
                    {postDateLabel(p)}
                  </time>
                  <span className={styles.postDate} aria-hidden="true">·</span>
                  <span className={styles.postDate}>{p.readTime}</span>
                  {isDev && p.status === "draft" ? <span className={styles.postTopic}>Draft</span> : null}
                </div>
                <h3 className={styles.postTitle}>{p.title || "Untitled"}</h3>
                {p.dek ? <p className={styles.postDek}>{p.dek}</p> : null}
                <span className={styles.postRead}>
                  Read the Post <span aria-hidden="true" className={styles.ctaArrow}>→</span>
                </span>
              </div>
              {p.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.postThumb} src={p.cover} alt={p.coverAlt ?? ""} />
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
