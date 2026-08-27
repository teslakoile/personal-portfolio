"""The Franky reference's actual effect: a dot screen laid OVER a photograph.

Measured on the reference, not guessed:

  * the lattice is a constant 5px in both axes, axis-aligned, everywhere in the
    frame, independent of tone
  * the image underneath stays continuous tone. 190k unique colours, and cell
    contrast never collapses at the tone extremes the way ink-on-paper does
  * subtracting a low-pass of the reference from itself leaves one dark dot per
    cell at a roughly constant +/-20 levels, and nothing at all on bare paper

So it is not a halftone. A halftone throws the photograph away and rebuilds it
from ink dots whose AREA carries tone. This keeps the photograph and multiplies
a small fixed dot into it, so the picture carries the tone and the dots are
only texture. That is why the reference keeps yellow highlights next to maroon
shadows: nothing ever re-indexed its colour.

An optional gradient map runs first. The reference needs none, its subject is
already orange; Kyle's photo is a black jacket under a grey sky, so without one
the screen lands on a grey picture. The map keeps the tone continuous, which is
the whole point, and only replaces the hue.

    dotscreen.py SRC OUT [pitch=5] [amp=0.28] [dot=0.42] [sat=1.0] [stops=#a,#b]
"""
import sys

import numpy as np
from PIL import Image


def _ramp(stops, t):
    cols = np.stack([np.array([int(c.lstrip("#")[i:i+2], 16) for i in (0, 2, 4)], np.float32)
                     for c in stops])
    n = len(cols) - 1
    pos = np.clip(t, 0, 1) * n
    i = np.clip(pos.astype(np.int32), 0, max(n - 1, 0))
    f = (pos - i)[..., None]
    return cols[i] * (1 - f) + cols[min(1, n) and i + 1] * f if n else np.broadcast_to(cols[0], t.shape + (3,))


def dotscreen(src, out, pitch=5, amp=0.28, dot=0.42, sat=1.0, paper=250.0, stops=None):
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    H, W, _ = a.shape

    if stops:
        # continuous-tone gradient map: hue from the ramp, tone still the photo's
        a = _ramp(stops, 1.0 - a.mean(axis=2) / 255.0)

    if sat != 1.0:
        g = a.mean(axis=2, keepdims=True)
        a = np.clip(g + (a - g) * sat, 0, 255)

    # one soft disc per cell, radius `dot` of the pitch
    yy, xx = np.mgrid[0:H, 0:W]
    cx = (xx % pitch) - (pitch - 1) / 2.0
    cy = (yy % pitch) - (pitch - 1) / 2.0
    r = np.hypot(cx, cy) / (pitch * dot)
    mask = np.clip(1.0 - r, 0.0, 1.0) ** 0.6            # 1 at the centre, 0 at the rim

    # the screen only bites where there is picture. On bare paper the reference
    # shows no screen at all, so ink weight gates it.
    ink = np.clip((paper - a.mean(axis=2)) / 40.0, 0, 1)

    scr = 1.0 - amp * mask * ink
    Image.fromarray(np.clip(a * scr[..., None], 0, 255).astype(np.uint8)).save(out)
    return out


if __name__ == "__main__":
    kw = dict(v.split("=", 1) for v in sys.argv[3:])
    dotscreen(sys.argv[1], sys.argv[2],
              pitch=int(kw.get("pitch", 5)), amp=float(kw.get("amp", 0.28)),
              dot=float(kw.get("dot", 0.42)), sat=float(kw.get("sat", 1.0)),
              stops=kw["stops"].split(",") if kw.get("stops") else None)
