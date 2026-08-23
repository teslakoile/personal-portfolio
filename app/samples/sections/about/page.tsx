import { Compare } from "../Compare";
import { About } from "../../quiet/sections/About";

export default function AboutCompare() {
  return (
    <Compare
      title="About"
      hint="Same two sentences of bio in each, the difference is how the focus areas and supporting facts are presented."
      recommend={<>V3 (at a glance), the labeled fact card reads like a CV and adds scannable structure without inventing content.</>}
      variants={[
        { label: "V1", note: "current, prose left, focus-area bullet list right", node: <About variant={1} /> },
        { label: "V2", note: "lead statement, focal first line, focus areas as a chip row", node: <About variant={2} /> },
        { label: "V3", note: "at a glance, prose left, a labeled fact card right", node: <About variant={3} /> },
      ]}
    />
  );
}
