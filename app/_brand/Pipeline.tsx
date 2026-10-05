/**
 * Pipeline diagram: source lanes of grey (raw) blocks converge on one dark
 * hub, which fans out to output lanes of colored (processed) blocks. Blocks
 * here are representative records, so the caption beside the diagram must say
 * so. Gaps come from a fixed seed, so every render draws the same SVG.
 * Labels are code identifiers, the one place Geist Mono appears.
 */

const W = 992, BW = 24, BH = 9, GP = 4, SRC_X = 86, OUT_X = 720, HUB_X = 580, HUB_W = 58, HUB_H = 56;
const PALETTE = ["var(--b1)", "var(--b1)", "var(--b2)", "var(--b2)", "var(--b3)", "var(--b3)", "var(--b4)"];

type Lane = { label: string; y: number; rects: { x: number; fill: string }[] };

/** Pure layout: lane positions and which blocks are present, from a fixed seed. */
function layout(sources: string[], outputs: string[], residual: boolean) {
  let seed = 5;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const H = Math.max(sources.length, outputs.length) * 52 + 24;
  const laneY = (n: number, i: number) => (n === 1 ? H / 2 - 4.5 : 22 + (i * (H - 48)) / (n - 1));

  const src: Lane[] = sources.map((label, li) => ({
    label,
    y: laneY(sources.length, li),
    rects: Array.from({ length: 12 }, (_, i) => (rand() < 0.16 ? null : { x: SRC_X + i * (BW + GP), fill: "var(--raw)" }))
      .filter((r): r is { x: number; fill: string } => r !== null),
  }));
  const out: Lane[] = outputs.map((label, ti) => {
    const grey = residual && ti === outputs.length - 1;
    const rects: { x: number; fill: string }[] = [];
    for (let i = 0; i < 8; i++) {
      if (rand() < (grey ? 0.65 : 0.1)) continue;
      rects.push({ x: OUT_X + i * (BW + GP), fill: grey ? "var(--raw)" : PALETTE[Math.floor(rand() * PALETTE.length)] });
    }
    return { label, y: laneY(outputs.length, ti), rects };
  });
  return { H, src, out };
}

export function Pipeline({ sources, hub, outputs, residual = false }: {
  sources: string[];
  hub: string;
  outputs: string[];
  /** last output lane stays grey: records the hub could not process */
  residual?: boolean;
}) {
  const { H, src, out } = layout(sources, outputs, residual);
  const mid = H / 2;
  const text = { fontFamily: "var(--mono)", fontSize: 11.5, fill: "var(--ink-3)" } as const;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`${sources.length} sources flow into ${hub}, which writes ${outputs.length} outputs`}>
      {src.map((l) => (
        <g key={l.label}>
          <text x={0} y={l.y + 8} {...text}>{l.label}</text>
          {l.rects.map((r) => <rect key={r.x} x={r.x} y={l.y} width={BW} height={BH} fill={r.fill} />)}
          <path d={`M ${SRC_X + 12 * (BW + GP)} ${l.y + 4.5} C 500 ${l.y + 4.5}, 500 ${mid}, ${HUB_X} ${mid}`} stroke="var(--line-2)" fill="none" />
        </g>
      ))}
      <rect x={HUB_X} y={mid - HUB_H / 2} width={HUB_W} height={HUB_H} fill="var(--ink)" />
      <text x={HUB_X + HUB_W / 2} y={mid + 4} textAnchor="middle" {...text} fontSize={11} fill="#fff">{hub}</text>
      {out.map((l) => (
        <g key={l.label}>
          <path d={`M ${HUB_X + HUB_W} ${mid} C 690 ${mid}, 690 ${l.y + 4.5}, ${OUT_X} ${l.y + 4.5}`} stroke="var(--line-2)" fill="none" />
          {l.rects.map((r) => <rect key={r.x} x={r.x} y={l.y} width={BW} height={BH} fill={r.fill} />)}
          <text x={W} y={l.y + 8} textAnchor="end" {...text}>{l.label}</text>
        </g>
      ))}
    </svg>
  );
}
