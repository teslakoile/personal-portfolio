"""True-color dot dither: the profile card's background effect, for any photo.

Ported from the brand exploration's colordot.py (exciting-swanson worktree,
design-explorations/2026-09-brand-system/src/colordot.py), without the card's
subject matte; the sky step is simplified (sky=0 turns it off).

  1. Downsample to one cell per `cell` pixels, so every cell carries the
     photo's own local colour, saturated by `sat`.
  2. A 4x4 Bayer threshold on autocontrasted luminance decides, per cell,
     whether it prints a dot (darker cells print more often).
  3. A dot is that cell's colour, shaded by `shade`; a gap is the page's
     paper (#faf9f7). Dots are round by default, square with shape=square.

Vibrancy: `stretch` (per-channel autocontrast cutoff, %), `sat`, and `shade`
(1.0 = no darkening). The card's own look is sat 1.7, shade 0.82, stretch 0.

    uv run --with pillow --with numpy python colordot.py in.jpg out.png \\
        size=256 cell=4 sat=1.7 shade=0.82 shape=round
"""

import sys

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageOps

PAPER = np.array((0xFA, 0xF9, 0xF7), dtype=np.float32)
BAYER4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


def colordot(src, out, size=256, cell=4, sat=1.7, shade=0.82, shape="round", sky=1.0,
             stretch=0.0, skyblue=(150, 186, 232)):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    s = min(im.size)                                   # centre square crop
    x0, y0 = (im.width - s) // 2, (im.height - s) // 2
    im = im.crop((x0, y0, x0 + s, y0 + s)).resize((size, size), Image.LANCZOS)

    n = size // cell
    small = im.resize((n, n), Image.BOX)
    # stretch > 0: per-channel autocontrast first, so a flat or hazy photo
    # spans the full range before saturation is boosted (clearer colour)
    colsrc = ImageOps.autocontrast(small, cutoff=stretch) if stretch > 0 else small
    col = np.asarray(ImageEnhance.Color(colsrc).enhance(sat), dtype=np.float32)
    lum = np.asarray(ImageOps.autocontrast(small.convert("L"), cutoff=2), dtype=np.float32) / 255

    # Sky, as on the card: bright, pale, blue-leaning cells keep a field of
    # soft blue dots whose density follows the sky's own brightness, instead
    # of dropping out to bare paper.
    a = np.asarray(small, dtype=np.float32) / 255
    mx, mn = a.max(-1), a.min(-1)
    pale = (mx - mn) / (mx + 1e-4)
    w = (np.clip((a.mean(-1) - 0.62) / 0.12, 0, 1) * np.clip((0.30 - pale) / 0.12, 0, 1)
         * (a[..., 2] >= a[..., 0] - 0.02) * sky)
    if (w > 0.5).any():
        ls = a.mean(-1); m = w > 0.5
        lo, hi = np.percentile(ls[m], 3), np.percentile(ls[m], 97)
        rel = np.clip((ls - lo) / (hi - lo + 1e-4), 0, 1)
        lum = lum * (1 - w) + (0.50 + 0.42 * rel) * w
        col = col * (1 - w[..., None]) + np.array(skyblue, dtype=np.float32) / shade * w[..., None]
    t = np.tile(BAYER4, (n // 4 + 1, n // 4 + 1))[:n, :n]
    dot = (lum < t * 0.85 + 0.08) | (lum < 0.35)
    dotc = np.clip(col * shade, 0, 255)

    if shape == "square":
        arr = np.where(dot[..., None], dotc, PAPER)
        img = Image.fromarray(arr.astype(np.uint8)).resize((size, size), Image.NEAREST)
    else:
        img = Image.new("RGB", (size, size), tuple(int(v) for v in PAPER))
        d = ImageDraw.Draw(img)
        r = cell / 2
        for y, x in zip(*np.where(dot)):
            cx, cy = x * cell + r, y * cell + r
            d.ellipse((cx - r, cy - r, cx + r - 1, cy + r - 1), fill=tuple(int(v) for v in dotc[y, x]))
    img.save(out)
    return out


if __name__ == "__main__":
    kw = dict(v.split("=", 1) for v in sys.argv[3:])
    colordot(sys.argv[1], sys.argv[2], size=int(kw.get("size", 256)), cell=int(kw.get("cell", 4)),
             sat=float(kw.get("sat", 1.7)), shade=float(kw.get("shade", 0.82)),
             shape=kw.get("shape", "round"), sky=float(kw.get("sky", 1.0)),
             stretch=float(kw.get("stretch", 0)),
             skyblue=tuple(int(v) for v in kw.get("skyblue", "150,186,232").split(",")))
