# KYLLM

KYLLM is the site's chat agent. This folder holds its character: one master render, the rules every other image follows, and the scripts that make the site assets.

## Ground truth

`master.png` is the baseline: the bean cat with a leaf, picked on 2026-10-05. It replaced the orange, which is kept in `archive/orange/`. Every pose, size, and crop starts from it. Don't redraw it by hand (hand-drawn SVG versions were rejected) and don't regenerate it from text alone.

| Part | Rule |
|---|---|
| Body | One soft, slightly squashed bean-shaped blob in brand coral `#f5482d` |
| Ears | Two short rounded-triangle cat ears, one each side of the leaf, the same size as each other, same coral, no inner-ear colour |
| Render | Soft 3D, matte, even studio light, soft contact shadow, no outlines |
| View | Three-quarter, facing slightly right of camera, toward the chat |
| Leaf | One sage-green `#7fb99a` leaf rising from the top of the head between the ears, leaning back to the left at about 40 degrees; no stem; nearly the whole leaf is visible: only its bottom tip goes a little way into the head, with a small, soft contact shadow on the coral under it; the head surface around it stays smooth, with no crease, fold, rim, or dimple |
| Glasses | Oversized, thick, round, black; bigger than the face; the two lenses sit about one rim-width apart, joined by a short thick bridge; the right lens hangs past the body's edge; a short temple arm on the left |
| Eyes | Small black vertical capsules, one per lens |
| Never | Mouth, nose, whiskers, tail, paws, text, a second accessory, or any color outside the list above |

The style references are `ref-dots.png` (OpenAI dots, "Alfred") for the render and the glasses, and `ref-grok.png` (Grok Bot) for the minimal face. They set the quality bar only; KYLLM copies neither shape nor color. They are other companies' images, so they stay out of the repo (see `.gitignore`); `generate.py` uses them when they are present locally and works from `master.png` alone otherwise.

## Site assets

```bash
uv run --with pillow --with numpy python build_kyllm.py
```

This cuts the character out of `master.png` using `master-matte.png` and writes to `public/kyllm/`:

- `kyllm.png`: 1024px, transparent, square with even padding.
- `kyllm-512.webp`, `kyllm-256.webp`, `kyllm-96.webp`, and `kyllm-56.webp`: the same at display sizes. Use 56 for a 28px avatar on Retina.

`master-matte.png` comes from rembg `birefnet-general-lite`. To redo it:

```bash
uv run --with rembg --with onnxruntime --with pillow python -c "from rembg import remove, new_session; from PIL import Image; remove(Image.open('master.png').convert('RGB'), session=new_session('birefnet-general-lite'), only_mask=True).save('master-matte.png')"
```

The render holds up at 28px and above. At 16 to 20px the glasses blur into the eyes.

## Flat version and avatar

```bash
uv run --with pillow --with numpy python flatten.py
uv run --with scikit-image --with scipy --with pillow --with numpy python vectorize.py
uv run --with pillow --with numpy python avatar.py
```

The site uses a flat KYLLM in brand colors. It's built in three steps, and none of them draws by hand:

1. `flatten.py` labels each pixel of `master.png` as body, leaf, or ink by color, and writes the part map to `labels.png`.
2. `vectorize.py` fits a clean shape to each part and writes `flat.svg` (crisp at any size) and `flat.png` (1024px, transparent). The master already faces right, so nothing is mirrored.
3. `avatar.py` writes the site files to `public/kyllm/`: `kyllm-flat.svg` and `.png`, `kyllm-avatar.svg`, and `kyllm-avatar-{56,72,96,192}.png` and `.webp` (2x for 28, 36, 48, and 96px).

| Part | Shape fitted | Color |
|---|---|---|
| Body | Rebuilt from the traced silhouette as one smooth bean (a low-order radial curve fitted to the body without its ears) with two ears rising out of it (each the convex hull of what the trace has above the bean, tip rounded) and soft fillets where they meet. The render's nearly flat bottom (it sits on the floor) is eased rounder: `BELLY` pushes the bottom out by up to 24px, most at the centre (`BELLY_P` 6 keeps the sides as they are). A light spline through the result keeps the curvature continuous, so there are no kinks, flats, or bevels. Inside the lens that hangs past the edge, the backdrop stays open | coral `#f5482d` |
| Leaf | Leaf shape fitted to the whole leaf: soft points at both ends, widest at the middle, a gentle bow. Drawn over the body; its lower tip overlaps the head, and the head's edge under it is interpolated from either side. `LEAF_*` in `vectorize.py` hold the small refinements on top of the fit (90% width, 5% bow, base nudged 22px left toward the center between the ears) | sage `--b2` `#7fb99a` |
| Lenses | Ellipses fitted to each opening, one rim width for both | ink `#1c1917` |
| Bridge | Rounded bar between the rims, its width measured from the master | ink `#1c1917` |
| Temple arm | Rounded bar, its inner end run into the rim | ink `#1c1917` |
| Eyes | Ovals with each eye's own moments | ink `#1c1917` |
| Avatar background | Circle | sky `#d6e4f0`, a light tint of `--b3` `#86a9c8` |

The avatar's circle is 1.15 times the character's width, with the glasses' center 60% of the way down. That leaves room above the leaf and crops the lower body out through the bottom. `avatar.py` then shifts the character left until the hanging lens clears the circle's edge by 8% of the diameter, so the glasses are never cut off and have room on the right. `NUDGE` then moves it 3% of the diameter further left and down. To try another circle color, set `AVATAR_BG` (for example `AVATAR_BG="#b7cde2"`) when you run `avatar.py`.

## New poses

```bash
python3 generate.py blink "eyes closed as short, gently curved black arcs"
```

`generate.py` sends `master.png` as the first reference and asks for one change only, so the body, glasses, and camera stay put. Output lands in `poses/`. Change one thing per pose: the eyes, the glasses' position, the ears, or the leaf. Reject any pose that moves the camera, recolors the body, or reshapes the glasses.

Each pose still drifts slightly in body shape and glasses size, which is fine for a still but jumps when frames swap in an animation. For animated states such as the blink, paste only the changed region (the eyes) from the pose onto `master.png` with a feathered mask.

Planned poses, by chat state:

| Pose | Change | Chat state |
|---|---|---|
| Blink | Eyes as short closed arcs | Every few seconds |
| Thinking | Eyes look up | Before the first word |
| Reading | Eyes look down, soft glint on the lenses | Reading a source |
| Answered | Happy upside-down U eyes, ears perked up | Answer finished |
| Curious | Glasses slid down, eyes peeking over | Asking to clarify |
| Can't answer | Eyes as downward arcs, ears flat | Off-topic question |

## Without API credits

If the OpenAI key has no credits, generate through the Codex CLI's built-in image tool instead. Pass `-m`, because the config default model is rejected for a ChatGPT-account login:

```bash
codex exec --skip-git-repo-check -m gpt-5.6-sol -s workspace-write -i master.png - < prompt.txt
```

Ask it to "use your built-in image generation tool" and to save the result to a path in the prompt. `master.png` itself was made this way from the concept sheet in `design-explorations/2026-10-kyllm-avatar/16-other-characters.png`.
