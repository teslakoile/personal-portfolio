"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./styles.module.css";

/**
 * Subtle, fire-once entrance for a section. Visible by default — content renders
 * with no JS, with reduced-motion, and in screenshots. The reveal is purely
 * additive: we only arm elements that are below the fold on mount, then animate
 * them in once as they scroll into view. In-view content is never hidden.
 */
export function Reveal({ id, children }: { id?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // already in (or near) view → leave visible, no flash
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;

    el.classList.add(styles.revealArmed);
    const obs = new IntersectionObserver(
      (entries, o) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add(styles.revealIn);
            o.unobserve(el);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // scroll-margin keeps anchored jumps clear of the sticky header
  return <div ref={ref} id={id} className={id ? styles.anchor : undefined}>{children}</div>;
}
