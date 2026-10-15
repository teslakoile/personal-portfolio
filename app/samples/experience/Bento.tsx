import { Chips } from "../../_brand/kit";
import type { RoleView } from "../../_brand/sections/experienceData";
import b from "../../_brand/brand.module.css";
import { OrgLine, splitFigure } from "./parts";
import x from "./experience.module.css";

/**
 * Option B, bento. Nothing is folded. The current role is one large cell with
 * its engagements as figure cells (the number is the headline, as on the
 * data-block metrics), and the earlier roles sit below as a grid of equal
 * cards. Everything is readable at once, so it costs the most height.
 */
export function Bento({ roles }: { roles: RoleView[] }) {
  const [cur, ...past] = roles;
  return (
    <div>
      <div className={x.bnFeature}>
        <div className={x.bnLead}>
          <p className={x.when}>{cur.when} <span>·</span> {cur.duration}</p>
          <h3 className={`${b.h3} ${x.big}`}>{cur.title}</h3>
          <OrgLine r={cur} />
          <p className={x.lede}>{cur.description}</p>
          <div className={x.bnStack}><Chips items={cur.stack} logos notes={cur.notes} /></div>
        </div>
        <div className={x.bnFigs}>
          {cur.engagements?.map((e) => {
            const f = splitFigure(e.figure);
            return (
              <div key={e.title} className={x.bnFig}>
                <div className={b.value}>{f.n}<small>{f.unit}</small></div>
                <h4 className={b.h4}>{e.title}</h4>
                <p>{e.context}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className={x.bnPast}>
        {past.map((r) => (
          <article key={r.id} className={x.bnCard}>
            <p className={x.when}>{r.when} <span>·</span> {r.duration}</p>
            <h3 className={b.h4} style={{ fontSize: 18 }}>{r.title}</h3>
            <OrgLine r={r} />
            <p className={x.cardText}>{r.description}</p>
            <Chips items={r.stack} logos notes={r.notes} />
          </article>
        ))}
      </div>
    </div>
  );
}
