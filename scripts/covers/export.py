"""Exports the captured cover pieces to public/projects/covers.

Each piece is saved at the exact pixel width it shows at on a 467px tile on a
2x screen (934px times its `w` share), so the browser does not rescale it
there. A `narrow` piece is saved at 3.45 times its size on a 303px tile: the
landing page shows it at 2x on a desktop and at 3x on a phone, where the tile
is up to 348px wide, so the file is never scaled up. The widths come from COVERS_REDESIGN in
app/_brand/sections/Projects.tsx, the one place they are set. Flat UI is saved
as lossless WebP, because lossy WebP smears small coloured text; a piece that
is mostly photos (PHOTO below) is saved at quality 96.

  python3 scripts/covers/export.py [captures dir, default output/covers] [--only r-zervo]

It prints each piece's size on the tile and warns when a piece is outside the
band the six covers share: 68% to 76% of a wide tile's height, 72% to 78% of a
narrow one's.
"""
import re, sys
from pathlib import Path
from PIL import Image, ImageFilter

PHOTO = {"r-wishlist"}
OUT = Path("public/projects/covers")
# tile size in CSS px, pixels per CSS px to save at, and the height band
WIDE = dict(w=467, h=292, scale=2, band=(0.68, 0.76))
NARROW = dict(w=303, h=189, scale=3.45, band=(0.72, 0.78))

args = sys.argv[1:]
only = None
if "--only" in args:
    i = args.index("--only"); only = args[i + 1]; del args[i:i + 2]
src = Path(args[0] if args else "output/covers")

tsx = Path("app/_brand/sections/Projects.tsx").read_text()
block = tsx[tsx.index("const COVERS_REDESIGN"):]
block = block[:block.index("};")]
jobs = []
for line in block.splitlines():
    m = re.search(r'\bw: (\d+), wn: (\d+),.*?file: "([a-z0-9-]+)"(?:, narrow: "([a-z0-9-]+)")?', line)
    if m:
        jobs.append((m[3], int(m[1]), WIDE))
        if m[4]: jobs.append((m[4], int(m[2]), NARROW))
if not jobs:
    sys.exit("no pieces found in COVERS_REDESIGN")

for name, share_w, tile in jobs:
    if only and name != only:
        continue
    png = src / f"{name}-4x.png"
    if not png.exists():
        print(f"{name}: no capture at {png}, skipped"); continue
    im = Image.open(png)
    px = round(share_w / 100 * tile["w"] * tile["scale"])
    if px != im.width:
        im = im.resize((px, round(im.height * px / im.width)), Image.LANCZOS)
        sharpen = ImageFilter.UnsharpMask(radius=0.6, percent=45, threshold=0)
        if im.mode == "RGBA":
            *rgb, a = im.split()
            im = Image.merge("RGBA", (*Image.merge("RGB", rgb).filter(sharpen).split(), a))
        else:
            im = im.convert("RGB").filter(sharpen)
    if name in PHOTO:
        im.save(OUT / f"{name}.webp", quality=96, method=6)
    else:
        im.save(OUT / f"{name}.webp", lossless=True, method=6)
    share = im.height / tile["scale"] / tile["h"]
    lo, hi = tile["band"]
    note = "" if lo <= share <= hi else f"   <-- outside {lo:.0%} to {hi:.0%} of the tile height: change the width or the drawing"
    print(f"{name}: {round(im.width / tile['scale'])} x {round(im.height / tile['scale'])} on a {tile['w']}px tile, {share:.0%} of its height, {(OUT / f'{name}.webp').stat().st_size // 1024} KB{note}")
