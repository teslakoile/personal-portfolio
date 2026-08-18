"use client";

import { useEffect, useRef } from "react";
import styles from "./VelocityTicker.module.css";
import { Logo } from "./Logo";

const STACK = [
  { key: "databricks", name: "Databricks" },
  { key: "snowflake", name: "Snowflake" },
  { key: "bigquery", name: "BigQuery" },
  { key: "airflow", name: "Airflow" },
  { key: "python", name: "Python" },
  { key: "postgresql", name: "PostgreSQL" },
  { key: "django", name: "Django" },
  { key: "fastapi", name: "FastAPI" },
  { key: "aws", name: "AWS" },
  { key: "azure", name: "Azure" },
  { key: "googlecloud", name: "Google Cloud" },
  { key: "docker", name: "Docker" },
  { key: "kubernetes", name: "Kubernetes" },
  { key: "terraform", name: "Terraform" },
] as const;

type Item = { key: string; name: string };

/** A shared scroll-velocity signal (decaying), so both rows lean together. */
function useScrollVelocity() {
  const vel = useRef(0);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      vel.current += y - lastY;
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return vel;
}

function Row({ items, dir, vel }: { items: readonly Item[]; dir: 1 | -1; vel: React.RefObject<number> }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let half = track.scrollWidth / 2;
    let offset = 0;
    let raf = 0;

    const loop = () => {
      half = track.scrollWidth / 2 || half;
      const v = vel.current;
      // base drift + a boost from scroll velocity (capped)
      const speed = 0.5 + Math.min(Math.abs(v) * 0.22, 7);
      if (!paused.current) {
        offset -= dir * speed;
        if (offset <= -half) offset += half;
        else if (offset >= 0) offset -= half;
      }
      // lean in the scroll direction (rows lean opposite), settles to 0 when idle
      const skew = Math.max(-7, Math.min(7, v * 0.22)) * dir;
      track.style.transform = `translate3d(${offset.toFixed(2)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
      vel.current *= 0.9; // decay
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dir, vel]);

  const doubled = [...items, ...items];
  return (
    <div
      className={styles.marquee}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <div ref={trackRef} className={styles.track}>
        {doubled.map((s, i) => (
          <span key={i} className={styles.item}>
            <Logo name={s.key} size={18} className={styles.logo} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function VelocityTicker() {
  const vel = useScrollVelocity();
  return (
    <div className={styles.band}>
      <p className={styles.label}>Tools I work with</p>
      <div className={styles.rows}>
        <Row items={STACK} dir={1} vel={vel} />
        <Row items={[...STACK].reverse()} dir={-1} vel={vel} />
      </div>
    </div>
  );
}
