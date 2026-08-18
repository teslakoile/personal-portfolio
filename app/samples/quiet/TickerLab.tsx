"use client";

import { useRef, type MouseEvent } from "react";
import styles from "./TickerLab.module.css";
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

function Row({ items, reverse, variant }: { items: readonly Item[]; reverse?: boolean; variant: 1 | 2 | 3 }) {
  const els = useRef<(HTMLSpanElement | null)[]>([]);
  const raf = useRef(0);
  const dock = variant === 1;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dock) return;
    const cx = e.clientX;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      for (const el of els.current) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const d = Math.abs(cx - (r.left + r.width / 2));
        const t = Math.max(0, 1 - d / 175);
        el.style.transform = `scale(${(1 + 0.45 * t * t).toFixed(3)})`;
        el.style.zIndex = t > 0.05 ? "1" : "0";
      }
    });
  };
  const onLeave = () => {
    if (!dock) return;
    cancelAnimationFrame(raf.current);
    for (const el of els.current) {
      if (el) { el.style.transform = ""; el.style.zIndex = ""; }
    }
  };

  const doubled = [...items, ...items];
  return (
    <div className={styles.marquee} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className={`${styles.track} ${reverse ? styles.reverse : ""}`} aria-hidden="true">
        {doubled.map((s, i) => (
          <span
            key={i}
            ref={dock ? (el) => { els.current[i] = el; } : undefined}
            className={styles.item}
          >
            <Logo name={s.key} size={18} className={styles.logo} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TickerLab({ variant }: { variant: 1 | 2 | 3 }) {
  const rowB = [...STACK].reverse();
  return (
    <div className={styles.band} data-v={variant}>
      <div className={styles.rows}>
        <Row items={STACK} variant={variant} />
        <Row items={rowB} reverse variant={variant} />
      </div>
    </div>
  );
}
