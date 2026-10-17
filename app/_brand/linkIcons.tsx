import { Gamepad2, Globe } from "lucide-react";
import { BrandIcon } from "./icons";

/** Single-colour glyphs (Simple Icons paths) in currentColor, like BrandIcon. */
const PATHS = {
  chrome: "M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z",
};

export type LinkKind = "site" | "chrome" | "github" | "pypi" | "itch";

export function linkKind(href: string): LinkKind {
  if (href.includes("github.com")) return "github";
  if (href.includes("chromewebstore")) return "chrome";
  if (href.includes("pypi.org")) return "pypi";
  if (href.includes("itch.io")) return "itch";
  return "site";
}

/** The icon for a link's destination, at Lucide's text-row size. A site link
    shows the site's own favicon when it is given (`favicon`, a path under
    /public), and a globe otherwise. */
export function LinkIcon({ kind, size = 15, favicon }: { kind: LinkKind; size?: number; favicon?: string }) {
  if (kind === "site" && favicon) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={favicon} alt="" width={size} height={size} style={{ display: "block", borderRadius: 3, objectFit: "contain" }} />;
  }
  if (kind === "github") return <BrandIcon kind="github" size={size - 1} />;
  if (kind === "chrome") {
    return <svg width={size - 1} height={size - 1} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ display: "block" }}><path d={PATHS.chrome} /></svg>;
  }
  if (kind === "itch") return <Gamepad2 size={size} strokeWidth={1.7} aria-hidden="true" />;
  if (kind === "pypi") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/logos/pypi.svg" alt="" width={size} height={size} style={{ display: "block" }} />;
  }
  return <Globe size={size} strokeWidth={1.7} aria-hidden="true" />;
}
