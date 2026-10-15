"""Assembles the frames from motion.mjs into the files the site can use.

    uv run --with pillow python scripts/kyllm/motion.py

Writes to public/kyllm/motion/:

    kyllm-{idle,think,read}.webp            seamless loops, 192px, 20fps
    kyllm-{answered,curious,sorry}.webp     enter clips from idle, 1s at 30fps, play once
    kyllm-{state}.png                       one still frame per state, 192px

All are transparent outside the avatar's circle. Animated WebP plays in
every current browser and in GitHub READMEs; use the inline rig
(app/_brand/kyllm) on the site itself.
"""
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
SRC = HERE / "build/motion"
OUT = HERE.parent.parent / "public/kyllm/motion"
OUT.mkdir(parents=True, exist_ok=True)

for clip, fps, loop in [("idle", 20, 0), ("think", 20, 0), ("read", 20, 0),
                        ("answered", 30, 1), ("curious", 30, 1), ("sorry", 30, 1)]:
    frames = [Image.open(p).convert("RGBA") for p in sorted((SRC / clip).glob("*.png"))]
    # WebP's loop count: 0 repeats forever, 1 plays once.
    frames[0].save(OUT / f"kyllm-{clip}.webp", save_all=True, append_images=frames[1:],
                   duration=round(1000 / fps), loop=loop, lossless=False, quality=90, method=6)
    Image.open(SRC / "still" / f"{clip}.png").save(OUT / f"kyllm-{clip}.png", optimize=True)
    print(clip, len(frames), "frames")
