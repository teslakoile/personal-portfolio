import shell from "../_shared.module.css";
import v from "./variations.module.css";
import { sample } from "../../sampleContent";
import { Emph } from "../../quiet/helpers";

type Community = (typeof sample.community)[number];
type Talk = (typeof sample.speaking)[number];

const idx = (i: number) => String(i + 1).padStart(2, "0");

/* ============ A · Editorial feature spread ============
   Oversized magazine headlines for the orgs over a numbered talk index. */
function VariantA() {
  return (
    <section className={v.aSection} aria-label="Community and speaking — editorial spread">
      <h2 className={shell.h2}>Community &amp; Speaking</h2>

      {/* ZONE 1 — feature cards */}
      <div className={v.aFeatures}>
        {sample.community.map((c, i) => (
          <article
            key={c.name}
            className={`${v.aCard} ${shell.cardHover} ${i === 0 ? v.aCardLead : ""}`}
          >
            <p className={`${shell.eyebrow} ${v.aKicker}`}>
              <span className={shell.eyebrowDot} aria-hidden="true" />
              <span>{c.role}</span>
              <span className={`${v.aKickerSep} ${shell.tabular}`} aria-hidden="true">
                ·
              </span>
              <span className={shell.tabular}>{c.period}</span>
            </p>
            <h3 className={v.aHeadline}>{c.name}</h3>
            <hr className={v.aRule} aria-hidden="true" />
            <p className={v.aBody}>
              <Emph text={c.description} />
            </p>
          </article>
        ))}
      </div>

      {/* ZONE 2 — numbered editorial index */}
      <div className={v.aIndexBlock}>
        <p className={`${shell.eyebrow} ${v.aIndexLabel}`}>
          <span className={shell.eyebrowDot} aria-hidden="true" />
          Selected Talks
        </p>
        <ol className={v.aIndex}>
          {sample.speaking.map((s, i) => (
            <li key={s.title} className={v.aRow}>
              <span className={`${v.aNum} ${shell.tabular}`} aria-hidden="true">
                {idx(i)}
              </span>
              <div className={v.aRowMain}>
                <p className={v.aEyebrow}>{s.meta}</p>
                <h4 className={v.aTitle}>{s.title}</h4>
              </div>
              <p className={v.aDesc}>{s.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ============ B · Unified blueprint timeline ============
   One continuous hairline rail interleaving tenure (filled nodes, surface
   cards) and talks (outline nodes, bare on the page) over a graph wash. */
type RailItem =
  | { kind: "community"; data: Community }
  | { kind: "talk"; data: Talk };

const rail: RailItem[] = [
  ...sample.community.map((data): RailItem => ({ kind: "community", data })),
  ...sample.speaking.map((data): RailItem => ({ kind: "talk", data })),
];

function VariantB() {
  return (
    <section className={v.bSection} aria-label="Community and speaking timeline">
      <h2 className={shell.h2}>Community &amp; Speaking</h2>
      <div className={v.bRailWrap}>
        <div className={v.bGrid} aria-hidden="true" />
        <ol className={v.bRail}>
          {rail.map((item) =>
            item.kind === "community" ? (
              <li key={item.data.name} className={`${v.bRow} ${v.bRowComm}`}>
                <span className={`${v.bNode} ${v.bNodeComm}`} aria-hidden="true" />
                <article className={`${shell.card} ${shell.cardHover} ${v.bCard}`}>
                  <div className={v.bCardHead}>
                    <div>
                      <h3 className={v.bName}>{item.data.name}</h3>
                      <p className={v.bRole}>{item.data.role}</p>
                    </div>
                    <span className={`${v.bPeriod} ${shell.tabular}`}>{item.data.period}</span>
                  </div>
                  <p className={v.bDesc}>
                    <Emph text={item.data.description} />
                  </p>
                </article>
              </li>
            ) : (
              <li key={item.data.title} className={`${v.bRow} ${v.bRowTalk}`}>
                <span className={`${v.bNode} ${v.bNodeTalk}`} aria-hidden="true" />
                <div className={v.bTalk}>
                  <p className={v.bMeta}>{item.data.meta}</p>
                  <h4 className={v.bTalkTitle}>{item.data.title}</h4>
                  <p className={v.bTalkDesc}>{item.data.description}</p>
                </div>
              </li>
            )
          )}
        </ol>
      </div>
    </section>
  );
}

/* ============ C · Impact ledger ============
   Stat-forward leadership panel (hero KPI strip) + quieter companion +
   spec-sheet talk rail. KPI figures come from the lead org's `stats`. */
function VariantC() {
  const [lead, shaper] = sample.community;
  return (
    <section className={v.cSection} aria-label="Community and speaking — impact ledger">
      <h2 className={shell.h2}>Community &amp; Speaking</h2>

      {/* ZONE 1 — flagship ledger */}
      <article className={v.cLedger}>
        <div className={v.cIdentity}>
          <span className={shell.eyebrow}>
            <span className={shell.eyebrowDot} aria-hidden="true" />
            Leadership
          </span>
          <h3 className={v.cOrg}>{lead.name}</h3>
          <p className={`${v.cMeta} ${shell.tabular}`}>
            {lead.role} · {lead.period}
          </p>
          <p className={v.cBlurb}>
            <Emph text={lead.description} />
          </p>
        </div>
        <dl className={v.cStats} aria-label={`${lead.name} impact`}>
          {lead.stats.map((s) => (
            <div key={s.label} className={v.cStat}>
              <dt className={`${v.cFig} ${shell.tabular}`}>{s.fig}</dt>
              <dd className={v.cCap}>{s.label}</dd>
            </div>
          ))}
        </dl>
      </article>

      {/* ZONE 2 — quieter companion */}
      <article className={v.cCompanion}>
        <div className={v.cCoName}>
          <h3 className={v.cCoOrg}>{shaper.name}</h3>
          <p className={`${v.cMeta} ${shell.tabular}`}>
            {shaper.role} · {shaper.period}
          </p>
        </div>
        <p className={v.cCoBlurb}>
          <Emph text={shaper.description} />
        </p>
      </article>

      {/* ZONE 3 — speaking spec rail */}
      <div className={v.cTalksBlock}>
        <h3 className={v.cSubHead}>Speaking &amp; talks</h3>
        <div className={v.cRail}>
          {sample.speaking.map((s, i) => (
            <div key={s.title} className={v.cTalk}>
              <div className={v.cTalkLabel}>
                <span className={`${v.cIndex} ${shell.tabular}`}>{idx(i)}</span>
                <span className={v.cTalkMeta}>{s.meta}</span>
              </div>
              <div className={v.cTalkText}>
                <h4 className={v.cTalkTitle}>{s.title}</h4>
                <p className={v.cTalkDesc}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CommunityExplore() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Community &amp; Speaking · layout explorations</p>
        <h1 className={shell.pageTitle}>A louder Community &amp; Speaking section</h1>
        <p className={shell.pageHint}>
          Same content, three directions. Each renders both the community orgs (with their
          auto-bolded impact metrics) and the four selected talks.
        </p>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>A · Editorial feature spread</p>
          <VariantA />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>B · Unified blueprint timeline</p>
          <VariantB />
        </div>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>C · Impact ledger</p>
          <VariantC />
        </div>
      </div>
    </div>
  );
}
