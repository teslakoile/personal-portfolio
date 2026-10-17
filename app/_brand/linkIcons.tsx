import { Globe } from "lucide-react";
import { BrandIcon } from "./icons";

/**
 * Icons for a link's destination, sized like a Lucide icon in a text row and
 * drawn in currentColor, so they turn coral with their link. Chrome and
 * itch.io are their real marks as single-colour glyphs (Simple Icons 13.0.0
 * paths: googlechrome, itchdotio); GitHub is BrandIcon's. PyPI keeps its
 * colour logo from /public/logos, because its single-colour glyph turns into
 * a blot at 14 px. A site link shows the site's own favicon when it is given,
 * a globe otherwise.
 */
const PATHS = {
  chrome: "M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z",
  itch: "M3.13 1.338C2.08 1.96.02 4.328 0 4.95v1.03c0 1.303 1.22 2.45 2.325 2.45 1.33 0 2.436-1.102 2.436-2.41 0 1.308 1.07 2.41 2.4 2.41 1.328 0 2.362-1.102 2.362-2.41 0 1.308 1.137 2.41 2.466 2.41h.024c1.33 0 2.466-1.102 2.466-2.41 0 1.308 1.034 2.41 2.363 2.41 1.33 0 2.4-1.102 2.4-2.41 0 1.308 1.106 2.41 2.435 2.41C22.78 8.43 24 7.282 24 5.98V4.95c-.02-.62-2.082-2.99-3.13-3.612-3.253-.114-5.508-.134-8.87-.133-3.362 0-7.945.053-8.87.133zm6.376 6.477a2.74 2.74 0 0 1-.468.602c-.5.49-1.19.795-1.947.795a2.786 2.786 0 0 1-1.95-.795c-.182-.178-.32-.37-.446-.59-.127.222-.303.412-.486.59a2.788 2.788 0 0 1-1.95.795c-.092 0-.187-.025-.264-.052-.107 1.113-.152 2.176-.168 2.95v.005l-.006 1.167c.02 2.334-.23 7.564 1.03 8.85 1.952.454 5.545.662 9.15.663 3.605 0 7.198-.21 9.15-.664 1.26-1.284 1.01-6.514 1.03-8.848l-.006-1.167v-.004c-.016-.775-.06-1.838-.168-2.95-.077.026-.172.052-.263.052a2.788 2.788 0 0 1-1.95-.795c-.184-.178-.36-.368-.486-.59-.127.22-.265.412-.447.59a2.786 2.786 0 0 1-1.95.794c-.76 0-1.446-.303-1.948-.793a2.74 2.74 0 0 1-.468-.602 2.738 2.738 0 0 1-.463.602 2.787 2.787 0 0 1-1.95.794h-.16a2.787 2.787 0 0 1-1.95-.793 2.738 2.738 0 0 1-.464-.602zm-2.004 2.59v.002c.795.002 1.5 0 2.373.953.687-.072 1.406-.108 2.125-.107.72 0 1.438.035 2.125.107.873-.953 1.578-.95 2.372-.953.376 0 1.876 0 2.92 2.934l1.123 4.028c.832 2.995-.266 3.068-1.636 3.07-2.03-.075-3.156-1.55-3.156-3.025-1.124.184-2.436.276-3.748.277-1.312 0-2.624-.093-3.748-.277 0 1.475-1.125 2.95-3.156 3.026-1.37-.004-2.468-.077-1.636-3.072l1.122-4.027c1.045-2.934 2.545-2.934 2.92-2.934zM12 12.714c-.002.002-2.14 1.964-2.523 2.662l1.4-.056v1.22c0 .056.56.033 1.123.007.562.026 1.124.05 1.124-.008v-1.22l1.4.055C14.138 14.677 12 12.713 12 12.713z",
};

export type LinkKind = "site" | "chrome" | "github" | "pypi" | "itch";

export function linkKind(href: string): LinkKind {
  if (href.includes("github.com")) return "github";
  if (href.includes("chromewebstore")) return "chrome";
  if (href.includes("pypi.org")) return "pypi";
  if (href.includes("itch.io")) return "itch";
  return "site";
}

/** The icon for a link's destination; `favicon` is a path under /public. */
export function LinkIcon({ kind, size = 15, favicon }: { kind: LinkKind; size?: number; favicon?: string }) {
  if (kind === "site") {
    if (!favicon) return <Globe size={size} strokeWidth={1.7} aria-hidden="true" />;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={favicon} alt="" width={size} height={size} style={{ display: "block", borderRadius: 3, objectFit: "contain" }} />;
  }
  if (kind === "github") return <BrandIcon kind="github" size={size - 1} />;
  if (kind === "pypi") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/logos/pypi.svg" alt="" width={size} height={size} style={{ display: "block" }} />;
  }
  return (
    <svg width={size - 1} height={size - 1} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ display: "block" }}>
      <path d={PATHS[kind as keyof typeof PATHS]} />
    </svg>
  );
}
