import { sample } from "../../samples/sampleContent";
import { Row, SectionHead, type BlockColor } from "../kit";
import { BlockTimeline, monthCells, monthIndex, monthLabel, parseMonth, type YM } from "../timeline";
import b from "../brand.module.css";
import x from "./certifications.module.css";
import { IssuerGroupsMotion, type IssuerGroup } from "./CertificationsIssuerMotion";

/**
 * Certifications, redesign section, fed from sampleContent.ts. Kyle found the
 * block timeline too distracting ("less is more") and picked the by-issuer
 * layout (the default). Registry, compact, and timeline stay only for
 * /samples/redesign/certifications. Expired status comes from the render date.
 */

const FROM: YM = [2024, 1];
const TO: YM = [2028, 12];

/** Issuer → series color; the legend below names the same groups. */
const ISSUER_COLOR: Record<string, BlockColor> = {
  "Google Cloud": "b3",
  Microsoft: "b4",
  "Amazon Web Services": "b4",
  Databricks: "b1",
  OpenAI: "b2",
  Astronomer: "b2",
};

const LEGEND: { c: BlockColor; label: string }[] = [
  { c: "b3", label: "Google Cloud" },
  { c: "b4", label: "Microsoft, AWS" },
  { c: "b1", label: "Databricks" },
  { c: "b2", label: "OpenAI, Astronomer" },
  { c: "raw", label: "expired" },
];

/** Every BlockTimeline prop for the certification chart, as of `today`. */
export function certificationTimeline(today: YM) {
  return {
    lanes: sample.certifications.map((c) => ({
      label: (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/logos/${c.logo}.svg`} alt="" />
          {c.title}
        </>
      ),
      cells: monthCells({
        from: FROM, to: TO, start: parseMonth(c.issued),
        end: c.expires ? parseMonth(c.expires) : "none",
        c: ISSUER_COLOR[c.issuer] ?? "b3", today, expires: true,
      }),
    })),
    ticks: [2024, 2025, 2026, 2027, 2028].map((y) => ({ at: monthIndex([y, 1]) - monthIndex(FROM), label: String(y) })),
    today: { at: monthIndex(today) - monthIndex(FROM), label: `Today · ${monthLabel(today)}` },
    legend: LEGEND,
    blockW: 9,
    labelW: 300,
  };
}

type Cert = (typeof sample.certifications)[number];

/** Expired once its expiry month is before the current month. */
function expired(c: Cert, today: YM) {
  return c.expires !== null && monthIndex(parseMonth(c.expires)) < monthIndex(today);
}

function thisMonth(): YM {
  const d = new Date();
  return [d.getFullYear(), d.getMonth() + 1];
}

function Logo({ c, className }: { c: Cert; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/logos/${c.logo}.svg`} alt="" className={className ?? x.logo} />;
}

/** A: a registry table. Credential, issuer, issued, expires; an expired row goes muted. */
function Registry({ today }: { today: YM }) {
  return (
    <div className={x.table} role="table" aria-label="Certifications">
      <div className={x.tHead} role="row">
        <span role="columnheader">Credential</span><span role="columnheader">Issuer</span>
        <span role="columnheader">Issued</span><span role="columnheader">Expires</span>
      </div>
      {sample.certifications.map((c) => {
        const gone = expired(c, today);
        return (
          <div key={c.title} className={x.tRow} role="row">
            <span className={x.tName} role="cell">
              <Logo c={c} />
              <span className={`${x.title} ${gone ? x.muted : ""}`}>{c.title}{gone ? <span className={x.tag}>Expired</span> : null}</span>
            </span>
            <span role="cell">{c.issuer}</span>
            <span role="cell">{c.issued}</span>
            <span role="cell" className={c.expires ? undefined : x.muted}>{c.expires ?? "No expiry"}</span>
            <span className={x.tMeta}>{c.issuer} · {c.issued}{c.expires ? ` to ${c.expires}` : ", no expiry"}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Issuer groups in data order, with each credential's status line resolved. */
function issuerGroups(today: YM): IssuerGroup[] {
  const groups: IssuerGroup[] = [];
  for (const c of sample.certifications) {
    const gone = expired(c, today);
    const item = {
      title: c.title,
      gone,
      meta: gone ? `Expired ${c.expires}` : c.expires ? `${c.issued} to ${c.expires}` : `${c.issued}, no expiry`,
    };
    const g = groups.find((y) => y.issuer === c.issuer);
    if (g) g.certs.push(item); else groups.push({ issuer: c.issuer, logo: c.logo, certs: [item] });
  }
  return groups;
}

/** B: grouped by issuer, one cell each, in data order. With `animate`, the
    cells rise in on scroll. */
function ByIssuer({ today, animate }: { today: YM; animate: boolean }) {
  const groups = issuerGroups(today);
  if (animate) return <IssuerGroupsMotion groups={groups} />;
  return (
    <div className={x.issuerWrap}>
      <div className={x.issuerGrid}>
        {groups.map((g) => (
          <div key={g.issuer} className={x.issuerCell}>
            <div className={x.issuerHead}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/${g.logo}.svg`} alt="" className={x.logo} />
              <span className={x.issuerName}>{g.issuer}</span>
              <span className={x.issuerCount}>{g.certs.length}</span>
            </div>
            <ul className={x.issuerList}>
              {g.certs.map((c) => (
                <li key={c.title}>
                  <span className={`${x.title} ${c.gone ? x.muted : ""}`}>{c.title}</span>
                  <small>{c.meta}</small>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** C: a compact two-column list: logo tile, title and issuer, status on the right. */
function Compact({ today }: { today: YM }) {
  return (
    <div className={x.compact}>
      {sample.certifications.map((c) => {
        const gone = expired(c, today);
        return (
          <div key={c.title} className={x.cItem}>
            <span className={x.cTile}><Logo c={c} /></span>
            <span>
              <span className={`${x.title} ${gone ? x.muted : ""}`}>{c.title}</span>
              <span className={x.cMeta}>{c.issuer} · {c.issued}</span>
            </span>
            <span className={`${x.cStatus} ${gone ? x.muted : ""}`}>{gone ? "Expired" : c.expires ? `Valid to ${c.expires}` : "No expiry"}</span>
          </div>
        );
      })}
    </div>
  );
}

export type CertVariant = "registry" | "issuer" | "compact" | "timeline";

const NOTES: Record<CertVariant, string> = {
  registry: "Issue and expiry dates for each credential.",
  issuer: "Grouped by issuer.",
  compact: "Issue dates, and how long each stays valid.",
  timeline: "Validity windows, one block per month. Faded blocks have no expiry date. Grey has expired.",
};

/**
 * `animate` (default true) adds Motion to the issuer variant: a quiet scroll
 * entrance. `animate={false}` renders the static section,
 * for before/after comparisons. Other variants ignore it. Reduced motion comes
 * from the page's <MotionRoot>.
 */
export function Certifications({ num, variant = "issuer", animate = true, id = "certifications" }: { num?: string; variant?: CertVariant; animate?: boolean; /** the section anchor; change it when two render on one page */ id?: string }) {
  const today = thisMonth();
  return (
    <Row id={id}>
      <SectionHead num={num} title="Certifications" note={NOTES[variant]} />
      {variant === "registry" ? <Registry today={today} /> : null}
      {variant === "issuer" ? <ByIssuer today={today} animate={animate} /> : null}
      {variant === "compact" ? <Compact today={today} /> : null}
      {variant === "timeline" ? (
        <div className={b.pad} style={{ paddingBottom: 34 }}>
          <BlockTimeline {...certificationTimeline(today)} />
        </div>
      ) : null}
    </Row>
  );
}
