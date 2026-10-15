import type { Metadata } from "next";
import { Moves } from "./Moves";

/** More KYLLM animations, all built on the Motion + skills version. */
export const metadata: Metadata = {
  title: "KYLLM Moves | Kyle Naranjo",
  robots: { index: false, follow: false },
};

export default function KyllmMovesPage() {
  return <Moves />;
}
