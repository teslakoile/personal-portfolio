#!/usr/bin/env bash
# Builds the footer collage photos: every image in a folder goes through the
# profile card's dither (bayer_mask.py, an 8x8 Bayer screen in square cells,
# transparent where nothing prints), so the page can tint them with the ink
# tokens through a CSS mask.
#
#   ./scripts/hero/build-collage.sh ~/path/to/curated-photos
#
# Writes public/footer/draft/life-01.webp, life-02.webp, ... in name order,
# replacing what is there (the halftone masks the footer tints with b1 to b4),
# plus each original, square-cropped, in public/footer/draft/fx-plain/ (what a
# tile shows on hover). The collage reads up to 12. Photos are resized to
# 720px on the long side first, so a 6px cell lands at 1 CSS px in a tile.
set -euo pipefail
SRC=${1:?usage: build-collage.sh <folder of photos>}
cd "$(dirname "$0")"
OUT=../../public/footer/draft
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
RUN="uv run --with pillow --with numpy python"
mkdir -p "$OUT"
mkdir -p "$OUT/fx-plain"
rm -f "$OUT"/life-*.webp "$OUT"/fx-plain/life-*.webp
n=0
find "$SRC" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) | sort | while read -r f; do
  n=$((n + 1)); name=$(printf 'life-%02d' "$n")
  $RUN -c "
from PIL import Image, ImageOps
im = ImageOps.exif_transpose(Image.open('''$f''')).convert('RGB')
im.thumbnail((720, 720), Image.LANCZOS)
im.save('$TMP/$name.png')"
  $RUN bayer_mask.py "$TMP/$name.png" "$OUT/$name.webp" size=720 cell=6 quality=80
  $RUN footer_effects.py plain "$TMP/$name.png" "$OUT/fx-plain/$name.webp"
  echo "wrote $OUT/$name.webp from $(basename "$f")"
done
