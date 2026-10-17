import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sample } from "../sampleContent";
import { BrandRoot, Frame, Row, SectionHead } from "../../_brand/kit";
import { Education } from "../../_brand/sections/Education";
import { OrgLink } from "../../_brand/OrgLink";
import { orgLogo } from "../../_brand/logos";
import { bare, range } from "../../_brand/format";
import b from "../../_brand/brand.module.css";
import s from "../../_brand/sections/sections.module.css";
import x from "./education.module.css";

/**
 * Layouts for the Education section, every fact from sampleContent.ts
 * (education, and achievements for D), compared against the section on
 * /samples/redesign today. Nothing here ships; the pick replaces Education.tsx.
 */
export const metadata: Metadata = {
  title: "Education Layouts | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const [UP, PSHS] = sample.education;

const OPTIONS = [
  { id: "now", name: "Now (kept)", idea: "Two cells, the school's bullets in each, with coral bullets. Kept on 2026-10-17 over A to D." },
  { id: "a", name: "A, Figures", idea: "The numbers lead, as on the Community figures: 1.15 and Top 5 for UP. The honours and activities follow as a ruled list." },
  { id: "b", name: "B, Ledger", idea: "One ruled row per school on Experience's columns: years, school and degree, then the honours as one line. The shortest." },
  { id: "c", name: "C, Feature", idea: "UP as the wide cell with its figures and honours; PSHS as a narrow cell beside it." },
  { id: "d", name: "D, Education and Recognition", idea: "One section: the two schools as ledger rows, then the paper and the Airflow contribution. Summa Cum Laude appears once." },
] as const;

function Option({ id, children }: { id: string; children: ReactNode }) {
  const o = OPTIONS.find((v) => v.id === id)!;
  return (
    <section id={`opt-${id}`} className={x.option}>
      <p className={x.cap}><b>{o.name}</b>{o.idea}</p>
      <Frame>{children}</Frame>
    </section>
  );
}

function Seal({ e }: { e: (typeof sample.education)[number] }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={s.seal} src={e.logo} alt={`${e.school} seal`} />;
}

function SchoolHead({ e }: { e: (typeof sample.education)[number] }) {
  return (
    <>
      <Seal e={e} />
      <h3 className={`${b.h4} ${s.school}`}><OrgLink name={e.school}>{e.school}</OrgLink></h3>
      <div className={s.degree}>{e.degree} · {range(e.period)}</div>
    </>
  );
}

/* The UP figures, read from its highlights: "1.15 Weighted Avg" and "Top 5". */
const FIGURES = [
  { fig: "1.15", label: "Weighted average" },
  { fig: "Top 5", label: "In the program" },
];
/* What the figures do not already say, from the school's own bullets. */
const UP_REST = ["Graduated summa cum laude", ...UP.points.slice(1).map(bare)];

function Figures() {
  return (
    <div className={x.figs}>
      {FIGURES.map((f) => <div key={f.fig}><b>{f.fig}</b><span>{f.label}</span></div>)}
    </div>
  );
}

function OptionA() {
  return (
    <Row>
      <SectionHead title="Education" />
      <div className={`${s.grid} ${s.two}`}>
        <div>
          <SchoolHead e={UP} />
          <Figures />
          <ul className={s.points}>{UP_REST.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
        <div>
          <SchoolHead e={PSHS} />
          <ul className={s.points}>{PSHS.points.map((p) => <li key={p}>{bare(p)}</li>)}</ul>
        </div>
      </div>
    </Row>
  );
}

function LedgerRows() {
  return (
    <div className={x.ledger}>
      {sample.education.map((e) => (
        <div key={e.school} className={x.lrow}>
          <div className={x.when}>{range(e.period)}</div>
          <div className={x.who}>
            <Seal e={e} />
            <div>
              <h3 className={b.h4}><OrgLink name={e.school}>{e.school}</OrgLink></h3>
              <div className={s.degree}>{e.degree}</div>
            </div>
          </div>
          <ul className={x.honours}>{e.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

function OptionB() {
  return (
    <Row>
      <SectionHead title="Education" />
      <LedgerRows />
    </Row>
  );
}

function OptionC() {
  return (
    <Row>
      <SectionHead title="Education" />
      <div className={`${s.grid} ${x.feature}`}>
        <div>
          <SchoolHead e={UP} />
          <div className={x.featureBody}>
            <Figures />
            <ul className={s.points}>{UP_REST.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
        <div>
          <SchoolHead e={PSHS} />
          <ul className={s.points}>{PSHS.points.map((p) => <li key={p}>{bare(p)}</li>)}</ul>
        </div>
      </div>
    </Row>
  );
}

function OptionD() {
  const awards = sample.achievements.filter((a) => a.title !== "Summa Cum Laude");
  return (
    <Row>
      <SectionHead title="Education & Recognition" />
      <LedgerRows />
      <div className={`${s.grid} ${s.two}`}>
        {awards.map((a) => {
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
              {"href" in a && a.href ? <a className={s.ext} href={a.href} target="_blank" rel="noreferrer">Read the Paper <span aria-hidden="true">↗</span></a> : null}
            </div>
          );
        })}
      </div>
    </Row>
  );
}

export default function EducationLayouts() {
  return (
    <BrandRoot>
      <div className={x.page}>
        <header className={x.head}>
          <h1 className={b.h3}>Education Layouts</h1>
          <p>Four options for the Education section against the one on the redesign today. Every fact comes from sampleContent.ts.</p>
        </header>
        <Option id="now"><Education /></Option>
        <Option id="a"><OptionA /></Option>
        <Option id="b"><OptionB /></Option>
        <Option id="c"><OptionC /></Option>
        <Option id="d"><OptionD /></Option>
      </div>
    </BrandRoot>
  );
}
