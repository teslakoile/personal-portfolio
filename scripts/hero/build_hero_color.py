"""Builds the hero photo in the share-image treatment.

    uv run --with pillow --with numpy python build_hero_color.py

Kyle in true colour over a dither of the photo in its own colours, the same
call as app/_og/kyle-card.png (see build_brand.py), framed for the redesign's
hero cell at the source's own resolution: public/hero/portrait-hero-color.webp.

The cell is 440x520 in the 1080px frame (half the width past the strip's
200px label column, by the hero's 520px height), so the crop is 750 wide at
that ratio and the cell shows all of it.
"""
from PIL import Image

from build_brand import HEAD_TOP, ROOT, crop, photo_dither

W = 750
H = round(W * 520 / 440)
sub, m, raw = crop(W, HEAD_TOP - 435, H)
photo = Image.composite(sub, photo_dither(raw), m)
photo.save(ROOT / "public/hero/portrait-hero-color.webp", quality=88, method=6)
print("wrote public/hero/portrait-hero-color.webp")
