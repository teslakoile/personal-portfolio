import shell from "../_shared.module.css";
import quiet from "../../quiet/styles.module.css";
import { GlowTicker } from "../../quiet/GlowTicker";

const VARIANTS = [
  { g: 1 as const, label: "G1 · Static glow (base)", note: "the soft coral glow you picked, no animation" },
  { g: 2 as const, label: "G2 · Rotating sunburst", note: "coral rays spin slowly behind the pill, like a sun" },
  { g: 3 as const, label: "G3 · Pulsing corona", note: "the glow breathes in and out, like a glowing sun" },
];

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className={shell.vstage}>
      <div className={quiet.root} data-variant="swiss" style={{ minHeight: 0, background: "transparent" }}>
        <div className={quiet.container}>{children}</div>
      </div>
    </div>
  );
}

export default function GlowTickerCompare() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Ticker glow · animated variations</p>
        <h1 className={shell.pageTitle}>Sun glow variations</h1>
        <p className={shell.pageHint}>
          Same V3 float you liked, the difference is the <strong style={{ color: "var(--fg)" }}>orange glow behind the pill</strong>.
          Hover the pills in each to see it.
        </p>

        {VARIANTS.map((x) => (
          <div key={x.g} className={shell.vblock}>
            <p className={shell.vlabel}>{x.label} · {x.note}</p>
            <Stage><GlowTicker variant={x.g} /></Stage>
          </div>
        ))}
      </div>
    </div>
  );
}
