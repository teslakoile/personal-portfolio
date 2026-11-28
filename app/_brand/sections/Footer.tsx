import { Row } from "../kit";
import { DitherRule } from "../DitherRule";
import { FooterTile } from "./FooterTile";
import { FooterWall } from "./FooterWall";
import f from "./footer.module.css";

/**
 * Site footer: everyday photos in an 8 x 3 grid around the email. Tiles rest
 * as four-ink halftones (the bridge's filter, painted with b1 to b4 along the
 * diagonals). A click opens the original photo in a circle from the click
 * point; with a mouse on the desktop grid the wall is drawn in WebGL and the
 * halftone also swells like a lens under the mouse (FooterWall). Photos are built by
 * scripts/hero/build-collage.sh from a curated folder: public/footer/draft/
 * life-NN.webp is the halftone mask, fx-plain/life-NN.webp the original.
 * The 12 there now are placeholders; Kyle curates the final set.
 */

const EMAIL = "kyle.naranjo@gmail.com";
const PHOTOS = 12;
const INKS = ["var(--b1)", "var(--b3)", "var(--b2)", "var(--b4)"];
const COLS = 8;

/** 20 tiles around the 4-cell card; the second pass is offset by 5 so a photo
    never lands next to or under its twin. Card cells (row 2, cols 3 to 6) are
    skipped when counting positions, so inks still step along true diagonals. */
const TILES = Array.from({ length: 20 }, (_, i) => {
  const cell = i < 10 ? i : i + 4;
  const col = cell % COLS, row = Math.floor(cell / COLS);
  return { n: (i < PHOTOS ? i : (i + 5) % PHOTOS) + 1, ink: INKS[(col + row) % INKS.length] };
});

/** Wall tones for the options on /samples/polished/options. "dark" puts each
    tile in the two colours of a Career Highlights card: the card's dark
    ground where the photo is dark, its tint where the photo is light. "mid"
    is halfway between that and the shipped wall (the ink on paper): each
    colour is the average of the two. */
export type FooterTone = "light" | "mid" | "dark";
const HEX: Record<string, string> = { "var(--b1)": "#f26a4b", "var(--b3)": "#86a9c8", "var(--b2)": "#7fb99a", "var(--b4)": "#e9b65c" };
const GROUND: Record<string, string> = { "var(--b1)": "#9e2a16", "var(--b3)": "#2c4a66", "var(--b2)": "#2f6b4f", "var(--b4)": "#7a4e0c" };
const PAPER = "#faf9f7";
const mid = (a: string, b: string) =>
  "#" + [1, 3, 5].map((i) => Math.round((parseInt(a.slice(i, i + 2), 16) + parseInt(b.slice(i, i + 2), 16)) / 2).toString(16).padStart(2, "0")).join("");
const DARK_TILES = TILES.map((t) => ({ n: t.n, ink: GROUND[t.ink], bg: HEX[t.ink] }));
const MID_TILES = TILES.map((t) => ({ n: t.n, ink: mid(HEX[t.ink], GROUND[t.ink]), bg: mid(PAPER, HEX[t.ink]) }));

function Contact() {
  return (
    <>
      <p className={f.cardLine}>For work, talks &amp; everything else</p>
      <a className={f.cardMail} href={`mailto:${EMAIL}`}>{EMAIL}<DitherRule /></a>
    </>
  );
}

/** Phone layout (under 760px): "strip" swipes one row of large tiles,
    "rows" shows two rows of four, "drift" scrolls one row slowly by itself.
    On every phone layout the email comes first, above the photos. */
export type FooterMobile = "strip" | "rows" | "drift";
const MOBILE = { strip: f.strip, rows: f.rows, drift: f["drift-on"] };

/** `fullView` (on by default): an open photo gets an expand button that grows
    it to a large view (FooterPhotoView). Off, the footer is the wall alone. */
export function Footer({ mobile = "strip", fullView = true, tone = "light" }: { mobile?: FooterMobile; fullView?: boolean; tone?: FooterTone }) {
  const tiles: { n: number; ink: string; bg?: string }[] = tone === "dark" ? DARK_TILES : tone === "mid" ? MID_TILES : TILES;
  return (
    <footer className={MOBILE[mobile]}>
      <Row>
        <div className={f.mCard}><Contact /></div>
        <FooterWall tiles={tiles}>
          {tiles.map((t, i) => <FooterTile key={i} {...t} i={i} fullView={fullView} />)}
          <div className={f.card}><Contact /></div>
        </FooterWall>
        {mobile === "drift" ? (
          <div className={f.drift}>
            <div className={f.track}>
              {[...tiles, ...tiles].map((t, i) => <FooterTile key={i} {...t} fullView={fullView} />)}
            </div>
          </div>
        ) : null}
      </Row>
      <div className={f.quiet} data-kyllm-avoid="wide">
        <span>© 2026 Kyle Naranjo</span>
        <nav aria-label="Elsewhere">
          <a href="https://linkedin.com/in/kyle-naranjo">LinkedIn</a>
          <a href="https://github.com/teslakoile">GitHub</a>
          <a href="/Kyle-Naranjo-CV.pdf">CV</a>
        </nav>
      </div>
    </footer>
  );
}
