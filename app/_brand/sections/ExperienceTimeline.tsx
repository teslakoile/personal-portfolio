import type { YM } from "../timeline";
import { BlockTimeline, monthCells, monthIndex } from "../timeline";
import s from "./sections.module.css";
import { FROM, type RoleView } from "./experienceData";

/** The career timeline: one lane per employer, one block per month, the
    employer's logo before its name. The dashed line is the present. */
export function ExperienceTimeline({ roles, today }: { roles: RoleView[]; today: YM }) {
  const lanes = roles.map((r) => ({
    label: (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {r.mark ? <img src={r.mark} alt="" /> : null}
        <span>{r.title} <em>· {r.short}</em></span>
      </>
    ),
    cells: monthCells({ from: FROM, to: today, start: r.start, end: r.end, c: r.c, today }),
  }));
  const ticks = Array.from({ length: today[0] - FROM[0] + 1 }, (_, i) => FROM[0] + i)
    .map((y) => ({ at: monthIndex([y, 1]) - monthIndex(FROM), label: String(y) }));
  return (
    <div className={s.timelineWrap}>
      <BlockTimeline
        lanes={lanes}
        ticks={ticks}
        today={{ at: monthIndex(today) - monthIndex(FROM), label: "Present" }}
        flag
        blockW={9}
        labelW={320}
      />
    </div>
  );
}
