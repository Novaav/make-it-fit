import type { Cell, Orientation, Shape } from './types'

const compare = (a: Cell, b: Cell) => a.x - b.x || a.y - b.y

/** Translate to a (0,0) minimum corner and sort. Does not mutate the input. */
export function normalize(cells: readonly Cell[]): Shape {
  const minX = Math.min(...cells.map((c) => c.x))
  const minY = Math.min(...cells.map((c) => c.y))
  return cells.map((c) => ({ x: c.x - minX, y: c.y - minY })).sort(compare)
}

/** One 90-degree turn: (x, y) -> (y, -x), re-normalized. */
export function rotateOnce(shape: Shape): Shape {
  return normalize(shape.map((c) => ({ x: c.y, y: -c.x })))
}

export function rotate(shape: Shape, orientation: Orientation): Shape {
  let result = normalize(shape)
  for (let i = 0; i < orientation; i++) result = rotateOnce(result)
  return result
}

export function shapesEqual(a: Shape, b: Shape): boolean {
  return a.length === b.length && a.every((c, i) => c.x === b[i].x && c.y === b[i].y)
}

/** Distinct orientations of a shape, in turn order, each with the orientation that produces it. */
export function uniqueRotations(shape: Shape): { orientation: Orientation; shape: Shape }[] {
  const found: { orientation: Orientation; shape: Shape }[] = []
  for (const orientation of [0, 1, 2, 3] as const) {
    const rotated = rotate(shape, orientation)
    if (!found.some((f) => shapesEqual(f.shape, rotated))) found.push({ orientation, shape: rotated })
  }
  return found
}
