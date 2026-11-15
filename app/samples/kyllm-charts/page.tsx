import type { Metadata } from "next";
import { ShadcnDefault, ShadcnRich, ShadcnSite } from "./ShadcnCharts";
import c from "./charts.module.css";

export const metadata: Metadata = { title: "KYLLM Charts: shadcn | Samples", robots: { index: false, follow: false } };

/**
 * /samples/kyllm-charts: the certification charts drawn with shadcn's chart
 * component (Recharts 3.8.0), as shadcn styles them and themed to the KYLLM
 * block standard. Exploration only; the comparison with our SVG and dbt
 * Charts lives in the "KYLLM Block Standards" artifact.
 */
export default function Page() {
  const kinds = ["columns", "bars", "timeline"] as const;
  return (
    <div className={c.shadcn}>
      <div className={c.wrap}>
        <div className={c.grid}>
          <div className={c.colHead}>shadcn, Default</div>
          <div className={c.colHead}>shadcn, Themed to the Site</div>
          <div className={c.colHead}>shadcn, Themed With Axes</div>
          <div className={c.colHead}>With Logos</div>
          {kinds.map((k) => (
            <div key={k} style={{ display: "contents" }}>
              <div className={c.cell} id={`default-${k}`}><ShadcnDefault kind={k} /></div>
              <div className={c.cell} id={`site-${k}`}><ShadcnSite kind={k} /></div>
              <div className={c.cell} id={`rich-${k}`}><ShadcnRich kind={k} /></div>
              <div className={c.cell} id={`logo-${k}`}><ShadcnRich kind={k} logos /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
