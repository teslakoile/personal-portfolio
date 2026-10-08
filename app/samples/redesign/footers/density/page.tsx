import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { BrandRoot, Frame, Row } from "../../../../_brand/kit";
import d from "./density.module.css";

/**
 * Wallpaper footer at different grid densities. Same 12 placeholder photos and
 * Duotone by default, so only the number and size of squares change; the
 * 16 x 6 grid is also shown with the dither, original, and four-ink looks. Photos are assigned
 * by (column x 5 + row x 7) mod 12, so a photo never touches its twin across
 * or down.
 */
export const metadata: Metadata = {
  title: "Footer Density | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const EMAIL = "kyle.naranjo@gmail.com";
/** How a tile is drawn: an image folder, or the halftone mask in a cycle of inks. */
type Look = { dir: string; ext: "png" | "webp" } | { inks: string[] };
const DUOTONE: Look = { dir: "fx-duotone", ext: "webp" };
const INKS = ["var(--b1)", "var(--b3)", "var(--b2)", "var(--b4)"];

type Variant = {
  id: string; label: string; note: string;
  cols: number; rows: number; row: number; gap: number;
  card: { col: number; row: number; cols: number; rows: number };
  big?: number[];          // tile indices that span 2 x 2
  colsM: number; rowM: number;
  look?: Look;
};

const VARIANTS: Variant[] = [
  { id: "d8", label: "8 × 3 · Current", note: "20 photo tiles at about 128px.",
    cols: 8, rows: 3, row: 128, gap: 6, card: { col: 3, row: 2, cols: 4, rows: 1 }, colsM: 4, rowM: 88 },
  { id: "d10", label: "10 × 4", note: "36 tiles at about 100px; the card takes a 4 × 2 block.",
    cols: 10, rows: 4, row: 100, gap: 6, card: { col: 4, row: 2, cols: 4, rows: 2 }, colsM: 5, rowM: 70 },
  { id: "d12", label: "12 × 5", note: "50 tiles at about 83px; the card takes a 6 × 2 block.",
    cols: 12, rows: 5, row: 83, gap: 5, card: { col: 4, row: 2, cols: 6, rows: 2 }, colsM: 6, rowM: 58 },
  { id: "d16", label: "16 × 6", note: "84 tiles at about 62px; a dense wallpaper.",
    cols: 16, rows: 6, row: 62, gap: 4, card: { col: 6, row: 3, cols: 6, rows: 2 }, colsM: 8, rowM: 44 },
  { id: "d16-dither", label: "16 × 6 · True-Color Dither", note: "The profile card's dither (Bold color, 1.5px square dots).",
    cols: 16, rows: 6, row: 62, gap: 4, card: { col: 6, row: 3, cols: 6, rows: 2 }, colsM: 8, rowM: 44, look: { dir: "color-sq3", ext: "png" } },
  { id: "d16-plain", label: "16 × 6 · Original", note: "The photos as taken, no effect.",
    cols: 16, rows: 6, row: 62, gap: 4, card: { col: 6, row: 3, cols: 6, rows: 2 }, colsM: 8, rowM: 44, look: { dir: "fx-plain", ext: "webp" } },
  { id: "d16-inks", label: "16 × 6 · Colored Palette", note: "The bridge halftone in the four palette inks (b1 to b4), stepping along the diagonals.",
    cols: 16, rows: 6, row: 62, gap: 4, card: { col: 6, row: 3, cols: 6, rows: 2 }, colsM: 8, rowM: 44, look: { inks: INKS } },
  { id: "mix", label: "12 × 5 · Mixed", note: "The 12 × 5 grid with four 2 × 2 tiles for rhythm.",
    cols: 12, rows: 5, row: 83, gap: 5, card: { col: 4, row: 2, cols: 6, rows: 2 }, big: [0, 9, 20, 27], colsM: 6, rowM: 58 },
];

function Quiet() {
  return (
    <div className={d.quiet}>
      <span>© 2026 Kyle Naranjo</span>
      <nav aria-label="Elsewhere">
        <a href="https://linkedin.com/in/kyle-naranjo">LinkedIn</a>
        <a href="https://github.com/teslakoile">GitHub</a>
        <a href="/Kyle-Naranjo-CV.pdf">CV</a>
      </nav>
    </div>
  );
}

function Wall({ v }: { v: Variant }) {
  const cardCells = v.card.cols * v.card.rows;
  const bigExtra = (v.big?.length ?? 0) * 3;            // a 2 x 2 tile fills 4 cells
  const count = v.cols * v.rows - cardCells - bigExtra;
  // phones: whole rows only, at most six rows of tiles (big tiles count 4)
  const mCells = Math.min(v.colsM * 6, Math.floor((count + bigExtra) / v.colsM) * v.colsM);
  const weights = Array.from({ length: count }, (_, i) => (v.big?.includes(i) ? 4 : 1));
  const onPhone = weights.map((_, i) => weights.slice(0, i + 1).reduce((a, w) => a + w, 0) <= mCells);
  const style = {
    "--cols": v.cols, "--row": `${v.row}px`, "--gap": `${v.gap}px`,
    "--card-col": v.card.col, "--card-row": v.card.row, "--card-cols": v.card.cols, "--card-rows": v.card.rows,
    "--cols-m": v.colsM, "--row-m": `${v.rowM}px`,
  } as CSSProperties;
  return (
    <div className={d.wall} style={style}>
      {Array.from({ length: count }, (_, i) => {
        const col = i % v.cols, row = Math.floor(i / v.cols);
        const n = ((col * 5 + row * 7) % 12) + 1;
        const file = `life-${String(n).padStart(2, "0")}`;
        const look = v.look ?? DUOTONE;
        return (
          <div key={i} className={`${d.tile} ${v.big?.includes(i) ? d.big : ""} ${onPhone[i] ? "" : d.desk}`} aria-hidden="true">
            {"inks" in look ? (
              <i style={{ "--src": `url(/footer/draft/${file}.webp)`, "--tile-ink": look.inks[(col + row) % look.inks.length] } as CSSProperties} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/footer/draft/${look.dir}/${file}.${look.ext}`} alt="" width={256} height={256} loading="lazy" />
            )}
          </div>
        );
      })}
      <div className={d.card}>
        <p className={d.cardLine}>For work, talks &amp; everything else</p>
        <a className={d.cardMail} href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </div>
    </div>
  );
}

export default function DensityFooters() {
  return (
    <BrandRoot>
      <div id="top" style={{ padding: "40px 24px 80px", display: "grid", gap: 56 }}>
        {VARIANTS.map((v) => (
          <section key={v.id} id={`option-${v.id}`} aria-label={v.label}>
            <p className={d.label}>{v.label}</p>
            <p className={d.note}>{v.note}</p>
            <Frame><footer><Row><Wall v={v} /></Row><Quiet /></footer></Frame>
          </section>
        ))}
      </div>
    </BrandRoot>
  );
}
