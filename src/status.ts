import { canAddAny, isOverWeight, isPerfect, isWon, rotate, totalChaos, totalWeight, type Cell, type GameState, type Item, type Level, type Orientation, type PlacementError } from './engine'
import { ITEM_NAMES } from './levelMeta'
import { formatWeight } from './weight'

/**
 * The words the game shows and announces about the current position. Pure functions of the level and the game state,
 * so the copy (which screen readers depend on) is unit-tested without rendering anything.
 */

const REASONS: Record<PlacementError, string> = {
  'out-of-bounds': 'it sticks out of the suitcase',
  overlap: 'it overlaps another item',
  'unknown-item': 'unknown item',
  'already-placed': 'already packed',
  'not-placed': 'not packed',
  'nothing-to-undo': 'nothing to undo',
}

export const itemName = (id: string) => ITEM_NAMES[id] ?? id

/** True when the level shows a Chaos number on its items (every level from Level 1; only Levels 2-3 also have a target). */
export const isScored = (level: Level) => level.items.some((i) => i.chaos > 0)

/** Why a placement is refused, in a phrase that fits after a colon or a dash. */
export const reasonText = (error: PlacementError): string => REASONS[error]

export function failureMessage(error: PlacementError): string {
  return `Can't do that: ${REASONS[error]}.`
}

/** What a screen reader hears after every change: the running score, the weight left and a win (the objective card is not a live region). */
export function scoreAnnouncement(game: GameState): string {
  const level = game.level
  if (!isScored(level)) return ''
  const parts = [`Chaos ${totalChaos(game)}${level.target !== undefined ? ` of ${level.target}` : ''}.`]
  if (level.weightLimit !== undefined) {
    const w = totalWeight(game)
    parts.push(w > level.weightLimit ? `Over the allowance by ${formatWeight(w - level.weightLimit)}.` : `${formatWeight(level.weightLimit - w)} left.`)
  }
  if (isPerfect(game)) parts.push('Perfect pack!')
  else if (isWon(game)) parts.push('That wins the level.')
  return ` ${parts.join(' ')}`
}

/** The Chaos and weight that are part of an item's accessible name, e.g. " Chaos 3, 450 g." (empty when the level shows neither). */
export function itemSummary(level: Level, item: Item): string {
  const parts = [item.required && item.chaos === 0 ? 'Mandatory' : isScored(level) ? `Chaos ${item.chaos}` : '', level.weightLimit !== undefined ? formatWeight(item.weight) : ''].filter(Boolean)
  return parts.length ? ` ${parts.join(', ')}.` : ''
}

/** The hint under the suitcase: over the allowance, what is still to pack, or that the case is full (empty when there is nothing to say). */
export function statusNote(game: GameState): string {
  const level = game.level
  const placed = new Set(game.placements.map((p) => p.itemId))
  const missing = level.items.filter((i) => i.required && !placed.has(i.id))
  const overWeight = isOverWeight(game)
  const solved = isWon(game)
  const full = level.target !== undefined && !solved && !overWeight && game.placements.length > 0 && missing.length === 0 && !canAddAny(game)
  if (overWeight) return `Over the allowance by ${formatWeight(totalWeight(game) - (level.weightLimit ?? 0))} — take something out.`
  if (!solved && game.placements.length > 0 && missing.length > 0) return `Still to pack: ${missing.map((i) => itemName(i.id)).join(', ')}.`
  if (full) return `Suitcase full at ${totalChaos(game)} Chaos. Swap something for more Chaos.`
  return ''
}

/**
 * Where an item's weight chip sits: on a cell the item really covers (bottom-most, then right-most), not on the bounding-box
 * corner, which is empty for T, U and L shapes.
 */
export function weightChipAnchor(item: Item, orientation: Orientation): Cell {
  return rotate(item.cells, orientation).reduce((a, c) => (c.y > a.y || (c.y === a.y && c.x > a.x) ? c : a))
}
