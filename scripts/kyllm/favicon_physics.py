"""Springs, geometry and drawing helpers for the KYLLM favicon bounce.

The bounce is a vertical squash and stretch about the bottom pivot, driven by a damped spring (the
body), with the leaf on a second, slower torsion spring driven by the inertial torque of its moving base,
and a glint streak timed from the body's first stretch peak. Poses are dicts for frame_svg in
favicon_anim_options.py; nothing is drawn by hand and the cat is never translated.

  Variant   the spring and command parameters of one bounce (BIG is the Big Bouncy beat)
  Geom      the flat KYLLM's outline, glasses and eyes as landmarks, to measure apparent motion in icon px
  landmarks, step_px   where the landmarks of a pose sit, and how far the largest one moves between poses
  glint_state, glint_duration   the glint's position and light across a beat
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass

import numpy as np
from PIL import ImageFont

DT = 0.0005          # integration step, s
ICON = 32            # px, the frame size a tab uses on a 2x display
                     # about the finest step a 32 px icon can show)
STEP_FLAG_PX = 1.5   # icon px of apparent motion per frame that we flag
LEAF_STOP = -34.0    # deg, the leaf lies on the head here
GLINT_IN, GLINT_OUT = 0.03, 1.0  # glint positions where the streak enters and leaves the lenses
GLINT_X0, GLINT_SPAN = 230.0, 760.0  # glint_svg: x = 230 + t * 760 (flat px)
# glint_svg's bars span x-46..x+54 about x+4. The lens openings span x 383..602 and 686..875 at their
# widest (mid height); the -22 degree skew moves the bars sideways only where the ellipses are narrow,
# so 10 px of reach covers it (checked against the light each frame adds at 32 px).
LENS_X = ((383.0, 602.0), (686.0, 875.0))
GLINT_REACH = 50.0 + 10.0
SHUTTER = 0.5        # fraction of a frame interval the glint is smeared over


# ---- variants --------------------------------------------------------------


@dataclass
class Variant:
    id: str
    label: str
    name: str
    note: str
    fps: float
    # body spring: natural frequency (Hz), damping ratio
    f_body: float
    z_body: float
    # muscle command keys: crouch depth and push height as strain, and times (s)
    crouch: float
    push: float
    t_crouch: float      # ease down into the crouch
    t_hold: float        # hold the crouch
    t_rise: float        # release, crouch to push
    t_push: float        # hold the push
    t_fall: float        # push back to zero
    # leaf torsion spring
    f_leaf: float
    z_leaf: float
    # glint: "peak", "settle" or "first"
    glint: str
    # eye openness at full crouch (1 = no squint)
    squint: float = 0.6
    glare: float = 0.0   # eye openness dip under the glint, "first" only
    delay: float = 0.0   # body start after beat start, s (set for "first")
    rest: tuple = (1600, 1400)
    step_limit: float = STEP_FLAG_PX  # icon px per frame above which a midpoint frame is inserted
    glint_width: float = 1.0          # lit band width, as a multiple of glint_svg's bars

    def __post_init__(self):
        if self.glint == "first" and not self.delay:
            # the crouch begins as the streak reaches the second lens, about 54% of the sweep
            self.delay = round(0.54 * glint_duration(self), 3)


def glint_duration(v: "Variant") -> float:
    """1.1 damped body periods, clamped to 250..350 ms."""
    Td = 1 / (v.f_body * math.sqrt(max(1 - v.z_body ** 2, 0.05)))
    return min(max(1.1 * Td, 0.25), 0.35)


# Round 1 jelly size (12% squash, 10% stretch) under the same physics: a deeper, faster crouch and a harder
# push. Its peak speed needs 30 fps to keep every step under 2 px; V is the same trace at 20 fps, where the
# steps that would pass 2 px get in-between frames.
BIG = Variant("combo-big", "U", "Big Bouncy, 30 fps",
              "The Round 1 jelly's size under the same physics: a deep crouch and a hard push, so the body squashes "
              "about 14% and stretches about 12%. A wider glint crosses at the top of the stretch. Shown at 30 "
              "frames a second so no step moves more than two pixels.",
              fps=30, f_body=2.5, z_body=0.16, crouch=0.115, push=0.06,
              t_crouch=0.16, t_hold=0.03, t_rise=0.05, t_push=0.03, t_fall=0.08,
              f_leaf=2.2, z_leaf=0.35, glint="peak", squint=0.65, step_limit=2.0, glint_width=1.3)


# ---- geometry --------------------------------------------------------------


def polygon(d: str) -> np.ndarray:
    n = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", d)]
    return np.array(list(zip(n[0::2], n[1::2])))


def plate(pts: np.ndarray, base) -> tuple[float, np.ndarray, float]:
    """Area, centroid offset from base, and second moment of area about base."""
    x, y = pts[:, 0] - base[0], pts[:, 1] - base[1]
    x1, y1 = np.roll(x, -1), np.roll(y, -1)
    cr = x * y1 - x1 * y
    A = cr.sum() / 2
    c = np.array([((x + x1) * cr).sum(), ((y + y1) * cr).sum()]) / (6 * A)
    Ixx = ((y * y + y * y1 + y1 * y1) * cr).sum() / 12
    Iyy = ((x * x + x * x1 + x1 * x1) * cr).sum() / 12
    return abs(A), c, abs(Ixx + Iyy)


def ellipse_pts(cx, cy, rx, ry, deg, n=48):
    a = np.linspace(0, 2 * np.pi, n, endpoint=False)
    r = math.radians(deg)
    x, y = rx * np.cos(a), ry * np.sin(a)
    return np.stack([cx + x * math.cos(r) - y * math.sin(r), cy + x * math.sin(r) + y * math.cos(r)], 1)


@dataclass
class Geom:
    pivot: tuple
    leaf_base: tuple
    body: np.ndarray
    leaf: np.ndarray
    eyes: list
    cx: float
    cy: float
    D: float

    def __post_init__(self):
        self.leaf_area, self.leaf_c, self.leaf_I = plate(self.leaf, self.leaf_base)
        self.glasses = np.concatenate([
            ellipse_pts(492.5, 498.5, 153.1, 129.9, 81.66), ellipse_pts(780.7, 486.0, 150.2, 112.6, 75.30),
            np.array([[622.0, 487.7], [666.3, 483.8], [362.3, 498.8], [269.1, 510.1]])])

    def icon(self, p: np.ndarray) -> np.ndarray:
        """flat px -> 32 px icon px"""
        return (p - [self.cx - self.D / 2, self.cy - self.D / 2]) * ICON / self.D

    def visible(self, p: np.ndarray) -> np.ndarray:
        return np.hypot(p[:, 0] - self.cx, p[:, 1] - self.cy) < self.D / 2


# ---- simulation ------------------------------------------------------------


def ease(a, b, x):
    x = min(max(x, 0.0), 1.0)
    return a + (b - a) * (1 - math.cos(math.pi * x)) / 2


def command(v: Variant, t: float) -> float:
    """The muscle command u(t): cosine-eased keys, so it is C1 (no force step)."""
    t -= v.delay
    keys = [(0, 0.0), (v.t_crouch, -v.crouch), (v.t_hold, -v.crouch), (v.t_rise, v.push),
            (v.t_push, v.push), (v.t_fall, 0.0)]
    t0, val = 0.0, 0.0
    if t <= 0:
        return 0.0
    for dt, target in keys[1:]:
        if t < t0 + dt:
            return ease(val, target, (t - t0) / dt)
        t0, val = t0 + dt, target
    return 0.0


def glint_state(tr, t: float, shutter: float, width: float = 1.0):
    """position (glint_svg units), opacity, smear (flat px) at time t."""
    g0, dur = tr["glint_t0"], tr["glint_dur"]
    speed = (GLINT_OUT - GLINT_IN) / dur
    tc = t - shutter / 2  # centre of the shutter interval
    u = (tc - g0) / dur
    if u <= 0 or u >= 1:
        return None
    op = 0.92 * math.sin(math.pi * u) ** 0.6
    pos, smear = GLINT_IN + speed * (tc - g0), speed * GLINT_SPAN * shutter
    xc = GLINT_X0 + pos * GLINT_SPAN + 4
    reach = GLINT_REACH + 50.0 * (width - 1) + smear / 2
    if op < 0.06 or not any(xc + reach > a and xc - reach < b for a, b in LENS_X):
        return None  # too faint, or between or outside the lenses: nothing to draw
    return pos, op, smear


REST = dict(sx=1.0, sy=1.0, leaf=0.0, leaf_rigid=True, eye=1.0)


def landmarks(p: dict, g: Geom) -> np.ndarray:
    """Every shape vertex of a pose, in icon px. Invisible points are NaN.

    Mirrors frame_svg: scale about the pivot, then rotate about it (rot, deg); the eyes shift by
    (ex, ey) inside the body; the rigid leaf turns about its carried base."""
    sx, sy = p.get("sx", 1), p.get("sy", 1)
    P = np.array(g.pivot)
    r = math.radians(p.get("rot", 0))
    Rr = np.array([[math.cos(r), -math.sin(r)], [math.sin(r), math.cos(r)]])

    def cat(q):
        return P + ((q - P) * [sx, sy]) @ Rr.T

    body = cat(g.body)
    glasses = cat(g.glasses)
    eyes = []
    shift = np.array([p.get("ex", 0), p.get("ey", 0)])
    for (ecx, ecy, rx, ry, deg) in g.eyes:
        eyes.append(cat(ellipse_pts(ecx, ecy, rx * p.get("eye", 1), ry, deg, 16) + shift))
    th = math.radians(p.get("leaf", 0)) + r
    R = np.array([[math.cos(th), -math.sin(th)], [math.sin(th), math.cos(th)]])
    base = np.array(g.leaf_base)
    leaf = cat(base) + (g.leaf - base) @ R.T
    pts = np.concatenate([body, glasses, *eyes, leaf])
    vis = g.visible(pts)
    out = g.icon(pts)
    out[~vis] = np.nan
    return out


def glint_point(p: dict, g: Geom):
    if p.get("glint") is None:
        return None
    x = GLINT_X0 + p["glint"] * GLINT_SPAN
    P = np.array(g.pivot)
    r = math.radians(p.get("rot", 0))
    Rr = np.array([[math.cos(r), -math.sin(r)], [math.sin(r), math.cos(r)]])
    q = P + ((np.array([x, 500.0]) - P) * [p.get("sx", 1), p.get("sy", 1)]) @ Rr.T
    return g.icon(q[None])[0], p.get("glint_op", 0.92)


def step_px(a: dict, b: dict, g: Geom) -> tuple[float, float]:
    """(shape step, glint step) in icon px between two poses."""
    la, lb = landmarks(a, g), landmarks(b, g)
    d = np.hypot(*(la - lb).T)
    shape = float(np.nanmax(d)) if np.isfinite(d).any() else 0.0
    ga, gb = glint_point(a, g), glint_point(b, g)
    glint = 0.0
    if ga and gb:
        glint = float(np.hypot(*(ga[0] - gb[0])))
    return shape, glint


# ---- frames ----------------------------------------------------------------


# ---- checks ----------------------------------------------------------------


# ---- pictures --------------------------------------------------------------

INK = (28, 25, 23)
GRID = (231, 227, 222)
C_BODY, C_CMD, C_LEAF, C_GLINT, C_EYE = (245, 72, 45), (168, 162, 158), (79, 145, 110), (60, 120, 200), (28, 25, 23)


def font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


