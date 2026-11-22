import type { Diagram, PartKind } from "./protocol";
import { ROWS, layout, textWidth } from "./diagramLayout";

/**
 * Places a diagram's parts on the two-column grid, so the model only names
 * parts and links (app/_kyllm/diagram.ts). It tries every arrangement and
 * keeps the one that breaks no rule and reads best.
 *
 * What gets placed:
 *   a group of two or more parts with no details  one cell, its parts as stacked chips
 *   any other group                               its parts in a column, one row each
 *   a part outside any group                      one cell
 *
 * Rules an arrangement must keep: no arrow runs through a box, no two arrows
 * run along one line, and every group label fits. A link label that does not
 * fit costs points instead, and is dropped if the best arrangement still
 * cannot fit it.
 *
 * What reads best: people, AI assistants, extensions, and browsers on the
 * left; arrows that run down or across rather than up or back; straight
 * arrows over elbows; fewer rows; and the parts in the order the model gave.
 */

export type Plan = Omit<Diagram, "parts"> & { parts: { id: string; label: string; detail?: string; kind: PartKind; group?: string }[] };
export type Placed = { diagram: Diagram; dropped: string[] } | { problems: string[] };

const LEFT = new Set<PartKind>(["person", "assistant", "extension", "browser"]);

type Unit = { ids: string[]; chips: boolean; h: number; left: number };

/** Whether a group's parts are drawn as chips in one cell. */
export const chipGroup = (plan: Plan, group: string) => {
  const ms = plan.parts.filter((p) => p.group === group);
  return ms.length >= 2 && ms.length <= 4 && ms.every((p) => !p.detail);
};

function units(plan: Plan): Unit[] {
  const out: Unit[] = [], seen = new Set<string>();
  for (const p of plan.parts) {
    if (seen.has(p.id)) continue;
    const ms = p.group ? plan.parts.filter((x) => x.group === p.group) : [p];
    ms.forEach((m) => seen.add(m.id));
    const chips = !!p.group && chipGroup(plan, p.group);
    // how many of its parts want the left column, less how many want the right
    const left = ms.reduce((n, m) => n + (LEFT.has(m.kind) ? 1 : -1), 0);
    out.push({ ids: ms.map((m) => m.id), chips, h: chips ? 1 : ms.length, left });
  }
  return out;
}

/** The diagram for one arrangement: each unit's column and first row. */
function build(plan: Plan, us: Unit[], at: [number, number][], drop: Set<number>): Diagram {
  const pos = new Map<string, { col: 0 | 1; row: number; chip: boolean }>();
  us.forEach((u, i) => u.ids.forEach((id, k) => pos.set(id, { col: at[i][0] as 0 | 1, row: at[i][1] + (u.chips ? 0 : k), chip: u.chips })));
  return {
    ...plan,
    parts: plan.parts.map((p) => { const q = pos.get(p.id)!; return { ...p, col: q.col, row: q.row, ...(q.chip ? { chip: true } : {}) }; }),
    links: plan.links.map((l, i) => (drop.has(i) && l.label ? { from: l.from, to: l.to } : l)),
  };
}

/** Rule breaks (hard) and the links whose label does not fit (soft) for one arrangement. */
function judge(d: Diagram): { hard: string[]; tight: number[] } {
  const hard: string[] = [], tight: number[] = [];
  const part = new Map(d.parts.map((p) => [p.id, p]));
  const span = (id: string) => {
    const p = part.get(id);
    if (p) return { col: p.col, r0: p.row, r1: p.row, ids: [p.id] };
    const ms = d.parts.filter((x) => x.group === id);
    return { col: ms[0].col, r0: Math.min(...ms.map((m) => m.row)), r1: Math.max(...ms.map((m) => m.row)), ids: ms.map((m) => m.id) };
  };
  for (const l of d.links) {
    const a = span(l.from), b = span(l.to);
    if (a.col !== b.col) continue;
    const lo = Math.min(a.r1, b.r1) + 1, hi = Math.max(a.r0, b.r0) - 1;
    const through = d.parts.find((p) => p.col === a.col && p.row >= lo && p.row <= hi && !a.ids.includes(p.id) && !b.ids.includes(p.id));
    if (through) hard.push(`the arrow from ${l.from} to ${l.to} crosses ${through.label}`);
  }
  const { fits, clash } = layout(d);
  if (clash) hard.push(`the arrows ${clash[0]} and ${clash[1]} run along one line`);
  for (const f of fits) {
    if (textWidth(f.text, f.font) <= f.room) continue;
    if (f.font === "group") hard.push(`${f.where} does not fit`);
    else if (f.where.startsWith("the link")) tight.push(d.links.findIndex((l) => l.label === f.text));
  }
  return { hard, tight };
}

function score(d: Diagram, us: Unit[], at: [number, number][], tight: number): number {
  const part = new Map(d.parts.map((p) => [p.id, p]));
  const where = (id: string) => { const p = part.get(id); if (p) return p; const ms = d.parts.filter((x) => x.group === id); return { col: ms[0].col, row: ms[0].row }; };
  let s = tight * 4;
  us.forEach((u, i) => { if (u.left > 0 && at[i][0] === 1) s += 3 * u.left; if (u.left < 0 && at[i][0] === 0) s += -1.5 * u.left; });
  for (const l of d.links) {
    const a = where(l.from), b = where(l.to);
    if (a.col === b.col && b.row < a.row) s += 2; // up a column
    if (a.col !== b.col && a.row !== b.row) s += 1.5; // an elbow
    if (a.col === 1 && b.col === 0) s += 1; // back to the left
  }
  s += 0.4 * (Math.max(...d.parts.map((p) => p.row)) + 1);
  d.parts.forEach((p, i) => (s += 0.01 * Math.abs(i - (p.row * 2 + p.col))));
  return s;
}

/** The best arrangement of a plan, or the rule breaks of the closest one when none keeps every rule. */
export function place(plan: Plan): Placed {
  const us = units(plan);
  // big units first, so the search fails fast when they don't fit
  const order = us.map((_, i) => i).sort((x, y) => us[y].h - us[x].h);
  const free = [Array(ROWS).fill(true), Array(ROWS).fill(true)];
  const at: [number, number][] = us.map(() => [0, 0]);
  let best: { s: number; d: Diagram } | null = null, closest: { n: number; hard: string[] } | null = null;
  let tried = 0;

  const visit = (k: number) => {
    if (tried > 60_000) return;
    if (k === order.length) {
      tried++;
      const d = build(plan, us, at, new Set());
      const { hard, tight } = judge(d);
      if (hard.length) { if (!closest || hard.length < closest.n) closest = { n: hard.length, hard }; return; }
      const s = score(d, us, at, tight.length);
      if (!best || s < best.s) best = { s, d: tight.length ? build(plan, us, at, new Set(tight)) : d };
      return;
    }
    const i = order[k], u = us[i];
    for (let col = 0; col < 2; col++) for (let row = 0; row + u.h <= ROWS; row++) {
      if (!Array.from({ length: u.h }, (_, j) => free[col][row + j]).every(Boolean)) continue;
      for (let j = 0; j < u.h; j++) free[col][row + j] = false;
      at[i] = [col, row];
      visit(k + 1);
      for (let j = 0; j < u.h; j++) free[col][row + j] = true;
    }
  };
  if (us.reduce((n, u) => n + u.h, 0) > 2 * ROWS) return { problems: ["the parts need more than the 8 places on the grid: drop a part, or give fewer parts in a group details"] };
  visit(0);
  if (!best) return { problems: closest ? (closest as { hard: string[] }).hard : ["no arrangement fits these parts and links"] };
  const d = (best as { d: Diagram }).d;
  const dropped = plan.links.filter((l, i) => l.label && !d.links[i].label).map((l) => l.label!);
  return { diagram: d, dropped };
}
