"""Builds the background images for the hero's Selected Work cards.

    uv run --with pillow --with numpy python build_work_cards.py

Each card is toned in its project's own colour, with white text set on it: a
dark ground in that colour and a large mark, cropped by the card's edges,
dotted in a light tint of it through an 8x8 Bayer screen in 4px cells (about
1.3px on a 220px card). The mark sits right of centre, cropped by the right
edge, between the name at the top left and the figure at the bottom, dotted at
62% cover; a sparse screen of the same tint fades from the top of the card to
nothing by the middle. White text is 6.4:1 or better on every ground.

  card                      ground   tint     mark
  document-intelligence     #11567f  #29b5e8  Snowflake (the work runs on Snowflake Cortex)
  investment-data-platform  #0e6b63  #5cc9bc  FastAPI (its services)
  aicomprehend              #4b34f4  #9780ff  its robot mark (both colours from its brand manual)
  gdg-davao                 #174ea6  #8ab4f8  the GDG mark

The Career Highlights cards (experience, certifications, industries,
speaking) use one Unsplash photo each instead of a mark; see PHOTOS below.

Marks come from public/logos, rasterized with sharp (node). The brand manual
page is Kyle's (~/Desktop/Pics/General Photos) and stays out of the repo; only
the processed cards are written. (A DevFest group photo screened the same way
lost the people to texture, so GDG Davao uses its mark.)

Writes public/projects/cards/<card>.webp at 660x660 (3x a 220x220 card).
"""
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
PICS = Path.home() / "Desktop/Pics/General Photos"
OUT = ROOT / "public/projects/cards"
W, H = 660, 660
CELL = 4
B8 = np.array([[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
               [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
               [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
               [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]]) / 64.0


def hexrgb(h: str) -> np.ndarray:
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32)


# card: (mark, ground, tint, mark size in px, centre x, centre y)
CARDS = {
    "document-intelligence": ("snowflake", "#11567f", "#29b5e8", 700, 560, 300),
    "investment-data-platform": ("fastapi", "#0e6b63", "#5cc9bc", 600, 560, 300),
    "aicomprehend": ("aicomprehend", "#4b34f4", "#9780ff", 520, 520, 280),
    "gdg-davao": ("gdg", "#174ea6", "#8ab4f8", 680, 540, 290),
}


def raster_logos(names: list[str], tmp: Path) -> dict[str, Image.Image]:
    """public/logos/<name>.svg to RGBA at 1400px with sharp, cropped to the mark."""
    js = ";".join(
        f"await sharp('public/logos/{n}.svg',{{density:900}}).resize(1400,1400,{{fit:'contain',"
        f"background:{{r:0,g:0,b:0,alpha:0}}}}).png().toFile('{tmp}/{n}.png')" for n in names
    )
    subprocess.run(["node", "-e", f"const sharp=require('sharp');(async()=>{{{js}}})()"], cwd=ROOT, check=True)
    out = {}
    for n in names:
        im = Image.open(tmp / f"{n}.png").convert("RGBA")
        out[n] = im.crop(im.getbbox())
    return out


def aicomprehend_mark() -> Image.Image:
    """The robot mark from the brand manual's logo-mark page: its purple pixels, as RGBA."""
    page = Image.open(PICS / "AIComprehend Brand Manual-04.png").convert("RGB")
    a = np.asarray(page, np.float32)
    sat = (a.max(-1) - a.min(-1)) / (a.max(-1) + 1e-4)
    on = ((sat > 0.45) & (a[..., 2] > a[..., 0])).astype(np.uint8) * 255
    rgba = page.convert("RGBA")
    rgba.putalpha(Image.fromarray(on))
    half = rgba.crop((page.width // 2, 0, page.width, page.height))
    return half.crop(half.getbbox())


def coverage(mark: Image.Image, size: int, cx: int, cy: int) -> np.ndarray:
    """Per-cell dot cover: 0.62 inside the mark, a sparse top-down fade outside it."""
    alpha = Image.new("L", (W, H), 0)
    s = size / max(mark.size)
    m = mark.resize((round(mark.width * s), round(mark.height * s)), Image.LANCZOS)
    alpha.paste(m.getchannel("A"), (cx - m.width // 2, cy - m.height // 2))
    return cover_of(alpha)


def cover_of(alpha: Image.Image, scale: float = 0.62) -> np.ndarray:
    """Per-cell dot cover: alpha times scale, over a sparse top-down fade."""
    sw, sh = W // CELL, H // CELL
    inside = np.asarray(alpha.resize((sw, sh), Image.BOX), np.float32) / 255
    fade = np.clip(1 - np.arange(sh) / (sh * 0.5), 0, 1)[:, None] * 0.14
    return np.maximum(inside * scale, fade)


def screen(cover: np.ndarray, ground: str, tint: str) -> Image.Image:
    sh, sw = cover.shape
    t = np.tile(B8, (sh // 8 + 1, sw // 8 + 1))[:sh, :sw]
    arr = np.where((t < cover)[..., None], hexrgb(tint), hexrgb(ground))
    out = Image.fromarray(arr.astype(np.uint8))
    return out.resize((sw * CELL, sh * CELL), Image.NEAREST).resize((W, H), Image.NEAREST)


OUT.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    marks = raster_logos(["snowflake", "fastapi", "gdg"], Path(tmp))
marks["aicomprehend"] = aicomprehend_mark()
for card, (name, ground, tint, size, cx, cy) in CARDS.items():
    screen(coverage(marks[name], size, cx, cy), ground, tint).save(OUT / f"{card}.webp", quality=92, method=6)
    print(f"wrote public/projects/cards/{card}.webp")

# the career cards: one image each, screened in one of the brand's data
# colours at a depth that holds white text, through a fine Bayer screen (3px
# cells, 1px on a 220px card; a duotone read better but Kyle picked the
# dither on 2026-10-15). Bright photos are inverted so
# their dark subject becomes the tint and the card stays dark.
#   experience      Kyle at his laptop, ~/Pictures/portfolio-refs/kyle (not in the repo),
#                   close on the laptop with his face at the top (crop B, picked 2026-10-15)
#   certifications  the OpenAI sign on a building, Kyle's pick (sources/certifications-openai.jpg)
#   industries      glass towers from below, Kyle's pick (sources/industries-towers.jpg)
#   speaking        microphone, Kane Reinholdtsen (Unsplash License)  unsplash.com/photos/LETdkk7wHQk
PHOTOS = {
    # card: (source, crop x0 y0 x1 y1 as fractions, ground, tint, gamma, invert); a source
    # is an images.unsplash.com id, a path under scripts/hero, or logo:<public/logos name>
    "experience": ("~/Pictures/portfolio-refs/kyle/laptop-cafe.jpg", (0.3, 0.38, 1.0, 0.905), "#9e2a16", "#f5482d", 2.2, False),
    "certifications": ("sources/certifications-openai.jpg", (0.17, 0.1351, 0.57, 0.8462), "#2c4a66", "#86a9c8", 1.0, False),
    "industries": ("sources/industries-towers.jpg", (0.12, 0.0, 0.72, 1.0), "#2f6b4f", "#7fb99a", 1.4, True),
    "speaking": ("photo-1475721027785-f74eccf877e2", (0.2, 0.0, 0.86, 1.0), "#7a4e0c", "#e9b65c", 1.8, False),
}


def logo_image(name: str, tmp: Path) -> Path:
    """A mark as a photo-like source: white on black, sized and placed right of
    centre so the card's edges crop it and the text clears it."""
    mark = raster_logos([name], tmp)[name]
    card = Image.new("L", (1600, 1600), 0)
    s = 900 / max(mark.size)
    m = mark.resize((round(mark.width * s), round(mark.height * s)), Image.LANCZOS)
    card.paste(255, (1080 - m.width // 2, 700 - m.height // 2), m.getchannel("A"))
    path = tmp / f"logo-{name}.png"
    card.save(path)
    return path


def source(src: str, tmp: Path) -> Path:
    if src.startswith("logo:"):
        return logo_image(src[5:], tmp)
    if src.startswith("photo-"):
        return fetch(src, tmp)
    return Path(src).expanduser() if src.startswith("~") else HERE / src


def fetch(photo_id: str, tmp: Path) -> Path:
    import urllib.request
    path = tmp / f"{photo_id}.jpg"
    req = urllib.request.Request(f"https://images.unsplash.com/{photo_id}?fm=jpg&q=85&w=1600", headers={"User-Agent": "Mozilla/5.0"})
    path.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    return path


def photo_tone(path: Path, box, gamma: float, invert: bool) -> np.ndarray:
    """A photo's light, 0 to 1, at card size: cropped, then centre-cropped square, levelled."""
    im = ImageOps.exif_transpose(Image.open(path)).convert("L")
    x0, y0, x1, y1 = (int(v * s) for v, s in zip(box, (im.width, im.height, im.width, im.height)))
    im = im.crop((x0, y0, x1, y1))
    side = min(im.size)
    im = im.crop(((im.width - side) // 2, (im.height - side) // 2, (im.width - side) // 2 + side, (im.height - side) // 2 + side))
    im = ImageOps.autocontrast(im.resize((W, H), Image.LANCZOS), cutoff=1)
    v = np.asarray(im, np.float32) / 255
    return ((1 - v) if invert else v) ** gamma


def fine_screen(tone: np.ndarray, ground: str, tint: str, cell: int = 3) -> Image.Image:
    """The same light through the Bayer screen in 3px cells (1px on a 220px card), at most 85% cover."""
    small = Image.fromarray((tone * 255).astype(np.uint8)).resize((W // cell, H // cell), Image.BOX)
    v = np.asarray(small, np.float32) / 255 * 0.85
    sh, sw = v.shape
    t = np.tile(B8, (sh // 8 + 1, sw // 8 + 1))[:sh, :sw]
    arr = np.where((t < v)[..., None], hexrgb(tint), hexrgb(ground))
    return Image.fromarray(arr.astype(np.uint8)).resize((sw * cell, sh * cell), Image.NEAREST).resize((W, H), Image.NEAREST)


with tempfile.TemporaryDirectory() as tmp:
    for card, (pid, box, ground, tint, gamma, invert) in PHOTOS.items():
        tone = photo_tone(source(pid, Path(tmp)), box, gamma, invert)
        fine_screen(tone, ground, tint).save(OUT / f"{card}.webp", quality=92, method=6)
        print(f"wrote public/projects/cards/{card}.webp")
