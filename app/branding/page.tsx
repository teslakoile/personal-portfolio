import { readdirSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sample } from "../samples/sampleContent";
import {
  BrandRoot, Frame, Row, Cells, SectionHead, Button, Badge, Chips, Kbd, Blocks, Legend, run,
  KeyValues, Item, Metric, Stage, Stat, Talk, Rail, Footer, brand as b,
  type BlockColor,
} from "../_brand/kit";
import { BlockTimeline, monthCells, monthIndex, monthLabel, parseMonth, type YM } from "../_brand/timeline";
import { Pipeline } from "../_brand/Pipeline";
import { Certifications } from "../_brand/sections/Certifications";
import { ContactIcon } from "../samples/quiet/Logo";
import { Swatch } from "./Swatch";
import s from "./branding.module.css";

/**
 * Hidden brand sheet for the PROPOSED redesign (the "data blocks" direction,
 * design-explorations/2026-09-brand-system/9-full-site-v2.png). Every specimen
 * is a component from app/_brand, fed with real data from sampleContent.ts, so
 * the sheet and the eventual site share one source. Unlinked, noindex, and
 * disallowed in robots.ts.
 */
export const metadata: Metadata = {
  title: "Branding | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const now = new Date();
const TODAY: YM = [now.getFullYear(), now.getMonth() + 1];
const todayMarker = (from: YM) => ({ at: monthIndex(TODAY) - monthIndex(from), label: `Today · ${monthLabel(TODAY)}` });
const yearTicks = (from: YM, years: number[]) => years.map((y) => ({ at: monthIndex([y, 1]) - monthIndex(from), label: String(y) }));

const SECTIONS = [
  { id: "principles", label: "Principles" },
  { id: "color", label: "Color" },
  { id: "type", label: "Type" },
  { id: "shape", label: "Shape and Lines" },
  { id: "blocks", label: "Blocks" },
  { id: "controls", label: "Controls" },
  { id: "rows", label: "Rows and Cells" },
  { id: "diagrams", label: "Diagrams" },
  { id: "navigation", label: "Navigation" },
  { id: "logos", label: "Logos" },
];
const num = (id: string) => String(SECTIONS.findIndex((x) => x.id === id) + 1).padStart(2, "0");

const PRINCIPLES = [
  { k: "Shape", rule: "Square structure, round controls", why: "Rows, cells, and panels have square corners. Buttons are pills, chips use 6px, and only floating layers use 14px with a shadow." },
  { k: "Color", rule: "One coral for the interface", why: "Coral marks what is live or clickable and is never a large fill. coral-ink carries small text and the primary button; coral is for marks and large type." },
  { k: "Data color", rule: "Four block colors, for data only", why: "Block colors group series inside diagrams and never style the interface. Grey means raw or expired." },
  { k: "Blocks", rule: "Blocks only where time or a metric matters", why: "Use blocks for the career timeline, certification validity, a measured before-and-after, and the GitHub graph, each with its unit stated. Never for skills, tool lists, or community stats." },
  { k: "Type", rule: "Geist only, tabular numerals", why: "Size and weight carry hierarchy. Geist Mono appears only as code identifiers inside diagrams. No eyebrows and no all-caps." },
  { k: "Lines", rule: "Rules and crosshairs frame the page", why: "Solid rules frame rows and cells, dashed rules divide items inside a cell, and a + marks every joint." },
];

const UI_COLORS = [
  { token: "paper", use: "Page background" },
  { token: "surface", use: "Buttons, chips, case panels" },
  { token: "sunk", use: "Recessed fills" },
  { token: "line", use: "Frame and cell rules" },
  { token: "line-2", use: "Dashed rules, outlines, crosshairs" },
  { token: "ink", use: "Headings and primary text" },
  { token: "ink-2", use: "Body copy" },
  { token: "ink-3", use: "Labels and metadata" },
  { token: "coral", use: "Marks and large type: ticks, today lines, focus rings" },
  { token: "coral-ink", use: "Small coral text and the primary button" },
];
const DATA_COLORS = [
  { token: "b1", use: "Series 1: current role, Databricks" },
  { token: "b2", use: "Series 2: research, OpenAI, Astronomer" },
  { token: "b3", use: "Series 3: product engineering, Google Cloud" },
  { token: "b4", use: "Series 4: internship, Microsoft, AWS" },
  { token: "raw", use: "Raw records, expired, or no activity" },
];

const RADII = [
  { name: "Structure", r: "0", where: "Rows, cells, panels, blocks" },
  { name: "Chip", r: "6px", where: "Chips and keys" },
  { name: "Floating", r: "14px", where: "Menus and dialogs, with --float" },
  { name: "Control", r: "999px", where: "Buttons and the badge" },
];

/* ------------------------------ real data ------------------------------ */

const COMPANY_SHORT: Record<string, string> = {
  "Thinking Machines Data Science": "Thinking Machines",
  "Ingenuity Software": "Ingenuity",
  "UP Diliman EEEEI": "UP Diliman",
  GCash: "GCash",
};
const COMPANY_COLOR: Record<string, BlockColor> = {
  "Thinking Machines Data Science": "b1",
  "Ingenuity Software": "b3",
  "UP Diliman EEEEI": "b2",
  GCash: "b4",
};

function periodRange(period: string): { start: YM; end: YM | "present" } {
  const [a, z] = period.split(" to ");
  return { start: parseMonth(a), end: z.trim() === "Present" ? "present" : parseMonth(z) };
}

const CAREER_FROM: YM = [2022, 1];
const careerRoles = [
  { title: sample.experience.current.role, company: sample.experience.current.company, period: sample.experience.current.period },
  ...sample.experience.past.flatMap((g) => g.roles.map((r) => ({ title: r.title, company: g.company, period: r.period }))),
];
const careerLanes = careerRoles.map((r) => {
  const { start, end } = periodRange(r.period);
  return {
    label: <>{r.title} <em>· {COMPANY_SHORT[r.company] ?? r.company}</em></>,
    cells: monthCells({ from: CAREER_FROM, to: TODAY, start, end, c: COMPANY_COLOR[r.company] ?? "b1", today: TODAY }),
  };
});




const TALKS = [
  { title: "Geeks On A Beach: AI Show and Tell", desc: "Configuring AI coding assistants with subagents, agent skills, and AGENTS.md.", meta: "Conference" },
  { title: "AWS User Group Davao", desc: "Invited speaker on cloud and data engineering.", meta: "Community" },
];

/* ------------------------------- layout -------------------------------- */

function Section({ id, title, note, children }: { id: string; title: ReactNode; note?: ReactNode; children: ReactNode }) {
  return (
    <Row id={id} className={s.anchor}>
      <SectionHead num={num(id)} title={title} note={note} />
      {children}
    </Row>
  );
}

/** Specimen row: name and spec on the left, the component on the right. */
function Spec({ name, spec, children }: { name: string; spec: string; children: ReactNode }) {
  return (
    <div className={s.spec}>
      <div className={s.specLabel}>
        <span className={s.name}>{name}</span>
        <span className={s.note}>{spec}</span>
      </div>
      <div className={s.demo}>{children}</div>
    </div>
  );
}

function Principle({ p }: { p: (typeof PRINCIPLES)[number] }) {
  return (
    <div className={s.cell}>
      <span className={b.label}>{p.k}</span>
      <h3 className={b.h4} style={{ marginTop: 6 }}>{p.rule}</h3>
      <p className={b.body} style={{ marginTop: 6 }}>{p.why}</p>
    </div>
  );
}

const LOGOS = readdirSync(path.join(process.cwd(), "public/logos")).filter((f) => /\.(svg|png)$/.test(f)).sort();

export default function BrandingPage() {
  const skills = sample.skills;
  return (
    <BrandRoot>
      <Frame>
        <Row>
          <div className={s.intro}>
            <Badge>Proposed system · not live yet</Badge>
            <h1 className={b.h1}>Brand and <span className={b.accent}>UI Kit</span></h1>
            <p className={b.sub}>
              The proposed redesign as reusable parts: square structure, one coral for the interface,
              and data blocks for diagrams. Every specimen is a component in app/_brand with real data.
            </p>
          </div>
          <nav className={s.toc} aria-label="Sections">
            {SECTIONS.map((x, i) => (
              <a key={x.id} href={`#${x.id}`}><span>{String(i + 1).padStart(2, "0")}</span>{x.label}</a>
            ))}
          </nav>
        </Row>

        <Section id="principles" title="Principles" note="Six rules decide every style choice below.">
          <Cells cols="repeat(3, 1fr)">{PRINCIPLES.slice(0, 3).map((p) => <Principle key={p.k} p={p} />)}</Cells>
          <Cells cols="repeat(3, 1fr)">{PRINCIPLES.slice(3).map((p) => <Principle key={p.k} p={p} />)}</Cells>
        </Section>

        <Section id="color" title="Color" note="Interface colors stay neutral plus coral. Block colors are for data only.">
          <div className={s.padded}>
            <p className={s.groupLabel}>Interface</p>
            <div className={s.swatches}>{UI_COLORS.map((c) => <Swatch key={c.token} {...c} />)}</div>
            <p className={s.groupLabel}>Data blocks</p>
            <div className={s.swatches}>{DATA_COLORS.map((c) => <Swatch key={c.token} {...c} />)}</div>
          </div>
        </Section>

        <Section id="type" title="Type" note="Geist at weights 400 and 500, with tabular numerals everywhere.">
          <div className={s.specs}>
            <Spec name="Display" spec="62px · 500 · -2px">
              <p className={b.h1}>I build <span className={b.accent}>AI agents</span>, data pipelines, and cloud infrastructure.</p>
            </Spec>
            <Spec name="Section heading" spec="42px · 500 · coral-ink number 16px">
              <p className={b.h2}><span className={b.num}>06</span>Community &amp; <span className={b.accent}>Speaking</span></p>
            </Spec>
            <Spec name="Title" spec="20px · 500 · muted context">
              <p className={b.h3}>{sample.role} <span>· {sample.company}</span></p>
            </Spec>
            <Spec name="Sub-head" spec="16px · 500">
              <p className={b.h4}>{skills[0].title}</p>
            </Spec>
            <Spec name="Lead" spec="25px · ink-3 with ink 500 emphasis">
              <p className={b.lead}><b>I also speak about generative AI,</b> AI coding agents, and modern engineering workflows through technical talks and community events.</p>
            </Spec>
            <Spec name="Intro" spec="18px · ink-2">
              <p className={b.sub}>{sample.hero.subhead}</p>
            </Spec>
            <Spec name="Body" spec="14.5px · ink-2">
              <p className={b.body}>{sample.experience.current.summary}</p>
            </Spec>
            <Spec name="Figure" spec="26px · 500 · coral arrow">
              <span className={b.value}>4h<i>→</i>&lt;1h</span>
            </Spec>
            <Spec name="Label" spec="12.5px · 500 · ink-3">
              <span className={b.label}>Google Developer Group Davao</span>
            </Spec>
            <Spec name="Metadata" spec="11.5px · ink-3">
              <span className={b.meta}>github.com/teslakoile · contributions in the last year</span>
            </Spec>
            <Spec name="Code identifier" spec="Geist Mono 11.5px · diagrams only">
              <span className={b.code}>system_a · splink · tier 1</span>
            </Spec>
          </div>
        </Section>

        <Section id="shape" title="Shape and Lines" note="Square by default. Corners round only on things you press or that float.">
          <div className={s.specs}>
            <Spec name="Radii" spec="0 · 6 · 14 · 999">
              <div className={s.radii}>
                {RADII.map((r) => (
                  <div key={r.name} className={s.radius}>
                    <div className={s.radiusBox} style={{ borderRadius: r.r, boxShadow: r.r === "14px" ? "var(--float)" : undefined }} />
                    <span className={s.name}>{r.name} · {r.r}</span>
                    <span className={s.note}>{r.where}</span>
                  </div>
                ))}
              </div>
            </Spec>
            <Spec name="Rules" spec="1px --line solid · 1px --line-2 dashed">
              <div className={s.rules}>
                <hr className={s.ruleSolid} /><span className={s.note}>Solid: the frame, rows, and cells</span>
                <hr className={s.ruleDashed} /><span className={s.note}>Dashed: items inside a cell</span>
              </div>
            </Spec>
            <Spec name="Crosshair" spec="11px + at each row joint">
              <div className={s.crossDemo}><Row><div style={{ height: 56 }} /></Row><div style={{ height: 28 }} /></div>
            </Spec>
          </div>
        </Section>

        <Section id="blocks" title="Blocks" note="Grey is raw, color is processed. Each diagram states what one block is.">
          <div className={s.specs}>
            <Spec name="Raw to processed" spec="grey run, then colored run">
              <div className={s.stack}>
                <Blocks cells={run(15, "raw")} />
                <Blocks cells={run(7, "b2")} />
              </div>
            </Spec>
            <Spec name="States" spec="filled · faded 0.28 · partial 0.45 · grey · empty">
              <div className={s.states}>
                {[
                  { cells: run(6, "b3"), t: "Filled: one full unit each" },
                  { cells: [...run(3, "b2"), ...run(3, "b2").map((x) => ({ ...x, o: 0.28 }))], t: "Faded: ongoing, no end date" },
                  { cells: run(4, "b1", 0.45), t: "Partial: the last unit is incomplete" },
                  { cells: [...run(3, "b4"), ...run(3, "raw")], t: "Grey: raw or expired" },
                  { cells: [...run(2, "b3"), { c: null }, { c: null }, ...run(2, "b3")], t: "Empty: no activity" },
                ].map((x) => (
                  <div key={x.t} className={s.state}><Blocks cells={x.cells} w={14} h={9} /><span className={s.note}>{x.t}</span></div>
                ))}
              </div>
            </Spec>
            <Spec name="Sizes" spec="9×6 metric · 10×9 timeline · 14×9 count">
              <div className={s.states}>
                <div className={s.state}><Blocks cells={run(8, "b1")} w={9} h={6} /><span className={s.note}>Metric cells</span></div>
                <div className={s.state}><Blocks cells={run(8, "b1")} w={10} h={9} /><span className={s.note}>Timelines, one block per month</span></div>
                <div className={s.state}><Blocks cells={run(8, "b1")} w={14} h={9} /><span className={s.note}>Counts and stats</span></div>
              </div>
            </Spec>
            <Spec name="Legend" spec="12×6 key + sentence-case label">
              <Legend items={[{ c: "b3", label: "Google Cloud" }, { c: "b4", label: "Microsoft, AWS" }, { c: "b1", label: "Databricks" }, { c: "b2", label: "OpenAI, Astronomer" }, { c: "raw", label: "expired" }]} />
            </Spec>
          </div>
        </Section>

        <Section id="controls" title="Controls" note="Pills for actions, dashed chips for tags, keys for shortcuts.">
          <div className={s.specs}>
            <Spec name="Buttons" spec="42px pill · primary, secondary">
              <Button href="#controls">Get in Touch →</Button>
              <Button variant="secondary" href="#controls">↓ Download CV</Button>
            </Spec>
            <Spec name="Small buttons" spec="34px pill">
              <Button size="sm" href="#controls">Get in Touch</Button>
              <Button size="sm" variant="secondary" href="#controls">View All</Button>
            </Spec>
            <Spec name="Badge" spec="28px pill · sage key">
              <Badge>{sample.role} at Thinking Machines</Badge>
            </Spec>
            <Spec name="Chips" spec="12.5px · dashed · 6px">
              <Chips items={sample.focusAreas.slice(0, 6)} />
            </Spec>
            <Spec name="Keys" spec="10.5px · 2px bottom edge">
              <span className={s.keys}><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
              <span className={s.keys}><Kbd>⌘</Kbd><Kbd>J</Kbd></span>
            </Spec>
            <Spec name="Text link" spec="14px · 500 · coral-ink">
              <a className={b.link} href={sample.achievements[0].href} target="_blank" rel="noreferrer">Read the Paper ›</a>
            </Spec>
            <Spec name="Contact row" spec="14px · ink-3 icons">
              <div className={b.contact}>
                {sample.contacts.map((c, i) => (
                  <a key={c.label} href={c.href}>
                    <ContactIcon kind={(["email", "linkedin", "github"] as const)[i] ?? "email"} />
                    {i === 0 ? c.value : c.label}
                  </a>
                ))}
              </div>
            </Spec>
          </div>
        </Section>

        <Section id="rows" title="Rows and Cells" note="Content sits in ruled cells. Dashed rules divide the items inside one.">
          <Cells cols="1fr 330px">
            <div className={s.cell}>
              <span className={b.label}>Item rows</span>
              <div style={{ marginTop: 10 }}>
                <Item title="Investment Data Platform" context="Singaporean investment holding co." figure="10+ microservices" />
                <Item title="Document Intelligence" context="Snowflake Cortex agents" figure="~15 person team" />
                <Item title="Enablement Curriculum" context="Philippine airline" figure="6 courses" />
              </div>
            </div>
            <KeyValues items={[
              { k: "Currently", v: `${sample.role} · ${sample.company}` },
              { k: "Speaking on", v: "Generative AI, AI coding agents, modern engineering workflows" },
            ]} />
          </Cells>
          <Cells cols="200px repeat(2, 1fr)">
            <div className={s.cell}>
              <span className={b.label}>Metric cells</span>
              <p className={b.body} style={{ marginTop: 6 }}>Value, its blocks, then the unit of one block.</p>
            </div>
            <Metric value="10+" blocks={[run(10, "b1")]} caption="microservices on the investment data platform, one block each" />
            <Metric value="2,000+" blocks={[run(20, "b3")]} caption="GDG Davao participants, one block per 100" />
          </Cells>
          <Cells cols="1fr 1fr">
            <div className={s.cell}>
              <span className={b.label}>Stats</span>
              <div className={b.stats} style={{ marginTop: 6 }}>
                <Stat figure="10+" label="Events" />
                <Stat figure="2,000+" label="Participants" />
                <Stat figure="500+" label="Members" />
                <Stat figure="50+" label="Volunteers" />
              </div>
            </div>
            <div className={s.cell}>
              <span className={b.label}>Talk rows</span>
              <div style={{ marginTop: 4 }}>{TALKS.map((t) => <Talk key={t.title} {...t} />)}</div>
            </div>
          </Cells>
        </Section>

        <Row>
          <div className={s.diagramHead}><span className={b.label}>Section example: Certifications, by issuer</span><span className={b.meta}>No blocks: one cell per issuer, each credential with its dates.</span></div>
        </Row>
        <Certifications num="06" />

        <Section id="diagrams" title="Diagrams" note="The block charts, each fed from sampleContent.ts.">
          <div className={s.diagramHead}><span className={b.label}>Career timeline</span><span className={b.meta}>One block is one month.</span></div>
          <div className={s.diagram}>
            <BlockTimeline lanes={careerLanes} blockW={10} labelW={290}
              ticks={yearTicks(CAREER_FROM, [2022, 2023, 2024, 2025, 2026])} today={todayMarker(CAREER_FROM)}
              legend={[{ c: "b1", label: "consulting" }, { c: "b3", label: "product engineering" }, { c: "b2", label: "research" }, { c: "b4", label: "internship" }]} />
          </div>
          <div className={s.diagramHead}><span className={b.label}>Pipeline</span><span className={b.meta}>For a real case study only. Grey blocks are raw records, colored blocks are processed; blocks here are representative.</span></div>
          <div className={s.diagram}>
            <Pipeline sources={["system_a", "system_b", "system_c", "system_d"]} hub="splink" outputs={["tier 1", "tier 2", "tier 3", "tier 4", "tier 5"]} residual />
          </div>
          <Cells cols="repeat(4, 1fr)">
            <Stage step="01 · Ingest" title="Four enterprise systems" value="~15M" note="records per daily run" />
            <Stage step="02 · Link" title="Splink record linkage" value="748,000" note="candidate duplicate pairs" />
            <Stage step="03 · Score" title="Five confidence tiers" value=">99.9%" note="validated accuracy" />
            <Stage step="04 · Publish" title="Unique customer keys" value="~7M" note="runtime cut from 4h to <1h" />
          </Cells>
        </Section>

        <Section id="navigation" title="Navigation" note="Sidebar rail, closing band, and footer.">
          <Cells cols="248px 1fr">
            <Rail
              wordmark={sample.wordmark}
              items={[
                { id: "about", label: "About" }, { id: "experience", label: "Experience" }, { id: "skills", label: "Skills" },
                { id: "education", label: "Education" }, { id: "certifications", label: "Certifications" },
              ]}
              active="about"
              utils={[{ label: "Ask KYLLM", keys: ["⌘", "K"] }]}
              foot={<Button href={sample.hero.primaryCta.href}>Get in Touch</Button>}
            />
            <div className={s.cell}>
              <span className={b.label}>Rail rules</span>
              <ul className={s.ruleList}>
                <li>The wordmark is plain text: Geist 600 at 17px.</li>
                <li>Numbers are faint at rest. On the active row the label turns ink, and its number and a 2px tick turn coral.</li>
                <li>Shortcuts sit under a dashed rule, with their keys aligned right.</li>
                <li>The primary button is the only coral fill in the rail.</li>
              </ul>
            </div>
          </Cells>
        </Section>


        <Section id="logos" title="Logos" note="Real marks from public/logos, always in their brand colors.">
          <div className={s.logoGrid}>
            {LOGOS.map((f) => (
              <div key={f} className={s.logoCell}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/logos/${f}`} alt="" width={26} height={26} />
                <span className={s.note}>{f.replace(/\.(svg|png)$/, "")}</span>
              </div>
            ))}
          </div>
        </Section>

        <Footer left="© 2026 Kyle Naranjo" right="⌘K Ask KYLLM" />
      </Frame>
    </BrandRoot>
  );
}
