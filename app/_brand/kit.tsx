import type { CSSProperties, ReactNode } from "react";
import b from "./brand.module.css";
import { RailNav, type RailNavItem } from "./RailNav";

/**
 * Proposed brand kit, the reusable pieces of the "data blocks" direction
 * (design-explorations/2026-09-brand-system/9-full-site-v2.png). Wrap a page
 * in <BrandRoot> to get the tokens; every component below reads them. The
 * hidden /branding page renders each one, so changes show up there first.
 */

export type BlockColor = "b1" | "b2" | "b3" | "b4" | "raw" | "coral";
export type Cell = { c: BlockColor | null; o?: number };

const fill = (c: BlockColor | null) => (c ? `var(--${c})` : "transparent");

export function BrandRoot({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`${b.root} ${className ?? ""}`}>{children}</div>;
}

/* ------------------------------ frame ------------------------------ */

/** The 1080px ruled column. */
export function Frame({ children }: { children: ReactNode }) {
  return <div className={b.frame}>{children}</div>;
}

/** One frame row: bottom rule plus a + crosshair at each joint. */
export function Row({ children, className, id, style }: { children: ReactNode; className?: string; id?: string; style?: CSSProperties }) {
  return (
    <div id={id} className={`${b.row} ${className ?? ""}`} style={style}>
      <span className={`${b.x} ${b.xl}`} aria-hidden="true" />
      <span className={`${b.x} ${b.xr}`} aria-hidden="true" />
      {children}
    </div>
  );
}

/** Cells split by vertical rules. `cols` is a grid-template-columns value. */
export function Cells({ cols, children }: { cols: string; children: ReactNode }) {
  return <div className={b.cells} style={{ gridTemplateColumns: cols }}>{children}</div>;
}

/** Section head: coral number beside the H2, optional note on the right. */
export function SectionHead({ num, title, note, as: Tag = "h2" }: { num?: string; title: ReactNode; note?: ReactNode; as?: "h1" | "h2" }) {
  return (
    <div className={b.head}>
      <Tag className={b.h2}>
        {num ? <span className={b.num}>{num}</span> : null}
        {title}
      </Tag>
      {note ? <p>{note}</p> : null}
    </div>
  );
}

/* ----------------------------- controls ---------------------------- */

type ButtonVariant = "primary" | "secondary" | "onCoral" | "glass";
const BTN: Record<ButtonVariant, string> = {
  primary: b.btnPrimary,
  secondary: b.btnSecondary,
  onCoral: b.btnOnCoral,
  glass: b.btnGlass,
};

/** Pill button, rendered as a link when it has an href. */
export function Button({ variant = "primary", size, href, download, children }: {
  variant?: ButtonVariant;
  size?: "sm";
  href?: string;
  download?: boolean;
  children: ReactNode;
}) {
  const cls = `${b.btn} ${BTN[variant]} ${size === "sm" ? b.btnSm : ""}`;
  if (href) {
    const external = href.startsWith("http");
    return (
      <a className={cls} href={href} download={download || undefined}
        target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
        {children}
      </a>
    );
  }
  return <button type="button" className={cls}>{children}</button>;
}

/** Status pill with a sage key, used once at the top of the hero. */
export function Badge({ children }: { children: ReactNode }) {
  return <span className={b.badge}><i aria-hidden="true" />{children}</span>;
}

export function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul className={b.chips} style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map((t) => <li key={t} className={b.chip}>{t}</li>)}
    </ul>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={b.kbd}>{children}</kbd>;
}

/* ------------------------------ blocks ----------------------------- */

/** n blocks of one color; `lastOpacity` fades the final block (a partial unit). */
export function run(n: number, c: BlockColor, lastOpacity?: number): Cell[] {
  return Array.from({ length: n }, (_, i) => ({ c, o: lastOpacity && i === n - 1 ? lastOpacity : undefined }));
}

/** A row of data blocks. Every block is one stated unit of real data. */
export function Blocks({ cells, w = 9, h = 6, label }: { cells: Cell[]; w?: number; h?: number; label?: string }) {
  return (
    <div className={b.blocks} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {cells.map((x, i) => (
        <i key={i} style={{ width: w, height: h, background: fill(x.c), opacity: x.o }} />
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { c: BlockColor; label: string }[] }) {
  return (
    <div className={b.legend}>
      {items.map((x) => <span key={x.label}><i style={{ background: fill(x.c) }} />{x.label}</span>)}
    </div>
  );
}

/* ------------------------------- rows ------------------------------ */

export function KeyValues({ items }: { items: { k: string; v: ReactNode }[] }) {
  return (
    <dl style={{ margin: 0 }}>
      {items.map((x) => (
        <div key={x.k} className={b.kv}>
          <dt className={b.label}>{x.k}</dt>
          <dd>{x.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** List row: color key, title with muted context, right-aligned figure. */
export function Item({ c = "b1", title, context, figure }: { c?: BlockColor; title: ReactNode; context?: ReactNode; figure?: ReactNode }) {
  return (
    <div className={b.item}>
      <span className={b.key} style={{ background: fill(c) }} aria-hidden="true" />
      <span>{title}{context ? <em> · {context}</em> : null}</span>
      {figure ? <small>{figure}</small> : <span />}
    </div>
  );
}

/** Metric cell: value, its blocks, and a caption that states what one block is. */
export function Metric({ value, blocks, caption }: { value: ReactNode; blocks?: Cell[][]; caption: ReactNode }) {
  return (
    <div className={b.metric}>
      <div className={b.value}>{value}</div>
      {blocks?.map((cells, i) => (
        <div key={i} style={{ marginTop: i ? 3 : 12 }}>
          <Blocks cells={cells} />
        </div>
      ))}
      <p>{caption}</p>
    </div>
  );
}

/** Pipeline stage cell: step label, title, figure, note. */
export function Stage({ step, title, value, note }: { step: string; title: string; value: ReactNode; note: ReactNode }) {
  return (
    <div className={b.stage}>
      <span className={b.label}>{step}</span>
      <h4>{title}</h4>
      <div className={b.value}>{value}</div>
      <p>{note}</p>
    </div>
  );
}

/** A figure and its label. Pass n, c, and unit only for a real measured count
    whose unit is stated; community and program numbers stay plain. */
export function Stat({ figure, label, n, c, unit }: { figure: string; label: string; n?: number; c?: BlockColor; unit?: string }) {
  if (!n || !c || !unit) {
    return <div className={`${b.stat} ${b.statPlain}`}><b>{figure}</b><span>{label}</span></div>;
  }
  return (
    <div className={b.stat}>
      <div><b>{figure}</b><small>{label}</small></div>
      <div>
        <Blocks cells={run(n, c)} w={14} h={9} label={`${figure} ${label}, ${unit}`} />
        <small style={{ marginTop: 6 }}>{unit}</small>
      </div>
    </div>
  );
}

export function Talk({ title, desc, meta }: { title: string; desc: string; meta: string }) {
  return (
    <div className={b.talk}>
      <div><b>{title}</b><span>{desc}</span></div>
      <small>{meta}</small>
    </div>
  );
}

/* ---------------------------- navigation --------------------------- */

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

export function Footer({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return <footer className={b.footer}><span>{left}</span>{right ? <span>{right}</span> : null}</footer>;
}

/* ------------------------------ closing ---------------------------- */

/** Fixed pattern for the closing band's strip (decorative, not data). */
const STRIP = Array.from({ length: 40 }, (_, i) => {
  const v = ((i * 37 + 11) % 100) / 100;
  return v < 0.3 ? "rgb(255 255 255 / 0.55)" : v < 0.55 ? "rgb(255 255 255 / 0.3)" : v < 0.8 ? "rgb(28 25 23 / 0.18)" : "rgb(255 255 255 / 0.8)";
});

export function ClosingBand({ title, note, children }: { title: string; note: ReactNode; children: ReactNode }) {
  return (
    <Row className={b.band}>
      <div className={b.bandIn}>
        <h2 className={b.h2}>{title}</h2>
        <p>{note}</p>
        <div className={b.bandActions}>{children}</div>
      </div>
      <div className={b.bandStrip} aria-hidden="true">
        {STRIP.map((bg, i) => <i key={i} style={{ background: bg }} />)}
      </div>
    </Row>
  );
}

export { b as brand };
