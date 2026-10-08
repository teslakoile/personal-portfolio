import k from "./cursor.module.css";

/**
 * The click effect for the drawn cursor (Cursor.tsx): eight short coral rays
 * shoot out of the click point and shrink to nothing. Each ray is a
 * throwaway element animated with the Web Animations API and removed when
 * done; a paper edge keeps it visible on photos and on coral. The options it
 * was picked from (ring, ripple, blocks, halftone, crosshair, squash, and
 * five spark variants) were compared on a samples page in October 2026.
 */
const out = "cubic-bezier(0.22, 1, 0.36, 1)";
const c = "translate(-50%, -50%)";

const RAYS = 8;
/** distance from the click point at start, full stretch, and end, px */
const R = [5, 14, 22];

export function spark(x: number, y: number) {
  for (let i = 0; i < RAYS; i++) {
    const a = (i * 360) / RAYS + 180 / RAYS;
    const el = document.createElement("i");
    el.className = k.ray;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    const done = () => el.remove();
    // each ray starts short near the centre, stretches on the way out, then shrinks away
    el.animate([
      { transform: `${c} rotate(${a}deg) translateX(${R[0]}px) scaleX(0.3)`, opacity: 1 },
      { transform: `${c} rotate(${a}deg) translateX(${R[1]}px) scaleX(1)`, opacity: 1, offset: 0.4 },
      { transform: `${c} rotate(${a}deg) translateX(${R[2]}px) scaleX(0)`, opacity: 1 },
    ], { duration: 420, easing: out, fill: "both" }).finished.then(done, done);
  }
}

/** the cursor's release after a click: springs a touch past rest, settles */
export const RELEASE: Keyframe[] = [
  { transform: "scale(0.86)", easing: "cubic-bezier(0.33, 1, 0.68, 1)" },
  { transform: "scale(1.08)", offset: 0.45, easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
  { transform: "scale(1)" },
];

