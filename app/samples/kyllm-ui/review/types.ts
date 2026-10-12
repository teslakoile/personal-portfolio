/** One verdict per part on /samples/kyllm-ui. Shared by the server store and the client controls. */
export type Verdict = "approve" | "change" | "drop";
/** `pick` is the option letter chosen where a part shows options (A, B, ...). */
export type Review = { verdict: Verdict | null; note: string; pick?: string; at: string };
export type Reviews = Record<string, Review>;
export type ReviewPatch = Partial<Pick<Review, "verdict" | "note" | "pick">>;

/** True when an entry carries nothing worth keeping. */
export const isEmpty = (e: Omit<Review, "at">) => !e.verdict && !e.note.trim() && !e.pick;
