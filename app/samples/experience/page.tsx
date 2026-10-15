import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BrandRoot, Frame, Row, SectionHead } from "../../_brand/kit";
import { Cursor } from "../../_brand/Cursor";
import { MotionRoot } from "../../_brand/MotionRoot";
import { ChipFx } from "../../_brand/ChipFx";
import { Experience } from "../../_brand/sections/Experience";
import { ExperienceTimeline } from "../../_brand/sections/ExperienceTimeline";
import { buildRoles, today as now } from "../../_brand/sections/experienceData";
import { MasterDetail } from "./MasterDetail";
import { Bento } from "./Bento";
import { Ledger } from "./Ledger";
import { TimelineNav } from "./TimelineNav";
import x from "./experience.module.css";

/**
 * Four layouts for the Experience section, built from the same role data
 * (app/_brand/sections/experienceData.ts) and compared against the drawer
 * layout now on /samples/redesign. Add ?o=a, b, c, d, or now to see one.
 * Nothing here ships; the pick replaces ExperienceRoles.
 */
export const metadata: Metadata = {
  title: "Experience Layouts | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const OPTIONS = [
  { id: "now", name: "Now", idea: "Drawers, the layout on the redesign today. Each role folds; the current one starts open." },
  { id: "a", name: "A, Master and Detail", idea: "Roles in a list on the left, one role's detail on the right. One story at a time; the page does not grow." },
  { id: "b", name: "B, Bento", idea: "No folding. The current role is one large cell with its engagements as figure cells; earlier roles are equal cards." },
  { id: "c", name: "C, Ledger", idea: "One dense row per role in fixed columns, the stack as logo tiles. Reads like a CV, nothing hidden." },
  { id: "d", name: "D, Timeline as the Control", idea: "The timeline stays and each lane is a button. One block of data instead of a timeline plus a list." },
] as const;

function Option({ id, children }: { id: string; children: ReactNode }) {
  const o = OPTIONS.find((v) => v.id === id)!;
  return (
    <section id={`opt-${id}`}>
      <Frame>
        <Row>
          <div className={x.tag}><b>{o.name}</b><span>{o.idea}</span></div>
          {children}
        </Row>
      </Frame>
      <div className={x.gap} />
    </section>
  );
}

export default async function ExperienceLayouts({ searchParams }: { searchParams: Promise<{ o?: string; r?: string }> }) {
  const { o, r } = await searchParams;
  const initial = Math.max(0, Math.min(4, Number(r) || 0));
  const today = now();
  const roles = buildRoles(today);
  const show = (id: string) => !o || o === id;
  const head = <SectionHead title="Experience" />;

  return (
    <BrandRoot>
      <MotionRoot>
        <Cursor />
        <ChipFx />
        <div className={x.page}>
          <div className={x.intro}>
            <h1>Experience Layouts</h1>
            <p>Four options for the Experience section, built from the same role data. Every option keeps the stack hovers and the employer links.</p>
            <nav aria-label="Options">
              {OPTIONS.map((v) => <a key={v.id} href={`#opt-${v.id}`}>{v.name}</a>)}
            </nav>
          </div>

          {show("now") ? (
            <section id="opt-now">
              <Frame>
                <div className={x.tag}><b>{OPTIONS[0].name}</b><span>{OPTIONS[0].idea}</span></div>
                <Experience />
              </Frame>
              <div className={x.gap} />
            </section>
          ) : null}

          {show("a") ? (
            <Option id="a">
              {head}
              <ExperienceTimeline roles={roles} today={today} />
              <MasterDetail roles={roles} initial={initial} />
            </Option>
          ) : null}

          {show("b") ? (
            <Option id="b">
              {head}
              <ExperienceTimeline roles={roles} today={today} />
              <Bento roles={roles} />
            </Option>
          ) : null}

          {show("c") ? (
            <Option id="c">
              {head}
              <ExperienceTimeline roles={roles} today={today} />
              <Ledger roles={roles} />
            </Option>
          ) : null}

          {show("d") ? (
            <Option id="d">
              {head}
              <TimelineNav roles={roles} today={today} initial={initial} />
            </Option>
          ) : null}
        </div>
      </MotionRoot>
    </BrandRoot>
  );
}
