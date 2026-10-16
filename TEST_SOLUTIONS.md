# TEST_SOLUTIONS — verified layouts for all levels

_Generated from `VERIFIED_LEVELS.json` and `src/engine/solutions.fixture.json`; every layout below was replayed through the TypeScript engine (`place` + `isWon`) while generating this file, and `src/dev/solutionsDoc.test.ts` fails if this file drifts from the engine. Do not edit by hand._

## Conventions

- **Position `(column,row)`**: board cell of the item's **top-left corner after rotation**; the **top-left cell of the suitcase is `(0,0)`**, columns grow to the right, rows grow downward.
- **Rotation**: number of times to press **Rotate** (or `R`) on the item, starting from its tray orientation. Each press turns it 90° counter-clockwise on screen. `0` = as shown in the tray at the start.
- To place by mouse/touch: drag so the item's top-left cell lands on the position (the item snaps to the grid; the green footprint confirms it). By keyboard: pick up with Enter, move with arrows, Enter to place; the status line announces the column/row after placing.
- Each grid below shows letters for packed items and `.` for empty cells.

## Quick testing without replaying earlier levels

- Run `npm run dev`. A **Dev tools** panel appears at the bottom-left of the page (development server only):
  - **Jump L1 / L2 / L3** opens any level regardless of progress.
  - **Fill required only** / **Fill max bonus** load the verified layouts below (each item is a separate Undo step), so you can check the completion card, allowance meter and progress saving immediately.
  - Jump and Fill never save progress or unlock levels; **Clear saved progress** resets real unlocks, ✓ marks and best bonus counts.
  - Browser tests (`npm run test:e2e`) play Level 1 by dragging with exactly these coordinates.
- The panel and the solution data are not part of the production build (`npm run check:prod-clean` builds and verifies this).

## Level 1 — Pack Like a Grown-Up

- Board: 5 columns × 6 rows. No weight allowance (this level teaches fitting and rotation only).
- Required items (5): T-shirt, Jeans, Sneakers, Toiletries, Laptop charger.
- Optional items: none.
- **Required-only solution**: pack the 5 required items from the table (weight 3.55 kg).

| Item | Required | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|
| Jeans | yes | 0.7 kg | 1 | (0,0) | B |
| Sneakers | yes | 1.2 kg | 0 | (1,0) | C |
| T-shirt | yes | 0.25 kg | 0 | (1,2) | A |
| Toiletries | yes | 1 kg | 0 | (3,3) | D |
| Laptop charger | yes | 0.4 kg | 0 | (1,4) | E |

```
       0 1 2 3 4
row 0  B C C C .
row 1  B C . C .
row 2  B A A A .
row 3  B . A D D
row 4  B E E D D
row 5  B . . . .
```

## Level 2 — Carry-On, Questionable Decisions

- Board: 6 columns × 5 rows. Packing allowance: 7 kg (a total equal to the allowance succeeds).
- Required items (4): Party outfit, Toiletries, Red-soled heels, Pocket massager.
- Optional items (6): Party speaker, Disco ball, Framed photo of the ex, Inflatable flamingo, Feather boa, Ring light and tripod.
- **Required-only solution**: pack the 4 required items from the table (weight 3.6 kg).
- **Maximum bonus solution**: all required items plus Disco ball and Feather boa and Party speaker (bonus 3 of 3, the "Maximum bonus" tier; total weight 6.9 kg). This is the verified maximum for the level; other sets can reach it too.

| Item | Required | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|
| Red-soled heels | yes | 1.3 kg | 0 | (0,0) | C |
| Party outfit | yes | 0.9 kg | 0 | (3,0) | A |
| Toiletries | yes | 1 kg | 0 | (0,2) | B |
| Disco ball | **optional** | 1.5 kg | 0 | (2,2) | F |
| Feather boa | **optional** | 0.3 kg | 0 | (0,4) | I |
| Pocket massager | yes | 0.4 kg | 1 | (5,1) | D |
| Party speaker | **optional** | 1.5 kg | 0 | (4,4) | E |

```
       0 1 2 3 4 5
row 0  C C C A A A
row 1  C . C . A D
row 2  B B F F . D
row 3  B B F F . D
row 4  I I I I E E
```

## Level 3 — Excess Baggage

- Board: 8 columns × 6 rows. Packing allowance: 23 kg (a total equal to the allowance succeeds).
- Required items (5): Cardboard cutout, Laundry bag, Party outfit, Hangover kit, Red-soled heels.
- Optional items (7): Hotel lamp, Ceramic foot, Concrete garden gnome, Wheel of cheese, Bottle of local spirit, Hotel bathrobe, Emergency socks.
- **Required-only solution**: pack the 5 required items from the table (weight 12 kg).
- **Maximum bonus solution**: all required items plus Ceramic foot and Hotel bathrobe and Hotel lamp and Bottle of local spirit and Emergency socks (bonus 5 of 5, the "Perfect pack" tier; total weight 21.75 kg). This is the verified maximum for the level; other sets can reach it too.

| Item | Required | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|
| Cardboard cutout | yes | 4 kg | 0 | (0,0) | A |
| Laundry bag | yes | 5 kg | 0 | (5,0) | B |
| Red-soled heels | yes | 1.3 kg | 0 | (5,2) | E |
| Ceramic foot | **optional** | 3.2 kg | 1 | (0,2) | G |
| Hotel bathrobe | **optional** | 1.3 kg | 2 | (3,3) | K |
| Party outfit | yes | 0.9 kg | 2 | (5,3) | C |
| Hangover kit | yes | 0.8 kg | 0 | (3,1) | D |
| Hotel lamp | **optional** | 3.6 kg | 3 | (0,4) | F |
| Bottle of local spirit | **optional** | 1.5 kg | 0 | (5,5) | J |
| Emergency socks | **optional** | 0.15 kg | 0 | (0,1) | L |

```
       0 1 2 3 4 5 6 7
row 0  A A A A A B B B
row 1  L L A D D B B B
row 2  G G A D D E E E
row 3  G A A A K E C E
row 4  G G F K K C C C
row 5  F F F K K J J J
```
