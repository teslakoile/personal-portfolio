import { promises as fs } from "node:fs";
import path from "node:path";
import { readTime, type Post, type PostFile } from "./types";

/**
 * Server-only post loaders. Posts live in content/blog/*.json and ship with
 * the repo, so publishing is a commit: the editor flips `status`, git carries
 * it to Vercel. `next dev` sees drafts everywhere (list, home preview, post
 * page) so you can read them in place; production builds only see
 * `status: "published"`.
 */

export const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export const isDev = process.env.NODE_ENV === "development";

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function postPath(slug: string): string {
  if (!isValidSlug(slug)) throw new Error(`Invalid slug: ${slug}`);
  return path.join(POSTS_DIR, `${slug}.json`);
}

export async function readPostFile(slug: string): Promise<PostFile | null> {
  if (!isValidSlug(slug)) return null;
  try {
    return JSON.parse(await fs.readFile(postPath(slug), "utf8")) as PostFile;
  } catch {
    return null;
  }
}

function toPost(slug: string, file: PostFile): Post {
  return { ...file, slug, readTime: readTime(file.doc) };
}

/** Newest first: published by publish date, drafts by last edit. */
function sortKey(p: Post): string {
  return p.status === "published" ? (p.publishedAt ?? p.updatedAt) : p.updatedAt;
}

export async function getAllPosts({ includeDrafts = isDev } = {}): Promise<Post[]> {
  let names: string[] = [];
  try {
    names = await fs.readdir(POSTS_DIR);
  } catch {
    return [];
  }
  const posts = await Promise.all(
    names
      .filter((n) => n.endsWith(".json"))
      .map(async (n) => {
        const slug = n.slice(0, -5);
        const file = await readPostFile(slug);
        return file ? toPost(slug, file) : null;
      }),
  );
  return posts
    .filter((p): p is Post => p !== null)
    .filter((p) => includeDrafts || p.status === "published")
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
}

export async function getPost(slug: string, { includeDrafts = isDev } = {}): Promise<Post | null> {
  const file = await readPostFile(slug);
  if (!file) return null;
  if (!includeDrafts && file.status !== "published") return null;
  return toPost(slug, file);
}
