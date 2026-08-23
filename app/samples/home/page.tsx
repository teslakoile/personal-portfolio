import { QuietResume } from "../quiet/QuietResume";

/**
 * Composed home preview, Kyle's picks assembled into one page:
 *   Hero V4 (photo) · About V3 (at a glance) · Experience V1 (timeline) ·
 *   Skills V3 (descriptor cards) · Writing V1 (+ tags) · Certifications · Recognition V2.
 */
export default function HomePreview() {
  return (
    <QuietResume
      variant="swiss"
      picks={{ hero: 4, about: 3, experience: 1, skills: 3, writing: 1, certifications: 1, recognition: 2 }}
    />
  );
}
