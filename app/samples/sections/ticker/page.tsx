import shell from "../_shared.module.css";
import quiet from "../../quiet/styles.module.css";
import { TickerLab } from "../../quiet/TickerLab";
import { VelocityTicker } from "../../quiet/VelocityTicker";

const VARIANTS = [
  { v: 1 as const, label: "V1 · Dock", note: "pills swell as your cursor sweeps the row (macOS-dock style)" },
  { v: 2 as const, label: "V2 · Ink", note: "coral floods the pill on hover, text turns white" },
  { v: 3 as const, label: "V3 · Pop & cast", note: "the pill lifts and floats with a deep shadow, logo enlarges" },
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

export default function TickerCompare() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Ticker interactions · research-backed</p>
        <h1 className={shell.pageTitle}>Ticker interactions</h1>
        <p className={shell.pageHint}>
          The thing that makes a ticker feel premium isn&rsquo;t the hover — it&rsquo;s <strong style={{ color: "var(--fg)" }}>ambient life tied to scroll</strong>.
          The featured one below reacts to the page; the other three are hover-only.
        </p>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>
            ★ Scroll-reactive (recommended) · <strong style={{ color: "var(--fg)" }}>scroll the page up/down</strong> — the rows lean + speed up, then settle. Hover a pill to float it.
          </p>
          <Stage><VelocityTicker /></Stage>
        </div>

        <p className={shell.pageHint} style={{ marginTop: 40 }}>The earlier hover-only set, for comparison:</p>
        {VARIANTS.map((x) => (
          <div key={x.v} className={shell.vblock}>
            <p className={shell.vlabel}>{x.label} · {x.note}</p>
            <Stage><TickerLab variant={x.v} /></Stage>
          </div>
        ))}
      </div>
    </div>
  );
}
