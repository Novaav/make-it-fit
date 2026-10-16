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
