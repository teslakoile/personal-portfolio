"""Bayer print mask: a photo in, the profile card's dither out, as an alpha mask.

The card behind the portrait (app/_og/kyle-card.png, build_brand.py) is an 8x8
Bayer threshold printed in square cells, coral on cream. This is the same
screen for the footer tiles: tone sets how many cells print, so a dark area
stays textured and a light one thins out, with no solid slabs.

The output is transparent where nothing prints and opaque where a cell does.
The page tints it with a CSS mask (--tile-ink), the way it did the sine-screen
masks this replaces.

    uv run --with pillow --with numpy python bayer_mask.py in.png out.webp \\
        size=720 cell=6 quality=80

`cell` is in output pixels. The footer tile is about 128 CSS px and shows a
720px mask, so cell=6 prints about 120 cells across, 1 CSS px each (2 device
px on a retina screen), which keeps the photo legible; the card's 3px cell is
too coarse at that size.
"""

import sys

import numpy as np
from PIL import Image, ImageOps


def bayer(n):
    b = np.array([[0]])
    while b.shape[0] < n:
        b = np.block([[4 * b, 4 * b + 2], [4 * b + 3, 4 * b + 1]])
    return (b + 0.5) / (n * n)


def bayer_mask(src, out, size=720, cell=6, quality=80):
    im = ImageOps.exif_transpose(Image.open(src)).convert("L")
    s = min(im.size)
    x0, y0 = (im.width - s) // 2, (im.height - s) // 2
    im = im.crop((x0, y0, x0 + s, y0 + s))

    n = size // cell
    g = np.asarray(ImageOps.autocontrast(im.resize((n, n), Image.BOX), cutoff=2),
                   dtype=np.float32) / 255
    t = np.tile(bayer(8), (n // 8 + 1, n // 8 + 1))[:n, :n]
    dots = (g < t).astype(np.uint8) * 255                     # dark prints

    a = Image.fromarray(dots).resize((size, size), Image.NEAREST)   # cell is size / n, about `cell`
    mask = Image.new("RGBA", a.size, (0, 0, 0, 0))
    mask.putalpha(a)
    mask.save(out, quality=quality)


if __name__ == "__main__":
    kw = dict(a.split("=") for a in sys.argv[3:])
    bayer_mask(sys.argv[1], sys.argv[2], size=int(kw.get("size", 720)),
               cell=int(kw.get("cell", 6)), quality=int(kw.get("quality", 80)))
