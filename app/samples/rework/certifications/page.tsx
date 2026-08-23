import { Compare } from "../../sections/Compare";
import { Certifications } from "../../quiet/sections/Certifications";
import { CertificationsTable } from "../../../_home/CertificationsTable";
import home from "../../../_home/home.module.css";

export default function CertificationsRework() {
  return (
    <Compare
      title="Certifications"
      hint="Ten credentials, four ways. A is the current landing design. B drops the blurbs and reads as a registry (on the real page it sits on a full-width tinted band); C and D keep the blurbs."
      recommend={<>B if you want the section to feel different from the cards around it; C if you want issuer breadth to lead while staying carded.</>}
      variants={[
        { label: "A", note: "current, clickable badge cards, 2-col grid", node: <Certifications variant={1} /> },
        { label: "B", note: "registry table, mono column heads, issuer ditto-grouping, no cards (tinted band on the real page)", node: <div className={home.bandTint}><CertificationsTable /></div> },
        { label: "C", note: "grouped by issuer, one carded group per issuer, credential rows inside", node: <Certifications variant={2} /> },
        { label: "D", note: "badge wall, 3-col big-logo cards", node: <Certifications variant={3} /> },
      ]}
    />
  );
}
