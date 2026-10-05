/**
 * Blog post shapes, shared by the server loaders, the renderer, and the
 * dev-only editor. A post is one JSON file at content/blog/<slug>.json; the
 * filename is the slug. `doc` is the editor's ProseMirror JSON, rendered to
 * React by app/blog/render/PostBody.tsx.
 */

export type PostStatus = "draft" | "published";

/** ProseMirror/Tiptap JSON node, the subset the renderer understands. */
export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

export type PostFile = {
  title: string;
  /** One-sentence subtitle, shown under the title and on cards. */
  dek: string;
  tags: string[];
  /** Cover image, a /public path: the post's lead image, its list and home
   * thumbnail, and its link preview. */
  cover: string | null;
  /** Alt text for the cover. */
  coverAlt?: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  /** Set on first publish, kept on unpublish so a re-publish keeps its date. */
  publishedAt: string | null;
  doc: DocNode;
};

export type Post = PostFile & {
  slug: string;
  readTime: string;
};

export const EMPTY_DOC: DocNode = { type: "doc", content: [{ type: "paragraph" }] };

/** Word count over every text node, embeds count as 0. */
export function docText(node: DocNode): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(docText).join(" ");
}

export function readTime(doc: DocNode): string {
  const words = docText(doc).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 230))} min read`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "2026-10-04" → "Oct 4, 2026" */
export function formatDate(iso: string | null): string {
  if (!iso) return "Unpublished";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

/** Card and header date: publish date, or the last edit while a draft. */
export function postDateLabel(p: Pick<PostFile, "status" | "publishedAt" | "updatedAt">): string {
  return p.status === "published" && p.publishedAt ? formatDate(p.publishedAt) : `Edited ${formatDate(p.updatedAt)}`;
}
