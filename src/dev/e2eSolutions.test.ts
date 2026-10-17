import { describe, expect, it } from 'vitest'
import { LEVEL1, LEVEL2_NORMAL } from '../../e2e/solutions'
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
})
