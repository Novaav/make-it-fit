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
    expect(place(start, { itemId: 'charger', orientation: 0, x: 3, y: 5 }).ok).toBe(true)
  })

  it('rejects out of bounds (edges and negatives)', () => {
    const jeans = (o: Orientation, x: number, y: number): Placement => ({ itemId: 'jeans', orientation: o, x, y })
    expect(place(start, jeans(0, 0, 0))).toEqual({ ok: false, error: 'out-of-bounds' }) // 6 wide on 5 board
    expect(place(start, jeans(1, 0, 1))).toEqual({ ok: false, error: 'out-of-bounds' }) // 6 tall from y=1
    expect(place(start, jeans(1, -1, 0))).toEqual({ ok: false, error: 'out-of-bounds' })
    expect(place(start, jeans(1, 0, 0)).ok).toBe(true)
  })

  it('rejects overlap and leaves the state unchanged', () => {
    const s = must(place(start, { itemId: 'shirt', orientation: 0, x: 0, y: 0 }))
    const r = place(s, { itemId: 'charger', orientation: 0, x: 1, y: 0 }) // the shirt's top row spans x 0-2
    expect(r).toEqual({ ok: false, error: 'overlap' })
    expect(s.placements).toHaveLength(1)
  })

  it('rejects unknown and duplicate items', () => {
    expect(place(start, { itemId: 'nope', orientation: 0, x: 0, y: 0 })).toEqual({ ok: false, error: 'unknown-item' })
    const s = must(place(start, { itemId: 'charger', orientation: 0, x: 0, y: 0 }))
    expect(place(s, { itemId: 'charger', orientation: 0, x: 0, y: 2 })).toEqual({ ok: false, error: 'already-placed' })
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
    place(s1, { itemId: 'charger', orientation: 0, x: 0, y: 0 })
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

  it('optional maxima from the reference verifier: L2 = 3, L3 = 5', () => {
    expect(optionalPlacedCount(solved(level('02')))).toBe(3)
    expect(optionalPlacedCount(solved(level('03')))).toBe(5)
  })

  it('is not won while a required item is missing', () => {
    const s = solved(level('01'))
    expect(isWon(must(remove(s, 'charger')))).toBe(false)
    expect(isWon(createGame(level('01')))).toBe(false)
  })

  it('is not won when over the allowance, even with all required items placed', () => {
    const l = level('02') // 6x5 board, allowance 7000 g; required items weigh 3600 g
    expect(isWon(solved(l, false))).toBe(true)
    // A verified packing of the required items + speaker + disco ball + ring light: it fits the board but weighs 7400 g.
    const OVER: [string, number, number, number][] = [
      ['heels', 0, 0, 0], ['ringlight', 0, 3, 0], ['outfit', 1, 1, 1], ['toiletries', 0, 2, 3],
      ['disco_ball', 0, 4, 3], ['vibrator', 1, 0, 2], ['speaker', 1, 3, 1],
    ]
    let g = createGame(l)
    for (const [id, rot, x, y] of OVER) g = must(place(g, { itemId: id, orientation: uniqueRotations(item(l, id).cells)[rot].orientation, x, y }))
    expect(totalWeight(g)).toBe(7400)
    expect(isOverWeight(g)).toBe(true)
    expect(isWon(g)).toBe(false)
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
    expect(previewPlacement(s, 'shirt', 0, 1, 0).error).toBe('overlap')
    expect(previewPlacement(s, 'charger', 1, 5, 0).error).toBe('out-of-bounds')
    expect(previewPlacement(s, 'charger', 1, 5, 0).cells).toEqual([{ x: 5, y: 0 }, { x: 5, y: 1 }])
  })

  it('computes rotated bounds and clamps origins onto the board', () => {
    expect(itemBounds(l, 'jeans', 0)).toEqual({ width: 6, height: 1 })
    expect(itemBounds(l, 'jeans', 1)).toEqual({ width: 1, height: 6 })
    expect(clampOrigin(l, 'jeans', 1, 9, 9)).toEqual({ x: 4, y: 0 })
    expect(clampOrigin(l, 'charger', 1, -3, 99)).toEqual({ x: 0, y: 4 })
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

describe('allowance: placing is always allowed, completion needs total weight at most the allowance', () => {
  const orient = (l: Level, id: string, rot: number) => uniqueRotations(item(l, id).cells)[rot].orientation
  // Level 3: all required items + gnome + ceramic foot + bathrobe weigh exactly 23,000 g (a verified packing).
  const EXACT: [string, number, number, number][] = [
    ['cutout', 0, 0, 0], ['laundry', 0, 5, 0], ['gnome', 1, 5, 2], ['heels', 0, 0, 4],
    ['ceramic_foot', 0, 3, 4], ['robe', 0, 0, 1], ['outfit', 3, 3, 1], ['hangover', 0, 6, 4],
  ]
  const exact = (): GameState => {
    const l = level('03')
    let g = createGame(l)
    for (const [id, rot, x, y] of EXACT) g = must(place(g, { itemId: id, orientation: orient(l, id, rot), x, y }))
    return g
  }

  it('a real packing that weighs exactly the 23 kg allowance wins', () => {
    const g = exact()
    expect(totalWeight(g)).toBe(23000)
    expect(g.level.weightLimit).toBe(23000)
    expect(isOverWeight(g)).toBe(false)
    expect(isWon(g)).toBe(true)
  })

  it('a packing that fits the board but weighs 25,300 g is placeable, not a win, and wins again once the 6,500 g gnome is out', () => {
    const l = level('03')
    // required items + gnome + ceramic foot + hotel lamp: spatially valid, over the 23,000 g allowance
    const OVER: [string, number, number, number][] = [
      ['cutout', 0, 0, 0], ['laundry', 0, 5, 0], ['gnome', 0, 6, 3], ['heels', 0, 0, 4],
      ['ceramic_foot', 0, 3, 4], ['outfit', 1, 0, 1], ['hangover', 0, 3, 1], ['hotel_lamp', 1, 5, 2],
    ]
    let over = createGame(l)
    for (const [id, rot, x, y] of OVER) over = must(place(over, { itemId: id, orientation: orient(l, id, rot), x, y }))
    expect(totalWeight(over)).toBe(25300)
    expect(isOverWeight(over)).toBe(true)
    expect(isWon(over)).toBe(false)
    const lighter = must(remove(over, 'gnome'))
    expect(totalWeight(lighter)).toBe(18800)
    expect(isWon(lighter)).toBe(true)
    expect(isWon(must(undo(lighter)))).toBe(false) // undo puts the gnome back: over again
  })

  it('level 2 with its allowance lowered by 1 g loses a layout that exactly fits', () => {
    const l2 = level('02')
    const g = solvedLayout(l2, true)
    const w = totalWeight(g)
    expect(isWon({ ...g, level: { ...l2, weightLimit: w } })).toBe(true)
    expect(isWon({ ...g, level: { ...l2, weightLimit: w - 1 } })).toBe(false)
  })

  it('pins the approved configuration: boards, allowances in grams, required/optional counts', () => {
    const shape = (id: string) => {
      const l = level(id)
      return [l.width, l.height, l.weightLimit, l.items.filter((i) => i.required).length, l.items.filter((i) => !i.required).length]
    }
    expect(shape('01')).toEqual([5, 6, undefined, 5, 0])
    expect(shape('02')).toEqual([6, 5, 7000, 4, 6])
    expect(shape('03')).toEqual([8, 6, 23000, 5, 7])
  })

  it('shared items keep one weight in every level', () => {
    const weights = new Map<string, Set<number>>()
    for (const l of levels) for (const i of l.items) weights.set(i.id, (weights.get(i.id) ?? new Set()).add(i.weight))
    for (const [id, set] of weights) expect(set.size, `${id} has different weights across levels`).toBe(1)
    for (const l of levels) for (const i of l.items) expect(Number.isInteger(i.weight), `${l.id}/${i.id}`).toBe(true)
  })
})

function solvedLayout(l: Level, withBonus: boolean): GameState {
  let s = createGame(l)
  const sol = solutions[l.id as keyof typeof solutions] as [string, number, number, number][]
  for (const [id, rotIndex, x, y] of sol) {
    if (!withBonus && !l.items.find((i) => i.id === id)!.required) continue
    s = must(place(s, { itemId: id, orientation: uniqueRotations(l.items.find((i) => i.id === id)!.cells)[rotIndex].orientation, x, y }))
  }
  return s
}
