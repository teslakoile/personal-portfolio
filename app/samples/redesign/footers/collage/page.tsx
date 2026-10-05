import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { BrandRoot, Frame, Row } from "../../../../_brand/kit";
import c from "./collage.module.css";

/**
 * Footer G, Wallpaper (Kyle's pick): everyday photos tiled in a ruled grid,
 * with the email as one cell of it (no name: it is already all over the page).
 * Compares G1 (coral) and G3 (four inks) in the bridge's halftone with G5, the
 * profile card's true-color dot dither (public/footer/draft/color). The photos in public/footer/draft are
 * PLACEHOLDER picks from Kyle's folders; he will curate the final set
 * (scripts/hero/build-collage.sh).
 */
export const metadata: Metadata = {
  title: "Wallpaper Footer | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const EMAIL = "kyle.naranjo@gmail.com";

/** One tile's look: a halftone mask painted with an ink, or the profile
    card's true-color dot dither (the photo's own colors, made by
    scripts/hero/colordot.py). */
type Paint = { ink: string; bg?: string } | { dir: string; ext: "png" | "webp" };

const TREATMENTS: { id: string; label: string; note: string; paints: Paint[] }[] = [
  { id: "g6", label: "G6 · Plain", note: "No effect: each photo as taken, square-cropped.", paints: [{ dir: "fx-plain", ext: "webp" }] },
  { id: "g1", label: "G1 · Coral Halftone", note: "One coral ink, the bridge's round-dot screen.", paints: [{ ink: "var(--coral)" }] },
  { id: "g3", label: "G3 · Four Inks Halftone", note: "Each tile in one of b1 to b4, round dots on paper.",
    paints: [{ ink: "var(--b1)" }, { ink: "var(--b3)" }, { ink: "var(--b2)" }, { ink: "var(--b4)" }] },
  { id: "g5", label: "G5 · True-Color Dither, Medium", note: "The profile card's dither, Bold color, square 1.5px dots.", paints: [{ dir: "color-sq3", ext: "png" }] },
  { id: "g7", label: "G7 · Black and White", note: "Grayscale with the contrast stretched; quiet next to the coral UI.", paints: [{ dir: "fx-bw", ext: "webp" }] },
  { id: "g8", label: "G8 · Duotone", note: "A gradient map: ink shadows, coral midtones, paper highlights.", paints: [{ dir: "fx-duotone", ext: "webp" }] },
  { id: "g9", label: "G9 · Riso", note: "Two-ink risograph overprint, blue and coral, 2px grain, the coral plate slightly off-register.", paints: [{ dir: "fx-riso", ext: "webp" }] },
  { id: "g10", label: "G10 · Screenprint", note: "Posterized to six flat colors per photo.", paints: [{ dir: "fx-poster", ext: "webp" }] },
  { id: "g11", label: "G11 · Line Screen", note: "Engraving-style horizontal lines that thicken in shadow.", paints: [{ dir: "fx-lines", ext: "webp" }] },
  { id: "g12", label: "G12 · Film", note: "Warm, slightly faded color with fine grain and a soft vignette.", paints: [{ dir: "fx-grain", ext: "webp" }] },
];

function Photo({ n, paint }: { n: number; paint: Paint }) {
  const file = `life-${String(n).padStart(2, "0")}`;
  if ("dir" in paint) {
    return (
      <div className={c.ph} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={c.px} src={`/footer/draft/${paint.dir}/${file}.${paint.ext}`} alt="" width={256} height={256} />
      </div>
    );
  }
  const style = { "--src": `url(/footer/draft/${file}.webp)`, "--tile-ink": paint.ink, "--tile-bg": paint.bg } as CSSProperties;
  return <div className={c.ph} style={style} aria-hidden="true"><i /></div>;
}

function Quiet() {
  return (
    <div className={c.quiet}>
      <span>© 2026 Kyle Naranjo</span>
      <nav aria-label="Elsewhere">
        <a href="https://linkedin.com/in/kyle-naranjo">LinkedIn</a>
        <a href="https://github.com/teslakoile">GitHub</a>
        <a href="/Kyle-Naranjo-CV.pdf">CV</a>
      </nav>
    </div>
  );
}

/** 24 cells: 20 photo tiles plus the 4-cell sign-off in the middle row. */
function Wallpaper({ paints }: { paints: Paint[] }) {
  // photo numbers 1 to 12; the second pass is offset by 5 so a repeat never
  // lines up under its twin
  const tiles = Array.from({ length: 20 }, (_, i) => (i < 12 ? i : (i + 5) % 12) + 1);
  // paints step along rows and columns so neighbours differ (a checker for two)
  const paintAt = (i: number) => {
    const col = i % 8, row = Math.floor(i / 8);
    return paints[(col + row) % paints.length];
  };
  return (
    <>
      <Row>
        <div className={c.wall}>
          {tiles.map((n, i) => <Photo key={i} n={n} paint={paintAt(i < 10 ? i : i + 4)} />)}
          <div className={c.card}>
            <p className={c.cardLine}>For work, talks &amp; everything else</p>
            <a className={`${c.mail} ${c.cardMail}`} href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </div>
        </div>
      </Row>
      <Quiet />
    </>
  );
}

export default function WallpaperFooters() {
  return (
    <BrandRoot>
      <div id="top" style={{ padding: "40px 24px 80px", display: "grid", gap: 56 }}>
        {TREATMENTS.map((t) => (
          <section key={t.id} id={`option-${t.id}`} aria-label={t.label}>
            <p className={c.label}>{t.label}</p>
            <p className={c.note}>{t.note}</p>
            <Frame><footer><Wallpaper paints={t.paints} /></footer></Frame>
          </section>
        ))}
      </div>
    </BrandRoot>
  );
}
