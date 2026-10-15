"""Labels each pixel of the master as body, leaf, or ink, for vectorize.py.

    uv run --with pillow --with numpy python flatten.py
    KYLLM_SRC=poses/happy.png KYLLM_WORK=build/happy uv run --with rembg --with onnxruntime --with pillow --with numpy python flatten.py

Writes labels.png: 0 body, 1 leaf, 3 ink (glasses and eyes), 255 empty.
KYLLM_SRC picks another render (a pose) and KYLLM_WORK the folder for its
labels and matte; the matte is made with rembg when that folder has none.
Labels follow colour, not drawing: the leaf is the only green part and the
glasses and eyes the only dark ones, so nothing is traced by hand.
"""
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).parent
SRC = HERE / os.environ.get("KYLLM_SRC", "master.png")
WORK = HERE / os.environ.get("KYLLM_WORK", ".")
WORK.mkdir(parents=True, exist_ok=True)
MATTE = HERE / "master-matte.png" if SRC == HERE / "master.png" else WORK / "matte.png"
if not MATTE.exists():
    from rembg import new_session, remove
    remove(Image.open(SRC).convert("RGB"), session=new_session("birefnet-general-lite"), only_mask=True).save(MATTE)

rgb = np.asarray(Image.open(SRC).convert("RGB"), dtype=np.float32)
a = np.asarray(Image.open(MATTE).convert("L"), dtype=np.float32) / 255
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

label = np.zeros(a.shape, np.uint8)                       # body
label[(g > r) & (g > b - 10)] = 1                         # leaf: the only part where green beats red
label[rgb.max(-1) < 95] = 3                               # ink: glasses and eyes
label = np.asarray(Image.fromarray(label).filter(ImageFilter.ModeFilter(7))).copy()
label[a < 0.5] = 255
Image.fromarray(label).save(WORK / "labels.png")
print({k: int((label == k).sum()) for k in (0, 1, 3)})
