import { Compare } from "../Compare";
import { Writing } from "../../quiet/sections/Writing";

export default function WritingCompare() {
  return (
    <Compare
      title="Writing"
      hint="Same two posts in each, one uses a real image thumbnail, one a built-in concept figure. Only the card layout changes."
      recommend={<>V1 (current) or V3 (two-up), both are strong. V1 stays clean with two posts; V3&rsquo;s grid scales better once you publish more.</>}
      variants={[
        { label: "V1", note: "current, horizontal cards, text left + media right", node: <Writing variant={1} /> },
        { label: "V2", note: "stacked feature, first post large with media on top, second compact", node: <Writing variant={2} /> },
        { label: "V3", note: "two-up, vertical cards side by side, media on top", node: <Writing variant={3} /> },
      ]}
    />
  );
}
