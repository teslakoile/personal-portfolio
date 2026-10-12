import type { ReactNode } from "react";
import b from "./brand.module.css";
import { Kbd } from "./kit";
import { RailNav, type RailNavItem } from "./RailNav";

/** Sidebar rail: wordmark, numbered nav with a coral tick on the active row,
    utility launchers, then the reach-me block pinned to the bottom. The nav
    (RailNav, a client component) moves the tick to the section on screen as
    the page scrolls; `active` is the row it starts on. animate={false} keeps
    the original instant tick for before/after comparisons. */
export function Rail({ wordmark, items, active, utils, foot, animate = true }: {
  wordmark: string;
  /** num pins a row's number to its place on the full page (a partial page
      keeps "06 Certifications"); without it rows number from 01. */
  items: RailNavItem[];
  active?: string;
  utils?: { label: string; keys: string[] }[];
  foot?: ReactNode;
  /** Slide the tick between rows with a Motion spring (default true). */
  animate?: boolean;
}) {
  return (
    <aside className={b.sidebar}>
      <a href="#" className={b.wordmark}>{wordmark}</a>
      <RailNav items={items} active={active} animate={animate} />
      {utils?.length ? (
        <>
          <hr className={b.sep} />
          {utils.map((u) => (
            <button key={u.label} type="button" className={b.util} data-util={u.label}>
              {u.label}
              <span>{u.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
            </button>
          ))}
        </>
      ) : null}
      {foot ? <div style={{ marginTop: 28 }}>{foot}</div> : null}
    </aside>
  );
}
