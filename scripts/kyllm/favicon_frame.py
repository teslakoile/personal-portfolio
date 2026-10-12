"""The avatar frame every favicon image is cut from, and the shapes it is cut into.

avatar_frame gives the same crop as avatar.py (the circle that is the chat avatar), so the character sits
exactly where it does there; cut takes that frame from the 1024 px flat KYLLM over a flat background, and
shape masks it to a circle or a rounded square. Nothing is redrawn: every tile is a frame cut from
public/kyllm/kyllm-flat.png.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/kyllm/kyllm-flat.png"

SKY = (214, 228, 240, 255)
RING = (217, 211, 204, 255)

SIDE = 1024
SS = 3  # supersample for masks and rings


def avatar_frame(flat: Image.Image) -> tuple[float, float, float]:
    """cx, cy, D exactly as avatar.py computes them."""
    FRAME_D, FRAME_G, MARGIN = 1.15, 0.60, 0.08
    NUDGE = (0.03, 0.03)
    px = np.asarray(flat).astype(int)
    on = px[..., 3] > 128
    ink = on & (px[..., :3].max(-1) < 45)
    x0, y0, x1, y1 = flat.getbbox()
    D = FRAME_D * (x1 - x0)
    gy = np.where(ink)[0].mean()
    cy = gy - FRAME_G * D + D / 2
    cx = (x0 + x1) / 2
    ys, xs = np.nonzero(ink & (np.arange(ink.shape[0])[:, None] < gy + 0.12 * D))
    over = np.hypot(xs - cx, ys - cy).max() - D / 2 * (1 - 2 * MARGIN)
    while over > 0:
        cx += 1
        over = np.hypot(xs - cx, ys - cy).max() - D / 2 * (1 - 2 * MARGIN)
    cx += NUDGE[0] * D
    cy -= NUDGE[1] * D
    return cx, cy, D


def cut(flat: Image.Image, box: tuple[float, float, float, float], bg) -> Image.Image:
    """Cut `box` from the 1024 flat render, composite on `bg`, return SIDE x SIDE."""
    x0, y0, x1, y1 = box
    w = x1 - x0
    scale = SIDE * SS / w
    big = flat.resize((round(flat.width * scale), round(flat.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (SIDE * SS, SIDE * SS), bg)
    canvas.alpha_composite(big, (round(-x0 * scale), round(-y0 * scale)))
    return canvas


def shape(im: Image.Image, kind: str, ring: bool) -> Image.Image:
    """Mask `im` (SIDE*SS square) to a circle or rounded square, optional ring."""
    n = im.size[0]
    mask = Image.new("L", (n, n), 0)
    d = ImageDraw.Draw(mask)
    if kind == "circle":
        d.ellipse((0, 0, n - 1, n - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, n - 1, n - 1), radius=n * 0.22, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    if ring:
        w = round(n * 0.018)
        ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        if kind == "circle":
            od.ellipse((0, 0, n - 1, n - 1), outline=RING, width=w)
        else:
            od.rounded_rectangle((0, 0, n - 1, n - 1), radius=n * 0.22, outline=RING, width=w)
        out.alpha_composite(ov)
    return out.resize((SIDE, SIDE), Image.LANCZOS)


if __name__ == "__main__":
    main()
