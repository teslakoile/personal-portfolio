import type { Metadata } from "next";
import { featureEnabled } from "../../flags";
import { SitePage } from "../../_brand/SitePage";

/**
 * /samples/polished: /samples/refined plus the visual-alignment pass
 * (SitePage `polish`): shared vertical rules across sections, project cards
 * on shared rows, a role's date on its title's line, and equal slots for the
 * timeline's employer marks. Rules sit under [data-polish].
 */
export const metadata: Metadata = {
  title: "Polished Landing Page | Kyle Naranjo",
  robots: { index: false, follow: false },
};

export default function Polished() {
  return <SitePage kyllm={featureEnabled("kyllm")} polish />;
}
