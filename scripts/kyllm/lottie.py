"""Builds KYLLM as a Lottie animation from the same rig as the CSS and Motion
versions. Run rig.py first, then:

    uv run python scripts/kyllm/lottie.py

Writes public/kyllm/kyllm.lottie.json: a 1024px, 30fps Lottie with one
shape layer per part (ears, bean, leaf, eyes, glasses) under a null layer
that carries the whole body, and named markers for each clip:

    loop_idle, loop_think, loop_read     4.8s loops
    enter_think, enter_read, enter_answered, enter_curious, enter_sorry
                                         idle into each state; play one
                                         backwards to return to idle

Lottie plays clips, not states, so a player moves between states through
idle: back out of the current state, then into the next. Every pose and
offset is the one rig.py measured from the renders; the eyes keep the same
48 points in every state, so Lottie can morph between them.
"""
import json
import math
from pathlib import Path

HERE = Path(__file__).parent
R = json.loads((HERE / "build/rig.json").read_text())
OUT = HERE.parent.parent / "public/kyllm/kyllm.lottie.json"
FPS, LOOP = 30, 144
S = R["states"]
W, H = R["size"]
FX, FY = R["floor"]

BACK = dict(o={"x": [0.34], "y": [1.4]}, i={"x": [0.64], "y": [1]})    # the CSS rig's cubic-bezier(.34, 1.4, .64, 1)
SINE = dict(o={"x": [0.45], "y": [0]}, i={"x": [0.55], "y": [1]})
EASE = dict(o={"x": [0.3], "y": [0]}, i={"x": [0.4], "y": [1]})


def rgba(hx):
    return [int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]


def shape(pts, closed=True):
    return {"i": [[0, 0]] * len(pts), "o": [[0, 0]] * len(pts), "v": [list(p) for p in pts], "c": closed}


class Track:
    """Keyframes for one property across every clip. Each clip ends on a held
    key, so nothing interpolates from one clip into the next."""

    def __init__(self):
        self.keys = []

    def add(self, t, v, ease=EASE, hold=False):
        k = {"t": t, "s": v if isinstance(v, list) else [v]}
        if hold:
            k["h"] = 1
        else:
            k.update(ease)
        self.keys.append(k)

    def prop(self, static):
        if not self.keys:
            return {"a": 0, "k": static}
        keys = sorted(self.keys, key=lambda k: k["t"])
        return {"a": 1, "k": keys}


tracks = {n: Track() for n in ("pos", "rot", "scale", "earL", "earR", "leaf", "glasses",
                                "eyeL", "eyeR", "eyeLs", "eyeRs", "eyeLp", "eyeRp")}
markers = []
t0 = 0


def pose(name, t, ease=EASE, hold=False, hop=0.0, squash=0.0, leaf_extra=0.0, scan=0.0, blink=0.0, ear_extra=0.0):
    p = S[name]
    tr = tracks
    tr["pos"].add(t, [FX, FY + hop + p["sink"], 0], ease, hold)
    tr["rot"].add(t, p["tilt"], ease, hold)
    tr["scale"].add(t, [100 * (1 - squash * 0.6), 100 * (1 + squash), 100], ease, hold)
    tr["earL"].add(t, p["ears"][0] + ear_extra, ease, hold)
    tr["earR"].add(t, p["ears"][1] - ear_extra, ease, hold)
    tr["leaf"].add(t, p["leaf"] + leaf_extra, ease, hold)
    tr["glasses"].add(t, [p["glasses"][0], p["glasses"][1], 0], ease, hold)
    for i, side in enumerate("LR"):
        tr[f"eye{side}"].add(t, [shape(p["eyes"][i])], ease, hold)
        c = R["eyeCenters"][i]
        tr[f"eye{side}p"].add(t, [c[0] + scan, c[1], 0], ease, hold)
        tr[f"eye{side}s"].add(t, [100, 100 * (1 - 0.9 * blink), 100], ease, hold)


def clip(name, frames):
    global t0
    markers.append({"tm": t0, "cm": name, "dr": frames - 1})
    start = t0
    t0 += frames
    return start


# Loops: the CSS rig's motion, keyed. Leaf sways on a 2.4s (idle) or 1.2s
# (think) half cycle; reading scans 10px either way; one blink per cycle.
def loop(name, sway_half, blink_at, scan=False):
    s = clip(f"loop_{name}", LOOP + 1)

    def wave(k, lo, hi):
        """A sine-eased swing between lo and hi that turns every sway_half frames."""
        n, f = divmod(k, sway_half)
        a, b = (lo, hi) if n % 2 == 0 else (hi, lo)
        return a + (b - a) * (0.5 - 0.5 * math.cos(f / sway_half * math.pi))

    keys = sorted({0, LOOP, blink_at - 3, blink_at, blink_at + 3} | set(range(0, LOOP + 1, sway_half)))
    for k in keys:
        pose(name, s + k, SINE, hold=(k == LOOP),
             squash=0.006 * (0.5 - 0.5 * math.cos(k / LOOP * 2 * math.pi)),   # one slow breath per loop
             leaf_extra=wave(k, -3, 4), scan=wave(k, -10, 10) if scan else 0.0,
             blink=1.0 if k == blink_at else 0.0)


loop("idle", 72, 137)
loop("think", 36, 26)
loop("read", 36, 62, scan=True)

# Enters: from the idle pose into each state's pose, on the CSS rig's curve.
for name, frames in (("think", 15), ("read", 15), ("curious", 15), ("sorry", 15)):
    s = clip(f"enter_{name}", frames + 1)
    pose("idle", s, BACK)
    pose(name, s + frames, BACK, hold=True)

# Answered: the eyes blend into the happy arcs while the body hops, squashes
# on landing, and the ears perk.
s = clip("enter_answered", 24)
pose("idle", s, EASE)
pose("answered", s + 7, EASE, hop=-38, squash=-0.04, ear_extra=-6)
pose("answered", s + 13, EASE, hop=0, squash=0.07)
pose("answered", s + 17, EASE, hop=-8, squash=-0.01)
pose("answered", s + 23, EASE, hold=True)

C = R["colors"]


def ks(anchor, position, rot=None, scale=None, opacity=100):
    return {"o": {"a": 0, "k": opacity}, "r": rot or {"a": 0, "k": 0}, "p": position,
            "a": {"a": 0, "k": [anchor[0], anchor[1], 0]}, "s": scale or {"a": 0, "k": [100, 100, 100]}}


def group(items, fill=None, stroke=None, even_odd=False):
    it = list(items)
    if fill:
        it.append({"ty": "fl", "c": {"a": 0, "k": rgba(fill)}, "o": {"a": 0, "k": 100}, "r": 2 if even_odd else 1})
    if stroke:
        col, w = stroke
        it.append({"ty": "st", "c": {"a": 0, "k": rgba(col)}, "o": {"a": 0, "k": 100}, "w": {"a": 0, "k": w}, "lc": 2, "lj": 2})
    it.append({"ty": "tr", "p": {"a": 0, "k": [0, 0]}, "a": {"a": 0, "k": [0, 0]}, "s": {"a": 0, "k": [100, 100]},
               "r": {"a": 0, "k": 0}, "o": {"a": 0, "k": 100}})
    return {"ty": "gr", "it": it}


def path(pts, closed=True, track=None):
    return {"ty": "sh", "ks": track.prop(None) if track else {"a": 0, "k": shape(pts, closed)}}


layers = []


def layer(name, shapes, transform, parent=1):
    layers.append({"ddd": 0, "ind": len(layers) + 2, "ty": 4, "nm": name, "parent": parent, "sr": 1, "ks": transform,
                   "ao": 0, "shapes": shapes, "ip": 0, "op": t0, "st": 0, "bm": 0})


tr = tracks
glasses = [group([path(l["outer"]), path(l["inner"][::-1])], fill=C["ink"], even_odd=True) for l in R["lenses"]]
glasses += [group([path([st["a"], st["b"]], closed=False)], stroke=(C["ink"], st["w"])) for st in R["sticks"]]
layer("glasses", glasses, ks([0, 0], tr["glasses"].prop(None)))
for i, side in enumerate("LR"):
    c = R["eyeCenters"][i]
    layer(f"eye {side}", [group([path(None, track=tr[f"eye{side}"])], fill=C["ink"])],
          ks(c, tr[f"eye{side}p"].prop(None), scale=tr[f"eye{side}s"].prop(None)))
lb = R["leafBase"]
layer("leaf", [group([path(R["leaf"])], fill=C["leaf"])], ks(lb, {"a": 0, "k": [lb[0], lb[1], 0]}, rot=tr["leaf"].prop(0)))
layer("bean", [group([path(R["bean"])], fill=C["body"])], ks([0, 0], {"a": 0, "k": [0, 0, 0]}))
for i, side in enumerate("LR"):
    e = R["ears"][i]
    layer(f"ear {side}", [group([path(e["path"])], fill=C["body"])],
          ks(e["base"], {"a": 0, "k": [e["base"][0], e["base"][1], 0]}, rot=tr[f"ear{side}"].prop(0)))
body = {"ddd": 0, "ind": 1, "ty": 3, "nm": "body", "sr": 1,
        "ks": ks([FX, FY], tr["pos"].prop(None), rot=tr["rot"].prop(0), scale=tr["scale"].prop(None)),
        "ao": 0, "ip": 0, "op": t0, "st": 0, "bm": 0}

anim = {"v": "5.7.4", "fr": FPS, "ip": 0, "op": t0, "w": W, "h": H, "nm": "KYLLM", "ddd": 0, "assets": [],
        "layers": layers + [body], "markers": markers}
OUT.write_text(json.dumps(anim, separators=(",", ":")))
print(f"wrote {OUT.name}: {t0} frames, {len(markers)} clips, {OUT.stat().st_size // 1024} KB")
