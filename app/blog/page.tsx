import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Row } from "../_brand/kit";
import { BlogShell } from "./BlogShell";
import b from "./blog.module.css";
import { createPost } from "./actions";
import { getAllPosts, isDev } from "./lib/posts";
import { postDateLabel } from "./lib/types";
import { StatusBadge, Tags } from "./Topbar";
import { CoverThumb } from "./Cover";

export const metadata: Metadata = {
  title: "Writing | Kyle Naranjo",
  description: "Notes and interactive explainers by Kyle Naranjo.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Writing | Kyle Naranjo", url: "/blog", type: "website" },
};

/**
 * /blog, every published post newest first, one frame row per post. Under
 * `next dev` the list also shows drafts (they open in the editor) and a New
 * Post button; production 404s until the first post is published.
 */
export default async function BlogIndex() {
  const posts = await getAllPosts();
  if (!isDev && posts.length === 0) notFound();

  return (
    <BlogShell
      active="writing"
      actions={
        isDev ? (
          <form action={createPost}>
            <button type="submit" className={b.btn}>New Post</button>
          </form>
        ) : null
      }
    >

        <Row>
          <div className={b.pageHead}>
            <h1 className={b.pageTitle}>Writing</h1>
            <p className={b.pageNote}>Notes and interactive explainers on data, evals, and the tools behind them.</p>
          </div>

          {posts.length === 0 ? (
            <p className={b.empty}>No posts yet. Use New Post to start a draft.</p>
          ) : (
            posts.map((p, i) => (
              <Link
                key={p.slug}
                href={p.status === "draft" ? `/blog/${p.slug}/edit` : `/blog/${p.slug}`}
                className={b.postRow}
              >
                <div className={b.postCells}>
                  <div className={b.postMetaCell}>
                    <b>{postDateLabel(p)}</b>
                    <span>{p.readTime}</span>
                    {isDev ? <span style={{ marginTop: 8 }}><StatusBadge status={p.status} /></span> : null}
                  </div>
                  <div className={b.postMain}>
                    <span className={b.postNum}>{String(posts.length - i).padStart(2, "0")}</span>
                    <h2 className={b.postTitle}>{p.title || "Untitled"}</h2>
                    {p.dek ? <p className={b.postDek}>{p.dek}</p> : null}
                    <Tags tags={p.tags} />
                  </div>
                  <div className={b.thumbCell}>
                    <CoverThumb post={p} />
                  </div>
                </div>
              </Link>
            ))
          )}
        </Row>

        <Row>
          <footer className={b.foot}>
            <span>© 2026 Kyle Naranjo</span>
            <Link href="/">kylenaranjo.cv</Link>
          </footer>
        </Row>
    </BlogShell>
  );
}
