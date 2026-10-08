"""Generates a new KYLLM pose from the master render, so every image stays on model.

    python3 generate.py <name> "<what changes>"
    python3 generate.py blink "eyes closed as short, gently curved black arcs"

The master goes in as the first reference image and the prompt asks for one
change only. Output: poses/<name>.png at 1024x1024 on the same off-white.
Needs OPENAI_API_KEY in the environment, or the key in
~/Desktop/servoplatform/servo-backend/.env.
"""
import base64
import os
import sys
from pathlib import Path

from openai import OpenAI

HERE = Path(__file__).parent

CANON = (
    "The first image is KYLLM, the ground-truth character. Reproduce it exactly: same soft 3D matte render, same camera, "
    "same three-quarter view facing slightly right and framing, same lighting and soft contact shadow, same off-white #faf9f7 backdrop. "
    "Body: one soft, slightly squashed bean-shaped blob in brand coral #f5482d with two short rounded-triangle cat ears on top, the same size as each other, same coral, no inner-ear colour. "
    "One sage-green #7fb99a leaf rising from the top of the head between the ears, leaning back to the left at about 40 degrees, no stem, nearly the whole leaf visible, only its bottom tip going a little way into the head, a small soft contact shadow on the coral under it, the head surface around it perfectly smooth with no crease, fold, rim, or dimple. "
    "Oversized thick round black glasses, bigger than the face; the two lenses sit about one rim-width apart, joined by a short thick bridge; the right lens hangs past the body's edge, a short temple arm sticks out on the left. "
    "Small black vertical capsule eyes, one in each lens. No nose, no mouth, no whiskers, no tail, no paws, no text. "
    "The other reference images show the render quality to match (OpenAI dots, Grok Bot); do not copy their shapes or colors. "
)


def api_key() -> str:
    if os.environ.get("OPENAI_API_KEY"):
        return os.environ["OPENAI_API_KEY"]
    env = Path.home() / "Desktop/servoplatform/servo-backend/.env"
    return next(l.split("=", 1)[1].strip().strip("\"'") for l in env.read_text().splitlines() if l.startswith("OPENAI_API_KEY="))


def main(name: str, change: str) -> None:
    # The style references are third-party images kept out of the repo; use them when present.
    refs = [HERE / "master.png"] + [p for p in (HERE / "ref-dots.png", HERE / "ref-grok.png") if p.exists()]
    files = [open(p, "rb") for p in refs]
    try:
        r = OpenAI(api_key=api_key()).images.edit(
            model="gpt-image-2.5-sunburst", image=files, size="1024x1024", quality="high",
            prompt=CANON + f"Change ONLY this, keep everything else identical: {change}",
        )
    finally:
        for f in files:
            f.close()
    out = HERE / "poses" / f"{name}.png"
    out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(r.data[0].b64_json))
    print("wrote", out.relative_to(HERE))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
