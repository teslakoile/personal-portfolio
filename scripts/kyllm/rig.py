"""Builds the animated KYLLM: one SVG whose parts move between chat states.

    uv run --with numpy python rig.py

Run flatten.py and vectorize.py first, for the master and for each pose
(see the README). Reads flat.json from here and build/<pose>/flat.json, and
writes to public/kyllm/:

    kyllm-rig.svg           the whole flat character
    kyllm-avatar-rig.svg    the same in the avatar's circle, on sky

and the app's copy to app/_brand/kyllm/ (rig.ts and kyllm.module.css),
which Kyllm.tsx renders.

Set the state on the <svg class="kyllm"> element, inlined in the page so its CSS applies:
data-state="idle | think | read | answered | curious | sorry". Idle blinks
and the leaf sways; each state glides the eyes, glasses, ears, and leaf to
where that pose's render has them. Nothing is drawn by hand: every offset,
angle, and eye shape is measured from the pose renders and mapped onto the
master, so the body never jumps between states. prefers-reduced-motion keeps
the poses and drops the motion.
"""
import json
import re
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "public/kyllm"
CORAL, SAGE, INK, SKY = "#f5482d", "#7fb99a", "#1c1917", "#d6e4f0"

M = json.loads((HERE / "flat.json").read_text())
P = {n: json.loads((HERE / "build" / n / "flat.json").read_text()) for n in ("think", "read", "happy", "curious", "sorry")}


def area_centroid(pts):
    p = np.asarray(pts)
    x, y = p[:, 0], p[:, 1]
    cr = x * np.roll(y, -1) - np.roll(x, -1) * y
    a = cr.sum() / 2
    return abs(a), np.array([((x + np.roll(x, -1)) * cr).sum(), ((y + np.roll(y, -1)) * cr).sum()]) / (6 * a)


# Each pose is a fresh render, so it drifts a little in size and position.
# Align it to the master by its bean: same area, same centre.
MA, MC = area_centroid(M["bean"])


def aligner(pose):
    a, c = area_centroid(pose["bean"])
    s = np.sqrt(MA / a)
    return lambda p: MC + (np.asarray(p, float) - c) * s, s


def by_x(items, key):
    return sorted(items, key=lambda it: key(it)[0])


M_LENSES = by_x(M["lenses"], lambda L: L["c"])
M_EYES = by_x([e for e in M["eyes"] if e["kind"] == "oval"], lambda e: e["g"][0])
assert len(M_EYES) == 2 and len(M_LENSES) == 2


def lens_map(pose):
    """Maps a pose's eye into the master by the lens it sits in, so an eye
    that looks up stays up in the master's own lens."""
    lenses = by_x(pose["lenses"], lambda L: L["c"])

    def f(p, i):
        L, ML = lenses[i], M_LENSES[i]
        k = ML["a"] / L["a"]
        return np.asarray(ML["c"]) + (np.asarray(p, float) - L["c"]) * k, k
    return f


def oval_vars(target, i):
    """CSS variables that turn master eye i into the target ellipse."""
    c0, a0, b0, ang0 = M_EYES[i]["g"]
    c1, a1, b1, ang1 = target
    d = np.asarray(c1) - c0
    # The same ellipse is the same with its axes swapped and turned 90 degrees;
    # pick the reading closest to the master so the eye turns the short way.
    cands = [(a1, b1, ang1), (b1, a1, ang1 + np.pi / 2)]
    best = None
    for A, B, ang in cands:
        for k in (-1, 0, 1):
            t = ang + k * np.pi
            if best is None or abs(t - ang0) < abs(best[2] - ang0):
                best = (A, B, t)
    A, B, t = best
    return dict(tx=d[0], ty=d[1], r=np.degrees(t), sx=A / a0, sy=B / b0)


def pose_eyes(name, mapping):
    pose = P[name]
    eyes = by_x(pose["eyes"], lambda e: e["g"][0] if e["kind"] == "oval" else np.mean(e["g"][0], 0))
    out = []
    for i, e in enumerate(eyes[:2]):
        if e["kind"] == "oval":
            c, a, b, ang = e["g"]
            c2, k = mapping(c, i)
            out.append(("oval", (c2, a * k, b * k, ang)))
        else:
            line, w = e["g"]
            pts = [mapping(p, i)[0] for p in line]
            out.append(("arc", (np.array(pts), w * mapping(line[0], i)[1])))
    return out


STATE = {}

# Idle: the master as it is.
STATE["idle"] = dict(eyes=[oval_vars(e["g"], i) for i, e in enumerate(M_EYES)])

# Thinking, reading, can't answer: the eyes move (and change shape) inside
# the master's own lenses.
for st, name in (("think", "think"), ("read", "read"), ("sorry", "sorry")):
    eyes = pose_eyes(name, lens_map(P[name]))
    STATE[st] = dict(eyes=[oval_vars(g, i) for i, (k, g) in enumerate(eyes)])

# Answered: the capsule eyes give way to the pose's happy arcs.
happy = pose_eyes("happy", lens_map(P["happy"]))
STATE["answered"] = dict(eyes=STATE["idle"]["eyes"], arcs=[g for k, g in happy if k == "arc"])

# Curious: the glasses slide down, measured from the pose by the whole-body
# alignment, since the glasses themselves moved. In the render the eyes then
# peek over the rims, but at chat size an eye on the rim reads as a bump on
# the frame. So the glasses go a third of the way, which puts the eyes high
# in the lenses, and the eyes open wider and rounder.
al, s = aligner(P["curious"])
moved = by_x(P["curious"]["lenses"], lambda L: L["c"])
glasses = np.mean([al(L["c"]) - ML["c"] for L, ML in zip(moved, M_LENSES)], 0) * 0.35
cur = []
for i in range(2):
    c0, a0, b0, ang0 = M_EYES[i]["g"]
    cur.append(oval_vars(((c0[0], c0[1] - 8), a0 * 1.08, b0 * 1.35, ang0), i))
STATE["curious"] = dict(eyes=cur, glasses=glasses)

# Can't answer also droops the ears. A folded ear has no clean tip to track,
# so the droop is read from how far each ear's highest point drops: turning
# an ear of reach L about its base lowers its top from h0 to h1 when
# cos(angle) falls by (h0 - h1) / L. The left ear turns out to the left
# (negative), the right ear out to the right.
al, s = aligner(P["sorry"])
top = lambda pts: min(p[1] for p in pts)
turns = []
for i, (me, pe) in enumerate(zip(M["ears"], P["sorry"]["ears"])):
    b0, t0 = np.asarray(me["base"]), np.asarray(me["tip"])
    L = np.linalg.norm(t0 - b0)
    h0 = b0[1] - top(me["path"])
    h1 = b0[1] - top([al(p) for p in pe["path"]])
    tilt0 = np.arccos(np.clip(h0 / L, -1, 1))
    tilt1 = np.arccos(np.clip(h1 / L, -1, 1))
    # Past about 14 degrees a turned ear reads as a fin, not a droop.
    turn = float(np.clip(np.degrees(tilt1 - tilt0), 0, 14))
    turns.append(-turn if i == 0 else turn)
STATE["sorry"]["ears"] = turns


# ---------------------------------------------------------------- SVG

def path(pts, step=1):
    pts = np.asarray(pts)[::step]
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + " Z"


def ellipse_pts(c, a, b, ang, n=360):
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    ca, sa = np.cos(ang), np.sin(ang)
    x, y = a * np.cos(th), b * np.sin(th)
    return np.stack([c[0] + x * ca - y * sa, c[1] + x * sa + y * ca], 1)


def px(v):
    return f"{v:.1f}px"


def css_spring(visual_duration, bounce):
    """A spring as a CSS linear() easing, the way Motion's skill describes it
    (best practices, css-spring): Motion's own spring constants for a
    perceived duration and bounce, sampled until it settles. Returns the full
    duration in seconds (longer than the perceived one: it includes the
    settle) and the easing."""
    k = (2 * np.pi / (visual_duration * 1.2)) ** 2
    c = 2 * np.clip(1 - bounce, 0.05, 1) * np.sqrt(k)
    x, v, dt, t, xs = 0.0, 0.0, 1 / 600, 0.0, [0.0]
    while t < 4:
        a_ = k * (1 - x) - c * v
        v += a_ * dt
        x += v * dt
        t += dt
        xs.append(x)
        if t > visual_duration and abs(1 - x) < 0.002 and abs(v) < 0.02:
            break
    xs = np.array(xs)
    idx = np.linspace(0, len(xs) - 1, 28).round().astype(int)
    pts = ", ".join(f"{xs[i]:.3f}" for i in idx[:-1]) + ", 1"
    return round(t, 3), f"linear({pts})"


# The motion, written once against a root selector R. The standalone SVGs
# use R = ".kyllm" on the <svg> itself; the app's CSS module wraps every part
# class in :global() so the parts can live in injected markup. Every loop
# repeats every 4.8s, so the exported loops (motion.py) are seamless.
def motion_css(R, g=lambda c: c, tuned=False):
    def cls(c):
        return g(c)
    if tuned:
        return tuned_css(R, cls, g)
    css = [f"""
{R} {cls('.k-part')}, {R} {cls('.k-all')} {{ transform-box: view-box; }}
{R} {cls('.k-eye')} {{ transform-box: fill-box; transform-origin: center;
  transform: translate(var(--tx), var(--ty)) rotate(var(--r)) scale(var(--sx), var(--sy));
  transition: transform .45s cubic-bezier(.34, 1.4, .64, 1); }}
{R} {cls('.k-blink')} {{ transform-box: fill-box; transform-origin: center; }}
{R} {cls('.k-glasses')}, {R} {cls('.k-leaf')}, {R} {cls('.k-ear')}, {R} {cls('.k-all')} {{ transition: transform .5s cubic-bezier(.34, 1.3, .64, 1); }}
{R} {cls('.k-arcs')} {{ opacity: 0; transition: opacity .15s; }}
{R} {cls('.k-open')} {{ transition: opacity .15s; }}
{R} {cls('.k-leaf')} {{ transform-origin: {px(M['leaf_base'][0])} {px(M['leaf_base'][1])}; }}
{R} {cls('.k-ear-l')} {{ transform-origin: {px(M['ears'][0]['base'][0])} {px(M['ears'][0]['base'][1])}; }}
{R} {cls('.k-ear-r')} {{ transform-origin: {px(M['ears'][1]['base'][0])} {px(M['ears'][1]['base'][1])}; }}
{R} {cls('.k-all')} {{ transform-origin: {px(MC[0])} {px(max(p[1] for p in M['bean']))}; }}
"""]
    for st, v in STATE.items():
        sel = R if st == "idle" else f'{R}[data-state="{st}"]'
        for i, e in enumerate(v["eyes"]):
            css.append(f"{sel} {cls('.k-eye-' + 'lr'[i])} {{ --tx: {px(e['tx'])}; --ty: {px(e['ty'])}; --r: {e['r']:.2f}deg; --sx: {e['sx']:.3f}; --sy: {e['sy']:.3f}; }}")
        if "glasses" in v:
            css.append(f"{sel} {cls('.k-glasses')} {{ transform: translate({px(v['glasses'][0])}, {px(v['glasses'][1])}); }}")
        if "ears" in v:
            css.append(f"{sel} {cls('.k-ear-l')} {{ transform: rotate({v['ears'][0]:.1f}deg); }}")
            css.append(f"{sel} {cls('.k-ear-r')} {{ transform: rotate({v['ears'][1]:.1f}deg); }}")
    idle = f'{R}:not([data-state]), {R}[data-state="idle"]'
    def each(sel, c):
        return ", ".join(f"{x.strip()} {cls(c)}" for x in sel.split(","))
    css.append(f"""
{R}[data-state="answered"] {cls('.k-arcs')} {{ opacity: 1; }}
{R}[data-state="answered"] {cls('.k-open')} {{ opacity: 0; }}
{R}[data-state="sorry"] {cls('.k-leaf')} {{ transform: rotate(-8deg); }}
{R}[data-state="curious"] {cls('.k-all')} {{ transform: rotate(4deg); }}
{R}[data-state="sorry"] {cls('.k-all')} {{ transform: translateY(10px) scale(1.02, .98); }}
@media (prefers-reduced-motion: no-preference) {{
  {each(idle, '.k-blink')} {{ animation: k-blink 4.8s infinite; }}
  {each(idle, '.k-leaf')} {{ animation: k-sway 2.4s ease-in-out infinite alternate; }}
  {R}[data-state="think"] {cls('.k-leaf')} {{ animation: k-sway 1.2s ease-in-out infinite alternate; }}
  {R}[data-state="think"] {cls('.k-blink')} {{ animation: k-blink 4.8s 1.2s infinite; }}
  {R}[data-state="read"] {cls('.k-open')} {{ animation: k-scan 1.2s ease-in-out infinite alternate; }}
  {R}[data-state="read"] {cls('.k-blink')} {{ animation: k-blink 4.8s 2.4s infinite; }}
  {R}[data-state="answered"] {cls('.k-all')} {{ animation: k-hop .6s cubic-bezier(.3, 1.6, .6, 1) 1; }}
  {R}[data-state="answered"] {cls('.k-ear')} {{ animation: k-perk .6s ease-out 1; }}
}}
@media (prefers-reduced-motion: reduce) {{ {R} {g('*') if g('x') != 'x' else '*'} {{ transition: none !important; }} }}
{R}[data-still] {g('*') if g('x') != 'x' else '*'} {{ animation: none !important; transition: none !important; }}
@keyframes k-blink {{ 0%, 92%, 100% {{ transform: scaleY(1); }} 95% {{ transform: scaleY(.1); }} }}
@keyframes k-sway {{ from {{ transform: rotate(-3deg); }} to {{ transform: rotate(4deg); }} }}
@keyframes k-scan {{ from {{ transform: translateX(-10px); }} to {{ transform: translateX(10px); }} }}
@keyframes k-hop {{ 0% {{ transform: none; }} 35% {{ transform: translateY(-34px) scale(1, 1.03); }} 70% {{ transform: translateY(0) scale(1.04, .96); }} 100% {{ transform: none; }} }}
@keyframes k-perk {{ 40% {{ transform: rotate(-6deg); }} }}
""")
    return "\n".join(css)


def tuned_css(R, cls, g):
    """The CSS rig reworked with the motion skills in .claude/skills: one
    signature spring (Playful: 0.3s, bounce 0.3), quicker and calmer exits
    back to idle (0.2s, bounce 0.15), a slow firm "can't answer" (0.6s, no
    overshoot), ears and leaf trailing 60ms behind on a softer spring, the
    glasses settling 40ms late, and a hop that crouches first and keeps its
    volume when it squashes. Springs are sampled into linear() easings."""
    enter, exit_, sad = css_spring(0.3, 0.3), css_spring(0.2, 0.15), css_spring(0.6, 0)
    trail_in, trail_out, trail_sad = css_spring(0.45, 0.4), css_spring(0.28, 0.2), css_spring(0.7, 0)
    def tr(sp, delay=0):
        return f"transform {sp[0]}s {sp[1]}{f' {delay}s' if delay else ''}"
    base = motion_css(R, g)
    # Strip the untuned transitions and the old hop; keep everything else.
    base = re.sub(r"transition: transform [^;]+;", "", base)
    base = re.sub(r"@keyframes k-hop \{.*?\} \}\n", "", base, flags=re.S)
    base = re.sub(r"\n.*animation: k-hop[^\n]*", "", base)
    parts = lambda *c: ", ".join(f"{R}{st} {cls(x)}" for x in c for st in [""])
    css = [base]
    for st, (m, t) in {"": (exit_, trail_out), "think": (enter, trail_in), "read": (enter, trail_in),
                       "answered": (enter, trail_in), "curious": (enter, trail_in), "sorry": (sad, trail_sad)}.items():
        sel = R if not st else f'{R}[data-state="{st}"]'
        css.append(f"{sel} {cls('.k-eye')}, {sel} {cls('.k-all')} {{ transition: {tr(m)}; }}")
        css.append(f"{sel} {cls('.k-glasses')} {{ transition: {tr(m, 0.04)}; }}")
        css.append(f"{sel} {cls('.k-ear')}, {sel} {cls('.k-leaf')} {{ transition: {tr(t, 0.06)}; }}")
    # Crouch, take off, land with a squash, rebound; width is 1 / height throughout.
    css.append("@keyframes k-hop { 0% { transform: none; } 16% { transform: translateY(4px) scale(1.064, .94); } "
               "42% { transform: translateY(-40px) scale(.952, 1.05); } 62% { transform: translateY(0) scale(1.099, .91); } "
               "76% { transform: translateY(-6px) scale(.99, 1.01); } 100% { transform: none; } }")
    css.append(f'@media (prefers-reduced-motion: no-preference) {{ {R}[data-state="answered"] {cls(".k-all")} {{ animation: k-hop .75s 1; }} }}')
    return "\n".join(css)


W, H = M["size"]
eyes = "".join(
    f'<g class="k-eye k-eye-{"lr"[i]}"><ellipse cx="{e["g"][0][0]:.1f}" cy="{e["g"][0][1]:.1f}" rx="{e["g"][1]:.1f}" ry="{e["g"][2]:.1f}" fill="{INK}"/></g>'
    for i, e in enumerate(M_EYES))
arcs = "".join(
    f'<path d="M{" L".join(f"{x:.1f} {y:.1f}" for x, y in line)}" fill="none" stroke="{INK}" stroke-width="{w:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'
    for line, w in STATE["answered"]["arcs"])
lenses = "".join(
    f'<path d="{path(ellipse_pts(L["c"], L["a"] + L["rim"], L["b"] + L["rim"], L["ang"]), 2)} {path(ellipse_pts(L["c"], L["a"], L["b"], L["ang"])[::-1], 2)}" fill="{INK}" fill-rule="evenodd"/>'
    for L in M["lenses"])
sticks = "".join(
    f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{INK}" stroke-width="{w:.1f}" stroke-linecap="round"/>'
    for a, b, w in M["sticks"])
ears = "".join(f'<path class="k-part k-ear k-ear-{"lr"[i]}" d="{path(e["path"], 2)}" fill="{CORAL}"/>' for i, e in enumerate(M["ears"]))
body = (f'<g class="k-part k-all">{ears}<path d="{path(M["bean"], 5)}" fill="{CORAL}"/>'
        f'<path class="k-part k-leaf" d="{path(M["leaf"], 2)}" fill="{SAGE}"/>'
        f'<g class="k-blink"><g class="k-open">{eyes}</g></g><g class="k-arcs">{arcs}</g>'
        f'<g class="k-part k-glasses">{lenses}{sticks}</g></g>')
style = "<style>" + motion_css(".kyllm") + "</style>"

OUT.mkdir(exist_ok=True)
(OUT / "kyllm-rig.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" class="kyllm" viewBox="0 0 {W} {H}" data-state="idle">{style}{body}</svg>')

# The avatar uses the same circle as kyllm-avatar.svg (avatar.py places it).
av = (OUT / "kyllm-avatar.svg").read_text()
vb = re.search(r'viewBox="([^"]+)"', av).group(1)
cx, cy, r = (float(re.search(rf'<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"', av).group(i)) for i in (1, 2, 3))
bg = re.search(r'<circle[^>]*fill="(#[0-9a-fA-F]+)"', av).group(1)
(OUT / "kyllm-avatar-rig.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" class="kyllm" viewBox="{vb}" data-state="idle">{style}'
    f'<clipPath id="kyllm-clip"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>'
    f'<g clip-path="url(#kyllm-clip)"><circle cx="{cx}" cy="{cy}" r="{r}" fill="{bg}"/>{body}</g></svg>')

# The app's copy: a CSS module (parts wrapped in :global so they match the
# injected markup) and the markup and frames as TypeScript constants, read by
# app/_brand/kyllm/Kyllm.tsx.
APP = HERE.parent.parent / "app/_brand/kyllm"
APP.mkdir(parents=True, exist_ok=True)
head = "/* Generated by scripts/kyllm/rig.py; do not edit. */\n"
(APP / "kyllm.module.css").write_text(head + motion_css(".kyllm", lambda c: f":global({c})"))
SAMPLE = HERE.parent.parent / "app/samples/kyllm/motion"
(SAMPLE / "kyllm-tuned.module.css").write_text(head + motion_css(".kyllm", lambda c: f":global({c})", tuned=True))
(APP / "rig.ts").write_text(head + "\n".join([
    f"export const BODY = {json.dumps(body)};",
    f'export const FULL = {{ viewBox: "0 0 {W} {H}", width: {W}, height: {H} }};',
    f'export const AVATAR = {{ viewBox: "{vb}", cx: {cx}, cy: {cy}, r: {r}, bg: "{bg}" }};',
    f"export const STATES = {json.dumps(list(STATE))} as const;",
    "",
]))

# The same rig as data in app/_brand/kyllm/rig-data.ts, for a JavaScript
# animation library to drive (app/samples/kyllm/motion). Each eye in each state is a 48-point outline in
# the master's frame, all starting at the same place and running the same
# way, so any two can be blended point by point: a capsule eye can turn into
# a happy arc instead of cross-fading.
N_EYE = 48


def resample(pts, n):
    pts = np.asarray(pts, float)
    loop = np.vstack([pts, pts[:1]])
    seg = np.r_[0, np.cumsum(np.hypot(*np.diff(loop, axis=0).T))]
    t = np.linspace(0, seg[-1], n, endpoint=False)
    return np.stack([np.interp(t, seg, loop[:, 0]), np.interp(t, seg, loop[:, 1])], 1)


def signed_area(p):
    x, y = p[:, 0], p[:, 1]
    return (x * np.roll(y, -1) - np.roll(x, -1) * y).sum() / 2


def oval_outline(i, v):
    c0, a0, b0, _ = M_EYES[i]["g"]
    th = np.linspace(0, 2 * np.pi, 360, endpoint=False)
    local = np.stack([a0 * np.cos(th) * v["sx"], b0 * np.sin(th) * v["sy"]], 1)
    r = np.radians(v["r"])
    rot = np.array([[np.cos(r), -np.sin(r)], [np.sin(r), np.cos(r)]])
    return np.asarray(c0) + [v["tx"], v["ty"]] + local @ rot.T


def stroke_outline(line, w):
    line = np.asarray(line, float)
    d = np.gradient(line, axis=0)
    n = np.stack([-d[:, 1], d[:, 0]], 1) / np.linalg.norm(d, axis=1, keepdims=True)
    left, right = line + n * w / 2, line - n * w / 2
    def cap(p, dirn):
        a0 = np.arctan2(dirn[1], dirn[0])
        return [p + w / 2 * np.array([np.cos(a0 + t), np.sin(a0 + t)]) for t in np.linspace(-np.pi / 2, np.pi / 2, 24)]
    end = cap(line[-1], line[-1] - line[-2])
    start = cap(line[0], line[0] - line[1])
    return np.vstack([left, end, right[::-1], start])


def aligned(poly, ref):
    p = resample(poly, N_EYE)
    if np.sign(signed_area(p)) != np.sign(signed_area(ref)):
        p = p[::-1]
    k = np.argmin(np.linalg.norm(p - ref[0], axis=1))
    return np.roll(p, -k, axis=0)


DATA = {"states": {}}
for st, v in STATE.items():
    eyes = []
    for i in range(2):
        ref = resample(oval_outline(i, STATE["idle"]["eyes"][i]), N_EYE)
        if st == "answered":
            line, w = STATE["answered"]["arcs"][i]
            eyes.append(aligned(stroke_outline(line, w), ref))
        else:
            eyes.append(aligned(oval_outline(i, v["eyes"][i]), ref))
    DATA["states"][st] = dict(
        eyes=[np.round(e, 1).tolist() for e in eyes],
        glasses=np.round(v.get("glasses", [0, 0]), 1).tolist(),
        ears=v.get("ears", [0, 0]),
        leaf={"sorry": -8}.get(st, 0),
        tilt={"curious": 4}.get(st, 0),
        sink={"sorry": 10}.get(st, 0),
    )
DATA.update(
    bean=path(M["bean"], 5),
    ears=[dict(d=path(e["path"], 2), base=np.round(e["base"], 1).tolist()) for e in M["ears"]],
    leaf=dict(d=path(M["leaf"], 2), base=np.round(M["leaf_base"], 1).tolist()),
    glasses=lenses + sticks,
    eyeCenters=[np.round(e["g"][0], 1).tolist() for e in M_EYES],
    floor=[round(float(MC[0]), 1), round(float(max(p[1] for p in M["bean"])), 1)],
    colors=dict(body=CORAL, leaf=SAGE, ink=INK),
)
# Everything lottie.py needs to rebuild the rig as Lottie layers.
(HERE / "build").mkdir(exist_ok=True)
(HERE / "build/rig.json").write_text(json.dumps(dict(
    states=DATA["states"], eyeCenters=DATA["eyeCenters"], floor=DATA["floor"], size=[W, H],
    bean=np.asarray(M["bean"])[::15].round(1).tolist(),
    ears=[dict(path=np.asarray(e["path"])[::2].round(1).tolist(), base=e["base"]) for e in M["ears"]],
    leaf=np.asarray(M["leaf"])[::4].round(1).tolist(), leafBase=M["leaf_base"],
    lenses=[dict(outer=ellipse_pts(L["c"], L["a"] + L["rim"], L["b"] + L["rim"], L["ang"], 96).round(1).tolist(),
                 inner=ellipse_pts(L["c"], L["a"], L["b"], L["ang"], 96).round(1).tolist()) for L in M["lenses"]],
    sticks=[dict(a=a_, b=b_, w=w_) for a_, b_, w_ in M["sticks"]],
    colors=dict(body=CORAL, leaf=SAGE, ink=INK),
)))
(APP / "rig-data.ts").write_text(head + f"export const RIG = {json.dumps(DATA)} as const;\n")

print({k: {kk: (np.round(vv, 1).tolist() if kk in ("glasses", "ears") else len(vv)) for kk, vv in v.items()} for k, v in STATE.items()})
