"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import home from "./home.module.css";
import { popOpen, popClose, tick, thud, chime, click } from "./sound";

/* ============================== ASK ANYTHING =============================== */
/* Curated Q&A over the real site content — no backend, no invented facts. A
   non-matching question falls back to a prefilled "email me this" mailto. */

type QA = {
  q: string;
  keywords: string[];
  a: string;
  link?: { label: string; href: string; external?: boolean };
};

const QAS: QA[] = [
  {
    q: "What do you do?",
    keywords: ["do", "job", "work", "role", "who", "you"],
    a: "I'm a Data Engineer II at Thinking Machines Data Science. I build data pipelines, agentic AI systems, MLOps workflows, and cloud infrastructure for enterprise clients across financial services, investment management, education, and compliance.",
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
    a: "Yes — I speak about generative AI, AI coding agents, and modern engineering workflows. I lead GDG Davao and have spoken at conferences, startup events, and AWS User Group Davao. Email me the date and audience.",
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
    a: "Ten across the stack — including Google Cloud Professional Machine Learning Engineer, Databricks Certified Data Engineer Associate, Azure AI Engineer Associate, and OpenAI AI Technical Practitioner.",
    link: { label: "See All Certifications", href: "#certifications" },
  },
  {
    q: "Where did you study?",
    keywords: ["study", "school", "university", "college", "degree", "education", "diliman"],
    a: "BS Computer Engineering at the University of the Philippines Diliman — graduated summa cum laude with a 1.15 weighted average, Top 5 of the program. Philippine Science High School before that.",
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
    a: "Two interactive explainers are in progress — one on probabilistic record linkage (the 748,000-duplicates story) and one on wiring ChatGPT to Databricks through an MCP server.",
    link: { label: "Preview the Writing", href: "#writing" },
  },
  {
    q: "Do you do open source?",
    keywords: ["open", "source", "oss", "github", "contribute", "contributions", "airflow"],
    a: "Yes — I've contributed documentation to Apache Airflow (Azure Blob Storage remote logging, Google Cloud Vertex AI operators), and my GitHub shows 8,000+ contributions in the last year.",
    link: { label: "See the Graph", href: "#github" },
  },
  {
    q: "Can I see your CV?",
    keywords: ["cv", "resume", "download", "pdf"],
    a: "There's a one-page PDF with everything on it.",
    link: { label: "Download the CV", href: "/Kyle-Naranjo-CV.pdf", external: true },
  },
];

const SUGGESTIONS = ["What do you do?", "What's your stack?", "Are you available for talks?", "Can I see your CV?"];

function bestMatch(input: string): QA | null {
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

function AskAnything({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const answer = useMemo(() => (asked ? bestMatch(asked) : null), [asked]);

  const submit = (q: string) => {
    if (!q.trim()) return;
    click();
    setInput(q);
    setAsked(q);
  };

  return (
    <div className={home.overlay} role="dialog" aria-modal="true" aria-label="Ask anything" onClick={onClose}>
      <span className={home.overlayHint}><kbd>esc</kbd> to close</span>
      <div className={home.overlayInner} onClick={(e) => e.stopPropagation()}>
        <p className={home.askPrompt}>What do you want to ask?</p>
        <input
          ref={inputRef}
          className={home.askInput}
          value={input}
          placeholder="Type a question and press enter…"
          onChange={(e) => { setInput(e.target.value); if (asked) setAsked(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") submit(input); }}
        />
        {!asked ? (
          <div className={home.askChips}>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className={home.askChip} onMouseEnter={() => tick()} onClick={() => submit(s)}>
                {s}
              </button>
            ))}
          </div>
        ) : answer ? (
          <div className={home.askAnswer}>
            <p className={home.askAnswerQ}>{answer.q}</p>
            <p className={home.askAnswerA}>{answer.a}</p>
            {answer.link ? (
              answer.link.external ? (
                <a className={home.askAnswerLink} href={answer.link.href}>
                  {answer.link.label} <span aria-hidden="true">→</span>
                </a>
              ) : (
                <a className={home.askAnswerLink} href={answer.link.href} onClick={onClose}>
                  {answer.link.label} <span aria-hidden="true">→</span>
                </a>
              )
            ) : null}
          </div>
        ) : (
          <div className={home.askAnswer}>
            <p className={home.askAnswerQ}>Good Question</p>
            <p className={home.askAnswerA}>
              I haven&apos;t written that one down yet — send it to me directly and I&apos;ll answer for real.
            </p>
            <a
              className={home.askAnswerLink}
              href={`mailto:kyle.naranjo@gmail.com?subject=${encodeURIComponent("Question from your site")}&body=${encodeURIComponent(asked)}`}
            >
              Email Me This Question <span aria-hidden="true">→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* =============================== TYPING TEST =============================== */

const SENTENCES = [
  "I build the data and AI infrastructure enterprises run on.",
  "Exact matching missed 748,000 duplicate pairs. Probabilistic linkage found them.",
  "Ship the pipeline, watch the dashboards, trust the checks you wrote.",
  "Fifteen million records walk in. Seven million unique customers walk out.",
];

// rotate through the pool across opens/retries (client-only component, so the
// module cursor is fine and keeps renders deterministic)
let sentenceCursor = 0;
const nextSentence = () => SENTENCES[sentenceCursor++ % SENTENCES.length];

function TypingTest({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState(nextSentence);
  const [typed, setTyped] = useState("");
  const [errors, setErrors] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0); // interval-updated clock (keeps render pure)
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.focus();
  }, []);

  // live WPM re-render while running
  useEffect(() => {
    if (startedAt === null || endedAt !== null) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [startedAt, endedAt]);

  const reset = useCallback(() => {
    setText(nextSentence());
    setTyped("");
    setErrors(0);
    setStartedAt(null);
    setEndedAt(null);
    boxRef.current?.focus();
  }, []);

  const done = endedAt !== null;
  const elapsedMs = startedAt === null ? 0 : Math.max((endedAt ?? now) - startedAt, 0);
  const minutes = Math.max(elapsedMs / 60000, 1 / 60000);
  // hold the readout until the clock has something real to say
  const wpm = startedAt === null || (elapsedMs < 1000 && !done) ? "–" : Math.round((typed.length / 5) / minutes);
  const accuracy = typed.length + errors === 0 ? 100 : Math.round((typed.length / (typed.length + errors)) * 100);

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") return; // parent closes
    if (done) {
      if (e.key.toLowerCase() === "r") { e.preventDefault(); click(); reset(); }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      setTyped((t) => t.slice(0, -1));
      return;
    }
    if (e.key.length !== 1) return;
    e.preventDefault();
    if (startedAt === null) {
      const t = Date.now();
      setStartedAt(t);
      setNow(t);
    }
    const expected = text[typed.length];
    if (e.key === expected) {
      tick();
      const next = typed + e.key;
      setTyped(next);
      if (next.length === text.length) {
        setEndedAt(Date.now());
        chime();
      }
    } else {
      thud();
      setErrors((n) => n + 1);
    }
  };

  return (
    <div className={home.overlay} role="dialog" aria-modal="true" aria-label="Typing test" onClick={onClose}>
      <span className={home.overlayHint}><kbd>esc</kbd> to close</span>
      <div className={home.overlayInner} onClick={(e) => e.stopPropagation()}>
        <p className={home.typeLabel}>Typing Test · How fast do you ship?</p>
        <div
          ref={boxRef}
          tabIndex={0}
          onKeyDown={onKey}
          style={{ outline: "none" }}
          aria-label="Typing area — start typing the sentence"
        >
          <p className={home.typeText} aria-hidden="true">
            {text.split("").map((ch, i) => {
              const cls = i < typed.length ? home.tOk : i === typed.length && !done ? home.tCaret : undefined;
              return (
                <span key={i} className={cls}>{ch}</span>
              );
            })}
          </p>
          <div className={home.typeStats}>
            <span className={home.typeStat}>
              <span className={`${home.typeStatVal} ${done ? home.typeStatDone : ""}`}>{wpm}</span>
              <span className={home.typeStatLabel}>WPM</span>
            </span>
            <span className={home.typeStat}>
              <span className={home.typeStatVal}>{accuracy}%</span>
              <span className={home.typeStatLabel}>Accuracy</span>
            </span>
            <span className={home.typeStat}>
              <span className={home.typeStatVal}>{typed.length}/{text.length}</span>
              <span className={home.typeStatLabel}>Chars</span>
            </span>
            <button type="button" className={home.typeRetry} onClick={() => { click(); reset(); }}>
              <kbd>{done ? "r" : "↺"}</kbd>
              {done ? "Go Again" : "Restart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================ HOST ==================================== */
/* Mounts once in the shell; owns the global shortcuts. ⌘K / ctrl+K → ask,
   ⌘J / ctrl+J → typing test, esc closes. Sidebar buttons dispatch the same
   custom events, keeping the rail a plain anchor list. */

export function Overlays() {
  const [open, setOpen] = useState<"ask" | "type" | null>(null);

  const close = useCallback(() => {
    setOpen((o) => {
      if (o) popClose();
      return null;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        popOpen();
        setOpen((o) => (o === "ask" ? null : "ask"));
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        popOpen();
        setOpen((o) => (o === "type" ? null : "type"));
      } else if (e.key === "Escape") {
        close();
      }
    };
    const onAsk = () => { popOpen(); setOpen("ask"); };
    const onType = () => { popOpen(); setOpen("type"); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("kn-open-ask", onAsk);
    window.addEventListener("kn-open-type", onType);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("kn-open-ask", onAsk);
      window.removeEventListener("kn-open-type", onType);
    };
  }, [close]);

  // lock page scroll while an overlay is up
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (open === "ask") return <AskAnything onClose={close} />;
  if (open === "type") return <TypingTest onClose={close} />;
  return null;
}
