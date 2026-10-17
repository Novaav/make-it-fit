import type { ReactNode } from 'react'

/** Shared drawing kit for the illustrated items. All coordinates are in cell units (1 cell = 1 unit). */
export const INK = '#2b2433'

interface InkedProps {
  d: string
  fill: string
  /** Hue-shifted dark of the item colour (never black). */
  ink: string
  /** Outline weight in cells (0.035-0.045 nominal). */
  w?: number
  transform?: string
}

/**
 * A hand-inked shape: an ink copy offset towards the lower right (so the line is heavier there and thinner at the
 * upper left, like a drawn outline) under the coloured shape, which carries its own thin ink edge.
 */
export function Inked({ d, fill, ink, w = 0.04, transform }: InkedProps) {
  return (
    <g transform={transform}>
      <path d={d} fill={ink} stroke={ink} strokeWidth={w * 1.7} strokeLinejoin="round" transform="translate(0.013 0.017)" />
      <path d={d} fill={fill} stroke={ink} strokeWidth={w} strokeLinejoin="round" />
    </g>
  )
}

export const line = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

/** Hand stitching: short dashes, never a solid line. */
export function Stitch({ d, color, w = 0.022, dash = '0.05 0.045' }: { d: string; color: string; w?: number; dash?: string }) {
  return <path d={d} stroke={color} strokeWidth={w} strokeDasharray={dash} {...line} />
}

/** Detail tiers for small screens: lod1 hides below 40 px cells, lod2 below 56 px (see styles.css). */
export const Lod1 = ({ children }: { children: ReactNode }) => <g className="lod1">{children}</g>
export const Lod2 = ({ children }: { children: ReactNode }) => <g className="lod2">{children}</g>

/** Where an item's weight number sits (centre, in base-orientation cells) and which text tone reads on it. */
export interface LabelZone {
  x: number
  y: number
  tone: 'dark' | 'light'
}

export interface ItemArtDef {
  draw: (uid: string) => ReactNode
  zone: LabelZone
}

/** A soft contact shadow: the same silhouette, offset towards the lower right, so every item rests on the lining. */
export function Contact({ d, opacity = 0.2, dx = 0.03, dy = 0.045 }: { d: string; opacity?: number; dx?: number; dy?: number }) {
  return <path d={d} fill={INK} opacity={opacity} transform={`translate(${dx} ${dy})`} />
}
