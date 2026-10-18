import { describe, expect, it } from 'vitest'
import { loadLevels } from '../engine'
import { introPages } from './IntroNote'

const level = (id: string) => loadLevels().find((l) => l.id === id)!
const text = (id: string) => introPages(level(id)).flatMap((p) => [p.title, ...p.lines]).join(' ')

describe('introPages', () => {
  it('gives each level one or two short pages, fewer on later levels', () => {
    expect(introPages(level('01'))).toHaveLength(2)
    expect(introPages(level('02'))).toHaveLength(2)
    expect(introPages(level('03'))).toHaveLength(1)
    for (const id of ['01', '02', '03']) for (const p of introPages(level(id))) expect(p.lines.length).toBeLessThanOrEqual(2)
  })

  it('never repeats the numbers the objective card already shows (target, perfect score, allowance)', () => {
    for (const id of ['01', '02', '03']) {
      const l = level(id)
      const t = text(id)
      for (const n of [l.target, l.perfect]) if (n !== undefined) expect(t, `${id} ${n}`).not.toMatch(new RegExp(`\\b${n}\\b`))
      expect(t).not.toMatch(/\bkg\b/)
    }
  })

  it('Level 1 teaches packing, turning and Chaos with no target', () => {
    const t = text('01')
    expect(t).toContain('Drag each item into the suitcase')
    expect(t).toContain('Press R')
    expect(t).toContain('Packing makes Chaos')
    expect(t).toContain('No target yet')
  })

  it('Level 2 is about choosing', () => {
    const t = text('02')
    expect(t).toContain('Now you choose')
    expect(t).toContain('Nothing is mandatory')
    expect(t).toContain('Swap an item')
  })

  it('Level 3 teaches only the new mandatory rule', () => {
    const t = text('03')
    expect(t).toContain('MUST')
    expect(t).not.toMatch(/Chaos/)
  })
})
