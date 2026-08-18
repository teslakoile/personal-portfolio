import styles from "./Marquee.module.css";
import { Logo } from "./Logo";

/** Verified multicolor logos only (keys present in /public/logos). */
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

function Row({ items, reverse }: { items: readonly Item[]; reverse?: boolean }) {
  // duplicate the set so translateX(-50%) loops seamlessly
  const doubled = [...items, ...items];
  return (
    <div className={styles.marquee}>
      <div className={`${styles.track} ${reverse ? styles.reverse : ""}`} aria-hidden="true">
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

export function Marquee() {
  const rowB = [...STACK].reverse();
  return (
    <div className={styles.band}>
      <p className={styles.label}>Tools I work with</p>
      <div className={styles.rows}>
        <Row items={STACK} />
        <Row items={rowB} reverse />
      </div>
    </div>
  );
}
