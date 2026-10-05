"""Footer collage treatments beyond the dot dithers, one function per effect.

    uv run --with pillow --with numpy python footer_effects.py <effect> in.jpg out.webp

Every effect takes a centre square crop at 256px (shown at 128 CSS px).
  plain      the photo as is
  bw         black and white, contrast stretched
  duotone    tritone gradient map: ink shadows, coral mids, paper highlights
  riso       two-ink risograph overprint (blue and coral), 2px grain,
             the coral plate offset 2px like a misregistered print
  poster     screenprint posterize: 6 flat colours per photo, saturated
  lines      engraving line screen: horizontal ink lines that thicken in shadow
  grain      film: warm, slightly faded, with fine grain and a soft vignette
"""

import sys

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SIZE = 256
PAPER = np.array([0xFA, 0xF9, 0xF7], dtype=np.float32) / 255
INK = np.array([0x1C, 0x19, 0x17], dtype=np.float32) / 255
CORAL = np.array([0xF5, 0x48, 0x2D], dtype=np.float32) / 255
RISO_BLUE = np.array([0x00, 0x78, 0xBF], dtype=np.float32) / 255
RISO_CORAL = np.array([0xFF, 0x66, 0x5E], dtype=np.float32) / 255


def square(src):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    s = min(im.size)
    x0, y0 = (im.width - s) // 2, (im.height - s) // 2
    return im.crop((x0, y0, x0 + s, y0 + s)).resize((SIZE, SIZE), Image.LANCZOS)


def lum(im, cutoff=2):
    return np.asarray(ImageOps.autocontrast(im.convert("L"), cutoff=cutoff), dtype=np.float32) / 255


def to_img(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def plain(im):
    return im


def bw(im):
    return ImageOps.autocontrast(im.convert("L"), cutoff=1).convert("RGB")


def duotone(im):
    l = lum(im)[..., None]
    lo = INK + (CORAL - INK) * np.clip(l / 0.55, 0, 1)
    hi = CORAL + (PAPER - CORAL) * np.clip((l - 0.55) / 0.45, 0, 1)
    return to_img(np.where(l < 0.55, lo, hi))


def riso(im, seed=7):
    rng = np.random.default_rng(seed)
    # plates at half size, then 2x nearest: a 2px grain that reads as print,
    # not static; highlights eased so they stay mostly paper
    half = np.asarray(im.resize((SIZE // 2, SIZE // 2), Image.BOX), dtype=np.float32) / 255
    blue_amt = np.clip(1 - half[..., 0] * 1.1, 0, 1) ** 1.35
    coral_amt = np.clip(1 - half[..., 2] * 1.0, 0, 1) ** 1.6
    blue = (blue_amt > rng.random(blue_amt.shape)).astype(np.float32)
    coral = (coral_amt > rng.random(coral_amt.shape)).astype(np.float32)
    up = lambda m: np.kron(m, np.ones((2, 2), dtype=np.float32))
    blue, coral = up(blue), np.roll(up(coral), (2, 2), axis=(0, 1))     # misregistration
    out = np.ones((SIZE, SIZE, 3), dtype=np.float32) * PAPER
    out = out * (1 - blue[..., None] * (1 - RISO_BLUE))                  # multiply
    out = out * (1 - coral[..., None] * (1 - RISO_CORAL))
    return to_img(out)


def poster(im):
    im = ImageEnhance.Color(ImageOps.autocontrast(im, cutoff=2)).enhance(1.6)
    return im.filter(ImageFilter.MedianFilter(3)).quantize(colors=6, method=Image.Quantize.MEDIANCUT).convert("RGB")


def lines(im, pitch=4):
    l = lum(im)
    h, w = l.shape
    y = (np.arange(h) % pitch + 0.5)[:, None] / pitch                    # position inside the line cell
    ink = np.abs(y - 0.5) * 2 < (1 - l) * 1.05                            # thicker where darker
    out = np.where(ink[..., None], INK, PAPER)
    return to_img(out)


def grain(im, seed=11):
    rng = np.random.default_rng(seed)
    a = np.asarray(ImageEnhance.Color(im).enhance(0.85), dtype=np.float32) / 255
    a = a * np.array([1.04, 1.0, 0.92]) + 0.04                            # warm, lifted blacks
    yy, xx = np.mgrid[-1:1:complex(SIZE), -1:1:complex(SIZE)]
    a = a * (1 - 0.18 * np.clip(xx ** 2 + yy ** 2 - 0.3, 0, 1))[..., None]  # soft vignette
    a = a + rng.normal(0, 0.045, a.shape[:2])[..., None]                  # luminance grain
    return to_img(a)


EFFECTS = dict(plain=plain, bw=bw, duotone=duotone, riso=riso, poster=poster, lines=lines, grain=grain)

if __name__ == "__main__":
    eff, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
    EFFECTS[eff](square(src)).save(out, quality=82)
