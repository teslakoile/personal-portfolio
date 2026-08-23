"use client";

import { useEffect, useRef } from "react";
import styles from "./styles.module.css";

/**
 * The record-linkage match-weight figure, auto-demoing: a threshold line sweeps
 * left↔right and bars light up (match) or dim (non-match) as it crosses them,
 * a live preview of the interactive explainer. SSR renders a valid resting frame
 * (so screenshots / no-JS / reduced-motion all look intentional); the sweep is
 * additive, runs only while on-screen, and stops for reduced-motion.
 */
const BARS = [6, 10, 16, 22, 18, 11, 7, 5, 9, 15, 24, 30, 26, 17, 9];
const W = 320, H = 150, PAD = 14;
const BW = (W - PAD * 2) / BARS.length;
const MAX = Math.max(...BARS);
const REST_X = PAD + BW * 9; // resting threshold (matches the static version)
const MIN_X = PAD + BW * 3;
const MAX_X = PAD + BW * 12;
const PERIOD = 7; // seconds per full sweep cycle

export function ConceptThresholdAnimated() {
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const barRefs = useRef<(SVGRectElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let startTs = 0;

    const apply = (thrX: number) => {
      lineRef.current?.setAttribute("x1", String(thrX));
      lineRef.current?.setAttribute("x2", String(thrX));
      dotRef.current?.setAttribute("cx", String(thrX));
      for (let i = 0; i < BARS.length; i++) {
        const cx = PAD + i * BW + BW / 2;
        const el = barRefs.current[i];
        if (!el) continue;
        const match = cx >= thrX;
        el.classList.toggle(styles.barMatch, match);
        el.classList.toggle(styles.barNon, !match);
      }
    };

    const frame = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = (ts - startTs) / 1000;
      const phase = (1 - Math.cos((elapsed / PERIOD) * Math.PI * 2)) / 2; // 0→1→0 eased
      apply(MIN_X + (MAX_X - MIN_X) * phase);
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !raf) {
          startTs = 0;
          raf = requestAnimationFrame(frame);
        } else if (!e.isIntersecting && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0 },
    );
    if (svgRef.current) io.observe(svgRef.current);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className={styles.conceptSvg}
      role="img"
      aria-label="Match-weight distribution with a sweeping confidence threshold"
    >
      {BARS.map((b, i) => {
        const h = (b / MAX) * (H - PAD * 2 - 8);
        const cx = PAD + i * BW + BW / 2;
        const isMatch = cx >= REST_X;
        return (
          <rect
            key={i}
            ref={(el) => { barRefs.current[i] = el; }}
            x={PAD + i * BW + 1.5}
            y={H - PAD - h}
            width={BW - 3}
            height={h}
            rx={2}
            className={isMatch ? styles.barMatch : styles.barNon}
          />
        );
      })}
      <line ref={lineRef} x1={REST_X} y1={PAD - 4} x2={REST_X} y2={H - PAD} className={styles.thrLine} />
      <circle ref={dotRef} cx={REST_X} cy={PAD - 4} r={3} className={styles.thrDot} />
    </svg>
  );
}
