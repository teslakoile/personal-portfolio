import type { ReactNode } from "react";
import styles from "./styles.module.css";
import { Logo, techLogoKey } from "./Logo";

/**
 * Shared building blocks for the Quiet Blueprint home + its section-variation
 * comparison pages. Keeping these in one place means every variation reuses the
 * exact same emphasis rules, pills, and concept figure, no drift.
 */

// Exact factual substrings that get selectively bolded. Never paraphrased, if a
// metric is reworded in sampleContent.ts, update the matching entry here too.
export const EMPH = [
  "~15 million records", "~7 million unique customer keys", "10+ business units",
  "748,000 candidate duplicate pairs", ">99.9% accuracy", "over 4 hours", "under 1 hour",
  "five-tier confidence framework", "12 product types", "four customer segments",
  "10+ interconnected microservices", "~15-person",
  "~50 production API endpoints", "100+ reports per day", "two AWS regions",
  "six-course", "10+ in-person events", "2,000-plus participants", "500-plus official members",
  "13.9% improvement", "1.15 weighted average", "Top 5", "summa cum laude",
];

export function Emph({ text }: { text: string }): ReactNode {
  const hits = EMPH.filter((p) => text.includes(p)).sort((a, b) => text.indexOf(a) - text.indexOf(b));
  if (!hits.length) return text;
  const out: ReactNode[] = [];
  let rest = text;
  let key = 0;
  for (const phrase of hits) {
    const i = rest.indexOf(phrase);
    if (i === -1) continue;
    if (i > 0) out.push(rest.slice(0, i));
    out.push(<b key={key++} className={styles.emph}>{phrase}</b>);
    rest = rest.slice(i + phrase.length);
  }
  if (rest) out.push(rest);
  return out;
}

// Uniform pill: real logo where one exists, clean text otherwise.
export function Pill({ name }: { name: string }) {
  const key = techLogoKey(name);
  return (
    <span className={styles.pill}>
      {key ? <Logo name={key} size={14} className={styles.pillLogo} /> : null}
      {name}
    </span>
  );
}

export const CONTACT_KIND: Record<string, "email" | "linkedin" | "github"> = {
  Email: "email", LinkedIn: "linkedin", GitHub: "github",
};

/** Honest concept figure, clearly a concept, not a fake screenshot. */
export function ConceptThreshold() {
  const bars = [6, 10, 16, 22, 18, 11, 7, 5, 9, 15, 24, 30, 26, 17, 9];
  const W = 320, H = 150, pad = 14;
  const bw = (W - pad * 2) / bars.length;
  const max = Math.max(...bars);
  const thrIndex = 9;
  const thrX = pad + bw * thrIndex;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.conceptSvg} role="img" aria-label="Match-weight distribution with a threshold line">
      {bars.map((b, i) => {
        const h = (b / max) * (H - pad * 2 - 8);
        const isMatch = i >= thrIndex;
        return <rect key={i} x={pad + i * bw + 1.5} y={H - pad - h} width={bw - 3} height={h} rx={2} className={isMatch ? styles.barMatch : styles.barNon} />;
      })}
      <line x1={thrX} y1={pad - 4} x2={thrX} y2={H - pad} className={styles.thrLine} />
      <circle cx={thrX} cy={pad - 4} r={3} className={styles.thrDot} />
    </svg>
  );
}
