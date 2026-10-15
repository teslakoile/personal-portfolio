"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { saveReview } from "./actions";
import { isEmpty, type ReviewPatch, type Reviews, type Verdict } from "./types";
import r from "./review.module.css";

/*
 * Review mode for the parts page: each part gets Approve, Change, or Drop and
 * an optional note; parts that show options also take a pick (A, B, ...).
 * Every change saves to review.json under `next dev`; the bar in the corner
 * counts progress. Parts already decided (approved or dropped) stay hidden
 * unless revised since the mark; the bar's toggle shows them again.
 */

type Ctx = {
  enabled: boolean;
  reviews: Reviews;
  set: (name: string, patch: ReviewPatch) => void;
  showDecided: boolean;
};
const ReviewCtx = createContext<Ctx>({ enabled: false, reviews: {}, set: () => {}, showDecided: false });

const VERDICTS: [Verdict, string, string][] = [
  ["approve", "Approve", "M20 6L9 17l-5-5"],
  ["change", "Change", "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"],
  ["drop", "Drop", "M18 6L6 18M6 6l12 12"],
];

// how many parts the page shows, counted from the DOM so adding a part needs no edit here
const noop = () => () => {};
const countCards = () => document.querySelectorAll("[data-review]").length;

export function ReviewProvider({ initial, enabled, children }: { initial: Reviews; enabled: boolean; children: ReactNode }) {
  const total = useSyncExternalStore(noop, countCards, () => 0);
  const [reviews, setReviews] = useState(initial);
  const [showDecided, setShowDecided] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timers = useRef<Record<string, number>>({});

  // optimistic: update now, save after a short pause so a typed note saves once
  const set = (name: string, patch: ReviewPatch) => {
    const cur = reviews[name];
    const entry = { verdict: cur?.verdict ?? null, note: cur?.note ?? "", pick: cur?.pick, ...patch };
    setReviews((all) => {
      const next = { ...all };
      if (isEmpty(entry)) delete next[name];
      else next[name] = { ...entry, at: new Date().toISOString() };
      return next;
    });
    window.clearTimeout(timers.current[name]);
    setSaving("saving");
    timers.current[name] = window.setTimeout(() => {
      saveReview(name, entry).then(() => setSaving("saved"), () => setSaving("error"));
    }, 450);
  };

  const list = Object.values(reviews);
  const count = (v: Verdict) => list.filter((e) => e.verdict === v).length;
  const done = list.filter((e) => e.verdict).length;

  return (
    <ReviewCtx.Provider value={{ enabled, reviews, set, showDecided }}>
      {children}
      {enabled ? (
        <div className={r.bar} role="region" aria-label="Review progress">
          <span className={r.progress}><i style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></span>
          <b>{done} of {total} reviewed</b>
          <span className={r.counts}>
            <em data-v="approve">{count("approve")} approve</em>
            <em data-v="change">{count("change")} change</em>
            <em data-v="drop">{count("drop")} drop</em>
          </span>
          <button type="button" className={r.filter} aria-pressed={showDecided} onClick={() => setShowDecided((x) => !x)}>
            {showDecided ? "Hide decided" : `Show decided (${count("approve") + count("drop")})`}
          </button>
          <small data-state={saving}>{saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : saving === "error" ? "Not saved" : ""}</small>
        </div>
      ) : null}
    </ReviewCtx.Provider>
  );
}

/** True when a part was changed after Kyle last marked it, so it needs another look. */
const isRevised = (at: string | undefined, revised?: string) => !!revised && (!at || at < revised);

/** The item's frame: carries its verdict for styling, and hides once decided (approved or dropped) unless revised since. */
export function ReviewCard({ name, revised, className, children }: { name: string; revised?: string; className: string; children: ReactNode }) {
  const { enabled, reviews, showDecided } = useContext(ReviewCtx);
  const cur = reviews[name];
  const v = cur?.verdict ?? undefined;
  const decided = (v === "approve" || v === "drop") && !isRevised(cur?.at, revised);
  return (
    <div className={className} data-review={name} data-verdict={v} hidden={enabled && decided && !showDecided}>
      {children}
    </div>
  );
}

export function ReviewButtons({ name }: { name: string }) {
  const { enabled, reviews, set } = useContext(ReviewCtx);
  if (!enabled) return null;
  const cur = reviews[name];
  return (
    <span className={r.buttons} role="group" aria-label={`Review ${name}`}>
      {VERDICTS.map(([v, label, d]) => (
        <button key={v} type="button" data-v={v} aria-pressed={cur?.verdict === v}
          onClick={() => set(name, { verdict: cur?.verdict === v ? null : v })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>{label}
        </button>
      ))}
    </span>
  );
}

/** Option picker for parts that show A, B, C... Picking one also approves the part. */
export function ReviewPick({ name, options }: { name: string; options: string[] }) {
  const { enabled, reviews, set } = useContext(ReviewCtx);
  if (!enabled) return null;
  const cur = reviews[name];
  return (
    <div className={r.pick} role="group" aria-label={`Pick an option for ${name}`}>
      <span>Your pick</span>
      {options.map((o, i) => {
        const id = String.fromCharCode(65 + i);
        const on = cur?.pick === id;
        return (
          <button key={id} type="button" aria-pressed={on}
            onClick={() => set(name, on ? { pick: undefined } : { pick: id, verdict: "approve" })}>
            <b>{id}</b>{o}
          </button>
        );
      })}
    </div>
  );
}

/** A note field, open once the part is marked Change or Drop, or already has a note. */
export function ReviewNote({ name }: { name: string }) {
  const { enabled, reviews, set } = useContext(ReviewCtx);
  const cur = reviews[name];
  const [draft, setDraft] = useState(cur?.note ?? "");
  const field = useRef<HTMLTextAreaElement>(null);
  const v = cur?.verdict;
  const open = enabled && (v === "change" || v === "drop" || !!cur?.note);
  // focus the note when Change or Drop is picked, not for marks loaded with the page
  const seen = useRef(v);
  useEffect(() => {
    if (v !== seen.current && (v === "change" || v === "drop")) field.current?.focus({ preventScroll: true });
    seen.current = v;
  }, [v]);
  if (!open) return null;
  return (
    <textarea ref={field} className={r.note} data-v={v ?? undefined} rows={2} value={draft}
      placeholder={v === "drop" ? "Why drop it? (optional)" : v === "change" ? "What should change?" : "Note"}
      onChange={(e) => { setDraft(e.target.value); set(name, { note: e.target.value }); }} />
  );
}

/** "Revised since your mark", shown until the part is marked again. */
export function RevisedTag({ name, revised }: { name: string; revised: string }) {
  const { enabled, reviews } = useContext(ReviewCtx);
  if (!enabled || !reviews[name] || !isRevised(reviews[name].at, revised)) return null;
  return <span className={r.revised}>Revised since your mark</span>;
}
