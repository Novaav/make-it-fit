import { createRoot } from 'react-dom/client'
import type { CSSProperties } from 'react'
import { ItemArt } from '../components/ItemArt'
import { WeightLabel } from '../art/WeightLabel'
import { ITEM_ART } from '../art/items'
import { loadLevels, uniqueRotations, type Item, type Orientation } from '../engine'
import '../styles.css'

/**
 * Development-only contact sheets for visual review of the illustrated items (`npm run art:sheet`).
 * Not part of the production build: it is reached only through art-sheet.html, which Vite does not bundle.
 */
const levelId = new URLSearchParams(location.search).get('level') ?? '01'
const level = loadLevels().find((l) => l.id === levelId)!
// every item of the level that has final artwork (placeholders are not reviewed here)
const items = level.items.filter((i) => i.id in ITEM_ART)
const LININGS = [
  { name: 'Tide lining', bg: '#f3e3c3', line: '#c9ae78' },
  { name: 'Marmalade lining', bg: '#f7e2b0', line: '#d8b46a' },
  { name: 'Plum lining', bg: '#dcd8e6', line: '#b3acc8' },
]
const bounds = (item: Item, o: Orientation) => {
  const swap = o % 2 === 1
  const w = Math.max(...item.cells.map((c) => c.x)) + 1
  const h = Math.max(...item.cells.map((c) => c.y)) + 1
  return swap ? { w: h, h: w } : { w, h }
}
const cellSize = (px: number) => (px < 40 ? 'xs' : px < 56 ? 'sm' : 'lg')

interface PieceProps {
  item: Item
  orientation?: Orientation
  cell: number
  lining?: (typeof LININGS)[number]
  weight?: { grams: number; bonus?: boolean }
  style?: CSSProperties
  carried?: 'plain' | 'good' | 'bad'
  silhouette?: boolean
}

function Piece({ item, orientation = 0, cell, lining = LININGS[0], weight, style, carried, silhouette }: PieceProps) {
  const b = bounds(item, orientation)
  const glow = (c: string) => `drop-shadow(0 0 2px ${c}) drop-shadow(0 0 2px ${c}) drop-shadow(0 6px 6px rgba(60,40,20,.35))`
  const filter = silhouette
    ? 'brightness(0)'
    : carried === 'good' ? glow('#2a8553') : carried === 'bad' ? glow('#c93c32') : carried ? 'drop-shadow(0 10px 10px rgba(60,40,20,.4))' : 'drop-shadow(0 2px 2px rgba(60,40,20,.35))'
  return (
    <div
      className="level"
      data-art={item.id}
      data-rot={orientation}
      data-cell={cellSize(cell)}
      style={
        {
          '--cell': `${cell}px`,
          width: (b.w + 1) * cell,
          height: (b.h + 1) * cell,
          background: lining.bg,
          backgroundImage: `linear-gradient(to right, ${lining.line} 1px, transparent 1px), linear-gradient(to bottom, ${lining.line} 1px, transparent 1px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${cell / 2}px ${cell / 2}px`,
          position: 'relative',
          flex: 'none',
          borderRadius: 6,
          ...style,
        } as CSSProperties
      }
    >
      <div style={{ position: 'absolute', left: cell / 2, top: cell / 2, width: b.w * cell, height: b.h * cell, filter }}>
        <ItemArt item={item} orientation={orientation} />
        {weight && <WeightLabel item={item} orientation={orientation} grams={weight.grams} bonus={!!weight.bonus} />}
      </div>
    </div>
  )
}

const row: CSSProperties = { display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }
const h2: CSSProperties = { font: '600 15px system-ui', margin: '18px 0 8px', color: '#2b2433' }
const cap: CSSProperties = { font: '12px system-ui', color: '#5e5568', margin: '4px 0 0' }

function Labelled({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      <p style={cap}>{name}</p>
    </div>
  )
}

const longItem = items.find((i) => i.id === 'jeans') ?? items.find((i) => i.id === 'boa') ?? items[0]
const WEIGHTS: Record<string, number> = Object.fromEntries(level.items.map((i) => [i.id, i.weight]))

const sections: Record<string, () => React.ReactNode> = {
  desktop: () => (
    <>
      <h2 style={h2}>A. Gameplay size (72 px cells), resting, on all three linings. Can you name each object in one second?</h2>
      {LININGS.map((l) => (
        <div key={l.name} style={{ ...row, marginBottom: 10 }}>
          {items.map((i) => (
            <Labelled key={i.id} name={`${i.id} · ${l.name}`}>
              <Piece item={i} cell={72} lining={l} />
            </Labelled>
          ))}
        </div>
      ))}
    </>
  ),
  rotations: () => (
    <>
      <h2 style={h2}>B. Every unique rotation (56 px cells). Lighting stays at the upper left.</h2>
      {items.map((i) => (
        <div key={i.id} style={{ ...row, marginBottom: 8 }}>
          {uniqueRotations(i.cells).map((r) => (
            <Labelled key={r.orientation} name={`${i.id} · ${r.orientation * 90}° turn`}>
              <Piece item={i} orientation={r.orientation} cell={56} />
            </Labelled>
          ))}
        </div>
      ))}
    </>
  ),
  phone: () => (
    <>
      <h2 style={h2}>C. Phone sizes: 56, 48 and 40 px cells (small screens drop microdetail tiers).</h2>
      {[56, 48, 40].map((px) => (
        <div key={px} style={{ ...row, marginBottom: 10 }}>
          {items.map((i) => (
            <Labelled key={i.id} name={`${i.id} · ${px}px`}>
              <Piece item={i} cell={px} />
            </Labelled>
          ))}
        </div>
      ))}
    </>
  ),
  weights: () => (
    <>
      <h2 style={h2}>D. Weight labels printed on each item's built-in label zone (never over the art). Top: 64 px cells with unit; bottom: 48 px, number only.</h2>
      {[64, 48].map((px) => (
        <div key={px} style={{ ...row, marginBottom: 10 }}>
          {items.map((i) => (
            <Labelled key={i.id} name={`${i.id} · ${WEIGHTS[i.id]} g`}>
              <Piece item={i} cell={px} weight={{ grams: WEIGHTS[i.id] }} />
            </Labelled>
          ))}
        </div>
      ))}
      <div style={row}>
        {[0, 1, 2, 3].map((o) => (
          <Labelled key={o} name={`${items[0].id}, bonus ★, ${o * 90}° turn: the number stays upright`}>
            <Piece item={items[0]} orientation={o as Orientation} cell={56} weight={{ grams: items[0].weight, bonus: true }} />
          </Labelled>
        ))}
      </div>
    </>
  ),
  carried: () => (
    <>
      <h2 style={h2}>E. Carried states (72 px): lifted free-floating, valid edge, invalid edge.</h2>
      <div style={{ ...row, marginBottom: 10 }}>
        {items.map((i) => (
          <Labelled key={i.id} name={`${i.id} · lifted`}>
            <Piece item={i} cell={72} carried="plain" />
          </Labelled>
        ))}
      </div>
      <div style={{ ...row, marginBottom: 10 }}>
        {items.map((i) => (
          <Labelled key={i.id} name={`${i.id} · valid`}>
            <Piece item={i} cell={72} carried="good" />
          </Labelled>
        ))}
      </div>
      <div style={row}>
        {items.map((i) => (
          <Labelled key={i.id} name={`${i.id} · invalid`}>
            <Piece item={i} cell={72} carried="bad" />
          </Labelled>
        ))}
      </div>
    </>
  ),
  long: () => (
    <>
      <h2 style={h2}>G. The longest item ({longItem.id}) at 72, 56, 48 and 40 px cells, and rotated at 56 px.</h2>
      <div style={{ ...row, alignItems: 'flex-end' }}>
        {[72, 56, 48, 40].map((px) => (
          <Labelled key={px} name={`${longItem.id} · ${px}px`}>
            <Piece item={longItem} cell={px} weight={{ grams: longItem.weight }} />
          </Labelled>
        ))}
        {[1].map((o) => (
          <Labelled key={o} name={`${longItem.id} · 90° turn · 56px`}>
            <Piece item={longItem} orientation={o as Orientation} cell={56} weight={{ grams: longItem.weight }} />
          </Labelled>
        ))}
      </div>
    </>
  ),
  silhouettes: () => (
    <>
      <h2 style={h2}>F. Silhouettes only (56 px): the shape alone should already say what it is, and match the occupied cells.</h2>
      <div style={row}>
        {items.map((i) => (
          <Labelled key={i.id} name={i.id}>
            <Piece item={i} cell={56} silhouette />
          </Labelled>
        ))}
      </div>
    </>
  ),
}

const wanted = new URLSearchParams(location.search).get('section')
createRoot(document.getElementById('root')!).render(
  <div id="sheet" style={{ display: 'inline-block', padding: 20, background: '#fffaf0', font: '14px system-ui', maxWidth: 1500 }}>
    {Object.entries(sections)
      .filter(([k]) => !wanted || wanted === 'all' || wanted === k)
      .map(([k, render]) => (
        <section key={k}>{render()}</section>
      ))}
  </div>,
)

/**
 * Rasterises every item at every unique rotation and reports how much of each cell is painted. Used by the
 * browser test (e2e/art.spec.ts): nothing may be painted outside the occupied cells, and every occupied cell must
 * visibly contain art.
 */
interface CellReport { x: number; y: number; occupied: boolean; painted: number }
interface ArtReport { id: string; orientation: number; cells: CellReport[] }
const PX = 64
;(window as unknown as { __artCheck: () => Promise<ArtReport[]> }).__artCheck = async () => {
  const out: ArtReport[] = []
  for (const item of items) {
    for (const r of uniqueRotations(item.cells)) {
      const holder = document.querySelector(`[data-art="${item.id}"][data-rot="${r.orientation}"]`)
      const svg = holder?.querySelector('svg')
      if (!svg) continue
      const b = bounds(item, r.orientation as Orientation)
      const clone = svg.cloneNode(true) as SVGSVGElement
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clone.setAttribute('width', String(b.w * PX))
      clone.setAttribute('height', String(b.h * PX))
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }))
      const img = new Image()
      await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = url })
      const canvas = document.createElement('canvas')
      canvas.width = b.w * PX
      canvas.height = b.h * PX
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      const cells: CellReport[] = []
      for (let cy = 0; cy < b.h; cy++) {
        for (let cx = 0; cx < b.w; cx++) {
          let painted = 0
          for (let y = cy * PX; y < (cy + 1) * PX; y++) for (let x = cx * PX; x < (cx + 1) * PX; x++) if (data[(y * canvas.width + x) * 4 + 3] > 24) painted++
          cells.push({ x: cx, y: cy, occupied: r.shape.some((c) => c.x === cx && c.y === cy), painted: painted / (PX * PX) })
        }
      }
      out.push({ id: item.id, orientation: r.orientation, cells })
    }
  }
  return out
}
