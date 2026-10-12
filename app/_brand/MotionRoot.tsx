"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Wraps a page that uses Motion (motion/react): every Motion animation
    inside follows the visitor's reduced-motion setting, so transforms and
    layout moves are skipped and only opacity changes remain. */
export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
