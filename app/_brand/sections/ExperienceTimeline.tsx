import type { YM } from "../timeline";
import { BlockTimeline, monthCells, monthIndex, monthLabel } from "../timeline";
import s from "./sections.module.css";
import { FROM, LEGEND, type RoleView } from "./experienceData";

/** The career timeline: one lane per role, one block per month. Shared by the
    Experience section and the layout options under app/samples/experience. */
export function ExperienceTimeline({ roles, today }: { roles: RoleView[]; today: YM }) {
  const lanes = roles.map((r) => ({
    label: <>{r.title} <em>· {r.short}</em></>,
    cells: monthCells({ from: FROM, to: today, start: r.start, end: r.end, c: r.c, today }),
  }));
  const ticks = Array.from({ length: today[0] - FROM[0] + 1 }, (_, i) => FROM[0] + i)
    .map((y) => ({ at: monthIndex([y, 1]) - monthIndex(FROM), label: String(y) }));
  return (
    <div className={s.timelineWrap}>
      <BlockTimeline
        lanes={lanes}
        ticks={ticks}
        today={{ at: monthIndex(today) - monthIndex(FROM), label: `Today · ${monthLabel(today)}` }}
        legend={LEGEND}
        blockW={9}
        labelW={300}
      />
    </div>
  );
}
