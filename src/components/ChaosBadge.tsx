import type { CSSProperties } from 'react'
import type { Item, Orientation } from '../engine'
import { artPoint } from '../ui/geometry'

/**
 * The Chaos number (or "MUST" for a mandatory item with no Chaos) inked as a small round stamp on an item's first occupied cell, so every item shows what
 * it is worth without hover or tap. It turns with the item's position but its text stays upright.
 */
export function ChaosBadge({ item, orientation }: { item: Item; orientation: Orientation }) {
  const w = Math.max(...item.cells.map((c) => c.x)) + 1
  const h = Math.max(...item.cells.map((c) => c.y)) + 1
  const first = item.cells.reduce((a, c) => (c.y < a.y || (c.y === a.y && c.x < a.x) ? c : a))
  const must = item.required && item.chaos === 0
  const p = artPoint(first.x + (must ? 0.5 : 0.3), first.y + 0.3, w, h, orientation)
  // A fixed per-value tilt (like stamps pressed by hand) so the same value always looks the same.
  const tilt = [-7, 5, -4, 6, -2][item.chaos % 5]
  return (
    <span
      className={`chaos-badge${must ? ' must' : ''}`}
      data-chaos={must ? 'must' : item.chaos}
      style={{ '--bx': p.x, '--by': p.y, '--tilt': `${must ? -3 : tilt}deg` } as CSSProperties}
      aria-hidden="true"
    >
      {must ? 'MUST' : item.chaos}
    </span>
  )
}
