import { describe, expect, it } from 'vitest'
import {
  createGame,
  isOverWeight,
  isWon,
  loadLevels,
  optionalPlacedCount,
  place,
  totalWeight,
  type GameState,
} from '../engine'
import { BEST_OPTIONAL } from '../levelMeta'
import { referenceSolution } from './solutions'
import { renderSolutionsDoc } from './solutionsDoc'

const play = (levelId: string, includeOptional: boolean): GameState => {
  const level = loadLevels().find((l) => l.id === levelId)!
  let state = createGame(level)
  for (const p of referenceSolution(level, includeOptional)) {
    const r = place(state, p)
    if (!r.ok) throw new Error(`${levelId}/${p.itemId}: ${r.error}`)
    state = r.state
  }
  return state
}

describe.each(['01', '02', '03'])('reference solutions, level %s', (id) => {
  it('required-only layout wins within the weight limit', () => {
    const s = play(id, false)
    expect(isWon(s)).toBe(true)
    expect(optionalPlacedCount(s)).toBe(0)
  })

  it('max-bonus layout wins and matches the verified optional maximum', () => {
    const s = play(id, true)
    expect(isWon(s)).toBe(true)
    expect(isOverWeight(s)).toBe(false)
    expect(optionalPlacedCount(s)).toBe(BEST_OPTIONAL[id])
    const limit = s.level.weightLimit
    if (limit !== undefined) expect(totalWeight(s)).toBeLessThanOrEqual(limit)
  })
})

describe('TEST_SOLUTIONS.md', () => {
  it('matches what the engine-verified generator produces (run `vitest -u` to regenerate)', async () => {
    await expect(renderSolutionsDoc()).toMatchFileSnapshot('../../TEST_SOLUTIONS.md')
  })
})
