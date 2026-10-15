"""Rebuilds flat KYLLM from clean shapes fitted to the master.

    uv run --with pillow --with numpy python flatten.py
    uv run --with scikit-image --with scipy --with pillow --with numpy python vectorize.py

flatten.py labels the master's pixels (body, leaf, ink). Tracing those
labels directly keeps the render's noise: nicks, stray pixels, uneven rims.
This fits each part to a clean shape instead and draws only the shapes:

    body            one smooth bean, two ears rising out of it, soft fillets
    leaf            a leaf shape fitted to the leaf, its tip carried onto the head
    lenses          ellipses fitted to each lens opening, one even rim width
    eyes            ovals with each eye's own moments
    bridge, arm     capsules; the bridge's width is measured from the master

Nothing is drawn by hand: every position, size, and angle is measured from
the master. Writes flat.svg (crisp at any size) and flat.png (1024,
transparent, rendered at 4x and downsampled). The master already faces
right, toward the chat, so nothing is mirrored.
"""
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.interpolate import splev, splprep
from skimage import measure, morphology

HERE = Path(__file__).parent
WORK = HERE / os.environ.get("KYLLM_WORK", ".")   # labels in, flat.* out; build/<pose> for a pose
COL = {"body": "#f5482d", "leaf": "#7fb99a", "ink": "#1c1917"}

# Small refinements on top of the leaf fit: width (x the measured width), bow
# (x the length), turn about the base (degrees), and a nudge of the base (px).
LEAF_WIDTH, LEAF_BOW, LEAF_TURN, LEAF_NUDGE = 0.9, 0.05, 0.0, (-22, 4)
if os.environ.get("LEAF"):                    # e.g. LEAF="0.9,0.05,6,-12,4" to compare refinements
    _v = [float(x) for x in os.environ["LEAF"].split(",")]
    LEAF_WIDTH, LEAF_BOW, LEAF_TURN, LEAF_NUDGE = _v[0], _v[1], _v[2], (_v[3], _v[4])

lab = np.asarray(Image.open(WORK / "labels.png"))
H, W = lab.shape
body0, leaf0, ink = lab == 0, lab == 1, lab == 3
_l = measure.label(morphology.opening(leaf0, morphology.disk(6)))
leaf0 = _l == (np.argmax(np.bincount(_l.ravel())[1:]) + 1)
# The leaf's shaded underside reads as ink; it is neither ink nor leaf: the
# leaf is fitted to it as a whole, and the head's edge under it is bridged.
_near_leaf = morphology.dilation(leaf0, morphology.disk(12))
_ink = measure.label(ink)
under = np.zeros_like(ink)
for _i in np.unique(_ink[_near_leaf & ink]):
    if _i:
        ink = ink & (_ink != _i)
        under = under | (_ink == _i)


# ---------------------------------------------------------------- fitting

def pca(mask):
    ys, xs = np.nonzero(mask)
    pts = np.stack([xs, ys], 1).astype(float)
    c = pts.mean(0)
    w, v = np.linalg.eigh(np.cov((pts - c).T))
    u = v[:, 1]                       # major axis (unit, x/y)
    if u[1] < 0:
        u = -u                        # point "down" for a stable orientation
    return pts, c, u, np.array([-u[1], u[0]]), w[::-1]


def capsule(mask, lo=0.5, hi=99.5):
    """End points and width of the capsule that best covers mask."""
    pts, c, u, n, _ = pca(mask)
    s, t = (pts - c) @ u, (pts - c) @ n
    s0, s1 = np.percentile(s, [lo, hi])
    t0, t1 = np.percentile(t, [2, 98])
    w = t1 - t0 + 1
    mid = c + u * (s0 + s1) / 2 + n * (t0 + t1) / 2
    half = max((s1 - s0 + 1) / 2 - w / 2, 0)
    return mid - u * half, mid + u * half, w


def ellipse(mask):
    """Centre, semi-axes and angle of the ellipse with the same moments as mask."""
    _, c, u, _, lam = pca(mask)
    return c, 2 * np.sqrt(lam[0]), 2 * np.sqrt(lam[1]), np.arctan2(u[1], u[0])


def ellipse_pts(c, a, b, ang, n=720):
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    ca, sa = np.cos(ang), np.sin(ang)
    x, y = a * np.cos(th), b * np.sin(th)
    return np.stack([c[0] + x * ca - y * sa, c[1] + x * sa + y * ca], 1)


def smooth_outline(mask, n=700, s=1.0):
    """The mask's outer contour through a light periodic cubic spline."""
    cs = measure.find_contours(np.pad(mask, 1).astype(float), 0.5)
    p = max(cs, key=len)[:, ::-1] - 1
    seg = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]
    t = np.linspace(0, seg[-1], n, endpoint=False)
    tck, _ = splprep([np.interp(t, seg, p[:, 0]), np.interp(t, seg, p[:, 1])], s=n * s, per=1, k=3)
    return np.stack(splev(np.linspace(0, 1, 2400, endpoint=False), tck), 1)


BELLY = float(os.environ.get("BELLY", 24))   # px the bottom of the bean is pushed out at its centre
BELLY_P = float(os.environ.get("BELLY_P", 6))  # how narrowly the push is centred: higher rounds the middle, not the sides


def bean_cat(M, open_r=70, k=4, fillet=36, tip=18, belly=BELLY):
    """Rebuilds the traced body as a designer would draw it: one smooth bean,
    two ears rising out of it, and soft fillets where they meet.

    bean    the body with the ears opened away, fitted as a low-order radial
            curve r(theta) of order k, so its sides and bottom ease evenly
    ears    whatever the traced body has above the bean; each is the convex
            hull of its own pixels plus the bean just under it, tip rounded
    join    a closing of `fillet` px rounds the corners where ears meet bean

    The outline is then a light spline through the result, so the curvature
    is continuous everywhere: no kinks, flats, or bevels. The lumps the render
    leaves where the glasses cross the edge never reach the bean, because the
    radial fit is too smooth to follow them."""
    core = morphology.opening(M, morphology.disk(open_r))
    cy, cx = ndi.center_of_mass(core)
    # The opening leaves stubs where the ears were; the bean is fitted to the
    # rest of the edge only, so those stubs don't flatten its top.
    stubs = measure.label(M & ~morphology.dilation(core, morphology.disk(3)))
    big = np.argsort(np.bincount(stubs.ravel())[1:])[::-1][:2] + 1
    near_ear = morphology.dilation(np.isin(stubs, big), morphology.disk(int(open_r * 0.6)))
    edge = core & ~morphology.erosion(core, morphology.disk(1))
    ys, xs = np.nonzero(edge & ~near_ear)
    th, r = np.arctan2(ys - cy, xs - cx), np.hypot(ys - cy, xs - cx)

    def basis(t):
        return np.stack([np.ones_like(t)] + [f(j * t) for j in range(1, k + 1) for f in (np.cos, np.sin)], 1)

    coef, *_ = np.linalg.lstsq(basis(th), r, rcond=None)
    T = np.linspace(-np.pi, np.pi, 1440, endpoint=False)
    R = basis(T) @ coef
    # The render sits on the floor, so the traced bottom is nearly flat. Ease
    # it into a rounder curve: push the bottom out by up to `belly` px, most at
    # the centre and none from the sides up (theta = pi/2 points down).
    R = R + belly * np.clip(np.sin(T), 0, None) ** BELLY_P
    im = Image.new("1", (W, H))
    ImageDraw.Draw(im).polygon([(cx + a * np.cos(b), cy + a * np.sin(b)) for a, b in zip(R, T)], fill=1)
    bean = np.asarray(im)

    extra = measure.label(morphology.opening(M & ~bean, morphology.disk(4)))
    ears = np.argsort(np.bincount(extra.ravel())[1:])[::-1][:2] + 1
    U = bean.copy()
    hulls = []
    for i in ears:
        e = extra == i
        hull = morphology.convex_hull_image(e | (morphology.dilation(e, morphology.disk(20)) & bean))
        hulls.append(morphology.opening(hull, morphology.disk(tip)))
        U |= hulls[-1]
    U = morphology.closing(U, morphology.disk(fillet))
    U = ndi.gaussian_filter(U.astype(float), 3) > 0.5
    # The same body as separate parts, for animation (rig.py): the bean, and
    # each ear with its fillet and a little of the bean under it, so an ear can
    # turn about its base without opening a gap. Bean and ears together cover
    # exactly the body above.
    PARTS["bean"] = smooth_outline(ndi.gaussian_filter(bean.astype(float), 3) > 0.5)
    for hull in sorted(hulls, key=lambda h: np.nonzero(h)[1].mean()):   # left ear first
        part = U & morphology.dilation(hull, morphology.disk(fillet + 8))
        ys, xs = np.nonzero(hull & bean)
        base = np.array([xs.mean(), ys.min()], float)
        ys, xs = np.nonzero(hull & ~bean)
        tip_pt = np.array([xs, ys], float).T[np.argmax(np.hypot(xs - base[0], ys - base[1]))]
        PARTS.setdefault("ears", []).append(dict(path=smooth_outline(part, n=300), base=base, tip=tip_pt))
    return smooth_outline(U)


PARTS = {}


def leaf_shape(mask, into, width=LEAF_WIDTH, bow=LEAF_BOW, turn=LEAF_TURN, nudge=LEAF_NUDGE):
    """A clean leaf (soft points at both ends, widest at the middle, its
    midline gently bowed) fitted to the whole leaf, lit side and shaded
    underside together. Its base is carried `into` px onto the head."""
    pts, c, u, n, _ = pca(mask)
    s, t = (pts - c) @ u, (pts - c) @ n
    s0, s1 = np.percentile(s, [0.5, 99.5])
    half = np.percentile(np.abs(t - np.median(t)), 93) * width
    s1 += into                                # u points down, toward the head
    base = c + u * s1 + n * np.median(t) + np.array(nudge, float)
    tip = c + u * s0 + n * np.median(t) + np.array(nudge, float)
    a = np.radians(turn)                      # turn the leaf about its base
    rot = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
    tip = base + rot @ (tip - base)
    L = np.linalg.norm(tip - base)
    d = (tip - base) / L
    nn = np.array([-d[1], d[0]])
    if nn[1] > 0:
        nn = -nn                              # bow up, away from the head
    ss = np.linspace(0, 1, 400)
    # An exponent under 1 rounds both ends; at 0.9 or more they end in hard corners.
    prof = half * np.sin(np.pi * ss) ** 0.75
    centre = base[None] + np.outer(ss * L, d) + np.outer(bow * L * np.sin(np.pi * ss), nn)
    return np.vstack([centre + np.outer(prof, nn), (centre - np.outer(prof, nn))[::-1]])


# ---------------------------------------------------------------- the parts

# Lens openings: whatever the ink encloses, eyes filled in.
enclosed = ndi.binary_fill_holes(ink) & ~ink
openings = measure.label(enclosed)
sizes = np.bincount(openings.ravel())[1:]
lens_ids = np.argsort(sizes)[::-1][:2] + 1
lenses = []
for i in lens_ids:
    m = ndi.binary_fill_holes(openings == i)
    c, a, b, ang = ellipse(m)
    lenses.append(dict(mask=m, c=c, a=a, b=b, ang=ang))

# Rim width: walk outward from each opening's edge while still on ink.
rims = []
for L in lenses:
    for p in ellipse_pts(L["c"], L["a"], L["b"], L["ang"], 180):
        d = (p - L["c"]) / np.linalg.norm(p - L["c"])
        k = 0
        while k < 80:
            x, y = (p + d * (k + 1)).round().astype(int)
            if not (0 <= x < W and 0 <= y < H and ink[y, x]):
                break
            k += 1
        if k > 4:
            rims.append(k)
RIM = float(np.median(rims)) * 1.1   # the render's tube shading reads ~10% heavier than its dark core

ink_parts = measure.label(ink)
eyes, others = [], []
inside = np.zeros_like(ink)
for L in lenses:
    inside |= L["mask"]
for i in range(1, ink_parts.max() + 1):
    m = ink_parts == i
    if m.sum() < 30:
        continue
    (eyes if (m & inside).sum() > 0.9 * m.sum() else others).append(m)

# Everything else on the ink layer is glasses: rims plus the bridge and the
# temple arm. Take the rims away and what's left are those pieces.
rim_zone = np.zeros_like(ink)
for L in lenses:
    big = ellipse_pts(L["c"], L["a"] + RIM * 1.6, L["b"] + RIM * 1.6, L["ang"])
    im = Image.new("1", (W, H))
    ImageDraw.Draw(im).polygon([tuple(p) for p in big], fill=1)
    rim_zone |= np.asarray(im)
# Eyes that peek over the top rims (the curious pose) sit outside the lenses.
# They are the compact ink pieces above a lens, once the rims are taken away.
outer = np.zeros_like(ink)
for L in lenses:
    im = Image.new("1", (W, H))
    ImageDraw.Draw(im).polygon([tuple(p) for p in ellipse_pts(L["c"], L["a"] + RIM + 2, L["b"] + RIM + 2, L["ang"])], fill=1)
    outer |= np.asarray(im)
peek = measure.label(morphology.opening(ink & ~outer, morphology.disk(3)))
for i in range(1, peek.max() + 1):
    m = peek == i
    ys, xs = np.nonzero(m)
    if m.sum() < 100 or max(np.ptp(xs), np.ptp(ys)) > RIM * 3.5:
        continue
    if any(ys.mean() < L["c"][1] - L["b"] * 0.5 and abs(xs.mean() - L["c"][0]) < L["a"] for L in lenses):
        eyes.append(m)
        inside |= morphology.dilation(m, morphology.disk(4))
rest = morphology.remove_small_objects(ink & ~rim_zone & ~inside, max_size=60)
sticks = [measure.label(rest) == i for i in range(1, measure.label(rest).max() + 1)]
# The only stick besides the bridge is the temple arm, out past the left lens;
# anything else (a stray shadow) is dropped.
_left = min(L["c"][0] - L["a"] for L in lenses)
sticks = [m for m in sticks if np.nonzero(m)[1].mean() < _left + RIM or
          min(np.linalg.norm(np.array(ndi.center_of_mass(m))[::-1] - L["c"]) for L in lenses) < max(L["a"] for L in lenses) * 1.4]

# Where the leaf's tip rests on the head, the head's top edge is hidden. In
# each column, the head's top is the first coral pixel; if leaf sits right on
# it (no backdrop between), that top is unknown and is interpolated from the
# columns either side, and the coral is filled up to it. The leaf, drawn on
# top, overlaps that edge only at its tip.
top = np.full(W, -1.0)
hidden = np.zeros(W, bool)
leafish = leaf0 | under
for x in range(W):
    yb = np.nonzero(body0[:, x])[0]
    if len(yb) == 0:
        continue
    if leafish[max(yb[0] - 4, 0):yb[0], x].any():
        hidden[x] = True
    else:
        top[x] = yb[0]
known = np.nonzero(top >= 0)[0]
for x in np.nonzero(hidden)[0]:
    yb = np.nonzero(body0[:, x])[0][0]
    yt = int(round(np.interp(x, known, top[known])))
    body0[min(yt, yb):yb + 1, x] = True

# Body: the coral, plus the ink that lies over it. Ink counts as body only
# where a closing of the coral reaches it, so the rim that hangs past the edge
# and the temple arm stay out. The closing itself is never used as body: it
# would fill the dip between the ears.
over = ink & morphology.closing(body0, morphology.disk(int(RIM)))
body = ndi.binary_fill_holes(body0 | over)
# Inside the lens that hangs past the edge, the backdrop shows between the
# body and the rim. Take that gap out, then drop the strip of rim beyond it:
# it is the only part of the body thinner than the rim near that gap.
gap = ndi.binary_fill_holes(lab != 255) & (lab == 255)
body &= ~gap
thin = body & ~morphology.opening(body, morphology.disk(int(RIM * 0.65)))
body &= ~(thin & morphology.dilation(gap, morphology.disk(int(RIM * 2))))
body = morphology.opening(body, morphology.disk(6))
body = morphology.closing(body, morphology.disk(30))
body = ndi.gaussian_filter(body.astype(float), 11) > 0.5
body = measure.label(body)
body = body == (np.argmax(np.bincount(body.ravel())[1:]) + 1)


def nearest_on(L, p):
    q = ellipse_pts(L["c"], L["a"] + RIM / 2, L["b"] + RIM / 2, L["ang"])
    return q[np.argmin(np.linalg.norm(q - p, axis=1))]


EYES = []
SHAPES = [
    ("body", "poly", bean_cat(body)),
    ("leaf", "poly", leaf_shape(leaf0 | under, 14)),
]
for L in lenses:
    SHAPES.append(("ink", "ring", (L["c"], L["a"] + RIM / 2, L["b"] + RIM / 2, L["ang"], RIM)))
# Bridge: the shortest link between the two rims' centre lines.
qa = ellipse_pts(lenses[0]["c"], lenses[0]["a"] + RIM / 2, lenses[0]["b"] + RIM / 2, lenses[0]["ang"])
qb = ellipse_pts(lenses[1]["c"], lenses[1]["a"] + RIM / 2, lenses[1]["b"] + RIM / 2, lenses[1]["ang"])
dd = np.linalg.norm(qa[:, None] - qb[None], axis=2)
i, j = np.unravel_index(dd.argmin(), dd.shape)
# Bridge width: the ink's thickness across the link at its midpoint.
mid = (qa[i] + qb[j]) / 2
d = (qb[j] - qa[i]) / np.linalg.norm(qb[j] - qa[i])
nn = np.array([-d[1], d[0]])
th = [next(k for k in range(1, 80) if not ink[tuple((mid + sgn * nn * k).round().astype(int)[::-1])]) for sgn in (1, -1)]
BRIDGE = float(np.clip(sum(th) - 1, RIM * 0.5, RIM * 0.75))   # the walk can run into a rim, so cap it
SHAPES.append(("ink", "cap", (qa[i], qb[j], BRIDGE)))
# Temple arm: run its inner end into the nearest rim so it never floats. The
# bridge between the lenses is drawn above, so its own piece is skipped.
for m in sticks:
    if np.linalg.norm(np.array(ndi.center_of_mass(m))[::-1] - mid) < RIM * 3:
        continue
    a_, b_, w_ = capsule(m)
    L = min(lenses, key=lambda L: min(np.linalg.norm(a_ - L["c"]), np.linalg.norm(b_ - L["c"])))
    if np.linalg.norm(a_ - L["c"]) < np.linalg.norm(b_ - L["c"]):
        a_ = nearest_on(L, a_)
    else:
        b_ = nearest_on(L, b_)
    SHAPES.append(("ink", "cap", (a_, b_, RIM * 0.85)))
# Eyes: filled ovals with the eye's own moments; the highlight is filled in.
# A capsule eye is solid; an arc eye (a blink, a smile) is not, so it keeps
# its own outline, smoothed, instead of being fitted as an oval.
for m in eyes:
    m = ndi.binary_fill_holes(m)
    if m.sum() / morphology.convex_hull_image(m).sum() > 0.85:
        c, a, b, ang = ellipse(m)
        SHAPES.append(("ink", "oval", (c, a * 1.1, b * 1.1, ang)))   # same ~10% the rims lose to their soft shading
    else:
        # An arc: fit its centreline (the skeleton) with a parabola in the
        # eye's own frame, and draw it as one round-capped stroke of the
        # measured thickness.
        sk = morphology.skeletonize(m)
        pts, c, u, n, _ = pca(m)
        ys, xs = np.nonzero(sk)
        q = np.stack([xs, ys], 1) - c
        sx, tx = q @ u, q @ n
        if np.ptp(tx) > np.ptp(sx):          # the arc runs across the major axis of a squat eye
            u, n, sx, tx = n, u, tx, sx
        coef = np.polyfit(sx, tx, 2)
        ss = np.linspace(np.percentile(sx, 1), np.percentile(sx, 99), 48)
        line = c + np.outer(ss, u) + np.outer(np.polyval(coef, ss), n)
        width = 2 * np.median(ndi.distance_transform_edt(m)[sk]) * 1.1
        SHAPES.append(("ink", "arc", (line, width)))
    EYES.append(SHAPES[-1])


# ---------------------------------------------------------------- output

def cap_pts(a, b, w, n=48):
    d = (b - a) / max(np.linalg.norm(b - a), 1e-6)
    nrm = np.array([-d[1], d[0]])
    r = w / 2
    base = np.arctan2(nrm[1], nrm[0])
    arc1 = [b + r * np.array([np.cos(base - t), np.sin(base - t)]) for t in np.linspace(0, np.pi, n)]
    arc2 = [a + r * np.array([np.cos(base + np.pi - t), np.sin(base + np.pi - t)]) for t in np.linspace(0, np.pi, n)]
    return np.array(arc1 + arc2)


SS = 4
canvas = Image.new("RGBA", (W * SS, H * SS))
for name, kind, g in SHAPES:
    layer = Image.new("RGBA", canvas.size)
    dr = ImageDraw.Draw(layer)
    col = COL[name]
    if kind == "poly":
        dr.polygon([tuple(p * SS) for p in g], fill=col)
    elif kind == "cap":
        dr.polygon([tuple(p * SS) for p in cap_pts(*g)], fill=col)
    elif kind == "oval":
        dr.polygon([tuple(p * SS) for p in ellipse_pts(*g)], fill=col)
    elif kind == "arc":
        line, w = g
        dr.line([tuple(p * SS) for p in line], fill=col, width=round(w * SS), joint="curve")
        for p in (line[0], line[-1]):
            dr.ellipse([*(p * SS - w * SS / 2), *(p * SS + w * SS / 2)], fill=col)
    else:
        c, a, b, ang, t = g
        dr.polygon([tuple(p * SS) for p in ellipse_pts(c, a + t / 2, b + t / 2, ang)], fill=col)
        dr.polygon([tuple(p * SS) for p in ellipse_pts(c, a - t / 2, b - t / 2, ang)], fill=(0, 0, 0, 0))
    canvas.alpha_composite(layer)
flat = canvas.resize((W, H), Image.LANCZOS)
flat.save(WORK / "flat.png", optimize=True)


def path(pts):
    pts = pts[:: max(len(pts) // 480, 1)]     # ~480 points per outline is smooth at any size and keeps the file small
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + " Z"


svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><g>']
for name, kind, g in SHAPES:
    col = COL[name]
    if kind == "poly":
        svg.append(f'<path d="{path(g)}" fill="{col}"/>')
    elif kind == "cap":
        a, b, w = g
        svg.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{col}" stroke-width="{w:.1f}" stroke-linecap="round"/>')
    elif kind == "arc":
        line, w = g
        svg.append(f'<path d="M{" L".join(f"{x:.1f} {y:.1f}" for x, y in line)}" fill="none" stroke="{col}" stroke-width="{w:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
    elif kind == "oval":
        c, a, b, ang = g
        svg.append(f'<ellipse cx="{c[0]:.1f}" cy="{c[1]:.1f}" rx="{a:.1f}" ry="{b:.1f}" transform="rotate({np.degrees(ang):.2f} {c[0]:.1f} {c[1]:.1f})" fill="{col}"/>')
    else:
        c, a, b, ang, t = g
        svg.append(f'<ellipse cx="{c[0]:.1f}" cy="{c[1]:.1f}" rx="{a:.1f}" ry="{b:.1f}" transform="rotate({np.degrees(ang):.2f} {c[0]:.1f} {c[1]:.1f})" fill="none" stroke="{col}" stroke-width="{t:.1f}"/>')
svg.append("</g></svg>")
(WORK / "flat.svg").write_text("\n".join(svg))
print(f"rim {RIM:.1f}px, bridge {BRIDGE:.1f}px, {len(eyes)} eyes, {len(sticks)} sticks; wrote flat.png, flat.svg")


# Parts for rig.py, in the master's own pixel frame.
import json


def _j(g):
    return [_j(x) for x in g] if isinstance(g, (tuple, list)) else (np.asarray(g).tolist() if hasattr(g, "tolist") else g)


(WORK / "flat.json").write_text(json.dumps(dict(
    size=[W, H],
    bean=PARTS["bean"].tolist(),
    ears=[dict(path=e["path"].tolist(), base=e["base"].tolist(), tip=e["tip"].tolist()) for e in PARTS["ears"]],
    leaf=[_j(g) for n, k, g in SHAPES if n == "leaf"][0],
    leaf_base=(np.asarray([_j(g) for n, k, g in SHAPES if n == "leaf"][0][0])).tolist(),
    lenses=[dict(c=L["c"].tolist(), a=float(L["a"]), b=float(L["b"]), ang=float(L["ang"]), rim=RIM) for L in lenses],
    sticks=[_j(g) for n, k, g in SHAPES if k == "cap"],
    eyes=[dict(kind=k, g=_j(g)) for n, k, g in EYES],
)))
