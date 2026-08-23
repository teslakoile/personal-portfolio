import { sample } from "../../sampleContent";
import styles from "../styles.module.css";
import alt from "./Experience.alt.module.css";
import { Emph, Pill } from "../helpers";
import type { SectionVariant } from "./Hero";

const current = sample.experience.current;
const past = sample.experience.past;

type Client = (typeof current.clients)[number];

// The bank is the one client with a quantified outcome → it leads. The rest keep
// their data order behind it. Every client gets the same full case-study card.
const heroClient = current.clients.find((c) => "metrics" in c)!;
const orderedClients: Client[] = [heroClient, ...current.clients.filter((c) => !("metrics" in c))];

function Bullets({ points }: { points: readonly string[] }) {
  return (
    <ul className={styles.bullets}>
      {points.map((pt, i) => (
        <li key={i} className={styles.bullet}>
          <span className={styles.bulletMark} aria-hidden="true">▷</span>
          <span><Emph text={pt} /></span>
        </li>
      ))}
    </ul>
  );
}

function StackRow({ stack }: { stack: readonly string[] }) {
  return (
    <div className={styles.stackRow}>
      {stack.map((s) => <Pill key={s} name={s} />)}
    </div>
  );
}

/** One anonymized client = one full case-study card: confidential head, its
    engagement(s) of bullets + stack, and, for the bank, the outcome strip. */
function ClientCard({ client }: { client: Client }) {
  const multi = client.engagements.length > 1;
  const metrics = "metrics" in client ? client.metrics : undefined;
  return (
    <div className={`${styles.roleCard} ${alt.caseCard}`}>
      <div className={`${styles.caseHead} ${alt.headFirst}`}>
        <span className={styles.caseClient}>{client.client}</span>
      </div>
      {client.engagements.map((eng, i) => (
        <div key={eng.name} className={i > 0 ? alt.engNext : undefined}>
          {multi ? <p className={alt.engName}>{eng.name}</p> : null}
          <Bullets points={eng.points} />
          {i === 0 && metrics ? (
            <dl className={styles.outcomeStrip}>
              {metrics.map((m) => (
                <div key={m.label} className={styles.outcomeItem}>
                  <dt className={styles.outcomeValue}>{m.value}</dt>
                  <dd className={styles.outcomeLabel}>{m.label}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <StackRow stack={eng.stack} />
        </div>
      ))}
    </div>
  );
}

/** Thinking Machines, the current role: every client as a full case card. */
function CurrentRole() {
  return (
    <article className={styles.tlRow}>
      <div className={styles.tlPeriod}>{current.period}</div>
      <div className={styles.tlBody}>
        <h3 className={styles.tlRole}>
          {current.role} <span className={styles.tlAt}>at</span>{" "}
          <a className={styles.tlCompany} href={current.companyUrl} target="_blank" rel="noreferrer">{current.company}</a>
        </h3>
        <p className={styles.tlSummary}>{current.summary}</p>
        <div className={alt.caseStack}>
          {orderedClients.map((c) => <ClientCard key={c.client} client={c} />)}
          <div className={`${styles.roleCard} ${alt.caseCard}`}>
            <div className={`${styles.caseHead} ${alt.headFirst}`}>
              <span className={styles.caseClient}>Internal Contributions</span>
            </div>
            <Bullets points={current.internal} />
          </div>
        </div>
      </div>
    </article>
  );
}

function PastRole({ group }: { group: (typeof past)[number] }) {
  return (
    <article className={styles.tlRow}>
      <div className={styles.tlPeriod}>{group.roles[0].period}</div>
      <div className={styles.tlBody}>
        <h3 className={styles.tlRole}>
          <span className={styles.tlCompanyPlain}>{group.company}</span>
        </h3>
        <div className={alt.caseStack}>
          {group.roles.map((r) => (
            <div key={r.title} className={`${styles.roleCard} ${alt.caseCard}`}>
              <div className={`${styles.caseHead} ${alt.headFirst}`}>
                <span className={styles.caseClient}>{r.title}</span>
                <span className={alt.casePeriod}>{r.period}</span>
              </div>
              <p className={styles.roleSummary}><Emph text={r.description} /></p>
              <StackRow stack={r.stack} />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

/** V1, the locked experience design: period rail + carded body, the current
    role broken into full client case cards (bank first), then past roles.
    `eyebrow` is the landing page's numbered section label (absent on samples). */
function ExperienceV1({ eyebrow }: { eyebrow?: React.ReactNode }) {
  return (
    <section className={styles.section}>
      {eyebrow}
      <h2 className={styles.h2}>Experience</h2>
      <div className={styles.timeline}>
        <CurrentRole />
        {past.map((g) => <PastRole key={g.company} group={g} />)}
      </div>
    </section>
  );
}

// V2/V3 were direction-comparison layouts in the sandbox; the user locked V1, so
// they route to it now (the comparison routes get cleaned up with the sandbox).
export function Experience({ variant = 1, eyebrow }: { variant?: SectionVariant; eyebrow?: React.ReactNode }) {
  void variant;
  return <ExperienceV1 eyebrow={eyebrow} />;
}
