import type { Metadata } from "next";
import { Fragment } from "react";
import { BrandRoot } from "../../_brand/kit";
import { ANSWERS } from "./answers";
import v from "./voice.module.css";

export const metadata: Metadata = { title: "KYLLM Voice | Samples", robots: { index: false, follow: false } };

/**
 * /samples/kyllm-voice: options for KYLLM's starter questions, and its tone in
 * three versions of the prompt's voice line, each shown with real answers from
 * the local eval.
 */

const STARTERS = [
  { name: "A. Current", note: "What the chat shows now.", qs: ["Tell me more about Kyle", "What has he built with AI agents?", "Which talks has he given?"] },
  { name: "B. Plain", note: "The first question asked the way a visitor would.", qs: ["What does Kyle do?", "What has he built with AI agents?", "Which talks has he given?"] },
  { name: "C. Shows the Blocks", note: "One question each that draws a diagram and a chart.", qs: ["What does Kyle do?", "How does Wishlist work?", "When did he get his certifications?"] },
  { name: "D. Casual", note: "Short and loose, closer to how you talk.", qs: ["Who's Kyle?", "What's he working on?", "How does Wishlist work?"] },
];

const TONES = [
  { key: "formal", name: "1. Current: Slightly Formal", line: "Write in a straightforward, slightly formal voice.", score: "27/30" },
  { key: "friendly", name: "2. Friendly Colleague", line: "Warm, plain, relaxed; contractions and everyday words; answer first.", score: "26/30" },
  { key: "kyle", name: "3. Your Voice", line: "Casual and direct, like a quick reply to a friend; answer first, no corporate words.", score: "27/30" },
] as const;

/** An answer with its [n] citations drawn as the chat's small number chips. */
const Answer = ({ text }: { text: string }) => (
  <p className={v.answer}>
    {text.split(/(\[\d+\])/).map((part, i) => (/^\[\d+\]$/.test(part) ? <span key={i} className={v.cite}>{part.slice(1, -1)}</span> : <Fragment key={i}>{part}</Fragment>))}
  </p>
);

export default function Page() {
  return (
    <BrandRoot className={v.page}>
      <div className={v.wrap}>
        <h1 className={v.title}>KYLLM Starters and Voice</h1>

        <h2 className={v.h2}>Starter Questions</h2>
        <p className={v.lede}>The three questions under an empty chat. The hero bar that types example questions would use the same set.</p>
        <div className={v.starters}>
          {STARTERS.map((s) => (
            <section key={s.name} className={v.card}>
              <h3 className={v.name}>{s.name}</h3>
              <p className={v.note}>{s.note}</p>
              <div className={v.pills}>{s.qs.map((q) => <span key={q} className={v.pill}>{q}<span aria-hidden="true">→</span></span>)}</div>
            </section>
          ))}
        </div>

        <h2 className={v.h2}>Tone</h2>
        <p className={v.lede}>Each column is the same prompt with a different voice line, asked the same six questions on local Claude Code. The score is how many of the 30 eval questions passed every check.</p>
        <div className={v.tones}>
          {TONES.map((t) => (
            <div key={t.key} className={v.toneHead}>
              <h3 className={v.name}>{t.name}</h3>
              <p className={v.note}>{t.line} Eval: {t.score}.</p>
            </div>
          ))}
          {ANSWERS.map((a) => (
            <Fragment key={a.id}>
              <div className={v.q}>{a.q}</div>
              {TONES.map((t) => <div key={t.key} className={v.cell}><Answer text={a.answers[t.key]} /></div>)}
            </Fragment>
          ))}
        </div>
      </div>
    </BrandRoot>
  );
}
