import { promises as fs } from "node:fs";
import path from "node:path";
import type { Reviews } from "./types";

export type { Review, ReviewPatch, Reviews, Verdict } from "./types";

export const isDev = process.env.NODE_ENV === "development";
export const REVIEW_FILE = path.join(process.cwd(), "app/samples/kyllm-ui/review/review.json");

/** Reads review.json beside this file; an empty set when it doesn't exist yet. */
export async function readReviews(): Promise<Reviews> {
  try {
    return JSON.parse(await fs.readFile(REVIEW_FILE, "utf8")) as Reviews;
  } catch {
    return {};
  }
}
