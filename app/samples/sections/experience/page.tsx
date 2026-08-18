import { Compare } from "../Compare";
import { Experience } from "../../quiet/sections/Experience";

export default function ExperienceCompare() {
  return (
    <Compare
      title="Experience"
      hint="Same roles, summaries, bullets, metrics and stack in each — only the layout of the card and the period changes."
      recommend={<>V3 (clean full-width) — dropping the narrow date rail gives the bullets and metrics more room and reads better on mobile, while keeping V1&rsquo;s familiar order.</>}
      variants={[
        { label: "V1", note: "current — date rail on the left, carded body, outcome strip inside", node: <Experience variant={1} /> },
        { label: "V2", note: "outcome-forward — a filled metric banner leads the case, no rail", node: <Experience variant={2} /> },
        { label: "V3", note: "clean full-width — no rail, period inline, V1's content order", node: <Experience variant={3} /> },
      ]}
    />
  );
}
