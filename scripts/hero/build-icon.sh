#!/usr/bin/env bash
# Builds the site icons: Kyle's portrait, screened in coral.
#
# Two preprocessing steps happen before the screen, and both matter:
#   1. a square crop derived from the subject matte rather than hand-picked, so
#      it lands the same way on any photo of him. The neck is where the
#      silhouette widens past 1.4x the head's own median width; the box is
#      headroom above the crown, down through the shoulders, centred on the
#      HEAD's x-extent (the figure's centroid sits at the shoulders and pulls
#      the crop off-centre).
#   2. the background lifted 55% toward paper through that same matte, so the
#      bridge and the bay recede and he carries the frame. Without it the icon
#      is a busy square and nothing reads at 32px.
#
# Pitch is scaled per size to hold ~50 cells, so every icon has the same dot
# count and therefore the same texture, rather than one render downscaled.
set -euo pipefail
cd "$(dirname "$0")"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
RUN="uv run --with pillow --with numpy python"
PAL=${PALETTE:-coral4}
LIFT=${LIFT:-0.55}

$RUN - "$TMP" "$LIFT" <<'PY'
import sys
import numpy as np
from PIL import Image, ImageFilter
tmp, lift = sys.argv[1], float(sys.argv[2])
src_im = Image.open("../../public/hero/source.png").convert("RGB")
matte = Image.open("subject-matte.png").convert("L")
on = np.asarray(matte).astype(np.float32) / 255 > 0.5

rows = on.sum(1); ys = np.where(rows > 0)[0]; top = ys[0]
band = rows[top + 30:top + 230]
head_w = float(np.median(band[band > 0]))
neck = next(y for y in range(top + 60, ys[-1]) if rows[y] > head_w * 1.4)
hh = neck - top
hx = np.where(on[top:neck].any(0))[0]
cx = (hx[0] + hx[-1]) // 2

HEAD_FRAC, TOP_FRAC, CX_FRAC = 0.38, 0.27, 0.46
s = min(int(hh / HEAD_FRAC), src_im.width, src_im.height)
x0 = int(np.clip(cx - s * CX_FRAC, 0, src_im.width - s))
y0 = int(np.clip(top - s * TOP_FRAC, 0, src_im.height - s))
box = (x0, y0, x0 + s, y0 + s)              # square by construction

a = np.asarray(src_im.crop(box)).astype(np.float32) / 255
m = matte.crop(box).filter(ImageFilter.GaussianBlur(2))
m = (np.asarray(m).astype(np.float32) / 255)[..., None]
out = (a * (1 - lift) + lift) * (1 - m) + a * m
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(f"{tmp}/base.png")
print(f"crop {box} -> {s}x{s}, background lifted {lift:.0%}")
PY

emit() {                                     # size, pitch, destination
  $RUN -c "
from PIL import Image
Image.open('$TMP/base.png').resize(($1,$1), Image.LANCZOS).save('$TMP/b$1.png')"
  $RUN franky_filter.py "$TMP/b$1.png" "$3" \
    palette="$PAL" pitch=$2 ss=1 amp=1.5 floor=0.30 ceil=0.94 transparent=1
  echo "wrote $3"
}
emit 256 5 ../../app/icon.png
emit 180 4 ../../app/apple-icon.png

# favicon.ico carries the small legacy sizes
$RUN -c "
from PIL import Image
im = Image.open('../../app/icon.png').convert('RGBA')
bg = Image.new('RGBA', im.size, (250,249,247,255)); bg.alpha_composite(im)
bg.convert('RGB').save('../../app/favicon.ico', sizes=[(16,16),(32,32),(48,48)])"
echo "wrote ../../app/favicon.ico"
