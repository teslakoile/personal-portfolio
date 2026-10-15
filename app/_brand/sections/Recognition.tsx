import { sample } from "../../samples/sampleContent";
import { Row, SectionHead } from "../kit";
import { orgLogo } from "../logos";
import { OrgLink } from "../OrgLink";
import { bare } from "../format";
import b from "../brand.module.css";
import s from "./sections.module.css";

/** Recognition: one cell per item, a dated label, the title, and the line that
    backs it. Read from sampleContent.ts `achievements`. */
export function Recognition({ num }: { num?: string }) {
  return (
    <Row id="recognition">
      <SectionHead num={num} title="Recognition" />
      <div className={s.grid}>
        {sample.achievements.map((a) => {
          // "IEEE · Published Nov 27, 2023": the organization links, the date does not
          const [org, ...rest] = a.meta.split(" · ");
          const mark = orgLogo(org);
          return (
          <div key={a.title}>
            <span className={`${b.label} ${s.orgLabel}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {mark ? <img src={mark} alt="" /> : null}
              <span><OrgLink name={org}>{org}</OrgLink>{rest.length ? ` · ${rest.join(" · ")}` : ""}</span>
            </span>
            <h3 className={b.h4} style={{ marginTop: 10, fontSize: 17 }}>{a.title}</h3>
            <p className={s.desc} style={{ marginTop: 6 }}>{bare(a.desc)}</p>
            {"href" in a && a.href ? (
              <a className={s.ext} href={a.href} target="_blank" rel="noreferrer">Read the Paper <span aria-hidden="true">↗</span></a>
            ) : null}
          </div>
          );
        })}
      </div>
    </Row>
  );
}
