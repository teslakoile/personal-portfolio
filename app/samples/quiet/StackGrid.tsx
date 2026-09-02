import styles from "./StackGrid.module.css";
import { Logo } from "./Logo";
import { STACK } from "./stackItems";

/** Tech-stack band, hairline grid: every tool visible at once, zero motion.
    Cells share 1px gaps over the border color so the lattice reads as drafted
    rules, the Swiss answer to a marquee. */
export function StackGrid() {
  return (
    <div className={styles.band}>
      <div className={styles.head}>
        <p className={styles.label}>Tools I Work With</p>
        <p className={styles.count}>{STACK.length} Tools</p>
      </div>
      <ul className={styles.grid}>
        {STACK.map((s) => (
          <li key={s.key} className={styles.cell}>
            <Logo name={s.key} size={18} className={styles.logo} />
            <span className={styles.name}>{s.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
