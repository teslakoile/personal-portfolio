import type { Diagram } from "./protocol";

/**
 * Where every box, group, arrow, and label of a KYLLM diagram goes, from the
 * spec alone. The route runs it to reject a diagram whose text would not fit
 * (app/_kyllm/diagram.ts), and the chat runs it again to draw
 * (app/samples/kyllm-ui/AnswerDiagram.tsx), so both see the same layout.
 *
 * The grid is the locked block standard: two 144px columns with a 68px
 * gutter for link labels, 44px boxes (icon, name, detail) or 28px chips
 * (icon and name), 10px padding, groups 8px wider on three sides with a 22px
 * label band on top. Each part sits in a column and a row; chips that share
 * a cell stack. Rows are centred, so links across a row run straight.
 */

export const G = { W: 356, colX: [0, 212] as const, colW: 144, box: 44, chip: 28, chipGap: 6, pad: 10, inset: 8, band: 22, rowGap: 34 };
export const ROWS = 4;

// Geist advance widths in em for ASCII 32 to 126, measured in the browser; Geist Mono is 0.6em throughout
const SANS_400 = [250,213,346,478,629,802,620,178,274,274,430,558,201,419,201,480,663,384,619,613,615,626,593,524,604,593,297,297,544,540,544,559,906,668,680,703,694,603,590,700,713,270,597,640,580,877,743,739,650,733,672,640,552,689,667,945,606,576,544,347,455,347,426,557,248,551,595,546,595,561,395,594,581,244,260,590,267,877,581,573,595,595,379,520,392,575,536,819,585,537,537,389,264,389,523];
const SANS_500 = [243,228,361,515,643,810,649,186,290,290,427,562,213,418,213,494,673,406,630,625,629,641,604,531,624,606,302,302,546,544,546,570,925,689,688,713,701,609,595,713,716,280,607,656,583,890,745,751,657,745,680,654,568,694,688,968,633,594,561,361,470,361,438,558,258,565,608,563,608,576,412,607,591,256,284,609,282,885,591,588,608,608,394,537,410,586,560,829,607,553,552,395,274,395,523];
export type Font = "label" | "detail" | "group";
/** The text's width in px: names in Geist Mono 500 at 11px, details and link labels in Geist 400 at 10.5px, group labels in Geist 500 at 11px. */
export function textWidth(s: string, font: Font): number {
  if (font === "label") return s.length * 0.6 * 11;
  const t = font === "group" ? SANS_500 : SANS_400, size = font === "group" ? 11 : 10.5;
  let w = 0;
  for (const ch of s) { const c = ch.charCodeAt(0); w += (c >= 32 && c <= 126 ? t[c - 32] : 700) / 1000; }
  return w * size;
}

export type Box = { x: number; y: number; w: number; h: number };
export type PartBox = Box & { id: string; chip: boolean; mark: { x: number; y: number; size: number }; text: { x: number; room: number } };
export type GroupBox = Box & { id: string };
export type Wire = { d: string; segs: number[][]; from?: string; to?: string; label?: { x: number; y: number; anchor: "start" | "middle"; room: number; text: string } };
export type Layout = { parts: Map<string, PartBox>; groups: Map<string, GroupBox>; wires: Wire[]; height: number };
/** A piece of text and the room it has, for the fit check. */
export type Fit = { text: string; font: Font; room: number; where: string };

/** Lays out a spec the route has already checked for shape. Returns the layout, every text that must fit, and the first two links that would run along one line. */
export function layout(d: Diagram): { layout: Layout; fits: Fit[]; clash?: [string, string] } {
  const fits: Fit[] = [];
  const groupOf = new Map(d.parts.filter((p) => p.group).map((p) => [p.id, p.group!]));
  const cells = new Map<string, Diagram["parts"]>();
  for (const p of d.parts) { const k = `${p.col}:${p.row}`; cells.set(k, [...(cells.get(k) ?? []), p]); }
  const cellH = (ps: Diagram["parts"]) => (ps[0].chip ? ps.length * G.chip + (ps.length - 1) * G.chipGap : G.box);

  // a group's rows, so a row leaves room for the label band of a group that starts there and the inset of one that ends there
  const span = new Map<string, { top: number; bottom: number }>();
  for (const p of d.parts) if (p.group) {
    const s = span.get(p.group) ?? { top: p.row, bottom: p.row };
    span.set(p.group, { top: Math.min(s.top, p.row), bottom: Math.max(s.bottom, p.row) });
  }
  const rowTop: number[] = [], rowH: number[] = [];
  let y = 0;
  for (let r = 0; r < ROWS; r++) {
    const inRow = [...cells.entries()].filter(([k]) => +k.split(":")[1] === r);
    if (!inRow.length) { rowTop[r] = y; rowH[r] = 0; continue; }
    const starts = [...span.values()].some((s) => s.top === r), ends = [...span.values()].some((s) => s.bottom === r);
    rowTop[r] = y + (starts ? G.band : 0);
    rowH[r] = Math.max(...inRow.map(([, ps]) => cellH(ps)));
    y = rowTop[r] + rowH[r] + (ends ? G.inset : 0) + G.rowGap;
  }

  const parts = new Map<string, PartBox>();
  for (const [k, ps] of cells) {
    const [col, row] = k.split(":").map(Number);
    let top = rowTop[row] + (rowH[row] - cellH(ps)) / 2;
    for (const p of ps) {
      const inG = groupOf.has(p.id), chip = !!p.chip, h = chip ? G.chip : G.box;
      const x = G.colX[col] + (inG ? G.inset : 0), w = G.colW - (inG ? 2 * G.inset : 0);
      const size = chip ? 16 : 24, mx = x + (chip ? 6 : G.pad), tx = mx + size + (chip ? 8 : 10), room = x + w - G.pad - tx;
      parts.set(p.id, { id: p.id, x, y: top, w, h, chip, mark: { x: mx, y: top + (h - size) / 2, size }, text: { x: tx, room } });
      fits.push({ text: p.label, font: "label", room, where: `the name "${p.label}"` });
      if (p.detail) fits.push({ text: p.detail, font: "detail", room, where: `the detail "${p.detail}"` });
      top += h + G.chipGap;
    }
  }

  const groups = new Map<string, GroupBox>();
  for (const g of d.groups ?? []) {
    const bs = d.parts.filter((p) => p.group === g.id).map((p) => parts.get(p.id)!);
    const x = Math.min(...bs.map((b) => b.x)) - G.inset, top = Math.min(...bs.map((b) => b.y)) - G.band;
    const w = Math.max(...bs.map((b) => b.x + b.w)) + G.inset - x, h = Math.max(...bs.map((b) => b.y + b.h)) + G.inset - top;
    groups.set(g.id, { id: g.id, x, y: top, w, h });
    fits.push({ text: g.label, font: "group", room: w - 2 * G.pad, where: `the group label "${g.label}"` });
  }

  // a link from outside a group to a part inside it stops at the group's edge, so it never crosses the group's label
  const end = (id: string, other: string): Box => {
    const g = groupOf.get(id);
    if (g && g !== other && groupOf.get(other) !== g) return groups.get(g)!;
    return parts.get(id) ?? groups.get(id)!;
  };
  const wires: Wire[] = [];
  for (const l of d.links) {
    const a = end(l.from, l.to), b = end(l.to, l.from), text = l.label;
    const acy = a.y + a.h / 2, bcy = b.y + b.h / 2, sameCol = Math.abs(a.x + a.w / 2 - (b.x + b.w / 2)) < G.colW / 2;
    let wire: Wire;
    if (sameCol) {
      // straight down (or up) the column, the label beside the arrow
      const x = Math.round(Math.max(a.x, b.x) + Math.min(a.w, b.w) / 2) + 0.5, down = b.y > a.y;
      const y1 = down ? a.y + a.h : a.y, y2 = down ? b.y - 2 : b.y + b.h + 2;
      const room = Math.min(a.x + a.w, b.x + b.w) - x - 9;
      wire = { d: `M${x} ${y1} V${y2}`, segs: [[x, y1, x, y2]], label: text ? { x: x + 7, y: (y1 + y2) / 2 + 4, anchor: "start", room, text } : undefined };
    } else if (Math.max(a.y, b.y) + 8 <= Math.min(a.y + a.h, b.y + b.h) - 8) {
      // the boxes overlap side by side: straight across the gutter at the smaller box's middle, the label above the arrow
      const lo = Math.max(a.y, b.y) + 8, hi = Math.min(a.y + a.h, b.y + b.h) - 8, mid = a.h <= b.h ? acy : bcy;
      const ly = Math.round(Math.min(hi, Math.max(lo, mid))) + 0.5, right = b.x > a.x;
      const x1 = right ? a.x + a.w : a.x, x2 = right ? b.x - 2 : b.x + b.w + 2;
      wire = { d: `M${x1} ${ly} H${x2}`, segs: [[x1, ly, x2, ly]], label: text ? { x: (x1 + x2) / 2, y: ly - 6, anchor: "middle", room: Math.abs(x2 - x1) - 4, text } : undefined };
    } else {
      // elbow: out of the side facing the target, along the middle of the gutter, in level with the target
      const right = b.x > a.x, x1 = right ? a.x + a.w : a.x, x2 = right ? b.x - 2 : b.x + b.w + 2;
      const gx = Math.round((x1 + x2) / 2) + 0.5, sy = Math.round(b.y > a.y ? a.y + a.h * 0.72 : a.y + a.h * 0.28) + 0.5, ey = Math.round(bcy) + 0.5;
      wire = { d: `M${x1} ${sy} H${gx} V${ey} H${x2}`, segs: [[x1, sy, gx, sy], [gx, sy, gx, ey], [gx, ey, x2, ey]],
        label: text ? { x: (gx + x2) / 2, y: ey - 6, anchor: "middle", room: Math.abs(x2 - gx) - 4, text } : undefined };
    }
    if (wire.label) fits.push({ text: wire.label.text, font: "detail", room: wire.label.room, where: `the link label "${wire.label.text}"` });
    wires.push({ ...wire, from: l.from, to: l.to });
  }

  // two links that run along the same line read as one: report the first pair
  const along = (p: number[], q: number[]) => {
    const [a1, a2, a3, a4] = p, [b1, b2, b3, b4] = q;
    if (a2 === a4 && b2 === b4 && Math.abs(a2 - b2) < 3) return Math.min(Math.max(a1, a3), Math.max(b1, b3)) - Math.max(Math.min(a1, a3), Math.min(b1, b3)) > 2;
    if (a1 === a3 && b1 === b3 && Math.abs(a1 - b1) < 3) return Math.min(Math.max(a2, a4), Math.max(b2, b4)) - Math.max(Math.min(a2, a4), Math.min(b2, b4)) > 2;
    return false;
  };
  let clash: [Wire, Wire] | undefined;
  for (let i = 0; i < wires.length && !clash; i++) for (let j = i + 1; j < wires.length && !clash; j++)
    if (wires[i].segs.some((p) => wires[j].segs.some((q) => along(p, q)))) clash = [wires[i], wires[j]];

  const all = [...parts.values(), ...groups.values()];
  return { layout: { parts, groups, wires, height: Math.max(...all.map((b) => b.y + b.h)) + 1 }, fits, clash: clash && [clash[0].from + " to " + clash[0].to, clash[1].from + " to " + clash[1].to] };
}
