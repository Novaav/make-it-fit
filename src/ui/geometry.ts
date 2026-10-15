import type { Orientation } from '../engine'

interface Rect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/** Board cell origin (top-left of the item's bounding box) that centres the box under the pointer. */
export function pointerToOrigin(
  px: number,
  py: number,
  rect: Rect,
  cols: number,
  rows: number,
  boxWidth: number,
  boxHeight: number,
) {
  return {
    x: Math.round((px - rect.left) / (rect.width / cols) - boxWidth / 2),
    y: Math.round((py - rect.top) / (rect.height / rows) - boxHeight / 2),
  }
}

export function pointInRect(px: number, py: number, rect: Rect, margin = 0): boolean {
  return (
    px >= rect.left - margin &&
    px <= rect.left + rect.width + margin &&
    py >= rect.top - margin &&
    py <= rect.top + rect.height + margin
  )
}

/**
 * SVG transform that draws art authored on the base shape's [0,w]x[0,h] box in the given
 * orientation. Matches the engine's turn (x, y) -> (y, -x), which is rotate(-90) in SVG.
 */
export function artTransform(w: number, h: number, orientation: Orientation) {
  let pts: [number, number][] = [
    [0, 0],
    [w, h],
  ]
  for (let i = 0; i < orientation; i++) pts = pts.map(([x, y]) => [y, -x])
  const tx = -Math.min(...pts.map(([x]) => x)) || 0
  const ty = -Math.min(...pts.map(([, y]) => y)) || 0
  return { tx, ty, angle: -90 * orientation || 0 }
}
