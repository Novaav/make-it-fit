import type { CSSProperties } from 'react'
import type { Item, Orientation } from '../engine'
import { artPoint } from '../ui/geometry'
import { ITEM_ART } from './items'
import { formatKg } from '../weight'

/**
 * The weight number, printed on the item's built-in quiet label zone (care label, leather patch, sticker...).
 * Unrotated so it always reads upright; it never covers the illustration.
 */
export function WeightLabel({ item, orientation, grams, bonus }: { item: Item; orientation: Orientation; grams: number; bonus: boolean }) {
  const def = ITEM_ART[item.id]
  if (!def) return null
  const w = Math.max(...item.cells.map((c) => c.x)) + 1
  const h = Math.max(...item.cells.map((c) => c.y)) + 1
  const p = artPoint(def.zone.x, def.zone.y, w, h, orientation)
  return (
    <span
      className={`wlabel wl-${def.zone.tone}`}
      data-weight={grams}
      style={{ '--zx': p.x, '--zy': p.y } as CSSProperties}
      aria-hidden="true"
    >
      {bonus ? '★' : ''}
      {formatKg(grams)}
      <span className="unit"> kg</span>
    </span>
  )
}

export const hasLabelZone = (itemId: string) => itemId in ITEM_ART
