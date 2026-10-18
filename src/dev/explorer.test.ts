import { describe, expect, it } from 'vitest'
import { createGame, isPerfect, isWon, loadLevels, place, totalChaos, totalWeight } from '../engine'
import { explorerExamples, explorerSummary } from './explorer'

const levels = loadLevels()
const PERFECT_SETS: Record<string, string[]> = {
  '02': ['boa+dvds+flamingo+handbag+outfit+vibrator', 'boa+dvds+flamingo+handbag+ringlight+vibrator'],
  '03': ['ceramic_foot+cheese+emergency_socks+hangover+liquor+outfit+robe'],
}
const setKey = (items: string[]) => [...items].sort().join('+')

describe.each(['02', '03'])('Solution Explorer examples, level %s', (id) => {
  const level = levels.find((l) => l.id === id)!
  const examples = explorerExamples(level)

  it('has a compact set of distinct examples with a stable id and label', () => {
    expect(examples.length).toBeGreaterThanOrEqual(5)
    expect(examples.length).toBeLessThanOrEqual(12)
    expect(new Set(examples.map((e) => e.id)).size).toBe(examples.length)
    expect(new Set(examples.map((e) => setKey(e.items))).size).toBe(examples.length)
    for (const label of ['Fewest items', 'Most items', 'Most rotated']) expect(examples.some((e) => e.label.includes(label)), label).toBe(true)
  })

  it('every example is a complete placement the engine accepts and scores as the fixture says', () => {
    for (const e of examples) {
      let g = createGame(level)
      for (const p of e.placements) {
        const r = place(g, p)
        expect(r.ok, `${e.label}: ${p.itemId}`).toBe(true)
        if (r.ok) g = r.state
      }
      expect(g.placements).toHaveLength(level.items.filter((i) => i.required).length + e.count)
      expect(isWon(g), e.label).toBe(true)
      expect(isPerfect(g), e.label).toBe(e.perfect)
      expect(totalChaos(g), e.label).toBe(e.chaos)
      expect(totalWeight(g), e.label).toBe(e.weight)
      expect(g.placements.filter((p) => p.orientation !== 0).length, e.label).toBe(e.rotated)
      const selectable = g.placements.map((p) => p.itemId).filter((x) => !level.items.find((i) => i.id === x)!.required)
      expect(setKey(selectable)).toBe(setKey(e.items))
    }
  })

  it('lists every perfect item combination, and nothing else claims to be perfect', () => {
    const perfect = examples.filter((e) => e.perfect).map((e) => setKey(e.items)).sort()
    expect(perfect).toEqual([...PERFECT_SETS[id]].sort())
  })

  it('includes a rotation-heavy example', () => {
    expect(Math.max(...examples.map((e) => e.rotated))).toBeGreaterThanOrEqual(4)
  })
})

describe('Solution Explorer summary', () => {
  it('reports item-combination counts that match the independent enumeration (combinations, not layouts)', () => {
    expect(explorerSummary('02')).toEqual({ legal: 719, winning: 102, perfect: 2 })
    expect(explorerSummary('03')).toEqual({ legal: 532, winning: 37, perfect: 1 })
    expect(explorerSummary('01')).toBeNull()
  })
})
