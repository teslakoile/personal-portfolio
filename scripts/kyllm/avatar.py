"""Builds the flat KYLLM site assets from flat.svg and flat.png.

    uv run --with pillow --with numpy python avatar.py

Run vectorize.py first. Writes to public/kyllm/:

    kyllm-flat.svg          the whole character, transparent
    kyllm-flat.png          the same at 1024px
    kyllm-avatar.svg        circle avatar: brand paper background, lower body
                            cropped out by the circle, room above the leaf
    kyllm-avatar-{56,72,96,192}.png and .webp
                            the avatar at 2x for 28, 36, 48, and 96px

The frame is measured, not placed by eye: the circle is FRAME_D times the
character's width, the glasses' centre sits FRAME_G of the way down it, and
the character shifts left until the hanging lens clears the circle's edge by
MARGIN of the diameter.
"""
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "public/kyllm"
PAPER = "#faf9f7"
FRAME_D, FRAME_G, MARGIN = 1.15, 0.60, 0.08

flat = Image.open(HERE / "flat.png")
px = np.asarray(flat).astype(int)
on = px[..., 3] > 128
ink = on & (px[..., :3].max(-1) < 45)
x0, y0, x1, y1 = flat.getbbox()
D = FRAME_D * (x1 - x0)
gy = np.where(ink)[0].mean()
cy = gy - FRAME_G * D + D / 2

# Centre on the character, then shift left until every ink pixel above the
# glasses' centre line sits inside the circle with the margin to spare.
cx = (x0 + x1) / 2
ys, xs = np.nonzero(ink & (np.arange(ink.shape[0])[:, None] < gy + 0.12 * D))
over = np.hypot(xs - cx, ys - cy).max() - D / 2 * (1 - 2 * MARGIN)
while over > 0:
    cx += 1
    over = np.hypot(xs - cx, ys - cy).max() - D / 2 * (1 - 2 * MARGIN)

svg = (HERE / "flat.svg").read_text()
body = re.search(r"<g>.*</g>", svg, re.S).group(0)
vb = f"{cx - D / 2:.1f} {cy - D / 2:.1f} {D:.1f} {D:.1f}"
avatar = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">'
          f'<clipPath id="kyllm-c"><circle cx="{cx:.1f}" cy="{cy:.1f}" r="{D / 2:.1f}"/></clipPath>'
          f'<g clip-path="url(#kyllm-c)"><circle cx="{cx:.1f}" cy="{cy:.1f}" r="{D / 2:.1f}" fill="{PAPER}"/>{body}</g></svg>')

OUT.mkdir(exist_ok=True)
(OUT / "kyllm-flat.svg").write_text(svg)
flat.save(OUT / "kyllm-flat.png", optimize=True)
(OUT / "kyllm-avatar.svg").write_text(avatar)

# Raster avatars: crop the 1024 flat render at 4x, then downsample.
SS = 4
big = flat.resize((flat.width * SS, flat.height * SS), Image.LANCZOS)
side = round(D * SS)
im = Image.new("RGBA", (side, side), PAPER)
im.alpha_composite(big, (round(-(cx - D / 2) * SS), round(-(cy - D / 2) * SS)))
mask = Image.new("L", (side, side))
ImageDraw.Draw(mask).ellipse((0, 0, side - 1, side - 1), fill=255)
av = Image.new("RGBA", (side, side))
av.paste(im, (0, 0), mask)
for s in (56, 72, 96, 192):
    a = av.resize((s, s), Image.LANCZOS)
    a.save(OUT / f"kyllm-avatar-{s}.png", optimize=True)
    a.save(OUT / f"kyllm-avatar-{s}.webp", quality=95, method=6)
print(f"circle d={D:.0f}px at ({cx:.0f}, {cy:.0f}); wrote kyllm-flat.svg/.png, kyllm-avatar.svg, kyllm-avatar-{{56,72,96,192}}.png/.webp")
