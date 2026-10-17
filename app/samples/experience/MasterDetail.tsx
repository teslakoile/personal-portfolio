"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Chips, Item } from "../../_brand/kit";
import type { RoleView } from "../../_brand/sections/experienceData";
import b from "../../_brand/brand.module.css";
import { OrgLine } from "./parts";
import x from "./experience.module.css";

/**
 * Option A, master and detail. The roles are a list down the left and one
 * role's detail fills the right, so the page holds one story at a time and
 * does not grow as roles are added. The list is a vertical tablist: arrow
 * keys move the selection, Home and End jump to the ends.
 */
export function MasterDetail({ roles, initial = 0 }: { roles: RoleView[]; initial?: number }) {
  const [i, setI] = useState(initial);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const r = roles[i];

  const go = (n: number) => {
    const next = (n + roles.length) % roles.length;
    setI(next);
    tabs.current[next]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); go(i + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); go(i - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(roles.length - 1); }
  };

  return (
    <div className={x.md}>
      <div className={x.mdList} role="tablist" aria-orientation="vertical" aria-label="Roles" onKeyDown={onKey}>
        {roles.map((role, n) => (
          <button
            key={role.id}
            ref={(el) => { tabs.current[n] = el; }}
            id={`md-tab-${role.id}`}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-controls="md-panel"
            tabIndex={n === i ? 0 : -1}
            className={x.mdTab}
            data-on={n === i ? "" : undefined}
            onClick={() => setI(n)}
          >
            <span className={x.mdKey} style={{ background: `var(--${role.c})` }} aria-hidden="true" />
            <span>
              <b>{role.title}</b>
              <small>{role.short}</small>
              <small>{role.when}</small>
            </span>
          </button>
        ))}
      </div>
      <div id="md-panel" role="tabpanel" aria-labelledby={`md-tab-${r.id}`} className={x.mdPanel}>
        <p className={x.when}>{r.when} <span>·</span> {r.duration}</p>
        <h3 className={`${b.h3} ${x.big}`}>{r.title}</h3>
        <OrgLine r={r} />
        <p className={x.lede}>{r.description}</p>
        {r.engagements ? (
          <>
            <span className={`${b.label} ${x.sub}`}>Engagements</span>
            <div>{r.engagements.map((e) => <Item key={e.title} c={r.c} title={e.title} context={e.context} figure={e.figure} />)}</div>
          </>
        ) : null}
        <span className={`${b.label} ${x.sub}`}>Stack</span>
        <Chips items={r.stack} logos notes={r.notes} />
      </div>
    </div>
  );
}
