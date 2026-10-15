import { useId } from "react";
import k from "./kyllm-tuned.module.css";
import { AVATAR, BODY, FULL } from "../../../_brand/kyllm/rig";
import type { KyllmState } from "../../../_brand/kyllm/Kyllm";

/**
 * Exploration: the CSS rig with the motion skills applied (scripts/kyllm/rig.py,
 * tuned_css). Same markup as app/_brand/kyllm/Kyllm.tsx; only the motion CSS
 * differs: sampled spring easings, quicker exits, a slow firm "can't answer",
 * trailing ears and leaf, and a hop with anticipation.
 */
export function KyllmCssTuned({ state = "idle", variant = "avatar", size = 36 }: {
  state?: KyllmState;
  variant?: "avatar" | "full";
  size?: number;
}) {
  const clip = `kc-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const avatar = variant === "avatar";
  const { cx, cy, r, bg } = AVATAR;
  const inner = avatar
    ? `<clipPath id="${clip}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
      `<g clip-path="url(#${clip})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}"/>${BODY}</g>`
    : BODY;
  return (
    <svg className={k.kyllm} data-state={state} viewBox={avatar ? AVATAR.viewBox : FULL.viewBox} width={size}
      height={avatar ? size : Math.round((size * FULL.height) / FULL.width)} role="img" aria-label="KYLLM"
      dangerouslySetInnerHTML={{ __html: inner }} />
  );
}
