"""Cuts KYLLM out of the master render and writes the site assets.

    uv run --with pillow --with numpy python build_kyllm.py

master.png is the ground truth (see README.md). master-matte.png is rembg
`birefnet-general-lite` on it. Writes public/kyllm/kyllm.png (transparent,
trimmed to a square with even padding) and WebP sizes for the chat.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "public/kyllm"
SIZES = [512, 256, 96, 56]

src = Image.open(HERE / "master.png").convert("RGB")
matte = Image.open(HERE / "master-matte.png").convert("L")

# Choke 1px and soften, then pull edge colours from the solid subject so the
# off-white backdrop doesn't ring the glasses and leaf.
m = matte.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
a = np.asarray(m, dtype=np.float32) / 255
c = np.asarray(src, dtype=np.float32)
hard = (a > 0.98).astype(np.float32)


def blur(arr, r):
    return np.asarray(Image.fromarray(arr.astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32)


den = blur(hard * 255, 3) / 255 + 1e-4
fg = np.stack([blur(c[..., i] * hard, 3) / den for i in range(3)], -1)
edge = ((a > 0.02) & (a < 0.98))[..., None]
rgb = np.where(edge, np.clip(fg, 0, 255), c).astype(np.uint8)
cut = Image.fromarray(np.dstack([rgb, (a * 255).astype(np.uint8)]), "RGBA")

# Square crop centred on the character, 6% padding on the long side.
x0, y0, x1, y1 = cut.getbbox()
side = round(max(x1 - x0, y1 - y0) * 1.12)
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
sq = Image.new("RGBA", (side, side))
sq.paste(cut, (side // 2 - cx, side // 2 - cy))

OUT.mkdir(exist_ok=True)
sq.resize((1024, 1024), Image.LANCZOS).save(OUT / "kyllm.png", optimize=True)
for s in SIZES:
    sq.resize((s, s), Image.LANCZOS).save(OUT / f"kyllm-{s}.webp", quality=92, method=6)
print("bbox", (x0, y0, x1, y1), "side", side, "wrote", ", ".join(["kyllm.png"] + [f"kyllm-{s}.webp" for s in SIZES]))
