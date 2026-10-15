import type { ReactNode } from "react";
import { KyllmLive } from "../samples/kyllm-ui/rig/KyllmLive";
import b from "./brand.module.css";
import r from "./rail.module.css";
import { Kbd } from "./kit";
import { RailNav, type RailNavItem } from "./RailNav";
import { RailSound } from "./RailSound";

/** Rail layouts. classic is the original. ruled (picked for the redesign on
    2026-10-15) cuts the rail into ruled rows like the page frame: the
    wordmark with the sound icon, one row per section with the active row
    lifted onto surface (it fills as a ripple from the click point), and the
    launchers and the foot pinned to the bottom as ruled rows. Styles for
    ruled are in rail.module.css. */
export type RailVariant = "classic" | "ruled";

/** Sidebar rail: wordmark, numbered nav with a coral tick on the active row,
    utility launchers, then the reach-me block. The nav (RailNav, a client
    component) moves the tick to the section on screen as the page scrolls;
    `active` is the row it starts on. animate={false} keeps the original
    instant tick for before/after comparisons. */
export function Rail({ wordmark, items, active, utils, sound = false, foot, animate = true, variant = "classic" }: {
  wordmark: string;
  /** num pins a row's number to its place on the full page (a partial page
      keeps "06 Certifications"); without it rows number from 01. */
  items: RailNavItem[];
  active?: string;
  utils?: { label: string; keys: string[] }[];
  /** Add the site-wide Sound on/off switch under the utilities. */
  sound?: boolean;
  foot?: ReactNode;
  /** Slide the tick between rows with a Motion spring (default true). */
  animate?: boolean;
  variant?: RailVariant;
}) {
  const keys = (u: { keys: string[] }) => <span>{u.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>;

  if (variant === "ruled") return (
    <aside className={`${b.sidebar} ${r.rail}`}>
      <div className={r.top}>
        <a href="#" className={b.wordmark}>{wordmark}</a>
        {sound ? <RailSound icon /> : null}
      </div>
      <RailNav items={items} active={active} animate={animate} move="ripple" />
      <div className={r.foot}>
        {utils?.map((u) => (
          <button key={u.label} type="button" className={r.util} data-util={u.label}>
            {u.label === "Ask KYLLM" ? <span className={r.avatar}><KyllmLive size={28} /></span> : null}
            <b>{u.label}</b>
            {keys(u)}
          </button>
        ))}
        {foot ? <div className={r.cta}>{foot}</div> : null}
      </div>
    </aside>
  );

  return (
    <aside className={b.sidebar}>
      <a href="#" className={b.wordmark}>{wordmark}</a>
      <RailNav items={items} active={active} animate={animate} />
      {utils?.length || sound ? (
        <>
          <hr className={b.sep} />
          {utils?.map((u) => (
            <button key={u.label} type="button" className={b.util} data-util={u.label}>
              {u.label}
              {keys(u)}
            </button>
          ))}
          {sound ? <RailSound /> : null}
        </>
      ) : null}
      {foot ? <div style={{ marginTop: 28 }}>{foot}</div> : null}
    </aside>
  );
}
