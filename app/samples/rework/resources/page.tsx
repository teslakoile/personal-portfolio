import { Compare } from "../../sections/Compare";
import {
  Resources,
  ResourcesBib,
  ResourcesContents,
  ResourcesSplit,
  ResourcesShelf,
  ResourcesPlates,
} from "../../../_home/Resources";

export default function ResourcesRework() {
  return (
    <Compare
      title="Resources"
      hint="Five picks, six ways. A is the current landing design. E and F are the imagery-led options, thumbnails are local files (the DDIA cover plus site marks), zero runtime requests."
      recommend={<>E is the section as a staff-picks shelf, the only place on the page an entry begins with an object; F keeps a list rhythm while the plate anchors each row. Both keep the personal notes prominent.</>}
      variants={[
        { label: "A", note: "current, 2-col card grid with kind chips", node: <Resources /> },
        { label: "B", note: "annotated bibliography, hanging-indent rows, mono gutter, no rules, hover wash", node: <ResourcesBib /> },
        { label: "C", note: "contents page, numbered rows with dot leaders running to a mono kind · source column", node: <ResourcesContents /> },
        { label: "D", note: "appendix split, sticky side heading, entries as ruled typographic blocks, biggest notes", node: <ResourcesSplit /> },
        { label: "E", note: "cover shelf, the book stands as a 3D cover with a coral bookmark, web picks sit as favicon plates on hairline ledges", node: <ResourcesShelf /> },
        { label: "F", note: "icon plate list, app-store rows, recessed image plate left, note gets the widest measure", node: <ResourcesPlates /> },
      ]}
    />
  );
}
