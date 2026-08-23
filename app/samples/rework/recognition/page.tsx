import { Compare } from "../../sections/Compare";
import { Recognition } from "../../quiet/sections/Recognition";
import { RecognitionColumns } from "../../../_home/RecognitionColumns";

export default function RecognitionRework() {
  return (
    <Compare
      title="Recognition"
      hint="Three achievements, four ways. A is the current landing design. B parts them into equal columns each opened by a 2px ink rule, a heavier, more Swiss texture than anything else on the page."
      recommend={<>B reads most distinct at a glance; A stays the quietest.</>}
      variants={[
        { label: "A", note: "current, inline list, dashed rules between items", node: <Recognition variant={2} /> },
        { label: "B", note: "footnote columns, three columns under 2px ink rules, underlined text link", node: <RecognitionColumns /> },
        { label: "C", note: "two cards side by side", node: <Recognition variant={1} /> },
        { label: "D", note: "accent-marked cards, coral rule down the left edge", node: <Recognition variant={3} /> },
      ]}
    />
  );
}
