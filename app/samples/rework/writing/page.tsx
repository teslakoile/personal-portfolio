import { Compare } from "../../sections/Compare";
import { Writing } from "../../quiet/sections/Writing";
import { WritingFeatures } from "../../../_home/WritingFeatures";

export default function WritingRework() {
  return (
    <Compare
      title="Writing"
      hint="Same two posts in each. A is the current landing design. B removes the cards entirely — open editorial spreads with bigger serif titles and the tags folded into one mono meta line."
      recommend={<>B gives the section its own voice and the titles room to breathe; A stays safer and more compact.</>}
      variants={[
        { label: "A", note: "current — horizontal cards, text left + media right", node: <Writing variant={1} /> },
        { label: "B", note: "editorial spreads — uncarded alternating rows, oversized serif titles, mono meta line", node: <WritingFeatures /> },
        { label: "C", note: "stacked feature — first post large with media on top, second compact", node: <Writing variant={2} /> },
        { label: "D", note: "two-up — vertical cards side by side, media on top", node: <Writing variant={3} /> },
      ]}
    />
  );
}
