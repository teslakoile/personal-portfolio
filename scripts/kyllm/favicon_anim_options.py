"""The KYLLM tab icon's animation: frames, choreography, and the module the site ships.

Every frame is the flat KYLLM (public/kyllm/kyllm-flat.svg) in the sky circle avatar frame, posed with
SVG transforms only: scale, rotate, the leaf turned about its base, the eye ovals shortened, shifted or
closed, and a glint overlay on the lenses. Nothing is drawn by hand and the cat is never translated.
The poses come from damped-spring simulations (favicon_physics.py, favicon_alive.py, favicon_snappy.py).
Frames are rendered by Chromium (render_svgs.mjs), then written to:

  public/kyllm/favicon-lab/anim/<frame>-128.png   previews for /samples/favicon-kyllm-anim
  app/samples/favicon-kyllm-anim/options.ts       32 px data URIs + choreography for that page
  app/_brand/faviconFrames.ts                     the shipped loop (SHIP_ID), frames renamed f0, f1, ...

Filmstrips, trace plots and the checks report go to output/favicon-options/physics/.

    python3 scripts/kyllm/favicon_anim_options.py
"""

import base64
import io
import json
import math
import re
import subprocess

import numpy as np
from PIL import Image

import favicon_alive as alive
import favicon_frame as d
import favicon_physics as phys
import favicon_snappy as snappy

ROOT = d.ROOT
WORK = ROOT / "output/favicon-options"
PREVIEW = ROOT / "public/kyllm/favicon-lab/anim"
TS_OUT = ROOT / "app/samples/favicon-kyllm-anim/options.ts"
SHIP_ID = "idle-3s"  # the shipped loop; written to app/_brand/faviconFrames.ts
SHIP_OUT = ROOT / "app/_brand/faviconFrames.ts"
PHYS_OUT = WORK / "physics"  # filmstrips, trace plots and the checks report for Round 3

SKY, CORAL, SAGE, INK, PAPER = "#d6e4f0", "#f5482d", "#7fb99a", "#1c1917", "#faf9f7"
PIVOT = (486.0, 872.0)      # bottom centre of the body, below the frame edge
LEAF_BASE = (531.0, 270.0)  # where the leaf meets the head
# cx, cy, rx, ry, rotation. First is the eye in the viewer's right lens.
EYES = [(741.3, 491.2, 58.7, 28.9, 80.42), (528.5, 504.0, 60.5, 31.5, 82.72)]


def parts():
    s = (ROOT / "public/kyllm/kyllm-flat.svg").read_text()
    paths = re.findall(r'<path d="([^"]*)"', s)
    return paths[0], paths[1]


BODY, LEAF = parts()


def one_eye(spec, openness: float) -> str:
    cx, cy, rx, ry, deg = spec
    if openness > 0.2:
        return (
            f'<ellipse cx="{cx}" cy="{cy}" rx="{rx * openness:.1f}" ry="{ry}" '
            f'transform="rotate({deg} {cx} {cy})" fill="{INK}"/>'
        )
    a = math.radians(deg + 90)
    hx, hy = math.cos(a) * (ry - 8), math.sin(a) * (ry - 8)
    return (
        f'<line x1="{cx - hx:.1f}" y1="{cy - hy:.1f}" x2="{cx + hx:.1f}" y2="{cy + hy:.1f}" '
        f'stroke="{INK}" stroke-width="18" stroke-linecap="round"/>'
    )


def eye_svg(openness) -> str:
    """openness is one number for both eyes, or (right lens, left lens)."""
    o = openness if isinstance(openness, tuple) else (openness, openness)
    return "".join(one_eye(spec, v) for spec, v in zip(EYES, o))


GLASSES = (
    f'<ellipse cx="492.5" cy="498.5" rx="153.1" ry="129.9" transform="rotate(81.66 492.5 498.5)" '
    f'fill="none" stroke="{INK}" stroke-width="41.8"/>'
    f'<ellipse cx="780.7" cy="486.0" rx="150.2" ry="112.6" transform="rotate(75.30 780.7 486.0)" '
    f'fill="none" stroke="{INK}" stroke-width="41.8"/>'
    f'<line x1="622.0" y1="487.7" x2="666.3" y2="483.8" stroke="{INK}" stroke-width="31.4" stroke-linecap="round"/>'
    f'<line x1="362.3" y1="498.8" x2="269.1" y2="510.1" stroke="{INK}" stroke-width="35.5" stroke-linecap="round"/>'
)

# the lens openings, inside the 41.8 px rims, for clipping the glint
LENS_CLIP = (
    '<clipPath id="lens">'
    '<ellipse cx="492.5" cy="498.5" rx="132.2" ry="109" transform="rotate(81.66 492.5 498.5)"/>'
    '<ellipse cx="780.7" cy="486.0" rx="129.3" ry="91.7" transform="rotate(75.30 780.7 486.0)"/>'
    "</clipPath>"
)


def glint_svg(t: float, op: float = 0.92, smear: float = 0.0, width: float = 1.0) -> str:
    """The lens streak at position t. Round 3 passes an opacity (the specular lobe)
    and a smear in flat px: each bar becomes its box-filtered sweep over the
    shutter, a trapezoid in opacity, so a fast streak does not strobe. width
    widens both bars and their gap about the streak's centre."""
    x = 230 + t * 760
    if not smear:
        xs = f"{x:.0f}" if op == 0.92 else f"{x:.1f}"
        bars = (
            f'<rect x="-46" y="120" width="62" height="800" fill="#fff" opacity="{op:g}"/>'
            f'<rect x="34" y="120" width="20" height="800" fill="#fff" opacity="{op:g}"/>'
        )
    else:
        xs = f"{x:.1f}"
        bars = ""
        for i, (x0, w) in enumerate(((-46, 62), (34, 20))):
            x0, w = 4 + (x0 - 4) * width, w * width
            W = w + smear
            m = min(w, smear)
            peak = op * m / smear
            bars += (
                f'<linearGradient id="gs{i}"><stop offset="0" stop-color="#fff" stop-opacity="0"/>'
                f'<stop offset="{m / W:.4f}" stop-color="#fff" stop-opacity="{peak:.3f}"/>'
                f'<stop offset="{1 - m / W:.4f}" stop-color="#fff" stop-opacity="{peak:.3f}"/>'
                f'<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
                f'<rect x="{x0 - smear / 2:.1f}" y="120" width="{W:.1f}" height="800" fill="url(#gs{i})"/>'
            )
    return (
        f'{LENS_CLIP}<g clip-path="url(#lens)">'
        f'<g transform="translate({xs} 0) translate(0 500) skewX(-22) translate(0 -500)">'
        f"{bars}</g></g>"
    )


def ring_svg(cx, cy, D, ang: float) -> str:
    r, w = D / 2 - 0.05 * D, 0.075 * D
    a0, a1 = math.radians(ang), math.radians(ang + 110)
    p0 = (cx + r * math.cos(a0), cy + r * math.sin(a0))
    p1 = (cx + r * math.cos(a1), cy + r * math.sin(a1))
    return (
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="none" stroke="{INK}" '
        f'stroke-width="{w:.1f}" opacity="0.16"/>'
        f'<path d="M{p0[0]:.1f} {p0[1]:.1f} A{r:.1f} {r:.1f} 0 0 1 {p1[0]:.1f} {p1[1]:.1f}" fill="none" '
        f'stroke="{INK}" stroke-width="{w:.1f}" stroke-linecap="round"/>'
    )


def dot_svg(cx, cy, D, r: float, ping) -> str:
    x, y = cx + 0.26 * D, cy - 0.26 * D
    out = ""
    if ping:
        pr, po = ping
        out += (
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{pr * D:.1f}" fill="none" stroke="{CORAL}" '
            f'stroke-width="{0.03 * D:.1f}" opacity="{po}"/>'
        )
    out += (
        f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r * D:.1f}" fill="{CORAL}" stroke="{PAPER}" '
        f'stroke-width="{0.03 * D:.1f}"/>'
    )
    return out


def frame_svg(cx, cy, D, p: dict) -> str:
    dx, dy = p.get("dx", 0), p.get("dy", 0)
    rot, sx, sy, fx = p.get("rot", 0), p.get("sx", 1), p.get("sy", 1), p.get("fx", 1)
    cat = (
        f"translate({dx} {dy}) translate({cx:.1f} 0) scale({fx} 1) translate({-cx:.1f} 0) "
        f"translate({PIVOT[0]} {PIVOT[1]}) rotate({rot}) scale({sx} {sy}) translate({-PIVOT[0]} {-PIVOT[1]})"
    )
    leaf_tf = f"rotate({p.get('leaf', 0)} {LEAF_BASE[0]} {LEAF_BASE[1]})"
    if p.get("leaf_rigid"):
        # undo the body's scale about the leaf base, so the squash carries the leaf but does not deform it
        bx, by = LEAF_BASE
        leaf_tf = f"translate({bx} {by}) scale({1 / sx:.5f} {1 / sy:.5f}) translate({-bx} {-by}) {leaf_tf}"
    leaf = f'<g transform="{leaf_tf}"><path d="{LEAF}" fill="{SAGE}"/></g>'
    glasses = f'<g transform="translate(0 {p.get("gy", 0)})">{GLASSES}</g>'
    eyes = f'<g transform="translate({p.get("ex", 0)} {p.get("ey", 0)})">{eye_svg(p.get("eye", 1))}</g>'
    glint = ""
    if p.get("glint") is not None:
        glint = glint_svg(p["glint"], p.get("glint_op", 0.92), p.get("glint_smear", 0.0), p.get("glint_w", 1.0))
    n = p.get("dots", 0)
    dots = ""
    if n:
        r = 0.04 * D
        for i in range(3):
            x = cx + 0.08 * D + i * 0.10 * D
            y = cy - 0.33 * D
            op = 1 if i < n else 0.18
            dots += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{INK}" opacity="{op}"/>'
    over = ""
    if p.get("ring") is not None:
        over += ring_svg(cx, cy, D, p["ring"])
    if p.get("dot"):
        over += dot_svg(cx, cy, D, p["dot"], p.get("ping"))
    # a loader ring needs room, so the character steps back inside it
    shrink = 0.86 if p.get("ring") is not None else 1
    base_y = cy + D / 2
    wrap = f"translate({cx:.1f} {base_y:.1f}) scale({shrink}) translate({-cx:.1f} {-base_y:.1f})"
    vb = f"{cx - D / 2:.1f} {cy - D / 2:.1f} {D:.1f} {D:.1f}"
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">'
        f'<clipPath id="c"><circle cx="{cx:.1f}" cy="{cy:.1f}" r="{D / 2:.1f}"/></clipPath>'
        f'<g clip-path="url(#c)"><circle cx="{cx:.1f}" cy="{cy:.1f}" r="{D / 2:.1f}" fill="{SKY}"/>'
        f'<g transform="{wrap}"><g transform="{cat}"><path d="{BODY}" fill="{CORAL}"/>{leaf}{glasses}{eyes}{glint}</g></g>'
        f"{dots}{over}</g></svg>"
    )


# ---- choreography ---------------------------------------------------------


# ---- Round 3: physics combos ----------------------------------------------


def geometry(cx, cy, D) -> phys.Geom:
    return phys.Geom(PIVOT, LEAF_BASE, phys.polygon(BODY), phys.polygon(LEAF), EYES, cx, cy, D)


# ---- Round 4: always alive -----------------------------------------------


# ---- Round 5: snappy idle ------------------------------------------------------


def round5(g: phys.Geom):
    """A held pose with quick accents (favicon_snappy.py), the Round 4 X beat on top."""
    seen, opts, runs = {}, [], []
    for a in snappy.SNAPPY:
        built = snappy.build(a, g, seen)
        frames = built["frames"]
        rn = built["ring_names"]
        b0 = [n for n, _ in built["beats"][0]["frames"]]
        keys = [rn[0], min(rn, key=lambda n: frames[n]["eye"]), max(rn, key=lambda n: abs(frames[n]["leaf"])),
                min(b0, key=lambda n: frames[n]["sy"]), max(b0, key=lambda n: frames[n].get("glint_op", 0))]
        ring = dict(loop=built["loop"], beats=built["beats"], chance=a.chance, maxLoops=a.max_loops)
        opts.append(dict(id=a.id, label=a.label, name=a.name, role="Always on", note=a.note, frames=frames,
                         beats=[], rest=[0, 0], group=a.group, base=rn[0], keys=list(dict.fromkeys(keys)),
                         ring=ring))
        runs.append((a, built))
    for o in opts:
        if o["group"] == "r6":
            s = rhythm_stats(o["ring"])
            every = (f"every {s['mean']:.3f} s exactly" if s["max"] - s["min"] < 0.01
                     else f"every {s['min']:.1f} to {s['max']:.1f} s, {s['mean']:.1f} s on average")
            o["note"] = (f"{o['note'] + ' ' if o['note'] else ''}A bounce starts {every} ({s['per_min']:.0f} a "
                         f"minute); the cat is mid-bounce {s['share']:.0%} of the time.")
    return opts, runs


def rhythm_stats(ring, hours=3, seed=7):
    """The bounce rate of a ring, by running runRing's rules (faviconControl.ts) on a virtual clock."""
    import random
    rnd = random.Random(seed)
    loop, beats = ring["loop"], ring["beats"]
    loop_ms = sum(ms for _, ms in loop)
    n, t, i, quiet, starts, mid = len(loop), 0, 0, 0, [], 0
    end = hours * 3600 * 1000
    while t < end:
        here = [b for b in beats if b["at"] == i]
        if here and (rnd.random() < ring["chance"] or quiet >= ring["maxLoops"] * loop_ms):
            b = here[int(rnd.random() * len(here))]
            length = sum(ms for _, ms in b["frames"])
            starts.append(t)
            t += length
            mid += length
            quiet, i = 0, b["resume"]
            continue
        ms = loop[i][1]
        t += ms
        quiet += ms
        i = (i + 1) % n
    gaps = [(b - a) / 1000 for a, b in zip(starts, starts[1:])]
    return dict(per_min=len(starts) / (end / 60000), mean=sum(gaps) / len(gaps), min=min(gaps), max=max(gaps),
                share=mid / end)


def report5(runs, small, g):
    out = {}
    for a, built in runs:
        m = snappy.metrics(a, built, g)
        rn = built["ring_names"]
        holds = [ms for _, ms in built["loop"]]
        stem = PHYS_OUT / a.id
        snappy.plot(a, built, f"{stem}-trace.png")
        alive.strip(f"{a.label} {a.name}: idle ring, {len(rn)} frames over {snappy.RING_S:g} s (holds in ms). Top: 32 "
                    f"px x3. Bottom: 16 px x6. Step in 32 px icon px (red if under {snappy.STILL_PX} or over 2).",
                    rn + [rn[0]], holds + [holds[0]], built["frames"], small, f"{stem}-idle-film.png", g, 2.0)
        snappy.blink_closeup(a, built, small, f"{stem}-blinks.png")
        for j, b in enumerate(built["beats"]):
            names = [rn[(b["at"] - 1) % len(rn)]] + [n for n, _ in b["frames"]] + [rn[b["resume"]]]
            hs = [holds[(b["at"] - 1) % len(rn)]] + [ms for _, ms in b["frames"]] + [holds[b["resume"]]]
            alive.strip(f"{a.label} {a.name}: beat from ring frame {b['at']} with the idle under it, resuming at "
                        f"{b['resume']}. First and last cells are ring frames.", names, hs, built["frames"], small,
                        f"{stem}-beat{j}-film.png", g, a.beat.step_limit)
        out[a.id] = m
        mm = m["motion"]
        print(f"  {a.label} {a.name:18s} ring {m['ring_frames']} frames, accents {m['accent_rate']:.2f}/s, >1 Hz "
              f"{mm['above_1hz']:.0%}, >2 Hz {mm['above_2hz']:.0%}, speed p50 {mm['speed_p50']:.1f} p95 "
              f"{mm['speed_p95']:.1f}, step max {m['step_max']:.2f}, seam {m['seam']:.2f}, still {m['still_ms']} ms; "
              + ", ".join(f"beat {b['frames']} fr max {b['max_step']:.2f} in {b['entry']:.2f} out {b['exit']:.2f} "
                          f"still {b['still_ms']}" for b in m["beats"]))
    (PHYS_OUT / "report-r5.json").write_text(json.dumps(out, indent=1, default=lambda o: bool(o) if isinstance(
        o, np.bool_) else float(o)))


def palette_for(images):
    """One 64 colour palette for a set of frames, so sub-pixel idle motion is not drowned by each
    frame picking slightly different colours for its antialiased edges."""
    w = 32
    sheet = Image.new("RGBA", (w * len(images), w))
    for i, im in enumerate(images):
        sheet.paste(im, (i * w, 0))
    q = sheet.quantize(64, method=Image.Quantize.FASTOCTREE)
    return np.array(q.getpalette(rawmode="RGBA")[: 64 * 4], dtype=float).reshape(-1, 4)


def quantize_to(im: Image.Image, pal: np.ndarray) -> Image.Image:
    """Map an RGBA frame onto a fixed RGBA palette (nearest colour, no dither), keeping alpha."""
    px = np.asarray(im.convert("RGBA"), dtype=float).reshape(-1, 4)
    pre = lambda a: np.concatenate([a[:, :3] * a[:, 3:] / 255, a[:, 3:]], 1)  # noqa: E731
    idx = np.argmin(((pre(px)[:, None, :] - pre(pal)[None]) ** 2).sum(-1), 1).astype(np.uint8)
    out = Image.frombytes("P", im.size, idx.tobytes())
    out.putpalette(pal.astype(np.uint8).flatten().tolist(), rawmode="RGBA")
    return out


def write_shipped(meta, data) -> None:
    """The shipped loop for app/_brand/AnimatedFavicon.tsx: one option's ring, with its frames renamed
    f0, f1, ... in order of first use so the module carries no sample names."""
    o = next(m for m in meta if m["id"] == SHIP_ID)
    ring = o["ring"]
    order = []
    for f, _ in ring["loop"] + [x for b in ring["beats"] for x in b["frames"]]:
        if f not in order:
            order.append(f)
    short = {f: f"f{i}" for i, f in enumerate(order)}
    fix = lambda seq: [[short[f], ms] for f, ms in seq]
    shipped = dict(loop=fix(ring["loop"]),
                   beats=[dict(at=b["at"], frames=fix(b["frames"]), resume=b["resume"]) for b in ring["beats"]],
                   chance=ring["chance"], maxLoops=ring["maxLoops"])
    lines = [f"// Generated by scripts/kyllm/favicon_anim_options.py from option {o['label']}, {o['name']}.",
             "// Do not edit. 32 px frames as data URIs, so a swap never waits on the network.", "",
             'import type { FaviconRing } from "./faviconControl";', "",
             "export const FAVICON_FRAMES: Record<string, string> = {"]
    for f in order:
        lines.append(f'  {short[f]}: "data:image/png;base64,{data[f]}",')
    lines += ["};", "", f"/** the frame shown first, and whenever the loop is stopped */",
              f'export const FAVICON_BASE = "{short[ring["loop"][0][0]]}";', "",
              f"export const FAVICON_RING: FaviconRing = {json.dumps(shipped)};", ""]
    SHIP_OUT.write_text("\n".join(lines))
    kb = SHIP_OUT.stat().st_size / 1024
    print(f"shipped {o['label']}: {len(order)} frames, ring {len(ring['loop'])}, "
          f"beats {[len(b['frames']) for b in ring['beats']]}, module {kb:.0f} KB")


def main() -> None:
    flat = Image.open(d.SRC).convert("RGBA")
    cx, cy, D = d.avatar_frame(flat)
    g = geometry(cx, cy, D)
    r5, runs5 = round5(g)
    opts = r5

    frames = {"open": {}, "half": dict(eye=0.5), "closed": dict(eye=0.0)}
    for o in opts:
        frames.update(o["frames"])

    svgs = WORK / "svg"
    pngs = WORK / "png"
    svgs.mkdir(parents=True, exist_ok=True)
    for old in svgs.glob("*.svg"):
        old.unlink()
    for name, pose in frames.items():
        (svgs / f"{name}.svg").write_text(frame_svg(cx, cy, D, pose))
    subprocess.run(["node", str(ROOT / "scripts/kyllm/render_svgs.mjs"), str(svgs), str(pngs), "1024"],
                   cwd=ROOT, check=True)

    PREVIEW.mkdir(parents=True, exist_ok=True)
    for old in PREVIEW.glob("*-128.png"):
        old.unlink()
    data, smalls = {}, {}
    # One palette shared by every frame of a loop, so colours cannot flicker between its frames. The shipped
    # loop's palette comes from its own frames only, so adding or changing another option never moves it.
    ship_names = {n for o in opts if o["id"] == SHIP_ID for n in o["frames"]}
    other_names = {n for o in opts for n in o["frames"]} - ship_names

    def palette_of(names):
        return palette_for([Image.open(pngs / f"{n}.png").convert("RGBA").resize((32, 32), Image.LANCZOS)
                            for n in sorted(names)])

    pal_ship = palette_of(ship_names)
    pal_other = palette_of(other_names) if other_names else None
    for name in frames:
        big = Image.open(pngs / f"{name}.png").convert("RGBA")
        big.resize((128, 128), Image.LANCZOS).quantize(64, method=Image.Quantize.FASTOCTREE).save(
            PREVIEW / f"{name}-128.png", optimize=True)
        small = big.resize((32, 32), Image.LANCZOS)
        buf = io.BytesIO()
        if name in ship_names:
            quantize_to(small, pal_ship).save(buf, format="PNG", optimize=True)
        elif name in other_names:
            quantize_to(small, pal_other).save(buf, format="PNG", optimize=True)
        else:
            small.quantize(64, method=Image.Quantize.FASTOCTREE).save(buf, format="PNG", optimize=True)
        data[name] = base64.b64encode(buf.getvalue()).decode()
        smalls[name] = Image.open(io.BytesIO(buf.getvalue())).convert("RGBA")  # exactly what the tab gets
    report5(runs5, smalls, g)

    meta = []
    for o in opts:
        used = {f for b in o["beats"] for f, _ in b} | {"open", o["base"]}
        if o.get("ring"):
            used |= {f for f, _ in o["ring"]["loop"]} | {f for b in o["ring"]["beats"] for f, _ in b["frames"]}
        order = [f for f in frames if f in used]
        meta.append(dict(id=o["id"], label=o["label"], name=o["name"], role=o["role"], group=o["group"],
                         note=o["note"], base=o["base"], rest=o["rest"], frames=order,
                         beats=[[[f, ms] for f, ms in b] for b in o["beats"]],
                         **({"keys": o["keys"]} if o.get("keys") else {}),
                         **({"ring": o["ring"]} if o.get("ring") else {})))
    TS_OUT.parent.mkdir(parents=True, exist_ok=True)
    lines = ["// Generated by scripts/kyllm/favicon_anim_options.py. Do not edit.", "",
             'import type { FaviconRing } from "../../_brand/faviconControl";', "",
             "export type Option = {", "  id: string;", "  label: string;", "  name: string;",
             "  /** what the loop is for: Idle, Thinking, Answer ready, On return, Loop */",
             "  role: string;", '  group: "r6";', "  note: string;",
             "  /** the frame shown between beats */", "  base: string;",
             "  /** each beat is a list of [frame, hold in ms] */",
             "  beats: [string, number][][];", "  /** wait between beats: [min, extra random ms] */",
             "  rest: [number, number];", "  frames: string[];",
             "  /** the key poses to show as thumbnails, when not every frame */", "  keys?: string[];",
             "  /** Round 4: an idle loop that always plays, with beats that cut in and hand back */",
             "  ring?: FaviconRing;", "};", "",
             f"export const OPTIONS: Option[] = {json.dumps(meta, indent=2)};", "",
             "/** 32 px frames as data URIs, the size a tab icon uses on a 2x display. */",
             "export const FRAMES: Record<string, string> = {"]
    for name, b64 in data.items():
        lines.append(f'  "{name}": "data:image/png;base64,{b64}",')
    lines += ["};", ""]
    TS_OUT.write_text("\n".join(lines))
    print(f"{len(frames)} frames, {len(opts)} options, {TS_OUT.stat().st_size // 1024} KB module")
    write_shipped(meta, data)


if __name__ == "__main__":
    main()
