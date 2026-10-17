import { Row, SectionHead } from "../kit";
import { ExperienceRoles } from "./ExperienceRoles";
import { ExperienceTimeline } from "./ExperienceTimeline";
import { buildRoles, today as now } from "./experienceData";

/**
 * Experience: a one-block-per-month career timeline, then a drawer per role
 * (ExperienceRoles). The current role starts open.
 * Roles and dates are read from sampleContent.ts through experienceData.ts. No
 * featured case study: the engagements under the current role are listed as
 * equal rows (Kyle's call on 2026-10-05), each with the one number that
 * defines it.
 */
export function Experience({ num, initial }: { num?: string; initial?: "first" | "all" | "none" }) {
  const today = now();
  const roles = buildRoles(today);
  return (
    <Row id="experience">
      <SectionHead num={num} title="Experience" />
      <ExperienceTimeline roles={roles} today={today} />
      <ExperienceRoles roles={roles} initial={initial} />
    </Row>
  );
}
