import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Row } from "../../_brand/kit";
import { BlogShell } from "../BlogShell";
import b from "../blog.module.css";
import { getAllPosts, getPost, isDev } from "../lib/posts";
import { docText, postDateLabel, slugify } from "../lib/types";
import { PostBody } from "../render/PostBody";
import { StatusBadge, Tags } from "../Topbar";

type Props = { params: Promise<{ slug: string }> };

// production prerenders published posts only and 404s any other slug; under
// `next dev` the params list includes drafts, so they open here too
export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  const title = `${post.title || "Untitled"} | Kyle Naranjo`;
  return {
    title,
    description: post.dek || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    robots: post.status === "draft" ? { index: false } : undefined,
    openGraph: {
      title,
      description: post.dek || undefined,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      images: post.cover ? [{ url: post.cover, alt: post.coverAlt || post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.dek || undefined,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  // h2s in document order, numbered in the rail as they are in the prose
  const toc = (post.doc.content ?? [])
    .filter((n) => n.type === "heading" && Number(n.attrs?.level) !== 3)
    .map((n) => ({ id: slugify(docText(n)), label: docText(n) }));

  return (
    <BlogShell
      active="writing"
      toc={toc}
      actions={
        isDev ? (
          <>
            <StatusBadge status={post.status} />
            <Link href={`/blog/${post.slug}/edit`} className={b.btn}>Edit</Link>
          </>
        ) : null
      }
    >

        <article>
          <Row>
            <header className={b.postHead}>
              <div className={b.postHeadIn}>
                <p className={b.postMeta}>
                  <time dateTime={post.publishedAt ?? post.updatedAt}>{postDateLabel(post)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{post.readTime}</span>
                </p>
                <h1 className={b.postH1}>{post.title || "Untitled"}</h1>
                {post.dek ? <p className={b.postSub}>{post.dek}</p> : null}
                <Tags tags={post.tags} />
                {post.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={b.coverImg} src={post.cover} alt={post.coverAlt ?? ""} />
                ) : null}
              </div>
            </header>
          </Row>
          <PostBody doc={post.doc} />
        </article>

        <Row>
          <footer className={b.foot}>
            <Link href="/blog" className={b.back}>
              <span className={b.backArrow} aria-hidden="true">←</span>
              All Posts
            </Link>
            <Link href="/">Kyle Naranjo</Link>
          </footer>
        </Row>
    </BlogShell>
  );
}
