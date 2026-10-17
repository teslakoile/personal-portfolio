import { ArrowUpRight } from "lucide-react";
import { sample } from "../../samples/sampleContent";
import { Row, SectionHead } from "../kit";
import { orgLogo } from "../logos";
import b from "../brand.module.css";
import s from "./sections.module.css";

/** Recognition: one cell per item, a dated label, the title, and the line that
    backs it. Read from sampleContent.ts `achievements`. */
export function Recognition({ num }: { num?: string }) {
  return (
    <Row id="recognition">
      <SectionHead num={num} title="Recognition" />
      <div className={s.grid}>
        {sample.achievements.map((a) => (
          <div key={a.title}>
            <span className={`${b.label} ${s.orgLabel}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {orgLogo(a.meta) ? <img src={orgLogo(a.meta)!} alt="" /> : null}
              {a.meta}
            </span>
            <h3 className={b.h4} style={{ marginTop: 10, fontSize: 17 }}>{a.title}</h3>
            <p className={s.desc} style={{ marginTop: 6 }}>{a.desc}</p>
            {"href" in a && a.href ? (
              <a className={s.ext} href={a.href} target="_blank" rel="noreferrer"><ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" />Read the Paper</a>
            ) : null}
          </div>
        ))}
      </div>
    </Row>
  );
}
