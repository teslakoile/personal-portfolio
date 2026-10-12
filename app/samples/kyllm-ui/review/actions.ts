"use server";

import { promises as fs } from "node:fs";
import { isDev, readReviews, REVIEW_FILE } from "./store";
import { isEmpty, type Review } from "./types";

/**
 * Saves one part's review to review.json. Like the blog editor, it writes to
 * the repo, so it only runs under `next dev`; production refuses every call.
 */
export async function saveReview(name: string, entry: Omit<Review, "at">) {
  if (!isDev) throw new Error("Reviews only save under `next dev`.");
  const all = await readReviews();
  if (isEmpty(entry)) delete all[name];
  else all[name] = { verdict: entry.verdict, note: entry.note.trim(), ...(entry.pick ? { pick: entry.pick } : {}), at: new Date().toISOString() };
  const sorted = Object.fromEntries(Object.entries(all).sort(([a], [b]) => a.localeCompare(b)));
  await fs.writeFile(REVIEW_FILE, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}
