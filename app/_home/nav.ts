import { sample } from "../samples/sampleContent";

/**
 * Single source of truth for the landing page's section rail. The sidebar
 * numbers its links from this order, and every section eyebrow ("07 /
 * Certifications") derives its number from the same list — so hiding a section
 * (recommendations auto-hides while its data list is empty) renumbers both
 * rails at once.
 */
export const NAV_SECTIONS = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "certifications", label: "Certifications" },
  { id: "writing", label: "Writing" },
  { id: "community", label: "Community" },
  { id: "recognition", label: "Recognition" },
  { id: "recommendations", label: "Recommendations" },
  { id: "resources", label: "Resources" },
  { id: "github", label: "GitHub" },
].filter((s) => s.id !== "recommendations" || sample.recommendations.length > 0);

export function sectionNumber(id: string): string {
  const i = NAV_SECTIONS.findIndex((s) => s.id === id);
  return String(i + 1).padStart(2, "0");
}

export function sectionLabel(id: string): string {
  return NAV_SECTIONS.find((s) => s.id === id)?.label ?? id;
}
