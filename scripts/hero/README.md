# Hero portrait

The home-page hero image. Everything here exists so the portrait can be
rebuilt without touching `public/me.jpg` or `public/me-halftone.png`, which are
left exactly as they were.

    ./build.sh

reads `public/hero/source.png` and writes `public/hero/portrait-halftone.png`,
the only file the page loads.

## Inputs

| File | What it is |
|---|---|
| `../../public/hero/source.png` | the graded photo, 1024x1536 |
| `subject-matte.png` | Kyle's alpha, from `rembg` u2net_human_seg |
| `bridge-mask.png` | the bridge structure, keyed on international orange, largest connected component, Fort Point cut out |

## Stages

1. `hero_real.py` — tone. Kyle is stretched over his own pixel range so the
   jacket opens without losing his face; the scene is lifted toward paper; the
   bridge is held back from that lift so it stays legible; Fort Point gets an
   extra lift because dark brick otherwise prints as a block.
2. `halftone.py` — round-dot screen at pitch 9 on a 2100px base. Aspect is
   derived from the plate, never forced square.
3. `compose.py` — weights the dots by region: Kyle, then bridge, then a floor
   for everything else.
4. `edge_fade.py` — ramps alpha to zero at the frame edges so the PNG has no
   visible boundary. Kyle is excluded, or his shoulder dissolves where it meets
   the right edge.

## Tuning

The numbers that matter are in `build.sh`. `scene_lift` and `floor` trade scene
detail against calm; `bridge_keep` and `gain` set how far the bridge sits above
the rest; `pitch` is dot size; the `edge_fade` fractions are how far in each
edge dissolves.
