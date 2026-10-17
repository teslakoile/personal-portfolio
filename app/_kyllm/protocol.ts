/**
 * What the KYLLM route and the chat window share: the sections an answer can
 * cite, the outside links, the stream's event shape, and the input limits.
 */

/** Sections of the page, by element id, with the label a source chip shows. */
export const SECTIONS = {
  about: "About",
  projects: "Projects",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  certifications: "Certifications",
  community: "Community",
  recognition: "Recognition",
  github: "GitHub",
} as const;
export type SectionId = keyof typeof SECTIONS;

/** Places off the page an answer can cite. */
export const LINKS = {
  linkedin: { label: "LinkedIn", name: "kyle-naranjo", host: "linkedin.com", href: "https://linkedin.com/in/kyle-naranjo" },
  github: { label: "GitHub", name: "teslakoile", host: "github.com", href: "https://github.com/teslakoile" },
  ieee: { label: "IEEE", name: "AIComprehend", host: "ieeexplore.ieee.org", href: "https://ieeexplore.ieee.org/document/10323847" },
  cv: { label: "CV", name: "Kyle-Naranjo-CV.pdf", host: "kylenaranjo.cv", href: "/Kyle-Naranjo-CV.pdf" },
} as const;
export type LinkId = keyof typeof LINKS;

/** One cited source, as the model names it: a section and the item in it, or an outside link. */
export type Source = { section: SectionId; name: string } | { link: LinkId };

/** The route streams newline-delimited JSON, one of these per line. */
export type StreamEvent =
  | { t: "text"; v: string }
  | { t: "meta"; sources: Source[]; next: string[] }
  | { t: "error"; v: string }
  | { t: "done" };

export type Turn = { role: "user" | "assistant"; content: string };

export const LIMITS = {
  /** characters in one question */
  question: 600,
  /** earlier messages sent along for context */
  history: 12,
  /** characters across the history */
  historyChars: 8000,
};

/** The line the model writes between its answer and the sources and follow-ups. */
export const META_MARK = "<<<META>>>";
