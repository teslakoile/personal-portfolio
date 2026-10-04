"""Builds the site icons and the share-image photo from the hero source.

    uv run --with pillow --with numpy python build_brand.py

Icons (the locked set): Kyle in brand ink #1c1917 on brand cream #faf9f7, no
dither. Writes app/favicon.ico (16/32/48), app/icon.png (512),
app/apple-icon.png (180) and public/icons/{icon-192,icon-512,maskable-512}.png.
icon.png matters as much as the favicon: Chrome on a Retina screen draws the
tab from the 512 PNG, not the ICO.

Share-image photo: the hero card, Kyle in true colour over a dither of the
photo in its own colours on cream (blue cloudy sky, red bridge, no cables),
written to app/_og/kyle-card.png for app/opengraph-image.tsx.

Both use subject-matte-birefnet.png, rembg `birefnet-general-lite` run on the
2048x3072 master and downscaled to source.png. The older u2net matte
(subject-matte.png, still used by build-icon.sh) leaves a grey-blue sky halo
round the hair and hood; this one, choked 1px with the edge colours pulled from
the subject, does not.
"""
import struct
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
INK, CREAM = (0x1C, 0x19, 0x17), (0xFA, 0xF9, 0xF7)

src = Image.open(ROOT / "public/hero/source.png").convert("RGB")
matte = Image.open(HERE / "subject-matte-birefnet.png").convert("L")

# Anchor every crop on the head, not the figure: the shoulders pull the
# figure's centroid off-centre.
on = np.asarray(matte) > 128
ys, xs = np.where(on)
HEAD_TOP = int(ys.min())
CX = int(xs[ys < HEAD_TOP + 130].mean())


def refine(rgb: Image.Image, m: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Choke the matte 1px and replace edge colours with nearby subject colours,
    so no sky bleeds into the outline."""
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.9))
    a = np.asarray(m, dtype=np.float32) / 255
    c = np.asarray(rgb, dtype=np.float32)
    hard = (a > 0.98).astype(np.float32)

    def blur(arr, r):
        return np.asarray(Image.fromarray(arr).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32)

    den = blur((hard * 255).astype(np.uint8), 3) / 255 + 1e-4
    fg = np.stack([blur((c[..., i] * hard).astype(np.uint8), 3) / den for i in range(3)], -1)
    edge = ((a > 0.02) & (a < 0.98))[..., None]
    return Image.fromarray(np.where(edge, np.clip(fg, 0, 255), c).astype(np.uint8)), m


def crop(side: int, headroom: int, h: int):
    """A side-wide, h-tall box centred on the head, headroom px above the crown."""
    box = (CX - side // 2, HEAD_TOP - headroom, CX - side // 2 + side, HEAD_TOP - headroom + h)
    return refine(src.crop(box), matte.crop(box)) + (src.crop(box),)


def ink_icon(size: int, side: int, headroom: int) -> Image.Image:
    sub, m, _ = crop(side, headroom, side)
    g = ImageEnhance.Contrast(ImageOps.autocontrast(sub.convert("L"), cutoff=1)).enhance(1.12)
    duo = ImageOps.colorize(g, black=INK, white=CREAM).resize((size, size), Image.LANCZOS)
    return Image.composite(duo, Image.new("RGB", (size, size), CREAM), m.resize((size, size), Image.LANCZOS))


def check_ico(path: Path) -> None:
    """Turbopack decodes the PNG inside the ICO and rejects any colour type but
    RGBA; webpack never looks, so an RGB save passes locally and fails on
    deploy. Fail here instead."""
    d = path.read_bytes()
    n = struct.unpack("<HHH", d[:6])[2]
    bad = []
    for i in range(n):
        w, h, *_, size, off = struct.unpack("<BBBBHHII", d[6 + i * 16 : 22 + i * 16])
        b = d[off : off + size]
        if b[:8] == b"\x89PNG\r\n\x1a\n" and b[25] != 6:
            bad.append(f"{w or 256}x{h or 256} is PNG colour type {b[25]}, not 6 (RGBA)")
    if bad:
        sys.exit("favicon.ico would fail the Turbopack build:\n  " + "\n  ".join(bad))
    print(f"favicon.ico: {n} frames, all RGBA")


# Crops in source.png pixels (1024x1536). Favicons crop tighter on the face;
# the maskable icon pads out so Android's circle crop never reaches him.
fav = ink_icon(256, 410, 45).convert("RGBA")
ico = ROOT / "app/favicon.ico"
fav.save(ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
check_ico(ico)

(ROOT / "public/icons").mkdir(exist_ok=True)
for path, size, side, headroom in [
    ("app/icon.png", 512, 575, 85),
    ("app/apple-icon.png", 180, 575, 85),
    ("public/icons/icon-192.png", 192, 575, 85),
    ("public/icons/icon-512.png", 512, 575, 85),
    ("public/icons/maskable-512.png", 512, 750, 165),
]:
    ink_icon(size, side, headroom).save(ROOT / path, optimize=True)
    print(f"wrote {path}")

# Share-image photo, framed like the hero card (330x384) at 2x: Kyle in true
# colour over a dither of the photo in its own colours (red bridge, blue-green
# water) on cream, with a soft cloudy blue sky and the bridge cables folded
# away. 3px cells, 8x8 Bayer. Locked 2026-10-04 ("option 2, soft clouds").
B8 = np.array([[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
               [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
               [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
               [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]]) / 64.0
SKY_DOT = np.array([92, 138, 206], dtype=np.float32)
SKY_GAP = np.array([212, 228, 247], dtype=np.float32)
CREAM_F = np.array(CREAM, dtype=np.float32)


def soft_blur(arr: np.ndarray, r: float) -> np.ndarray:
    img = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
    return np.asarray(img, dtype=np.float32) / 255


def cloud_noise(sh: int, sw: int, seed: int = 4, octaves: int = 4, base_cells: int = 6) -> np.ndarray:
    """Soft value noise, wider than tall like real cloud bands. Fixed seed, so
    every build draws the same clouds."""
    rng = np.random.default_rng(seed)
    out = np.zeros((sh, sw), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        gw = base_cells * 2**o
        gh = max(2, int(gw * 0.55))
        g = (rng.random((gh + 1, gw + 1)) * 255).astype(np.uint8)
        out += amp * np.asarray(Image.fromarray(g).resize((sw, sh), Image.BICUBIC), dtype=np.float32) / 255
        tot += amp
        amp *= 0.5
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-6)


def photo_dither(img: Image.Image, cell: int = 3, cloud: float = 0.7, mix: float = 0.5,
                 sky_level: float = 0.68, sat: float = 1.7, shade: float = 0.82) -> Image.Image:
    sw, sh = img.width // cell, img.height // cell
    small = img.resize((sw, sh), Image.BOX)
    a = np.asarray(small, dtype=np.float32) / 255
    mx, mn, lum = a.max(-1), a.min(-1), a.mean(-1)
    satv = (mx - mn) / (mx + 1e-4)
    # sky: bright, pale, blue-leaning
    w = np.clip((lum - 0.66) / 0.12, 0, 1) * np.clip((0.32 - satv) / 0.12, 0, 1) * (a[..., 2] >= a[..., 0] + 0.02)
    sky = w > 0.5
    # cables are 1-2 cells wide: closing the sky mask swallows them, the towers
    # and deck are far wider and reddish, so they stay
    m = Image.fromarray((sky * 255).astype(np.uint8))
    closed = np.asarray(m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))) > 127
    cables = closed & ~sky & ~(a[..., 0] > a[..., 2] + 0.025) & (lum > 0.45)
    w = np.maximum(w, cables.astype(np.float32))
    # cloud tone: the true sky's broad light (blurred far past cable width,
    # sampled from sky cells only) mixed with soft noise
    sm = sky.astype(np.float32)
    broad = soft_blur(lum * sm, 10) / np.maximum(soft_blur(sm, 10), 1e-3)
    b = broad[sky]
    rel = (1 - mix) * np.clip((broad - b.min()) / (b.max() - b.min() + 1e-4), 0, 1) + mix * cloud_noise(sh, sw)
    col = np.asarray(ImageEnhance.Color(small).enhance(sat), dtype=np.float32)
    L = np.asarray(ImageOps.autocontrast(small.convert("L"), cutoff=2), dtype=np.float32) / 255
    ww = w[..., None]
    dot_c = np.clip(col * shade, 0, 255) * (1 - ww) + SKY_DOT * ww
    gap_c = CREAM_F * (1 - ww) + SKY_GAP * ww
    L = L * (1 - w) + (sky_level + cloud * (rel - 0.5)) * w
    t = np.tile(B8, (sh // 8 + 1, sw // 8 + 1))[:sh, :sw]
    dot = (L < t * 0.85 + 0.08) | (L < 0.35)
    arr = np.where(dot[..., None], dot_c, gap_c).astype(np.uint8)
    return Image.fromarray(arr).resize((sw * cell, sh * cell), Image.NEAREST).resize(img.size, Image.NEAREST)


W = 750
H = round(W * 384 / 330)
sub, m, raw = crop(W, HEAD_TOP - 435, H)
out = (660, 768)
card = Image.composite(
    sub.resize(out, Image.LANCZOS),
    photo_dither(raw.resize(out, Image.LANCZOS)),
    m.resize(out, Image.LANCZOS),
)
(ROOT / "app/_og").mkdir(exist_ok=True)
card.save(ROOT / "app/_og/kyle-card.png", optimize=True)
print("wrote app/_og/kyle-card.png")
