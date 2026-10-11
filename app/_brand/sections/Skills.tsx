import { sample } from "../../samples/sampleContent";
import { Chips, Row, SectionHead } from "../kit";
import b from "../brand.module.css";
import s from "./sections.module.css";

/** Skills: six domain cards, each a one-line capability and its tools as
    chips, read from sampleContent.ts. No block counts ("too arbitrary", Kyle,
    2026-10-05). */
export function Skills({ num }: { num?: string }) {
  const groups = sample.skills;
  const rows = [groups.slice(0, 3), groups.slice(3)];
  return (
    <Row id="skills">
      <SectionHead num={num} title="Skills" />
      {rows.map((row, i) => (
        <div key={i} className={s.grid}>
          {row.map((g) => (
            <div key={g.title}>
              <h3 className={b.h4}>{g.title}</h3>
              <p className={s.blurb}>{g.blurb}</p>
              <div className={s.chipGap}><Chips items={g.tools} logos /></div>
            </div>
          ))}
        </div>
      ))}
    </Row>
  );
}
