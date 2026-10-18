import type { CSSProperties } from 'react'
import type { Item, Orientation } from '../engine'
import { artPoint } from '../ui/geometry'

/** A hand-cut paper dot: a circle whose radius wobbles slightly, the same wobble for the same value every time. */
function paperDot(seed: number): string {
  const pts = Array.from({ length: 20 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 20
    const r = 20 + Math.sin(i * 2.3 + seed * 1.7) * 0.55 + Math.cos(i * 1.1 + seed) * 0.35
    return `${(22 + r * Math.cos(a)).toFixed(2)},${(22 + r * Math.sin(a)).toFixed(2)}`
  })
  return `M${pts.join('L')}Z`
}

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
      {must ? (
        'MUST'
      ) : (
        <svg viewBox="0 0 44 44" focusable="false">
          {/* a paper dot stuck on the item, a worn rubber-stamp ring (gaps where the ink did not take) and the number, slightly bled */}
          <path d={paperDot(item.chaos)} className="dot-shadow" transform="translate(0.7 1.3)" />
          <path d={paperDot(item.chaos)} className="dot-paper" />
          <circle cx={22} cy={22} r={16.2} className="dot-ring" strokeDasharray="38 3 22 3 30 3 4 2" />
          <circle cx={22} cy={22} r={13.4} className="dot-ring thin" />
          <text x={22} y={29.4} textAnchor="middle" className="dot-num">
            {item.chaos}
          </text>
        </svg>
      )}
    </span>
  )
}
