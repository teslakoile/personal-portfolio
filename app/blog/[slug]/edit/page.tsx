import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandRoot, Frame } from "../../../_brand/kit";
import b from "../../blog.module.css";
import { isDev, readPostFile } from "../../lib/posts";
import { Editor } from "../../editor/Editor";

export const metadata: Metadata = { title: "Editing | Kyle Naranjo", robots: { index: false } };

/** /blog/<slug>/edit, the writing surface. It exists only under `next dev`. */
export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isDev) notFound();
  const { slug } = await params;
  const post = await readPostFile(slug);
  if (!post) notFound();
  return (
    <BrandRoot className={b.root}>
      <Frame>
        {/* keyed on creation time, which survives a slug rename */}
        <Editor key={post.createdAt} slug={slug} initial={post} />
      </Frame>
    </BrandRoot>
  );
}
