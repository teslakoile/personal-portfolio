import styles from "./StackRails.module.css";
import { Logo } from "./Logo";

/** Tech-stack band, grouped rails: one slim hairline row per skill group,
    group names taken verbatim from the Skills spec sheet. Verified multicolor
    logos only. */
const GROUPS = [
  {
    title: "Data Engineering",
    tools: [
      { key: "databricks", name: "Databricks" },
      { key: "snowflake", name: "Snowflake" },
      { key: "bigquery", name: "BigQuery" },
      { key: "postgresql", name: "PostgreSQL" },
      { key: "airflow", name: "Airflow" },
      { key: "dbt", name: "dbt" },
      { key: "apachespark", name: "PySpark" },
    ],
  },
  {
    title: "AI & Machine Learning",
    tools: [
      { key: "openai", name: "OpenAI API" },
      { key: "langchain", name: "LangChain" },
      { key: "tensorflow", name: "TensorFlow" },
      { key: "keras", name: "Keras" },
    ],
  },
  {
    title: "Backend",
    tools: [
      { key: "fastapi", name: "FastAPI" },
      { key: "django", name: "Django" },
      { key: "flask", name: "Flask" },
      { key: "sqlalchemy", name: "SQLAlchemy" },
      { key: "pydantic", name: "Pydantic" },
    ],
  },
  {
    title: "Cloud & Infrastructure",
    tools: [
      { key: "aws", name: "AWS" },
      { key: "azure", name: "Azure" },
      { key: "googlecloud", name: "GCP" },
      { key: "docker", name: "Docker" },
      { key: "kubernetes", name: "Kubernetes" },
      { key: "terraform", name: "Terraform" },
    ],
  },
  {
    title: "Languages",
    tools: [
      { key: "python", name: "Python" },
      { key: "javascript", name: "JavaScript" },
      { key: "cplusplus", name: "C++" },
      { key: "gnubash", name: "Bash" },
    ],
  },
] as const;

export function StackRails() {
  return (
    <div className={styles.band}>
      <p className={styles.label}>Tools I Work With</p>
      <div className={styles.rows}>
        {GROUPS.map((g) => (
          <div key={g.title} className={styles.row}>
            <p className={styles.groupTitle}>{g.title}</p>
            <ul className={styles.tools} aria-label={g.title}>
              {g.tools.map((t) => (
                <li key={t.key} className={styles.tool}>
                  <Logo name={t.key} size={16} className={styles.logo} />
                  {t.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
