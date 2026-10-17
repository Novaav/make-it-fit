import { describe, expect, it } from 'vitest'
import { LEVEL1, LEVEL2_NORMAL, LEVEL2_PERFECT } from '../../e2e/solutions'
import { loadLevels } from '../engine'
import { referenceSolution } from './solutions'

describe('browser-test reference data', () => {
  it('matches the engine-verified Level 1 solution', () => {
    const level = loadLevels().find((l) => l.id === '01')!
    const expected = referenceSolution(level).map((p) => ({ id: p.itemId, rotations: p.orientation, col: p.x, row: p.y }))
    expect(LEVEL1).toEqual(expected)
  })

  it('matches the engine-verified Level 2 normal win', () => {
    const level = loadLevels().find((l) => l.id === '02')!
    const expected = referenceSolution(level, 'normal').map((p) => ({ id: p.itemId, rotations: p.orientation, col: p.x, row: p.y }))
    expect(LEVEL2_NORMAL).toEqual(expected)
  })

  it('matches the engine-verified Level 2 perfect pack', () => {
    const level = loadLevels().find((l) => l.id === '02')!
    const expected = referenceSolution(level, 'perfect').map((p) => ({ id: p.itemId, rotations: p.orientation, col: p.x, row: p.y }))
    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)
    expect([...LEVEL2_PERFECT].sort(byId)).toEqual([...expected].sort(byId))
  })
})
