import { describe, expect, it } from 'vitest'
import { loadLevels } from '../engine'
import { introPages } from './IntroNote'

const level = (id: string) => loadLevels().find((l) => l.id === id)!
const text = (id: string) => introPages(level(id)).flatMap((p) => [p.title, ...p.lines]).join(' ')

describe('introPages', () => {
  it('gives each level two or three short pages', () => {
    for (const id of ['01', '02', '03']) {
      const pages = introPages(level(id))
      expect(pages.length, id).toBeGreaterThanOrEqual(2)
      expect(pages.length, id).toBeLessThanOrEqual(3)
      for (const p of pages) expect(p.lines.length).toBeLessThanOrEqual(2)
    }
  })

  it('Level 1 keeps pack-all-five and introduces Chaos without a target', () => {
    const t = text('01')
    expect(t).toContain('Pack it all')
    expect(t).toContain('Packing makes Chaos')
    expect(t).toContain('No target yet')
    expect(t).not.toMatch(/\bwin\b|perfect|kg/i)
  })

  it('Level 2 explains choosing, the target, the allowance and the perfect score', () => {
    const t = text('02')
    expect(t).toContain('Nothing is mandatory')
    expect(t).toContain('Pack 20 Chaos to win')
    expect(t).toContain('6.5 kg')
    expect(t).toContain('Perfect is 25')
  })

  it('Level 3 teaches only the new mandatory rule instead of repeating the Chaos tutorial', () => {
    const t = text('03')
    expect(t).toContain('MUST')
    expect(t).toContain('21 Chaos')
    expect(t).not.toContain('Every item has a Chaos number')
    expect(introPages(level('03'))).toHaveLength(2)
  })
})
