# Hero portrait

The home-page hero image. Everything here exists so the portrait can be
rebuilt without touching `public/me.jpg` or `public/me-halftone.png`, which are
left exactly as they were.

    ./build.sh

reads `public/hero/source.png` and writes `public/hero/portrait-halftone.png`,
the file the landing page loads today.

    ./build-duotone.sh

writes the three coral halftone treatments compared at
`/samples/rework/hero-portrait`.

    ./build-screen.sh

writes the two dot-screen treatments, which are the Franky reference's actual
effect rather than a halftone. Measured off the reference: a constant 5px
axis-aligned lattice, a continuous-tone photograph underneath (190k unique
colours, cell contrast that never collapses at the tone extremes the way
ink-on-paper does), and one dark dot per cell at about 20 levels. Recovering
the reference's own base and re-screening it lands within 8.5 levels of it,
against 20.7 for the halftone. See `dotscreen.py`.

    ./build-franky.sh              # PALETTE=blue ./build-franky.sh to recolour
    franky_filter.py SRC OUT pitch=N palette=coral

is the reference's treatment, in three stages that are deliberately separate:

1. `prepare`, discard the source's colour, flatten surfaces with a median (not
   a gaussian, which softens the edges as well as the surfaces), and normalise
   levels from percentiles so any photograph lands on the same rungs.
2. `dither`, a sine-screen ordered dither that quantises tone to N rungs.
3. `paint`, rung index straight to an ink from a named palette.

Because colour is discarded in stage 1 and chosen in stage 3, the source's own
colour never reaches the output: the same call gives coral, ink, blue, forest
or plum from the same frame, and a grey photograph comes out as coral just as
readily as an orange one. Add a palette to `PALETTES` to get another.

`public/hero/bridge-franky.webp` is a Golden Gate tower generated with
`gpt-image-2`; `portrait-franky.webp` is Kyle through the identical call.

    uv run --with pillow --with numpy python build_brand.py

builds the shipped icons and the share-image photo. Icons are Kyle in brand ink
`#1c1917` on brand cream `#faf9f7`, no dither: `app/favicon.ico` (16/32/48,
saved RGBA and checked, since Turbopack rejects anything else),
`app/icon.png` (512), `app/apple-icon.png` (180), and
`public/icons/{icon-192,icon-512,maskable-512}.png` for `app/manifest.ts`.
`icon.png` has to match the favicon: Chrome on a Retina screen draws the tab
from the 512 PNG. The share-image photo, `app/_og/kyle-card.png`, is the hero
card, read by `app/opengraph-image.tsx`: Kyle in true colour over a dither of
the photo in its own colours on cream (red bridge, blue-green water), 3px
cells, 8x8 Bayer. The sky is a soft cloudy blue: the bridge cables are folded
into it by closing the sky mask (they are 1-2 cells wide, the reddish towers
and deck are kept), and the cloud tone mixes the true sky's broad light
(blurred about 10 cells, sampled from sky cells only) with fixed-seed noise.
Sharper cloud detail brings the cable lines back, so it stays broad.

It uses `subject-matte-birefnet.png`, rembg `birefnet-general-lite` run on the
2048x3072 master and downscaled to `source.png`. The u2net matte below leaves a
grey-blue sky halo round the hair and hood; this one, choked 1px with the edge
colours pulled from the subject, does not. Every crop anchors on the head, not
the figure.

The earlier coral-screened icons still build with

    ./build-icon.sh                 # PALETTE=ink4 for the black and white variant

builds the site icons from the same filter: `app/icon.png`, `apple-icon.png`
and `favicon.ico`. Two preprocessing steps do the work before the screen. The
square crop is derived from the subject matte (the neck is where the silhouette
widens past 1.4x the head's own median width, and the box centres on the HEAD's
x-extent, because the figure's centroid sits at the shoulders and pulls the crop
off-centre). Then the background is lifted 55% toward paper through that same
matte, so the bridge and the bay recede and he carries the frame.

Pitch scales per size to hold about 50 cells, so every icon has the same dot
texture. One render downscaled would not: downsampling a dither blends its inks,
which took a 2-colour file to 233 colours at 32px.

`pitch` is the one number that does not transfer. The reference's dots measure
5px, so set it per slot: `pitch = plate_width / (display_width / 5)`.

Nothing on the landing page loads any of these until a pick lands.

## Inputs

| File | What it is |
|---|---|
| `../../public/hero/source.png` | the graded photo, 1024x1536, downscaled from a 2048x3072 master (`~/Desktop/Pics/portrait-retouched/kyle-sf-portrait-og.png`). Built in steps: the hair (soft, loosely flowing, a few pieces on the forehead) from `gpt-image-2` edits; a sharp overcast background from a `gpt-image-2` render referenced on a real Fort Point photo; the streaky water left of his face replaced with real ripples from the right side of the same rows; the side hair darkened about 25% by a multiply filter limited to neutral hair pixels above the ears; and a light Gaussian blur (sigma 1.2 at 2048x3072) on the background, faded to zero within about 60 px of him. The blur is a filter, not generated, so it hides the AI texture without leaving an outline. The earlier combed, glossy hair read as AI at the hero's scale. |
| `subject-matte.png` | Kyle's alpha, from `rembg` u2net_human_seg on the current `source.png` |
| `subject-matte-birefnet.png` | Kyle's alpha, from `rembg` birefnet-general-lite on the 2048x3072 master, downscaled to `source.png`; used by `build_brand.py` |
| `bridge-mask.png` | the bridge structure, keyed on international orange, largest connected component, Fort Point cut out |

## Stages

1. `hero_real.py`, tone. Kyle is stretched over his own pixel range so the
   jacket opens without losing his face; the scene is lifted toward paper; the
   bridge is held back from that lift so it stays legible; Fort Point gets an
   extra lift because dark brick otherwise prints as a block.
2. `halftone.py`, round-dot screen at pitch 9 on a 2100px base. Aspect is
   derived from the plate, never forced square.
3. `compose.py`, weights the dots by region: Kyle, then bridge, then a floor
   for everything else.
4. `edge_fade.py`, ramps alpha to zero at the frame edges so the PNG has no
   visible boundary. Kyle is excluded, or his shoulder dissolves where it meets
   the right edge.

`build-duotone.sh` inserts one more stage between 2 and 3:

- `duotone.py`, colour. A halftone stores tone as dot area, so blurring the
  plate's own alpha over about one cell reads that tone back out, and the value
  indexes a colour ramp: sparse dots take pale orange, dense dots a deep
  maroon, the accent sits in the middle. Only RGB is written, so the geometry
  carries through untouched. `compose.py keep_rgb=1` then leaves those inks
  alone instead of flattening every dot to one black.

## Why the duotone build uses different numbers

| Setting | Flat | Duotone | Why |
|---|---|---|---|
| `pitch` | 9 | 20 (14 for the fine variant) | the hero slot is 262px wide, so a pitch-9 dot lands at 1.1px and the screen stops being visible. Pitch 20 puts it at 2.5px. Past 20 his glasses stop resolving. |
| `cover` | 0.72 | 1.05 | the flat plate tops out at 41% ink, which is dark in black and merely pink in coral. Denser dots reach 84%. |
| `floor` | 0.68 | 0.34 | the denser plate carries the bay on its own; the old floor turns it into a slab. |
| format | PNG | WebP | duotone RGB varies per pixel, which costs a PNG about 1.5 MB. WebP at the same 2100px is about 200 KB, under the flat treatment's own PNG. |

## Tuning

The numbers that matter are in `build.sh`. `scene_lift` and `floor` trade scene
detail against calm; `bridge_keep` and `gain` set how far the bridge sits above
the rest; `pitch` is dot size; the `edge_fade` fractions are how far in each
edge dissolves.
