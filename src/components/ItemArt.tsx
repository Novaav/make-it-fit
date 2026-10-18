import { memo, useId, type CSSProperties, type ReactNode } from 'react'
import type { Item, Orientation, Shape } from '../engine'
import { artTransform } from '../ui/geometry'
import { ITEM_NAMES } from '../levelMeta'
import { ITEM_ART } from '../art/items'

/** Rounded union of the shape's cells: dark outline pass, then colour pass. */
function Silhouette({ cells, color, outline }: { cells: Shape; color: string; outline: string }) {
  const seams = cells.flatMap((c) => [
    cells.some((o) => o.x === c.x + 1 && o.y === c.y) ? { x: c.x + 0.5, y: c.y, w: 1, h: 1 } : null,
    cells.some((o) => o.x === c.x && o.y === c.y + 1) ? { x: c.x, y: c.y + 0.5, w: 1, h: 1 } : null,
  ])
  const rects = (inset: number) => (
    <>
      {cells.map((c) => (
        <rect key={`c${c.x},${c.y}`} x={c.x + inset} y={c.y + inset} width={1 - 2 * inset} height={1 - 2 * inset} rx={0.22} />
      ))}
      {seams.map((s, i) =>
        s ? <rect key={`s${i}`} x={s.x + inset} y={s.y + inset} width={s.w - 2 * inset} height={s.h - 2 * inset} /> : null,
      )}
    </>
  )
  return (
    <>
      <g fill={outline} stroke={outline} strokeWidth={0.1} strokeLinejoin="round">
        {rects(0.04)}
      </g>
      <g fill={color}>{rects(0.06)}</g>
    </>
  )
}

/** Temporary art for items that are not illustrated yet: a clearly labelled, dashed silhouette (never mistaken for finished art). */
const PLACEHOLDER_COLORS = ['#cfd8e3', '#e3d4cf', '#d7e3cf', '#e3dccf', '#d9cfe3', '#cfe3df']
function Placeholder({ item }: { item: Item }) {
  const label = (ITEM_NAMES[item.id] ?? item.id).toUpperCase()
  const color = PLACEHOLDER_COLORS[[...item.id].reduce((n, c) => n + c.charCodeAt(0), 0) % PLACEHOLDER_COLORS.length]
  const first = item.cells[0]
  return (
    <>
      <Silhouette cells={item.cells} color={color} outline="#6b6578" />
      <g fill="none" stroke="#6b6578" strokeWidth={0.02} strokeDasharray="0.06 0.05" opacity={0.7}>
        <UnionDash cells={item.cells} />
      </g>
      <text x={first.x + 0.5} y={first.y + 0.56} fontSize={0.15} textAnchor="middle" fontWeight={700} fill="#4a4456" fontFamily="system-ui, sans-serif">
        {label.length > 12 ? `${label.slice(0, 11)}…` : label}
      </text>
      <text x={first.x + 0.5} y={first.y + 0.76} fontSize={0.11} textAnchor="middle" fill="#6b6578" fontFamily="system-ui, sans-serif">
        placeholder art
      </text>
    </>
  )
}
function UnionDash({ cells }: { cells: Shape }) {
  return (
    <>
      {cells.map((c) => (
        <rect key={`${c.x},${c.y}`} x={c.x + 0.1} y={c.y + 0.1} width={0.8} height={0.8} rx={0.1} />
      ))}
    </>
  )
}

/** Every item in the game has final artwork; this only exists so an item added without art still shows up, clearly labelled. */
function art(item: Item): ReactNode {
  return <Placeholder item={item} />
}

interface Props {
  item: Item
  orientation: Orientation
  className?: string
  style?: CSSProperties
}

/** Rounded union of the occupied cells, inset a little: the only region the redrawn items may paint. */
function UnionShapes({ cells, inset }: { cells: Shape; inset: number }) {
  const has = (x: number, y: number) => cells.some((c) => c.x === x && c.y === y)
  const size = 1 - 2 * inset
  return (
    <>
      {cells.map((c) => (
        <rect key={`c${c.x},${c.y}`} x={c.x + inset} y={c.y + inset} width={size} height={size} rx={0.16} />
      ))}
      {cells.flatMap((c) => [
        has(c.x + 1, c.y) ? <rect key={`h${c.x},${c.y}`} x={c.x + 0.5} y={c.y + inset} width={1} height={size} /> : null,
        has(c.x, c.y + 1) ? <rect key={`v${c.x},${c.y}`} x={c.x + inset} y={c.y + 0.5} width={size} height={1} /> : null,
        // where four cells meet the four inset corners leave a pinhole: close it
        has(c.x + 1, c.y) && has(c.x, c.y + 1) && has(c.x + 1, c.y + 1) ? (
          <rect key={`j${c.x},${c.y}`} x={c.x + 1 - inset} y={c.y + 1 - inset} width={2 * inset} height={2 * inset} />
        ) : null,
      ])}
    </>
  )
}

/** The illustrated item (or the labelled placeholder). Sized by its parent; keeps the cell aspect ratio. */
export const ItemArt = memo(function ItemArt({ item, orientation, className, style }: Props) {
  const uid = useId().replace(/:/g, '')
  const w = Math.max(...item.cells.map((c) => c.x)) + 1
  const h = Math.max(...item.cells.map((c) => c.y)) + 1
  const { tx, ty, angle } = artTransform(w, h, orientation)
  const [vw, vh] = orientation % 2 ? [h, w] : [w, h]
  const transform = `translate(${tx} ${ty}) rotate(${angle})`
  const def = ITEM_ART[item.id]
  if (def) {
    // Redrawn items: everything is clipped to the occupied cells (no overhang can ever suggest an occupied
    // cell that is not), and one world-space light overlay keeps the lamp at the upper left in every rotation.
    return (
      <svg className={className} style={style} viewBox={`0 0 ${vw} ${vh}`} width="100%" height="100%" aria-hidden="true" focusable="false">
        <defs>
          {/* <g> is not allowed inside <clipPath>, so the rotation is applied on the clipPath itself */}
          <clipPath id={`${uid}-clip`} transform={transform}>
            <UnionShapes cells={item.cells} inset={0.03} />
          </clipPath>
          <g id={`${uid}-art`} transform={transform}>
            {def.draw(uid)}
          </g>
          {/* the light is painted only where the art is (alpha mask), so empty parts of a cell stay untouched */}
          <mask id={`${uid}-alpha`} maskUnits="userSpaceOnUse" x={0} y={0} width={vw} height={vh} style={{ maskType: 'alpha' }}>
            <use href={`#${uid}-art`} />
          </mask>
          <linearGradient id={`${uid}-light`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={vw} y2={vh}>
            <stop offset="0" stopColor="#fff" stopOpacity={0.26} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
            <stop offset="1" stopColor="#1b1020" stopOpacity={0.14} />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${uid}-clip)`}>
          <use href={`#${uid}-art`} />
          <rect width={vw} height={vh} fill={`url(#${uid}-light)`} mask={`url(#${uid}-alpha)`} />
        </g>
      </svg>
    )
  }
  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${vw} ${vh}`}
      width="100%"
      height="100%"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={transform}>{art(item)}</g>
    </svg>
  )
})
