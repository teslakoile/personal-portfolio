import { Compare } from "../Compare";
import { Recognition } from "../../quiet/sections/Recognition";

export default function RecognitionCompare() {
  return (
    <Compare
      title="Recognition"
      hint="Same two items (Summa Cum Laude, the IEEE paper) in each, only the container treatment changes."
      recommend={<>V3 (accent-marked), the restrained coral rule gives these two honors a touch more presence than plain cards, using the one accent the rest of the page already uses.</>}
      variants={[
        { label: "V1", note: "current, two plain cards side by side", node: <Recognition variant={1} /> },
        { label: "V2", note: "inline list, no boxes, dashed rule between items", node: <Recognition variant={2} /> },
        { label: "V3", note: "accent-marked cards, a coral rule down the left edge", node: <Recognition variant={3} /> },
      ]}
    />
  );
}
