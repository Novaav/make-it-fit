import { pointInRect, pointerToOrigin, type Rect } from './geometry'

/** Layout measured once per drag (and again only after a scroll/resize), not on every pointer move. */
export interface DragGeometry {
  board: Rect
  tray: Rect
  cols: number
  rows: number
}

export interface DragTarget {
  /** Board cell of the carried item's top-left corner (may be off the board). */
  x: number
  y: number
  /** Pointer is over the board (within half a cell): the carried item snaps to a cell instead of floating under the pointer. */
  snapped: boolean
  /** A board item is being dragged over the tray: dropping takes it out. */
  overTray: boolean
}

/** Pure mapping from pointer position to what the board should show; the same maths the pre-refactor code ran on every move. */
export function dragTarget(
  g: DragGeometry,
  px: number,
  py: number,
  boxWidth: number,
  boxHeight: number,
  fromBoard: boolean,
): DragTarget {
  const { x, y } = pointerToOrigin(px, py, g.board, g.cols, g.rows, boxWidth, boxHeight)
  const cell = g.board.width / g.cols
  return {
    x,
    y,
    snapped: pointInRect(px, py, g.board, cell / 2),
    overTray: fromBoard && pointInRect(px, py, g.tray),
  }
}

export const sameTarget = (a: DragTarget, b: DragTarget) =>
  a.x === b.x && a.y === b.y && a.snapped === b.snapped && a.overTray === b.overTray
