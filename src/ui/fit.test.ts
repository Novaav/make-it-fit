import { describe, expect, it } from 'vitest'
import { loadLevels } from '../engine'
import { PLAYABLE_LEVEL_IDS } from '../levelMeta'
import { chooseArrangement } from './fit'
import { TRAY_LAYOUTS } from './trayLayout'

const levels = loadLevels().filter((l) => PLAYABLE_LEVEL_IDS.includes(l.id as (typeof PLAYABLE_LEVEL_IDS)[number]))
const pick = (id: string, w: number, h: number) => chooseArrangement(levels.find((l) => l.id === id)!, TRAY_LAYOUTS[id], { w, h })

describe('chooseArrangement', () => {
  it('always returns one of the level’s own whole-pixel arrangements', () => {
    for (const l of levels)
      for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 720], [1024, 768], [768, 1024], [844, 390], [390, 844], [360, 640]]) {
        const a = pick(l.id, w, h)
        expect(TRAY_LAYOUTS[l.id]).toContain(a.layout)
        expect(Number.isInteger(a.cell)).toBe(true)
        expect(a.cell).toBeGreaterThanOrEqual(1)
      }
  })

  it.each([[1440, 900], [1280, 720]])('keeps every level on one screen beside the suitcase at %ix%i', (w, h) => {
    for (const l of levels) {
      const a = pick(l.id, w, h)
      expect(a.mode, `L${l.id}`).toBe('side')
      expect(a.fits, `L${l.id}`).toBe(true)
    }
  })

  it('does not simply shrink Level 3: wide arrangements give it bigger cells than the old 10x11 tray', () => {
    // The previous single arrangement (10x11) gave about 57 px cells at 1440x900 and 41 px at 1280x720.
    expect(pick('03', 1440, 900).cell).toBeGreaterThanOrEqual(60)
    expect(pick('03', 1280, 720).cell).toBeGreaterThanOrEqual(47)
    expect(pick('03', 1440, 900).layout.cols).toBeGreaterThanOrEqual(10) // a wide, short arrangement
  })

  it('phones stack the tray under the suitcase with a tray as narrow as the board', () => {
    for (const l of levels) {
      const a = pick(l.id, 390, 844)
      expect(a.mode).toBe('stack')
      expect(a.layout.cols).toBeLessThanOrEqual(Math.max(l.width, 8))
      expect(a.cell * Math.max(l.width, a.layout.cols) + 32).toBeLessThanOrEqual(390) // never wider than the screen
    }
    expect(pick('03', 390, 844).cell).toBeGreaterThanOrEqual(40)
  })

  it('tablets in portrait get comfortable cells and at most a short scroll', () => {
    for (const l of levels) {
      const a = pick(l.id, 768, 1024)
      expect(a.cell, `L${l.id}`).toBeGreaterThanOrEqual(44)
      expect(a.overflow, `L${l.id}`).toBeLessThanOrEqual(360) // the suitcase stays pinned; only the tray scrolls
    }
  })

  it('landscape phones pin the whole suitcase on the left and scroll the tray on the right', () => {
    for (const l of levels) {
      const a = pick(l.id, 844, 390)
      expect(a.mode).toBe('wing')
      expect(a.cell * l.height + 56 + 26 + 44 + 44).toBeLessThanOrEqual(390)
      expect(a.cell).toBeGreaterThanOrEqual(32)
    }
  })
})

describe('phone: the tool row stays on screen', () => {
  const level = (id: string) => levels.find((l) => l.id === id)!
  const cell = (id: string, w: number, h: number) => chooseArrangement(level(id), TRAY_LAYOUTS[id], { w, h }).cell
  it('Level 1 on the smallest phone gives up a little cell size (at most 4 px) so that Rotate, Remove, Undo, Reset and Next level fit', () => {
    expect(cell('01', 360, 740)).toBe(48)
  })
  it('taller phones are untouched', () => {
    expect(cell('01', 390, 844)).toBeGreaterThanOrEqual(51)
    expect(cell('01', 430, 932)).toBeGreaterThanOrEqual(51)
  })
})
