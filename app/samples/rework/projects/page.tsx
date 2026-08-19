import { Compare } from "../../sections/Compare";
import { Projects } from "../../../_home/Projects";

// Kyle's call: baseline A is THE design — the optional add-on variants
// (drag / spread / riffle) are retired from this page; their islands stay
// in app/_home in case one gets revived.
export default function ProjectsRework() {
  return (
    <Compare
      title="Projects"
      hint="The baseline, refined live on the landing page: the pile sprawls diagonally so each buried folder’s edge shows its slot, and the tab row stair-steps to match. Hovering a filed tab lifts the whole folder — card and attached tab — as the preview while the rest of the desk fans open around it; clicking the tab or the risen card pulls that project to the top, settling down out of your hand."
      recommend={<>This page now mirrors the landing baseline one-to-one — tune it here, ship it there.</>}
      variants={[
        { label: "A", note: "the baseline — sprawled pile: hover a filed tab and its folder rises whole while the desk fans open; click the tab or the risen card to pull it to the top", node: <Projects /> },
      ]}
    />
  );
}
