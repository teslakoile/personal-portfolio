#!/usr/bin/env bash
# Builds the print-screen hero plates with franky_filter.py.
#
# The filter takes any photograph and any palette, so both subjects go through
# exactly the same call and differ only in what is fed to it.
#
# pitch is per slot, not universal: the reference's dots are 5px, so
#   pitch = plate_width / (display_width / 5)
# The bleed layout renders 516 CSS px, so an 819px plate wants pitch 8.
set -euo pipefail
cd "$(dirname "$0")"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
RUN="uv run --with pillow --with numpy python"
CROP=40,300,984,1180
PAL=${PALETTE:-ink4}          # the hero ships black; the icon carries the coral
PITCH_ARGS="pitch=22 amp=1.5 floor=0.54 ceil=0.94 transparent=1"

# --- the bridge: a generated Golden Gate tower, no cut-out needed ------------
# Source is tracked at public/hero/bridge-source.webp: it came out of
# gpt-image-2, and output/ is gitignored, so a clean clone needs its own copy.
$RUN -c "
from PIL import Image
im = Image.open('../../public/hero/bridge-source.webp').convert('RGB')
w = round(im.height*4/5)                      # .photoBleed is 4:5
im.crop((im.width-w, 0, im.width, im.height)).save('$TMP/bridge.png')"
$RUN franky_filter.py "$TMP/bridge.png" ../../public/hero/bridge-franky.webp \
  palette="$PAL" pitch=14 amp=1.5 floor=0.54 ceil=0.94 transparent=1 quality=80
echo "wrote public/hero/bridge-franky.webp"

# --- Kyle: tone the plate first, so the bay is held back and he is not ------
# competing with the scene. hero_real.py's CLI ignores size=, hence the resize.
$RUN hero_real.py ../../public/hero/source.png subject-matte.png "$TMP/plate.png" \
  crop=$CROP bridge=bridge-mask.png bridge_keep=0.96 \
  scene_lift=0.88 falloff=0.88 suppress=0,505,340,800 suppress_lift=0.55
$RUN -c "
from PIL import Image
im = Image.open('$TMP/plate.png')
im.resize((1200, round(1200*im.height/im.width)), Image.LANCZOS).save('$TMP/plate.png')"
$RUN franky_filter.py "$TMP/plate.png" ../../public/hero/portrait-hero-black.webp \
  palette=ink4 $PITCH_ARGS quality=80
$RUN franky_filter.py "$TMP/plate.png" ../../public/hero/portrait-hero-coral.webp \
  palette=coral4 $PITCH_ARGS quality=80
echo "wrote public/hero/portrait-hero-{black,coral}.webp"
