import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";

/**
 * GitHub contributions heatmap — server-rendered from the public contributions
 * fragment GitHub serves for every profile (no token needed), revalidated twice
 * a day. Cells carry data-level 0–4 exactly like GitHub's own calendar; we remap
 * the greens onto the site's coral scale. Fetch failure degrades to a link.
 *
 * `Contributions` is the landing design (white card). `ContributionsInk` is the
 * alternative inverted-band treatment for the /samples/rework comparison.
 */

type Day = { date: string; level: number; week: number; weekday: number };

const CELL = 11; // px square
const GAP = 3;

async function fetchContributions(): Promise<{ total: number; days: Day[] } | null> {
  try {
    const res = await fetch(`https://github.com/users/${sample.github.user}/contributions`, {
      next: { revalidate: 43200 },
      headers: { accept: "text/html" },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const totalMatch = html.match(/([\d,]+)\s+contributions?\s+in the last year/i);
    const total = totalMatch ? parseInt(totalMatch[1].replaceAll(",", ""), 10) : 0;

    // <td … data-date="YYYY-MM-DD" id="contribution-day-component-<weekday>-<week>"
    //   … data-level="N" …> — attribute order can shift, so pull each attr from
    // the tag independently.
    const days: Day[] = [];
    for (const tag of html.match(/<td[^>]*ContributionCalendar-day[^>]*>/g) ?? []) {
      const date = tag.match(/data-date="([\d-]+)"/)?.[1];
      const level = tag.match(/data-level="(\d)"/)?.[1];
      const pos = tag.match(/contribution-day-component-(\d+)-(\d+)/);
      if (!date || !level || !pos) continue;
      days.push({ date, level: Number(level), weekday: Number(pos[1]), week: Number(pos[2]) });
    }
    if (!days.length) return null;
    return { total, days };
  } catch {
    return null;
  }
}

function Legend() {
  return (
    <span className={home.ghLegend} aria-hidden="true">
      Less
      <svg width={CELL * 5 + GAP * 4} height={CELL}>
        {[0, 1, 2, 3, 4].map((l) => (
          <rect key={l} x={l * (CELL + GAP)} y={0} width={CELL} height={CELL}
            className={`${home.ghD} ${home[`ghL${l}` as keyof typeof home]}`} />
        ))}
      </svg>
      More
    </span>
  );
}

function Fallback() {
  return (
    <p className={home.ghCaption}>
      The contribution graph is taking a breather — see the commits directly on{" "}
      <a className={home.ghLink} href={sample.github.url} target="_blank" rel="noreferrer">
        github.com/{sample.github.user} <span aria-hidden="true">↗</span>
      </a>
      .
    </p>
  );
}

function Head() {
  return (
    <div className={styles.sectionHeadRow}>
      <h2 className={styles.h2}>GitHub</h2>
      <a className={home.ghLink} href={sample.github.url} target="_blank" rel="noreferrer">
        @{sample.github.user} <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}

/** Landing design — heatmap in a white card with caption + legend. */
export async function Contributions() {
  const data = await fetchContributions();
  return (
    <section className={styles.section} aria-label="GitHub contributions">
      <Head />
      {data ? (
        <div className={home.ghGraphWrap}>
          <Heatmap days={data.days} />
          <div className={home.ghFootRow}>
            <p className={home.ghCaption}>
              <b>{data.total.toLocaleString("en-US")}</b> contributions in the last year
            </p>
            <Legend />
          </div>
        </div>
      ) : (
        <Fallback />
      )}
    </section>
  );
}

/** Alternative treatment — closing ledger: de-carded paper spread. The total
    goes jumbo in a stat column beside the bare coral field; the page closes on
    its biggest number without spending a band. */
export async function ContributionsLedger() {
  const data = await fetchContributions();
  return (
    <section className={styles.section} aria-label="GitHub contributions">
      <Head />
      {data ? (
        <div className={home.ghLedger}>
          <div className={home.ghLedgerStat}>
            <span className={home.ghLedgerTotal}>{data.total.toLocaleString("en-US")}</span>
            <p className={home.ghLedgerLabel}>contributions in the last year</p>
            <Legend />
          </div>
          <div className={home.ghLedgerField}>
            <Heatmap days={data.days} />
          </div>
        </div>
      ) : (
        <Fallback />
      )}
    </section>
  );
}

/** Alternative treatment — terminal plate: a contained ink panel floating on
    paper (dark rounded object, mono status bar, recolored ramp) — an inverted
    moment without a full-bleed band. */
export async function ContributionsPlate() {
  const data = await fetchContributions();
  return (
    <section className={styles.section} aria-label="GitHub contributions">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>GitHub</h2>
      </div>
      {data ? (
        <div className={home.ghPlate}>
          <div className={home.ghPlateBar}>
            <a className={home.ghLink} href={sample.github.url} target="_blank" rel="noreferrer">
              @{sample.github.user} <span aria-hidden="true">↗</span>
            </a>
            <span className={home.ghPlateMeta}>
              <b>{data.total.toLocaleString("en-US")}</b> contributions in the last year
            </span>
          </div>
          <div className={home.ghPlateScroll}>
            <Heatmap days={data.days} />
          </div>
          <div className={home.ghPlateFoot}>
            <Legend />
          </div>
        </div>
      ) : (
        <Fallback />
      )}
    </section>
  );
}

/** Alternative treatment — the ink coda: de-carded heatmap recolored onto an
    inverted band, with an oversized contribution total. Wrap in home.bandInk. */
export async function ContributionsInk() {
  const data = await fetchContributions();
  return (
    <div className={home.bandInk}>
      <section className={styles.section} aria-label="GitHub contributions">
        <Head />
        {data ? (
          <>
            <div className={home.ghGraphBare}>
              <Heatmap days={data.days} />
            </div>
            <div className={home.ghStat}>
              <span className={home.ghTotal}>{data.total.toLocaleString("en-US")}</span>
              <span className={home.ghStatLabel}>contributions in the last year</span>
              <Legend />
            </div>
          </>
        ) : (
          <Fallback />
        )}
      </section>
    </div>
  );
}

function Heatmap({ days, fluid = false }: { days: Day[]; fluid?: boolean }) {
  const weeks = Math.max(...days.map((d) => d.week)) + 1;
  const width = weeks * (CELL + GAP) - GAP;
  const height = 7 * (CELL + GAP) - GAP;
  return (
    <div style={fluid ? undefined : { minWidth: width }}>
      <svg className={fluid ? `${home.ghSvg} ${home.ysSvg}` : home.ghSvg}
        width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
        aria-label="Contribution calendar, one square per day over the last year">
        {days.map((d) => (
          <rect
            key={d.date}
            x={d.week * (CELL + GAP)}
            y={d.weekday * (CELL + GAP)}
            width={CELL}
            height={CELL}
            className={`${home.ghD} ${home[`ghL${d.level}` as keyof typeof home]}`}
          >
            <title>{d.date}</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Creative white-background treatments (options E/F). */

const PITCH = CELL + GAP;
const LABEL_H = 18; // month-rail band above the dot field
const RADII = [1.5, 2, 3, 4, 5.5]; // per-level dot radius — size is the encoding

const fmtDay = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function DotMatrix({ days }: { days: Day[] }) {
  const weeks = Math.max(...days.map((d) => d.week)) + 1;
  const width = weeks * PITCH - GAP;
  const height = LABEL_H + 7 * PITCH - GAP;

  // month rail: label each week that starts a new month; drop a leading
  // partial-month label when the next one lands under 3 weeks in
  const months: { week: number; label: string }[] = [];
  let prev = "";
  for (let w = 0; w < weeks; w++) {
    const d0 = days.find((d) => d.week === w && d.weekday === 0) ?? days.find((d) => d.week === w);
    if (!d0) continue;
    const m = new Date(d0.date + "T00:00:00").toLocaleString("en-US", { month: "short" });
    if (m !== prev) { months.push({ week: w, label: m }); prev = m; }
  }
  if (months.length > 1 && months[1].week - months[0].week < 3) months.shift();

  return (
    <div className={home.dmField} style={{ minWidth: width }}>
      <svg className={home.dmSvg} viewBox={`0 0 ${width} ${height}`}
        style={{ aspectRatio: `${width} / ${height}` }} role="img"
        aria-label="Contribution calendar, one dot per day over the last year; larger dots mean more contributions">
        {months.map((m) => (
          <text key={`${m.label}-${m.week}`} x={m.week * PITCH} y={10}
            className={home.dmMonth} aria-hidden="true">{m.label}</text>
        ))}
        {days.map((d) => (
          <circle key={d.date}
            cx={d.week * PITCH + CELL / 2}
            cy={LABEL_H + d.weekday * PITCH + CELL / 2}
            r={RADII[d.level]}
            className={`${home.dmDot} ${home[`dmL${d.level}` as keyof typeof home]}`}>
            <title>{d.level === 0
              ? `${fmtDay(d.date)} — no contributions`
              : `${fmtDay(d.date)} — level ${d.level} of 4`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

function DotLegend() {
  return (
    <span className={home.dmLegend} aria-hidden="true">
      Less
      <svg width={5 * PITCH - GAP} height={CELL} viewBox={`0 0 ${5 * PITCH - GAP} ${CELL}`}>
        {[0, 1, 2, 3, 4].map((l) => (
          <circle key={l} cx={l * PITCH + CELL / 2} cy={CELL / 2} r={RADII[l]}
            className={home[`dmL${l}` as keyof typeof home]} />
        ))}
      </svg>
      More
    </span>
  );
}

/** Alternative treatment — dot matrix: radius-scaled ink dots on a white
    punch-card plate (mono header strip, in-SVG month rail, dot legend); only
    level-4 days flare coral. Size is the encoding, not color. */
export async function ContributionsDotMatrix() {
  const data = await fetchContributions();
  return (
    <section className={styles.section} aria-label="GitHub contributions">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>GitHub</h2>
      </div>
      {data ? (
        <div className={home.dmCard}>
          <div className={home.dmHead}>
            <p className={home.dmCaption}>
              <b>{data.total.toLocaleString("en-US")}</b> contributions in the last year
            </p>
            <a className={home.dmUser} href={sample.github.url} target="_blank" rel="noreferrer">
              @{sample.github.user} <span className={home.dmArrow} aria-hidden="true">↗</span>
            </a>
          </div>
          <div className={home.dmScroll}>
            <DotMatrix days={data.days} />
          </div>
          <div className={home.dmFoot}><DotLegend /></div>
        </div>
      ) : (
        <Fallback />
      )}
    </section>
  );
}

/** Alternative treatment — year strip: the heatmap scaled up into a
    column-bleed paper texture whose edges dissolve, with the jumbo mono total
    stamped over the fading bottom rows. The host section is an inline-size
    container so the bleed measures the column, not the viewport (the rework
    Compare stage declares the same containment for previews). */
export async function ContributionsStrip() {
  const data = await fetchContributions();
  return (
    <section className={styles.section} aria-label="GitHub contributions">
      <Head />
      {data ? (
        <div className={home.ysWrap}>
          <div className={home.ysBleed}>
            <div className={home.ysFade}>
              <Heatmap days={data.days} fluid />
            </div>
          </div>
          <div className={home.ysStat}>
            <div className={home.ysFig}>
              <span className={home.ysTotal}>{data.total.toLocaleString("en-US")}</span>
              <p className={home.ysLabel}>contributions in the last year</p>
            </div>
            <Legend />
          </div>
        </div>
      ) : (
        <Fallback />
      )}
    </section>
  );
}
