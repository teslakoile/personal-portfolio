#!/usr/bin/env bash
# Builds the coral duotone hero portraits, the treatment on the Franky
# reference: the same photo printed as one halftone screen in two inks rather
# than in black.
#
# Three things separate these from portrait-halftone.png, which build.sh still
# produces untouched:
#   1. a coarser screen (pitch 20 vs 9). At the hero's 420px slot a pitch-9 dot
#      lands under 2px and the texture disappears; pitch 20 puts it at 4px,
#      which is where the reference reads.
#   2. denser dots (cover 1.05 vs 0.72). The flat plate tops out at 41% ink,
#      which is dark enough in black and merely pink in coral.
#   3. duotone.py, which reads tone back out of the plate's own coverage and
#      ramps it from pale orange through the site accent to a deep maroon.
#
# Output is WebP: the RGB varies per pixel here, which costs a PNG about 1.5 MB
# and a WebP about 200 KB, under the flat treatment's own PNG.
set -euo pipefail
cd "$(dirname "$0")"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

RUN="uv run --with pillow --with numpy python"
CROP=40,300,984,1180
CORAL='#ff9d5c,#f5482d,#5c1206'
INK='#a3968e,#4a3f38,#1c1917'

$RUN hero_real.py ../../public/hero/source.png subject-matte.png "$TMP/plate.png" \
  crop=$CROP bridge=bridge-mask.png bridge_keep=0.96 \
  scene_lift=0.88 falloff=0.88 suppress=0,505,340,800 suppress_lift=0.55 size=2100

# name  pitch  person-ink
build() {
  local name=$1 pitch=$2 person=${3:-}
  $RUN halftone.py "$TMP/plate.png" "$TMP/dots-$name.png" \
    size=2100 pitch="$pitch" circle=0 lo=0.04 hi=0.93 gamma=1.0 cover=1.05

  local duo=(duotone.py "$TMP/dots-$name.png" "$TMP/duo-$name.png"
             stops="$CORAL" pitch="$pitch")
  if [ -n "$person" ]; then
    duo+=(person=subject-matte.png person_stops="$person" crop=$CROP)
  fi
  $RUN "${duo[@]}"

  # floor 0.34, not build.sh's 0.68: the denser plate carries the bay on its
  # own, and the old floor turns it into a slab
  $RUN compose.py "$TMP/duo-$name.png" "$TMP/flat-$name.png" \
    crop=$CROP person=subject-matte.png bridge=bridge-mask.png \
    floor=0.34 gain=2.2 keep_rgb=1

  $RUN edge_fade.py "$TMP/flat-$name.png" "$TMP/fade-$name.png" \
    left=0.22 right=0.16 top=0.16 bottom=0.0 person=subject-matte.png crop=$CROP keep=0.95

  $RUN -c "from PIL import Image; Image.open('$TMP/fade-$name.png').save('../../public/hero/$name.webp', quality=90, method=6)"
  echo "wrote public/hero/$name.webp"
}

build portrait-coral      20
build portrait-coral-fine 14
build portrait-coral-split 20 "$INK"
