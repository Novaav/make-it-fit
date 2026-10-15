# Verified level specifications — 2026-10-15

Verification: deterministic exhaustive subset search plus memoized placement backtracking; all finite legal 90° rotations and in-bounds positions are explored for each candidate subset. Maximum optional count is globally exhaustive under the stated rules. Human enjoyment/difficulty is NOT verified. Weights are fictional game units, not real kg. Rotation index uses (x,y)->(y,-x) normalized, starting at base footprint. Coordinates are zero-based, x right, y down.

## Level 01
Board: 5 × 6 cells. Weight cap: none game units. Verified max optional: **0**. Example weight: **14**. Solver explored 7 cached states across candidate subsets.

| Item ID | Required | Weight | Base cells (x,y) |
|---|---|---:|---|
| `passport` | yes | 1 | `[(0, 0)]` |
| `shirt` | yes | 2 | `[(0, 0), (1, 0), (1, 1), (2, 0)]` |
| `jeans` | yes | 3 | `[(0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (5, 0)]` |
| `charger` | yes | 1 | `[(0, 0), (1, 0)]` |
| `toiletries` | yes | 3 | `[(0, 0), (0, 1), (1, 0), (1, 1)]` |
| `shoes` | yes | 4 | `[(0, 0), (0, 1), (1, 0), (2, 0), (2, 1)]` |

One independently checked legal placement example (id, orientation index, origin x, origin y):
```json
[["jeans", 1, 0, 0], ["shoes", 0, 1, 0], ["shirt", 0, 1, 2], ["toiletries", 0, 3, 3], ["charger", 0, 1, 4], ["passport", 0, 4, 0]]
```
Illustrative occupied cells; letters may coincide across different item names, so use exact placements above for machine truth.
```
J S S S P
J S · S ·
J S S S ·
J · S T T
J C C T T
J · · · ·
```

## Level 02
Board: 6 × 5 cells. Weight cap: 15 game units. Verified max optional: **2** (unique optimal pair: `ex_photo` + `extra_shoes`). Example weight: **15**. Solver explored 8 cached states across candidate subsets.

_Revised 2026-10-16 (owner-approved difficulty change from 7 × 6 / 16 units; reason: on the old board random placement solved the level ~100% of the time, so it was a pure weight puzzle with three equally good answers; the smaller board and 15-unit cap add spatial pressure and a single best optional pair). Re-verified with `verify_levels.py`._

| Item ID | Required | Weight | Base cells (x,y) |
|---|---|---:|---|
| `passport` | yes | 1 | `[(0, 0)]` |
| `charger` | yes | 1 | `[(0, 0), (1, 0)]` |
| `toiletries` | yes | 3 | `[(0, 0), (0, 1), (1, 0), (1, 1)]` |
| `outfit` | yes | 4 | `[(0, 0), (1, 0), (1, 1), (2, 0)]` |
| `dvd` | yes | 1 | `[(0, 0), (1, 0), (2, 0)]` |
| `disco_ball` | no | 4 | `[(0, 0), (0, 1), (1, 0), (1, 1)]` |
| `heels` | no | 4 | `[(0, 0), (0, 1), (1, 0), (2, 0), (2, 1)]` |
| `ex_photo` | no | 2 | `[(0, 0), (1, 0), (1, 1)]` |
| `extra_shoes` | no | 3 | `[(0, 0), (1, 0), (2, 0), (3, 0)]` |
| `hairdryer` | no | 5 | `[(0, 0), (1, 0), (1, 1), (1, 2), (2, 0)]` |

One independently checked legal placement example (id, orientation index, origin x, origin y):
```json
[["toiletries", 0, 0, 0], ["outfit", 0, 2, 0], ["extra_shoes", 0, 0, 2], ["dvd", 0, 0, 3], ["ex_photo", 0, 4, 1], ["charger", 0, 3, 3], ["passport", 0, 5, 0]]
```
Illustrative occupied cells; letters may coincide across different item names, so use exact placements above for machine truth.
```
T T O O O P
T T · O X X
E E E E · X
D D D C C ·
· · · · · ·
```

## Level 03
Board: 6 × 5 cells. Weight cap: 24 game units. Verified max optional: **2**. Example weight: **20**. Solver explored 8 cached states across candidate subsets.

| Item ID | Required | Weight | Base cells (x,y) |
|---|---|---:|---|
| `cutout` | yes | 7 | `[(0, 0), (1, 0), (1, 3), (2, 0), (2, 1), (2, 2), (2, 3), (3, 0), (3, 3), (4, 0)]` |
| `passport` | yes | 1 | `[(0, 0)]` |
| `outfit` | yes | 3 | `[(0, 0), (1, 0), (1, 1), (2, 0)]` |
| `charger` | yes | 1 | `[(0, 0), (1, 0)]` |
| `toiletries` | yes | 3 | `[(0, 0), (0, 1), (1, 0), (1, 1)]` |
| `hotel_lamp` | no | 4 | `[(0, 0), (1, 0), (1, 1), (1, 2)]` |
| `emergency_socks` | no | 1 | `[(0, 0), (1, 0)]` |
| `ceramic_foot` | no | 4 | `[(0, 0), (0, 1), (1, 0), (2, 0), (2, 1)]` |

One independently checked legal placement example (id, orientation index, origin x, origin y):
```json
[["cutout", 0, 0, 0], ["outfit", 0, 3, 1], ["toiletries", 0, 0, 1], ["hotel_lamp", 3, 2, 3], ["charger", 0, 0, 4], ["emergency_socks", 1, 5, 2], ["passport", 0, 5, 0]]
```
Illustrative occupied cells; letters may coincide across different item names, so use exact placements above for machine truth.
```
C C C C C P
T T C O O O
T T C · O E
· C C C H E
C C H H H ·
```

## Verified properties
- L1: all 6 required items pack; no-rotation variant is UNSAT because the jeans piece spans 6 columns while the bag is only 5 wide. Rotation is essential. This is a simple tutorial device, not proof of interesting human difficulty.
- L2: all 5 required items pack. Maximum **2 of 5** optional items; required total weight 10 and three lightest optional weights sum to 9, exceeding the 15-unit cap; with 5 units of headroom exactly one optional pair fits the weight cap (`ex_photo` 2 + `extra_shoes` 3) and it is also spatially feasible. All five optional items pass the area check individually, but the 6 × 5 board is tight enough that placement matters (random greedy placement of the required items plus that pair succeeds ≈ 80% of the time, vs ≈ 100% on the former 7 × 6 board).
- L3: all 5 required items including cutout pack. Maximum **2 of 3** optional items; all items have total weight 24 (at cap) but their combined area is 32 cells > 30, so all three cannot fit. Without the cutout, all 3 optional items fit. Spatial scarcity genuinely changes the optional optimum.
- These checks establish existence and maximum optional counts for *this rule set*. They do not establish compelling difficulty, legible art, accessibility, runtime performance of a future TS port, or real-world baggage feasibility.
- Before UI implementation, port the same fixtures into TS and use independent regression tests; ensure no silent shape changes.
