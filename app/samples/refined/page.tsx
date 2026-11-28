import type { Metadata } from "next";
import { featureEnabled } from "../../flags";
import { SitePage } from "../../_brand/SitePage";

/**
 * /samples/refined: the landing page with the 2026-11-27 design-audit fixes
 * turned on (SitePage `refined`) and nothing else. The fixes are listed on
 * SitePage and sit under [data-refined] in the section stylesheets. The
 * landing page has rendered with them, and with `polish`, since 2026-11-28.
 */
export const metadata: Metadata = {
  title: "Refined Landing Page | Kyle Naranjo",
  robots: { index: false, follow: false },
};

export default function Refined() {
  return <SitePage kyllm={featureEnabled("kyllm")} refined />;
}
