import { sectionEnabled } from "../../flags";

/**
 * KYLLM's curated Q&A, copied word for word from the live Ask palette in
 * app/_home/Overlays.tsx (it does not export them). Curated answers over the
 * real site content, no backend, no invented facts; a question with no match
 * falls back to a prefilled "email me this" mailto. Edit both together.
 */

export type QA = {
  q: string;
  keywords: string[];
  a: string;
  link?: { label: string; href: string; external?: boolean };
};

const ALL_QAS: QA[] = [
  {
    q: "What do you do?",
    keywords: ["do", "job", "work", "role", "who", "you"],
    a: "I'm at Thinking Machines Data Science, building data pipelines, agentic AI systems, MLOps workflows, and cloud infrastructure for enterprise clients across financial services, investment management, education, and compliance.",
    link: { label: "See the Experience", href: "#experience" },
  },
  {
    q: "What's your stack?",
    keywords: ["stack", "tools", "tech", "technologies", "languages", "skills", "use"],
    a: "Day to day: Python, SQL, FastAPI, Dagster, Databricks, Snowflake, and Kubernetes, with Terraform underneath and AI coding agents woven through the workflow. The full spec sheet is on the site.",
    link: { label: "Browse the Skills", href: "#skills" },
  },
  {
    q: "Are you available for talks?",
    keywords: ["talk", "talks", "speak", "speaking", "speaker", "event", "conference", "available", "invite"],
    a: "Yes. I speak about generative AI, AI coding agents, and modern engineering workflows. I lead GDG Davao and have spoken at conferences, startup events, and AWS User Group Davao. Email me the date and audience.",
    link: { label: "Email Me About a Talk", href: "mailto:kyle.naranjo@gmail.com?subject=Speaking%20invitation", external: true },
  },
  {
    q: "How do I reach you?",
    keywords: ["reach", "contact", "email", "hire", "connect", "linkedin", "touch"],
    a: "Email is fastest: kyle.naranjo@gmail.com. I'm also on LinkedIn (kyle-naranjo) and GitHub (teslakoile).",
    link: { label: "Get in Touch", href: "mailto:kyle.naranjo@gmail.com", external: true },
  },
  {
    q: "What certifications do you hold?",
    keywords: ["cert", "certs", "certified", "certifications", "credentials", "gcp", "azure", "aws"],
    a: "Ten across the stack, including Google Cloud Professional Machine Learning Engineer, Databricks Certified Data Engineer Associate, Azure AI Engineer Associate, and OpenAI AI Technical Practitioner.",
    link: { label: "See All Certifications", href: "#certifications" },
  },
  {
    q: "Where did you study?",
    keywords: ["study", "school", "university", "college", "degree", "education", "diliman"],
    a: "BS Computer Engineering at the University of the Philippines Diliman. Graduated summa cum laude with a 1.15 weighted average, Top 5 of the program. Philippine Science High School before that.",
    link: { label: "See Education", href: "#education" },
  },
  {
    q: "Where are you based?",
    keywords: ["based", "location", "live", "city", "country", "philippines", "davao", "timezone", "remote"],
    a: "Davao City, Philippines (GMT+8). I work with teams across Southeast Asia and beyond.",
  },
  {
    q: "Can I read your writing?",
    keywords: ["writing", "blog", "posts", "articles", "read", "explainers"],
    a: "Two interactive explainers are in progress: one on probabilistic record linkage (the 748,000-duplicates story) and one on wiring ChatGPT to Databricks through an MCP server.",
    link: { label: "Preview the Writing", href: "#writing" },
  },
  {
    q: "Do you do open source?",
    keywords: ["open", "source", "oss", "github", "contribute", "contributions", "airflow"],
    a: "Yes. I've contributed documentation to Apache Airflow (Azure Blob Storage remote logging, Google Cloud Vertex AI operators), and my GitHub shows 8,000+ contributions in the last year.",
    link: { label: "See the Graph", href: "#github" },
  },
  {
    q: "Can I see your CV?",
    keywords: ["cv", "resume", "download", "pdf"],
    a: "There's a one-page PDF with everything on it.",
    link: { label: "Download the CV", href: "/Kyle-Naranjo-CV.pdf", external: true },
  },
];

// A QA whose link anchors into a flagged-off landing section would scroll
// nowhere, so it falls out with the section and that question takes the
// mailto fallback instead.
export const QAS = ALL_QAS.filter(
  (qa) => !qa.link?.href.startsWith("#") || sectionEnabled(qa.link.href.slice(1)),
);

export const SUGGESTIONS = ["What do you do?", "What's your stack?", "Are you available for talks?", "Can I see your CV?"];

export function bestMatch(input: string): QA | null {
  const words = input.toLowerCase().split(/[^a-z0-9+]+/).filter((w) => w.length > 1);
  if (!words.length) return null;
  let best: QA | null = null;
  let bestScore = 0;
  for (const qa of QAS) {
    let score = 0;
    for (const w of words) {
      if (qa.keywords.includes(w)) score += 2;
      else if (qa.keywords.some((k) => k.startsWith(w) && w.length > 2)) score += 1;
    }
    if (score > bestScore) { best = qa; bestScore = score; }
  }
  return bestScore >= 2 ? best : null;
}

/** The mailto a question with no curated answer falls back to. */
export const emailQuestionHref = (question: string) =>
  `mailto:kyle.naranjo@gmail.com?subject=${encodeURIComponent("Question from your site")}&body=${encodeURIComponent(question)}`;
