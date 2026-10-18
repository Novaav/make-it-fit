import { describe, expect, it } from 'vitest'
import { BOARDS_KEY, loadBoards, parseBoards, restoreGame, saveBoards, snapshot, levelSignature, type Boards } from './boards'
import { isWon, loadLevels, totalWeight, type Placement } from './engine'
import { referenceSolution } from './dev/solutions'

const levels = loadLevels()
const l2 = levels.find((l) => l.id === '02')!
const solution = referenceSolution(l2, 'normal')
const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}

describe('saved boards', () => {
  it('round-trips an arrangement through storage and restores exactly the same pack', () => {
    const storage = memory()
    saveBoards(storage, { '02': snapshot(l2, solution) })
    const loaded = loadBoards(storage)
    const game = restoreGame(l2, loaded['02'])
    expect(game.placements).toEqual(solution)
    expect(isWon(game)).toBe(true)
    expect(game.history).toEqual([]) // restoring is not undoable
  })

  it('restores a partial arrangement as partial: it is never complete just because the level was completed before', () => {
    const partial = solution.slice(0, solution.length - 1)
    const game = restoreGame(l2, snapshot(l2, partial))
    expect(game.placements).toHaveLength(partial.length)
    expect(isWon(game)).toBe(false)
  })

  it('keeps an over-the-allowance arrangement as it was (placing over the allowance is allowed)', () => {
    const over: Placement[] = [
      { itemId: 'handbag', orientation: 0, x: 0, y: 0 }, { itemId: 'flamingo', orientation: 0, x: 0, y: 3 }, { itemId: 'outfit', orientation: 0, x: 2, y: 0 },
      { itemId: 'toiletries', orientation: 0, x: 4, y: 1 }, { itemId: 'disco_ball', orientation: 0, x: 4, y: 3 }, { itemId: 'vibrator', orientation: 1, x: 3, y: 2 },
    ]
    const game = restoreGame(l2, snapshot(l2, over))
    expect(game.placements).toHaveLength(6)
    expect(totalWeight(game)).toBe(7050)
    expect(isWon(game)).toBe(false)
  })

  it.each([
    ['not JSON', '{nope'],
    ['null', 'null'],
    ['an array', '[]'],
    ['another version', JSON.stringify({ version: 2, boards: {} })],
    ['no version', JSON.stringify({ boards: {} })],
    ['boards not an object', JSON.stringify({ version: 1, boards: [] })],
  ])('rejects a corrupt or outdated save safely (%s)', (_name, raw) => {
    expect(parseBoards(raw)).toEqual({})
  })

  it('drops only the damaged level, and rejects malformed placements field by field', () => {
    const good = snapshot(l2, solution)
    const raw = JSON.stringify({
      version: 1,
      boards: {
        '02': good,
        '01': { sig: 'x', placements: [{ itemId: 'shirt', orientation: 9, x: 0, y: 0 }] },
        '03': { sig: 'x', placements: [{ itemId: 'a', orientation: 0, x: 1.5, y: 0 }] },
        '04': { sig: 'x', placements: [{ itemId: 'a', orientation: 0, x: 0, y: 0 }, { itemId: 'a', orientation: 0, x: 1, y: 1 }] },
        '05': { placements: [] },
        '06': 'oops',
      },
    })
    expect(Object.keys(parseBoards(raw))).toEqual(['02'])
  })

  it('refuses a save made for different level data (stale or edited) and an impossible arrangement', () => {
    expect(restoreGame(l2, { sig: 'old', placements: solution }).placements).toEqual([])
    const overlap: Placement[] = [
      { itemId: 'handbag', orientation: 0, x: 0, y: 0 },
      { itemId: 'outfit', orientation: 0, x: 0, y: 0 },
    ]
    expect(restoreGame(l2, snapshot(l2, overlap)).placements).toEqual([])
    const unknown: Placement[] = [{ itemId: 'heels', orientation: 0, x: 0, y: 0 }] // Level 2 used to have heels
    expect(restoreGame(l2, snapshot(l2, unknown)).placements).toEqual([])
  })

  it('changes the level fingerprint when the items change, and survives storage failures', () => {
    expect(levelSignature(l2)).not.toBe(levelSignature(levels.find((l) => l.id === '03')!))
    const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('full') } }
    expect(loadBoards(broken)).toEqual({})
    expect(() => saveBoards(broken, {} as Boards)).not.toThrow()
    expect(loadBoards(null)).toEqual({})
  })

  it('uses its own storage key, separate from progress', () => {
    const storage = memory()
    saveBoards(storage, {})
    expect([...storage.m.keys()]).toEqual([BOARDS_KEY])
    expect(BOARDS_KEY).not.toContain('progress')
  })
})
