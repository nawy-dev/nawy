# Nawy identity - specification (primary: the one-colour noon grid)

Master tile T = 512. phi = 1.6180339887. Everything in `brand/svg/` and every shipped icon is drawn by `brand/make-derived-icons.py` from one geometry; do not edit the SVGs by hand.

## The mark

- A 3x3 grid of sharp-cornered squares with no gaps and no ghost squares. Six squares are lit: one at top-centre (the dot) and the left, centre and right squares of the bottom row plus the left and right squares of the middle row. The centre of the grid stays empty.
- Mark width = T / phi = 316.4 (cell 105.5), centred. Tile corner radius = T / phi^3 = 120.9.
- One colour only. Two pairings: white on black (primary, `#FFFFFF` on `#000000`) and black on white (`-light` files).
- No gradients, outlines or shadows; do not recolour single squares; do not rotate or re-space the grid. Clear space: at least one cell on every side.

## Safe zones (nothing may be cut off)

- Maskable (`app-icon-maskable.svg`, `maskable-icon.png`): full-bleed square; the smallest circle around the six squares is centred on the tile and has radius 0.37 T, inside the 0.40 T safe circle of the W3C maskable spec. The mark width is 0.584 T, and it sits a third of a cell higher than the plain mark because the bottom corners are the farthest points.
- Monochrome (Android themed icon, `monochrome-icon.png`): black cells on transparent, enclosing circle 0.33 T so the launcher's adaptive crop cannot cut it.
- Plain `any` icons (`icon-192/512`): rounded tile with the mark at 1/phi, margins of 19% on every side. `apple-touch-icon.png` (180) is the same on a square opaque tile, because iOS applies its own mask.
- Up to 48 px (`favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico`) use the larger mark, 0.74 T.

## Files

- `svg/app-icon.svg`, `app-icon-square.svg`, `app-icon-maskable.svg`, `app-icon-small.svg` (white on black) and the same four with `-light` (black on white).
- `svg/mark-white.svg`, `svg/mark-ink.svg` (no tile), `svg/monochrome-icon.svg`, `svg/notification-badge.svg` (white cells, grid 0.8 T).
- `favicon.svg` is generated into the repo root: black tile on light browser themes, white tile on dark ones (`prefers-color-scheme`).
- `brand/light/` holds the black-on-white 512 and maskable PNGs; they are not published.

## Shipped files (repo root)

`icon-192.png`, `icon-512.png`, `maskable-icon.png`, `apple-touch-icon.png`, `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon.svg`, `monochrome-icon.png`, `notification-badge.png`. Regenerate with `python3 brand/make-derived-icons.py` (needs Pillow).
