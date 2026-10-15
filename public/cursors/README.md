# Site cursor

`pointer.svg` (and its `@2x` twin for retina) is the site-wide cursor, set in
`app/globals.css`: the line-icon pointer from the site's icon set, in coral
with a paper edge and a very subtle shadow, turned 22.5° so it points at the
native arrow's angle, and 15% larger. The tip (the click point) sits at
(3, 3) on the 28px canvas, which is the hotspot in the CSS.

`pointer-hand.svg` (+ `@2x`) is the Phosphor "hand-pointing" icon (fill
weight, MIT) in the same coral and paper edge, shown over links, buttons, and
anything marked `data-clickable`. It sits on a 30px canvas with the fingertip
at (12, 4).

The redesign draws its own animated cursor instead (`app/_brand/Cursor.tsx`).
It is one coral shape that melts between states: the arrow, the hand over
anything clickable, an I-beam over text fields and selectable text, a prohibit
sign over disabled controls (`:disabled`, `aria-disabled`, `data-blocked`), and
the site's chevron loader with a verb while something is busy (`aria-busy`,
`data-busy`). Every state is chosen from the element's own attributes. All
states are on `/samples/cursor-states`.

The options it was picked from live at `/samples/rework/cursor`.
