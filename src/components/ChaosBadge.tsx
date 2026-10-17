import type { CSSProperties } from 'react'
import type { Item, Orientation } from '../engine'
import { artPoint } from '../ui/geometry'

/**
 * The Chaos number (or "MUST" for a mandatory item) stamped on an item's first occupied cell, so every item shows what
 * it is worth without hover or tap. It turns with the item's position but its text stays upright.
 */
export function ChaosBadge({ item, orientation }: { item: Item; orientation: Orientation }) {
  const w = Math.max(...item.cells.map((c) => c.x)) + 1
  const h = Math.max(...item.cells.map((c) => c.y)) + 1
  const first = item.cells.reduce((a, c) => (c.y < a.y || (c.y === a.y && c.x < a.x) ? c : a))
  const p = artPoint(first.x + (item.required ? 0.5 : 0.3), first.y + 0.3, w, h, orientation)
  return (
    <span
      className={`chaos-badge${item.required ? ' must' : ''}`}
      data-chaos={item.required ? 'must' : item.chaos}
      style={{ '--bx': p.x, '--by': p.y } as CSSProperties}
      aria-hidden="true"
    >
      {item.required ? 'MUST' : item.chaos}
    </span>
  )
}
