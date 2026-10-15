"""Round 5 of the KYLLM favicon: a moving hold with snappy accents.

Round 4's idle was built from slow sines, which reads as slow motion. Here the
idle is a nearly still hold (a drift bed of a fraction of a pixel) with small,
quick accents scheduled at irregular fixed times inside an exactly periodic
6 s ring, all on the same springs as Rounds 3 and 4:

  body    s'' = w_b^2 (u - s) - 2 z_b w_b s'          (2.5 Hz, z 0.16)
          u = bed sine (2 s) + "pop" breaths: an 80 ms rise and a 750 ms
          eased fall, so the fast inhale rings the spring once or twice
  sway    phi'' = w_r^2 (c - phi) - 2 z_r w_r phi'     (4 Hz, z 0.5)
          c steps to a new lean in 150 ms (a weight shift)
  leaf    th'' = -w_l^2 (th - target) - 2 z_l w_l th' + m r_c x (-a_base) / I - phi''
          (2.2 Hz, z 0.35). target = bed sine in quadrature with the body's
          + flicks: a 70 ms bump, an impulse that rings down at 2.2 Hz.
          a_base now includes the sway, so a weight shift tips the leaf too,
          and -phi'' is the leaf's own inertia in the leaning body.
  eyes    kinematic: glances travel between fixations in EYE_TRAVEL_S
          (180 ms, minimum jerk, so about six frames of visible movement
          on the 30 fps grid), then hold still; never drift. A 40 ms jump
          read as teleporting, so the travel is slower and larger.
  blink   the canonical blink (BLINK below), used for every blink in Round 5.

Time runs on a 30 fps grid (TICK = 1/30 s) everywhere in Round 5: the ring,
the beats and the blink, so a blink is rendered at the same cadence in all of
them. A ring frame lasts one tick (33 ms) while anything visible changes:
every accent and every blink plays at 30 fps. Where only the drift bed moves,
frames are merged until the change reaches EMIT_PX, up to four ticks (133 ms).
That is longer than one 67 ms hold on purpose: at 67 ms a sub-pixel bed moves
under 0.1 px per frame, which counts as stillness, while a merged frame that
lands every 100 to 133 ms with 0.12 px of change does not, and it costs fewer
frames. The bed is a 2 s sine on the body and, a quarter period later, on the
leaf, so one of them is always moving at 0.9 px/s or more.

Beats are the Round 4 X beat (Big Bouncy, 30 fps), re-integrated from the idle
state at a beat start as in Round 4. The beat's crouch squint is an
expression, not a blink: it never closes the eyes past SQUINT_MIN, which is
well above the blink's half frame, so it cannot read as a second blink, and a
blink that falls inside a beat keeps the canonical frames (min of the two).
"""

from __future__ import annotations

import dataclasses
import math
import warnings
from dataclasses import dataclass, field

import numpy as np
from PIL import Image, ImageDraw

import favicon_alive as alive
import favicon_physics as ph

TICK = 1 / 30
RING_S = 6.0
RING_TICKS = int(round(RING_S / TICK))
MAX_HOLD_TICKS = 4       # 133 ms: the longest any Round 5 frame is held (only where just the bed moves)
EMIT_PX = 0.12           # a frame is merged into the previous one only below this change
STILL_PX = 0.1
END_PX = 0.25
LOOPS = 4                # loops integrated from rest before the kept one
SQUINT_MIN = 0.75        # the beat's crouch squint never closes the eyes further than this
EYE_TRAVEL_S = 0.18      # a glance takes this long, so the pupils are seen moving
EYE_RIM_GAP = 15.0       # a pupil never gets closer than this to the lens rim (flat px, about 0.5 px at 32 px);
                         # at rest it is 22.8 on the tightest side, so there is only about 1 px of room each way

# Pupil and lens-opening geometry in flat px (public/kyllm/kyllm-flat.svg): the eye ovals, and each lens's
# inner opening (the ellipse minus half the 41.8 px rim). First of each pair is the viewer's right lens.
_EYE_OVALS = ((741.3, 491.2, 58.7, 28.9, 80.42), (528.5, 504.0, 60.5, 31.5, 82.72))
_LENS_OPENINGS = ((780.7, 486.0, 129.3, 91.7, 75.30), (492.5, 498.5, 132.2, 109.0, 81.66))
_RING = np.linspace(0.0, 2 * np.pi, 72, endpoint=False)


def rim_gap(ex: float, ey: float) -> float:
    """Distance in flat px from the nearest pupil edge to the nearest lens rim at gaze offset (ex, ey);
    negative when the pupil overlaps the rim."""
    worst = 1e9
    for (cx, cy, rx, ry, deg), (lx, ly, lrx, lry, ldeg) in zip(_EYE_OVALS, _LENS_OPENINGS):
        a, b = math.radians(deg), math.radians(ldeg)
        px, py = rx * np.cos(_RING), ry * np.sin(_RING)
        x = cx + ex + px * math.cos(a) - py * math.sin(a) - lx
        y = cy + ey + px * math.sin(a) + py * math.cos(a) - ly
        u, v = x * math.cos(b) + y * math.sin(b), -x * math.sin(b) + y * math.cos(b)
        worst = min(worst, float(np.min(1 - np.hypot(u / lrx, v / lry))) * min(lrx, lry))
    return worst


def safe_gaze(ex: float, ey: float) -> tuple[float, float]:
    """Pull a fixation back toward the rest gaze, along the straight line to it, until the pupils keep
    EYE_RIM_GAP from the rims. The set of allowed offsets is convex, so any glance between two allowed
    fixations also stays allowed."""
    if rim_gap(ex, ey) >= EYE_RIM_GAP:
        return ex, ey
    lo, hi = 0.0, 1.0
    for _ in range(24):
        mid = (lo + hi) / 2
        if rim_gap(ex * mid, ey * mid) >= EYE_RIM_GAP:
            lo = mid
        else:
            hi = mid
    return ex * lo, ey * lo
LAUNCH_S = 0.7           # glances due in a beat's first 0.7 s wait until it is over (the gaze holds
                         # through the jump), so an eye jump never lands on top of the launch's fastest frames

# The canonical blink: [eye openness, ticks]. Half, closed for two ticks, half: 33 + 67 + 33 = 133 ms.
# Closed must survive one late or dropped tab repaint (timers jitter by about 10 ms), so it gets two
# ticks; the half frames are one tick each so the lid moves fast. At 16 px the half frame is the
# only in-between the eye can show (about one pixel of lid), so one is enough on each side.
BLINK = ((0.5, 1), (0.0, 2), (0.5, 1))
BLINK_TICKS = sum(n for _, n in BLINK)


def tick_ms(k: int) -> int:
    return round(k * 1000 / 30)


@dataclass
class Snappy:
    id: str
    label: str
    name: str
    note: str
    beat: ph.Variant = field(default_factory=lambda: alive.BEAT_30)  # the Round 4 X beat
    bed_period: float = 2.0    # s, period of the drift bed; it must divide the loop for the ring to tile
    bed_body: float = 0.02     # strain amplitude of the drift bed
    bed_leaf: float = 3.5      # deg, leaf drift bed (quadrature with the body's)
    saccades: tuple = ()       # (t, ex, ey): jump to this fixation at t; the last one is held into t = 0
    blinks: tuple = ()         # t of each blink start
    flicks: tuple = ()         # (t, deg): a 70 ms bump on the leaf's rest angle; the leaf's response
                               # peaks at about half the bump (an impulse, 2.2 Hz, z 0.35)
    pops: tuple = ()           # (t, strain): a quick inhale, slow exhale on the body command
    shifts: tuple = ()         # (t, deg): lean to this angle from t; the last one is held into t = 0
    starts: tuple = (2.55, 5.85)  # beat starts, in quiet moments (snapped to ring frame starts)
    chance: float = 0.35
    max_loops: float = 1       # a beat is forced once this many loops (can be a fraction) pass without one
    rot_f: float = 4.0
    rot_z: float = 0.5
    end_px: float = END_PX     # a beat hands back to the ring once it is within this of the idle
    group: str = "r5"          # which page section the option belongs to
    face: bool = False         # play the beat's face script (beat_face) instead of the frozen-then-blend gaze
    eye_scale: float = 1.0     # scales every idle fixation offset, so 0.5 halves how far the eyes glance
    gaze_scale: float = 1.0    # scales the face script's gaze positions in a bounce (face=True)
    zoom: float = 1.0          # circle diameter relative to the avatar frame; below 1 closes in on the glasses
    focus: float = 0.0         # how far the tighter circle's centre moves from the avatar frame's toward the glasses
    bold: float = 0.0          # flat px added to every glasses stroke, so the rings survive 16 px


def ease(x: float) -> float:
    x = min(max(x, 0.0), 1.0)
    return (1 - math.cos(math.pi * x)) / 2


def minjerk(x: float) -> float:
    x = min(max(x, 0.0), 1.0)
    return x * x * x * (10 - 15 * x + 6 * x * x)


def cyc(t: float, t0: float) -> float:
    """time since t0 on the loop, in [0, RING_S)"""
    return (t - t0) % RING_S


def snap(t: float) -> int:
    return int(round(t / TICK)) % RING_TICKS


# ---- forcing ---------------------------------------------------------------


def body_cmd(a: Snappy, t: float) -> float:
    u = a.bed_body * math.sin(2 * math.pi * t / a.bed_period)
    for t0, b in a.pops:
        x = cyc(t, snap(t0) * TICK)
        if x < 0.08:
            u += b * ease(x / 0.08)
        elif x < 0.83:
            u += b * (1 - ease((x - 0.08) / 0.75))
    return u


def leaf_target(a: Snappy, t: float) -> float:
    th = a.bed_leaf * math.cos(2 * math.pi * t / a.bed_period)
    for t0, deg in a.flicks:
        x = cyc(t, snap(t0) * TICK)
        if x < 0.07:
            th += deg * math.sin(math.pi * x / 0.07) ** 2
    return math.radians(th)


def held(events, t: float, dur: float, fn):
    """Piecewise hold with eased transitions, wrapping round the loop: from each event's time the
    value moves from the previous event's value to its own over `dur`, then holds."""
    ev = sorted((snap(t0) * TICK, list(v)) for t0, *v in events)
    past = [k for k, (t0, _) in enumerate(ev) if t0 <= t]
    if past:
        i = past[-1]
        t0 = ev[i][0]
    else:
        i = len(ev) - 1
        t0 = ev[i][0] - RING_S
    return fn(ev[i - 1][1], ev[i][1], (t - t0) / dur)


def lean(a: Snappy, t: float) -> float:
    if not a.shifts:
        return 0.0
    return math.radians(held(a.shifts, t, 0.15, lambda p, v, x: p[0] + (v[0] - p[0]) * ease(x)))


def eyes(a: Snappy, t: float) -> tuple[float, float]:
    if not a.saccades:
        return 0.0, 0.0
    fixations = [(t0, *safe_gaze(ex * a.eye_scale, ey * a.eye_scale)) for t0, ex, ey in a.saccades]
    return held(fixations, t, EYE_TRAVEL_S, lambda p, v, x: (p[0] + (v[0] - p[0]) * minjerk(x),
                                                              p[1] + (v[1] - p[1]) * minjerk(x)))


def blink_open(a: Snappy, t: float) -> float:
    """canonical blink, evaluated on the tick grid"""
    k = int(math.floor(t / TICK + 1e-6)) % RING_TICKS
    for t0 in a.blinks:
        j = (k - snap(t0)) % RING_TICKS
        for o, n in BLINK:
            if j < n:
                return o
            j -= n
    return 1.0


# ---- integration -----------------------------------------------------------


def integrate(a: Snappy, g: ph.Geom, y0, t0: float, T: float, beat: bool) -> dict:
    v = a.beat
    wb, zb = 2 * math.pi * v.f_body, v.z_body
    wl, zl = 2 * math.pi * v.f_leaf, v.z_leaf
    wr, zr = 2 * math.pi * a.rot_f, a.rot_z
    m, rc0, I = g.leaf_area, g.leaf_c, g.leaf_I
    hx, hy = g.leaf_base[0] - g.pivot[0], g.leaf_base[1] - g.pivot[1]
    stop = math.radians(ph.LEAF_STOP)
    k_stop, c_stop = 40 * wl * wl, 2 * 0.5 * math.sqrt(40) * wl

    def deriv(t, y):
        s, sd, th, thd, phi, phid = y
        tl = t % RING_S
        u = body_cmd(a, tl) + (ph.command(v, t - t0) if beat else 0.0)
        sdd = wb * wb * (u - s) - 2 * zb * wb * sd
        phidd = wr * wr * (lean(a, tl) - phi) - 2 * zr * wr * phid
        q = 1 + s
        sxdd = -sdd / q ** 2 + 2 * sd * sd / q ** 3
        # base acceleration: the squash carries it, and the sway swings it about the pivot
        ax = hx * sxdd + (-hy) * phidd
        ay = hy * sdd + hx * phidd
        c, si = math.cos(th), math.sin(th)
        rx, ry = rc0[0] * c - rc0[1] * si, rc0[0] * si + rc0[1] * c
        torque = m * (rx * (-ay) - ry * (-ax))
        thdd = -wl * wl * (th - leaf_target(a, tl)) - 2 * zl * wl * thd + torque / I - phidd
        if th < stop:
            thdd += -k_stop * (th - stop) - (c_stop * thd if thd < 0 else 0)
        return np.array([sd, sdd, thd, thdd, phid, phidd])

    n = int(round(T / ph.DT)) + 1
    out = np.zeros((n, 6))
    y = np.array(y0, dtype=float)
    for i in range(n):
        t = t0 + i * ph.DT
        out[i] = y
        k1 = deriv(t, y)
        k2 = deriv(t + ph.DT / 2, y + ph.DT / 2 * k1)
        k3 = deriv(t + ph.DT / 2, y + ph.DT / 2 * k2)
        k4 = deriv(t + ph.DT, y + ph.DT * k3)
        y = y + ph.DT / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    return dict(t=np.arange(n) * ph.DT, y=out)


def idle_trace(a: Snappy, g: ph.Geom) -> dict:
    full = integrate(a, g, [0] * 6, 0.0, LOOPS * RING_S, beat=False)
    n = int(round(RING_S / ph.DT))
    last = full["y"][-(n + 1):]
    err = np.abs(last[-1] - last[0])
    return dict(y=last, t=np.arange(n + 1) * ph.DT,
                period_err=dict(s=float(err[0]), leaf_deg=float(math.degrees(err[2])),
                                rot_deg=float(math.degrees(err[4]))))


def idle_state(tr, t: float):
    return tr["y"][int(round((t % RING_S) / ph.DT))]


# ---- poses -----------------------------------------------------------------


def beat_gaze(a: Snappy, t0: float, x: float) -> tuple[float, float]:
    """The shipped gaze x seconds into a beat that started at t0: held through the launch, then eased to
    where the idle's own gaze has got to, over one glance, so the eyes travel there and never jump."""
    frozen = eyes(a, t0 % RING_S)
    if x < LAUNCH_S:
        return frozen
    live = eyes(a, (t0 + x) % RING_S)
    w = minjerk((x - LAUNCH_S) / EYE_TRAVEL_S)
    return (frozen[0] + (live[0] - frozen[0]) * w, frozen[1] + (live[1] - frozen[1]) * w)


# With face=True the face in every bounce follows one script, so the eyes and the glare read as part of the motion and two
# bounces look the same. Gaze offsets are flat px, up is negative; each is kept inside the lens by safe_gaze.
GAZE_BRACE = (6.0, 8.0)     # at the crouch the pupils drop a little, as if bracing
GAZE_LOOK = (10.0, -26.0)   # as the body stretches they lift and hold through the glare
GAZE_SETTLE = (6.0, -4.0)   # after the glare they come back toward the middle
BLINK_AFTER_GLARE_S = 0.12  # the blink lands this long after the glare has passed
BRACE_EASE_S = 0.14
LOOK_EASE_S = 0.16
SETTLE_EASE_S = 0.18
_BLINK_TICKS = [o for o, n in BLINK for _ in range(n)]


def beat_face(a: Snappy, t0: float, x: float, m: dict) -> tuple[float, float, float]:
    """(ex, ey, eye openness from blinks) x seconds into a beat that started at t0 on the ring.
    m has crouch_end, glint_end and x_end, the beat's length. The idle's own glances and blinks are set
    aside for the beat and picked up again by the time it hands back: the gaze eases from the settle
    position to wherever the idle's gaze has got to, so there is no jump at the joint."""
    frozen = eyes(a, t0 % RING_S)
    live = eyes(a, (t0 + x) % RING_S)
    brace, look, settle = (safe_gaze(p[0] * a.gaze_scale, p[1] * a.gaze_scale)
                           for p in (GAZE_BRACE, GAZE_LOOK, GAZE_SETTLE))

    def lerp(p, q, w):
        return (p[0] + (q[0] - p[0]) * w, p[1] + (q[1] - p[1]) * w)

    x_b = round((m["glint_end"] + BLINK_AFTER_GLARE_S) / TICK) * TICK
    back0 = min(x_b + BLINK_TICKS * TICK + 0.04, m["x_end"] - EYE_TRAVEL_S - 0.02)
    if x >= back0:
        pos = lerp(settle, live, minjerk((x - back0) / EYE_TRAVEL_S))
    else:
        pos = frozen
        for s, d, p, q in ((0.0, BRACE_EASE_S, frozen, brace),
                           (m["crouch_end"], LOOK_EASE_S, brace, look),
                           (m["glint_end"], SETTLE_EASE_S, look, settle)):
            if x >= s:
                pos = lerp(p, q, minjerk((x - s) / d))
    k = int(math.floor((x - x_b) / TICK + 1e-6))
    blink = _BLINK_TICKS[k] if 0 <= k < len(_BLINK_TICKS) else 1.0
    return pos[0], pos[1], blink


def make_pose(a: Snappy, t: float, y, squint: float = 1.0, glint=None, face: tuple | None = None) -> dict:
    """face = (beat start, seconds into the beat, marks) while a beat plays; None on the ring."""
    s, _, th, _, phi, _ = y
    sy = 1 + s
    if face is None:
        ex, ey = eyes(a, t % RING_S)
        blink = blink_open(a, t % RING_S)
    elif a.face:
        ex, ey, blink = beat_face(a, *face)
    else:
        ex, ey = beat_gaze(a, face[0], face[1])
        blink = blink_open(a, t % RING_S)
    p = dict(sx=round(1 / sy, 5), sy=round(sy, 5), rot=round(math.degrees(phi), 3),
             leaf=round(math.degrees(th), 3), leaf_rigid=True,
             eye=round(min(blink, squint), 3), ex=round(ex, 2), ey=round(ey, 2))
    if glint:
        p.update(glint=round(glint[0], 4), glint_op=round(glint[1], 3), glint_smear=round(glint[2], 1))
        if a.beat.glint_width != 1.0:
            p["glint_w"] = a.beat.glint_width
    # framing keys only when set, so the shipped loop's poses (and frame names) stay exactly as they were
    if a.zoom != 1.0:
        p.update(zoom=a.zoom, focus=a.focus)
    if a.bold:
        p["bold"] = a.bold
    return p


def blinking(p: dict, q: dict) -> bool:
    """a blink frame is never merged, so every blink keeps the canonical one-tick cadence"""
    return p["eye"] != q["eye"] and min(p["eye"], q["eye"]) <= 0.5


def ring_frames(a: Snappy, idle, g: ph.Geom):
    """[(pose, start tick, ticks)]: one tick while things change, up to two where they barely do."""
    poses = [make_pose(a, k * TICK, idle_state(idle, k * TICK)) for k in range(RING_TICKS)]
    out = [[poses[0], 0, 1]]
    for k in range(1, RING_TICKS):
        last = out[-1]
        ch = ph.step_px(last[0], poses[k], g)[0]
        if ch < EMIT_PX and not blinking(last[0], poses[k]) and last[2] < MAX_HOLD_TICKS:
            last[2] += 1
        else:
            out.append([poses[k], k, 1])
    return out


def beat_run(a: Snappy, g: ph.Geom, idle, ring, start_tick: int):
    v = a.beat
    T = 3.0
    t0 = start_tick * TICK
    comb = integrate(a, g, idle_state(idle, t0), t0, T, beat=True)
    t = comb["t"]
    ref = np.array([idle_state(idle, t0 + x) for x in t])
    delta = comb["y"] - ref
    dur = ph.glint_duration(v)
    sd = delta[:, 1]
    after = t > v.t_crouch + v.t_hold
    idx = np.where(after[1:-1] & (sd[1:-1] > 0) & (sd[2:] <= 0))[0]
    gtr = dict(glint_t0=t[idx[0] + 1] - dur / 2, glint_dur=dur)
    g_end = gtr["glint_t0"] + dur
    rest_lm = ph.landmarks(ph.REST, g)
    env_t = np.arange(0, T, TICK)
    env = np.array([alive.env_px(g, v, delta[i, 0], delta[i, 1], delta[i, 2], delta[i, 3], rest_lm)
                    for i in (np.round(env_t / ph.DT).astype(int))])
    ok = len(env)
    for j in range(len(env) - 1, -1, -1):
        if env[j] >= a.end_px:
            break
        ok = j
    t_ok = max(ok * TICK, g_end)
    # resume on the first ring frame that starts at or after t_ok (ring starts are on the tick grid)
    starts = [r[1] for r in ring]
    k_ok = start_tick + int(math.ceil(t_ok / TICK - 1e-9))
    best = None
    for i, st in enumerate(starts):
        for wrap in (0, RING_TICKS):
            kk = st + wrap
            if kk >= k_ok and (best is None or kk < best[1]):
                best = (i, kk)
    resume, end_tick = best
    n_ticks = end_tick - start_tick
    marks = dict(crouch_end=v.t_crouch + v.t_hold, glint_end=g_end, x_end=n_ticks * TICK)

    def pose(k):
        x = k * TICK
        i = min(int(round(x / ph.DT)), len(t) - 1)
        ds = delta[i, 0]
        sq = 1.0 if ds >= 0 else 1 - (1 - SQUINT_MIN) * min(-ds / v.crouch, 1.0)
        gl = ph.glint_state(gtr, x, ph.SHUTTER / v.fps, v.glint_width)
        return make_pose(a, t0 + x, comb["y"][i], sq, gl, face=(t0, x, marks))

    out = [[pose(0), 0, 1]]
    for k in range(1, n_ticks):
        p = pose(k)
        last = out[-1]
        ch = ph.step_px(last[0], p, g)[0]
        quiet = p.get("glint") is None and last[0].get("glint") is None and not blinking(last[0], p)
        if ch < EMIT_PX and quiet and last[2] < MAX_HOLD_TICKS:
            last[2] += 1
        else:
            out.append([p, k, 1])
    traces = dict(t=t, comb=comb["y"], ref=ref, delta=delta, env_t=env_t, env=env, t_end=n_ticks * TICK,
                  glint_t0=gtr["glint_t0"])
    return out, resume, n_ticks, traces


# ---- building ----------------------------------------------------------------


def build(a: Snappy, g: ph.Geom, seen: dict):
    idle = idle_trace(a, g)
    ring = ring_frames(a, idle, g)
    frames = {}

    def name_for(p, want):
        key = repr(sorted(p.items()))
        if key in seen:
            frames[seen[key]] = p
            return seen[key]
        seen[key] = want
        frames[want] = p
        return want

    ring_names = [name_for(p, f"{a.id}-r{i:03d}") for i, (p, _, _) in enumerate(ring)]
    loop = [[n, tick_ms(st + nt) - tick_ms(st)] for n, (_, st, nt) in zip(ring_names, ring)]
    beats, runs = [], []
    for j, start in enumerate(a.starts):
        k = snap(start)
        at = min(range(len(ring)), key=lambda i: abs(ring[i][1] - k))
        frames_b, resume, n_ticks, traces = beat_run(a, g, idle, ring, ring[at][1])
        seq = []
        for q, (p, st, nt) in enumerate(frames_b):
            n = name_for(p, f"{a.id}-{'abcdefghijkl'[j]}{q:02d}")
            k0 = ring[at][1] + st
            seq.append([n, tick_ms(k0 + nt) - tick_ms(k0)])
        beats.append(dict(at=at, frames=seq, resume=resume))
        runs.append(dict(at=at, resume=resume, n_ticks=n_ticks, entries=frames_b, traces=traces))
    return dict(idle=idle, ring=ring, ring_names=ring_names, loop=loop, beats=beats, runs=runs, frames=frames)


# ---- analysis ----------------------------------------------------------------


def motion_stats(pose_fn, T: float, g: ph.Geom) -> dict:
    """Apparent motion of an idle loop, from every vertex visible throughout.

    Spectrum: positions sampled at 120 Hz over one loop (periodic, so the FFT has no window); the
    share of motion energy above a frequency is the share of velocity power, sum |F|^2 (2 pi f)^2.
    Speed: the largest vertex move between 30 Hz samples (one frame at 30 fps) times 30, in 32 px
    icon px per second, so a jump that happens within one frame counts once, at frame speed."""
    fs = 120
    n = int(round(T * fs))
    lm = np.array([ph.landmarks(pose_fn(i / fs), g) for i in range(n)])
    keep = ~np.isnan(lm).any(axis=(0, 2))
    x = lm[:, keep, :].reshape(n, -1)
    x = x - x.mean(0)
    F = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(n, 1 / fs)
    disp = (np.abs(F) ** 2).sum(1)
    vel = disp * (2 * np.pi * f) ** 2
    share = lambda lo: float(vel[f > lo].sum() / vel[f > 0].sum())  # noqa: E731
    top = np.argsort(disp[1:])[::-1][:3] + 1
    sub = lm[::4][:, keep, :]  # 30 Hz
    d = np.roll(sub, -1, axis=0) - sub
    speed = np.hypot(d[..., 0], d[..., 1]).max(1) * 30
    return dict(dominant_hz=[round(float(f[i]), 3) for i in top], above_1hz=share(1.0), above_2hz=share(2.0),
                speed_p50=float(np.percentile(speed, 50)), speed_p95=float(np.percentile(speed, 95)),
                speed_max=float(speed.max()))


def snappy_pose_fn(a: Snappy, idle):
    return lambda t: make_pose(a, t, idle_state(idle, t))


def still_span_ms(steps, holds) -> int:
    """Longest time the picture changes by less than STILL_PX from one frame to the next: the run of
    frames whose arrival step is under STILL_PX, plus the hold of the frame before them."""
    best = 0
    run = 0
    prev_hold = 0
    for st, h in zip(steps, holds):
        if st < STILL_PX:
            run += h
            best = max(best, run + prev_hold)
        else:
            run = 0
            prev_hold = h
            best = max(best, h)
    return best


def blink_table(names, holds, frames) -> list:
    """Every blink in a played sequence: the run of frames with eyes at or below the half frame."""
    out, cur = [], None
    for n, h in zip(names, holds):
        e = frames[n]["eye"] if n in frames else 1.0
        if e <= 0.5:
            if cur is None:
                cur = []
            cur.append((e, h))
        elif cur is not None:
            out.append(cur)
            cur = None
    if cur is not None:
        out.append(cur)
    # collapse runs of equal openness: (openness, ms)
    res = []
    for b in out:
        segs = []
        for e, h in b:
            if segs and segs[-1][0] == e:
                segs[-1][1] += h
            else:
                segs.append([e, h])
        res.append(dict(total_ms=sum(h for _, h in b), segments=[(e, ms) for e, ms in segs]))
    return res


def metrics(a: Snappy, built, g: ph.Geom) -> dict:
    ring, frames = built["ring"], built["frames"]
    names, loop = built["ring_names"], built["loop"]
    holds = [ms for _, ms in loop]
    poses = [p for p, _, _ in ring]
    rs = [ph.step_px(p, q, g)[0] for p, q in zip(poses, poses[1:] + poses[:1])]
    arrive = rs[-1:] + rs[:-1]  # step into each frame
    P = alive.parts(g)
    lms = np.array([ph.landmarks(p, g) for p in poses])
    amp = {}
    for k, sl in P.items():
        pts = lms[:, sl]
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            mean = np.nanmean(pts, axis=0)
        amp[k] = float(np.nanmax(np.hypot(*(pts - mean).transpose(2, 0, 1))))
    stats = motion_stats(snappy_pose_fn(a, built["idle"]), RING_S, g)
    n_acc = len({snap(t) for t, *_ in a.saccades} | {snap(t) for t in a.blinks} | {snap(t) for t, _ in a.flicks}
                | {snap(t) for t, _ in a.pops} | {snap(t) for t, _ in a.shifts})
    out = dict(period_err=built["idle"]["period_err"], ring_frames=len(ring), ring_ms=sum(holds),
               holds_ms=sorted(set(holds)), step_min=min(rs), step_mean=float(np.mean(rs)), step_max=max(rs),
               seam=rs[-1], still_ms=still_span_ms(arrive + arrive, holds + holds),
               amp_32={k: round(x, 3) for k, x in amp.items()}, motion=stats,
               accents=n_acc, accent_rate=n_acc / RING_S,
               blinks_ring=blink_table(names + names[:6], holds + holds[:6], frames), beats=[])
    for run, b in zip(built["runs"], built["beats"]):
        bn = [n for n, _ in b["frames"]]
        bh = [ms for _, ms in b["frames"]]
        bp = [p for p, _, _ in run["entries"]]
        pre = list(range(b["at"] - 6, b["at"]))
        post = list(range(b["resume"], b["resume"] + 6))
        seq_p = [poses[i % len(poses)] for i in pre] + bp + [poses[i % len(poses)] for i in post]
        seq_h = [holds[i % len(poses)] for i in pre] + bh + [holds[i % len(poses)] for i in post]
        seq_n = [names[i % len(poses)] for i in pre] + bn + [names[i % len(poses)] for i in post]
        st = [ph.step_px(p, q, g)[0] for p, q in zip(seq_p, seq_p[1:])]
        j = len(pre)
        out["beats"].append(dict(
            at=b["at"], at_ms=tick_ms(ring[b["at"]][1]), resume=b["resume"], frames=len(bp), length_ms=sum(bh),
            entry_equals_ring=bool(np.nanmax(np.abs(ph.landmarks(bp[0], g) - lms[b["at"]])) < 1e-9),
            entry=st[j - 1], exit=st[j + len(bp) - 1], max_step=max(st[j:j + len(bp) - 1]),
            still_ms=still_span_ms([0.0] + st, seq_h), max_hold=max(bh), min_hold=min(bh),
            blinks=blink_table(seq_n, seq_h, frames),
            min_eye_outside_blinks=min(p["eye"] for p in bp if p["eye"] > 0.5),
        ))
    return out


# ---- variants ----------------------------------------------------------------

# The shipped idle: a strict 3.000 s cycle, and the face in step with the bounce. Every period in it
# (the drift bed, the breath, the leaf flick) divides 3 s, and the 6 s ring is the same 3 s twice, with a
# bounce at 0.6 s and at 3.6 s, so every bounce starts exactly 3.000 s after the last and finds the cat in
# the same state. The eyes do not glance on their own: they move only as part of the bounce's face script,
# and by a small amount.
IDLE = Snappy(
    "idle-3s", "Idle", "Every 3 s, Face in Step",
    "Every 3.000 s, the same bounce. The eyes hold still except inside the bounce: the pupils drop a little "
    "at the crouch, lift through the glare, then one blink and they settle. Nothing else happens to the face, "
    "so the face and the bounce always line up.",
    group="r6", face=True, gaze_scale=0.6, bed_period=3.0, bed_body=0.024, bed_leaf=4.2,
    saccades=(), blinks=(),
    flicks=((2.70, -10.0), (5.70, -10.0)),
    pops=((0.10, 0.022), (3.10, 0.022)),
    shifts=(),
    starts=(0.60, 3.60), chance=1.0, max_loops=0.5,
)
# Framing options: the same loop with the circle closed in on the glasses, for the 16 px tab and the
# search-result icon. Everything moves 1/zoom larger in icon px, so the checks run on each option's own frame.
FRAMING_NOTE = ("The same 3 s loop, the circle closed in to 78% of the shipped width and centred on the glasses, "
                "so the lenses are 28% larger at 16 px. The sky is a crescent and the cat's left arm "
                "and lower body crop more.")
TIGHT_ZOOM = 0.78
TIGHT = dataclasses.replace(
    IDLE, id="idle-3s-tight", label="Tight", name="Closer on the Glasses", group="framing",
    note=FRAMING_NOTE + " The bounce is scaled by the same 0.78, so it covers the same pixels as the shipped one "
                        "and stays inside the 2 px step budget.",
    zoom=TIGHT_ZOOM, focus=0.7,
    # a tighter circle magnifies every move by 1/zoom (the shipped bounce peaks at 1.74 px, this would be 2.22)
    beat=dataclasses.replace(alive.BEAT_30, crouch=round(alive.BEAT_30.crouch * TIGHT_ZOOM, 4),
                             push=round(alive.BEAT_30.push * TIGHT_ZOOM, 4)),
)
TIGHT_BOLD = dataclasses.replace(
    TIGHT, id="idle-3s-tight-bold", label="Tight +", name="Closer, Heavier Rings",
    note=FRAMING_NOTE + " The glasses rings are 8.5 flat px heavier, about 0.2 px at 16 px, so they stay two "
                        "rings instead of one smudge.",
    bold=8.5,
)
SNAPPY = [IDLE, TIGHT, TIGHT_BOLD]


# ---- pictures ------------------------------------------------------------------


def plot(a: Snappy, built, path):
    """The accent schedule: body strain, leaf, sway, eye position and openness over the loop."""
    Wd, H, L, R = 1300, 820, 70, 20
    im = Image.new("RGB", (Wd, H), (250, 249, 247))
    d = ImageDraw.Draw(im)
    f = ph.font(13)
    idle = built["idle"]
    tt = np.arange(0, RING_S, 0.005)
    ys = np.array([idle_state(idle, x) for x in tt])
    ex = np.array([eyes(a, x) for x in tt])
    bo = np.array([blink_open(a, x) for x in tt])
    d.text((L, 8), f"{a.label} {a.name}: one {RING_S:g} s loop. Ticks mark ring frame starts.", fill=ph.INK,
           font=ph.font(15))
    X = lambda x: L + (Wd - L - R) * x / RING_S  # noqa: E731
    panels = [
        ("body strain s (coral) and command (grey)", [([body_cmd(a, x) for x in tt], ph.C_CMD), (ys[:, 0], ph.C_BODY)]),
        ("leaf angle deg (green) and rest target (grey)",
         [(np.degrees([leaf_target(a, x) for x in tt]), ph.C_CMD), (np.degrees(ys[:, 2]), ph.C_LEAF)]),
        ("sway deg (coral) and lean command (grey)",
         [(np.degrees([lean(a, x) for x in tt]), ph.C_CMD), (np.degrees(ys[:, 4]), ph.C_BODY)]),
        ("eye position ex (blue), ey (ink), flat px", [(ex[:, 0], ph.C_GLINT), (ex[:, 1], ph.C_EYE)]),
        ("eye openness (canonical blink)", [(bo, ph.C_EYE)]),
    ]
    ph_ = (H - 70) / len(panels)
    for k, (title, curves) in enumerate(panels):
        y0, y1 = 36 + k * ph_ + 18, 36 + (k + 1) * ph_ - 8
        d.text((L, y0 - 18), title, fill=ph.INK, font=f)
        vals = np.concatenate([np.asarray(c, float) for c, _ in curves])
        lo, hi = float(vals.min()), float(vals.max())
        pad = (hi - lo) * 0.08 or 0.1
        lo, hi = lo - pad, hi + pad
        Y = lambda y: y1 - (y1 - y0) * (y - lo) / (hi - lo)  # noqa: E731
        d.rectangle((L, y0, Wd - R, y1), outline=ph.GRID)
        d.text((8, y0), f"{hi:.3g}", fill=ph.INK, font=f)
        d.text((8, y1 - 14), f"{lo:.3g}", fill=ph.INK, font=f)
        for c, col in curves:
            d.line([(X(x), Y(y)) for x, y in zip(tt, c)], fill=col, width=2)
        for _, st, _ in built["ring"]:
            d.line((X(st * TICK), y1 - 4, X(st * TICK), y1), fill=ph.INK)
    for x in np.arange(0, RING_S + 1e-9, 0.5):
        d.text((X(x) - 10, H - 22), f"{x:.1f}s", fill=ph.INK, font=f)
    for b in built["beats"]:
        x = built["ring"][b["at"]][1] * TICK
        d.line((X(x), 30, X(x), H - 30), fill=(200, 40, 20))
        d.text((X(x) + 3, 30), "beat", fill=(200, 40, 20), font=f)
    im.save(path)


def blink_closeup(a: Snappy, built, small, path):
    """Each blink in the ring, cropped to the eyes, at 32 px (x8) and 16 px (x16)."""
    names, loop = built["ring_names"], built["loop"]
    frames = built["frames"]
    rows = []
    i = 0
    n = len(names)
    while i < n:
        if frames[names[i]]["eye"] <= 0.5:
            rows.append(list(range(i - 1, i + 5)))
            while i < n and frames[names[i]]["eye"] <= 0.5:
                i += 1
        i += 1
    cw, chh = 8 * 20, 8 * 12
    W_ = 20 + 6 * (cw + 8)
    H = 30 + len(rows) * (2 * chh + 40)
    im = Image.new("RGB", (W_, H), (250, 249, 247))
    d = ImageDraw.Draw(im)
    d.text((10, 8), f"{a.label}: every ring blink, eyes cropped. Rows: 32 px (x8), then 16 px (x16). "
                    f"Label: openness, hold ms.", fill=ph.INK, font=ph.font(13))
    for r, idx in enumerate(rows):
        for c, j in enumerate(idx):
            nm = names[j % n]
            src = small[nm].convert("RGBA")
            crop = src.crop((7, 14, 27, 26))  # both lenses and eyes
            big = Image.new("RGBA", crop.size, (255, 255, 255, 255))
            big.alpha_composite(crop)
            x, y = 10 + c * (cw + 8), 28 + r * (2 * chh + 40)
            im.paste(big.resize((cw, chh), Image.NEAREST).convert("RGB"), (x, y))
            s16 = src.resize((16, 16), Image.LANCZOS).crop((3, 7, 14, 13))
            b16 = Image.new("RGBA", s16.size, (255, 255, 255, 255))
            b16.alpha_composite(s16)
            im.paste(b16.resize((cw, chh), Image.NEAREST).convert("RGB"), (x, y + chh + 4))
            d.text((x, y + 2 * chh + 8), f"{frames[nm]['eye']:.2f}  {loop[j % n][1]} ms", fill=ph.INK,
                   font=ph.font(12))
    im.save(path)
