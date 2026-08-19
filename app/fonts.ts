import { Geist, Geist_Mono } from "next/font/google";

/**
 * THE GLOBAL FONTSET — single source of truth for every font the live site
 * ships. Design principle: at most three families, one per slot —
 *
 *   display (--q-serif) · body/UI (--q-sans) · mono (--q-mono)
 *
 * LOCKED PICK: "Swiss" — Geist covers BOTH the display and body slots (two
 * families total), Geist Mono covers numerals, dates, and meta. `fontVariant`
 * is the quiet root's data-variant that maps the slots to these families
 * (app/samples/quiet/styles.module.css). The samples playground aliases its
 * legacy font variables onto this set too (app/samples/layout.tsx), so the
 * ENTIRE app ships exactly these families.
 *
 * Companion principles (applied across the app): no eyebrow labels, no
 * all-caps phrases — hierarchy comes from size, weight, and the three slots.
 * Casing: headings, sub-heads, and UI labels/CTAs use Title Case ("Speaking &
 * Talks", "Get in Touch"); body copy, questions, and metadata stay sentence
 * case.
 *
 * To ever switch sets: swap the next/font loaders + variant here, and update
 * the Geist fetch in app/opengraph-image.tsx so the social card matches.
 */
const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-geist-mono" });

/** Class string exposing the chosen families as CSS variables. */
export const fontVars = `${geist.variable} ${geistMono.variable}`;

/** data-variant for the quiet root — maps the three slots to the families. */
export const fontVariant = "swiss";
