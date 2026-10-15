import { sample } from "../../samples/sampleContent";
import { Chips, KeyValues, Row, SectionHead } from "../kit";
import { describe } from "../chipNotes";
import { OrgLink } from "../OrgLink";
import b from "../brand.module.css";
import s from "./sections.module.css";

/** About: the two lead paragraphs with the first clause in ink, focus-area
    chips, and a fact column. Copy and chips are read from sampleContent.ts. */

/** `bold` is the opening clause set in ink; the rest of the sentence stays grey. */
function Lead({ text, bold }: { text: string; bold: string }) {
  const rest = text.startsWith(bold) ? text.slice(bold.length) : text;
  return <p className={b.lead}><b>{bold}</b>{rest}</p>;
}

export function About({ num }: { num?: string }) {
  const [one, two] = sample.about;
  return (
    <Row id="about">
      <SectionHead num={num} title="About" />
      <div className={s.aboutGrid}>
        <div className={s.aboutCopy}>
          <Lead text={one} bold="My work spans data pipelines, agentic AI, data warehousing, data modeling, MLOps," />
          <Lead text={two} bold="I also speak about generative AI," />
          <div className={s.aboutChips}><Chips items={sample.focusAreas} notes={describe(sample.focusAreas)} /></div>
        </div>
        <div className={s.aboutFacts}>
          <KeyValues
            items={[
              { k: "Currently", v: <>{sample.role} · <OrgLink name={sample.company} url={sample.companyUrl}>{sample.company}</OrgLink></> },
              { k: "Industries", v: "Financial services, investment management, education, compliance" },
              { k: "Speaking on", v: "Generative AI, AI coding agents, modern engineering workflows" },
            ]}
          />
        </div>
      </div>
    </Row>
  );
}
