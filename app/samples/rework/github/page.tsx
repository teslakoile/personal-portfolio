import { Compare } from "../../sections/Compare";
import {
  Contributions,
  ContributionsInk,
  ContributionsLedger,
  ContributionsPlate,
  ContributionsDotMatrix,
  ContributionsStrip,
} from "../../../_home/Contributions";

export default function GithubRework() {
  return (
    <Compare
      title="GitHub"
      hint="Same live data in all six (8,000+ contributions, refreshed twice a day). E and F are the white-background creative passes: E redraws the data itself (radius-scaled dots, bryllim-style, translated to paper), F blows the heatmap up into a dissolving texture with the total stamped over it."
      recommend={<>E — the punch-card dot matrix — is the most creative white-background display: size carries the data, coral only sparks on the peak days, and every dot answers hover. F is the poster alternative if you want scale instead of a plate.</>}
      variants={[
        { label: "A", note: "current — heatmap in a white card, caption + legend", node: <Contributions /> },
        { label: "B", note: "ink coda — full-bleed inverted band, bare heatmap, oversized total", node: <ContributionsInk /> },
        { label: "C", note: "closing ledger — paper spread, jumbo total in a stat column beside the bare coral field", node: <ContributionsLedger /> },
        { label: "D", note: "terminal plate — contained ink panel with a mono status bar, recolored ramp", node: <ContributionsPlate /> },
        { label: "E", note: "dot matrix — punch-card plate on white: ink dots sized by level, coral sparks on peak days, month rail, dot legend", node: <ContributionsDotMatrix /> },
        { label: "F", note: "year strip — column-bleed texture that dissolves at every edge, jumbo mono total stamped over the fade", node: <ContributionsStrip /> },
      ]}
    />
  );
}
