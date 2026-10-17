import { rotate, uniqueRotations } from './shape'
import type {
  ActionResult,
  Cell,
  GameState,
  Item,
  Level,
  Orientation,
  Placement,
  PlacementError,
} from './types'

export function createGame(level: Level): GameState {
  return { level, placements: [], history: [] }
}

function findItem(level: Level, itemId: string): Item | undefined {
  return level.items.find((i) => i.id === itemId)
}

/** Board cells covered by a placement. Throws on an unknown item id. */
export function placementCells(level: Level, placement: Placement): Cell[] {
  const item = findItem(level, placement.itemId)
  if (!item) throw new Error(`Unknown item: ${placement.itemId}`)
  return rotate(item.cells, placement.orientation).map((c) => ({
    x: c.x + placement.x,
    y: c.y + placement.y,
  }))
}

/** Checks a candidate placement against the board and the given other placements. */
export function validatePlacement(
  level: Level,
  others: readonly Placement[],
  candidate: Placement,
): PlacementError | null {
  if (!findItem(level, candidate.itemId)) return 'unknown-item'
  const cells = placementCells(level, candidate)
  if (cells.some((c) => c.x < 0 || c.y < 0 || c.x >= level.width || c.y >= level.height)) {
    return 'out-of-bounds'
  }
  const taken = new Set(others.flatMap((p) => placementCells(level, p)).map((c) => `${c.x},${c.y}`))
  if (cells.some((c) => taken.has(`${c.x},${c.y}`))) return 'overlap'
  return null
}

const fail = (error: PlacementError): ActionResult => ({ ok: false, error })

function commit(state: GameState, placements: readonly Placement[]): ActionResult {
  return { ok: true, state: { ...state, placements, history: [...state.history, state.placements] } }
}

export function place(state: GameState, placement: Placement): ActionResult {
  if (state.placements.some((p) => p.itemId === placement.itemId)) {
    return fail(findItem(state.level, placement.itemId) ? 'already-placed' : 'unknown-item')
  }
  const error = validatePlacement(state.level, state.placements, placement)
  return error ? fail(error) : commit(state, [...state.placements, placement])
}

export function remove(state: GameState, itemId: string): ActionResult {
  if (!state.placements.some((p) => p.itemId === itemId)) return fail('not-placed')
  return commit(state, state.placements.filter((p) => p.itemId !== itemId))
}

/** Turn a placed item 90 degrees clockwise-in-data-order, keeping its corner fixed. */
export function rotatePlaced(state: GameState, itemId: string): ActionResult {
  const current = state.placements.find((p) => p.itemId === itemId)
  if (!current) return fail('not-placed')
  const turned: Placement = { ...current, orientation: ((current.orientation + 1) % 4) as Orientation }
  const others = state.placements.filter((p) => p.itemId !== itemId)
  const error = validatePlacement(state.level, others, turned)
  return error ? fail(error) : commit(state, [...others, turned])
}

export function undo(state: GameState): ActionResult {
  if (state.history.length === 0) return fail('nothing-to-undo')
  const placements = state.history[state.history.length - 1]
  return { ok: true, state: { ...state, placements, history: state.history.slice(0, -1) } }
}

export function reset(state: GameState): GameState {
  return createGame(state.level)
}

export function totalWeight(state: GameState): number {
  return state.placements.reduce((sum, p) => sum + (findItem(state.level, p.itemId)?.weight ?? 0), 0)
}

export function isOverWeight(state: GameState): boolean {
  const limit = state.level.weightLimit
  return limit !== undefined && totalWeight(state) > limit
}

export function totalChaos(state: GameState): number {
  return state.placements.reduce((sum, p) => sum + (findItem(state.level, p.itemId)?.chaos ?? 0), 0)
}

/**
 * Won when every required item is placed, the weight limit (if any) is respected and, on levels with Chaos, the Chaos
 * target is reached. Optional items never matter except through their Chaos.
 */
export function isWon(state: GameState): boolean {
  const placed = new Set(state.placements.map((p) => p.itemId))
  const { target } = state.level
  return (
    state.level.items.every((i) => !i.required || placed.has(i.id)) &&
    !isOverWeight(state) &&
    (target === undefined || totalChaos(state) >= target)
  )
}

/** A win that also reaches the level's maximum Chaos. */
export function isPerfect(state: GameState): boolean {
  const { perfect } = state.level
  return perfect !== undefined && isWon(state) && totalChaos(state) >= perfect
}

/** True when some unpacked item still fits (within the weight limit and on the board in some orientation). */
export function canAddAny(state: GameState): boolean {
  const placed = new Set(state.placements.map((p) => p.itemId))
  const limit = state.level.weightLimit
  const weight = totalWeight(state)
  const { width, height } = state.level
  for (const item of state.level.items) {
    if (placed.has(item.id) || (limit !== undefined && weight + item.weight > limit)) continue
    for (const { orientation } of uniqueRotations(item.cells)) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!validatePlacement(state.level, state.placements, { itemId: item.id, orientation, x, y })) return true
        }
      }
    }
  }
  return false
}

/** Atomically relocate and/or reorient an already placed item (one undo step). */
export function movePlaced(state: GameState, placement: Placement): ActionResult {
  if (!state.placements.some((p) => p.itemId === placement.itemId)) return fail('not-placed')
  const others = state.placements.filter((p) => p.itemId !== placement.itemId)
  const error = validatePlacement(state.level, others, placement)
  return error ? fail(error) : commit(state, [...others, placement])
}
