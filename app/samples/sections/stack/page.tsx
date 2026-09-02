import shell from "../_shared.module.css";
import quiet from "../../quiet/styles.module.css";
import { Marquee } from "../../quiet/Marquee";
import { StackLine } from "../../quiet/StackLine";
import { StackGrid } from "../../quiet/StackGrid";
import { StackRails } from "../../quiet/StackRails";
import { StackPager } from "../../quiet/StackPager";

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className={shell.vstage}>
      <div className={quiet.root} data-variant="swiss" style={{ minHeight: 0, background: "transparent" }}>
        <div className={quiet.container}>{children}</div>
      </div>
    </div>
  );
}

const BLOCKS = [
  {
    label: "★ V1 · Quiet Line (recommended if the band keeps motion)",
    note: "One slow ruled row, bare logos, no pills. Half the visual weight of the current band, same ambient life. Hover pauses and spotlights.",
    node: <StackLine />,
  },
  {
    label: "V2 · Hairline Grid (recommended if the band goes still)",
    note: "Every tool visible at once inside a drafted 1px lattice. Zero motion, scans in one glance, quietly Swiss.",
    node: <StackGrid />,
  },
  {
    label: "V3 · Grouped Rails",
    note: "One slim rail per skill group, titles verbatim from the Skills spec sheet. The most informative take, but it overlaps Skills the most.",
    node: <StackRails />,
  },
  {
    label: "V4 · Paged Rail",
    note: "The familiar pills, but the reader drives: snap scrolling, back/forward controls, fades only where more remains. No autoplay.",
    node: <StackPager />,
  },
];

export default function StackCompare() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Tech stack band · alternatives</p>
        <h1 className={shell.pageTitle}>Tech stack band</h1>
        <p className={shell.pageHint}>
          The current band is two pill rows scrolling opposite ways, the loudest element on a restrained page.
          These four are <strong style={{ color: "var(--fg)" }}>structurally different</strong> takes, not new hover styles:
          less motion, or no motion, or motion the reader controls. Hover everything.
        </p>

        {BLOCKS.map((b) => (
          <div key={b.label} className={shell.vblock}>
            <p className={shell.vlabel}>{b.label}</p>
            <p className={shell.pageHint}>{b.note}</p>
            <Stage>{b.node}</Stage>
          </div>
        ))}

        <div className={shell.vblock}>
          <p className={shell.vlabel}>Current · two-row marquee, for reference</p>
          <Stage><Marquee /></Stage>
        </div>
      </div>
    </div>
  );
}
