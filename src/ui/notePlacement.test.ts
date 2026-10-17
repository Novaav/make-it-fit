import { describe, expect, it } from 'vitest'
import { placeNote, type Avoid } from './notePlacement'

const view = { width: 1280, height: 800 }
const size = { width: 330, height: 150 }
const hit = (p: { left: number; top: number }, b: { left: number; top: number; width: number; height: number }) =>
  p.left < b.left + b.width && p.left + size.width > b.left && p.top < b.top + b.height && p.top + size.height > b.top

describe('placeNote', () => {
  it('takes the bottom right when nothing is in the way', () => {
    expect(placeNote(view, size, [])).toEqual({ left: 1280 - 330 - 12, top: 800 - 150 - 12 })
  })

  it('slides below the tool buttons instead of covering them', () => {
    const toolbar = { left: 840, top: 590, width: 560, height: 48 }
    const p = placeNote(view, size, [{ box: toolbar, weight: 4 }])
    expect(hit(p, toolbar)).toBe(false)
  })

  it('keeps off the suitcase and the tool buttons even on a short screen, covering the cheaper tray instead', () => {
    const board = { left: 40, top: 110, width: 430, height: 320 }
    const toolbar = { left: 40, top: 620, width: 400, height: 48 }
    const tray = { left: 600, top: 100, width: 500, height: 480 }
    const avoid: Avoid[] = [{ box: board, weight: 4 }, { box: toolbar, weight: 4 }, { box: tray, weight: 1 }]
    const p = placeNote({ width: 1000, height: 700 }, size, avoid)
    expect(hit(p, board)).toBe(false)
    expect(hit(p, toolbar)).toBe(false)
  })

  it('stays inside the viewport', () => {
    for (const v of [{ width: 390, height: 844 }, { width: 360, height: 740 }]) {
      const s = { width: v.width - 24, height: 160 }
      const p = placeNote(v, s, [{ box: { left: 20, top: 200, width: v.width - 40, height: 330 }, weight: 4 }])
      expect(p.left).toBeGreaterThanOrEqual(0)
      expect(p.top).toBeGreaterThanOrEqual(0)
      expect(p.left + s.width).toBeLessThanOrEqual(v.width)
      expect(p.top + s.height).toBeLessThanOrEqual(v.height)
    }
  })
})
