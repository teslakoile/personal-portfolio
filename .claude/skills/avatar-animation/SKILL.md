---
name: avatar-animation
description: Animate the KYLLM mascot or any small avatar, tab icon, or favicon. Idle loops, bounces, blinks, eyes, glints, frame budgets, tab-icon runtime. Read before changing scripts/kyllm motion, app/_brand/AnimatedFavicon.tsx, faviconFrames.ts, or the favicon-kyllm-anim page.
---

# Avatar animation

How the KYLLM tab icon moves, why, and how to change it without redoing the rounds that got it here. The shipped loop is a strict 3.000 s idle with one bounce per cycle. It supersedes every other idle animation in the repo (the rig idle on `claude/kyllm-review`, `app/samples/kyllm-ui/rig`): when two idles conflict, this one wins, and the other adopts its timing, blink, and eye rules.

## Workflow

1. Add the change as an opt-in option in `scripts/kyllm/favicon_snappy.py` (a `Snappy` field, so existing frames stay byte-identical).
2. Run `python3 scripts/kyllm/favicon_anim_options.py` from `scripts/kyllm`. It writes the options page data and the shipped module.
3. Show it on `/samples/favicon-kyllm-anim` (dev server on port 3120, `next dev --webpack`) as a card, first in its section, with screenshots or a GIF in the reply.
4. Ship only after Kyle names the card: point `SHIP_ID` at it, regenerate, then run both checks below.

Kyle judges feel in his own tab strip, so say what you verified (frames, numbers, headless run) and what only his tab can show.

## The motion

**Moving hold.** The cat holds its pose and does small quick things; it never drifts. A slow smooth sine reads as slow motion, and a long still stretch reads as dead. Between bounces: a slow breath bed (period divides the loop, amplitude about 0.5 px at 32 px), a quick breath pop (fast in, slow out), one leaf flick that rings down at the leaf's own frequency. Everything else holds.

**The bounce** is squash and stretch about the body's bottom pivot, which sits below the circle edge. Vertical strain follows a damped spring (2.5 Hz, damping 0.16) under a smooth crouch and push command, width is 1 / height so area is preserved, the leaf is a second, slower spring driven by its base's acceleration, and the glint is timed from the first stretch peak. Anticipation (crouch), overshoot, then settle: five visible extremes, about 1.8 s.

**The face moves with the bounce, in one script every time:**

| Phase | Eyes |
|---|---|
| Crouch | Squint to 0.75 openness at most (an expression, never a blink); pupils drop a little |
| Stretch | Pupils lift and hold through the glint |
| After the glint | One blink, 0.12 s later |
| Settle | Pupils ease back toward the middle |

**Eyes.**
- A glance travels in 180 ms with a minimum-jerk ease. A 40 ms jump reads as teleporting.
- Pupils keep 15 flat px (about 0.5 px at 32 px) from the lens rim, measured by `rim_gap` on the real lens openings; `safe_gaze` pulls a target back along the line to rest. At rest the tightest side has 22.8 flat px, so the room is about 1 px each way.
- The shipped loop has no idle glances. Eyes move only inside the bounce, and by little (gaze scale 0.6).

**One blink everywhere:** half 33 ms, closed 67 ms (two ticks, so one dropped repaint cannot erase it), half 33 ms. It is the single `BLINK` definition in `favicon_snappy.py`; an idle blink inside a bounce is replaced by the bounce's own.

**Strict rhythm.** One bounce every 3.000 s, no range and no randomness. Every period in the idle (bed, breath, flick) divides 3 s, and the 6 s ring is the same 3 s twice with a start at 0.6 s and 3.6 s, so both bounces find the same state and play frame for frame the same.

## Budgets

- Time runs on a 30 fps tick (33 ms). A frame holds 33 ms while anything visible changes, up to 133 ms where only the bed moves.
- No frame-to-frame move over 2 px at 32 px (aim under 1.5), every joint (ring seam, idle into bounce, bounce back to ring) under 0.5 px, and a bounce's first frame equals its ring frame.
- Beats are re-integrated from the idle state at their start, so there is no mode switch; the ring resumes at the matching index.
- Frames are 32 px data URIs, 64-colour palette shared by the loop and computed from the shipped loop's own frames. Payload today: about 110 KB, loaded after hydration by dynamic import. At 16 px a move under 0.5 px is invisible, so amplitude is judged at 16 px.
- Poses are SVG transforms of `public/kyllm/kyllm-flat.svg` (scale, rotate, leaf rotation, eye ovals, a glint overlay). The mascot is never redrawn and the body is never translated inside the circle: that reads as sliding in a porthole.

## Runtime

`app/_brand/AnimatedFavicon.tsx` plays `FAVICON_RING` from `faviconFrames.ts` and takes overrides from `faviconControl.ts` (`setFaviconAnimation`, used by the page's Try in My Tab).

- A worker drives the timers, so a hidden tab keeps its 33 ms frames (main-thread timers fall to one per second). A tab hidden for two minutes settles to the static icon and resumes on return.
- Reduced motion keeps the static icon (`app/icon.png`, same as the first frame).
- Next's own `<link rel="icon">` nodes are React-owned: rename their `rel` in place and let an observer do the same to late arrivals. Detaching them throws on soft navigation.
- A frame swap replaces the managed `<link>`; Chrome fetched every swap up to 200 per second in testing.

## Check before calling it done

```bash
node --experimental-strip-types scripts/kyllm/check-favicon-rhythm.mjs
node scripts/kyllm/check-favicon-runtime.mjs http://localhost:3120
npx eslint app/_brand app/samples/favicon-kyllm-anim && npx tsc --noEmit && npm run build
```

Healthy: every gap exactly 3000 ms; about 20 swaps a second, one active icon link, no console errors, 0 swaps with reduced motion. For a hidden tab, open the page in a real Chrome tab, switch away, and compare swap gaps with a plain 100 ms timer in the same page (that one runs at 1000 ms).

## Rejected, with why

| Tried | Why it went |
|---|---|
| Hop (translate up inside the circle) | Reads as sliding in a window |
| Slow sine drift as the idle | Reads as slow motion |
| 40 ms eye jumps | Reads as teleporting |
| Pupils up to the rim | Blend into the glasses |
| Different blink timings in idle and bounce | Reads as two blinks; one definition now |
| Animating only while the tab is visible | The icon is seen most from another tab |
| A range of gaps (2 to 4 s, random starts) | Face and bounce stop lining up; strict 3 s chosen |
| Idle glances in the shipped loop | Eyes move too much; the face script is enough |
| Ring loader, notify dot, wink, eye orbit as states | Parked until a chat state needs them |

## Gotchas

- Changing the palette's frame set moves every frame's colours: keep the shipped loop's palette from its own frames.
- `RING_S` is 6 s module-wide; a new loop length needs its periods to divide it.
- The earlier rounds (hop, jelly, leaf wave, the state ideas) were removed before this merged, so they are in no commit. Rebuild from this file's rules; do not look for them in history.
