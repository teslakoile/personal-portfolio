import { OrgLink } from "../../_brand/OrgLink";
import type { RoleView } from "../../_brand/sections/experienceData";
import x from "./experience.module.css";

/** The employer's logo and name, the name linking to its site when one is on record. */
export function OrgLine({ r }: { r: RoleView }) {
  return (
    <span className={x.org}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {r.mark ? <img src={r.mark} alt="" /> : null}
      <OrgLink name={r.employer} url={r.href}>{r.employer}</OrgLink>
    </span>
  );
}

/** "10+ microservices" → the figure and its unit, so the figure can be set large. */
export function splitFigure(figure: string): { n: string; unit: string } {
  const i = figure.indexOf(" ");
  return i < 0 ? { n: figure, unit: "" } : { n: figure.slice(0, i), unit: figure.slice(i + 1) };
}
