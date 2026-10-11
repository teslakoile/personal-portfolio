import { sample } from "../../samples/sampleContent";
import { Chips, Item, Row, SectionHead, type BlockColor } from "../kit";
import { BlockTimeline, monthCells, monthIndex, monthLabel, parseMonth, type YM } from "../timeline";
import { orgLogo } from "../logos";
import b from "../brand.module.css";
import s from "./sections.module.css";

/**
 * Experience: a one-block-per-month career timeline, then a row per role.
 * Roles and dates are read from sampleContent.ts. No featured case study: the
 * engagements under the current role are listed as equal rows (Kyle's call on
 * 2026-10-05), each with the one number that defines it.
 */

const FROM: YM = [2022, 1];

/** Lane color and short employer name, keyed by the employer in the data. */
const EMPLOYER: Record<string, { c: BlockColor; short: string }> = {
  "Thinking Machines Data Science": { c: "b1", short: "Thinking Machines" },
  "Ingenuity Software": { c: "b3", short: "Ingenuity" },
  "UP Diliman EEEEI": { c: "b2", short: "UP Diliman" },
  GCash: { c: "b4", short: "GCash" },
};

const LEGEND: { c: BlockColor; label: string }[] = [
  { c: "b1", label: "consulting" },
  { c: "b3", label: "product engineering" },
  { c: "b2", label: "research" },
  { c: "b4", label: "internship" },
];

const CURRENT_STACK = ["FastAPI", "Dagster", "Snowflake", "Azure Databricks", "Splink", "Kubernetes", "Terraform", "BigQuery", "Airflow"];

/** Engagements under the current role; the figure is the number that defines each. */
const ENGAGEMENTS = [
  { title: "Investment Data Platform", context: "Singaporean investment holding co.", figure: "10+ microservices" },
  { title: "Document Intelligence", context: "Snowflake Cortex agents", figure: "~15 person team" },
  { title: "Single Customer View", context: "major Philippine bank", figure: "~7M keys" },
  { title: "Student-at-Risk Platform", context: "Philippine education enterprise", figure: "3 sources" },
  { title: "Ingestion and Transformation", context: "Singaporean enterprise", figure: "4 sources" },
  { title: "Enablement Curriculum", context: "Philippine airline", figure: "6 courses" },
];

type Role = {
  employer: string;
  title: string;
  period: string;
  description: string;
  stack: readonly string[];
  engagements?: typeof ENGAGEMENTS;
};

function roles(): Role[] {
  const cur = sample.experience.current;
  return [
    { employer: cur.company, title: cur.role, period: cur.period, description: cur.summary, stack: CURRENT_STACK, engagements: ENGAGEMENTS },
    ...sample.experience.past.flatMap((co) =>
      co.roles.map((r) => ({ employer: co.company, title: r.title, period: r.period, description: r.description, stack: r.stack })),
    ),
  ];
}

/** The employer's mark before its name, or nothing where none is on file. */
function orgMark(employer: string) {
  const src = orgLogo(employer);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img className={s.orgLogo} src={src} alt="" /> : null;
}

/** "Aug 2024 to Present" → [start, end]. */
function span(period: string): { start: YM; end: YM | "present"; from: string; to: string } {
  const [from, to] = period.split(" to ");
  return { start: parseMonth(from), end: to === "Present" ? "present" : parseMonth(to), from, to };
}

export function Experience({ num }: { num?: string }) {
  const d = new Date();
  const today: YM = [d.getFullYear(), d.getMonth() + 1];
  const list = roles();
  const lanes = list.map((r) => {
    const e = EMPLOYER[r.employer];
    const sp = span(r.period);
    return {
      label: <>{r.title} <em>· {e.short}</em></>,
      cells: monthCells({ from: FROM, to: today, start: sp.start, end: sp.end, c: e.c, today }),
    };
  });
  const ticks = Array.from({ length: today[0] - FROM[0] + 1 }, (_, i) => FROM[0] + i)
    .map((y) => ({ at: monthIndex([y, 1]) - monthIndex(FROM), label: String(y) }));

  return (
    <Row id="experience">
      <SectionHead num={num} title="Experience" />
      <div className={s.timelineWrap}>
        <BlockTimeline
          lanes={lanes}
          ticks={ticks}
          today={{ at: monthIndex(today) - monthIndex(FROM), label: `Today · ${monthLabel(today)}` }}
          legend={LEGEND}
          blockW={9}
          labelW={300}
        />
      </div>
      {list.map((r) => {
        const sp = span(r.period);
        return (
          <div key={`${r.employer}-${r.title}`} className={s.roleRow}>
            <div className={s.roleWhen}><b>{sp.from}</b>to {sp.to}</div>
            <div className={s.roleBody}>
              <h3 className={b.h3}>
                {r.title} <span>· {orgMark(r.employer)}{r.employer}</span>
              </h3>
              <p>{r.description}</p>
              {r.engagements ? (
                <div className={s.roleItems}>
                  {r.engagements.map((x) => <Item key={x.title} c="b1" title={x.title} context={x.context} figure={x.figure} />)}
                </div>
              ) : null}
            </div>
            <div className={s.roleStack}><Chips items={r.stack} logos /></div>
          </div>
        );
      })}
    </Row>
  );
}
