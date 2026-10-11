import { sample } from "../../samples/sampleContent";
import { Chips, Row, SectionHead } from "../kit";
import b from "../brand.module.css";
import s from "./sections.module.css";

/** Education: one cell per school with its seal, degree, and honour chips.
    The school-year block timeline was dropped on 2026-10-05; blocks stay for
    the career, certification validity, and GitHub only. */
export function Education({ num }: { num?: string }) {
  return (
    <Row id="education">
      <SectionHead num={num} title="Education" />
      <div className={`${s.grid} ${s.two}`}>
        {sample.education.map((e) => (
          <div key={e.school}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.seal} src={e.logo} alt={`${e.school} seal`} />
            <h3 className={`${b.h4} ${s.school}`}>{e.school}</h3>
            <div className={s.degree}>{e.degree} · {e.period}</div>
            <div className={s.chipGap}><Chips items={e.highlights} /></div>
          </div>
        ))}
      </div>
    </Row>
  );
}
