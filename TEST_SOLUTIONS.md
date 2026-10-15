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
  - **Fill required only** / **Fill max bonus** load the verified layouts below (each item is a separate Undo step), so you can check the completion card, weight meter and progress saving immediately.
  - Jump and Fill never save progress or unlock levels; **Clear saved progress** resets real unlocks, ✓ marks and best bonus counts.
  - Browser tests (`npm run test:e2e`) play Level 1 by dragging with exactly these coordinates.
- The panel and the solution data are not part of the production build (`npm run check:prod-clean` builds and verifies this).

## Level 1

- Board: 5 columns × 6 rows. No weight limit.
- Required items (6): Passport, Shirt, Jeans, Phone charger, Toiletries, Shoes.
- Optional items: none.
- **Required-only solution**: pack the 6 required items from the table (weight 14 kg).

| Item | Required | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|
| Jeans | yes | 3 | 1 | (0,0) | C |
| Shoes | yes | 4 | 0 | (1,0) | F |
| Shirt | yes | 2 | 0 | (1,2) | B |
| Toiletries | yes | 3 | 0 | (3,3) | E |
| Phone charger | yes | 1 | 0 | (1,4) | D |
| Passport | yes | 1 | 0 | (4,0) | A |

```
       0 1 2 3 4
row 0  C F F F A
row 1  C F . F .
row 2  C B B B .
row 3  C . B E E
row 4  C D D E E
row 5  C . . . .
```

## Level 2

- Board: 6 columns × 5 rows. Weight limit: 15 kg.
- Required items (5): Passport, Phone charger, Toiletries, Outfit, Educational DVD.
- Optional items (5): Disco ball, Heels, Photo of the ex, Extra shoes, Hairdryer.
- **Required-only solution**: pack the 5 required items from the table (weight 10 kg).
- **Maximum bonus solution**: all required items plus Extra shoes and Photo of the ex (2 of 5 optional; total weight 15 kg). This is the verified maximum for the level.

| Item | Required | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|
| Toiletries | yes | 3 | 0 | (0,0) | C |
| Outfit | yes | 4 | 0 | (2,0) | D |
| Extra shoes | **optional** | 3 | 0 | (0,2) | I |
| Educational DVD | yes | 1 | 0 | (0,3) | E |
| Photo of the ex | **optional** | 2 | 0 | (4,1) | H |
| Phone charger | yes | 1 | 0 | (3,3) | B |
| Passport | yes | 1 | 0 | (5,0) | A |

```
       0 1 2 3 4 5
row 0  C C D D D A
row 1  C C . D H H
row 2  I I I I . H
row 3  E E E B B .
row 4  . . . . . .
```

## Level 3

- Board: 6 columns × 5 rows. Weight limit: 24 kg.
- Required items (5): Cardboard cutout, Passport, Outfit, Phone charger, Toiletries.
- Optional items (3): Hotel lamp, Emergency socks, Ceramic foot.
- **Required-only solution**: pack the 5 required items from the table (weight 15 kg).
- **Maximum bonus solution**: all required items plus Hotel lamp and Emergency socks (2 of 3 optional; total weight 20 kg). This is the verified maximum for the level.

| Item | Required | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|
| Cardboard cutout | yes | 7 | 0 | (0,0) | A |
| Outfit | yes | 3 | 0 | (3,1) | C |
| Toiletries | yes | 3 | 0 | (0,1) | E |
| Hotel lamp | **optional** | 4 | 3 | (2,3) | F |
| Phone charger | yes | 1 | 0 | (0,4) | D |
| Emergency socks | **optional** | 1 | 1 | (5,2) | G |
| Passport | yes | 1 | 0 | (5,0) | B |

```
       0 1 2 3 4 5
row 0  A A A A A B
row 1  E E A C C C
row 2  E E A . C G
row 3  . A A A F G
row 4  D D F F F .
```
