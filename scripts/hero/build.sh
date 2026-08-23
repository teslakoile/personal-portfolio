#!/usr/bin/env bash
# Rebuilds the home-page hero portrait from public/hero/source.png.
#
# Nothing here touches public/me.jpg or public/me-halftone.png — those stay as
# they were. The hero reads public/hero/portrait-halftone.png, which this
# script is the only producer of.
#
# The pipeline, in order:
#   1. hero_real.py  tone the plate: Kyle from his own range, the scene lifted,
#                    the bridge held back from that lift, Fort Point suppressed
#   2. halftone.py   round-dot screen, aspect-preserving
#   3. edge_fade.py  dissolve the PNG's outer boundary, with Kyle excluded so
#                    his shoulder does not fade where it meets the frame
set -euo pipefail
cd "$(dirname "$0")"
OUT=../../public/hero/portrait-halftone.png
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

RUN="uv run --with pillow --with numpy python"

$RUN hero_real.py ../../public/hero/source.png subject-matte.png "$TMP/plate.png" \
  crop=40,300,984,1180 bridge=bridge-mask.png bridge_keep=0.96 \
  scene_lift=0.88 falloff=0.88 suppress=0,505,340,800 suppress_lift=0.55 size=2100

$RUN halftone.py "$TMP/plate.png" "$TMP/dots.png" \
  size=2100 pitch=9 circle=0 lo=0.04 hi=0.93 gamma=1.0

$RUN compose.py "$TMP/dots.png" "$TMP/flat.png" \
  crop=40,300,984,1180 person=subject-matte.png bridge=bridge-mask.png floor=0.68 gain=2.2

$RUN edge_fade.py "$TMP/flat.png" "$OUT" \
  left=0.22 right=0.16 top=0.16 bottom=0.0 person=subject-matte.png crop=40,300,984,1180 keep=0.95

echo "wrote $OUT"
