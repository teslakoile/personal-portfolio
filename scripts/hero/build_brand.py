"""Builds the site icons and the share-image photo from the hero source.

    uv run --with pillow --with numpy python build_brand.py

Icons (the locked set): Kyle in brand ink #1c1917 on brand cream #faf9f7, no
dither. Writes app/favicon.ico (16/32/48), app/icon.png (512),
app/apple-icon.png (180) and public/icons/{icon-192,icon-512,maskable-512}.png.
icon.png matters as much as the favicon: Chrome on a Retina screen draws the
tab from the 512 PNG, not the ICO.

Share-image photo: the hero card, Kyle in true colour over a two-tone coral
Bayer dither, written to app/_og/kyle-card.png for app/opengraph-image.tsx.

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
CORAL_LO, CORAL_HI = (0xE0, 0x40, 0x1F), (0xFF, 0xD2, 0xBF)
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0

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


def coral_dither(img: Image.Image, cell: int) -> Image.Image:
    L = ImageOps.autocontrast(img.convert("L"), cutoff=2)
    sw, sh = img.width // cell, img.height // cell
    g = np.asarray(L.resize((sw, sh), Image.BOX), dtype=float) / 255
    t = np.tile(BAYER, (sh // 4 + 1, sw // 4 + 1))[:sh, :sw]
    lvl = np.clip(np.floor(g + t), 0, 1).astype(int)
    pal = np.array([CORAL_LO, CORAL_HI], dtype=np.uint8)
    return Image.fromarray(pal[lvl]).resize(img.size, Image.NEAREST)


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

# Share-image photo, framed like the hero card (330x384) at 2x.
W = 750
H = round(W * 384 / 330)
sub, m, raw = crop(W, HEAD_TOP - 435, H)
out = (660, 768)
card = Image.composite(
    sub.resize(out, Image.LANCZOS),
    coral_dither(raw.resize(out, Image.LANCZOS), 3),
    m.resize(out, Image.LANCZOS),
)
(ROOT / "app/_og").mkdir(exist_ok=True)
card.save(ROOT / "app/_og/kyle-card.png", optimize=True)
print("wrote app/_og/kyle-card.png")
