import type { Metadata } from "next";
import { BrandRoot, Frame } from "../../../_brand/kit";
import { Rail } from "../../../_brand/Rail";
import { Cursor } from "../../../_brand/Cursor";
import { MotionRoot } from "../../../_brand/MotionRoot";
import { AskPanel } from "../../../_brand/sections/AskPanel";
import { Certifications } from "../../../_brand/sections/Certifications";
import { Footer } from "../../../_brand/sections/Footer";
import m from "./motion.module.css";

/** Before and after for the redesign's Motion work: every piece rendered
    twice, with its animation off (before) and on (after). */
export const metadata: Metadata = {
  title: "Motion Before and After | Kyle Naranjo",
  robots: { index: false, follow: false },
};

/** dummy sections the two rails track; ids are unique to this page */
const DEMO = [
  { id: "mo-about", label: "About" },
  { id: "mo-experience", label: "Experience" },
  { id: "mo-projects", label: "Projects" },
  { id: "mo-skills", label: "Skills" },
  { id: "mo-certs", label: "Certifications" },
];

function Pair({ title, note, before, after, stack }: { title: string; note: string; before: React.ReactNode; after: React.ReactNode; stack?: boolean }) {
  return (
    <section className={m.row} aria-label={title}>
      <h2>{title}</h2>
      <p className={m.note}>{note}</p>
      <div className={stack ? m.stack : m.pair}>
        <div className={m.side}><p className={m.tag}>Before</p>{before}</div>
        <div className={m.side}><p className={`${m.tag} ${m.after}`}>After · Motion</p>{after}</div>
      </div>
    </section>
  );
}

export default function MotionBeforeAfter() {
  return (
    <BrandRoot>
      <MotionRoot>
        <Cursor />
        <div className={m.page}>
          <header className={m.intro}>
            <h1>Motion Before and After</h1>
            <p>Each piece of the redesign twice: on the left (or top) as it was, on the right (or bottom) with Motion. Everything here is live, so try each one.</p>
          </header>

          {/* 1 · rail: both rails follow the same five sections as you scroll this row */}
          <section className={m.row} aria-label="Sidebar marker">
            <h2>1 · Sidebar Marker</h2>
            <p className={m.note}>Scroll through the sections on the right, or click a row. Before, the coral tick jumps to the new row. After, it slides there on a spring.</p>
            <div className={m.railRow}>
              <div className={m.railCol}><p className={m.tag}>Before</p><div className={m.sticky}><Rail wordmark="Kyle Naranjo" items={DEMO} active="mo-about" animate={false} /></div></div>
              <div className={m.railCol}><p className={`${m.tag} ${m.after}`}>After · Motion</p><div className={m.sticky}><Rail wordmark="Kyle Naranjo" items={DEMO} active="mo-about" /></div></div>
              <div className={m.sections}>
                {DEMO.map((s, i) => (
                  <div key={s.id} id={s.id} className={m.demo}><span>{String(i + 1).padStart(2, "0")}</span>{s.label}</div>
                ))}
              </div>
            </div>
          </section>

          {/* 2 · Ask panel, inline so both fit; Replay reopens each */}
          <Pair
            title="2 · Ask KYLLM Panel"
            note="Pick a question in each panel. Before, the panel and answer appear at once. After, the panel springs in, suggestions stagger, the answer streams word by word, and the panel grows to fit. Replay closes and reopens each one."
            before={<><button type="button" id="ask-before" className={m.replay}>Replay</button><AskPanel inline animate={false} trigger="#ask-before" /></>}
            after={<><button type="button" id="ask-after" className={m.replay}>Replay</button><AskPanel inline trigger="#ask-after" /></>}
          />

          {/* 3 · certifications, stacked: each is full width */}
          <Pair
            stack
            title="3 · Certifications"
            note="After: the issuer cells rise in, one after another, as the section scrolls into view. Before is static."
            before={<Frame><Certifications num="06" animate={false} id="certifications-before" /></Frame>}
            after={<Frame><Certifications num="06" id="certifications-after" /></Frame>}
          />

          {/* 4 · footer, stacked: each is full width */}
          <Pair
            stack
            title="4 · Footer Photo View"
            note="Click a tile to reveal its photo, then use the small expand button on it. After: the photo grows from the tile into a large view and shrinks back on close. Before has no large view."
            before={<Frame><Footer fullView={false} /></Frame>}
            after={<Frame><Footer /></Frame>}
          />
        </div>
      </MotionRoot>
    </BrandRoot>
  );
}
