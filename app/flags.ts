/**
 * Section visibility flags, one switch per landing section, in rail order.
 * A section set to `false` is withheld everywhere it surfaces: the home
 * shell, the sidebar rail (which renumbers around it via nav.ts), the
 * sitemap, the /projects route, and any ⌘K answer that anchors into it.
 * `next dev` ignores the flags entirely (every section shows, so unfinished
 * ones stay workable at /), as does the /samples playground in any mode.
 * The hero and marquee open the page and are not flaggable sections.
 */
export const SECTION_FLAGS = {
  about: true,
  projects: false, // copy is real, but the six dossier screenshots are greeked mocks
  experience: true,
  skills: true,
  education: true,
  certifications: true,
  writing: false, // both explainers unpublished; the dated cards read stale
  community: true,
  recognition: true,
  recommendations: false, // sampleContent entries are invented mocks, port the real LinkedIn quotes first
  resources: false, // starter list, still to be curated by hand
  github: true,
} satisfies Record<string, boolean>;

export type SectionId = keyof typeof SECTION_FLAGS;

// Call sites hold plain strings (nav rows, "#writing"-style ⌘K anchors), so
// this accepts any id; one that is not a flagged section is always shown.
// NODE_ENV is inlined by the bundler, so the dev bypass holds in client
// components (Sidebar, Overlays) as well as on the server.
export const sectionEnabled = (id: string): boolean =>
  process.env.NODE_ENV === "development" ||
  ((SECTION_FLAGS as Record<string, boolean>)[id] ?? true);
