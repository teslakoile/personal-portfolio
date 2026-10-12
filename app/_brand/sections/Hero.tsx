import { sample } from "../../samples/sampleContent";
import { ContactIcon } from "../../samples/quiet/Logo";
import { CONTACT_KIND } from "../../samples/quiet/helpers";
import { Button, Metric, Row, run } from "../kit";
import b from "../brand.module.css";
import s from "./sections.module.css";

/**
 * Hero, from the "Portfolio Redesign" canvas: headline with one coral phrase,
 * two actions, contact links, the photo bleeding off the right edge, then a
 * strip of the bank pipeline's real metrics and the tools band. The KYLLM chat
 * hero (design-explorations 17-kyllm-hero-final.png) belongs to another
 * session, so this stays the canvas version until that ships.
 */

const TOOLS = ["databricks", "snowflake", "bigquery", "airflow", "kubernetes", "terraform"] as const;
const TOOL_NAME: Record<(typeof TOOLS)[number], string> = {
  databricks: "Databricks", snowflake: "Snowflake", bigquery: "BigQuery",
  airflow: "Airflow", kubernetes: "Kubernetes", terraform: "Terraform",
};

export function Hero() {
  return (
    <>
      <Row>
        <div className={s.hero}>
          <div className={s.heroCopy}>
            <h1 className={b.h1}>I build <span className={b.accent}>AI agents</span>, data pipelines, and cloud infrastructure.</h1>
            <p className={`${b.sub} ${s.heroSub}`}>{sample.hero.subhead}</p>
            <div className={s.heroCta}>
              <Button href={sample.hero.primaryCta.href}>Get in Touch →</Button>
              <Button variant="secondary" href={sample.cvUrl} download>↓ Download CV</Button>
            </div>
            <div className={`${b.contact} ${s.heroLinks}`}>
              {sample.contacts.map((c) => (
                <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  <ContactIcon kind={CONTACT_KIND[c.label] ?? "email"} />
                  {c.label === "Email" ? c.value : c.label}
                </a>
              ))}
            </div>
          </div>
          <div className={s.heroPortrait}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero/portrait-hero-black.webp" alt="Kyle Naranjo at the Golden Gate Bridge" width={430} height={430} />
          </div>
        </div>
      </Row>
      <Row>
        <div className={s.strip}>
          <div className={s.stripLabel}>
            <span className={b.label}>Single Customer View</span>
            <b>Major Philippine bank, daily pipeline</b>
          </div>
          <Metric value={<>15M<i>→</i>7M</>} blocks={[run(15, "raw"), run(7, "b2")]} caption="records consolidated to unique customer keys" />
          <Metric value="748,000" caption="candidate duplicate pairs that exact matching missed, found with Splink" />
          <Metric
            value=">99.9%"
            blocks={[[{ c: "b1" }, { c: "b2" }, { c: "b3" }, { c: "b4" }, { c: "raw" }]]}
            caption="accuracy across five confidence tiers"
          />
          <Metric value={<>4h<i>→</i>&lt;1h</>} blocks={[run(17, "raw", 0.45), run(4, "b1", 0.4)]} caption="pipeline runtime, one block per 15 minutes" />
        </div>
      </Row>
      <Row>
        <div className={s.tools}>
          <div>Tools I Work With</div>
          {TOOLS.map((t) => (
            <div key={t}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/${t}.svg`} alt="" />
              {TOOL_NAME[t]}
            </div>
          ))}
        </div>
      </Row>
    </>
  );
}
