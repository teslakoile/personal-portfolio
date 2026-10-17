import type { ReactNode } from "react";
import { orgUrl } from "./logos";
import b from "./brand.module.css";

/**
 * An organization's name as a link to its own site: plain at rest, underlined
 * in coral with a small arrow on hover or focus, the same as a certification
 * title. The url comes from `url`, else from the logo table by name; with
 * neither, the name stays plain text.
 */
export function OrgLink({ name, url, children }: { name: string; url?: string | null; children: ReactNode }) {
  const href = url ?? orgUrl(name);
  if (!href) return <>{children}</>;
  return (
    <a className={b.orgLink} href={href} target="_blank" rel="noreferrer">
      {children}{"\u00A0"}<span className={b.orgOut} aria-hidden="true">↗</span>
    </a>
  );
}
