import { Row } from "../kit";
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

function Contact() {
  return (
    <>
      <p className={f.cardLine}>For work, talks &amp; everything else</p>
      <a className={f.cardMail} href={`mailto:${EMAIL}`}>{EMAIL}</a>
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
export function Footer({ mobile = "strip", fullView = true }: { mobile?: FooterMobile; fullView?: boolean }) {
  return (
    <footer className={MOBILE[mobile]}>
      <Row>
        <div className={f.mCard}><Contact /></div>
        <FooterWall tiles={TILES}>
          {TILES.map((t, i) => <FooterTile key={i} {...t} i={i} fullView={fullView} />)}
          <div className={f.card}><Contact /></div>
        </FooterWall>
        {mobile === "drift" ? (
          <div className={f.drift}>
            <div className={f.track}>
              {[...TILES, ...TILES].map((t, i) => <FooterTile key={i} {...t} fullView={fullView} />)}
            </div>
          </div>
        ) : null}
      </Row>
      <div className={f.quiet}>
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
