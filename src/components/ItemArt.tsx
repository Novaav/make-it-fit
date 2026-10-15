import type { CSSProperties, ReactNode } from 'react'
import type { Item, Orientation, Shape } from '../engine'
import { artTransform } from '../ui/geometry'

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

function art(item: Item): ReactNode {
  const s = item.cells
  switch (item.id) {
    case 'passport':
      return (
        <>
          <Silhouette cells={s} color="#34506b" outline="#1f3144" />
          <circle cx={0.5} cy={0.4} r={0.17} stroke={GOLD} strokeWidth={0.05} fill="none" />
          <path d="M0.5 0.26v0.28M0.36 0.4h0.28" stroke={GOLD} strokeWidth={0.03} {...line} />
          <rect x={0.28} y={0.7} width={0.44} height={0.05} rx={0.025} fill={GOLD} />
        </>
      )
    case 'shirt':
      return (
        <>
          <Silhouette cells={s} color="#ea8a77" outline="#a9503f" />
          <path d="M1.27 0.04Q1.5 0.36 1.73 0.04Z" fill={CREAM} />
          <path d="M1.03 0.14V0.5M1.97 0.14V0.5" stroke="#a9503f" strokeWidth={0.04} {...line} />
          <path d="M1.2 1.82H1.8" stroke="#a9503f" strokeWidth={0.04} strokeDasharray="0.08 0.08" {...line} />
          <rect x={1.55} y={1.2} width={0.2} height={0.2} rx={0.04} fill={CREAM} opacity={0.8} />
        </>
      )
    case 'jeans':
      return (
        <>
          <Silhouette cells={s} color="#6a93c1" outline="#365b86" />
          <rect x={0.06} y={0.06} width={0.26} height={0.88} rx={0.1} fill="#4a74a3" />
          <circle cx={0.19} cy={0.5} r={0.06} fill={GOLD} />
          <path d="M0.34 0.5H5.94" stroke="#365b86" strokeWidth={0.04} {...line} />
          <path d="M0.4 0.14H5.9M0.4 0.86H5.9" stroke="#d6e5f5" strokeWidth={0.025} strokeDasharray="0.1 0.08" {...line} />
          <path d="M0.55 0.22h0.4v0.2q-0.2 0.1-0.4 0Z" stroke="#d6e5f5" strokeWidth={0.03} fill="none" />
        </>
      )
    case 'charger':
      return (
        <>
          <Silhouette cells={s} color="#93cfae" outline="#4d8a6c" />
          <rect x={0.12} y={0.25} width={0.5} height={0.5} rx={0.09} fill={CREAM} stroke="#4d8a6c" strokeWidth={0.03} />
          <rect x={0.62} y={0.33} width={0.2} height={0.08} fill="#b9b4a8" />
          <rect x={0.62} y={0.59} width={0.2} height={0.08} fill="#b9b4a8" />
          <path d="M0.82 0.5C1.1 0.1 1.3 0.9 1.55 0.5" stroke="#2f6f5a" strokeWidth={0.06} {...line} />
          <rect x={1.55} y={0.4} width={0.33} height={0.2} rx={0.04} fill="#b9b4a8" />
        </>
      )
    case 'toiletries':
      return (
        <>
          <Silhouette cells={s} color="#bba9dc" outline="#7a64a8" />
          <path d="M0.18 0.3H1.82" stroke={CREAM} strokeWidth={0.05} strokeDasharray="0.1 0.07" {...line} />
          <rect x={0.28} y={0.62} width={0.5} height={1.0} rx={0.14} fill={CREAM} />
          <rect x={0.36} y={0.46} width={0.34} height={0.18} rx={0.05} fill="#ea8a77" />
          <rect x={0.36} y={1.0} width={0.34} height={0.34} rx={0.05} fill="#bba9dc" />
          <path d="M1.1 0.78h0.52v0.7q-0.26 0.14-0.52 0Z" fill="#7fb5d6" />
          <rect x={1.22} y={0.62} width={0.28} height={0.18} rx={0.04} fill={CREAM} />
        </>
      )
    case 'shoes':
      return (
        <>
          <Silhouette cells={s} color="#e9b957" outline="#a67c22" />
          <rect x={0.1} y={1.8} width={0.8} height={0.1} rx={0.05} fill={CREAM} />
          <rect x={2.1} y={1.8} width={0.8} height={0.1} rx={0.05} fill={CREAM} />
          <path d="M0.3 0.28h0.4M0.3 0.52h0.4M0.3 0.76h0.4M2.3 0.28h0.4M2.3 0.52h0.4M2.3 0.76h0.4" stroke={CREAM} strokeWidth={0.05} {...line} />
          <path d="M0.7 0.5Q1.5 1 2.3 0.5" stroke={CREAM} strokeWidth={0.05} {...line} />
        </>
      )
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
    case 'dvd':
      return (
        <>
          <Silhouette cells={s} color="#34304a" outline="#16132a" />
          <circle cx={0.55} cy={0.5} r={0.33} fill="#d9dde6" />
          <circle cx={0.55} cy={0.5} r={0.08} fill="#34304a" />
          <rect x={1.05} y={0.2} width={1.75} height={0.6} rx={0.06} fill={GOLD} />
          <text x={1.92} y={0.47} fontSize={0.15} textAnchor="middle" fontWeight="bold" fill="#34304a" fontFamily="Georgia, serif">
            EXTREMELY
          </text>
          <text x={1.92} y={0.67} fontSize={0.15} textAnchor="middle" fontWeight="bold" fill="#34304a" fontFamily="Georgia, serif">
            EDUCATIONAL
          </text>
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
    case 'ex_photo':
      return (
        <>
          <Silhouette cells={s} color="#f1e4cc" outline="#9a8a6a" />
          <circle cx={0.5} cy={0.55} r={0.2} fill="#e9b98f" />
          <circle cx={1.5} cy={0.5} r={0.2} fill="#e9b98f" />
          <path d="M1.2 1.2l0.6 0.6M1.8 1.2l-0.6 0.6" stroke="#d9534f" strokeWidth={0.07} {...line} />
          <path d="M0.3 0.15h1.4" stroke="#9a8a6a" strokeWidth={0.03} strokeDasharray="0.06 0.06" {...line} />
        </>
      )
    case 'extra_shoes':
      return (
        <>
          <Silhouette cells={s} color="#59b3c4" outline="#2d7787" />
          <path d="M0.12 0.84H1.88M2.12 0.84H3.88" stroke={CREAM} strokeWidth={0.1} {...line} />
          <path d="M0.5 0.3v0.25M0.7 0.3v0.25M0.9 0.3v0.25M2.5 0.3v0.25M2.7 0.3v0.25M2.9 0.3v0.25" stroke={CREAM} strokeWidth={0.05} {...line} />
          <path d="M2 0.1V0.9" stroke="#2d7787" strokeWidth={0.03} {...line} />
        </>
      )
    case 'hairdryer':
      return (
        <>
          <Silhouette cells={s} color="#f2a65a" outline="#a8631f" />
          <path d="M0.3 0.3H2.7M0.3 0.5H2.7M0.3 0.7H2.7" stroke={CREAM} strokeWidth={0.04} strokeDasharray="0.12 0.08" {...line} />
          <rect x={1.38} y={1.15} width={0.24} height={0.2} rx={0.05} fill={CREAM} />
          <path d="M1.5 2.1Q1.2 2.4 1.5 2.6T1.5 3" stroke="#a8631f" strokeWidth={0.05} {...line} />
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
      return <Silhouette cells={s} color="#ccc" outline="#888" />
  }
}

interface Props {
  item: Item
  orientation: Orientation
  className?: string
  style?: CSSProperties
}

/** Temporary vector art. Sized by its parent; keeps the cell aspect ratio. */
export function ItemArt({ item, orientation, className, style }: Props) {
  const w = Math.max(...item.cells.map((c) => c.x)) + 1
  const h = Math.max(...item.cells.map((c) => c.y)) + 1
  const { tx, ty, angle } = artTransform(w, h, orientation)
  const [vw, vh] = orientation % 2 ? [h, w] : [w, h]
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
      <g transform={`translate(${tx} ${ty}) rotate(${angle})`}>{art(item)}</g>
    </svg>
  )
}
