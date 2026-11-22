"use client";

import { useId, useState, type ComponentType } from "react";
import {
  Activity, AppWindow, Bot, Cloud, Container, Database, Globe, HardDrive, Monitor, Package, Plug, Puzzle,
  Server, Sparkles, Split, User, Workflow, Zap, type LucideProps,
} from "lucide-react";
import type { Diagram, PartKind } from "../../_kyllm/protocol";
import { G, layout } from "../../_kyllm/diagramLayout";
import { serviceIcon } from "../../_brand/serviceIcons";
import s from "./answerDiagram.module.css";

/**
 * A KYLLM answer's architecture diagram, drawn from the spec the route
 * checked (app/_kyllm/diagram.ts) with the layout both share
 * (app/_kyllm/diagramLayout.ts). The locked block standard: a card with the
 * finding as its title, parts on a two-column grid with a tinted tile per
 * kind (or the vendor's official icon when a part names a cloud service),
 * the subject in light blue, dashed groups, the stack listed under the
 * drawing, and the site tooltip on hover.
 */

type Cat = "client" | "compute" | "data" | "ai" | "external";
const KIND: Record<PartKind, [ComponentType<LucideProps>, Cat, string]> = {
  person: [User, "client", "Person"], assistant: [Bot, "ai", "AI assistant"], model: [Sparkles, "ai", "Model"],
  app: [AppWindow, "compute", "App"], service: [Server, "compute", "Service"], pipeline: [Workflow, "compute", "Pipeline"],
  database: [Database, "data", "Database"], storage: [HardDrive, "data", "File storage"], extension: [Puzzle, "client", "Extension"],
  browser: [Monitor, "client", "Browser"], external: [Plug, "external", "Outside API"], cloud: [Cloud, "external", "Cloud"],
  container: [Container, "compute", "Containers"], loadbalancer: [Split, "client", "Load balancer"], dns: [Globe, "client", "DNS"],
  cache: [Zap, "data", "Cache"], registry: [Package, "data", "Registry"], monitor: [Activity, "external", "Monitoring"],
};
const TINT: Record<Cat, [string, string]> = {
  client: ["#f3f1ed", "#57534e"], compute: ["#e3ecf5", "#3d5f80"], data: ["#e2efe7", "#2f6b4f"], ai: ["#fbf0dc", "#8a5a10"], external: ["#faf9f7", "#a8a29e"],
};
const SUBJECT = { fill: "#e3ecf5", stroke: "#86a9c8", ink: "#3d5f80" };

type Tip = { x: number; y: number; title: string; text: string } | null;

export function AnswerDiagram({ diagram }: { diagram: Diagram }) {
  const { layout: L } = layout(diagram);
  const [tip, setTip] = useState<Tip>(null);
  const arrow = `ah${useId().replace(/:/g, "")}`;
  const byId = new Map(diagram.parts.map((p) => [p.id, p]));
  const summary = `${diagram.title}. ${diagram.links.map((l) => {
    const name = (id: string) => byId.get(id)?.label ?? diagram.groups?.find((g) => g.id === id)?.label ?? id;
    return `${name(l.from)} to ${name(l.to)}${l.label ? `: ${l.label}` : ""}`;
  }).join("; ")}.`;

  return (
    <figure className={s.block} aria-label={summary}>
      <figcaption className={s.title}>{diagram.title}</figcaption>
      <div className={s.stage}>
        <svg viewBox={`0 -1 ${G.W} ${L.height + 2}`} className={s.svg} aria-hidden="true">
          <defs>
            <marker id={arrow} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0L8 4L0 8z" fill="#a8a29e" />
            </marker>
          </defs>
          {(diagram.groups ?? []).map((g) => {
            const b = L.groups.get(g.id)!, subj = diagram.subject === g.id;
            return (
              <g key={g.id}>
                <rect x={b.x + 0.5} y={b.y + 0.5} width={b.w - 1} height={b.h - 1} rx={10}
                  fill={subj ? SUBJECT.fill : "#faf9f7"} stroke={subj ? SUBJECT.stroke : "#d9d3cc"} strokeDasharray={subj ? undefined : "3 3"} />
                <text x={b.x + G.pad} y={b.y + 15} className={s.group} fill={subj ? SUBJECT.ink : "#a8a29e"} fontWeight={subj ? 500 : 400}>{g.label}</text>
              </g>
            );
          })}
          {L.wires.map((w, i) => (
            <g key={i}>
              <path d={w.d} fill="none" stroke="#a8a29e" strokeWidth={1.2} markerEnd={`url(#${arrow})`} />
              {w.label ? <text x={w.label.x} y={w.label.y} textAnchor={w.label.anchor} className={s.link}>{w.label.text}</text> : null}
            </g>
          ))}
          {diagram.parts.map((p) => {
            const b = L.parts.get(p.id)!, subj = diagram.subject === p.id;
            const [Icon, cat, kindName] = KIND[p.kind], [tint, ink] = TINT[cat];
            const svc = serviceIcon(p.label), m = b.mark;
            const show = () => setTip({ x: b.x + b.w / 2, y: b.y, title: p.label, text: p.detail ? `${kindName} · ${p.detail}` : kindName });
            return (
              <g key={p.id} className={s.part} onMouseEnter={show} onMouseLeave={() => setTip(null)}>
                <rect x={b.x + 0.5} y={b.y + 0.5} width={b.w - 1} height={b.h - 1} rx={b.chip ? 7 : 9}
                  fill={subj ? SUBJECT.fill : "#fff"} stroke={subj ? SUBJECT.stroke : "#d9d3cc"} />
                {svc ? (
                  // the vendor's icon as shipped, never cropped or recoloured
                  <image href={svc.src} x={m.x} y={m.y} width={m.size} height={m.size} preserveAspectRatio="xMidYMid meet" />
                ) : (
                  <>
                    <rect x={m.x} y={m.y} width={m.size} height={m.size} rx={m.size > 20 ? 6 : 4} fill={tint} />
                    <Icon x={m.x + (m.size - (m.size > 20 ? 14 : 11)) / 2} y={m.y + (m.size - (m.size > 20 ? 14 : 11)) / 2}
                      width={m.size > 20 ? 14 : 11} height={m.size > 20 ? 14 : 11} color={ink} strokeWidth={1.25} absoluteStrokeWidth />
                  </>
                )}
                <text x={b.text.x} y={p.detail ? b.y + 19 : b.y + b.h / 2 + 4} className={s.name}>{p.label}</text>
                {p.detail ? <text x={b.text.x} y={b.y + 33} className={s.detail}>{p.detail}</text> : null}
              </g>
            );
          })}
        </svg>
        {tip ? (
          <div className={s.tip} role="tooltip" style={{ left: `${(tip.x / G.W) * 100}%`, top: `${(tip.y / (L.height + 2)) * 100}%` }}>
            <b>{tip.title}</b>
            <span>{tip.text}</span>
          </div>
        ) : null}
      </div>
      {diagram.stack?.length ? (
        <div className={s.stack}>Built with {diagram.stack.map((t) => <code key={t}>{t}</code>)}</div>
      ) : null}
      <p className={s.source}>{diagram.source}</p>
    </figure>
  );
}
