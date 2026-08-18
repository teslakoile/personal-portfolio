/* Real, multicolor brand logos served from /public/logos (curated + visually
   verified). Only verified-correct logos exist here — anything missing renders
   as clean text by the caller (no mono-blue, no wrong marks). */

const LOGO_FILES = new Set([
  "googlecloud", "azure", "aws", "databricks", "airflow", "python", "django",
  "postgresql", "fastapi", "bigquery", "kubernetes", "docker", "terraform",
  "snowflake", "mongodb", "github", "linkedin",
  // extended set (verified brand marks from simple-icons, brand-colored)
  "javascript", "cplusplus", "gnubash", "pandas", "apachespark", "dbt",
  "openai", "langchain", "keras", "tensorflow", "flask", "sqlalchemy",
  "pydantic", "git", "azuredevops", "bitbucket", "jira", "confluence",
  "postman", "jenkins", "claude", "powerbi",
]);

// Tech display name (as used in sampleContent) -> logo key, ONLY where a verified
// logo exists. First-party cloud services map to their parent mark (Vertex AI →
// Google Cloud, Snowflake Cortex → Snowflake). Concepts (Splink, RAG, MLOps, SQL,
// CI/CD, Dagster, Kibana, Grafana, Dataform…) intentionally map to nothing.
const TECH_TO_KEY: Record<string, string> = {
  "Azure Databricks": "databricks",
  Databricks: "databricks",
  Snowflake: "snowflake",
  "Snowflake Cortex": "snowflake",
  BigQuery: "bigquery",
  Airflow: "airflow",
  Python: "python",
  Django: "django",
  PostgreSQL: "postgresql",
  FastAPI: "fastapi",
  MongoDB: "mongodb",
  Kubernetes: "kubernetes",
  Docker: "docker",
  Terraform: "terraform",
  AWS: "aws",
  Azure: "azure",
  "Azure AI Services": "azure",
  GCP: "googlecloud",
  "Vertex AI": "googlecloud",
  // extended
  JavaScript: "javascript",
  "C++": "cplusplus",
  Bash: "gnubash",
  PySpark: "apachespark",
  Pandas: "pandas",
  dbt: "dbt",
  "OpenAI API": "openai",
  LangChain: "langchain",
  Keras: "keras",
  TensorFlow: "tensorflow",
  Flask: "flask",
  SQLAlchemy: "sqlalchemy",
  Pydantic: "pydantic",
  Git: "git",
  GitHub: "github",
  "Azure DevOps": "azuredevops",
  Bitbucket: "bitbucket",
  Jira: "jira",
  Confluence: "confluence",
  Postman: "postman",
  Jenkins: "jenkins",
  "Claude Code": "claude",
  "Power BI": "powerbi",
};

export function techLogoKey(name: string): string | null {
  return TECH_TO_KEY[name] ?? null;
}

export function Logo({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  if (!LOGO_FILES.has(name)) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logos/${name}.svg`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      className={className}
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}

/* Monochrome UI glyphs for contacts (recolored via currentColor → consistent,
   muted, not brand-colored). Email has no brand logo, so a clean line mark. */
export function ContactIcon({ kind, size = 15 }: { kind: "email" | "linkedin" | "github"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true as const, style: { display: "block" } };
  if (kind === "email") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m3.5 7 8.5 6 8.5-6" />
      </svg>
    );
  }
  if (kind === "linkedin") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zm1.78 13.02H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .77 0 1.73v20.53C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.73C24 .77 23.2 0 22.22 0z" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="currentColor">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}
