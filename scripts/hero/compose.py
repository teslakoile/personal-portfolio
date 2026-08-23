"""Colour the dot layer and weight it by region.

Ink everywhere, but how much of each dot survives depends on where it is:
Kyle at full strength, the bridge boosted, and the rest of the scene held at a
floor so the bay reads as texture rather than detail.
"""
import sys
import numpy as np
from PIL import Image

INK = np.array([0x1c, 0x19, 0x17], np.float32)


def compose(dots, out, crop, person_p, bridge_p, floor=0.68, bridge_gain=2.2):
    A = np.asarray(Image.open(dots).getchannel("A")).astype(np.float32) / 255
    H, W = A.shape
    x, y, w, h = crop

    def reg(p):
        im = Image.open(p).convert("L").crop((x, y, x + w, y + h)).resize((W, H), Image.LANCZOS)
        return np.asarray(im).astype(np.float32) / 255

    keep = np.clip(reg(person_p) + reg(bridge_p) * bridge_gain + floor, 0, 1)
    a = (A * keep)[..., None]
    rgb = np.broadcast_to(INK, (H, W, 3))
    Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8), "RGBA").save(out)


if __name__ == "__main__":
    kw = dict(v.split("=") for v in sys.argv[3:])
    compose(sys.argv[1], sys.argv[2],
            crop=tuple(int(v) for v in kw["crop"].split(",")),
            person_p=kw["person"], bridge_p=kw["bridge"],
            floor=float(kw.get("floor", 0.68)), bridge_gain=float(kw.get("gain", 2.2)))
