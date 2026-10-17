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
  - **Fill normal win** / **Fill perfect pack** load the verified layouts below (each item is a separate Undo step), so you can check the completion card, meters and progress saving immediately.
  - Jump and Fill never save progress or unlock levels; **Clear saved progress** resets real unlocks, ✓ marks and best Chaos scores.
  - Browser tests (`npm run test:e2e`) play Level 1 by dragging with exactly these coordinates.
- The panel and the solution data are not part of the production build (`npm run check:prod-clean` builds and verifies this).

## Level 1 — Pack Like a Grown-Up

- Board: 5 columns × 6 rows. No weight allowance (this level teaches fitting and rotation only).
- Every item is mandatory: T-shirt, Jeans, Sneakers, Toiletries, Laptop charger.

### Solution; total weight 3.55 kg

| Item | Mandatory | Chaos | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|---|
| Jeans | yes |  | 700 g | 1 | (0,0) | B |
| Sneakers | yes |  | 1.2 kg | 0 | (1,0) | C |
| T-shirt | yes |  | 250 g | 0 | (1,2) | A |
| Toiletries | yes |  | 1 kg | 0 | (3,3) | D |
| Laptop charger | yes |  | 400 g | 0 | (1,4) | E |

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

- Board: 6 columns × 5 rows. Packing allowance: 6.5 kg (a total equal to the allowance succeeds).
- Chaos: win at 20, perfect pack at 25. Nothing is mandatory: any items may be packed.
- Items (Chaos, weight): Louis Regretton handbag (6, 2.25 kg); Party outfit (2, 900 g); Toiletries (1, 1 kg); Inflatable flamingo (5, 1 kg); Pocket massager (3, 400 g); Framed photo of the ex (3, 1 kg); Feather boa (3, 300 g); Ring light and tripod (2, 800 g); Disco ball (4, 1.5 kg); Mom's Porn Collection (6, 1.5 kg).

### Normal win (a pack of the most chaotic items that fit): Chaos 21 of the 20 needed; total weight 6.25 kg

| Item | Mandatory | Chaos | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|---|
| Louis Regretton handbag |  | 6 | 2.25 kg | 0 | (0,0) | A |
| Inflatable flamingo |  | 5 | 1 kg | 0 | (3,0) | D |
| Mom's Porn Collection |  | 6 | 1.5 kg | 0 | (3,2) | J |
| Disco ball |  | 4 | 1.5 kg | 0 | (0,3) | I |

```
       0 1 2 3 4 5
row 0  . A . D D D
row 1  A A A D D D
row 2  A A A J J .
row 3  I I . J J .
row 4  I I . J . .
```

### Perfect pack: Chaos 25, the maximum; total weight 6.35 kg

| Item | Mandatory | Chaos | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|---|
| Louis Regretton handbag |  | 6 | 2.25 kg | 0 | (0,0) | A |
| Inflatable flamingo |  | 5 | 1 kg | 0 | (0,3) | D |
| Mom's Porn Collection |  | 6 | 1.5 kg | 0 | (3,1) | J |
| Party outfit |  | 2 | 900 g | 2 | (3,3) | B |
| Feather boa |  | 3 | 300 g | 0 | (2,0) | G |
| Pocket massager |  | 3 | 400 g | 1 | (5,1) | E |

```
       0 1 2 3 4 5
row 0  . A G G G G
row 1  A A A J J E
row 2  A A A J J E
row 3  D D D J B E
row 4  D D D B B B
```

## Level 3 — Excess Baggage

- Board: 7 columns × 6 rows. Packing allowance: 20.5 kg (a total equal to the allowance succeeds).
- Chaos: win at 24, perfect pack at 29. Mandatory: Hotel Painting, Laundry bag.
- Items (Chaos, weight): Hotel Painting (mandatory, 4 kg); Laundry bag (mandatory, 5 kg); Party outfit (2, 900 g); Hangover kit (3, 800 g); Overpriced Heels (3, 1.3 kg); Hotel lamp (3, 3.6 kg); Marble foot (7, 3.6 kg); Garden gnome (9, 6.5 kg); Wheel of cheese (5, 2.8 kg); Badcardi Rum (5, 1.5 kg); Bathrobe (4, 1.3 kg); Socks (3, 150 g).

### Normal win (a pack of the most chaotic items that fit): Chaos 24 of the 24 needed; total weight 17.25 kg

| Item | Mandatory | Chaos | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|---|
| Hotel Painting | yes | 0 | 4 kg | 0 | (0,0) | A |
| Laundry bag | yes | 0 | 5 kg | 0 | (3,0) | B |
| Marble foot |  | 7 | 3.6 kg | 0 | (3,2) | G |
| Bathrobe |  | 4 | 1.3 kg | 0 | (0,3) | K |
| Party outfit |  | 2 | 900 g | 0 | (2,4) | C |
| Hangover kit |  | 3 | 800 g | 0 | (5,4) | D |
| Badcardi Rum |  | 5 | 1.5 kg | 1 | (6,0) | J |
| Socks |  | 3 | 150 g | 0 | (1,5) | L |

```
       0 1 2 3 4 5 6
row 0  A A A B B B J
row 1  A A A B B B J
row 2  A A A G G G J
row 3  K K . G . G .
row 4  K K C C C D D
row 5  K L L C . D D
```

### Perfect pack: Chaos 29, the maximum; total weight 20.05 kg

| Item | Mandatory | Chaos | Weight | Rotation (presses) | Position (column,row) | Letter |
|---|---|---|---|---|---|---|
| Hotel Painting | yes | 0 | 4 kg | 0 | (0,0) | A |
| Laundry bag | yes | 0 | 5 kg | 0 | (3,0) | B |
| Marble foot |  | 7 | 3.6 kg | 0 | (0,3) | G |
| Bathrobe |  | 4 | 1.3 kg | 1 | (4,2) | K |
| Party outfit |  | 2 | 900 g | 2 | (0,4) | C |
| Hangover kit |  | 3 | 800 g | 0 | (3,4) | D |
| Wheel of cheese |  | 5 | 2.8 kg | 0 | (5,4) | I |
| Badcardi Rum |  | 5 | 1.5 kg | 1 | (6,0) | J |
| Socks |  | 3 | 150 g | 1 | (3,2) | L |

```
       0 1 2 3 4 5 6
row 0  A A A B B B J
row 1  A A A B B B J
row 2  A A A L K K J
row 3  G G G L K K K
row 4  G C G D D I I
row 5  C C C D D I I
```
