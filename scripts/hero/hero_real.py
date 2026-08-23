"""Hero plate: the real scene, lifted and faded, with the subject at full weight.

No cut-out bridge. The photograph keeps its own tones so the structure reads as
a photograph, and the whole background dissolves toward the frame edge so the
block does not become a hard rectangle on the graph paper.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def build(src, matte, out, crop, bridge=None, bridge_keep=0.55, suppress=None, suppress_lift=0.45, size=1400, scene_lift=0.55, scene_gain=1.15,
          person_gain=1.25, person_floor=0.10, falloff=0.55, feather=170,
          bottom_fade=0.20):
    x, y, w, h = crop
    g = np.asarray(Image.open(src).convert("L").crop((x, y, x+w, y+h))).astype(np.float32) / 255
    s = np.asarray(Image.open(matte).convert("L").crop((x, y, x+w, y+h))).astype(np.float32) / 255

    body = s > 0.5
    lo, hi = np.percentile(g[body], [2, 98])
    p = np.clip((g - lo) / max(hi - lo, 1e-3), 0, 1)
    p = np.clip(0.5 + (p - 0.5) * person_gain, 0, 1) * (1 - person_floor) + person_floor

    # the scene keeps its own photographic tone, just lighter
    bg = np.clip(0.5 + (g - 0.5) * scene_gain, 0, 1)
    # the bridge is the point of the background, so lift it LESS than the rest
    lift = np.full_like(g, scene_lift)
    if bridge:
        bm = np.asarray(Image.open(bridge).convert('L').crop((x, y, x+w, y+h)))
        bm = np.asarray(Image.fromarray(bm).filter(ImageFilter.GaussianBlur(9))).astype(np.float32) / 255
        lift = lift * (1 - bm * bridge_keep)
    if suppress:
        # Fort Point is dark brick, so it prints heavier than the bay around it.
        # Lift it separately so the whole background sits at one weight.
        sx0, sy0, sx1, sy1 = suppress
        sm = Image.new('L', (w, h), 0)
        ImageDraw.Draw(sm).rectangle([sx0-x, sy0-y, sx1-x, sy1-y], fill=255)
        sm = np.asarray(sm.filter(ImageFilter.GaussianBlur(28))).astype(np.float32)/255
        lift = lift + (1 - lift) * sm * suppress_lift
    bg = bg * (1 - lift) + lift

    H, W = g.shape
    v = Image.new("L", (W, H), 0)
    pad_x, pad_y = int(W * 0.02), int(H * 0.02)
    ImageDraw.Draw(v).ellipse([pad_x, pad_y, W - pad_x, int(H * 1.15)], fill=255)
    vm = np.asarray(v.filter(ImageFilter.GaussianBlur(feather))).astype(np.float32) / 255
    vm = 1 - (1 - vm) * falloff                       # fade the scene toward paper at the edge
    if bridge:
        vm = np.maximum(vm, bm)                       # never fade the bridge out
    bg = bg * vm + 1.0 * (1 - vm)

    plate = bg * (1 - s) + p * s

    if bottom_fade:
        n = int(H * bottom_fade)
        ramp = np.ones((H, 1), np.float32)
        ramp[H - n:, 0] = np.linspace(1, 0, n)
        plate = plate * ramp + 1.0 * (1 - ramp)

    Image.fromarray((np.clip(plate, 0, 1) * 255).astype(np.uint8)).resize(
        (size, int(size * H / W)), Image.LANCZOS).save(out)


if __name__ == "__main__":
    kw = dict(a.split("=") for a in sys.argv[4:])
    build(sys.argv[1], sys.argv[2], sys.argv[3],
          crop=tuple(int(v) for v in kw["crop"].split(",")),
          bridge=kw.get("bridge"), bridge_keep=float(kw.get("bridge_keep", 0.55)),
          suppress=tuple(int(v) for v in kw["suppress"].split(",")) if kw.get("suppress") else None,
          suppress_lift=float(kw.get("suppress_lift", 0.45)),
          scene_lift=float(kw.get("scene_lift", 0.55)),
          scene_gain=float(kw.get("scene_gain", 1.15)),
          person_gain=float(kw.get("person_gain", 1.25)),
          falloff=float(kw.get("falloff", 0.55)),
          feather=int(kw.get("feather", 170)))
