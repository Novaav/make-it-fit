import { movePlaced, place, placementCells, validatePlacement } from './game'
import { rotate } from './shape'
import type { ActionResult, Cell, GameState, Level, Orientation, Placement, PlacementError } from './types'

export interface Preview {
  readonly placement: Placement
  /** Cells the item would cover, possibly outside the board. */
  readonly cells: readonly Cell[]
  /** Null when the placement is legal. */
  readonly error: PlacementError | null
}

/** Rotated bounding-box size of an item. */
export function itemBounds(level: Level, itemId: string, orientation: Orientation) {
  const item = level.items.find((i) => i.id === itemId)
  if (!item) throw new Error(`Unknown item: ${itemId}`)
  const cells = rotate(item.cells, orientation)
  return {
    width: Math.max(...cells.map((c) => c.x)) + 1,
    height: Math.max(...cells.map((c) => c.y)) + 1,
  }
}

/** Validity of putting an item (placed or not) at a position, ignoring its own current spot. */
export function previewPlacement(
  state: GameState,
  itemId: string,
  orientation: Orientation,
  x: number,
  y: number,
): Preview {
  const placement: Placement = { itemId, orientation, x, y }
  const others = state.placements.filter((p) => p.itemId !== itemId)
  const error = validatePlacement(state.level, others, placement)
  return { placement, cells: placementCells(state.level, placement), error }
}

/** Keep the item's bounding box on the board (used for keyboard movement). */
export function clampOrigin(level: Level, itemId: string, orientation: Orientation, x: number, y: number) {
  const { width, height } = itemBounds(level, itemId, orientation)
  return {
    x: Math.min(Math.max(x, 0), Math.max(level.width - width, 0)),
    y: Math.min(Math.max(y, 0), Math.max(level.height - height, 0)),
  }
}

/** Place a new item or move a placed one; an unchanged placement is a no-op with no history entry. */
export function commitPlacement(state: GameState, placement: Placement): ActionResult {
  const current = state.placements.find((p) => p.itemId === placement.itemId)
  if (!current) return place(state, placement)
  if (current.x === placement.x && current.y === placement.y && current.orientation === placement.orientation) {
    return { ok: true, state }
  }
  return movePlaced(state, placement)
}
