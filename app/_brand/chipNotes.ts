/**
 * The hover note for a chip: a title (the chip's own name) and a one-line
 * description of what the tool or area is. These describe the tool in
 * general and say nothing about Kyle's work, so they need no sourcing from
 * sampleContent.ts. Add an entry here when a new chip appears on the page; a
 * chip with no entry simply has no note.
 */

import { bare } from "./format";

const INFO: Record<string, string> = {
  // data engineering
  Databricks: "A unified analytics platform for data engineering and machine learning, built on Apache Spark.",
  "Azure Databricks": "Databricks as a managed service on Microsoft Azure.",
  Snowflake: "A cloud data warehouse that separates storage from compute.",
  BigQuery: "Google Cloud's serverless data warehouse for SQL analytics at scale.",
  PostgreSQL: "An open-source relational database known for reliability and standards-compliant SQL.",
  MongoDB: "A document database that stores data as flexible JSON-like records.",
  PySpark: "The Python API for Apache Spark, for processing large datasets in parallel.",
  Pandas: "A Python library for working with tabular data in memory.",
  Airflow: "An open-source platform for authoring and scheduling data workflows as code.",
  Dagster: "An orchestrator for data pipelines, built around the data assets they produce.",
  dbt: "A tool for transforming data in the warehouse with SQL models, tests, and docs.",
  Dataform: "A Google Cloud service for managing SQL transformations in BigQuery.",
  "Azure Data Factory": "Microsoft Azure's managed service for building and scheduling data pipelines.",
  "AWS Glue": "AWS's serverless service for data integration and ETL jobs.",
  Dataflow: "Google Cloud's managed service for batch and streaming pipelines built on Apache Beam.",
  "Delta Lake": "An open storage layer that adds ACID transactions to data lakes.",
  "Looker Studio": "Google's free tool for building dashboards and reports from data sources.",

  // AI and machine learning
  "OpenAI API": "OpenAI's API for calling its language, vision, and speech models.",
  "Vertex AI": "Google Cloud's platform for building, deploying, and serving machine learning and generative AI models.",
  "Azure AI Foundry": "Microsoft Azure's platform for building and managing AI applications and agents.",
  "Snowflake Cortex": "Snowflake's managed AI services for running LLM functions and agents on warehouse data.",
  LangChain: "A framework for building applications and agents around language models.",
  Keras: "A high-level Python API for building and training neural networks.",
  TensorFlow: "An open-source machine learning framework from Google.",
  Splink: "An open-source Python library for probabilistic record linkage and deduplication.",
  "Google ADK": "Google's Agent Development Kit, a framework for building and deploying AI agents.",
  Gemini: "Google's family of multimodal AI models.",
  MCP: "The Model Context Protocol, an open standard for connecting AI assistants to tools and data.",

  // cloud and infrastructure
  AWS: "Amazon's cloud platform for compute, storage, and managed services.",
  Azure: "Microsoft's cloud platform for compute, storage, and managed services.",
  GCP: "Google's cloud platform for compute, storage, data, and AI services.",
  Docker: "A tool for packaging applications and their dependencies into containers.",
  Terraform: "An infrastructure-as-code tool for provisioning cloud resources from declarative configuration.",
  Kubernetes: "An open-source system for deploying and scaling containerized applications.",
  "Cloud Run": "Google Cloud's service for running containers without managing servers.",

  // backend and web
  FastAPI: "A Python web framework for building typed, high-performance APIs.",
  Django: "A batteries-included Python web framework.",
  Flask: "A lightweight Python web framework for small services and APIs.",
  SQLAlchemy: "A Python SQL toolkit and object-relational mapper.",
  Pydantic: "A Python library for data validation and settings, driven by type hints.",
  Firebase: "Google's app platform with a database, authentication, and hosting.",
  React: "A JavaScript library for building user interfaces from components.",
  "Next.js": "A React framework for server-rendered and static web apps.",
  Unity: "A game engine for building 2D and 3D games and interactive apps.",
  PyPI: "The Python Package Index, where Python packages are published.",

  // languages
  Python: "A general-purpose programming language, widely used for data and backend work.",
  SQL: "The standard language for querying and modifying relational data.",
  JavaScript: "The programming language of the web, running in browsers and on servers.",
  TypeScript: "JavaScript with static types.",
  Java: "A general-purpose, object-oriented language that runs on the JVM.",
  "C++": "A compiled language for systems and performance-critical software.",
  Bash: "A Unix shell and scripting language for automating command-line work.",

  // developer tools
  Cursor: "An AI-assisted code editor built on VS Code.",
  "Claude Code": "Anthropic's agentic coding tool that works in the terminal and the editor.",
  Codex: "OpenAI's coding agent for writing, reviewing, and running code.",
  GitHub: "A platform for hosting Git repositories and collaborating on code.",
  "Azure DevOps": "Microsoft's suite for repos, pipelines, boards, and artifacts.",
  Git: "A distributed version control system.",
  Bitbucket: "Atlassian's Git hosting service with built-in CI pipelines.",
  Jira: "Atlassian's issue and project tracker.",
  Confluence: "Atlassian's wiki for team documentation.",
  Postman: "A tool for designing, testing, and documenting APIs.",
  Jenkins: "An open-source automation server for building, testing, and deploying software.",

  // focus areas
  "Data Engineering": "Building the systems that move, store, and model data for analysis.",
  "Data Pipelines": "Automated flows that move and transform data between systems.",
  "Data Warehousing": "Organizing data in a central store designed for analytics.",
  "AI Infrastructure": "The compute, serving, and tooling that AI applications run on.",
  GenAI: "Applications built on generative models such as large language models.",
  "Agentic AI": "Systems where a model plans, calls tools, and acts toward a goal.",
  MLOps: "Practices for deploying, monitoring, and maintaining machine learning in production.",
  "Backend Engineering": "Building the services and APIs behind an application.",
  "Cloud Infrastructure": "Provisioning and running systems on cloud platforms.",
};

/** The notes for the chips in `names`, keyed by chip. A chip with no entry is
    left out, so it renders as a plain chip. */
export function describe(names: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const n of names) if (INFO[n]) out[n] = bare(INFO[n]);
  return out;
}
