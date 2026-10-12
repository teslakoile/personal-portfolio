import { sample } from "../../samples/sampleContent";
import { fetchContributions } from "../../_home/Contributions";
import { Row, SectionHead } from "../kit";
import s from "./sections.module.css";

/**
 * GitHub: the contribution calendar as 53 week-columns by 7 weekday-rows, read
 * from the public contributions fragment (revalidated twice a day). Each cell
 * is one day. Level 0 is grey; levels 1 to 4 deepen one block color, so the
 * graph never competes with the UI's single coral. A failed fetch degrades to
 * a link, as on the live landing page.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const OPACITY = [1, 0.28, 0.5, 0.75, 1];

const monthYear = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

export async function GitHub({ num }: { num?: string }) {
  const data = await fetchContributions();
  const url = sample.github.url;

  if (!data) {
    return (
      <Row id="github">
        <SectionHead num={num} title="GitHub" />
        <p className={s.ghFallback}>The contribution graph is unavailable right now. <a href={url} target="_blank" rel="noreferrer">View it on GitHub ↗</a></p>
      </Row>
    );
  }

  const cells = new Array<number>(53 * 7).fill(0);
  for (const d of data.days) {
    const i = d.week * 7 + d.weekday;
    if (i >= 0 && i < cells.length) cells[i] = d.level;
  }
  const dates = data.days.map((d) => d.date).sort();

  return (
    <Row id="github">
      <SectionHead num={num} title="GitHub" />
      <div className={s.ghWrap}>
        <div className={s.ghGrid} role="img" aria-label={`${data.total} contributions in the last year`}>
          {cells.map((level, i) => (
            <i key={i} style={level ? { background: "var(--b1)", opacity: OPACITY[level] } : undefined} />
          ))}
        </div>
        <div className={s.ghFoot}>
          <span>{monthYear(dates[0])}</span>
          <span>{monthYear(dates[dates.length - 1])}</span>
        </div>
      </div>
    </Row>
  );
}
