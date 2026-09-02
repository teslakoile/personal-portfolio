import styles from "./StackLine.module.css";
import { Logo } from "./Logo";
import { STACK } from "./stackItems";

/** Tech-stack band, quiet line: one slow ruled row, bare logo + name, no
    pills. Items carry their own right margin (not flex gap) so the -50% loop
    period is exact and the seam never jumps. */
export function StackLine() {
  const doubled = [...STACK, ...STACK];
  return (
    <div className={styles.band}>
      <p className={styles.label}>Tools I Work With</p>
      <div className={styles.marquee}>
        <div className={styles.track} aria-hidden="true">
          {doubled.map((s, i) => (
            <span key={i} className={styles.item}>
              <Logo name={s.key} size={17} className={styles.logo} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
