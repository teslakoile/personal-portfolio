"""Round-dot halftone, matching the hero portrait treatment on the home page.

Each cell of a square grid becomes one circle whose radius tracks the cell's
mean darkness, which is how a real dot screen behaves. Output is ink dots on a
transparent ground so the mark can sit on any background.
"""
import sys
from PIL import Image, ImageChops, ImageDraw

def halftone(src, out, size=1024, pitch=26, gamma=1.0, lo=0.0, hi=1.0,
             angle=0, circle_crop=True, ink=(28, 25, 23), invert=False, cover=0.72):
    src_im = Image.open(src).convert("L")
    # preserve aspect: width drives the size, height follows. Forcing a square
    # here silently stretched every non-square plate.
    W = size
    H = max(1, round(size * src_im.height / src_im.width))
    im = src_im.resize((W, H), Image.LANCZOS)
    if angle:
        im = im.rotate(angle, resample=Image.BICUBIC, fillcolor=255)
    px = im.load()

    canvas = Image.new("RGBA", (W * 4, H * 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    rmax = pitch * cover / 2   # >=1.0 lets full-tone dots merge into a solid

    for cy in range(pitch // 2, H, pitch):
        for cx in range(pitch // 2, W, pitch):
            acc = n = 0
            for y in range(max(0, cy - pitch // 2), min(H, cy + pitch // 2)):
                for x in range(max(0, cx - pitch // 2), min(W, cx + pitch // 2)):
                    acc += px[x, y]; n += 1
            if not n:
                continue
            t = (acc / n) / 255.0
            v = t if invert else 1.0 - t       # dot area tracks tone (or its inverse)
            v = (v - lo) / max(1e-6, hi - lo)
            v = min(1.0, max(0.0, v)) ** gamma
            r = rmax * (v ** 0.5)                        # area, not radius, tracks tone
            if r < 0.35:
                continue
            X, Y = cx * 4, cy * 4
            R = r * 4
            d.ellipse([X - R, Y - R, X + R, Y + R], fill=ink + (255,))

    canvas = canvas.resize((W, H), Image.LANCZOS)

    if circle_crop:
        mask = Image.new("L", (W * 4, H * 4), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, W * 4, H * 4], fill=255)
        mask = mask.resize((W, H), Image.LANCZOS)
        a = canvas.getchannel("A")
        canvas.putalpha(ImageChops.multiply(a, mask))

    canvas.save(out)
    return out

if __name__ == "__main__":
    a = dict(x.split("=") for x in sys.argv[3:])
    halftone(sys.argv[1], sys.argv[2],
             size=int(a.get("size", 1024)), pitch=int(a.get("pitch", 26)),
             gamma=float(a.get("gamma", 1.0)), lo=float(a.get("lo", 0)),
             hi=float(a.get("hi", 1)), angle=float(a.get("angle", 0)),
             circle_crop=a.get("circle", "1") == "1",
             invert=a.get("invert", "0") == "1",
             cover=float(a.get("cover", 0.72)))
