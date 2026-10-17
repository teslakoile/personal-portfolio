/** Kyle's CV (public/Kyle-Naranjo-CV.pdf) as text, the source KYLLM trusts first. Re-extract with `pdftotext -layout` when the CV changes. */
export const CV = `KYLE NATHAN G. NARANJO
kyle.naranjo@gmail.com | +63 906 561 4027 | Philippines
kylenaranjo.cv | linkedin.com/in/kyle-naranjo | github.com/teslakoile
PROFESSIONAL EXPERIENCE
THINKING MACHINES DATA SCIENCE | Philippines (Remote)
Data Engineer II | Aug 2024 – Present
- Owned backend feature development across 10+ interconnected microservices for an investment data platform at a large Singaporean investment holding company, integrating data from vendor platforms such as Sustainalytics, PitchBook, Bloomberg, and MSCI to support deal discovery, due diligence, and portfolio monitoring. Built backend services and data pipelines using FastAPI, Dagster, and Kubernetes, and performed data processing on Snowflake handling terabytes of data.
- Iterated on Snowflake Cortex AI agent workflows with the Knowledge Graph team on the same organization’s enterprise document intelligence platform, enabling investment officers to perform large-scale document extraction, contextual querying, and portfolio data analysis using OpenAI and Snowflake Cortex. Focused on agent tooling, prompt engineering, evaluation, and workflow improvements across a ~15 person cross-functional team.
- Led the Data Products workstream in a year-long engagement with a major Philippine bank on Azure Databricks using PySpark and SQL. Designed and productionized a daily Single Customer View (SCV) pipeline consolidating ~15M records from 4 enterprise systems into ~7M unique customer keys. Built a probabilistic record-linkage pipeline using Splink with novel metaphone-based blocking strategies, optimizing runtime from 4+ hours to <1 hour. Developed a Next Best Product recommendation pipeline covering 12 product types and 4 customer segments, leading data cleaning, modeling, and feature engineering across 40+ customer attributes.
- Spearheaded the infrastructure and data ingestion workstream for a Philippine education enterprise’s student-at-risk prediction platform on Azure Databricks. Provisioned infrastructure using Terraform, built API ingestion pipelines across 3 source systems, and migrated existing linear regression models into Databricks jobs. Accelerated development velocity by integrating AI coding agents into the SDLC, using specialized subagents, agent skills, hooks, and custom commands.
- Led the data ingestion and transformation workstream for a large Singaporean enterprise, building end-to-end pipelines from 4 source systems (MS SQL Server, MongoDB) into BigQuery using Cloud Composer (Airflow), Dataform, and SQL.
INGENUITY SOFTWARE | Philippines (Hybrid)
Backend Software Engineer | Jan 2022 – Jul 2024
- Engineered the backend of a compliance case-management platform on Django. Decomposed the monolithic backend into cross-region microservices and developed ~50 production API endpoints across 2 AWS region deployments with separate databases for data residency/GDPR compliance. Supported platform growth from inception to adoption by 10+ corporate customers.
ELECTRICAL AND ELECTRONICS ENGINEERING INSTITUTE, UP DILIMAN | Philippines (Onsite)
Research Associate, Ubiquitous Computing Lab (under Prof. Nestor Tiglao, PhD) | Aug 2022 – Nov 2023
- Co-authored and published an IEEE paper on AIComprehend, an adaptive reading comprehension platform using a PFA-based ML model (79% accuracy, 66% AUC), presented at ISNCC 2023 in Qatar. Built and deployed the full-stack Django application to production, supporting a 1-month controlled study where students achieved a 13.9% improvement in test scores.
EDUCATION
UNIVERSITY OF THE PHILIPPINES DILIMAN | Philippines
Bachelor of Science in Computer Engineering
- Graduated summa cum laude (1.15/1.00), ranking among the Top 5 BS Computer Engineering graduates in UP Diliman.
- Recipient of the DOST-SEI Merit Scholarship, awarded to the top ~5% of STEM students in the Philippines.
TECHNICAL SKILLS
- Languages: Python, SQL, JavaScript, Java, Bash
- Data Platforms & Processing: Databricks, Snowflake, BigQuery, PostgreSQL, MongoDB, PySpark, Pandas
- Orchestration & Transformation: Airflow, Dagster, dbt, Dataform
- ML & AI: OpenAI API, Vertex AI, Azure AI Services, Snowflake Cortex, LangChain, Keras, Splink
- Cloud & Infrastructure: AWS, Azure, GCP, Docker, Terraform, Kubernetes, CI/CD
- Backend Frameworks: FastAPI, Django, Flask, SQLAlchemy, Pydantic
- AI Development Tools: Cursor, Claude Code, Codex CLI
CERTIFICATIONS & COMMUNITY
- Certifications: GCP Professional ML Engineer, Databricks Certified Data Engineer Associate, Azure AI Engineer Associate, OpenAI AI Technical Practitioner, GCP Generative AI Leader, GCP AI/ML Pre-Sales Technical Expert, Apache Airflow 3 Fundamentals, AWS Cloud Practitioner, Azure Fundamentals, GCP Cloud Digital Leader
- Community: Apache Airflow Contributor, Google Developer Group Davao Community Lead, Global Shaper (WEF)`;
