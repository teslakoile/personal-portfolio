import { sample } from "../../samples/sampleContent";
import { Row, SectionHead } from "../kit";
import { OrgLink } from "../OrgLink";
import { bare, range } from "../format";
import b from "../brand.module.css";
import s from "./sections.module.css";

/** Education: one cell per school with its seal, degree, and the school's own
    bullets from sampleContent.ts. The school-year block timeline was dropped
    on 2026-10-05; blocks stay for the career, certification validity, and
    GitHub only. */
export function Education({ num }: { num?: string }) {
  return (
    <Row id="education">
      <SectionHead num={num} title="Education" />
      <div className={`${s.grid} ${s.two}`}>
        {sample.education.map((e) => (
          <div key={e.school}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.seal} src={e.logo} alt={`${e.school} seal`} />
            <h3 className={`${b.h4} ${s.school}`}><OrgLink name={e.school}>{e.school}</OrgLink></h3>
            <div className={s.degree}>{e.degree} · {range(e.period)}</div>
            <ul className={s.points}>
              {e.points.map((p) => <li key={p}>{bare(p)}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Row>
  );
}
