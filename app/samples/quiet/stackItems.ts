/** The canonical tech-stack band set. Verified multicolor logos only (keys
    present in /public/logos), same 14 the landing Marquee shows. */
export const STACK = [
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

export type StackItem = { key: string; name: string };
