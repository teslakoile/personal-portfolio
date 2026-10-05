import { statSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sample } from "../sampleContent";
import { techLogoKey } from "../quiet/Logo";
import {
  AskTrace, CopyEmail, DownloadButton, EffectGrid, GlideNav, LoadingPlayground, MonthStrip,
  SkeletonResolve, ToolChip,
} from "./States";
import { VERBS } from "./verbs";
import { ChevronLoader } from "../loaders/Loaders";
import s from "./states.module.css";

/**
 * /samples/states: loading and hover experiments for the proposed data-blocks
 * brand, plus what is worth taking from beautifului.dev and aicss.dev. Every
 * fact in the demos is read from sampleContent.ts.
 */
export const metadata: Metadata = { title: "States | Samples", robots: { index: false, follow: false } };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toDate = (s: string) => {
  const [m, y] = s.split(" ");
  return new Date(Number(y), MONTHS.indexOf(m), 1);
};

const today = new Date();
const cvBytes = statSync(path.join(process.cwd(), "public", sample.cvUrl)).size;
const cvSize = `${Math.round(cvBytes / 1024)} KB`;

// ⌘K demo: Google Cloud credentials, straight from the certifications list
const certs = sample.certifications;
const gcp = certs.filter((c) => c.issuer === "Google Cloud");
const gcpValid = gcp.filter((c) => !c.expires || toDate(c.expires) > today);

// month strip: the current role, Aug 2024 to today
const roleStart = toDate(sample.experience.current.period.split(" to ")[0]);
const roleMonths: string[] = [];
for (let d = new Date(roleStart); d <= today; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
  roleMonths.push(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
}

const dataEng = sample.skills[0];
const CONTEXT_LABEL = { page: "Page", ask: "⌘K", send: "Send" } as const;

function Section({ id, num, title, note, children }: { id: string; num: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className={s.row}>
      <div className={s.head}>
        <h2><span>{num}</span>{title}</h2>
        {note ? <p>{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function StatesPage() {
  return (
    <div className={s.root}>
      <main className={s.frame}>
        <header className={s.row}>
          <div className={s.intro}>
            <h1>Loading and <em>Hover</em> States</h1>
            <p>
              Waiting on this site should feel like watching one of Kyle&apos;s pipelines run: raw grey blocks
              get processed into color, and the copy speaks the trade. Every demo below is live; hover and click.
            </p>
          </div>
        </header>

        <Section id="takeaways" num="01" title="What to Take" note="Read on Oct 4, 2026. The ideas worth borrowing, restated in this brand.">
          <div className={s.cells} style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className={s.cell}>
              <span className={s.label}>beautifului.dev</span>
              <ul className={s.takeaways}>
                <li><b>One loader, many moods.</b> A 3×3 pixel grid with four switchable patterns, a verb, and an elapsed clock. The clock makes waiting honest.</li>
                <li><b>One fictional world.</b> All 21 demos run inside the same ice cream business, so the kit reads as one product. Ours can use Kyle&apos;s real data instead.</li>
                <li><b>Gliding hover.</b> The sidebar uses one highlight that slides between rows instead of a highlight per row.</li>
                <li><b>Quiet chrome.</b> Numbered sections, a muted one-line description, dashed rails. The proposed brand already has these.</li>
              </ul>
            </div>
            <div className={s.cell}>
              <span className={s.label}>aicss.dev</span>
              <ul className={s.takeaways}>
                <li><b>The smallest loader.</b> &quot;Thinking&quot; with one light pass across the word, nothing else.</li>
                <li><b>Traces that collapse.</b> Reasoning lines stream in, then fold into &quot;Thought for 5s&quot; that you can reopen.</li>
                <li><b>Range in tiny grids.</b> 25 dot-matrix orbs prove a few cells carry a lot of character.</li>
                <li><b>Content that resolves.</b> Image generation shows a dot field filling in, so the wait previews the result.</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section id="verbs" num="02" title="Loading Verbs" note="The chevron loader, a word, and a clock. Below the playground, every word effect runs side by side.">
          <LoadingPlayground />
          <EffectGrid />
        </Section>

        <Section id="patterns" num="03" title="The Loader" note="Chevron, Right at 28% spacing, 700ms pulse and 100ms step, at four sizes. It is a 1em square, so it follows the text size.">
          <div className={s.patterns}>
            {[14, 20, 32, 64].map((px) => (
              <div key={px} className={s.patternCell}>
                <div style={{ fontSize: px, lineHeight: 1, marginBottom: 14 }}><ChevronLoader /></div>
                <b>{px}px</b>
                <span>{px <= 20 ? "Beside text and in buttons." : "On its own, for page and ⌘K waits."}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="ask" num="04" title="⌘K Trace" note="The ask box thinks out loud, then folds its steps into one line you can reopen.">
          <div className={s.cells} style={{ gridTemplateColumns: "1fr 1fr" }}>
            <AskTrace
              question="Which Google Cloud certifications does Kyle hold?"
              steps={[
                { text: "Opened Certifications", meta: `${certs.length} credentials` },
                { text: "Filtered by issuer", meta: `Google Cloud · ${gcp.length}` },
                { text: "Checked expiry dates", meta: `${gcpValid.length} of ${gcp.length} valid` },
              ]}
              answer={<>Kyle holds {gcp.length} Google Cloud credentials: {gcp.map((c) => c.title).join(", ").replace(/, ([^,]*)$/, ", and $1")}.</>}
            />
            <AskTrace
              offScript
              question="What is Kyle's favorite ice cream flavor?"
              steps={[{ text: "Searched every section", meta: "no match" }, { text: "Checked talks and recognition", meta: "no match" }]}
              answer={<>That one is not in the CV. Kyle can answer it himself at <a href={sample.contacts[0].href}>{sample.contacts[0].value}</a>.</>}
            />
          </div>
        </Section>

        <Section id="resolve" num="05" title="Content Resolve" note="A skeleton made of raw blocks, one per word, that processes into text instead of fading in.">
          <div className={s.cells} style={{ gridTemplateColumns: "1fr" }}>
            <div className={s.cell}><SkeletonResolve text={sample.about[0]} /></div>
          </div>
        </Section>

        <Section id="hover" num="06" title="Hover States" note="Each hover adds one small fact or one motion, never both.">
          <div className={s.cells} style={{ gridTemplateColumns: "260px 1fr" }}>
            <div className={s.cell}>
              <span className={s.label}>Gliding highlight</span>
              <div style={{ marginTop: 14 }}>
                <GlideNav items={["About", "Experience", "Skills", "Education", "Certifications"]} />
              </div>
            </div>
            <div className={s.cell}>
              <span className={s.label}>Buttons and links</span>
              <div style={{ display: "grid", gap: 22, marginTop: 16, justifyItems: "start" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <DownloadButton href={sample.cvUrl} size={cvSize} />
                  <span className={s.dim}>Blocks fill the pill and the label turns into the file facts.</span>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <CopyEmail email={sample.contacts[0].value} />
                  <span className={s.dim}>Click to copy. The confirmation resolves out of blocks.</span>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <a className={s.link} href={sample.achievements[0].href} target="_blank" rel="noreferrer">Read the AIComprehend paper</a>
                  <span className={s.dim}>The dashed rule draws over in coral.</span>
                </div>
              </div>
            </div>
          </div>
          <div className={s.cells} style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className={s.cell}>
              <span className={s.label}>Tool chips</span>
              <p>Hover a chip to see where it sits in its skill group.</p>
              <div className={s.chips} style={{ marginTop: 44 }}>
                {dataEng.tools.slice(0, 8).map((t, i) => (
                  <ToolChip key={t} name={t} logo={techLogoKey(t) ?? undefined} group={dataEng.title} index={i} total={dataEng.tools.length} />
                ))}
              </div>
            </div>
            <div className={s.cell}>
              <span className={s.label}>Timeline blocks</span>
              <p>{sample.role} at Thinking Machines, one block per month. Hover to count.</p>
              <div style={{ marginTop: 16 }}>
                <MonthStrip months={roleMonths} label="at Thinking Machines" />
              </div>
            </div>
          </div>
        </Section>

        <Section id="empty" num="07" title="Empty States" note="The same voice when there is nothing to show.">
          <div className={s.cells} style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className={s.cell}>
              <div className={s.empty}>
                <span className={s.emptyGrid} aria-hidden="true">
                  {Array.from({ length: 9 }, (_, i) => <i key={i} data-gone={i === 4 ? "" : undefined} />)}
                </span>
                <b>This page was deduplicated.</b>
                <span>It matched another page with high confidence and got merged into it. Head back to the home page.</span>
              </div>
            </div>
            <div className={s.cell}>
              <div className={s.empty}>
                <span className={s.emptyGrid} aria-hidden="true">
                  {Array.from({ length: 9 }, (_, i) => <i key={i} style={{ background: "var(--raw)" }} />)}
                </span>
                <b>No rows returned.</b>
                <span>Nothing in the CV matches that search. Try a tool name like Airflow, or a company.</span>
              </div>
            </div>
          </div>
        </Section>

        <Section id="library" num="08" title="Verb Library" note="One word each, tagged with every context it fits, so shared words appear in more than one list.">
          <div className={s.cells} style={{ gridTemplateColumns: "1fr" }}>
            <div className={s.cell}>
              <span className={s.label}>Words and where they appear</span>
              <ul className={s.verbs}>
                {VERBS.map((v) => (
                  <li key={v.word}>
                    {v.word}
                    <span className={s.verbTags}>{v.in.map((c) => CONTEXT_LABEL[c]).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <footer className={s.footer}>
          <span>/samples/states</span>
          <span>Proposed brand · not live</span>
        </footer>
      </main>
    </div>
  );
}
