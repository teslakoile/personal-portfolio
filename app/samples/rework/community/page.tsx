import { Compare } from "../../sections/Compare";
import { Community } from "../../quiet/sections/Community";
import { CommunityBillboard } from "../../../_home/CommunityBillboard";

export default function CommunityRework() {
  return (
    <Compare
      title="Community & Speaking"
      hint="Same content in both. A is the current landing design (the converged impact-ledger cards). B removes all surfaces: GDG's numbers become oversized billboard figures parted by hairlines, Global Shapers becomes a one-line footnote, and the talks become a numbered index."
      recommend={<>A if you like the KPI strip contained; B if you want the 2,000+ figures to carry the section on their own.</>}
      variants={[
        { label: "A", note: "current — two org cards with a KPI strip, talks as hairline rows", node: <Community /> },
        { label: "B", note: "stat billboard — uncarded jumbo numerals, ledger footnote, numbered talk index", node: <CommunityBillboard /> },
      ]}
    />
  );
}
