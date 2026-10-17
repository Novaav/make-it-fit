/**
 * Reference layout used by the browser tests (same data as TEST_SOLUTIONS.md, Level 1).
 * `src/dev/e2eSolutions.test.ts` fails if this drifts from the engine-verified fixture.
 * `rotations` = presses of Rotate/R; (col,row) = top-left board cell after rotation.
 */
export interface Step {
  id: string
  rotations: number
  col: number
  row: number
}

export const LEVEL1: Step[] = [
  { id: 'jeans', rotations: 1, col: 0, row: 0 },
  { id: 'shoes', rotations: 0, col: 1, row: 0 },
  { id: 'shirt', rotations: 0, col: 1, row: 2 },
  { id: 'toiletries', rotations: 0, col: 3, row: 3 },
  { id: 'charger', rotations: 0, col: 1, row: 4 },
]

/** Level 2 normal win (21 Chaos at 6.25 kg), same data as TEST_SOLUTIONS.md. */
export const LEVEL2_NORMAL: Step[] = [
  { id: 'handbag', rotations: 0, col: 0, row: 0 },
  { id: 'flamingo', rotations: 0, col: 3, row: 0 },
  { id: 'dvds', rotations: 0, col: 3, row: 2 },
  { id: 'disco_ball', rotations: 0, col: 0, row: 3 },
]

/**
 * Level 2 perfect pack (25 Chaos at 6.35 kg), same data as TEST_SOLUTIONS.md, listed in an order that stays below the
 * 20-Chaos target until the very last item (so a test reaches the perfect pack directly, with no normal win on the way).
 */
export const LEVEL2_PERFECT: Step[] = [
  { id: 'outfit', rotations: 2, col: 3, row: 3 },
  { id: 'boa', rotations: 0, col: 2, row: 0 },
  { id: 'vibrator', rotations: 1, col: 5, row: 1 },
  { id: 'flamingo', rotations: 0, col: 0, row: 3 },
  { id: 'handbag', rotations: 0, col: 0, row: 0 },
  { id: 'dvds', rotations: 0, col: 3, row: 1 },
]
