# Brand marks

The site icon is Kyle's portrait screened in coral: `app/icon.png`,
`app/apple-icon.png` and `app/favicon.ico`, all produced by
`scripts/hero/build-icon.sh`.

| File | What it is |
|---|---|
| `icon-coral-512.png` | the shipping mark at 512, for anywhere outside `app/` |
| `icon-bw-512.png` | the same mark in the site's neutral ramp, kept as the alternate |

Both come from one call, so neither drifts from the other:

    ./scripts/hero/build-icon.sh                  # coral, writes into app/
    PALETTE=ink4 ./scripts/hero/build-icon.sh     # the black and white variant

`LIFT` controls how far the background falls away behind him; it ships at 0.55.
