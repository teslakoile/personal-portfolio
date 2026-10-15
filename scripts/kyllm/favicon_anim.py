"""Static icons for the circular sky KYLLM (option D1), from public/kyllm/kyllm-flat.png.

Writes:
  app/icon.png, app/favicon.ico, app/apple-icon.png    static, from the open frame
  public/icons/icon-{192,512}.png, maskable-512.png    web manifest icons

The animated frames come from favicon_anim_options.py.

    python3 scripts/kyllm/favicon_anim.py
"""

from PIL import Image

import favicon_frame as d

ROOT = d.ROOT
ICONS = ROOT / "public/icons"
APP = ROOT / "app"


def main() -> None:
    flat = Image.open(d.SRC).convert("RGBA")
    cx, cy, D = d.avatar_frame(flat)
    box = (cx - D / 2, cy - D / 2, cx + D / 2, cy + D / 2)
    masters = {"open": d.shape(d.cut(flat, box, d.SKY), "circle", False)}

    # --- static icons from the open frame ---
    circle = masters["open"]
    circle.resize((512, 512), Image.LANCZOS).save(APP / "icon.png", optimize=True)
    circle.resize((512, 512), Image.LANCZOS).save(ICONS / "icon-512.png", optimize=True)
    circle.resize((192, 192), Image.LANCZOS).save(ICONS / "icon-192.png", optimize=True)
    circle.resize((256, 256), Image.LANCZOS).save(
        APP / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    # apple touch icon: opaque full-bleed square, iOS rounds it itself
    sq = d.cut(flat, box, d.SKY).resize((180, 180), Image.LANCZOS).convert("RGB")
    sq.save(APP / "apple-icon.png", optimize=True)
    # maskable: whole cat, sky to the edge, the avatar circle sits in the 80% safe zone
    m = D / 0.8
    mbox = (cx - m / 2, cy - m / 2, cx + m / 2, cy + m / 2)
    d.cut(flat, mbox, d.SKY).resize((512, 512), Image.LANCZOS).convert("RGB").save(
        ICONS / "maskable-512.png", optimize=True
    )
    print("static icons written")


if __name__ == "__main__":
    main()
