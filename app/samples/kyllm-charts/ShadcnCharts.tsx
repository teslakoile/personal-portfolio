"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./ui/chart";
import c from "./charts.module.css";

/*
 * The certification charts drawn with shadcn's chart component (Recharts
 * underneath), twice: as shadcn's own examples style them, and themed to the
 * site's block standard (grey marks, one blue, values on the marks, no grid).
 */

// sampleContent.ts certifications
const CERTS: [string, string, number, number][] = [
  ["Google Cloud", "Cloud Digital Leader", 2024, 4], ["Google Cloud", "Professional Machine Learning Engineer", 2025, 7],
  ["Google Cloud", "Generative AI Leader", 2025, 10], ["Google Cloud", "AI/ML Pre-Sales Technical Expert", 2025, 12],
  ["OpenAI", "AI Technical Practitioner", 2026, 3], ["OpenAI", "API Deployment Practitioner", 2026, 4], ["OpenAI", "Foundational Knowledge", 2026, 8],
  ["Microsoft Azure", "Azure Fundamentals", 2024, 6], ["Microsoft Azure", "Azure AI Engineer Associate", 2025, 5],
  ["Databricks", "Certified Data Engineer Associate", 2025, 12], ["Astronomer", "Airflow 3 Fundamentals", 2025, 7],
  ["AWS", "Certified Cloud Practitioner", 2024, 3],
];
const YEARS = [2024, 2025, 2026].map((y) => ({ year: String(y), certifications: CERTS.filter((x) => x[2] === y).length }));
const ISSUERS = [...new Set(CERTS.map((x) => x[0]))]
  .map((i) => ({ issuer: i, certifications: CERTS.filter((x) => x[0] === i).length }))
  .sort((a, b) => b.certifications - a.certifications);
const ROWS = ISSUERS.map((i) => i.issuer);
const DOTS = CERTS.map(([issuer, name, y, m]) => ({ t: (y - 2024) * 12 + m - 0.5, row: ROWS.length - 1 - ROWS.indexOf(issuer), issuer, name, when: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}` }));

const config = { certifications: { label: "Certifications", color: "var(--chart-1)" } } satisfies ChartConfig;
const siteConfig = { certifications: { label: "Certifications", color: "#86a9c8" } } satisfies ChartConfig;
const GREY = "#e4dfd8", HI = "#F26A4B";

/* ----------------------------- shadcn's own look ----------------------------- */
function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className={c.sCard}>
      <div className={c.sHead}><b>{title}</b><span>{sub}</span></div>
      {children}
    </div>
  );
}

export function ShadcnDefault({ kind }: { kind: "columns" | "bars" | "timeline" }) {
  if (kind === "columns") return (
    <Card title="Half came in 2025" sub="Certifications by year issued">
      <ChartContainer config={config} className="aspect-auto h-[180px] w-full">
        <BarChart accessibilityLayer data={YEARS}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="year" tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="certifications" fill="var(--color-certifications)" radius={8} />
        </BarChart>
      </ChartContainer>
    </Card>
  );
  if (kind === "bars") return (
    <Card title="Google Cloud leads with 4" sub="Certifications by issuer">
      <ChartContainer config={config} className="aspect-auto h-[210px] w-full">
        <BarChart accessibilityLayer data={ISSUERS} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" dataKey="certifications" hide />
          <YAxis dataKey="issuer" type="category" tickLine={false} tickMargin={10} axisLine={false} width={116} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="certifications" fill="var(--color-certifications)" radius={5} />
        </BarChart>
      </ChartContainer>
    </Card>
  );
  return (
    <Card title="OpenAI's three came in 2026" sub="Each certification by issuer and date">
      <ChartContainer config={config} className="aspect-auto h-[200px] w-full">
        <ScatterChart accessibilityLayer margin={{ left: 0, right: 8 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="t" domain={[0, 36]} ticks={[6, 18, 30]} tickFormatter={(v: number) => String(2024 + Math.floor(v / 12))} tickLine={false} axisLine={false} />
          <YAxis type="number" dataKey="row" domain={[-0.5, ROWS.length - 0.5]} ticks={ROWS.map((_, i) => i)} tickFormatter={(v: number) => ROWS[ROWS.length - 1 - v] ?? ""} tickLine={false} axisLine={false} width={116} />
          <ZAxis range={[60, 60]} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(_, __, item) => `${item.payload.name}, ${item.payload.when}`} />} />
          <Scatter data={DOTS} fill="var(--color-certifications)" />
        </ScatterChart>
      </ChartContainer>
    </Card>
  );
}

/* --------------------------- themed to the site --------------------------- */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={c.block}>
      <p className={c.bT}>{title}</p>
      {children}
      <p className={c.bS}>From Certifications, by issue date</p>
    </div>
  );
}
const SiteTip = ({ active, payload }: { active?: boolean; payload?: { payload: Record<string, string | number> }[] }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <div className={c.tip}><b>{p.name ?? `${p.certifications} certifications`}</b><span>{p.when ?? p.year ?? p.issuer}</span></div>;
};

export function ShadcnSite({ kind }: { kind: "columns" | "bars" | "timeline" }) {
  if (kind === "columns") return (
    <Block title="Half came in 2025">
      <ChartContainer config={siteConfig} className="aspect-auto h-[150px] w-full">
        <BarChart data={YEARS} margin={{ top: 20, left: 0, right: 0 }}>
          <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "#d9d3cc" }} tickMargin={8} />
          <ChartTooltip cursor={false} content={<SiteTip />} />
          <Bar dataKey="certifications" radius={0} maxBarSize={64}>
            {YEARS.map((d) => <Cell key={d.year} fill={d.year === "2025" ? HI : GREY} />)}
            <LabelList dataKey="certifications" position="top" className={c.val} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </Block>
  );
  if (kind === "bars") return (
    <Block title="Google Cloud leads with 4">
      <ChartContainer config={siteConfig} className="aspect-auto h-[170px] w-full">
        <BarChart data={ISSUERS} layout="vertical" margin={{ left: 0, right: 24 }} barCategoryGap={6}>
          <XAxis type="number" hide />
          <YAxis dataKey="issuer" type="category" tickLine={false} axisLine={false} width={116} />
          <ChartTooltip cursor={false} content={<SiteTip />} />
          <Bar dataKey="certifications" radius={0}>
            {ISSUERS.map((d) => <Cell key={d.issuer} fill={d.issuer === "Google Cloud" ? HI : GREY} />)}
            <LabelList dataKey="certifications" position="right" className={c.val} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </Block>
  );
  return (
    <Block title="OpenAI's three came in 2026">
      <ChartContainer config={siteConfig} className="aspect-auto h-[170px] w-full">
        <ScatterChart margin={{ left: 0, right: 8 }}>
          <XAxis type="number" dataKey="t" domain={[0, 36]} ticks={[6, 18, 30]} tickFormatter={(v: number) => String(2024 + Math.floor(v / 12))} tickLine={false} axisLine={false} />
          <YAxis type="number" dataKey="row" domain={[-0.5, ROWS.length - 0.5]} ticks={ROWS.map((_, i) => i)} tickFormatter={(v: number) => ROWS[ROWS.length - 1 - v] ?? ""} tickLine={false} axisLine={false} width={116} />
          <ZAxis range={[56, 56]} />
          <ChartTooltip cursor={false} content={<SiteTip />} />
          <Scatter data={DOTS}>
            {DOTS.map((d) => <Cell key={d.name} fill={d.issuer === "OpenAI" ? HI : GREY} />)}
          </Scatter>
        </ScatterChart>
      </ChartContainer>
    </Block>
  );
}

/* ------------------- themed to the site, with axes and hover ------------------- */
// what the tooltip lists: each year's certifications by issuer, each issuer's certifications by name
const yearDetail = (y: string) => {
  const by = new Map<string, number>();
  CERTS.filter((x) => String(x[2]) === y).forEach((x) => by.set(x[0], (by.get(x[0]) ?? 0) + 1));
  return [...by].map(([i, n]) => `${i} ${n}`).join(", ");
};
const YEARS_R = YEARS.map((d) => ({ ...d, detail: yearDetail(d.year) }));
const ISSUERS_R = ISSUERS.map((d) => ({ ...d, detail: CERTS.filter((x) => x[0] === d.issuer).map((x) => x[1]).join(", ") }));
const AXIS = { fill: "#a8a29e", fontSize: 11 };
const GRID = "#ece8e3";

const RichTip = ({ active, payload, kind }: { active?: boolean; payload?: { payload: Record<string, string | number> }[]; kind: "year" | "issuer" | "dot" }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const title = kind === "year" ? `${p.certifications} in ${p.year}` : kind === "issuer" ? `${p.issuer}: ${p.certifications}` : String(p.name);
  const detail = kind === "dot" ? `${p.issuer}, ${p.when}` : String(p.detail);
  return <div className={c.tip}><b>{title}</b><span>{detail}</span></div>;
};

// issuer -> the site's own mark in /public/logos (the same files the Certifications section shows)
const ISSUER_LOGO: Record<string, string> = {
  "Google Cloud": "googlecloud.svg", OpenAI: "openai.svg", "Microsoft Azure": "azure.svg",
  Databricks: "databricks.svg", Astronomer: "airflow.svg", AWS: "aws.svg",
};
// a category tick: the brand mark, then the name, left-aligned in the axis column.
// HTML in a foreignObject so the logo sizes like the site's <img> marks (some SVGs use em sizes).
const LogoTick = ({ x, y, payload, label }: { x?: number; y?: number; payload?: { value: string | number }; label?: (v: string | number) => string }) => {
  const name = label ? label(payload!.value) : String(payload!.value);
  const logo = ISSUER_LOGO[name];
  return (
    <foreignObject x={(x ?? 0) - 124} y={(y ?? 0) - 10} width={118} height={20}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, height: 20, fontSize: 11.5, color: "#57534e", whiteSpace: "nowrap" }}>
        <span style={{ width: 20, height: 14, display: "grid", placeItems: "center", flex: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo && <img src={`/logos/${logo}`} alt="" style={{ width: 20, height: 14, objectFit: "contain" }} />}
        </span>
        {name}
      </div>
    </foreignObject>
  );
};

export function ShadcnRich({ kind, logos = false }: { kind: "columns" | "bars" | "timeline"; logos?: boolean }) {
  if (kind === "columns") return (
    <Block title="Half came in 2025">
      <ChartContainer config={siteConfig} className="aspect-auto h-[168px] w-full">
        <BarChart data={YEARS_R} margin={{ top: 18, left: 0, right: 4 }}>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
          <YAxis ticks={[0, 2, 4, 6]} domain={[0, 6]} width={22} tickLine={false} axisLine={false} tick={AXIS} />
          <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "#d9d3cc" }} tickMargin={8} />
          <ChartTooltip cursor={{ fill: "#f3f1ed" }} content={<RichTip kind="year" />} />
          <Bar dataKey="certifications" radius={0} maxBarSize={64} activeBar={{ stroke: "#1c1917", strokeOpacity: 0.25, strokeWidth: 1 }}>
            {YEARS_R.map((d) => <Cell key={d.year} fill={d.year === "2025" ? HI : GREY} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Block>
  );
  if (kind === "bars") return (
    <Block title="Google Cloud leads with 4">
      <ChartContainer config={siteConfig} className="aspect-auto h-[196px] w-full">
        <BarChart data={ISSUERS_R} layout="vertical" margin={{ left: 0, right: 8 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="3 3" />
          <XAxis type="number" ticks={[0, 1, 2, 3, 4]} domain={[0, 4]} tickLine={false} axisLine={false} tick={AXIS} />
          <YAxis dataKey="issuer" type="category" tickLine={false} axisLine={{ stroke: "#d9d3cc" }} width={logos ? 128 : 116} interval={0} tick={logos ? <LogoTick /> : undefined} />
          <ChartTooltip cursor={{ fill: "#f3f1ed" }} content={<RichTip kind="issuer" />} />
          <Bar dataKey="certifications" radius={0} activeBar={{ stroke: "#1c1917", strokeOpacity: 0.25, strokeWidth: 1 }}>
            {ISSUERS_R.map((d) => <Cell key={d.issuer} fill={d.issuer === "Google Cloud" ? HI : GREY} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Block>
  );
  return (
    <Block title="OpenAI's three came in 2026">
      <ChartContainer config={siteConfig} className="aspect-auto h-[196px] w-full">
        <ScatterChart margin={{ left: 0, right: 8, top: 4 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" verticalPoints={[]} />
          <XAxis type="number" dataKey="t" domain={[0, 36]} ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]} interval={0}
            tickFormatter={(v: number) => (v % 12 === 6 ? String(2024 + Math.floor(v / 12)) : "")} tickLine={{ stroke: "#d9d3cc" }} tickSize={3} axisLine={{ stroke: "#d9d3cc" }} tick={AXIS} />
          <YAxis type="number" dataKey="row" domain={[-0.5, ROWS.length - 0.5]} ticks={ROWS.map((_, i) => i)} tickFormatter={(v: number) => ROWS[ROWS.length - 1 - v] ?? ""} tickLine={false} axisLine={false} width={logos ? 128 : 116}
            interval={0} tick={logos ? <LogoTick label={(v) => ROWS[ROWS.length - 1 - Number(v)] ?? ""} /> : undefined} />
          <ZAxis range={[56, 56]} />
          <ChartTooltip cursor={{ stroke: "#d9d3cc", strokeDasharray: "3 3" }} content={<RichTip kind="dot" />} />
          <Scatter data={DOTS} activeShape={{ r: 6, stroke: "#1c1917", strokeOpacity: 0.3, strokeWidth: 1 }}>
            {DOTS.map((d) => <Cell key={d.name} fill={d.issuer === "OpenAI" ? HI : GREY} />)}
          </Scatter>
        </ScatterChart>
      </ChartContainer>
    </Block>
  );
}
