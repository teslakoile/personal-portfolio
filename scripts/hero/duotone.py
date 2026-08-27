"""Colour the dot plate by tone, the way a duotone press run does.

A halftone encodes tone as dot area, so the local ink coverage of the plate IS
the tone. Blurring the alpha channel over about one dot pitch recovers it, and
that value indexes a colour ramp: sparse dots take the light end, dense dots
the dark end. The result is one photo printed in two inks rather than in black.

Alpha is never touched here, only RGB, so the geometry the halftone stage
produced survives into compose and edge_fade unchanged.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter


def _hex(c):
    c = c.lstrip("#")
    return np.array([int(c[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def _ramp(stops, t):
    """Sample an evenly spaced multi-stop gradient at t, shape (H, W)."""
    cols = np.stack([_hex(s) for s in stops])          # (S, 3)
    n = len(cols) - 1
    if n == 0:
        return np.broadcast_to(cols[0], t.shape + (3,)).copy()
    pos = np.clip(t, 0, 1) * n
    i = np.clip(pos.astype(np.int32), 0, n - 1)
    f = (pos - i)[..., None]
    return cols[i] * (1 - f) + cols[i + 1] * f


def _region(path, crop, size, blur=0):
    x, y, w, h = crop
    im = Image.open(path).convert("L").crop((x, y, x + w, y + h)).resize(size, Image.LANCZOS)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    return (np.asarray(im).astype(np.float32) / 255)[..., None]


def duotone(dots, out, stops, pitch=9, person=None, person_stops=None,
            crop=None, ceiling=99.5, gamma=1.0):
    im = Image.open(dots).convert("RGBA")
    a = im.getchannel("A")
    W, H = im.size

    # local ink coverage over roughly one cell, which is the tone the screen
    # was drawn from. A single dot never fills its cell, so the top of the
    # range is set from the plate itself rather than assumed to be 1.0
    cov = np.asarray(a.filter(ImageFilter.GaussianBlur(pitch * 0.9))).astype(np.float32) / 255
    top = np.percentile(cov[cov > 0.01], ceiling) if (cov > 0.01).any() else 1.0
    t = np.clip(cov / max(top, 1e-6), 0, 1) ** gamma

    rgb = _ramp(stops, t)

    # a second ink for the subject, so the scene can carry the colour while he
    # stays legible (or the reverse)
    if person and person_stops:
        pm = _region(person, crop, (W, H), blur=6)
        rgb = rgb * (1 - pm) + _ramp(person_stops, t) * pm

    arr = np.dstack([rgb, np.asarray(a).astype(np.float32)])
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA").save(out)
    return out


if __name__ == "__main__":
    kw = dict(v.split("=", 1) for v in sys.argv[3:])
    duotone(sys.argv[1], sys.argv[2],
            stops=kw["stops"].split(","),
            pitch=int(kw.get("pitch", 9)),
            person=kw.get("person"),
            person_stops=kw["person_stops"].split(",") if kw.get("person_stops") else None,
            crop=tuple(int(v) for v in kw["crop"].split(",")) if kw.get("crop") else None,
            ceiling=float(kw.get("ceiling", 99.5)),
            gamma=float(kw.get("gamma", 1.0)))
