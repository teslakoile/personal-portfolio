import { Compare } from "../../sections/Compare";
import {
  Recommendations,
  RecommendationsQuotes,
  RecommendationsLedger,
  RecommendationsBlurbs,
  RecommendationsBubbles,
  RecommendationsThread,
} from "../../../_home/Recommendations";

export default function RecommendationsRework() {
  return (
    <Compare
      title="Recommendations"
      hint="All six render the MOCK quotes (swap in real ones in sampleContent.ts before deploying). A is the current landing design. E and F are the asset-led options: both render initials chips until real headshots land in sampleContent (avatar field), then photos drop in with no layout change."
      recommend={<>E answers the speech-bubble idea directly and is the only alternating layout on the page; F reads as a maintained log with a facepile in the head row. C stays the best text-only option.</>}
      variants={[
        { label: "A", note: "current, three quote cards in a row", node: <Recommendations /> },
        { label: "B", note: "pull-quote stack, serif quotes, hanging coral mark, lead quote oversized", node: <RecommendationsQuotes /> },
        { label: "C", note: "reference ledger, attribution rail left (coral tick, name, title), quote right, hairline rows", node: <RecommendationsLedger /> },
        { label: "D", note: "blurb wall, run-in book-blurb paragraphs, bold name leads the line, short rules between entries", node: <RecommendationsBlurbs /> },
        { label: "E", note: "speech bubbles, tinted bubbles with hairline tails alternating down a column, avatar + name under each tail", node: <RecommendationsBubbles /> },
        { label: "F", note: "attribution thread, avatar chips on a hairline spine, who-said-it leads, facepile in the head row", node: <RecommendationsThread /> },
      ]}
    />
  );
}
