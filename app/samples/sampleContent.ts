// SINGLE SOURCE OF TRUTH for the live portfolio content. Ported losslessly from
// the real résumé (app/page.tsx). Clients are ANONYMIZED; every metric, date,
// and credential is EXACT — do not round or paraphrase numbers.
//
// IMPORTANT: factual phrases here are written in the SYMBOLIC style ("~15 million
// records", ">99.9% accuracy", "over 4 hours") so the selective-bold pass in
// helpers.tsx (EMPH) can match them. If you reword a metric, update EMPH too.

// Bank Single Customer View outcome — referenced by Experience (the bank client
// card) and by the Hero V2 proof panel, so it lives once here.
const SCV_METRICS = [
  { value: "15M → 7M", label: "records consolidated to unique customer keys" },
  { value: "748,000", label: "duplicate pairs surfaced by record linkage" },
  { value: ">99.9%", label: "five-tier confidence accuracy" },
  { value: "4h → <1h", label: "pipeline runtime" },
] as const;

export const sample = {
  name: "Kyle Naranjo",
  wordmark: "Kyle Naranjo",
  role: "Data Engineer II",
  company: "Thinking Machines Data Science",
  companyUrl: "https://thinkingmachin.es/",
  cvUrl: "/Kyle-Naranjo-CV.pdf",

  // In-page anchors; each id is set by the matching section on the landing page.
  nav: [
    { label: "Experience", href: "#experience" },
    { label: "Skills", href: "#skills" },
    { label: "Writing", href: "#writing" },
    { label: "Community", href: "#community" },
  ],

  hero: {
    eyebrow: "DATA & AI INFRASTRUCTURE",
    headline: "I build the data and AI infrastructure enterprises run on.",
    subhead:
      "Data Engineer II at Thinking Machines Data Science — pipelines, agentic AI, MLOps, and cloud infrastructure for financial services, investment management, education, and compliance.",
    primaryCta: { label: "Get in Touch", href: "mailto:kyle.naranjo@gmail.com" },
  },

  // Web contacts (each has a brand/UI icon). Phone is kept for completeness but
  // surfaced only on the downloadable CV, not the icon'd contact row.
  contacts: [
    { label: "Email", href: "mailto:kyle.naranjo@gmail.com", value: "kyle.naranjo@gmail.com" },
    { label: "LinkedIn", href: "https://linkedin.com/in/kyle-naranjo", value: "linkedin.com/in/kyle-naranjo" },
    { label: "GitHub", href: "https://github.com/teslakoile", value: "github.com/teslakoile" },
  ],
  phone: { value: "+63 906 561 4027", href: "tel:+639065614027" },

  about: [
    "My work spans data pipelines, agentic AI, data warehousing, data modeling, MLOps, backend software engineering, and cloud infrastructure across multiple enterprise engagements.",
    "I also speak about generative AI, AI coding agents, and modern engineering workflows through technical talks and community events.",
  ],
  focusAreas: [
    "Data Engineering",
    "AI Infrastructure",
    "GenAI",
    "Agentic AI",
    "MLOps",
    "Data Pipelines",
    "Data Warehousing",
    "Backend Engineering",
    "Cloud Infrastructure",
  ],

  experience: {
    current: {
      company: "Thinking Machines Data Science",
      companyUrl: "https://thinkingmachin.es/",
      role: "Data Engineer II",
      period: "Aug 2024 – Present",
      summary:
        "Builds production data and AI infrastructure for enterprise clients across financial services, investment management, education, and compliance.",
      // Each anonymized client is one card; the bank carries the outcome strip.
      clients: [
        {
          client: "A large Singaporean investment holding company",
          engagements: [
            {
              name: "Investment Data Platform",
              points: [
                "Owned backend feature development across 10+ interconnected microservices powering deal discovery, due diligence, and portfolio monitoring workflows.",
                "Built backend services and data pipelines with FastAPI, Dagster, Kubernetes, and Snowflake, processing terabytes of vendor data from Sustainalytics, PitchBook, Bloomberg, and MSCI.",
                "Improved platform reliability and observability through production monitoring on Kibana and Grafana.",
              ],
              stack: ["FastAPI", "Dagster", "Snowflake", "PostgreSQL", "SQLAlchemy", "Pydantic", "Kubernetes", "Kibana", "Grafana"],
            },
            {
              name: "Enterprise Document Intelligence Platform",
              points: [
                "Iterated on Snowflake Cortex AI agent workflows with the Knowledge Graph team so investment officers could extract data from long-form documents, run contextual queries, and analyze portfolios at scale.",
                "Owned agent tooling, prompt engineering, evaluation, workflow tuning, and production incident triage across the document-intelligence stack.",
                "Partnered with a ~15-person cross-functional team spanning frontend, backend, LLM workflows, MLOps, DevOps, and QA.",
              ],
              stack: ["FastAPI", "Snowflake", "Snowflake Cortex", "OpenAI API", "Kubernetes", "Azure DevOps"],
            },
          ],
        },
        {
          client: "A major Philippine bank",
          metrics: SCV_METRICS,
          engagements: [
            {
              name: "Enterprise Data Products",
              points: [
                "Led the data products workstream in a year-long engagement, partnering with C-suite leaders, directors, and business units to define and ship priority data products on Azure Databricks.",
                "Designed and productionized a daily Single Customer View pipeline consolidating ~15 million records from four enterprise systems into ~7 million unique customer keys used across 10+ business units.",
                "Built a probabilistic record-linkage engine with Splink that surfaced 748,000 candidate duplicate pairs missed by exact matching, with a five-tier confidence framework validated at >99.9% accuracy.",
                "Cut Single Customer View runtime from over 4 hours to under 1 hour and co-designed a Next Best Product pipeline covering 12 product types and four customer segments.",
              ],
              stack: ["Azure Databricks", "PySpark", "SQL", "Splink", "Delta Lake"],
            },
          ],
        },
        {
          client: "A Philippine education enterprise",
          engagements: [
            {
              name: "Student-at-Risk Prediction Platform",
              points: [
                "Spearheaded the infrastructure and ingestion workstream for a student-at-risk prediction platform on Azure Databricks.",
                "Provisioned platform infrastructure with Terraform, built API ingestion across three source systems, and migrated Excel-based linear-regression models into production Databricks jobs.",
                "Accelerated delivery by integrating AI coding agents into the workflow with custom agent skills, hooks, and command layers.",
              ],
              stack: ["Azure Databricks", "Terraform", "Python", "SQL"],
            },
          ],
        },
        {
          client: "A large Singaporean enterprise",
          engagements: [
            {
              name: "Data Ingestion and Transformation",
              points: [
                "Led the ingestion and transformation workstream, building end-to-end pipelines from four source systems in SQL Server and MongoDB into BigQuery.",
                "Designed surrogate-key strategies to resolve identifier collisions between member and visitor systems and modeled production reporting tables for attendance analytics.",
                "Resolved memory failures in legacy Airflow DAGs with chunked CSV processing before production rollout.",
              ],
              stack: ["BigQuery", "Cloud Composer", "Airflow", "Dataform", "SQL", "MongoDB"],
            },
          ],
        },
        {
          client: "A Philippine airline",
          engagements: [
            {
              name: "Enablement Curriculum Design",
              points: [
                "Designed and delivered a six-course enablement curriculum covering Python and Power BI from beginner to advanced in four days.",
              ],
              stack: ["Python", "Power BI", "Curriculum Design"],
            },
          ],
        },
      ],
      internal: [
        "Authored a standardized data-ingestion scoping framework RFC for the engineering consulting team.",
        "Created post-exam study guides that supported certification prep across the company.",
        "Built a proof-of-concept integration connecting ChatGPT to Databricks through an MCP server.",
      ],
    },
    past: [
      {
        company: "Ingenuity Software",
        roles: [
          {
            title: "Backend Software Engineer",
            period: "Jan 2022 – Jul 2024",
            description:
              "Built the backend of a compliance case-management platform on Django, deployed across two AWS regions with separate databases for data residency and GDPR. Decomposed the monolith into cross-region services and shipped ~50 production API endpoints supporting 100+ reports per day.",
            stack: ["Django", "Python", "AWS", "PostgreSQL"],
          },
          {
            title: "Software Engineer (Part-time)",
            period: "Jan 2022 – Sep 2022",
            description:
              "Built a Google Cloud data-processing pipeline for a COVID-19 contact-tracing and vaccination-tracking application and led a two-week data science internship for eight participants.",
            stack: ["GCP", "Python"],
          },
        ],
      },
      {
        company: "UP Diliman EEEEI",
        roles: [
          {
            title: "Research Associate",
            period: "Aug 2022 – Nov 2023",
            description:
              "Co-authored and published the IEEE AIComprehend paper, then built and deployed the full-stack Django application used in a month-long controlled study that showed a 13.9% improvement in student test scores.",
            stack: ["Python", "Django", "Keras"],
          },
        ],
      },
      {
        company: "GCash",
        roles: [
          {
            title: "Technology and Operations Intern",
            period: "Jun 2022 – Aug 2022",
            description:
              "Modeled and transformed production datasets into Looker Studio dashboards used by the Technology and Operations team to track a 300-plus participant developer program.",
            stack: ["Looker Studio", "SQL"],
          },
        ],
      },
    ],
  },

  // Bank Single Customer View outcome — kept top-level for the Hero V2 proof
  // panel; the Experience bank card reads its own client.metrics (same data).
  outcome: {
    client: "A major Philippine bank",
    label: "Single Customer View · outcome",
    metrics: SCV_METRICS,
    stack: ["Azure Databricks", "PySpark", "Splink", "Delta Lake", "SQL"],
  },

  // Each domain card carries BOTH `general` (concepts/methods, no logos → outlined
  // chips) and `tools` (specific tooling with verified brand logos). `general` may
  // be empty. Keep concepts in `general` and concrete tools in `tools`.
  skills: [
    {
      title: "Data Engineering",
      blurb: "Warehouses, lakehouses, and orchestration — moving and modeling data at enterprise scale.",
      general: ["Data Modeling", "Data Warehousing", "Data Pipelines", "ETL / ELT", "Record Linkage"],
      tools: ["Databricks", "Snowflake", "BigQuery", "PostgreSQL", "MongoDB", "PySpark", "Pandas", "Airflow", "Dagster", "dbt", "Dataform", "Azure Data Factory", "AWS Glue", "Dataflow"],
    },
    {
      title: "AI & Machine Learning",
      blurb: "Agentic systems, RAG, and probabilistic matching — prototype to production.",
      general: ["RAG", "Embeddings", "Document Extraction", "LLM Evals", "Prompt Engineering", "Computer Vision", "NLP", "AI Agents", "MLOps"],
      tools: ["OpenAI API", "Vertex AI", "Azure AI Services", "Snowflake Cortex", "LangChain", "Keras", "TensorFlow", "Splink"],
    },
    {
      title: "Cloud & Infrastructure",
      blurb: "Containerized, infrastructure-as-code deployments across AWS, Azure, and GCP.",
      general: ["CI/CD", "Infrastructure as Code", "IAM", "Networking"],
      tools: ["AWS", "Azure", "GCP", "Docker", "Terraform", "Kubernetes"],
    },
    {
      title: "Backend",
      blurb: "APIs and services behind enterprise platforms — FastAPI and Django at multi-region scale.",
      general: ["REST APIs", "Microservices"],
      tools: ["FastAPI", "Django", "Flask", "SQLAlchemy", "Pydantic"],
    },
    {
      title: "Languages",
      blurb: "The core languages behind production data systems, pipelines, and services.",
      general: [] as string[],
      tools: ["Python", "SQL", "JavaScript", "Java", "C++", "Bash"],
    },
    {
      title: "Developer Tools",
      blurb: "AI-assisted development and the collaboration stack that ships it.",
      general: ["AI-Assisted Development", "Agentic Workflows"],
      tools: ["Cursor", "Claude Code", "Codex CLI", "GitHub", "Azure DevOps", "Git", "Bitbucket", "Jira", "Confluence", "Postman", "Jenkins"],
    },
  ],

  // logo = a verified brand-logo key in /public/logos, or "" for a text monogram
  // fallback (no unverified marks). url = public credential link ("#" until set).
  // mono = the monogram shown when logo is "".
  certifications: [
    {
      issuer: "OpenAI", logo: "openai", mono: "OpenAI", url: "#",
      title: "AI Technical Practitioner",
      blurb: "Applying OpenAI models and tooling to build production AI solutions.",
      issued: "Mar 2026", expires: null as string | null,
    },
    {
      issuer: "Google Cloud", logo: "googlecloud", mono: "", url: "#",
      title: "Professional Machine Learning Engineer",
      blurb: "Designing, training, and productionizing ML models and pipelines on Google Cloud.",
      issued: "Jul 2025", expires: "Jul 2027",
    },
    {
      issuer: "Databricks", logo: "databricks", mono: "", url: "#",
      title: "Certified Data Engineer Associate",
      blurb: "Building and operating production data pipelines on the Databricks Lakehouse.",
      issued: "Dec 2025", expires: "Dec 2027",
    },
    {
      issuer: "Microsoft", logo: "azure", mono: "", url: "#",
      title: "Azure AI Engineer Associate",
      blurb: "Building, deploying, and managing AI and generative-AI solutions on Azure.",
      issued: "May 2025", expires: "May 2026",
    },
    {
      issuer: "Google Cloud", logo: "googlecloud", mono: "", url: "#",
      title: "Generative AI Leader",
      blurb: "Driving generative-AI strategy, use-cases, and adoption across an organization.",
      issued: "Oct 2025", expires: "Oct 2028",
    },
    {
      issuer: "Google Cloud", logo: "googlecloud", mono: "", url: "#",
      title: "AI/ML Pre-Sales Technical Expert",
      blurb: "Scoping and positioning AI and ML solutions in a pre-sales technical role.",
      issued: "Dec 2025", expires: null as string | null,
    },
    {
      issuer: "Astronomer", logo: "airflow", mono: "", url: "#",
      title: "Airflow 3 Fundamentals",
      blurb: "Authoring and orchestrating data workflows with Apache Airflow 3.",
      issued: "Jul 2025", expires: null as string | null,
    },
    {
      issuer: "Amazon Web Services", logo: "aws", mono: "", url: "#",
      title: "Certified Cloud Practitioner",
      blurb: "Foundational fluency across AWS services, security, architecture, and pricing.",
      issued: "Mar 2024", expires: "Mar 2027",
    },
    {
      issuer: "Microsoft", logo: "azure", mono: "", url: "#",
      title: "Azure Fundamentals",
      blurb: "Core Azure cloud concepts, services, security, and governance.",
      issued: "Jun 2024", expires: null as string | null,
    },
    {
      issuer: "Google Cloud", logo: "googlecloud", mono: "", url: "#",
      title: "Cloud Digital Leader",
      blurb: "Core Google Cloud products, services, and their business value.",
      issued: "Apr 2024", expires: "Apr 2027",
    },
  ],

  community: [
    {
      name: "Google Developer Group Davao",
      role: "Community Lead / L&D Lead",
      period: "Jul 2022 – Present",
      // Real org mark in /public/logos (official Google Developers "<>" icon, SVG).
      logo: "/logos/gdg.svg",
      // Official chapter page on the GDG community platform.
      url: "https://gdg.community.dev/gdg-davao/",
      description:
        "Led the organizing team behind 10+ in-person events over 2.5 years, bringing together 2,000-plus participants, ~25 speakers, ~25 partners and sponsors, and 50+ volunteers — growing the community from zero to 500-plus official members.",
      // `stats` are the headline impact figures pulled from `description`,
      // surfaced as a KPI strip in the Community "impact ledger" exploration.
      // Figures are EXACT — keep in sync with the description prose.
      stats: [
        { fig: "10+", label: "Events" },
        { fig: "2,000+", label: "Participants" },
        { fig: "500+", label: "Members" },
        { fig: "50+", label: "Volunteers" },
      ],
    },
    {
      name: "Global Shapers Community",
      role: "Shaper, Davao Hub",
      period: "Jan 2026 – Present",
      // PLACEHOLDER mark (neutral globe) — swap for the official Global Shapers
      // logo when available (drop it at /public/logos/global-shapers.svg).
      logo: "/logos/global-shapers.svg",
      url: "https://www.globalshapers.org/hubs/davao-hub/",
      description:
        "Member of the World Economic Forum-backed network of young leaders driving local impact through community projects.",
    },
  ],

  // Each talk carries `tags` (topic/format chips) and an optional `link` to a
  // write-up / recording (null when none exists yet). `meta` is retained for the
  // earlier exploration pages; newer designs read `tags` + `link` instead.
  speaking: [
    {
      meta: "Conference Talk",
      title: "Geeks On A Beach — AI Show and Tell",
      description: "Configuring AI coding assistants with subagents, agent skills, and AGENTS.md.",
      tags: ["Conference", "AI Agents", "Dev Tools"],
      link: null as string | null,
    },
    {
      meta: "Startup Community Event",
      title: "Maximizing Your AI Dream Team",
      description: "Working with AI agents and modern engineering workflows.",
      tags: ["Startup Event", "AI Agents"],
      link: null as string | null,
    },
    {
      meta: "Community Talk",
      title: "AWS User Group Davao",
      description: "Invited speaker on cloud and data engineering.",
      tags: ["Community", "Cloud", "Data Engineering"],
      link: null as string | null,
    },
    {
      meta: "Conference · Doha, Qatar",
      title: "ISNCC 2023",
      description: "Presented the AIComprehend research paper.",
      tags: ["Conference", "Research", "Doha, Qatar"],
      link: "https://ieeexplore.ieee.org/document/10323847",
    },
  ],

  education: [
    {
      school: "University of the Philippines Diliman",
      degree: "BS Computer Engineering",
      period: "2019 – 2024",
      // Real institution mark in /public/logos (official seal, transparent PNG).
      logo: "/logos/up-diliman.png",
      // `highlights` are short honour chips derived from `points`; optional per
      // school. Kept here so the Education explorations read them as imported,
      // type-checked data instead of a hardcoded lookup keyed by school name.
      highlights: [
        "Summa Cum Laude",
        "1.15 Weighted Avg",
        "Top 5",
        "DOST-SEI Merit Scholar",
      ],
      points: [
        "Graduated summa cum laude with a 1.15 weighted average, finishing in the Top 5 of the program.",
        "DOST-SEI Merit Scholar.",
        "Active in Google Developer Student Clubs UP Diliman and the UP Data Science Society.",
      ],
    },
    {
      school: "Philippine Science High School – Southern Mindanao",
      degree: "High School Diploma, STEM",
      period: "2013 – 2019",
      logo: "/logos/pshs.png",
      highlights: [
        "High Honors",
        "DOST Youth Excellence",
        "Excellence in CS",
      ],
      points: [
        "Graduated with High Honors.",
        "DOST Youth Excellence in Science Medal and the Excellence Award in Computer Science.",
      ],
    },
  ],

  // GitHub identity for the contributions-graph section on the landing page.
  github: {
    user: "teslakoile",
    url: "https://github.com/teslakoile",
  },

  // Handpicked resources — books, guides, and tools Kyle actually points people
  // to. STARTER LIST seeded from his own work (Splink in production, an MCP
  // server PoC, talks on AI coding agents); EDIT FREELY — this is the one
  // section meant to be curated by hand, in your own voice.
  // `image` is a LOCAL thumbnail under public/resources/ (the DDIA cover from
  // Open Library; site favicons / GitHub avatars for the rest) so the
  // imagery-led treatments never make runtime requests.
  resources: [
    {
      kind: "Book",
      title: "Designing Data-Intensive Applications",
      source: "Martin Kleppmann",
      note: "Still the canonical map of the data-systems territory. The chapter on partitioning pays for the whole book.",
      url: "https://dataintensive.net/",
      image: "/resources/ddia.jpg",
    },
    {
      kind: "Guide",
      title: "Building Effective Agents",
      source: "Anthropic",
      note: "The clearest writing on when you need an agent and when a workflow is enough.",
      url: "https://www.anthropic.com/research/building-effective-agents",
      image: "/resources/building-effective-agents.png",
    },
    {
      kind: "Spec",
      title: "Model Context Protocol",
      source: "modelcontextprotocol.io",
      note: "The protocol behind my ChatGPT-to-Databricks proof of concept. Read the spec before wrapping another API.",
      url: "https://modelcontextprotocol.io/",
      image: "/resources/mcp.png",
    },
    {
      kind: "Library",
      title: "Splink",
      source: "MoJ Analytical Services",
      note: "Probabilistic record linkage at scale. This is the engine behind the 748,000 duplicate pairs story.",
      url: "https://moj-analytical-services.github.io/splink/",
      image: "/resources/splink.png",
    },
    {
      kind: "Blog",
      title: "Simon Willison's Weblog",
      source: "simonwillison.net",
      note: "The most consistently grounded coverage of LLMs and coding agents anywhere.",
      url: "https://simonwillison.net/",
      image: "/resources/simonwillison.jpg",
    },
  ],

  // ⚠️ MOCK DATA — layout preview only, per Kyle's request. Every entry below is
  // INVENTED so the section has realistic shape; REPLACE with real quotes (e.g.
  // LinkedIn recommendations, ported verbatim with the recommender's real name
  // and title) BEFORE deploying. Delete all entries to hide the section.
  // `avatar` is an optional local headshot under public/recs/ (square, ≥160px);
  // while it's null the treatments render an initials chip. The mock names are
  // distinct (Ana/Ben/Cara) so the derived monograms don't collide.
  recommendations: [
    {
      quote:
        "Kyle took the messiest part of our data platform and turned it into the most dependable one. He communicates like a consultant and ships like a senior engineer.",
      name: "Mock Reviewer Ana",
      title: "Engineering Manager · placeholder",
      avatar: null,
    },
    {
      quote:
        "The rare engineer who is equally at home in a C-suite steering meeting and a 2 a.m. pipeline incident. His record-linkage work changed how our bank sees its customers.",
      name: "Mock Reviewer Ben",
      title: "Data Platform Lead · placeholder",
      avatar: null,
    },
    {
      quote:
        "Every team Kyle touches gets faster. He automates the boring parts, documents the sharp edges, and leaves the codebase better than he found it.",
      name: "Mock Reviewer Cara",
      title: "Product Director · placeholder",
      avatar: null,
    },
  ] as ReadonlyArray<{
    quote: string;
    name: string;
    title: string;
    avatar?: string | null;
  }>,

  // FLAGSHIP SECTION. Seeded from the engagements above (clients stay
  // anonymized, numbers are EXACT — same rules as `experience`) plus the two
  // fully-owned works (AIComprehend, the MCP PoC). `flagship` marks the lead
  // sheet on the landing; `featured` picks the landing companions; /projects
  // renders every entry. Curate freely — summaries are prose retellings of the
  // engagement points, safe to edit.
  projects: [
    {
      slug: "single-customer-view",
      flagship: true,
      featured: true,
      title: "Single Customer View",
      client: "A major Philippine bank",
      period: "2024 – 2025",
      status: "In Production",
      oneLiner:
        "A daily pipeline that tells a bank who its ~15 million records actually are.",
      summary: [
        "A year-long engagement with a major Philippine bank, partnering with C-suite leaders and business units to ship priority data products on Azure Databricks. The centerpiece is a daily Single Customer View pipeline consolidating ~15 million records from four enterprise systems into ~7 million unique customer keys used across 10+ business units.",
        "Exact matching misses people. A probabilistic record-linkage engine built with Splink surfaced 748,000 candidate duplicate pairs the exact-match logic could not see, scored through a five-tier confidence framework validated at >99.9% accuracy — while pipeline runtime dropped from over 4 hours to under 1 hour.",
      ],
      stack: ["Azure Databricks", "PySpark", "SQL", "Splink", "Delta Lake"],
      metrics: SCV_METRICS,
      links: [] as ReadonlyArray<{ label: string; href: string }>,
    },
    {
      slug: "investment-data-platform",
      featured: true,
      title: "Investment Data Platform",
      client: "A large Singaporean investment holding company",
      period: "Aug 2024 – Present",
      status: "In Production",
      oneLiner:
        "Backend services and pipelines behind deal discovery, due diligence, and portfolio monitoring.",
      summary: [
        "Owned backend feature development across 10+ interconnected microservices powering deal discovery, due diligence, and portfolio monitoring workflows for a large Singaporean investment holding company.",
        "The platform processes terabytes of vendor data from Sustainalytics, PitchBook, Bloomberg, and MSCI through FastAPI services and Dagster pipelines on Kubernetes, landing in Snowflake — with reliability and observability handled through production monitoring on Kibana and Grafana.",
      ],
      stack: ["FastAPI", "Dagster", "Snowflake", "Kubernetes", "PostgreSQL"],
      metrics: [
        { value: "10+", label: "interconnected microservices" },
        { value: "4", label: "vendor data feeds processed" },
      ],
      links: [] as ReadonlyArray<{ label: string; href: string }>,
    },
    {
      slug: "document-intelligence",
      title: "Enterprise Document Intelligence Platform",
      client: "A large Singaporean investment holding company",
      period: "2025 – Present",
      status: "In Production",
      oneLiner:
        "Agent workflows that let investment officers query long-form documents at scale.",
      summary: [
        "Iterated on Snowflake Cortex AI agent workflows with the Knowledge Graph team so investment officers could extract data from long-form documents, run contextual queries, and analyze portfolios at scale.",
        "Owned agent tooling, prompt engineering, evaluation, workflow tuning, and production incident triage across the document-intelligence stack, partnering with a ~15-person cross-functional team spanning frontend, backend, LLM workflows, MLOps, DevOps, and QA.",
      ],
      stack: ["Snowflake Cortex", "OpenAI API", "FastAPI", "Kubernetes"],
      metrics: [
        { value: "~15", label: "person cross-functional team" },
      ],
      links: [] as ReadonlyArray<{ label: string; href: string }>,
    },
    {
      slug: "student-at-risk",
      title: "Student-at-Risk Prediction Platform",
      client: "A Philippine education enterprise",
      period: "2025",
      status: "Delivered",
      oneLiner:
        "Infrastructure and ingestion for a prediction platform that flags students before they slip.",
      summary: [
        "Spearheaded the infrastructure and ingestion workstream for a student-at-risk prediction platform on Azure Databricks: platform infrastructure provisioned with Terraform, API ingestion built across three source systems, and Excel-based linear-regression models migrated into production Databricks jobs.",
        "Delivery was accelerated by integrating AI coding agents into the workflow with custom agent skills, hooks, and command layers.",
      ],
      stack: ["Azure Databricks", "Terraform", "Python", "SQL"],
      metrics: [
        { value: "3", label: "source systems ingested via API" },
      ],
      links: [] as ReadonlyArray<{ label: string; href: string }>,
    },
    {
      slug: "mcp-databricks",
      featured: true,
      title: "ChatGPT-to-Databricks MCP Server",
      client: "Thinking Machines · internal",
      period: "2025",
      status: "Proof of Concept",
      oneLiner:
        "An MCP server that lets a chat assistant query a governed lakehouse directly.",
      summary: [
        "A proof-of-concept integration connecting ChatGPT to Databricks through a Model Context Protocol server — the experiment behind the MCP spec's place in the resources list.",
        "The PoC demonstrated a governed path from a conversational assistant to warehouse queries without another one-off API wrapper, and now feeds Kyle's talks on agentic workflows.",
      ],
      stack: ["Python", "MCP", "Databricks"],
      metrics: [] as ReadonlyArray<{ value: string; label: string }>,
      links: [
        { label: "MCP Spec", href: "https://modelcontextprotocol.io/" },
      ] as ReadonlyArray<{ label: string; href: string }>,
    },
    {
      slug: "aicomprehend",
      featured: true,
      title: "AIComprehend",
      client: "UP Diliman EEEEI",
      period: "2022 – 2023",
      status: "Published",
      oneLiner:
        "An adaptive reading-comprehension platform, validated in a controlled study and published in IEEE.",
      summary: [
        "Co-authored and published the IEEE AIComprehend paper, then built and deployed the full-stack Django application used in the study itself.",
        "A four-week controlled study with 58 high school students showed a 13.9% improvement in test scores — research that started the thread running through the rest of this list.",
      ],
      stack: ["Django", "Python", "Keras"],
      metrics: [
        { value: "13.9%", label: "test-score improvement" },
        { value: "58", label: "students in the controlled study" },
        { value: "4 wk", label: "study duration" },
      ],
      links: [
        { label: "IEEE Paper", href: "https://ieeexplore.ieee.org/document/10323847" },
      ] as ReadonlyArray<{ label: string; href: string }>,
    },
  ] as ReadonlyArray<{
    slug: string;
    flagship?: boolean;
    featured?: boolean;
    title: string;
    client: string;
    period: string;
    status: string;
    oneLiner: string;
    summary: ReadonlyArray<string>;
    stack: ReadonlyArray<string>;
    metrics: ReadonlyArray<{ value: string; label: string }>;
    links: ReadonlyArray<{ label: string; href: string }>;
  }>,

  achievements: [
    {
      meta: "IEEE · Published Nov 27, 2023",
      title: "AIComprehend",
      desc: "Co-authored an adaptive reading-comprehension platform; a four-week controlled study with 58 high school students showed a 13.9% improvement in test scores.",
      href: "https://ieeexplore.ieee.org/document/10323847",
    },
    {
      meta: "University of the Philippines Diliman · Jul 2024",
      title: "Summa Cum Laude",
      desc: "Graduated summa cum laude in BS Computer Engineering with a 1.15 weighted average, finishing in the Top 5 of the program.",
    },
    {
      meta: "Apache Software Foundation · 2025",
      title: "Apache Airflow Open Source Contributor",
      desc: "Contributed documentation covering Azure Blob Storage remote logging and Google Cloud Vertex AI operators.",
    },
  ],

  blog: {
    eyebrow: "WRITING",
    // Each post may carry a real thumbnail `image`; when null the card falls back
    // to a built-in concept figure. `href` is the published post URL — null while
    // the explainer is still being written (the card then shows a quiet
    // "coming soon" note instead of a dead link).
    posts: [
      {
        topic: "Record Linkage",
        date: "2026-05-12",
        readTime: "9 min read",
        tags: ["Record Linkage", "Splink", "Data Quality", "PySpark"],
        title: "Why Exact Matching Misses 748,000 Duplicates",
        dek: "Drag a match-weight threshold and watch duplicate record clusters merge in real time — the same probabilistic linkage that rebuilt a bank's Single Customer View.",
        image: "/writing/record-linkage.png" as string | null,
        href: null as string | null,
      },
      {
        topic: "AI Agents",
        date: "2026-03-04",
        readTime: "6 min read",
        tags: ["MCP", "AI Agents", "Databricks", "Proof of Concept"],
        title: "Wiring ChatGPT to Databricks through an MCP server",
        dek: "A proof-of-concept Model Context Protocol server that lets ChatGPT query and operate a Databricks workspace through a set of typed tools.",
        image: "/writing/mcp.png" as string | null,
        href: null as string | null,
      },
    ],
  },
} as const;

export type SampleContent = typeof sample;
