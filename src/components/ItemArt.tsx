import { memo, useId, type CSSProperties, type ReactNode } from 'react'
import type { Item, Orientation, Shape } from '../engine'
import { artTransform } from '../ui/geometry'
import { ITEM_NAMES } from '../levelMeta'
import { ITEM_ART } from '../art/level1'

const CREAM = '#fff6e6'
const GOLD = '#e8c96a'

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

const line = { strokeLinecap: 'round' as const, fill: 'none' }


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

function art(item: Item): ReactNode {
  const s = item.cells
  switch (item.id) {
    case 'outfit':
      return (
        <>
          <Silhouette cells={s} color="#d97aa6" outline="#8f3d66" />
          <path d="M1.27 0.04Q1.5 0.36 1.73 0.04Z" fill={CREAM} />
          <path d="M1.03 0.14V0.5M1.97 0.14V0.5" stroke="#8f3d66" strokeWidth={0.04} {...line} />
          <path d="M1.5 0.7l0.06 0.14 0.14 0.06-0.14 0.06-0.06 0.14-0.06-0.14-0.14-0.06 0.14-0.06Z" fill={GOLD} />
          <path d="M1.5 1.45l0.05 0.11 0.11 0.05-0.11 0.05-0.05 0.11-0.05-0.11-0.11-0.05 0.11-0.05Z" fill={GOLD} />
          <path d="M1.2 1.82H1.8" stroke="#8f3d66" strokeWidth={0.04} strokeDasharray="0.08 0.08" {...line} />
        </>
      )
    case 'disco_ball':
      return (
        <>
          <path d="M1 0V0.14" stroke="#7a7a8c" strokeWidth={0.05} {...line} />
          <circle cx={1} cy={1.05} r={0.9} fill="#c9d3e6" stroke="#6b7690" strokeWidth={0.1} />
          <g stroke="#6b7690" strokeWidth={0.03} fill="none">
            <ellipse cx={1} cy={1.05} rx={0.45} ry={0.9} />
            <path d="M0.12 1.05H1.88M0.25 0.6H1.75M0.25 1.5H1.75" />
          </g>
          <path d="M0.55 0.55l0.05 0.12 0.12 0.05-0.12 0.05-0.05 0.12-0.05-0.12-0.12-0.05 0.12-0.05Z" fill="#fff" />
        </>
      )
    case 'heels':
      return (
        <>
          <Silhouette cells={s} color="#d9534f" outline="#8e2b29" />
          <path d="M0.3 0.28h0.4M0.3 0.52h0.4M2.3 0.28h0.4M2.3 0.52h0.4" stroke={CREAM} strokeWidth={0.05} {...line} />
          <path d="M0.55 1.55V1.9M2.45 1.55V1.9" stroke={CREAM} strokeWidth={0.08} {...line} />
          <path d="M0.7 0.5Q1.5 1 2.3 0.5" stroke={CREAM} strokeWidth={0.05} {...line} />
        </>
      )
    case 'cutout':
      return (
        <>
          <Silhouette cells={s} color="#cfa66b" outline="#8a6636" />
          <circle cx={2.5} cy={0.5} r={0.28} fill="#f1d6a8" stroke="#8a6636" strokeWidth={0.04} />
          <path d="M2.38 0.45h0.02M2.6 0.45h0.02" stroke="#8a6636" strokeWidth={0.06} {...line} />
          <path d="M2.35 0.6Q2.5 0.72 2.65 0.6" stroke="#8a6636" strokeWidth={0.04} {...line} />
          <path d="M0.2 0.5H2.1M2.9 0.5H4.8" stroke="#8a6636" strokeWidth={0.03} strokeDasharray="0.1 0.08" {...line} />
          <path d="M2.5 0.85V1.15M2.5 1.35V1.65" stroke="#8a6636" strokeWidth={0.05} {...line} />
          <path d="M2.25 1.1h0.5l0.15 0.8h-0.8Z" fill="#e8736a" />
          <path d="M1.5 3.2V3.8M3.5 3.2V3.8" stroke="#8a6636" strokeWidth={0.05} {...line} />
        </>
      )
    case 'hotel_lamp':
      return (
        <>
          <Silhouette cells={s} color="#f0d36b" outline="#a1862a" />
          <path d="M0.12 0.9L0.3 0.12H1.7L1.88 0.9Z" fill={CREAM} stroke="#a1862a" strokeWidth={0.04} />
          <path d="M1.5 1.1V2.6" stroke="#a1862a" strokeWidth={0.1} {...line} />
          <ellipse cx={1.5} cy={2.8} rx={0.38} ry={0.12} fill="#a1862a" />
          <path d="M1.5 0.9V1.1" stroke="#a1862a" strokeWidth={0.05} {...line} />
        </>
      )
    case 'emergency_socks':
      return (
        <>
          <Silhouette cells={s} color="#e68aa6" outline="#a24a68" />
          <path d="M0.15 0.3H0.85M1.15 0.3H1.85M0.15 0.5H0.85M1.15 0.5H1.85" stroke={CREAM} strokeWidth={0.07} {...line} />
          <path d="M0.2 0.8H0.8M1.2 0.8H1.8" stroke="#a24a68" strokeWidth={0.06} {...line} />
        </>
      )
    case 'ceramic_foot':
      return (
        <>
          <Silhouette cells={s} color="#eef2f8" outline="#5f7aa0" />
          <g fill="#6d9bd1">
            <circle cx={0.5} cy={0.5} r={0.1} />
            <circle cx={1.5} cy={0.5} r={0.1} />
            <circle cx={2.5} cy={0.5} r={0.1} />
            <circle cx={0.5} cy={1.5} r={0.1} />
            <circle cx={2.5} cy={1.5} r={0.1} />
          </g>
          <path d="M0.2 0.8Q1.5 1.3 2.8 0.8" stroke="#6d9bd1" strokeWidth={0.05} {...line} />
          <path d="M0.2 1.88H0.8M2.2 1.88H2.8" stroke="#5f7aa0" strokeWidth={0.06} {...line} />
        </>
      )
    default:
      return <Placeholder item={item} />
  }
}

interface Props {
  item: Item
  orientation: Orientation
  className?: string
  style?: CSSProperties
}

/** Temporary vector art. Sized by its parent; keeps the cell aspect ratio. */
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

/** Temporary vector art for items not yet redrawn. Sized by its parent; keeps the cell aspect ratio. */
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
