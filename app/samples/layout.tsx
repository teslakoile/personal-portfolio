import type { CSSProperties, ReactNode } from "react";
import { fontVars } from "../fonts";

/**
 * The samples playground now shares THE GLOBAL FONTSET (app/fonts.ts — Swiss:
 * Geist + Geist Mono). The exploration pages were written against nine font
 * variables; rather than editing every legacy module, the old variable names
 * are aliased onto the global families here, so every sample renders in the
 * locked fontset and nothing extra downloads. (This is also why the retired
 * fontset-comparison page is gone — the candidates no longer load.)
 */
const legacyFontAliases: CSSProperties = {
  "--font-fraunces": "var(--font-geist)",
  "--font-spline-sans": "var(--font-geist)",
  "--font-inter": "var(--font-geist)",
  "--font-source-serif": "var(--font-geist)",
  "--font-space-grotesk": "var(--font-geist)",
  "--font-jetbrains-mono": "var(--font-geist-mono)",
  "--font-ibm-plex-mono": "var(--font-geist-mono)",
} as CSSProperties;

export default function SamplesLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${fontVars} min-h-screen w-full`} style={legacyFontAliases}>
      {children}
    </div>
  );
}
