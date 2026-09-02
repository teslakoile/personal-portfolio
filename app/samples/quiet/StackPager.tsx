"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./StackPager.module.css";
import { Logo } from "./Logo";
import { STACK } from "./stackItems";

/** Tech-stack band, paged rail: the familiar pills, but the reader drives.
    No autoplay, a snap-scrolling rail with back/forward controls, edge fades
    only where there is more to see. */
export function StackPager() {
  const railRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = railRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    // scroll-behavior comes from CSS, so reduced-motion jumps instead of glides
    el.scrollBy({ left: dir * el.clientWidth * 0.8 });
  };

  return (
    <div className={styles.band}>
      <div className={styles.head}>
        <p className={styles.label}>Tools I Work With</p>
        <div className={styles.controls}>
          <button type="button" className={styles.btn} aria-label="Scroll back" disabled={!canPrev} onClick={() => page(-1)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m14 6-6 6 6 6" />
            </svg>
          </button>
          <button type="button" className={styles.btn} aria-label="Scroll forward" disabled={!canNext} onClick={() => page(1)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m10 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
      <div className={styles.railWrap} data-can-prev={canPrev} data-can-next={canNext}>
        <div ref={railRef} className={styles.rail} onScroll={update} tabIndex={0} aria-label="Tools I Work With">
          {STACK.map((s) => (
            <span key={s.key} className={styles.item}>
              <Logo name={s.key} size={18} className={styles.logo} />
              {s.name}
            </span>
          ))}
        </div>
        <div className={styles.fadeL} aria-hidden="true" />
        <div className={styles.fadeR} aria-hidden="true" />
      </div>
    </div>
  );
}
