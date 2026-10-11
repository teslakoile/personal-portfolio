import { sample } from "../../samples/sampleContent";
import { Row, SectionHead, Stat, Talk } from "../kit";
import b from "../brand.module.css";
import s from "./sections.module.css";

/** Community and Speaking: the GDG Davao figures as plain numbers (no blocks,
    per Kyle on 2026-10-05) beside the talks. Both read from sampleContent.ts. */
export function Community({ num }: { num?: string }) {
  const gdg = sample.community[0];
  const stats = gdg.stats ?? [];
  return (
    <Row id="community">
      <SectionHead num={num} title={<>Community &amp; <span className={b.accent}>Speaking</span></>} />
      <div className={`${s.grid} ${s.two}`}>
        <div>
          <span className={`${b.label} ${s.orgLabel}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gdg.logo} alt="" />
            {gdg.name}
          </span>
          <div className={b.stats} style={{ marginTop: 10 }}>
            {stats.map((x) => <Stat key={x.label} figure={x.fig} label={x.label} />)}
          </div>
        </div>
        <div>
          <span className={b.label}>Talks</span>
          <div style={{ marginTop: 6 }}>
            {sample.speaking.map((t) => <Talk key={t.title} title={t.title} desc={t.description} meta={t.meta} />)}
          </div>
        </div>
      </div>
    </Row>
  );
}
