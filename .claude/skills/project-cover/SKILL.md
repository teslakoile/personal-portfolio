---
name: project-cover
description: Make or change a project cover, the image tile above each card in the Projects section (a small product UI on a soft generated ground). Use this whenever a project is added to app/_brand/sections/projectsData.ts, a product is renamed or its UI has changed, or Kyle asks for a cover, thumbnail, tile, preview image, or "demo" style screenshot for a project, even if he does not say "cover". Read it before touching scripts/covers, COVERS_REDESIGN in Projects.tsx, or public/projects/covers.
---

# Project covers

A cover is two images stacked in CSS: a generated ground (`bg-<name>.webp`) and, centred on it, one UI piece that shows the single thing the product is known for. Every piece is drawn twice: `r-<name>.webp` for a wide tile (467px, two cards across) and `r-<name>-n.webp` for a narrow one (303px, three across, which is what the landing page shows; a phone uses the narrow piece too). The six shipped covers took eight rounds with Kyle to get right. This file records what he accepted, so a seventh cover matches them on the first try.

Look at the current set before you start, so you know the target:

```bash
node scripts/covers/shot.mjs --base http://localhost:<port>
node scripts/covers/shot.mjs --base http://localhost:<port> --on covers,wide --out output/covers/tiles-wide
```

The first renders the landing page (narrow pieces), the second the two-across option (wide pieces). Open each `sheet.png` with the Read tool. (`npm run dev` first if no dev server is running; AGENTS.md covers that.)

## Where things are

| Thing | Path |
|---|---|
| Cover config: ground, piece, width | `COVERS_REDESIGN` in `app/_brand/sections/Projects.tsx` |
| The drawn pieces, one element each | `scripts/covers/pieces.html` |
| A piece drawn on a live page | `scripts/covers/wishlist-live.mjs` |
| Ground generator | `scripts/covers/grounds.py` |
| Capture, export, render | `scripts/covers/capture.mjs`, `export.py`, `shot.mjs` |
| Shipped images | `public/projects/covers/` |
| Tile CSS | `.projCover` and `.coverStack` in `app/_brand/sections/sections.module.css` |
| Where covers render | `/` (three across), and `/samples/polished/options?on=covers,wide` (two across) |

`COVERS` in `Projects.tsx` is an earlier set that scaled real screenshots down. Kyle keeps it as a fallback (`/samples/polished/options?on=covers,fallback`). Do not extend it; new covers go in `COVERS_REDESIGN`.

## The standard

Each rule here came from a round Kyle rejected. The reason is given so you can judge cases the rule does not name.

- **One hero UI, chosen before anything is drawn.** Ask what the product is known for and show that: Zervo's card that asks staff to confirm before the assistant writes, not a settings fragment. A tidy fragment of the wrong screen was called a "terrible representation".
- **Drawn for the tile, not scaled down to it.** A real screen shrunk to a 467px tile puts its text at 7px. Redraw the one feature at tile size with few, large elements, so text shows at 10px or more. Kyle: "feel free to even redesign".
- **The product's own look and words.** Use its fonts, colour tokens, logo, and real strings, taken from the product as it is today. The layout may be new. Records are made up and plainly fictional. Nothing from confidential client work, ever.
- **One piece, centred, with clear ground on every side.** Nothing overlaps another element, nothing is cut by the tile, and no loose chip or badge floats beside the piece. Two or three overlapping screenshots read as "cluttered".
- **No mascot, sprite, or character art** beside clean UI, and no photo with a face. Both pull the eye away from the UI.
- **A calm ground with a few clearly separate soft shapes**, in a colour that sets the UI off. It does not have to be the product's colour. No objects, patterns, or photographic texture ("way too stylized"), and not one even gradient ("too uniform").
- **One family.** Every wide piece is about 73% of its tile's height and every narrow piece about 76%, so tops and bottoms line up across a row. Same corner radius and shadow, which the CSS already applies.

## Workflow

### 1. Pick the feature

Read the project's entry in `projectsData.ts`. Its `about` and `tech` lines say what makes the product stand out; the cover should show that sentence. If two features compete, say which you chose and why when you show the result.

### 2. Get the product's current look

A cover from an old screenshot shows a product that no longer exists. On 2026-11-27 one local checkout was 167 commits behind its remote.

- In the product's repo, run `git fetch`, then read files with `git show origin/main:<path>`. Do not pull or check out in Kyle's other repos; they often hold staged work. Do not read `.env` files.
- Find the component for the feature, its CSS, its design tokens, and realistic example data. Unit tests are a good source of example strings.
- If the product has a public page, load it in Playwright and read fonts, colours, and markup from the live DOM.
- Use the logo already in `public/projects/marks/`.

### 3. Draw the piece

Add one element to `scripts/covers/pieces.html` with `data-piece="r-<name>"`, its own class prefix, and a comment naming the source files. Read two existing pieces in that file first; they are the reference for scale.

- Draw at about 300 to 370 CSS px wide and 205 to 225 px tall. That is the size it shows at, so judge the type at 100%.
- Body text 10 to 12px, a title 12.5 to 15px, nothing under 9.5px.
- About five elements: for example a header, one request, one result, one action. If it needs a sixth, a different feature may be the better choice.
- One solid accent colour in the piece, on the element the product wants pressed.
- No truncated text and no wrapped label. Shorten the made-up content instead.
- Use the product's sentence case and labels. Avoid all-caps labels where the product allows it.

If the product has a public live page with real content worth showing (as Wishlist does), draw the piece on that page instead: copy `wishlist-live.mjs`, replace the page body with your markup, and reuse the page's fonts, tokens, icons, and images. Wait for a stable element such as a button label, not for item text: the content changes between days. List every difference from the real page at the top of the script.

Then draw the narrow piece as a second element, `data-piece="r-<name>-n"`, with the wide piece's classes plus one modifier class that overrides sizes (see the "Narrow pieces" block of the stylesheet). It is a separate drawing, not a scaled copy: at 303px a scaled wide piece puts its text at 7px.

- Draw at about 230 to 265 CSS px wide and 144 to 150 px tall.
- Keep the type at 10 to 12.5px and cut elements until it fits: about three or four elements.
- Keep the cue that carries the point of the product, even if it costs the wordmark. A first narrow Zervo dropped "Zervo AI" and read as an ordinary edit dialog; a first narrow Leafmark dropped "Not sure between these." and its scores read as progress bars. Both cues went back in.
- Use free horizontal space before vertical space: put a label and its value on one line.
- Say in the CSS comment what the narrow piece leaves out.

Capture and look at both:

```bash
node scripts/covers/capture.mjs --only r-<name>
node scripts/covers/capture.mjs --only r-<name>-n
```

Open `output/covers/r-<name>-4x.png` and `r-<name>-n-4x.png`, and fix what you see before going on.

### 4. Make the ground

Add one `ground(...)` line to `G` in `scripts/covers/grounds.py`, with a new seed in `SEEDS`, then run it. The existing seeds reproduce the existing files exactly, so the other grounds do not change.

```bash
python3 scripts/covers/grounds.py
python3 scripts/covers/grounds.py <name>=12   # another arrangement of the same colours
```

- Four colour stops in one hue, light to deep; one stop may lean into a second hue.
- Pick a hue no neighbouring tile uses.
- For a white or pale piece, set `centre` (0.4 to 0.6) so the middle of the ground is deep. A pale shape behind a pale card's edge makes the edge vanish.
- Try three or four seeds and keep the one with clearly separate shapes.

### 5. Register and export

Add the project to `COVERS_REDESIGN`, keyed by its exact `name` in `projectsData.ts`:

```ts
"New Project": { ground: "new-project", tone: "#<mid colour of the ground>", w: 64, wn: 80, pieces: [{ file: "r-new-project", narrow: "r-new-project-n" }] },
```

- `w` is the piece's width as a percent of the tile. Choose it so the piece is 72% to 74% of the tile's height: `w = 213 / drawn height * drawn width / 467 * 100`.
- `wn` is the narrow piece's width as a percent of a narrow tile. Choose it so the piece is 75% to 77% of that tile's height: `wn = 143 / drawn height * drawn width / 303 * 100`.
- Add `flat: true` when the piece has more than one part with its own corners and transparent gaps. Its shadow then follows its outline, and the CSS does not round it. Use `flat: "wide"` when only the wide drawing is like that (see Leafmark).
- A piece with photos goes in `PHOTO` in `export.py`; everything else is saved lossless, because lossy WebP smears small coloured text.
- Keep `w`, `wn`, `file`, and `narrow` on one line in that order: `export.py` reads them from this file.

```bash
python3 scripts/covers/export.py
```

`export.py` saves the wide piece at 2x of a 467px tile and the narrow piece at 3.45x of a 303px tile, which is 3x of the 348px tile a phone shows. It warns when a wide piece is outside 68% to 76% of its tile's height, or a narrow one outside 72% to 78%. Change the width or the drawing until neither warns.

### 6. Render and check

```bash
node scripts/covers/shot.mjs --base http://localhost:<port>
node scripts/covers/shot.mjs --base http://localhost:<port> --width 390 --out output/covers/tiles-phone
node scripts/covers/shot.mjs --base http://localhost:<port> --on covers,wide --out output/covers/tiles-wide
```

The landing page, a phone, and the two-across option. Each prints the piece's margins: top and bottom should be 12% to 14%, like the others. Open each `sheet.png` and compare the new tile with its neighbours for size, weight, and text size.

### 7. Have a fresh agent review it

Kyle asked for this on every round, and it finds real defects: on the first draft of this set it caught smeared text, a fill edge cutting through a label, and a badge covering part of a photo.

Spawn a general-purpose subagent with: the standard above (point it at this file), the sheet and the individual tile PNGs, one line on what the product is, and a request for concrete visual defects with the element named, plus a ranked list of fixes. Do not tell it what you think of the result. Apply the fixes you agree with, and say which you did not apply and why.

### 8. Show Kyle

Send the 2x sheets and the Projects section itself (`npm run shot -- / --selector "#projects"`), never a description alone. With it, list what differs from the real product: the new layout, shortened names, made-up records, any state that is not real. He accepts invented demo content when it is named.

Before calling it done: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Defects that already happened

Check for these before the review; each one cost a round.

- **Soft or smeared text.** Lossy WebP, or an image shown larger than it was exported. Export after every change to `w` or `wn`, and keep a piece out of `PHOTO` unless it is mostly photos.
- **A smaller piece in the first column.** The first column of the grid is 16px narrower than the others. The CSS sizes a piece from the tile's height (`cqh`) for that reason; do not size anything in `.coverStack` from the tile's width.
- **Gaps in terminal tables.** Box-drawing characters leave seams between rows. Draw the table with 1px CSS borders and keep the monospace font for the text.
- **Uneven photo tiles.** A photo with a white background disappears into a white card. Put photos in a tinted frame with `mix-blend-mode: multiply`, and position the image absolutely so its natural size cannot stretch the frame.
- **A label that wraps badly.** Break it yourself with `<br>`; `text-wrap: balance` picked the worse break.
- **A wide hyphen in Inter.** `font-variant-numeric: tabular-nums` on a whole card widens the hyphen in a code like "LAB-CBC". Apply it to the number cells only.
- **A decoration that crosses text.** A progress fill behind a label, or a "now" line across a schedule, ends inside a word. Put the indicator beside the text.
- **Pale tints on a saturated ground.** A board of 15% tints reads as an empty white card. Use the product's solid colours.
- **Tiny sprites.** Game or mascot art at 20px reads as a blob. Use plain UI: initials, dots, a segmented bar.
- **A waiting script that hangs.** The live page's content changed. Wait for a stable control.

## Layouts the covers do not suit

On a tablet between about 768 and 1100px wide the page shows two cards across and a tile is 160 to 300px wide, so the narrow piece's text falls to 5 to 9px. The covers read as thumbnails there. That is the grid's width, not a cover defect; do not shrink the drawings further to chase it.
