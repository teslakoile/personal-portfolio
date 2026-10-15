import type { Metadata } from "next";
import { Review } from "./Review";

/**
 * Review page for KYLLM's motion: the inline rig (app/_brand/kyllm) in every
 * chat state, in a chat, and at chat sizes, plus the exported WebP loops and
 * stills in public/kyllm/motion. Built by scripts/kyllm (see its README).
 */
export const metadata: Metadata = {
  title: "KYLLM Motion | Kyle Naranjo",
  robots: { index: false, follow: false },
};

export default function KyllmMotionPage() {
  return <Review />;
}
