import type { Metadata } from "next";
import { Compare } from "./Compare";

/** CSS rig vs the same rig driven by Motion, side by side. */
export const metadata: Metadata = {
  title: "KYLLM Motion Libraries | Kyle Naranjo",
  robots: { index: false, follow: false },
};

export default function KyllmMotionLibrariesPage() {
  return <Compare />;
}
