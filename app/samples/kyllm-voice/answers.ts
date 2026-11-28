/** Real KYLLM answers from the local eval (scripts/kyllm-eval, 2026-11-22), one run per tone, copied here so the page doesn't depend on gitignored results. */
export const ANSWERS: { id: string; q: string; answers: Record<"formal" | "friendly" | "kyle", string> }[] = [
  {
    "id": "cv-intro",
    "q": "Tell me more about Kyle",
    "answers": {
      "formal": "Kyle Naranjo is a Data Engineer II at Thinking Machines Data Science. He has worked there since August 2024 [1]. He builds AI agents, data pipelines, and cloud infrastructure for enterprise clients in financial services, investment management, education, and compliance [2]. His work includes a Single Customer View pipeline on Azure Databricks for a major Philippine bank, and Snowflake Cortex agent workflows [1]. Earlier, he was a backend engineer at Ingenuity Software. He graduated summa cum laude from UP Diliman in Computer Engineering [1].",
      "friendly": "Kyle is a Data Engineer II at Thinking Machines Data Science, where he's worked since August 2024. He builds AI agents, data pipelines, and cloud infrastructure for enterprise clients [1]. His work there includes Snowflake Cortex agent workflows and a Splink-based Single Customer View pipeline on Azure Databricks for a major Philippine bank [1]. Before that he was a backend engineer at Ingenuity Software, and he graduated summa cum laude from UP Diliman in Computer Engineering [1]. He also speaks at community events about generative AI and AI coding agents [2].",
      "kyle": "Kyle's a data engineer at Thinking Machines Data Science. He's been there since August 2024 and builds AI agents, data pipelines, and cloud infrastructure for enterprise clients [1]. Examples are Snowflake Cortex agent workflows, a Splink-based customer record-linkage pipeline on Azure Databricks, and microservices on FastAPI, Dagster, and Kubernetes [2]. Before that he was a backend engineer at Ingenuity Software, working on Django. He graduated summa cum laude in Computer Engineering at UP Diliman, and he co-authored an IEEE paper [2]. He also leads Google Developer Group Davao."
    }
  },
  {
    "id": "cv-now",
    "q": "Where does Kyle work now?",
    "answers": {
      "formal": "Kyle currently works at Thinking Machines Data Science. He has been a Data Engineer II there since August 2024, working remotely from the Philippines [1]. His work covers backend services and data pipelines on FastAPI, Dagster, Kubernetes and Snowflake. It also includes Snowflake Cortex agent workflows and Azure Databricks projects for enterprise clients [1].",
      "friendly": "Kyle works at Thinking Machines Data Science as a Data Engineer II, a remote role in the Philippines that he's held since August 2024 [1]. He builds data pipelines, AI agent workflows, and cloud infrastructure for enterprise clients. His work there includes FastAPI, Dagster, and Kubernetes services, Snowflake Cortex agent workflows, and Azure Databricks projects [1].",
      "kyle": "He's a Data Engineer II at Thinking Machines Data Science. It's a remote role based in the Philippines, and he's been there since August 2024 [1]. He builds backend services, data pipelines, and AI agent workflows for enterprise clients [1]."
    }
  },
  {
    "id": "g-airflow",
    "q": "Has he used Airflow?",
    "answers": {
      "formal": "Yes. At Thinking Machines Data Science, Kyle led a data ingestion workstream that built pipelines from MS SQL Server and MongoDB into BigQuery using Cloud Composer (Airflow), Dataform, and SQL [1]. He also fixed memory failures in legacy Airflow DAGs with chunked CSV processing [2]. He holds the Apache Airflow 3 Fundamentals certification and is listed as an Apache Airflow open source contributor [1].",
      "friendly": "Yes. At Thinking Machines, Kyle fixed memory failures in legacy Airflow DAGs by switching to chunked CSV processing. That was on a pipeline into BigQuery using Cloud Composer, for a large Singaporean enterprise [1]. He also contributed Apache Airflow documentation in 2025, covering Azure Blob Storage remote logging and Google Cloud Vertex AI operators [2]. He holds Astronomer's Airflow 3 Fundamentals certification too [3].",
      "kyle": "Yep, he has. At Thinking Machines he built pipelines from 4 source systems (MS SQL Server and MongoDB) into BigQuery using Cloud Composer (Airflow), Dataform, and SQL [1]. He also fixed memory failures in legacy Airflow DAGs with chunked CSV processing before production rollout [2]. He holds the Airflow 3 Fundamentals certification and is listed as an Apache Airflow open source contributor [1]."
    }
  },
  {
    "id": "g-rust",
    "q": "Has he used Rust?",
    "answers": {
      "formal": "His CV and this site don't mention Rust anywhere, so I can't say whether he has used it. You can email Kyle at kyle.naranjo@gmail.com to ask. I can also go through the languages and tools that are listed on his site.",
      "friendly": "Rust doesn't appear anywhere on Kyle's CV or this site. His listed languages are Python, SQL, JavaScript, Java, and Bash [1]. If you want to know whether he's tried Rust outside what's written here, you could email him at kyle.naranjo@gmail.com.",
      "kyle": "Nothing on his CV or this site says he's used Rust. His listed languages are Python, SQL, JavaScript, Java, and Bash [1]. If you want to know whether he's tried Rust outside that, email him at kyle.naranjo@gmail.com."
    }
  },
  {
    "id": "x-salary",
    "q": "What are his salary expectations?",
    "answers": {
      "formal": "His CV and this site don't cover salary expectations. For that, please email Kyle at kyle.naranjo@gmail.com.",
      "friendly": "His CV and this site don't cover salary expectations. For that, please email Kyle at kyle.naranjo@gmail.com.",
      "kyle": "His CV and this site don't cover salary expectations. You can email Kyle at kyle.naranjo@gmail.com to ask him directly."
    }
  },
  {
    "id": "p-leafmark",
    "q": "What is Leafmark?",
    "answers": {
      "formal": "Leafmark is a Chrome extension Kyle built that files each new bookmark into the right folder. It only asks you when it isn't sure [1]. A model scores each folder, files the confident matches silently, and learns from the bookmarks you move. Your own rules run locally first, and it never sends a URL that carries a token. It's built with JavaScript and OpenRouter [1].",
      "friendly": "Leafmark is a Chrome extension Kyle built that files each new bookmark into the right folder. It only asks you when it isn't sure [1]. A model scores each folder, files the confident ones silently, and learns from bookmarks you move. Your own rules run locally first, and it never sends a URL that carries a token [1]. It's built with JavaScript and OpenRouter.",
      "kyle": "Leafmark is a Chrome extension Kyle built. It files each new bookmark into the right folder and only asks you when it isn't sure [1]. A model scores each folder and files the confident ones silently. It learns from the bookmarks you move. Your own rules run locally first, and it never sends a URL that carries a token. It's built with JavaScript and OpenRouter [1]."
    }
  }
];
