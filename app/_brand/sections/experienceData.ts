import { sample } from "../../samples/sampleContent";
import type { BlockColor } from "../kit";
import { monthIndex, parseMonth, type YM } from "../timeline";
import { orgLogo, orgUrl } from "../logos";
import { range } from "../format";
import { describe } from "../chipNotes";

/**
 * The roles behind the Experience section, as plain data. The section, the
 * timeline, and every layout under app/samples/experience read from here, so a
 * role is described once. Roles and dates come from sampleContent.ts.
 */

export const FROM: YM = [2022, 1];

/** Lane color and short employer name, keyed by the employer in the data. */
const EMPLOYER: Record<string, { c: BlockColor; short: string }> = {
  "Thinking Machines Data Science": { c: "b1", short: "Thinking Machines" },
  "Ingenuity Software": { c: "b3", short: "Ingenuity" },
  "UP Diliman EEEEI": { c: "b2", short: "UP Diliman" },
  GCash: { c: "b4", short: "GCash" },
};

export const LEGEND: { c: BlockColor; label: string }[] = [
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

/** One role with everything a layout needs as plain, serializable data. */
export type RoleView = {
  id: string;
  /** "Aug 2024 - Present" */
  when: string;
  title: string;
  employer: string;
  /** the employer's short name, as the timeline labels it */
  short: string;
  /** the employer's lane color */
  c: BlockColor;
  /** the employer's logo file, when one is on record */
  mark: string | null;
  /** the employer's site, when one is on record */
  href: string | null;
  description: string;
  engagements?: { title: string; context: string; figure: string }[];
  stack: string[];
  notes: Record<string, string>;
  start: YM;
  end: YM | "present";
  /** whole months, counting both ends, so it matches the timeline's blocks */
  months: number;
  /** "2 yrs 3 mos" */
  duration: string;
  current: boolean;
};

/** 27 → "2 yrs 3 mos". */
export function duration(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} ${y === 1 ? "yr" : "yrs"}`);
  if (m) parts.push(`${m} ${m === 1 ? "mo" : "mos"}`);
  return parts.join(" ");
}

/** Every role, current first, then the past roles in the order of the data. */
export function buildRoles(today: YM): RoleView[] {
  const cur = sample.experience.current;
  const raw = [
    { employer: cur.company, title: cur.role, period: cur.period, description: cur.summary, stack: CURRENT_STACK as readonly string[], engagements: ENGAGEMENTS },
    ...sample.experience.past.flatMap((co) =>
      co.roles.map((r) => ({ employer: co.company, title: r.title, period: r.period, description: r.description, stack: r.stack as readonly string[], engagements: undefined })),
    ),
  ];
  return raw.map((r, i) => {
    const e = EMPLOYER[r.employer];
    const [from, to] = r.period.split(" to ");
    const start = parseMonth(from);
    const end: YM | "present" = to === "Present" ? "present" : parseMonth(to);
    const months = monthIndex(end === "present" ? today : end) - monthIndex(start) + 1;
    return {
      id: `${r.employer}-${r.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      when: range(r.period),
      title: r.title,
      employer: r.employer,
      short: e.short,
      c: e.c,
      mark: orgLogo(r.employer),
      href: orgUrl(r.employer),
      description: r.description,
      engagements: r.engagements ? [...r.engagements] : undefined,
      stack: [...r.stack],
      notes: describe(r.stack),
      start,
      end,
      months,
      duration: duration(months),
      current: i === 0,
    };
  });
}

export function today(): YM {
  const d = new Date();
  return [d.getFullYear(), d.getMonth() + 1];
}
