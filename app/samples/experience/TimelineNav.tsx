"use client";

import { useState } from "react";
import { BlockTimeline, monthCells, monthIndex, monthLabel, type YM } from "../../_brand/timeline";
import { Chips, Item } from "../../_brand/kit";
import { FROM, LEGEND, type RoleView } from "../../_brand/sections/experienceData";
import b from "../../_brand/brand.module.css";
import { OrgLine } from "./parts";
import x from "./experience.module.css";

/**
 * Option D, the timeline is the control. The career timeline stays and each
 * lane becomes a button: choosing a lane brightens it, fades the others, and
 * fills the panel below with that role. The list and the timeline are one
 * thing, so the section holds one block of data instead of two.
 */
export function TimelineNav({ roles, today, initial = 0 }: { roles: RoleView[]; today: YM; initial?: number }) {
  const [i, setI] = useState(initial);
  const r = roles[i];

  const lanes = roles.map((role, n) => ({
    label: (
      <button type="button" className={x.laneBtn} data-on={n === i ? "" : undefined} aria-pressed={n === i} onClick={() => setI(n)}>
        {role.title} <em>· {role.short}</em>
      </button>
    ),
    cells: monthCells({ from: FROM, to: today, start: role.start, end: role.end, c: role.c, today })
      .map((c) => (n === i || !c.c ? c : { ...c, o: 0.32 })),
  }));
  const ticks = Array.from({ length: today[0] - FROM[0] + 1 }, (_, k) => FROM[0] + k)
    .map((y) => ({ at: monthIndex([y, 1]) - monthIndex(FROM), label: String(y) }));

  return (
    <div>
      <div className={x.tnWrap}>
        <BlockTimeline
          lanes={lanes}
          ticks={ticks}
          today={{ at: monthIndex(today) - monthIndex(FROM), label: `Today · ${monthLabel(today)}` }}
          legend={LEGEND}
          blockW={9}
          labelW={300}
        />
      </div>
      <div className={x.tnPanel} aria-live="polite">
        <div className={x.tnId}>
          <p className={x.when}>{r.when} <span>·</span> {r.duration}</p>
          <h3 className={`${b.h3} ${x.big}`}>{r.title}</h3>
          <OrgLine r={r} />
        </div>
        <div className={x.tnBody}>
          <p className={x.lede} style={{ marginTop: 0 }}>{r.description}</p>
          {r.engagements ? (
            <div className={x.tnItems}>
              {r.engagements.map((e) => <Item key={e.title} c={r.c} title={e.title} context={e.context} figure={e.figure} />)}
            </div>
          ) : null}
        </div>
        <div className={x.tnStack}>
          <span className={b.label}>Stack</span>
          <Chips items={r.stack} logos notes={r.notes} />
        </div>
      </div>
    </div>
  );
}
