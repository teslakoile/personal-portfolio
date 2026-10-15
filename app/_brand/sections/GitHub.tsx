import { sample } from "../../samples/sampleContent";
import { fetchContributions } from "../../_home/Contributions";
import { Row, SectionHead } from "../kit";
import s from "./sections.module.css";
import { ContributionCalendar } from "./github/ContributionCalendar";
import { buildYear } from "./github/year";

/**
 * GitHub: the contribution calendar, 53 week-columns by 7 weekdays, read from
 * the public contributions fragment (revalidated twice a day). Each square is
 * one day; the interaction and motion live in ContributionCalendar. A failed
 * fetch degrades to a link, as on the live landing page.
 */
export async function GitHub({ num, id = "github" }: { num?: string; /** the section anchor; change it when two render on one page */ id?: string }) {
  const data = await fetchContributions();

  if (!data) {
    return (
      <Row id={id}>
        <SectionHead num={num} title="GitHub" />
        <p className={s.ghFallback}>The contribution graph is unavailable right now. <a href={sample.github.url} target="_blank" rel="noreferrer">View it on GitHub ↗</a></p>
      </Row>
    );
  }

  return (
    <Row id={id}>
      <SectionHead num={num} title="GitHub" />
      <ContributionCalendar year={buildYear(data.days, data.total)} />
    </Row>
  );
}
