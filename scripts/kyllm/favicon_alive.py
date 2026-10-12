"""Shared pieces for the KYLLM favicon's idle-plus-bounce loop (favicon_snappy.py builds on this).

BEAT_30 is the bounce: the Big Bouncy jelly + leaf + glint command with its crouch and push trimmed so
that, with the idle's small motion added, no 30 fps step passes 2 px. env_px measures how big an
oscillation envelope looks in icon px (it decides when a bounce has settled enough to hand back to the
idle ring), parts splits the landmark array, and strip draws a filmstrip with per-frame step sizes.
Like favicon_physics.py it only produces poses for frame_svg; nothing is drawn by hand.
"""

from __future__ import annotations

import dataclasses
import math

import numpy as np
from PIL import Image, ImageDraw

import favicon_physics as ph

STILL_PX = 0.1        # per-frame motion under this counts as still


# U's beat, crouch and push trimmed about 9% so that with the (larger, X) idle motion added no 30 fps step
# passes 2 px; with the idle on top the body still reaches about the same squash and stretch as U
BEAT_30 = dataclasses.replace(ph.BIG, id="alive-beat", label="", name="", note="", crouch=0.105, push=0.055)


def env_px(g: ph.Geom, v: ph.Variant, ds, dsd, dth, dthd, rest_lm) -> float:
    """apparent size (icon px) of an oscillation envelope, measured as in Round 3"""
    wb, wl = 2 * math.pi * v.f_body, 2 * math.pi * v.f_leaf
    s_amp = math.hypot(ds, dsd / wb)
    th_amp = math.degrees(math.hypot(dth, dthd / wl))
    worst = 0.0
    for sign in (1, -1):
        env = dict(ph.REST, sx=1 / (1 + sign * s_amp), sy=1 + sign * s_amp, leaf=sign * th_amp)
        worst = max(worst, float(np.nanmax(np.hypot(*(ph.landmarks(env, g) - rest_lm).T))))
    return worst


# ---- metrics ---------------------------------------------------------------


def parts(g: ph.Geom):
    nb, ngl, ne = len(g.body), len(g.glasses), 2 * 16
    return dict(body=slice(0, nb + ngl), eyes=slice(nb + ngl, nb + ngl + ne), leaf=slice(nb + ngl + ne, None))


def strip(title, names, holds, poses, png32, path, g, limit, per=12):
    cell = 100
    rows = math.ceil(len(names) / per)
    W_ = per * cell + 20
    H = 44 + rows * (cell * 2 + 44)
    im = Image.new("RGB", (W_, H), (250, 249, 247))
    d = ImageDraw.Draw(im)
    f = ph.font(11)
    d.text((10, 10), title, fill=ph.INK, font=ph.font(14))
    t = 0
    prev = None
    for i, (n, ms) in enumerate(zip(names, holds)):
        r, c = divmod(i, per)
        x, y = 10 + c * cell, 34 + r * (cell * 2 + 44)
        src = png32[n].convert("RGBA")
        big = Image.new("RGBA", (96, 96), (255, 255, 255, 255))
        big.alpha_composite(src.resize((96, 96), Image.NEAREST))
        im.paste(big.convert("RGB"), (x, y))
        small = src.resize((16, 16), Image.LANCZOS)
        s2 = Image.new("RGBA", (96, 96), (255, 255, 255, 255))
        s2.alpha_composite(small.resize((96, 96), Image.NEAREST))
        im.paste(s2.convert("RGB"), (x, y + cell))
        st = ph.step_px(poses[prev], poses[n], g)[0] if prev else 0.0
        col = (200, 40, 20) if st > limit or (prev and st < STILL_PX) else ph.INK
        d.text((x, y + 2 * cell - 2), f"{n.split('-')[-1]} {t}+{ms}", fill=ph.INK, font=f)
        d.text((x, y + 2 * cell + 12), f"step {st:.2f}", fill=col, font=f)
        t += ms
        prev = n
    im.save(path)


