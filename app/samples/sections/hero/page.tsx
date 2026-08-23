import { Compare } from "../Compare";
import { Hero } from "../../quiet/sections/Hero";

export default function HeroCompare() {
  return (
    <Compare
      title="Hero"
      hint="Same headline and content in each, only the layout and emphasis differ. The graph-paper backdrop is clipped to the frame here; on the real page it bleeds wider."
      recommend={<>V4 (photo), your pick: V1&rsquo;s headline treatment in a two-column layout, with a framed photo where the stats panel was. Drop a real portrait in to replace the placeholder.</>}
      variants={[
        { label: "V4", note: "your pick, photo (mix of V1 + V2), placeholder until you add a portrait", node: <Hero variant={4} /> },
        { label: "V1", note: "current, graph-paper backdrop, two-tone headline, CTA + contacts", node: <Hero variant={1} /> },
        { label: "V2", note: "stat-anchored, headline left, a selected-outcome proof panel right", node: <Hero variant={2} /> },
        { label: "V3", note: "centered editorial, no grid, larger headline, calmer", node: <Hero variant={3} /> },
      ]}
    />
  );
}
