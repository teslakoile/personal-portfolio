import { toolLogo } from "../../_brand/logos";
import { Item } from "../../_brand/kit";
import type { RoleView } from "../../_brand/sections/experienceData";
import b from "../../_brand/brand.module.css";
import { OrgLine } from "./parts";
import x from "./experience.module.css";

/**
 * Option C, ledger. One dense row per role in fixed columns: when, what and
 * where, how long, and the stack as logo tiles (the tile's note comes from the
 * same chip tooltip). Nothing is folded and the rows share one baseline, so
 * the list scans like a CV. The current role's engagements nest under it.
 */
export function Ledger({ roles }: { roles: RoleView[] }) {
  const employers = new Set(roles.map((r) => r.employer)).size;
  return (
    <div className={x.lg}>
      <div className={x.lgBar}>{roles.length} roles at {employers} employers</div>
      <div className={`${x.lgRow} ${x.lgHead}`} aria-hidden="true">
        <span className={b.label}>When</span>
        <span className={b.label}>Role</span>
        <span className={b.label}>Length</span>
        <span className={b.label}>Stack</span>
      </div>
      {roles.map((r) => (
        <div key={r.id} className={x.lgRow}>
          <div className={x.lgWhen}>{r.when}</div>
          <div className={x.lgRole}>
            <h3 className={b.h4}>{r.title}</h3>
            <OrgLine r={r} />
            <p>{r.description}</p>
            {r.engagements ? (
              <div className={x.lgSub}>
                {r.engagements.map((e) => <Item key={e.title} c={r.c} title={e.title} context={e.context} figure={e.figure} />)}
              </div>
            ) : null}
          </div>
          <div className={x.lgLen}>
            <span className={x.lgBlocks} style={{ ["--n" as string]: r.months, ["--c" as string]: `var(--${r.c})` }} aria-hidden="true" />
            {r.duration}
          </div>
          <ul className={x.lgIcons}>
            {r.stack.map((t) => {
              const src = toolLogo(t);
              const note = r.notes[t];
              return (
                <li
                  key={t}
                  className={x.lgIcon}
                  {...(note ? { "data-chip": t, "data-note": note, tabIndex: 0, "aria-label": `${t}. ${note}` } : { title: t })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {src ? <img src={src} alt="" /> : <span>{t}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
