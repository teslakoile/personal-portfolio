import { Compare } from "../../sections/Compare";
import {
  Recommendations,
  RecommendationsQuotes,
  RecommendationsLedger,
  RecommendationsBlurbs,
  RecommendationsBubbles,
  RecommendationsThread,
  RecommendationsLetters,
  RecommendationsMarginNotes,
  RecommendationsComic,
  RecommendationsDialogs,
  RecommendationsChat,
  RecommendationsLog,
  RecommendationsMosaic,
} from "../../../_home/Recommendations";
import { RecommendationsStage } from "../../../_home/RecommendationsStage";

export default function RecommendationsRework() {
  return (
    <Compare
      title="Recommendations"
      hint="All fourteen render the MOCK quotes (swap in real ones in sampleContent.ts before deploying). N is the landing design; A was the previous one. E through N all carry profile chips: initials until real headshots land in sampleContent (avatar field), then photos drop in with no layout change. H additionally reads an optional highlight field (a verbatim substring of the quote) for its coral wash. K to M are the shaped options, the container is the idea: a comic balloon, an OS dialog, a chat window. In every treatment the recommender's name links to their LinkedIn profile when sampleContent sets href, so capture the profile URL when porting each real quote."
      recommend={<>N is the direction settled after the reference pass: the masonry Kyle liked on the Leo Moschen reference, with the tweet-card DNA swapped for the paper, serif, and mono via-LinkedIn grammar of this site. H stays the strongest quiet alternate; K the boldest shaped one. Keep I manual, never autoplay.</>}
      variants={[
        { label: "A", note: "previous landing design, three quote cards in a row", node: <Recommendations /> },
        { label: "B", note: "pull-quote stack, serif quotes, hanging coral mark, lead quote oversized", node: <RecommendationsQuotes /> },
        { label: "C", note: "reference ledger, attribution rail left (coral tick, name, title), quote right, hairline rows", node: <RecommendationsLedger /> },
        { label: "D", note: "blurb wall, run-in book-blurb paragraphs, bold name leads the line, short rules between entries", node: <RecommendationsBlurbs /> },
        { label: "E", note: "speech bubbles, tinted bubbles with hairline tails alternating down a column, avatar + name under each tail", node: <RecommendationsBubbles /> },
        { label: "F", note: "attribution thread, avatar chips on a hairline spine, who-said-it leads, facepile in the head row", node: <RecommendationsThread /> },
        { label: "G", note: "reference letters, three sheets fanned off square, mono Re: letterhead, headshot signature block over a coral pen rule, hover squares the sheet", node: <RecommendationsLetters /> },
        { label: "H", note: "margin notes, manuscript quote with the key phrase in a coral wash, recommender as a doc-review comment chip (avatar + name) in the right margin", node: <RecommendationsMarginNotes /> },
        { label: "I", note: "spotlight stage, one oversized quote at a time, facepile tab rail switches speakers, mono counter (interactive)", node: <RecommendationsStage /> },
        { label: "J", note: "commit log, git log output with coral short-hash + avatar + author meta line, quote indented as the commit message", node: <RecommendationsLog /> },
        { label: "K", note: "comic balloons, ink-outlined speech balloons with pointed tails, coral halftone dot shadow behind each (the hero portrait's print grammar), hover lifts the balloon off its dots", node: <RecommendationsComic /> },
        { label: "L", note: "dialog boxes, each quote as an OS dialog: window lights + mono filename in the bar, speaker + deadpan OK button in the footer, windows cascade", node: <RecommendationsDialogs /> },
        { label: "M", note: "chat window, one app frame holds the section: #channel title bar, hoverable message rows, footer where the input would be invites the next recommendation on LinkedIn", node: <RecommendationsChat /> },
        { label: "N", note: "mosaic (CURRENT landing design), staggered ghost-card masonry of paper cards, attribution leads with chip + name + role, serif quote with coral marks, mono via-LinkedIn foot", node: <RecommendationsMosaic /> },
      ]}
    />
  );
}
