"use client";

import { useState } from "react";
import { Chips } from "../kit";
import type { RoleView } from "./experienceData";
import b from "../brand.module.css";
import s from "./sections.module.css";

/**
 * The roles as a stack of drawers. Each row shows when, what, and where, plus
 * the role's headline when it has one, whether the drawer is open or not. The
 * chevron (or a click on the row) opens the projects: the work and its result
 * on the left, that project's own tools on the right. The current role starts
 * open. The detail is always in the page and is only folded away (grid rows 0fr
 * to 1fr, no height maths), so it is there for search and print, and `inert`
 * keeps a folded drawer out of the tab order. "Expand All" and "Collapse All"
 * run the whole list.
 */
/** `initial` is which drawers start open: the current role (default), all, or none. */
export function ExperienceRoles({ roles, initial = "first" }: { roles: RoleView[]; initial?: "first" | "all" | "none" }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(roles.slice(0, initial === "all" ? roles.length : initial === "first" ? 1 : 0).map((r) => r.id)));
  const all = open.size === roles.length;

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <div>
      <div className={s.roleBar}>
        <span>{roles.length} Roles</span>
        <button type="button" className={s.roleAll} onClick={() => setOpen(all ? new Set() : new Set(roles.map((r) => r.id)))}>
          {all ? "Collapse All" : "Expand All"}
        </button>
      </div>
      {roles.map((r) => {
        const isOpen = open.has(r.id);
        const panel = `role-${r.id}`;
        return (
          <div key={r.id} className={s.drawer} data-open={isOpen ? "" : undefined}>
            <div
              className={s.drawerHead}
              onClick={(e) => {
                if ((e.target as Element).closest("a, button")) return;
                toggle(r.id);
              }}
            >
              <div className={s.roleWhen}>{r.when}</div>
              <div className={s.drawerTitle}>
                <h3 className={b.h3}>{r.title}</h3>
                <div className={s.drawerOrg}>
                  {r.mark ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.mark} alt="" />
                  ) : null}
                  {r.href ? (
                    <a className={b.orgLink} href={r.href} target="_blank" rel="noreferrer">
                      {r.employer}{"\u00A0"}<span className={b.orgOut} aria-hidden="true">↗</span>
                    </a>
                  ) : r.employer}
                </div>
                <p className={s.drawerSummary}>{r.summary}</p>
              </div>
              <button
                type="button"
                className={s.chev}
                aria-expanded={isOpen}
                aria-controls={panel}
                aria-label={`${isOpen ? "Hide" : "Show"} details for ${r.title} at ${r.employer}`}
                onClick={() => toggle(r.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
            <div id={panel} className={s.drawerClip} inert={!isOpen}>
              <div className={s.drawerFold}>
                <div className={s.drawerBody}>
                  <div className={s.projects}>
                    {r.projects.map((p, n) => (
                      <div key={n} className={s.proj}>
                        <div className={s.projMain}>
                          <h4 className={s.projTitle}>{p.title}{p.context ? <em> · {p.context}</em> : null}</h4>
                          <ul className={s.projPoints}>{p.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                        </div>
                        <div className={s.projStack}><Chips items={p.stack} logos notes={p.notes} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
