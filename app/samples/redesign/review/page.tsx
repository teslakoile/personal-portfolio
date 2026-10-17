import type { Metadata } from "next";
import { featureEnabled } from "../../../flags";
import { SitePage } from "../../../_brand/SitePage";

/**
 * /samples/redesign/review: the landing page as it ships (app/_brand/SitePage),
 * kept for review. ?kyllm=1 shows KYLLM without flipping FEATURE_FLAGS.kyllm.
 */
export const metadata: Metadata = {
  title: "Redesign Review | Kyle Naranjo",
  robots: { index: false, follow: false },
};

export default async function RedesignReview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  return <SitePage kyllm={featureEnabled("kyllm") || q.kyllm === "1"} />;
}
