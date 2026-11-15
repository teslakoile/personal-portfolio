/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import k from "../kyllm-ui/kyllm.module.css";
import b from "./blocks.module.css";
import { MermaidBlock } from "./MermaidBlock";

export const metadata: Metadata = { title: "KYLLM Answer Blocks | Samples", robots: { index: false, follow: false } };

/**
 * /samples/kyllm-blocks: what a KYLLM answer looks like when it carries a
 * chart, a diagram, an image, or an embed, at the chat sheet's real 420px
 * width. Every number, part, and link comes from the site's own content
 * (sampleContent.ts, projectsData.ts, content/blog); the step timings in the
 * folded trace are examples.
 */

const C = { think: "var(--b4)", tool: "var(--b3)", write: "var(--b1)", check: "var(--b2)" };

/** The folded steps trace (C2), with example timings. */
function Trace({ ms, steps }: { ms: number; steps: [keyof typeof C, number][] }) {
  return (
    <div className={b.trace}>
      <span>Answered in {(ms / 1000).toFixed(1)}s</span>
      <em>{steps.length} steps</em>
      <span className={b.strip}>{steps.map(([c, w], i) => <i key={i} style={{ background: C[c], flexGrow: w }} />)}</span>
    </div>
  );
}

const Cite = ({ n }: { n: number }) => <span className={b.cite}>{n}</span>;
/** a citation and the sentence's period, kept on one line */
const End = ({ n, w }: { n: number; w?: string }) => <span className={b.end}>{w}<Cite n={n} />.</span>;
const Chip = ({ a, n }: { a: string; n: string }) => <span className={b.chip}><img src="/icon.png" alt="" /><b>{a}</b>{n}</span>;

function Sheet({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className={b.sheet}>
      <div className={b.sheetHead}><img src="/kyllm/kyllm-avatar.svg" alt="" />KYLLM</div>
      <div className={b.thread}>
        <div className={b.user}>{q}</div>
        {children}
      </div>
    </div>
  );
}

function Opt({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <div className={b.opt}>
      <div className={b.optHead}><h3>{name}</h3><p>{note}</p></div>
      {children}
    </div>
  );
}

/* ------------------------------ certifications ----------------------------- */
// sampleContent.ts certifications, by issue date
const CERTS: [string, string, number, number][] = [
  ["Google Cloud", "Cloud Digital Leader", 2024, 4],
  ["Google Cloud", "Professional Machine Learning Engineer", 2025, 7],
  ["Google Cloud", "Generative AI Leader", 2025, 10],
  ["Google Cloud", "AI/ML Pre-Sales Technical Expert", 2025, 12],
  ["OpenAI", "AI Technical Practitioner", 2026, 3],
  ["OpenAI", "API Deployment Practitioner", 2026, 4],
  ["OpenAI", "Foundational Knowledge", 2026, 8],
  ["Microsoft Azure", "Azure Fundamentals", 2024, 6],
  ["Microsoft Azure", "Azure AI Engineer Associate", 2025, 5],
  ["Databricks", "Certified Data Engineer Associate", 2025, 12],
  ["Astronomer", "Airflow 3 Fundamentals", 2025, 7],
  ["AWS", "Certified Cloud Practitioner", 2024, 3],
];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ISSUERS = [...new Set(CERTS.map((c) => c[0]))];
const perYear = [2024, 2025, 2026].map((y) => ({ y, n: CERTS.filter((c) => c[2] === y).length }));

const CERT_TEXT = (
  <p className={b.text}>
    Kyle earned 12 certifications between March 2024 and August 2026, half of them in 2025<End n={1} /> The 2024 ones are cloud fundamentals from AWS, Azure, and Google Cloud; 2025 added Google Cloud&apos;s Professional Machine Learning Engineer and Databricks&apos; Data Engineer Associate, and all three from 2026 are from OpenAI<End n={1} />
  </p>
);
const CERT_TRACE = <Trace ms={6400} steps={[["think", 6], ["tool", 2], ["tool", 2], ["think", 4], ["tool", 3], ["write", 30], ["check", 4]]} />;
const CERT_CHIPS = <div className={b.chips}><Chip a="Certifications" n="12 credentials" /></div>;

function Columns() {
  return (
    <div className={b.block}>
      <p className={b.bTitle}>Certifications by year issued</p>
      <div className={b.cols}>
        {perYear.map(({ y, n }) => (
          <div key={y} className={b.col} data-top={n === 6 ? "" : undefined} style={{ "--v": n } as CSSProperties}><b>{n}</b><i /></div>
        ))}
      </div>
      <div className={b.colLabels}>{perYear.map(({ y }) => <span key={y}>{y}</span>)}</div>
      <p className={b.bFoot}>From Certifications, by issue date</p>
    </div>
  );
}

function DotTimeline() {
  const at = (y: number, m: number) => `${(((y - 2024) * 12 + m - 0.5) / 36) * 100}%`;
  return (
    <div className={b.block}>
      <p className={b.bTitle}>Each certification by issuer and date</p>
      <div className={b.dots}>
        {ISSUERS.map((iss) => (
          <div key={iss} style={{ display: "contents" }}>
            <span>{iss}</span>
            <div className={b.dotLane}>
              {[1, 2].map((y) => <span key={y} className={b.yearBand} style={{ left: `${(y / 3) * 100}%` }} />)}
              {CERTS.filter((c) => c[0] === iss).map(([, t, y, m]) => (
                <i key={t} className={b.dot} style={{ left: at(y, m) }} data-tip={`${t}, ${MON[m - 1]} ${y}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={b.axis}><span /><div className={b.axisTicks}>{[2024, 2025, 2026].map((y, i) => <span key={y} style={{ left: `${((i + 0.5) / 3) * 100}%` }}>{y}</span>)}</div></div>
      <p className={b.bFoot}>From Certifications. Hover a dot for its name</p>
    </div>
  );
}

function CertTable() {
  return (
    <div className={b.block}>
      <table className={b.table}>
        <thead><tr><th>Year</th><th>Certifications</th><th style={{ textAlign: "right" }}>Count</th></tr></thead>
        <tbody>
          {perYear.map(({ y, n }) => (
            <tr key={y}>
              <td>{y}</td>
              <td>{[...new Set(CERTS.filter((c) => c[2] === y).map((c) => c[0]))].join(", ")}</td>
              <td className={b.n}>{n}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={b.bFoot}>From Certifications, by issue date</p>
    </div>
  );
}

/* --------------------------------- wishlist -------------------------------- */
// only what projects/wishlist.md says: no edge is drawn that the text does not name
const WISH_TEXT = (
  <p className={b.text}>
    Wishlist has a custom MCP server, so Claude, ChatGPT, or Codex can manage a wishlist with the app&apos;s own 29 actions<End n={1} /> Its Chrome extension saves items from any shop in one click, and the gift picker runs Gemma in the visitor&apos;s browser, so nothing leaves the page<End n={1} />
  </p>
);
const WISH_TRACE = <Trace ms={5100} steps={[["think", 5], ["tool", 2], ["tool", 3], ["write", 28], ["check", 4]]} />;
const WISH_CHIPS = <div className={b.chips}><Chip a="Projects" n="Wishlist" /></div>;
const WISH_STACK = <div className={b.stack}>Built with <code>Next.js</code><code>FastAPI</code><code>PostgreSQL</code><code>MCP</code><code>GCP</code></div>;

function Node({ x, y, w, h = 44, name, sub, hi }: { x: number; y: number; w: number; h?: number; name: string; sub?: string; hi?: boolean }) {
  return (
    <g>
      <rect className={hi ? "boxHi" : "box"} x={x} y={y} width={w} height={h} rx={7} />
      <text className="name" x={x + 10} y={y + (sub ? 18 : h / 2 + 4)}>{name}</text>
      {sub ? <text className="sub" x={x + 10} y={y + 33}>{sub}</text> : null}
    </g>
  );
}
function Wire({ d, label, lx, ly }: { d: string; label?: string; lx?: number; ly?: number }) {
  return (
    <g>
      <path className="wire" d={d} markerEnd="url(#arrow)" />
      {label ? <text className="wireLabel" x={lx} y={ly} textAnchor="middle">{label}</text> : null}
    </g>
  );
}

function SiteDiagram() {
  return (
    <div className={b.block}>
      <svg className={b.diagram} viewBox="0 0 356 226" role="img" aria-label="Wishlist: Claude, ChatGPT, or Codex use the MCP server to manage a wishlist; the Chrome extension saves items; the gift picker runs Gemma in the browser">
        <defs>
          <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="var(--ink-3)" /></marker>
        </defs>
        <rect className="group" x={2} y={6} width={92} height={108} rx={9} />
        <text className="gName" x={10} y={22}>AI assistants</text>
        <Node x={10} y={30} w={76} h={22} name="Claude" />
        <Node x={10} y={56} w={76} h={22} name="ChatGPT" />
        <Node x={10} y={82} w={76} h={22} name="Codex" />
        <Wire d="M95 60 H149" label="manage" lx={122} ly={53} />
        <Node x={151} y={38} w={98} name="MCP server" sub="29 app actions" hi />
        <Wire d="M250 60 H271" />
        <Node x={273} y={38} w={81} name="Wishlist" sub="the app" hi />
        <Node x={2} y={136} w={130} name="Chrome extension" sub="any shop, one click" />
        <Wire d="M133 158 H313 V85" label="saves items" lx={222} ly={151} />
        <rect className="group" x={151} y={172} width={203} height={50} rx={9} />
        <text className="gName" x={159} y={187}>Runs in the visitor&apos;s browser</text>
        <Node x={159} y={193} w={187} h={22} name="Gift picker · Gemma" />
      </svg>
      {WISH_STACK}
      <p className={b.bFoot}>Drawn from Projects · Wishlist. Shows only the parts and links the page names</p>
    </div>
  );
}

const MERMAID = `flowchart TB
  subgraph AI[AI assistants]
    C1[Claude]
    C2[ChatGPT]
    C3[Codex]
  end
  C1 & C2 & C3 -- manage --> M[MCP server<br/>29 app actions]
  M --> W[Wishlist]
  E[Chrome extension] -- saves items --> W
  subgraph B[Runs in the visitor's browser]
    G[Gift picker · Gemma]
  end`;

function MermaidOpt() {
  return (
    <div className={b.block}>
      <MermaidBlock code={MERMAID} />
      {WISH_STACK}
      <p className={b.bFoot}>Drawn from Projects · Wishlist</p>
    </div>
  );
}

function StepsText() {
  return (
    <ol className={b.steps}>
      <li><code>Claude</code>, <code>ChatGPT</code>, or <code>Codex</code> call Wishlist&apos;s <code>MCP server</code>, which exposes the app&apos;s own 29 actions<End n={1} /></li>
      <li>The <code>Chrome extension</code> saves an item from any shop in one click<End n={1} /></li>
      <li>The <code>gift picker</code> runs Gemma in the visitor&apos;s browser, so nothing leaves the page<End n={1} /></li>
    </ol>
  );
}

/* ---------------------------------- images --------------------------------- */
const POST = {
  title: "Writing LLM Evals After OpenAI Evals",
  dek: "OpenAI Evals goes read-only on October 31 and shuts down on November 30. This guide maps its datasets and graders onto a Promptfoo config that lives in your repo and runs in CI.",
  cover: "/blog/writing-llm-evals-after-openai-evals/cover.webp",
};
const POST_TEXT = (
  <p className={b.text}>
    His first post, Writing LLM Evals After OpenAI Evals, maps OpenAI Evals&apos; datasets and graders onto a Promptfoo config that lives in the repo and runs in <End n={1} w="CI" />
  </p>
);
const POST_TRACE = <Trace ms={3900} steps={[["think", 4], ["tool", 3], ["write", 22], ["check", 4]]} />;

const MARKS: [string, string, string][] = [
  ["Servo", "servo.png", "Runs Philippine clinics and 30 to 50 bed hospitals"],
  ["VSenses", "vsenses.png", "Runs a Davao City spa's booking and intake forms"],
  ["Wishlist", "wishlist.png", "Friends and family share gift lists"],
  ["Leafmark", "leafmark.png", "Files each new bookmark into the right folder"],
  ["Flee the Faculty", "flee-the-faculty.png", "Players explain school concepts out loud"],
  ["huly-cli", "huly.svg", "Manage a Huly workspace from the terminal"],
];

/* ----------------------------------- page ----------------------------------- */
function Section({ id, title, note, children }: { id: string; title: string; note: string; children: ReactNode }) {
  return (
    <section id={id} className={b.sec}>
      <div className={b.secHead}><h2>{title}</h2><p>{note}</p></div>
      <div className={b.opts}>{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <div className={k.root}>
      <div className={b.wrap}>
        <h1 className={b.h1}>KYLLM Answer Blocks</h1>
        <p className={b.lede}>What an answer looks like when it carries a chart, a diagram, an image, or an embed, at the chat sheet&apos;s real 420px width. Each block sits between the answer text and the source chips.</p>
        <ul className={b.rules}>
          <li>Every number, part, and link comes from the site&apos;s own content. The step timings in each trace are examples.</li>
          <li>Blocks are drawn by the chat from a small spec the model sends, so they use the site&apos;s fonts and colours. The model never writes HTML.</li>
          <li>Pick one option per section, or say what to change.</li>
        </ul>

        <Section id="charts" title="Charts" note="The data-insights guide loads for questions about patterns or trends. The only data on the site is dates, counts, and lists, so these use the 12 certifications.">
          <Opt name="A. Columns" note="One number per year, value on top of each bar. The busiest year is a shade darker.">
            <Sheet q="When did he earn his certifications?">{CERT_TRACE}{CERT_TEXT}<Columns />{CERT_CHIPS}</Sheet>
          </Opt>
          <Opt name="B. Dot Timeline" note="One dot per certification, a row per issuer. Shows both when and from whom.">
            <Sheet q="When did he earn his certifications?">{CERT_TRACE}{CERT_TEXT}<DotTimeline />{CERT_CHIPS}</Sheet>
          </Opt>
          <Opt name="C. Table" note="Exact values, no chart. The guide would pick this when the visitor needs to read numbers.">
            <Sheet q="When did he earn his certifications?">{CERT_TRACE}{CERT_TEXT}<CertTable />{CERT_CHIPS}</Sheet>
          </Opt>
        </Section>

        <Section id="diagrams" title="Architecture Diagrams" note="The architecture guide loads for how-it-works questions. Wishlist's page names the AI assistants, the MCP server, the extension, and the gift picker. It names the stack but not how the parts connect, so the stack is a list, not boxes.">
          <Opt name="A. Site Diagram" note="Drawn by the chat in SVG: Geist Mono labels, site greys, dashed groups. The layout comes from the spec.">
            <Sheet q="How does Wishlist work?">{WISH_TRACE}{WISH_TEXT}<SiteDiagram />{WISH_CHIPS}</Sheet>
          </Opt>
          <Opt name="B. Mermaid" note="The model writes Mermaid and the chat renders it with a site theme. Loaded from a CDN for this prototype.">
            <Sheet q="How does Wishlist work?">{WISH_TRACE}{WISH_TEXT}<MermaidOpt />{WISH_CHIPS}</Sheet>
          </Opt>
          <Opt name="C. Numbered Steps" note="No diagram: the parts in order, with Geist Mono names. The baseline to beat.">
            <Sheet q="How does Wishlist work?">{WISH_TRACE}<StepsText />{WISH_STACK}{WISH_CHIPS}</Sheet>
          </Opt>
        </Section>

        <Section id="images" title="Images and Embeds" note="Images come only from the site's own files, picked by id. An embed is a fixed entry in the knowledge base and loads only when the visitor presses Play. The post shown is still a draft.">
          <Opt name="A. Figure" note="The image full width with a caption. For a blog cover or a project screenshot.">
            <Sheet q="What is he writing about?">{POST_TRACE}{POST_TEXT}
              <figure className={b.figure}><img src={POST.cover} alt="" /><figcaption><b>{POST.title}</b> · Cover image</figcaption></figure>
              <div className={b.chips}><Chip a="Writing" n="LLM Evals" /></div>
            </Sheet>
          </Opt>
          <Opt name="B. Link Card" note="Thumbnail, title, and summary in one row that opens the page. Smaller than a figure.">
            <Sheet q="What is he writing about?">{POST_TRACE}{POST_TEXT}
              <a className={b.link} href="#"><img src={POST.cover} alt="" /><div><b>{POST.title}</b><span>{POST.dek.split(". ")[1]}</span><small>kylenaranjo.cv/blog</small></div></a>
            </Sheet>
          </Opt>
          <Opt name="C. Logo List" note="Each project's own logo beside its name and one line. For list answers.">
            <Sheet q="What has he built?">
              <Trace ms={2800} steps={[["think", 5], ["write", 20], ["check", 3]]} />
              <p className={b.text}>Kyle has built six products and tools, from hospital software to a command-line tool<End n={1} /></p>
              <div className={`${b.block} ${b.marks}`}>
                {MARKS.map(([n, f, l]) => (
                  <div key={n} className={b.markRow}><img src={`/projects/marks/${f}`} alt="" /><div><b>{n}</b><span>{l}</span></div><ArrowUpRight size={14} color="var(--ink-3)" /></div>
                ))}
              </div>
              <div className={b.chips}><Chip a="Projects" n="6 projects" /></div>
            </Sheet>
          </Opt>
          <Opt name="D. Embed, Click to Load" note="Shown in place of an iframe until the visitor presses Play. Nothing from itch.io loads before that.">
            <Sheet q="Can I try Flee the Faculty?">
              <Trace ms={3200} steps={[["think", 4], ["tool", 3], ["write", 16], ["check", 3]]} />
              <p className={b.text}>Yes. Flee the Faculty is on itch.io: players rescue classmates by explaining school concepts out loud<End n={1} /></p>
              <div className={b.embed}>
                <div className={b.embedIn}>
                  <img src="/projects/marks/flee-the-faculty.png" alt="" />
                  <b>Flee the Faculty</b>
                  <span>Plays in this answer from itch.io. Nothing loads until you press Play.</span>
                  <span className={b.embedBtn}><Play size={13} />Play on itch.io</span>
                </div>
              </div>
              <div className={b.chips}><Chip a="Projects" n="Flee the Faculty" /></div>
            </Sheet>
          </Opt>
        </Section>
      </div>
    </div>
  );
}
