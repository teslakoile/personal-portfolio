"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { POSTS_DIR, isDev, isValidSlug, postPath, readPostFile } from "./lib/posts";
import { EMPTY_DOC, slugify, type DocNode, type PostFile } from "./lib/types";

/**
 * Editor mutations. They write straight to content/blog/ and public/blog/, so
 * they only run under `next dev`: Vercel's filesystem is read-only, and these
 * endpoints are reachable by direct POST, so production refuses every call.
 * Nothing calls revalidatePath: dev renders every request fresh, and a
 * revalidate after renamePost would refresh the old, now missing, URL.
 */
function assertDev() {
  if (!isDev) throw new Error("The blog editor only runs under `next dev`.");
}

async function writePost(slug: string, file: PostFile) {
  await fs.mkdir(POSTS_DIR, { recursive: true });
  await fs.writeFile(postPath(slug), JSON.stringify(file, null, 2) + "\n", "utf8");
}

async function freeSlug(base: string): Promise<string> {
  const root = base || "untitled";
  for (let i = 1; ; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    if (!(await readPostFile(candidate))) return candidate;
  }
}

/** Form action behind every "New Post" button: new draft file, then the editor. */
export async function createPost() {
  assertDev();
  const slug = await freeSlug("untitled");
  const now = new Date().toISOString();
  await writePost(slug, {
    title: "",
    dek: "",
    tags: [],
    cover: null,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    doc: EMPTY_DOC,
  });
  redirect(`/blog/${slug}/edit`);
}

export type SaveInput = {
  title: string;
  dek: string;
  tags: string[];
  cover: string | null;
  coverAlt: string;
  /** JSON.stringify of the editor doc. ProseMirror attrs objects lose their
   * fields in the Server Action serializer, a string arrives intact. */
  doc: string;
};

/** Autosave target. Returns the post's current slug and save time. */
export async function savePost(slug: string, input: SaveInput) {
  assertDev();
  const prev = await readPostFile(slug);
  if (!prev) throw new Error(`No post at ${slug}`);
  const updatedAt = new Date().toISOString();
  const doc = JSON.parse(input.doc) as DocNode;
  await writePost(slug, { ...prev, ...input, doc, updatedAt });
  return { slug, updatedAt };
}

export async function setStatus(slug: string, status: PostFile["status"]) {
  assertDev();
  const prev = await readPostFile(slug);
  if (!prev) throw new Error(`No post at ${slug}`);
  const now = new Date().toISOString();
  const next: PostFile = {
    ...prev,
    status,
    updatedAt: now,
    publishedAt: status === "published" ? (prev.publishedAt ?? now) : prev.publishedAt,
  };
  await writePost(slug, next);
  return { status: next.status, publishedAt: next.publishedAt, updatedAt: now };
}

/** Renames the file (and its image folder). Returns the slug actually used. */
export async function renamePost(slug: string, wanted: string) {
  assertDev();
  const target = slugify(wanted);
  if (!target || target === slug) return { slug };
  if (!isValidSlug(target)) throw new Error(`Invalid slug: ${wanted}`);
  if (await readPostFile(target)) throw new Error(`A post already uses "${target}".`);
  await fs.rename(postPath(slug), postPath(target));
  const oldImages = path.join(process.cwd(), "public", "blog", slug);
  const newImages = path.join(process.cwd(), "public", "blog", target);
  await fs.rename(oldImages, newImages).catch(() => {});
  // image srcs inside the doc point at the old folder
  const file = await readPostFile(target);
  if (file) {
    const fix = (s: string | null) => s?.split(`/blog/${slug}/`).join(`/blog/${target}/`) ?? null;
    const doc = JSON.parse(fix(JSON.stringify(file.doc))!) as DocNode;
    await writePost(target, { ...file, doc, cover: fix(file.cover) });
  }
  return { slug: target };
}

export async function deletePost(slug: string) {
  assertDev();
  await fs.rm(postPath(slug), { force: true });
  await fs.rm(path.join(process.cwd(), "public", "blog", slug), { recursive: true, force: true });
  redirect("/blog");
}

const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

/** Saves a dropped, pasted, or picked image under public/blog/<slug>/. */
export async function uploadImage(slug: string, form: FormData) {
  assertDev();
  if (!isValidSlug(slug)) throw new Error(`Invalid slug: ${slug}`);
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("No file");
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error(`Unsupported image type: ${file.type}`);
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const dir = path.join(process.cwd(), "public", "blog", slug);
  await fs.mkdir(dir, { recursive: true });
  const name = `${base}-${Date.now().toString(36)}.${ext}`;
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { src: `/blog/${slug}/${name}` };
}
