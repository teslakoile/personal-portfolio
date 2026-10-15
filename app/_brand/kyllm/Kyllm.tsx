import { useId } from "react";
import k from "./kyllm.module.css";
import { AVATAR, BODY, FULL, STATES } from "./rig";

/**
 * KYLLM, the chat agent's mascot, as one inline SVG that moves between chat
 * states. The markup and motion come from scripts/kyllm/rig.py (see its
 * README): every offset and eye shape is measured from a 3D pose render, so
 * only the eyes, ears, leaf, and glasses move and the body never swaps.
 *
 * Set `state` as the chat moves along; the parts glide to the new pose.
 * Entering "answered" plays its hop once. Idle, think, and read loop every
 * 4.8s. prefers-reduced-motion keeps each pose and drops the motion; `still`
 * does the same on demand.
 *
 *   <Kyllm state={busy ? "think" : "idle"} size={36} />
 *   <Kyllm variant="full" state="answered" size={240} />
 */
export type KyllmState = (typeof STATES)[number];
export const KYLLM_STATES = STATES;

export function Kyllm({
  state = "idle",
  variant = "avatar",
  size = 36,
  still = false,
  label = "KYLLM",
  className,
}: {
  state?: KyllmState;
  /** "avatar": the sky circle, cropped for chat rows. "full": the whole character, no background. */
  variant?: "avatar" | "full";
  /** Width in px; the full character's height follows its proportions. */
  size?: number;
  still?: boolean;
  label?: string;
  className?: string;
}) {
  const clip = `kyllm-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const avatar = variant === "avatar";
  const { cx, cy, r, bg } = AVATAR;
  const inner = avatar
    ? `<clipPath id="${clip}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
      `<g clip-path="url(#${clip})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}"/>${BODY}</g>`
    : BODY;
  return (
    <svg
      className={`${k.kyllm} ${className ?? ""}`}
      data-state={state}
      data-still={still || undefined}
      viewBox={avatar ? AVATAR.viewBox : FULL.viewBox}
      width={size}
      height={avatar ? size : Math.round((size * FULL.height) / FULL.width)}
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
