#!/usr/bin/env bash
# Builds the hero portrait with the Franky reference's ACTUAL effect, measured
# off the reference rather than guessed: a fine dot screen multiplied into a
# continuous-tone photograph. See dotscreen.py for what the measurements were.
#
# Two builds, each sized to the slot it renders in. The reference's dots measure
# 5 CSS px, so per slot: cells = slot / 5, and pitch = asset_width / cells.
#
#   file                        asset  slot   cells  pitch  dot on screen
#   portrait-screen.webp          800   262      52     15         4.9 px
#   portrait-screen-bleed.webp   1200   516     103     12         5.2 px
#
# Assets are only ~3x their CSS slot because this treatment is continuous tone
# and does not compress like flat ink: at 2100px the pair cost 1.7 MB.
#
# Unlike the halftone, a coarse screen costs no detail here. The photograph
# carries the picture and the dots are only texture, so his glasses survive at
# 52 cells across where the halftone has lost them by 105.
set -euo pipefail
cd "$(dirname "$0")"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
RUN="uv run --with pillow --with numpy python"
CROP=40,300,984,1180
STOPS='#fff2ea,#f5482d,#5c1206'

# tone first, exactly as the halftone build does, so the two are comparable
$RUN hero_real.py ../../public/hero/source.png subject-matte.png "$TMP/plate.png" \
  crop=$CROP bridge=bridge-mask.png bridge_keep=0.96 \
  scene_lift=0.88 falloff=0.88 suppress=0,505,340,800 suppress_lift=0.55 size=2100

# hero_real.py's CLI never parses size=, so it always writes a 1400px plate and
# halftone.py hides that by resampling. Nothing resamples here, so each build
# resamples the plate to its own target width first.
build() {
  local name=$1 size=$2 pitch=$3 fade_right=$4 fade_bottom=$5
  $RUN -c "
from PIL import Image
im = Image.open('$TMP/plate.png')
im.resize(($size, round($size*im.height/im.width)), Image.LANCZOS).save('$TMP/p-$name.png')"
  $RUN dotscreen.py "$TMP/p-$name.png" "$TMP/$name.png" \
    pitch="$pitch" amp=0.30 dot=0.42 stops="$STOPS"
  # the screened plate is opaque, so alpha has to come from its own ink weight
  $RUN -c "
from PIL import Image
import numpy as np
a = np.asarray(Image.open('$TMP/$name.png').convert('RGB')).astype(np.float32)
alpha = np.clip((250.0 - a.mean(axis=2)) / 26.0, 0, 1) * 255
Image.fromarray(np.dstack([a, alpha]).astype(np.uint8), 'RGBA').save('$TMP/$name-a.png')"
  $RUN edge_fade.py "$TMP/$name-a.png" "$TMP/$name-f.png" \
    left=0.22 right=$fade_right top=0.16 bottom=$fade_bottom \
    person=subject-matte.png crop=$CROP keep=0.95
  $RUN -c "
from PIL import Image
Image.open('$TMP/$name-f.png').save('../../public/hero/$name.webp', quality=78, method=6)"
  echo "wrote public/hero/$name.webp"
}

build portrait-screen        800 15 0.16 0.0
build portrait-screen-bleed 1200 12 0.0  0.0
