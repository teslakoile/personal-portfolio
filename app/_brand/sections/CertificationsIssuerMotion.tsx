"use client";

import { motion, type Variants } from "motion/react";
import x from "./certifications.module.css";

/** One issuer group, precomputed on the server so the client gets plain strings. */
export type IssuerGroup = {
  issuer: string;
  logo: string;
  certs: { title: string; gone: boolean; meta: string }[];
};

/* Quiet by design: Kyle found the block timeline too busy, so the only motion
   is the entrance: each issuer cell rises 10px and fades in, 0.45s, 0.04s
   apart, once, as the grid scrolls into view. (Collapsible groups were tried
   and dropped: on the desktop grid a short group kept its row height.) */
const EASE = [0.22, 1, 0.36, 1] as const;

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const cell: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/** The by-issuer grid with a scroll entrance; same markup as the static one
    (the wrapper is the container the column count is measured from). */
export function IssuerGroupsMotion({ groups }: { groups: IssuerGroup[] }) {
  return (
    <div className={x.issuerWrap}>
      <motion.div
        className={x.issuerGrid}
        variants={grid}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {groups.map((g) => (
          <motion.div key={g.issuer} className={x.issuerCell} variants={cell}>
            <div className={x.issuerHead}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/${g.logo}.svg`} alt="" className={x.logo} />
              <span className={x.issuerName}>{g.issuer}</span>
              <span className={x.issuerCount}>{g.certs.length}</span>
            </div>
            <ul className={x.issuerList}>
              {g.certs.map((c) => (
                <li key={c.title}>
                  <span className={`${x.title} ${c.gone ? x.muted : ""}`}>{c.title}</span>
                  <small>{c.meta}</small>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
