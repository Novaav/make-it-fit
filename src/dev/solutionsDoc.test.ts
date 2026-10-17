import { describe, expect, it } from 'vitest'
import { createGame, isOverWeight, isPerfect, isWon, loadLevels, place, totalChaos, totalWeight, type GameState } from '../engine'
import { referenceSolution } from './solutions'
import { renderSolutionsDoc } from './solutionsDoc'

const play = (levelId: string, kind: 'perfect' | 'normal'): GameState => {
  const level = loadLevels().find((l) => l.id === levelId)!
  let state = createGame(level)
  for (const p of referenceSolution(level, kind)) {
    const r = place(state, p)
    if (!r.ok) throw new Error(`${levelId}/${p.itemId}: ${r.error}`)
    state = r.state
  }
  return state
}

describe.each(['01', '02', '03'])('reference solutions, level %s', (id) => {
  it('the normal layout wins within the weight limit; on Chaos levels it is not perfect', () => {
    const s = play(id, 'normal')
    expect(isWon(s)).toBe(true)
    expect(isOverWeight(s)).toBe(false)
    expect(isPerfect(s)).toBe(false)
    if (s.level.target !== undefined) expect(totalChaos(s)).toBeLessThan(s.level.perfect!)
  })

  it('the perfect layout wins and, on Chaos levels, reaches exactly the verified maximum', () => {
    const s = play(id, 'perfect')
    expect(isWon(s)).toBe(true)
    expect(isOverWeight(s)).toBe(false)
    if (s.level.perfect !== undefined) {
      expect(totalChaos(s)).toBe(s.level.perfect)
      expect(isPerfect(s)).toBe(true)
    }
    const limit = s.level.weightLimit
    if (limit !== undefined) expect(totalWeight(s)).toBeLessThanOrEqual(limit)
  })
})

describe('TEST_SOLUTIONS.md', () => {
  it('matches what the engine-verified generator produces (run `vitest -u` to regenerate)', async () => {
    await expect(renderSolutionsDoc()).toMatchFileSnapshot('../../TEST_SOLUTIONS.md')
  })
})
