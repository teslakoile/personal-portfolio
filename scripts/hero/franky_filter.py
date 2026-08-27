"""Print-screen filter: any photograph in, a chosen ink palette out.

Three stages, deliberately separated so the source's own colour never reaches
the output. Give it a grey photo or a blue one and you still get the palette
you asked for.

  1. prepare   discard colour, flatten surfaces, normalise levels. This is the
               step that decides whether the result is patchy, and it is doing
               most of the work.
  2. dither    a sine screen ordered dither that quantises tone to N rungs.
  3. paint     rung index -> ink colour, straight out of the palette.

WHAT THE REFERENCE MEASURES AT, and why the defaults are what they are:

  * a sine screen, not a halftone. FFT of its flat faces gives fundamentals at
    1/5.33 in both axes plus a real subharmonic at 7.54px on the diagonal,
    which is the signature of sin(2*pi*x/p)*sin(2*pi*y/p): the two extrema land
    on the two sublattices, so light dots fall where i+j is even and dark where
    it is odd. On a flat coral face the reference runs 46.8% of pixels lighter
    than its median and 46.6% darker, which is dithering both ways rather than
    a screen laid over a picture.
  * three inks and no more. Flat 3x3 windows pile up at L 48-62, 146-168 and
    250-255 with nothing at 85, 128 or 191. The dark ink is a plum, blue above
    green, and the paper is bare.
  * COURSE is measured; PITCH is not. The reference's own lattice reads 5.263px
    and drifts to 5.56px across the frame, so its PNG is a resampled render of
    the page rather than the asset. Anything fitted to it below the dot scale
    is fitting resampling, not the effect.

WHY THE OLD HIGHLIGHT SHOULDER IS GONE: it smoothstepped anything above 0.6
straight to paper. On a photographic highlight that wobbles across the knee
it punched ragged white holes into the tower's lit edge, which is the patchy
top. Now the top rung IS paper and the dither thins dots into it, so a lit
surface fades out in dots instead of tearing. Bare paper is a clamp on the
NORMALISED tone, after the median has made the sky uniform, so its edge is
clean rather than ragged.
"""

import sys

import numpy as np
from PIL import Image, ImageFilter

# Ordered dark to light. The coral set is the reference's own, measured off its
# flat plateaus; the rest are here to make the point that the palette is a
# choice and the source photograph's colour is not consulted at all.
PALETTES = {
    "coral":  ["#8d2526", "#ec8563", "#ffffff"],
    # four inks: an extra rung between the dark and the body, so a large dark
    # mass steps through it instead of sitting on one rung as a flat 50/50
    # checkerboard. Worth it on a subject with more shadow than the reference's.
    "coral4": ["#6d1a1e", "#b8453a", "#f0a07e", "#ffffff"],
    "coral4p":["#6d1a1e", "#b8453a", "#f0a07e", "#faf9f7"],   # paper = page --bg
    "ink":    ["#141414", "#8a8a8a", "#ffffff"],
    # the site's own neutral ramp, straight off styles.module.css: --fg,
    # --muted, --faint, paper. Four rungs like coral4, so a large dark mass
    # steps through them instead of sitting on one.
    "ink4":   ["#1c1917", "#57534e", "#a8a29e", "#ffffff"],
    # same inks, paper set to the page's own --bg instead of white, for when an
    # opaque plate is wanted and it must not read as a rectangle on the page
    "ink4p":  ["#1c1917", "#57534e", "#a8a29e", "#faf9f7"],
    "blue":   ["#12294d", "#5b8ec9", "#ffffff"],
    "forest": ["#12301f", "#5d9068", "#ffffff"],
    "plum":   ["#3a1030", "#a85f8e", "#fdf7fb"],
    # pure two-tone: no midtone rung at all, so every mid value has to dither
    "bw2":    ["#141414", "#ffffff"],
    "bw3":    ["#141414", "#8a8a8a", "#ffffff"],
    # inverted: the LIGHT end is the accent, so the ground prints coral and the
    # subject prints white. Use these opaque, since here the paper is the ink.
    "coral2":   ["#f5482d", "#ffffff"],   # coral subject on paper
    "onwhite2": ["#ffffff", "#f5482d"],   # white subject on a coral ground
    "onwhite3": ["#ffffff", "#ffb9a3", "#f5482d"],
}

PITCH, AMP, SS = 5.0, 1.0, 3
SMOOTH, GRAIN = 1, 0.6           # median radius, then a whisker of gaussian
BLACK_PCT, WHITE_PCT = 1.0, 96.0
CONTRAST, GAMMA = 1.15, 0.95
PAPER = 0.995                    # at or above this the normalised tone is bare paper
# Print floor and ceiling. An ordered dither only makes dots where tone sits
# BETWEEN rungs: a value sitting exactly on one prints solid. A photograph with
# a large dark mass -- a black jacket, say -- pins that mass to rung 0 and comes
# out as a flat slab with no screen in it at all, which reads as "the effect
# isn't working". Squeezing the range off both ends puts that mass between rungs
# so it dithers. The reference does this: 348 flat dark pixels against ~78k dark
# ones, so its shadows are all screen and never slab.
FLOOR, CEIL = 0.14, 0.94


def _hex(c):
    c = c.lstrip("#")
    return np.array([int(c[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def prepare(a, smooth=SMOOTH, grain=GRAIN, black_pct=BLACK_PCT,
            white_pct=WHITE_PCT, contrast=CONTRAST, gamma=GAMMA,
            floor=FLOOR, ceil=CEIL, paper=PAPER):
    """Photograph -> clean tone in 0..1. Colour is discarded here, on purpose.

    The median is the important one. A gaussian blurs a surface and its edge
    alike, so a quantised edge comes out soft and a quantised surface still
    carries the wobble that makes patches. A median flattens the surface and
    leaves the edge where it was, which is what a screen wants underneath it.

    Levels come from percentiles rather than constants, which is what lets any
    photograph land on the same rungs: an overcast frame and a sunlit one both
    end up spanning the palette instead of one of them bunching on a rung.
    """
    L = Image.fromarray((a.mean(axis=2) * 255).astype(np.uint8))
    if smooth:
        L = L.filter(ImageFilter.MedianFilter(smooth * 2 + 1))
    if grain:
        L = L.filter(ImageFilter.GaussianBlur(grain))
    t = np.asarray(L).astype(np.float32) / 255

    lo, hi = np.percentile(t, [black_pct, white_pct])
    t = np.clip((t - lo) / max(hi - lo, 1e-3), 0, 1)
    t = np.clip(0.5 + (t - 0.5) * contrast, 0, 1) ** gamma

    # bare paper is decided before the squeeze, or the sky could never reach it
    bare = t >= paper
    t = floor + (ceil - floor) * t
    t[bare] = 1.0
    return t


def dither(t, pitch=PITCH, levels=3, amp=AMP, ss=SS, paper=PAPER):
    """Sine-screen ordered dither to `levels` rungs. Returns the rung index.

    Evaluated ss times finer than the output and box-downsampled, which is why
    the dots have soft edges: the reference's do too, because its PNG is a
    downsample of a render.
    """
    H, W = t.shape
    big = np.asarray(Image.fromarray((t * 255).astype(np.uint8))
                     .resize((W * ss, H * ss), Image.BILINEAR)).astype(np.float32) / 255
    p = pitch * ss
    yy, xx = np.mgrid[0:H * ss, 0:W * ss].astype(np.float32)
    s = np.sin(2 * np.pi * xx / p) * np.sin(2 * np.pi * yy / p)

    k = np.clip(np.round(big * (levels - 1) + 0.5 * amp * s), 0, levels - 1)
    k[big >= paper] = levels - 1                  # bare paper takes no ink
    return k.astype(np.int8), ss


def paint(k, ss, palette, transparent=False):
    """Rung index -> ink. With transparent=True the paper rung becomes alpha.

    A plate with opaque white paper sits on the page as a visible rectangle,
    because the page is #faf9f7 and the plate is #ffffff. Dropping the paper to
    alpha instead lets the same file sit on any background, and the dots keep
    soft edges because the supersample average gives them partial alpha.
    """
    inks = np.stack([_hex(c) for c in palette])
    big = inks[k]
    H, W = big.shape[0] // ss, big.shape[1] // ss
    if not transparent:
        return big.reshape(H, ss, W, ss, 3).mean(axis=(1, 3)), None

    ink_on = (k < len(palette) - 1).astype(np.float32)
    # average premultiplied, then divide out, or the paper colour bleeds into
    # every dot edge and the plate comes back washed
    pre = (big * ink_on[..., None]).reshape(H, ss, W, ss, 3).mean(axis=(1, 3))
    a = ink_on.reshape(H, ss, W, ss).mean(axis=(1, 3))
    rgb = pre / np.maximum(a, 1e-4)[..., None]
    return np.clip(rgb, 0, 1), a


def franky(src, out, pitch=PITCH, palette="coral", amp=AMP, ss=SS,
           smooth=SMOOTH, contrast=CONTRAST, gamma=GAMMA,
           floor=FLOOR, ceil=CEIL, transparent=False, quality=80):
    inks = PALETTES[palette] if isinstance(palette, str) else palette
    a = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
    t = prepare(a, smooth=smooth, contrast=contrast, gamma=gamma,
                floor=floor, ceil=ceil)
    k, s = dither(t, pitch=pitch, levels=len(inks), amp=amp, ss=ss)
    x, alpha = paint(k, s, inks, transparent=transparent)
    arr = (np.clip(x, 0, 1) * 255).astype(np.uint8)
    if alpha is None:
        im = Image.fromarray(arr)
    else:
        im = Image.fromarray(np.dstack([arr, (alpha * 255).astype(np.uint8)]), "RGBA")
    im.save(out, quality=quality, lossless=bool(alpha is not None)) \
        if str(out).endswith(".webp") else im.save(out)
    return out


if __name__ == "__main__":
    kw = dict(v.split("=", 1) for v in sys.argv[3:])
    franky(sys.argv[1], sys.argv[2],
           pitch=float(kw.get("pitch", PITCH)), palette=kw.get("palette", "coral"),
           amp=float(kw.get("amp", AMP)), ss=int(kw.get("ss", SS)),
           smooth=int(kw.get("smooth", SMOOTH)),
           contrast=float(kw.get("contrast", CONTRAST)),
           gamma=float(kw.get("gamma", GAMMA)),
           floor=float(kw.get("floor", FLOOR)), ceil=float(kw.get("ceil", CEIL)),
           transparent=kw.get("transparent", "0") == "1",
           quality=int(kw.get("quality", 80)))
