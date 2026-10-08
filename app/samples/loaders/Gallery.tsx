"use client";

import { useState, type CSSProperties } from "react";
import { GROUPS } from "./Loaders";
import g from "./gallery.module.css";

const SPEEDS = [{ v: 1, label: "Normal" }, { v: 3, label: "Slow Motion" }];

/** Every loader large, then at text size beside a verb and inside a button. */
export function Gallery() {
  const [t, setT] = useState(1);
  return (
    <div style={{ "--t": t } as CSSProperties}>
      <div className={g.bar}>
        <span className={g.barLabel}>Speed</span>
        <div className={g.seg} role="radiogroup" aria-label="Speed">
          {SPEEDS.map((x) => (
            <button key={x.v} type="button" role="radio" aria-checked={t === x.v} className={t === x.v ? g.on : undefined} onClick={() => setT(x.v)}>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {GROUPS.map((grp) => (
        <section key={grp.title} className={g.group}>
          <div className={g.groupHead}>
            <h3>{grp.title}</h3>
            <p>{grp.note}</p>
          </div>
          <div className={g.grid}>
            {grp.items.map(({ name, note, C }) => {
              return (
                <div key={name} className={g.card}>
                  <div className={g.stage}><C /></div>
                  <div className={g.meta}>
                    <b>{name}</b>
                    <span className={g.job}>{note}</span>
                    <span className={g.inline}><C /> Deduplicating…</span>
                    <span className={g.btn}><C /> Sending</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
