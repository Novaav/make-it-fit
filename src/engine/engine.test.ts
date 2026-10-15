import { describe, expect, it } from 'vitest'
import solutions from './solutions.fixture.json'
import {
  createGame,
  isOverWeight,
  isWon,
  loadLevels,
  normalize,
  optionalPlacedCount,
  place,
  placementCells,
  previewPlacement,
  itemBounds,
  clampOrigin,
  commitPlacement,
  remove,
  reset,
  rotate,
  rotatePlaced,
  totalWeight,
  undo,
  uniqueRotations,
  type GameState,
  type Level,
  type Orientation,
  type Placement,
  type Shape,
} from './index'

const levels = loadLevels()
const level = (id: string): Level => levels.find((l) => l.id === id)!
const item = (l: Level, id: string) => l.items.find((i) => i.id === id)!
const must = (r: ReturnType<typeof place>): GameState => {
  if (!r.ok) throw new Error(r.error)
  return r.state
}
const cells = (pairs: [number, number][]): Shape => normalize(pairs.map(([x, y]) => ({ x, y })))

describe('shapes', () => {
  it('normalizes to a (0,0) corner, sorted, without mutating input', () => {
    const input = [
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 4, y: 8 },
    ]
    const copy = JSON.parse(JSON.stringify(input))
    expect(normalize(input)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ])
    expect(input).toEqual(copy)
  })

  it('four rotations return the original shape for every fixture item', () => {
    for (const l of levels)
      for (const i of l.items) {
        let s = i.cells
        for (let n = 0; n < 4; n++) s = rotate(s, 1)
        expect(s).toEqual(i.cells)
      }
  })

  it('counts unique rotations', () => {
    expect(uniqueRotations(cells([[0, 0]]))).toHaveLength(1)
    expect(uniqueRotations(item(level('01'), 'toiletries').cells)).toHaveLength(1)
    expect(uniqueRotations(item(level('01'), 'charger').cells)).toHaveLength(2)
    expect(uniqueRotations(item(level('01'), 'shirt').cells)).toHaveLength(4)
  })

  it('rotation is 90 degrees: a horizontal domino becomes vertical', () => {
    expect(rotate(cells([[0, 0], [1, 0]]), 1)).toEqual(cells([[0, 0], [0, 1]]))
  })
})

describe('placement validation', () => {
  const l = level('01')
  const start = createGame(l)

  it('accepts an in-bounds placement', () => {
    expect(place(start, { itemId: 'passport', orientation: 0, x: 4, y: 5 }).ok).toBe(true)
  })

  it('rejects out of bounds (edges and negatives)', () => {
    const jeans = (o: Orientation, x: number, y: number): Placement => ({ itemId: 'jeans', orientation: o, x, y })
    expect(place(start, jeans(0, 0, 0))).toEqual({ ok: false, error: 'out-of-bounds' }) // 6 wide on 5 board
    expect(place(start, jeans(1, 0, 1))).toEqual({ ok: false, error: 'out-of-bounds' }) // 6 tall from y=1
    expect(place(start, jeans(1, -1, 0))).toEqual({ ok: false, error: 'out-of-bounds' })
    expect(place(start, jeans(1, 0, 0)).ok).toBe(true)
  })

  it('rejects overlap and leaves the state unchanged', () => {
    const s = must(place(start, { itemId: 'charger', orientation: 0, x: 0, y: 0 }))
    const r = place(s, { itemId: 'passport', orientation: 0, x: 1, y: 0 })
    expect(r).toEqual({ ok: false, error: 'overlap' })
    expect(s.placements).toHaveLength(1)
  })

  it('rejects unknown and duplicate items', () => {
    expect(place(start, { itemId: 'nope', orientation: 0, x: 0, y: 0 })).toEqual({ ok: false, error: 'unknown-item' })
    const s = must(place(start, { itemId: 'passport', orientation: 0, x: 0, y: 0 }))
    expect(place(s, { itemId: 'passport', orientation: 0, x: 1, y: 0 })).toEqual({ ok: false, error: 'already-placed' })
  })
})

describe('actions', () => {
  const start = createGame(level('01'))
  const p: Placement = { itemId: 'charger', orientation: 0, x: 0, y: 0 }

  it('does not mutate previous states', () => {
    const before = JSON.stringify(start)
    const s1 = must(place(start, p))
    expect(JSON.stringify(start)).toBe(before)
    const snapshot = JSON.stringify(s1)
    must(remove(s1, 'charger'))
    expect(JSON.stringify(s1)).toBe(snapshot)
  })

  it('removes a placed item and rejects removing an unplaced one', () => {
    const s1 = must(place(start, p))
    expect(must(remove(s1, 'charger')).placements).toEqual([])
    expect(remove(start, 'charger')).toEqual({ ok: false, error: 'not-placed' })
  })

  it('rotates a placed item when valid, rejects when it would not fit', () => {
    const s1 = must(place(start, p))
    const r = must(rotatePlaced(s1, 'charger'))
    expect(r.placements[0].orientation).toBe(1)
    const edge = must(place(start, { itemId: 'charger', orientation: 0, x: 3, y: 0 }))
    expect(placementCells(edge.level, edge.placements[0]).map((c) => c.x)).toEqual([3, 4])
    const bottom = must(place(start, { itemId: 'charger', orientation: 0, x: 0, y: 5 }))
    expect(rotatePlaced(bottom, 'charger')).toEqual({ ok: false, error: 'out-of-bounds' })
    expect(rotatePlaced(start, 'charger')).toEqual({ ok: false, error: 'not-placed' })
  })

  it('undoes place, remove and rotate in order, then reports nothing to undo', () => {
    const s1 = must(place(start, p))
    const s2 = must(rotatePlaced(s1, 'charger'))
    const s3 = must(remove(s2, 'charger'))
    const u1 = must(undo(s3))
    expect(u1.placements).toEqual(s2.placements)
    const u2 = must(undo(u1))
    expect(u2.placements).toEqual(s1.placements)
    const u3 = must(undo(u2))
    expect(u3.placements).toEqual([])
    expect(undo(u3)).toEqual({ ok: false, error: 'nothing-to-undo' })
  })

  it('failed actions add no history; reset clears everything', () => {
    const s1 = must(place(start, p))
    place(s1, { itemId: 'passport', orientation: 0, x: 0, y: 0 })
    expect(s1.history).toHaveLength(1)
    const r = reset(s1)
    expect(r.placements).toEqual([])
    expect(r.history).toEqual([])
  })
})

describe('win predicate', () => {
  const solved = (l: Level, withBonus = true): GameState => {
    let s = createGame(l)
    const sol = solutions[l.id as keyof typeof solutions] as [string, number, number, number][]
    for (const [id, rotIndex, x, y] of sol) {
      if (!withBonus && !item(l, id).required) continue
      // fixture rotation index counts distinct shapes; map back to quarter turns
      const orientation = uniqueRotations(item(l, id).cells)[rotIndex].orientation
      s = must(place(s, { itemId: id, orientation, x, y }))
    }
    return s
  }

  it.each(['01', '02', '03'])('level %s: solver layout is a win (every cell in bounds, no overlap)', (id) => {
    const l = level(id)
    const s = solved(l)
    expect(isWon(s)).toBe(true)
    const all = s.placements.flatMap((p) => placementCells(l, p))
    expect(new Set(all.map((c) => `${c.x},${c.y}`)).size).toBe(all.length)
  })

  it('level 1 needs rotation: the solver layout rotates jeans, and unrotated jeans never fit', () => {
    const l = level('01')
    expect(solved(l).placements.find((p) => p.itemId === 'jeans')!.orientation).not.toBe(0)
    expect(place(createGame(l), { itemId: 'jeans', orientation: 0, x: 0, y: 0 })).toMatchObject({ ok: false })
  })

  it('optional maxima from the reference verifier: L2 = 2, L3 = 2', () => {
    expect(optionalPlacedCount(solved(level('02')))).toBe(2)
    expect(optionalPlacedCount(solved(level('03')))).toBe(2)
  })

  it('is not won while a required item is missing', () => {
    const s = solved(level('01'))
    expect(isWon(must(remove(s, 'passport')))).toBe(false)
    expect(isWon(createGame(level('01')))).toBe(false)
  })

  it('is not won when over the weight limit, even with all required items placed', () => {
    const l = level('02') // 6x5 board, limit 15 kg; required items weigh 10
    const s = solved(l, false)
    expect(isWon(s)).toBe(true)
    const heavy = must(place(must(place(s, { itemId: 'disco_ball', orientation: 0, x: 4, y: 1 })), { itemId: 'extra_shoes', orientation: 0, x: 0, y: 2 }))
    expect(totalWeight(heavy)).toBe(17)
    expect(isWon(heavy)).toBe(false)
  })

  it('optional items do not affect winning', () => {
    expect(isWon(solved(level('02'), false))).toBe(true)
  })
})

describe('interaction helpers', () => {
  const l = level('01')
  const start = createGame(l)

  it('previews validity and ignores the item\'s own current spot', () => {
    const s = must(place(start, { itemId: 'charger', orientation: 0, x: 0, y: 0 }))
    expect(previewPlacement(s, 'charger', 0, 1, 0).error).toBeNull() // overlaps only itself
    expect(previewPlacement(s, 'passport', 0, 1, 0).error).toBe('overlap')
    expect(previewPlacement(s, 'passport', 0, 5, 0).error).toBe('out-of-bounds')
    expect(previewPlacement(s, 'passport', 0, 5, 0).cells).toEqual([{ x: 5, y: 0 }])
  })

  it('computes rotated bounds and clamps origins onto the board', () => {
    expect(itemBounds(l, 'jeans', 0)).toEqual({ width: 6, height: 1 })
    expect(itemBounds(l, 'jeans', 1)).toEqual({ width: 1, height: 6 })
    expect(clampOrigin(l, 'jeans', 1, 9, 9)).toEqual({ x: 4, y: 0 })
    expect(clampOrigin(l, 'passport', 0, -3, 99)).toEqual({ x: 0, y: 5 })
  })

  it('moves a placed item as a single undo step; unchanged commit adds no history', () => {
    const s1 = must(place(start, { itemId: 'charger', orientation: 0, x: 0, y: 0 }))
    const s2 = must(commitPlacement(s1, { itemId: 'charger', orientation: 1, x: 3, y: 2 }))
    expect(s2.placements).toEqual([{ itemId: 'charger', orientation: 1, x: 3, y: 2 }])
    expect(s2.history).toHaveLength(2)
    expect(must(undo(s2)).placements).toEqual(s1.placements)
    expect(must(commitPlacement(s2, s2.placements[0])).history).toHaveLength(2)
    expect(commitPlacement(s2, { itemId: 'charger', orientation: 0, x: 4, y: 0 })).toEqual({ ok: false, error: 'out-of-bounds' })
  })
})

describe('weight limit affects completion, not placement', () => {
  it('allows over-limit placements, reports the excess, and wins again once back under', () => {
    const l = level('02') // 6x5 board, limit 15 kg
    const put = (s: GameState, id: string, x: number, y: number) => must(place(s, { itemId: id, orientation: 0, x, y }))
    let s = createGame(l)
    s = put(s, 'toiletries', 0, 0)
    s = put(s, 'outfit', 2, 0)
    s = put(s, 'dvd', 0, 3)
    s = put(s, 'charger', 3, 3)
    s = put(s, 'passport', 5, 0)
    expect(totalWeight(s)).toBe(10)
    expect(isWon(s)).toBe(true)
    s = put(s, 'disco_ball', 4, 1) // +4 = 14, still legal and won
    expect(isWon(s)).toBe(true)
    s = put(s, 'extra_shoes', 0, 2) // +3 = 17 > 15: placement allowed, win is not
    expect(totalWeight(s)).toBe(17)
    expect(isOverWeight(s)).toBe(true)
    expect(isWon(s)).toBe(false)
    s = must(remove(s, 'extra_shoes'))
    expect(isOverWeight(s)).toBe(false)
    expect(isWon(s)).toBe(true)
  })

  it('pins the approved configuration: L2 is 6x5 at 15 kg, L1 and L3 unchanged', () => {
    const dims = (id: string) => {
      const l = level(id)
      return [l.width, l.height, l.weightLimit]
    }
    expect(dims('01')).toEqual([5, 6, undefined])
    expect(dims('02')).toEqual([6, 5, 15])
    expect(dims('03')).toEqual([6, 5, 24])
  })

  it('Level 2 max-bonus layout is a win at exactly the limit (15 kg)', () => {
    const s = (() => {
      let g = createGame(level('02'))
      const sol = solutions['02'] as [string, number, number, number][]
      for (const [id, rot, x, y] of sol) {
        g = must(place(g, { itemId: id, orientation: uniqueRotations(item(level('02'), id).cells)[rot].orientation, x, y }))
      }
      return g
    })()
    expect(totalWeight(s)).toBe(15)
    expect(isWon(s)).toBe(true)
    expect(optionalPlacedCount(s)).toBe(2)
  })
})
