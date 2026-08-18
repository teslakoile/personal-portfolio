import styles from "./GlowTicker.module.css";
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

function Row({ items, reverse }: { items: readonly Item[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className={styles.marquee}>
      <div className={`${styles.track} ${reverse ? styles.reverse : ""}`} aria-hidden="true">
        {doubled.map((s, i) => (
          <span key={i} className={styles.item}>
            {/* the orange "sun" sits behind the opaque pill face */}
            <span className={styles.glow} aria-hidden="true" />
            <span className={styles.face}>
              <Logo name={s.key} size={18} className={styles.logo} />
              {s.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** variant 1 = static glow · 2 = rotating sunburst · 3 = pulsing corona */
export function GlowTicker({ variant }: { variant: 1 | 2 | 3 }) {
  const rowB = [...STACK].reverse();
  return (
    <div className={styles.band} data-g={variant}>
      <p className={styles.label}>Tools I work with</p>
      <div className={styles.rows}>
        <Row items={STACK} />
        <Row items={rowB} reverse />
      </div>
    </div>
  );
}
