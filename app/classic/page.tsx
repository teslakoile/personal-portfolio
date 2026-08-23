type ContactLink = {
  label: string;
  value: string;
  href: string;
  external?: boolean;
};

type Engagement = {
  name: string;
  points: string[];
  stack: string[];
};

type ClientWork = {
  client: string;
  engagements: Engagement[];
};

type RoleEntry = {
  title: string;
  period: string;
  description: string;
};

type ExperienceGroup = {
  company: string;
  website?: string;
  roles: RoleEntry[];
};

type SpeakingEvent = {
  meta: string;
  title: string;
  description: string;
};

type Achievement = {
  meta: string;
  title: string;
  description: string;
  href?: string;
};

const contactLinks: ContactLink[] = [
  {
    label: "Email",
    value: "kyle.naranjo@gmail.com",
    href: "mailto:kyle.naranjo@gmail.com",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/kyle-naranjo",
    href: "https://linkedin.com/in/kyle-naranjo",
    external: true,
  },
  {
    label: "GitHub",
    value: "github.com/teslakoile",
    href: "https://github.com/teslakoile",
    external: true,
  },
  {
    label: "Phone",
    value: "+63 906 561 4027",
    href: "tel:+639065614027",
  },
] as const;

const focusAreas = [
  "Data Engineering",
  "AI Infrastructure",
  "GenAI",
  "Agentic AI",
  "MLOps",
  "Data Pipelines",
  "Data Warehousing",
  "Backend Engineering",
  "Cloud Infrastructure",
] as const;

const tmClientWork: ClientWork[] = [
  {
    client: "A large Singaporean investment holding company",
    engagements: [
      {
        name: "Investment data platform",
        points: [
          "Owned backend feature development across more than 10 interconnected microservices powering deal discovery, due diligence, and portfolio monitoring workflows.",
          "Built backend services and data pipelines with FastAPI, Dagster, Kubernetes, and Snowflake, processing terabytes of data from vendor platforms including Sustainalytics, PitchBook, Bloomberg, and MSCI.",
          "Improved platform reliability and observability through production monitoring workflows using Kibana and Grafana.",
        ],
        stack: [
          "FastAPI",
          "Dagster",
          "Snowflake",
          "PostgreSQL",
          "SQLAlchemy",
          "Pydantic",
          "Kubernetes",
          "Kibana",
          "Grafana",
          "Jenkins",
          "Bitbucket",
        ],
      },
      {
        name: "Enterprise document intelligence platform",
        points: [
          "Iterated on Snowflake Cortex AI agent workflows with the Knowledge Graph team so investment officers could extract data from long-form documents, run contextual queries, and analyze portfolio information at scale.",
          "Owned agent tooling, prompt engineering, evaluation, workflow tuning, and production incident triage across the document intelligence stack.",
          "Partnered with a roughly 15-person cross-functional team spanning frontend, backend, LLM workflows, MLOps, DevOps, and QA.",
        ],
        stack: [
          "FastAPI",
          "Snowflake",
          "Snowflake Cortex",
          "OpenAI API",
          "Kubernetes",
          "Kibana",
          "Grafana",
          "Azure DevOps",
        ],
      },
    ],
  },
  {
    client: "A major Philippine bank",
    engagements: [
      {
        name: "Enterprise data products",
        points: [
          "Led the data products workstream in a year-long engagement, partnering with C-suite leaders, directors, and business units to define and ship priority data products on Azure Databricks.",
          "Designed and productionized a daily Single Customer View pipeline that consolidated roughly 15 million records from four enterprise systems into about 7 million unique customer keys used across more than 10 business units.",
          "Built a probabilistic record-linkage engine with Splink, surfaced 748,000 candidate duplicate pairs missed by exact matching, and designed a five-tier confidence framework validated at more than 99.9 percent accuracy.",
          "Cut Single Customer View runtime from more than four hours to under one hour and co-designed a Next Best Product recommendation pipeline covering 12 product types and four customer segments.",
        ],
        stack: [
          "Azure Databricks",
          "PySpark",
          "SQL",
          "Splink",
          "Delta Lake",
        ],
      },
    ],
  },
  {
    client: "A Philippine education enterprise",
    engagements: [
      {
        name: "Student-at-risk prediction platform",
        points: [
          "Spearheaded the infrastructure and ingestion workstream for a student-at-risk prediction platform on Azure Databricks.",
          "Provisioned and managed platform infrastructure with Terraform, built API ingestion pipelines across three source systems, and migrated Excel-based linear regression models into production Databricks jobs.",
          "Accelerated team delivery by integrating AI coding agents into the development workflow using custom agent skills, hooks, and command layers.",
        ],
        stack: ["Azure Databricks", "Terraform", "Python", "SQL"],
      },
    ],
  },
  {
    client: "A large Singaporean enterprise",
    engagements: [
      {
        name: "Data ingestion and transformation",
        points: [
          "Led the ingestion and transformation workstream, building end-to-end pipelines from four source systems in SQL Server and MongoDB into BigQuery.",
          "Designed surrogate key strategies to resolve identifier collisions between member and visitor systems and modeled production reporting tables for attendance analytics.",
          "Resolved memory failures in legacy Airflow DAGs by implementing chunked CSV processing before production rollout.",
        ],
        stack: [
          "BigQuery",
          "Cloud Composer",
          "Airflow",
          "Dataform",
          "SQL",
          "MongoDB",
          "SQL Server",
        ],
      },
    ],
  },
  {
    client: "A Philippine airline",
    engagements: [
      {
        name: "Enablement curriculum design",
        points: [
          "Designed and delivered a six-course enablement curriculum covering Python and Power BI tracks from beginner to advanced levels in four days.",
        ],
        stack: ["Python", "Power BI", "Curriculum Design"],
      },
    ],
  },
] as const;

const tmInternalContributions = [
  "Authored a standardized data ingestion scoping framework RFC for the engineering consulting team.",
  "Created post-exam study guides that supported certification preparation across the company.",
  "Built a proof-of-concept integration connecting ChatGPT to Databricks through an MCP server.",
] as const;

const otherExperience: ExperienceGroup[] = [
  {
    company: "Ingenuity Software",
    roles: [
      {
        title: "Backend Software Engineer",
        period: "Jan 2022 - Jul 2024",
        description:
          "Built the backend of a compliance case-management platform on Django, deployed across two AWS regions with separate databases for data residency and GDPR requirements. Decomposed the monolith into cross-region services and shipped roughly 50 production API endpoints supporting more than 100 reports per day.",
      },
      {
        title: "Software Engineer (Part-time)",
        period: "Jan 2022 - Sep 2022",
        description:
          "Built a Google Cloud data processing pipeline for a COVID-19 contact tracing and vaccination tracking application and led a two-week data science internship program for eight participants.",
      },
    ],
  },
  {
    company: "UP Diliman EEEEI",
    roles: [
      {
        title: "Research Associate",
        period: "Aug 2022 - Nov 2023",
        description:
          "Co-authored and published the IEEE AIComprehend paper, then built and deployed the full-stack Django application used in a month-long controlled study where students improved their test scores by 13.9 percent.",
      },
    ],
  },
  {
    company: "GCash",
    roles: [
      {
        title: "Technology and Operations Intern",
        period: "Jun 2022 - Aug 2022",
        description:
          "Modeled and transformed production datasets into Looker Studio dashboards used by the Technology and Operations team to track a 300-plus participant developer program.",
      },
    ],
  },
] as const;

const skillGroups = [
  {
    title: "Languages",
    items: ["Python", "SQL", "JavaScript", "Java", "C++", "Bash"],
  },
  {
    title: "Data Engineering",
    items: [
      "Databricks",
      "Snowflake",
      "BigQuery",
      "PostgreSQL",
      "MongoDB",
      "PySpark",
      "Pandas",
      "Airflow",
      "Dagster",
      "dbt",
      "Dataform",
      "Azure Data Factory",
      "AWS Glue",
      "Dataflow",
    ],
  },
  {
    title: "ML and AI",
    items: [
      "OpenAI API",
      "Vertex AI",
      "Azure AI Services",
      "Snowflake Cortex",
      "LangChain",
      "Keras",
      "TensorFlow",
      "Splink",
      "LLM Evals",
      "RAG",
      "Embeddings",
      "Document Extraction",
      "Computer Vision",
      "NLP",
      "AI Agents",
      "MLOps",
    ],
  },
  {
    title: "Cloud and Infrastructure",
    items: [
      "AWS",
      "Azure",
      "GCP",
      "Docker",
      "Terraform",
      "Kubernetes",
      "CI/CD",
      "IAM",
      "Networking",
    ],
  },
  {
    title: "Backend Engineering",
    items: ["FastAPI", "Django", "Flask", "SQLAlchemy", "Pydantic"],
  },
  {
    title: "Development Tools",
    items: [
      "Cursor",
      "Claude Code",
      "Codex CLI",
      "GitHub",
      "Azure DevOps",
      "Git",
      "Bitbucket",
      "Jira",
      "Confluence",
      "Postman",
      "Jenkins",
    ],
  },
] as const;

const certifications = [
  {
    title: "AI Technical Practitioner",
    issuer: "OpenAI",
    period: "Mar 2026",
  },
  {
    title: "Professional Machine Learning Engineer",
    issuer: "Google Cloud",
    period: "Jul 2025 - Jul 2027",
  },
  {
    title: "Databricks Certified Data Engineer Associate",
    issuer: "Databricks",
    period: "Dec 2025 - Dec 2027",
  },
  {
    title: "Azure AI Engineer Associate",
    issuer: "Microsoft",
    period: "May 2025 - May 2026",
  },
  {
    title: "Generative AI Leader",
    issuer: "Google Cloud",
    period: "Oct 2025 - Oct 2028",
  },
  {
    title: "AI/ML Pre-Sales Technical Expert",
    issuer: "Google Cloud",
    period: "Dec 2025",
  },
  {
    title: "Airflow 3 Fundamentals",
    issuer: "Astronomer",
    period: "Jul 2025",
  },
  {
    title: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    period: "Mar 2024 - Mar 2027",
  },
  {
    title: "Azure Fundamentals",
    issuer: "Microsoft",
    period: "Jun 2024",
  },
  {
    title: "Cloud Digital Leader",
    issuer: "Google Cloud",
    period: "Apr 2024 - Apr 2027",
  },
] as const;

const communityRoles = [
  {
    name: "Google Developer Group Davao",
    role: "Community Lead / L&D Lead",
    period: "Jul 2022 - Present",
    description:
      "Led the organizing team behind more than 10 in-person events over 2.5 years, bringing together 2,000-plus participants, around 25 speakers, around 25 partners and sponsors, and more than 50 volunteers. Helped grow the community from zero to 500-plus official members.",
  },
  {
    name: "Global Shapers Community",
    role: "Shaper, Davao Hub",
    period: "Jan 2026 - Present",
    description:
      "Member of the World Economic Forum-backed network of young leaders driving local impact through community projects.",
  },
] as const;

const speakingEvents: SpeakingEvent[] = [
  {
    meta: "Conference Talk",
    title: "Geeks On A Beach AI Show and Tell",
    description:
      "Spoke about configuring AI coding assistants with subagents, agent skills, and AGENTS.md.",
  },
  {
    meta: "Startup Community Event",
    title: "Maximizing Your AI Dream Team",
    description:
      "Talk on working with AI agents and modern engineering workflows.",
  },
  {
    meta: "Community Talk",
    title: "AWS User Group Davao",
    description: "Invited speaker.",
  },
  {
    meta: "Conference Presentation | Doha, Qatar",
    title: "ISNCC 2023",
    description: "Presented the AIComprehend research paper.",
  },
] as const;

const education = [
  {
    school: "University of the Philippines Diliman",
    degree: "BS Computer Engineering",
    period: "2019 - Jul 2024",
    points: [
      "Graduated summa cum laude with a 1.15 weighted average and finished in the Top 5 of the program.",
      "DOST-SEI Merit Scholar.",
      "Active in Google Developer Student Clubs UP Diliman and the UP Data Science Society.",
    ],
  },
  {
    school: "Philippine Science High School - Southern Mindanao Campus",
    degree: "High School Diploma, STEM",
    period: "Jun 2013 - May 2019",
    points: [
      "Graduated with High Honors.",
      "Received the DOST Youth Excellence in Science Medal and the Excellence Award in Computer Science.",
    ],
  },
] as const;

const notableAchievements: Achievement[] = [
  {
    meta: "IEEE | Published Nov 27, 2023",
    title:
      "AIComprehend: An Adaptive Reading Comprehension Learning Platform Using Machine Learning",
    description:
      "AIComprehend is a web-based application designed to enhance English reading comprehension through adaptive multiple-choice questions calibrated to varying difficulty levels. A four-week controlled study with 58 high school students showed a 13.9 percent improvement in test scores for the experimental group.",
    href: "https://ieeexplore.ieee.org/document/10323847",
  },
  {
    meta: "University of the Philippines Diliman | Jul 2024",
    title: "Summa Cum Laude",
    description:
      "Graduated summa cum laude in BS Computer Engineering and finished in the Top 5 of the program.",
  },
  {
    meta: "Apache Software Foundation | 2025",
    title: "Apache Airflow Open Source Contributor",
    description:
      "Contributed documentation updates covering Azure Blob Storage remote logging and Google Cloud Vertex AI operators.",
  },
] as const;

const externalLinkProps = {
  target: "_blank",
  rel: "noreferrer",
} as const;

const sectionClassName = "mx-auto w-full max-w-4xl px-6 py-16";
const cardClassName =
  "h-full min-w-0 rounded-xl border border-foreground/10 p-5 transition hover:border-foreground/25";
const nestedCardClassName = "rounded-xl border border-foreground/10 p-5";
const twoColumnGridClassName = "grid gap-4 md:grid-cols-2";

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-foreground/70">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-foreground/10 px-3 py-1 text-xs text-foreground/70">
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      <section
        className={`${sectionClassName} flex flex-col items-center justify-center py-24 text-center`}
      >
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Kyle Naranjo
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
          I build AI agents, data pipelines, and cloud infrastructure for enterprise
          clients and startups across financial services, investment management,
          education, and compliance.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {contactLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              {...(link.external ? externalLinkProps : {})}
              className="rounded-full border border-foreground/20 px-5 py-2 text-sm transition hover:bg-foreground/5"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      <section id="about" className={`${sectionClassName} scroll-mt-24`}>
        <SectionTitle title="About" />
        <div className="max-w-3xl space-y-4 text-base leading-relaxed text-foreground/70">
          <p>
            My work spans data pipelines, agentic AI, data warehousing, data
            modeling, MLOps, backend software engineering, and cloud
            infrastructure across multiple engagements.
          </p>
          <p>
            I also speak about generative AI, AI coding agents, and modern
            engineering workflows through technical talks and community events.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {focusAreas.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>
      </section>

      <section id="experience" className={`${sectionClassName} scroll-mt-24`}>
        <SectionTitle title="Professional Experience" />

        <article className={cardClassName}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h3 className="text-lg font-medium">Thinking Machines Data Science</h3>
              <p className="mt-1 text-sm text-foreground/60">
                Data Engineer II | Aug 2024 - Present
              </p>
            </div>
            <a
              href="https://thinkingmachin.es/"
              {...externalLinkProps}
              className="text-sm text-foreground/60 underline-offset-4 hover:underline"
            >
              thinkingmachin.es
            </a>
          </div>

          <div className="mt-4 space-y-4">
            {tmClientWork.map((clientWork) => (
              <section key={clientWork.client} className={nestedCardClassName}>
                <h4 className="text-lg font-medium">{clientWork.client}</h4>
                <div className="mt-4 space-y-4">
                  {clientWork.engagements.map((engagement, index) => (
                    <div
                      key={`${clientWork.client}-${engagement.name}`}
                      className={index === 0 ? "" : "border-t border-foreground/10 pt-4"}
                    >
                      <p className="text-sm text-foreground/60">{engagement.name}</p>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/70">
                        {engagement.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {engagement.stack.map((item) => (
                          <Tag key={item}>{item}</Tag>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className={`mt-4 ${nestedCardClassName}`}>
            <h4 className="text-lg font-medium">Internal Contributions</h4>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/70">
              {tmInternalContributions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </article>

        <div className="mt-4 space-y-4">
          {otherExperience.map((experience) => (
            <article key={experience.company} className={cardClassName}>
              <h3 className="text-lg font-medium">{experience.company}</h3>
              <div className="mt-4 space-y-4">
                {experience.roles.map((role, index) => (
                  <div
                    key={`${experience.company}-${role.title}-${role.period}`}
                    className={index === 0 ? "" : "border-t border-foreground/10 pt-4"}
                  >
                    <p className="text-sm text-foreground/60">
                      {role.title} | {role.period}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="skills" className={`${sectionClassName} scroll-mt-24`}>
        <SectionTitle title="Technical Skills" />
        <div className={twoColumnGridClassName}>
          {skillGroups.map((group) => (
            <article key={group.title} className={cardClassName}>
              <h3 className="text-lg font-medium">{group.title}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="certifications"
        className={`${sectionClassName} scroll-mt-24`}
      >
        <SectionTitle title="Certifications" />
        <div className={twoColumnGridClassName}>
          {certifications.map((certification) => (
            <article
              key={`${certification.issuer}-${certification.title}`}
              className={cardClassName}
            >
              <h3 className="text-lg font-medium">{certification.title}</h3>
              <p className="mt-1 text-sm text-foreground/60">
                {certification.issuer}
              </p>
              <p className="mt-3 text-sm text-foreground/70">
                {certification.period}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="community" className={`${sectionClassName} scroll-mt-24`}>
        <SectionTitle title="Community Engagements" />
        <div className={twoColumnGridClassName}>
          {communityRoles.map((role) => (
            <article
              key={`${role.name}-${role.role}`}
              className={cardClassName}
            >
              <h3 className="text-lg font-medium">{role.name}</h3>
              <p className="mt-1 text-sm text-foreground/60">
                {role.role} | {role.period}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                {role.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium">Speaking</h3>
          <div className={`mt-4 ${twoColumnGridClassName}`}>
            {speakingEvents.map((event) => (
              <article key={event.title} className={cardClassName}>
                <p className="text-sm text-foreground/60">{event.meta}</p>
                <h4 className="mt-2 text-lg font-medium">{event.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                  {event.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <SectionTitle title="Education" />
        <div className="space-y-4">
          {education.map((item) => (
            <article key={item.school} className={cardClassName}>
              <h3 className="text-lg font-medium">{item.school}</h3>
              <p className="mt-1 text-sm text-foreground/60">
                {item.degree} | {item.period}
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/70">
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={sectionClassName}>
        <SectionTitle title="Notable Achievements" />
        <div className="space-y-4">
          {notableAchievements.map((achievement) => (
            <article key={achievement.title} className={cardClassName}>
              <p className="text-sm text-foreground/60">{achievement.meta}</p>
              <h3 className="mt-3 text-lg font-medium">{achievement.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                {achievement.description}
              </p>
              {achievement.href ? (
                <a
                  href={achievement.href}
                  {...externalLinkProps}
                  className="mt-4 inline-block text-sm text-foreground/70 underline-offset-4 hover:underline"
                >
                  View IEEE paper
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-foreground/40">
        &copy; {new Date().getFullYear()} Kyle Naranjo
      </footer>
    </main>
  );
}
