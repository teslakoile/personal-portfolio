import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BrandRoot, Frame, Row, SectionHead } from "../../_brand/kit";
import { toolLogo } from "../../_brand/logos";
import b from "../../_brand/brand.module.css";
import x from "./tooltips.module.css";

/**
 * Every tooltip design already in the repo, drawn open side by side. Each
 * look's CSS is copied from its source file (named under each cell) with
 * only the hover condition removed, so this page shows them as they render
 * there. The redesign page now draws all of its tooltips as #1 (the --tip-*
 * tokens on BrandRoot); the pick replaces those tokens.
 */
export const metadata: Metadata = {
  title: "Tooltip Designs | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const NOTE = "A unified analytics platform for data engineering and machine learning, built on Apache Spark";

function Logo({ name }: { name: string }) {
  const src = toolLogo(name);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img className={b.chipLogo} src={src} alt="" width={14} height={14} /> : null;
}

function Chip({ name = "Databricks" }: { name?: string }) {
  return <span className={`${b.chip} ${b.chipLive} ${x.chip}`} data-open=""><Logo name={name} />{name}</span>;
}



type V = { id: string; name: string; idea: string; demo: ReactNode };

function T({ children }: { children: ReactNode }) {
  return <span className={x.v}>{children}</span>;
}

function OnChip({ tip }: { tip: ReactNode }) {
  return <span className={x.anchor}>{tip}<Chip /></span>;
}

function OnButton({ tip }: { tip: ReactNode }) {
  return <span className={x.anchor}>{tip}<span className={x.copyBtn} /></span>;
}

const TIERS: { tier: string; note: string; items: V[] }[] = [
  {
    tier: "Label",
    note: "Icon buttons: what it does, in a few words.",
    items: [
      { id: "label", name: "Title Line Only", idea: "Copy, Sound on, and the like.", demo: <><OnButton tip={<T><b>Copy</b></T>} /><OnButton tip={<T><b>Sound on</b></T>} /></> },
    ],
  },
  {
    tier: "Note",
    note: "Chips, certification titles, and calendar days: the name, then one line on it.",
    items: [
      { id: "note", name: "Title and Description", idea: "The description in the dimmer white, never a third line.", demo: <OnChip tip={<T><b>Databricks</b><span>{NOTE}</span></T>} /> },
      { id: "day", name: "Calendar Day", idea: "The same form on the GitHub calendar: the count, then the date.", demo: (
        <span className={x.anchor}><T><b>87 contributions</b><span>Thu, Apr 30, 2026</span></T><span className={x.day} /></span>
      ) },
    ],
  },
];

function Variations() {
  return (
    <div className={x.tiers}>
      {TIERS.map((tr) => (
        <section key={tr.tier} className={x.tierRow}>
          <div className={x.tierHead}><b>{tr.tier}</b><span>{tr.note}</span></div>
          <div className={x.tierItems}>
            {tr.items.map((v) => (
              <div key={v.id} id={`v-${v.id}`} className={x.vCell}>
                <div className={x.vStage}>{v.demo}</div>
                <b className={x.vName}>{v.name}</b>
                <span className={x.vIdea}>{v.idea}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Cell({ n, name, where, note, children }: { n: number; name: string; where: string; note: string; children: ReactNode }) {
  return (
    <div className={x.cell}>
      <h3 className={b.h4}>{n}. {name}</h3>
      <p className={x.idea}>{note}</p>
      <div className={x.stage}>{children}</div>
      <code className={x.where}>{where}</code>
    </div>
  );
}

export default function TooltipDesigns() {
  return (
    <BrandRoot>
      <div className={x.page}>
        <Frame>
          <Row>
            <SectionHead title="The Tooltip" note="Picked: ink, no caret, and two forms only, a label or a note." />
            <Variations />
          </Row>
          <Row>
            <SectionHead title="Tooltip Designs" note="Every tooltip already in the repo, shown open." />
            <div className={x.grid}>
              <Cell n={1} name="Chip Note" where="app/_brand/chipFx.module.css" note="The redesign's chip and certification notes, and now every tooltip there. Ink card, caret, title and a dimmer description.">
                <span className={x.anchor}>
                  <span className={x.note}><b>Databricks</b><span>{NOTE}</span></span>
                  <Chip />
                </span>
              </Cell>

              <Cell n={2} name="GitHub Calendar" where="app/_brand/sections/github/github.module.css (on main)" note="The calendar day, before the shared style: no caret, a dimmer date line, and a coral line for notable days. It glides between days on a spring.">
                <span className={x.anchor}>
                  <span className={x.gh}><b>87 contributions</b><span>Thu, Apr 30, 2026</span><em>Busiest day of the year</em></span>
                  <span className={x.day} />
                </span>
              </Cell>

              <Cell n={3} name="KYLLM Key Hint" where="app/samples/kyllm-ui/kyllm.module.css (round 3 pick D)" note="The ⌘K hint the chip note was first matched to. One line, small, no caret, above a dashed key.">
                <span className={x.anchor}>
                  <span className={x.kbdTip}>Ask from anywhere</span>
                  <kbd className={x.kbd}>⌘K</kbd>
                </span>
              </Cell>

              <Cell n={4} name="KYLLM Source Chip" where="app/samples/kyllm-ui/round3.module.css" note="Same one-line tip over a citation chip in a KYLLM answer, naming where the link goes.">
                <span className={x.anchor}>
                  <span className={x.kbdTip}>Scrolls to Projects · Document Intelligence</span>
                  <span className={x.srcChip}>Document Intelligence</span>
                </span>
              </Cell>

              <Cell n={5} name="KYLLM Copy and Steps" where="round3.module.css .copyTip, steps.module.css .bar::after" note="The tightest version: 2px by 7px. Copy centres over its button; a step's timing sits flush left on its bar.">
                <span className={x.pair}>
                  <span className={x.anchor}>
                    <span className={x.copyTip}>Copied</span>
                    <span className={x.copyBtn} />
                  </span>
                  <span className={x.anchorLeft}>
                    <span className={x.stepTip}>0.4s to 1.9s</span>
                    <span className={x.stepBar} />
                  </span>
                </span>
              </Cell>

              <Cell n={6} name="Citation Peek" where="app/samples/kyllm-ui/round3.module.css .tip (round 3, option A)" note="Hovering a citation in a KYLLM answer names its source. A little roomier than the key hint, and the only one-line tip in the repo with a caret.">
                <span className={x.anchor}>
                  <span className={x.r3Tip}>Projects · MCP Server</span>
                  <sup className={x.cite}>1</sup>
                </span>
              </Cell>

              <Cell n={7} name="States Tool Chip" where="app/samples/states/states.module.css" note="The one light design: a white floating card with the modal's radius and shadow. It names the skills group and marks the tool's place in it with blocks.">
                <span className={x.anchor}>
                  <span className={x.statesTip}>
                    Data Engineering
                    <span className={x.statesBlocks} aria-hidden="true">{Array.from({ length: 13 }, (_, i) => <i key={i} data-on={i === 0 ? "" : undefined} />)}</span>
                    <span>tool 1 of 13</span>
                  </span>
                  <span className={x.statesChip}><Logo name="Databricks" />Databricks</span>
                </span>
              </Cell>

              <Cell n={8} name="Sound and Copy Labels" where="rail.module.css, contactModal.module.css (on main)" note="The redesign's labels before the shared style: the key hint's size, no caret. Sound hangs below its icon, right-aligned.">
                <span className={x.pair}>
                  <span className={x.anchor}>
                    <span className={x.kbdTip}>Copy</span>
                    <span className={x.copyBtn} />
                  </span>
                  <span className={x.anchorRight}>
                    <span className={x.soundTip}>Sound on</span>
                    <span className={x.copyBtn} />
                  </span>
                </span>
              </Cell>
            </div>
          </Row>
        </Frame>
      </div>
    </BrandRoot>
  );
}
