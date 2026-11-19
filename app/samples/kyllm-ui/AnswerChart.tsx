"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import type { Chart } from "../../_kyllm/protocol";
import { orgLogo, toolLogo } from "../../_brand/logos";
import { sample } from "../sampleContent";
import { ChartContainer, ChartTooltip, type ChartConfig } from "../kyllm-charts/ui/chart";
import s from "./answerChart.module.css";

/**
 * A KYLLM answer's chart, drawn from the spec the route checked
 * (app/_kyllm/chart.ts). The locked block standard: a card with the finding
 * as its title and a source line, grey marks with one orange row, square
 * bars, a value axis with a dashed grid, and the site tooltip on hover. Bars
 * put each category's own logo beside its name when the site has one.
 */

const GREY = "#e4dfd8", HI = "#F26A4B", GRID = "#ece8e3", AXIS_LINE = "#d9d3cc";
const AXIS = { fill: "#a8a29e", fontSize: 11 };
const config = { value: { label: "Value", color: GREY } } satisfies ChartConfig;

/** 0 to a round number above the largest value, in at most five whole steps */
function scale(max: number): number[] {
  const raw = Math.max(1, max) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((x) => x >= raw)!;
  const top = Math.ceil(max / step) * step || step;
  return Array.from({ length: top / step + 1 }, (_, i) => +(i * step).toFixed(6));
}

const unitFor = (unit: string, n: number) => (n === 1 ? unit.replace(/s$/, "") : unit);
// a certification issuer takes the logo its own entry names, as the Certifications section shows it
const ISSUER = new Map<string, string>(sample.certifications.filter((c) => c.logo).map((c) => [c.issuer, `/logos/${c.logo}.svg`]));
const logoOf = (name: string) => toolLogo(name) ?? orgLogo(name) ?? ISSUER.get(name) ?? null;
type Row = Chart["rows"][number];

const Tip = ({ active, payload, unit }: { active?: boolean; payload?: { payload: Row }[]; unit: string }) => {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className={s.tip}>
      <b>{r.label}: {r.value.toLocaleString("en-US")} {unitFor(unit, r.value)}</b>
      {r.detail ? <span>{r.detail}</span> : null}
    </div>
  );
};

/** A category tick: the logo, then the name, cut with an ellipsis if it runs past the column. */
const CategoryTick = ({ x, y, payload, width, logos }: { x?: number; y?: number; payload?: { value: string }; width: number; logos: boolean }) => {
  const name = String(payload?.value ?? "");
  const logo = logos ? logoOf(name) : null;
  return (
    // Recharts puts the tick 6px inside the axis column, so the box starts at the column's left edge (x 0), never past it
    <foreignObject x={(x ?? 0) - width + 6} y={(y ?? 0) - 10} width={width - 10} height={20}>
      <div className={s.cat} title={name}>
        {logos ? (
          <span className={s.mark}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt="" /> : null}
          </span>
        ) : null}
        <span className={s.name}>{name}</span>
      </div>
    </foreignObject>
  );
};

export function AnswerChart({ chart }: { chart: Chart }) {
  const { kind, rows, highlight, unit } = chart;
  const ticks = scale(Math.max(...rows.map((r) => r.value)));
  const top = ticks.at(-1)!;
  const fill = (r: Row) => (r.label === highlight ? HI : GREY);
  const summary = `${chart.title}. ${rows.map((r) => `${r.label}: ${r.value} ${unitFor(unit, r.value)}`).join(", ")}.`;
  const active = { stroke: "#1c1917", strokeOpacity: 0.25, strokeWidth: 1 };

  if (kind === "columns") return (
    <figure className={s.block} aria-label={summary}>
      <figcaption className={s.title}>{chart.title}</figcaption>
      <ChartContainer config={config} className={`aspect-auto h-[168px] w-full ${s.chart}`}>
        <BarChart data={rows} margin={{ top: 18, left: 0, right: 4 }}>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
          <YAxis ticks={ticks} domain={[0, top]} width={String(top).length * 7 + 14} tickLine={false} axisLine={false} tick={AXIS} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: AXIS_LINE }} tickMargin={8} interval={0} />
          <ChartTooltip cursor={{ fill: "#f3f1ed" }} content={<Tip unit={unit} />} />
          <Bar dataKey="value" radius={0} maxBarSize={64} activeBar={active} isAnimationActive={false}>
            {rows.map((r) => <Cell key={r.label} fill={fill(r)} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className={s.source}>{chart.source}</p>
    </figure>
  );

  const logos = rows.some((r) => logoOf(r.label));
  // the label column fits the longest name (about 6.4px a character at 11.5px), plus the logo slot
  const width = Math.min(170, Math.max(72, Math.max(...rows.map((r) => r.label.length)) * 6.4 + (logos ? 31 : 6) + 8));
  return (
    <figure className={s.block} aria-label={summary}>
      <figcaption className={s.title}>{chart.title}</figcaption>
      <ChartContainer config={config} className={`aspect-auto w-full ${s.chart}`} style={{ height: rows.length * 28 + 28 }}>
        <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 8 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="3 3" />
          <XAxis type="number" ticks={ticks} domain={[0, top]} tickLine={false} axisLine={false} tick={AXIS} />
          <YAxis dataKey="label" type="category" tickLine={false} axisLine={{ stroke: AXIS_LINE }} width={width} interval={0}
            tick={(p: object) => <CategoryTick {...p} width={width} logos={logos} />} />
          <ChartTooltip cursor={{ fill: "#f3f1ed" }} content={<Tip unit={unit} />} />
          <Bar dataKey="value" radius={0} activeBar={active} isAnimationActive={false}>
            {rows.map((r) => <Cell key={r.label} fill={fill(r)} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className={s.source}>{chart.source}</p>
    </figure>
  );
}
