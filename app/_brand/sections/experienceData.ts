import { sample } from "../../samples/sampleContent";
import type { BlockColor } from "../kit";
import { monthIndex, monthLabel, parseMonth, type YM } from "../timeline";
import { orgLogo, orgUrl } from "../logos";
import { bare } from "../format";
import { describe } from "../chipNotes";

/**
 * The roles behind the Experience section, as plain data. The section and its
 * timeline read from here, so a role is described once. Roles, dates, and the
 * past roles' project text come from sampleContent.ts; the headlines and the
 * current role's projects are written below from that file's points.
 */

export const FROM: YM = [2022, 1];

/** Lane color and short employer name, keyed by the employer in the data. */
const EMPLOYER: Record<string, { c: BlockColor; short: string }> = {
  "Thinking Machines Data Science": { c: "b1", short: "Thinking Machines" },
  "Ingenuity Software": { c: "b3", short: "Ingenuity" },
  "UP Diliman EEEEI": { c: "b2", short: "UP Diliman" },
  GCash: { c: "b4", short: "GCash" },
};

/** One project under a role: the work and its result as separate points, and
    the tools used on that project alone. */
export type Project = {
  title: string;
  /** the client, or for an earlier role the setting of the work */
  context?: string;
  /** the distinct things done, one bullet each, no closing period */
  points: string[];
  stack: string[];
  notes: Record<string, string>;
};

const project = (title: string, context: string | undefined, points: string[], stack: string[]): Project => ({
  title, context, points, stack, notes: describe(stack),
});

/** The current role's projects, most important first: the agent work and the
    platform lead, then the projects with a measured result, then the smaller
    ones. Every figure is in sampleContent.ts (experience.current.clients), and
    the clients stay anonymized. Contexts are Title Case, as labels are. */
const CURRENT_PROJECTS: Project[] = [
  project(
    "Document Intelligence",
    "Singaporean Investment Holding Company",
    [
      "Iterated on Snowflake Cortex agent workflows with the Knowledge Graph team so investment officers could extract data from long-form documents, run contextual queries, and analyze portfolios at scale",
      "Owned agent tooling, prompt engineering, evaluation, and workflow tuning, and triaged production incidents across the stack",
      "Worked within a ~15-person team spanning frontend, backend, LLM workflows, MLOps, DevOps, and QA",
    ],
    ["FastAPI", "Snowflake", "Snowflake Cortex", "OpenAI API", "Kubernetes", "Azure DevOps"],
  ),
  project(
    "Investment Data Platform",
    "Singaporean Investment Holding Company",
    [
      "Owned backend features across 10+ interconnected microservices for deal discovery, due diligence, and portfolio monitoring",
      "Built the pipelines that process terabytes of vendor data from Sustainalytics, PitchBook, Bloomberg, and MSCI",
      "Improved reliability with production monitoring in Kibana and Grafana",
    ],
    ["FastAPI", "Dagster", "Snowflake", "PostgreSQL", "SQLAlchemy", "Pydantic", "Kubernetes", "Kibana", "Grafana"],
  ),
  project(
    "Single Customer View",
    "Major Philippine Bank",
    [
      "Led the data products workstream and productionized a daily pipeline that consolidates ~15 million records from four systems into ~7 million customer keys",
      "Built a Splink record-linkage engine that surfaced 748,000 candidate duplicate pairs exact matching missed",
      "Cut the pipeline's runtime from over 4 hours to under 1 hour",
    ],
    ["Azure Databricks", "PySpark", "SQL", "Splink", "Delta Lake"],
  ),
  project(
    "Student-at-Risk Platform",
    "Philippine Education Enterprise",
    [
      "Led the infrastructure and ingestion workstream, provisioning the platform with Terraform",
      "Built API ingestion across three source systems and moved Excel-based regression models into production jobs",
      "Sped up delivery by adding AI coding agents with custom skills and hooks",
    ],
    ["Azure Databricks", "Terraform", "Python", "SQL"],
  ),
  project(
    "Ingestion and Transformation",
    "Singaporean Enterprise",
    [
      "Built pipelines from four source systems in SQL Server and MongoDB into BigQuery",
      "Designed surrogate keys to resolve identifier collisions between member and visitor systems",
      "Fixed memory failures in legacy Airflow DAGs with chunked CSV processing",
    ],
    ["BigQuery", "Cloud Composer", "Airflow", "Dataform", "SQL", "MongoDB"],
  ),
  project(
    "Enablement Curriculum",
    "Philippine Airline",
    ["Designed and delivered a six-course curriculum covering Python and Power BI, from beginner to advanced, in four days"],
    ["Python", "Power BI", "Curriculum Design"],
  ),
];

/** The headline and context of each earlier role's project, keyed by the role
    title in the data. A second role at the same employer merges into that
    employer's entry; its title and dates stay out of the row, as the context
    is the setting of the work, not the job. */
/** Past roles split into points at sentence breaks. These two descriptions are
    one sentence holding two separate things, so they are split here, in their
    own words. */
const SPLIT: Record<string, string[]> = {
  "Software Engineer (Part-time)": [
    "Built a Google Cloud data-processing pipeline for a COVID-19 contact-tracing and vaccination-tracking application",
    "Led a two-week data science internship for eight participants",
  ],
  "Research Associate": [
    "Co-authored and published the IEEE AIComprehend paper",
    "Built and deployed the full-stack Django application used in a month-long controlled study that showed a 13.9% improvement in student test scores",
  ],
};

const sentences = (s: string) => s.split(/(?<=\.)\s+(?=[A-Z])/).map(bare);

const PROJECT_LABEL: Record<string, { title: string; context?: string }> = {
  "Backend Software Engineer": { title: "Compliance Case Management", context: "Data Residency and GDPR" },
  "Software Engineer (Part-time)": { title: "Contact-Tracing Application", context: "COVID-19 Response" },
  "Research Associate": { title: "AIComprehend", context: "IEEE Paper and Controlled Study" },
  "Technology and Operations Intern": { title: "Developer Program Dashboards", context: "Technology and Operations Team" },
};

/** The headline under each employer, in the past tense: the scope and the
    number that sizes it, from the roles in sampleContent.ts. */
const HEADLINE: Record<string, string> = {
  "Thinking Machines Data Science": "Built AI agents and terabyte-scale data platforms for investment, banking, and education clients in Singapore and the Philippines.",
  "Ingenuity Software": "Built the cross-region backend of a compliance platform: ~50 production API endpoints supporting 100+ reports a day.",
  "UP Diliman EEEEI": "Published at IEEE and built the application behind a study that showed a 13.9% gain in student test scores.",
  GCash: "Turned production datasets into the dashboards that tracked a 300-plus participant developer program.",
};

/** One employer's entry. */
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
  /** the employer's headline, shown in the row whether or not it is open */
  summary: string;
  projects: Project[];
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

/** "Aug 2024 to Present" → its two ends. */
function ends(period: string): { start: YM; end: YM | "present" } {
  const [from, to] = period.split(" to ");
  return { start: parseMonth(from), end: to === "Present" ? "present" : parseMonth(to) };
}

/** Every employer, current first. An employer with several roles is one entry:
    it spans the earliest start to the latest end, carries the first role's
    title, and lists each role's work as a project. */
export function buildRoles(today: YM): RoleView[] {
  const cur = sample.experience.current;
  const groups = [
    { employer: cur.company, title: cur.role, periods: [cur.period], projects: CURRENT_PROJECTS },
    ...sample.experience.past.map((co) => ({
      employer: co.company,
      title: co.roles[0].title,
      periods: co.roles.map((r) => r.period),
      projects: co.roles.map((r) => {
        const label = PROJECT_LABEL[r.title];
        return project(label.title, label.context, SPLIT[r.title] ?? sentences(r.description), [...r.stack]);
      }),
    })),
  ];
  return groups.map((g, i) => {
    const e = EMPLOYER[g.employer];
    const spans = g.periods.map(ends);
    const start = spans.reduce((a, s) => (monthIndex(s.start) < monthIndex(a) ? s.start : a), spans[0].start);
    const open = spans.some((s) => s.end === "present");
    const last = spans.reduce<YM>((a, s) => (s.end !== "present" && monthIndex(s.end) > monthIndex(a) ? s.end : a), spans[0].start);
    const end: YM | "present" = open ? "present" : last;
    const months = monthIndex(end === "present" ? today : end) - monthIndex(start) + 1;
    return {
      id: `${g.employer}-${g.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      when: `${monthLabel(start)} - ${end === "present" ? "Present" : monthLabel(end)}`,
      title: g.title,
      employer: g.employer,
      short: e.short,
      c: e.c,
      mark: orgLogo(g.employer),
      href: orgUrl(g.employer),
      summary: HEADLINE[g.employer],
      projects: g.projects,
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
