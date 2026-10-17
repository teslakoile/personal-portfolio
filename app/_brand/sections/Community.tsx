import { sample } from "../../samples/sampleContent";
import { Row, SectionHead, Stat, Talk } from "../kit";
import { OrgLink } from "../OrgLink";
import { bare, range } from "../format";
import b from "../brand.module.css";
import s from "./sections.module.css";

/** Community and Speaking: the GDG Davao figures as plain numbers (no blocks,
    per Kyle on 2026-10-05) beside the talks. Both read from sampleContent.ts. */
export function Community({ num }: { num?: string }) {
  const [gdg, shapers] = sample.community;
  const stats = gdg.stats ?? [];
  return (
    <Row id="community">
      <SectionHead num={num} title={<>Community &amp; <span className={b.accent}>Speaking</span></>} />
      <div className={`${s.grid} ${s.two}`}>
        <div>
          <span className={`${b.label} ${s.orgLabel}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gdg.logo} alt="" />
            <OrgLink name={gdg.name} url={gdg.url}>{gdg.name}</OrgLink>
          </span>
          <div className={b.stats} style={{ marginTop: 10 }}>
            {stats.map((x) => <Stat key={x.label} figure={x.fig} label={x.label} />)}
          </div>
          <div className={s.orgRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shapers.logo} alt="" />
            <span><b><OrgLink name={shapers.name} url={shapers.url}>{shapers.name}</OrgLink></b>{shapers.role} · {range(shapers.period)}</span>
          </div>
        </div>
        <div>
          <span className={b.label}>Talks</span>
          <div style={{ marginTop: 6 }}>
            {sample.speaking.map((t) => <Talk key={t.title} title={t.title} desc={bare(t.description)} meta={t.meta} href={t.link} />)}
          </div>
        </div>
      </div>
    </Row>
  );
}
