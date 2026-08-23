"""Fade the asset's outer boundary so the dots dissolve into the page.

The halftone stops dead at the PNG's rectangle, which reads as a crop line on
the hero's paper. This ramps alpha to zero along each edge, eased, so the block
has no border.
"""
import sys
import numpy as np
from PIL import Image


def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def fade(src, out, left=0.16, right=0.10, top=0.12, bottom=0.0,
         person=None, crop=None, keep=0.92):
    im = Image.open(src).convert("RGBA")
    a = np.asarray(im).astype(np.float32) / 255
    H, W = a.shape[:2]

    def ramp(n, total):
        r = np.ones(total, np.float32)
        n = int(n * total)
        if n > 0:
            r[:n] = smoothstep(np.linspace(0, 1, n))
        return r

    fx = ramp(left, W) * ramp(right, W)[::-1]
    fy = ramp(top, H) * ramp(bottom, H)[::-1]
    m = fy[:, None] * fx[None, :]

    if person and crop:
        # he must never dissolve at the frame edge, only the scene does
        from PIL import ImageFilter
        x, y, w, h = crop
        pm = (Image.open(person).convert('L').crop((x, y, x+w, y+h))
              .resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(18)))
        pm = np.asarray(pm).astype(np.float32) / 255
        m = np.maximum(m, pm * keep)
    a[..., 3] *= m
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "RGBA").save(out)


if __name__ == "__main__":
    kw = dict(x.split("=") for x in sys.argv[3:])
    fade(sys.argv[1], sys.argv[2],
         left=float(kw.get("left", 0.16)), right=float(kw.get("right", 0.10)),
         top=float(kw.get("top", 0.12)), bottom=float(kw.get("bottom", 0.0)),
         person=kw.get("person"),
         crop=tuple(int(v) for v in kw["crop"].split(",")) if kw.get("crop") else None,
         keep=float(kw.get("keep", 0.92)))
