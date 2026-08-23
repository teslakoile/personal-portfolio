import shell from "../_shared.module.css";
import v from "./variations.module.css";
import { sample } from "../../sampleContent";
import { Pill } from "../../quiet/helpers";

const groups = sample.skills;
type Group = (typeof groups)[number];

const idx = (i: number) => String(i + 1).padStart(2, "0");

function General({ g }: { g: Group }) {
  if (g.general.length === 0) return null;
  return (
    <ul className={v.general} aria-label={`${g.title}, general`}>
      {g.general.map((c) => <li key={c} className={v.genChip}>{c}</li>)}
    </ul>
  );
}

function Tools({ g }: { g: Group }) {
  return (
    <div className={`${v.tools} ${g.general.length > 0 ? v.toolsDivided : ""}`}>
      {g.tools.map((t) => <Pill key={t} name={t} />)}
    </div>
  );
}

/** A · Bento, the content-heavy domains (Data Engineering, Developer Tools)
    span the full width as anchors; the rest sit in a 2×2 block between them. */
function VariantBento() {
  return (
    <div className={v.bento}>
      {groups.map((g, i) => {
        const wide = i === 0 || i === groups.length - 1;
        return (
          <div key={g.title} className={`${v.bentoCard} ${wide ? v.span2 : ""}`}>
            <h3 className={v.title}>{g.title}</h3>
            <p className={v.desc}>{g.blurb}</p>
            <General g={g} />
            <Tools g={g} />
          </div>
        );
      })}
    </div>
  );
}

/** B · Blueprint, each card carries a coral index and a faint graph-paper
    wash fading from the top-right corner (the site's blueprint motif). */
function VariantBlueprint() {
  return (
    <div className={v.bp}>
      {groups.map((g, i) => (
        <div key={g.title} className={v.bpCard}>
          <div className={v.bpGrid} aria-hidden="true" />
          <span className={v.bpIndex}>{idx(i)}</span>
          <div className={v.bpInner}>
            <div className={v.bpHead}>
              <span className={v.bpDot} aria-hidden="true" />
              <h3 className={v.title}>{g.title}</h3>
            </div>
            <p className={v.desc}>{g.blurb}</p>
            <General g={g} />
            <Tools g={g} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** C · Spec sheet, one panel, numbered horizontal rows: title + blurb on the
    left, general + tooling on the right, hairline between domains. */
function VariantRows() {
  return (
    <div className={v.rows}>
      {groups.map((g, i) => (
        <div key={g.title} className={v.row}>
          <div>
            <p className={v.rowIndex}>{idx(i)}</p>
            <h3 className={v.rowTitle}>{g.title}</h3>
            <p className={v.rowDesc}>{g.blurb}</p>
          </div>
          <div>
            <General g={g} />
            <Tools g={g} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SkillsExplore() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Skills · layout explorations</p>
        <h1 className={shell.pageTitle}>More interesting skills cards</h1>
        <p className={shell.pageHint}>
          Same content, three directions. Every card keeps the general skills (outlined chips) + tooling (logo pills) split.
        </p>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>A · Bento, flagship domains span the full width</p>
          <VariantBento />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>B · Blueprint, coral index + faint graph-paper</p>
          <VariantBlueprint />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>C · Spec sheet, numbered horizontal rows</p>
          <VariantRows />
        </div>
      </div>
    </div>
  );
}
