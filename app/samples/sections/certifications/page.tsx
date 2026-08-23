import { Compare } from "../Compare";
import { Certifications } from "../../quiet/sections/Certifications";

export default function CertificationsCompare() {
  return (
    <Compare
      title="Certifications"
      hint="Same six credentials in each, every one clickable through to the cert, nothing hidden behind tabs or filters. The difference is how the issuer logos and grouping are used."
      recommend={<>V2 (grouped by issuer), leads with the provider logos and shows your breadth across Google Cloud, Microsoft, AWS and Databricks at a glance.</>}
      variants={[
        { label: "V1", note: "current, clickable badge grid, small logo chip", node: <Certifications variant={1} /> },
        { label: "V2", note: "grouped by issuer, logo-forward credential wall, shows provider breadth", node: <Certifications variant={2} /> },
        { label: "V3", note: "big-logo badges, a 3-up wall of credential cards, logo up top", node: <Certifications variant={3} /> },
      ]}
    />
  );
}
