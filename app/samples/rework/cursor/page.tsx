import { HomeShell } from "../../../_home/HomeShell";
import { PointerLab } from "./PointerLab";

/**
 * Cursor options over the real landing page. Round eight: the animated ink
 * cursor plus KYLLM, the companion Kyle picked. Round seven's dot, ring,
 * squish, tag, and adaptive cursors are retired too.
 *
 * Rejected in rounds one to six, so they do not come back: grid glow (the
 * current hero), grid trail, hover brackets, context label, grid plus, ruler
 * lines, grid bend, node dots, printer's loupe, halftone swell, edge rulers,
 * depth drift, window light, iron filings, halftone pool, contours, dot
 * field, raking light, ink ribbon, coral thread, halftone trail, data blocks,
 * plotter, dither trail, ink bloom, logo trail, ribbons, gooey blob.
 */
export default function CursorLab() {
  return (
    <PointerLab>
      <HomeShell />
    </PointerLab>
  );
}
