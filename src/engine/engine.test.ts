import { describe, expect, it } from 'vitest'
import solutions from './solutions.fixture.json'
import explorerData from '../dev/explorer.fixture.json'
import {
  canAddAny,
  createGame,
  isOverWeight,
  isPerfect,
  isWon,
  loadLevels,
  normalize,
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
  totalChaos,
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
const explorer = explorerData as unknown as Record<string, { examples: { weight: number; placements: unknown[] }[] }>
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
  const solved = (l: Level, kind: 'perfect' | 'normal' = 'perfect'): GameState => {
    let s = createGame(l)
    const sol = solutions[l.id as keyof typeof solutions][kind] as [string, number, number, number][]
    for (const [id, rotIndex, x, y] of sol) {
      // fixture rotation index counts distinct shapes; map back to quarter turns
      const orientation = uniqueRotations(item(l, id).cells)[rotIndex].orientation
      s = must(place(s, { itemId: id, orientation, x, y }))
    }
    return s
  }
  const pack = (l: Level, rows: [string, number, number, number][]): GameState =>
    rows.reduce((g, [id, rot, x, y]) => must(place(g, { itemId: id, orientation: uniqueRotations(item(l, id).cells)[rot].orientation, x, y })), createGame(l))

  it.each(['01', '02', '03'])('level %s: the solver layouts are wins (every cell in bounds, no overlap)', (id) => {
    const l = level(id)
    for (const kind of ['normal', 'perfect'] as const) {
      const s = solved(l, kind)
      expect(isWon(s), `${id} ${kind}`).toBe(true)
      const all = s.placements.flatMap((p) => placementCells(l, p))
      expect(new Set(all.map((c) => `${c.x},${c.y}`)).size).toBe(all.length)
    }
  })

  it('level 1 needs rotation: the solver layout rotates jeans, and unrotated jeans never fit', () => {
    const l = level('01')
    expect(solved(l).placements.find((p) => p.itemId === 'jeans')!.orientation).not.toBe(0)
    expect(place(createGame(l), { itemId: 'jeans', orientation: 0, x: 0, y: 0 })).toMatchObject({ ok: false })
  })

  it('Chaos levels: a normal win reaches the target without being perfect; the perfect layout reaches the maximum', () => {
    for (const [id, target, perfect] of [['02', 20, 25], ['03', 24, 29]] as const) {
      const l = level(id)
      expect([l.target, l.perfect]).toEqual([target, perfect])
      const normal = solved(l, 'normal')
      expect(totalChaos(normal)).toBeGreaterThanOrEqual(target)
      expect(totalChaos(normal)).toBeLessThan(perfect)
      expect(isWon(normal)).toBe(true)
      expect(isPerfect(normal)).toBe(false)
      const best = solved(l, 'perfect')
      expect(totalChaos(best)).toBe(perfect)
      expect(isPerfect(best)).toBe(true)
    }
    expect(isPerfect(solved(level('01')))).toBe(false) // Level 1 has no Chaos and no perfect score
  })

  it('is not won below the Chaos target, however light or tidy the pack (Level 2 has nothing mandatory)', () => {
    const l = level('02')
    expect(isWon(createGame(l))).toBe(false)
    const perfect = solved(l)
    let g = perfect
    while (totalChaos(g) >= 20) g = must(remove(g, g.placements[g.placements.length - 1].itemId))
    expect(totalChaos(g)).toBeLessThan(20)
    expect(isWon(g)).toBe(false)
    expect(isWon(must(undo(g)))).toBe(true) // undo brings the winning pack back
  })

  it('is not won while a mandatory item is missing, even with plenty of Chaos (Level 3)', () => {
    const l = level('03')
    const s = solved(l)
    expect(isWon(must(remove(s, 'painting')))).toBe(false)
    expect(isWon(must(remove(s, 'laundry')))).toBe(false)
    expect(isWon(createGame(level('01')))).toBe(false)
    expect(isWon(must(remove(solved(level('01')), 'charger')))).toBe(false)
  })

  it('is not won when over the allowance, even when the Chaos target is reached', () => {
    // Level 2: handbag + outfit + toiletries + flamingo + DVDs reach exactly 20 Chaos, fit the board and weigh 6,650 g (150 g over).
    const l2 = level('02')
    const g = pack(l2, [['handbag', 0, 0, 0], ['flamingo', 0, 3, 0], ['dvds', 0, 4, 2], ['outfit', 3, 2, 2], ['toiletries', 0, 0, 3]])
    expect(totalChaos(g)).toBe(20)
    expect(totalWeight(g)).toBe(6650)
    expect(isOverWeight(g)).toBe(true)
    expect(isWon(g)).toBe(false)
    expect(isWon(must(remove(g, 'toiletries')))).toBe(false) // 19 Chaos now: still not a win, for the other reason
  })

  it('canAddAny reports whether anything unpacked still fits (the "suitcase is full" hint)', () => {
    const l2 = level('02')
    expect(canAddAny(createGame(l2))).toBe(true)
    expect(canAddAny(solved(l2))).toBe(false) // the perfect pack leaves no room for anything else
    expect(canAddAny(solved(level('01')))).toBe(false) // nothing is left to add
    const light = pack(l2, [['vibrator', 0, 0, 0]])
    expect(canAddAny(light)).toBe(true)
  })
})

describe('Level 1 Chaos is display-only', () => {
  const l1 = level('01')
  const all = solutions['01'].perfect as [string, number, number, number][]

  it('gives every item a Chaos value, total 9, and no target or perfect score', () => {
    expect(Object.fromEntries(l1.items.map((i) => [i.id, i.chaos]))).toEqual({ shirt: 2, jeans: 2, shoes: 3, toiletries: 1, charger: 1 })
    expect(l1.target).toBeUndefined()
    expect(l1.perfect).toBeUndefined()
  })

  it('is won exactly when all five are packed, whatever the Chaos total says, and is never perfect', () => {
    let s = createGame(l1)
    const totals: number[] = []
    for (const [id, rotIndex, x, y] of all) {
      expect(isWon(s)).toBe(false)
      s = must(place(s, { itemId: id, orientation: uniqueRotations(item(l1, id).cells)[rotIndex].orientation, x, y }))
      totals.push(totalChaos(s))
    }
    expect(isWon(s)).toBe(true)
    expect(isPerfect(s)).toBe(false)
    expect(totals[totals.length - 1]).toBe(9)
    expect([...totals].sort((a, b) => a - b)).toEqual(totals) // the total only ever climbs while packing
  })

  it('shares Chaos values with later levels (toiletries is worth 1 everywhere)', () => {
    expect(item(level('01'), 'toiletries').chaos).toBe(item(level('02'), 'toiletries').chaos)
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
  // Level 3: the heaviest solver-verified normal win weighs 20,450 g, 50 g under the 20.5 kg allowance.
  const heaviest = explorer['03'].examples.reduce((a, b) => (b.weight > a.weight ? b : a))
  const build = (id: string, rows: [string, number, number, number][]): GameState => {
    const l = level(id)
    return rows.reduce((g, [i, rot, x, y]) => must(place(g, { itemId: i, orientation: orient(l, i, rot), x, y })), createGame(l))
  }

  it('the heaviest verified Level 3 win fits under the 20.5 kg allowance and wins, and still wins with the limit lowered to exactly its weight', () => {
    const g = build('03', heaviest.placements as [string, number, number, number][])
    expect(totalWeight(g)).toBe(heaviest.weight)
    expect(g.level.weightLimit).toBe(20500)
    expect(isOverWeight(g)).toBe(false)
    expect(totalChaos(g)).toBeGreaterThanOrEqual(24)
    expect(isWon(g)).toBe(true)
    expect(isWon({ ...g, level: { ...g.level, weightLimit: heaviest.weight } })).toBe(true) // exactly the allowance still wins
  })

  it('one gram over the allowance is not a win, even though the Chaos target is reached', () => {
    const g = build('03', heaviest.placements as [string, number, number, number][])
    const over = { ...g, level: { ...g.level, weightLimit: heaviest.weight - 1 } }
    expect(totalChaos(over)).toBeGreaterThanOrEqual(24)
    expect(isOverWeight(over)).toBe(true)
    expect(isWon(over)).toBe(false)
  })

  it('Level 2 with its allowance lowered by 1 g loses a layout that exactly fits', () => {
    const l2 = level('02')
    const g = build('02', solutions['02'].perfect as [string, number, number, number][])
    const w = totalWeight(g)
    expect(isWon({ ...g, level: { ...l2, weightLimit: w } })).toBe(true)
    expect(isWon({ ...g, level: { ...l2, weightLimit: w - 1 } })).toBe(false)
  })

  it('pins the approved configuration: boards, allowances in grams, targets, mandatory and selectable counts', () => {
    const shape = (id: string) => {
      const l = level(id)
      return [l.width, l.height, l.weightLimit, l.target, l.perfect, l.items.filter((i) => i.required).length, l.items.filter((i) => !i.required).length]
    }
    expect(shape('01')).toEqual([5, 6, undefined, undefined, undefined, 5, 0])
    expect(shape('02')).toEqual([6, 5, 6500, 20, 25, 0, 10])
    expect(shape('03')).toEqual([7, 6, 20500, 24, 29, 2, 10])
  })

  it('pins every item: weight in grams, Chaos value and mandatory flag', () => {
    const table = (id: string) => Object.fromEntries(level(id).items.map((i) => [i.id, [i.weight, i.chaos, i.required ? 'must' : 'pick']]))
    expect(table('02')).toEqual({
      handbag: [2250, 6, 'pick'], outfit: [900, 2, 'pick'], toiletries: [1000, 1, 'pick'], flamingo: [1000, 5, 'pick'], vibrator: [400, 3, 'pick'],
      frame: [1000, 3, 'pick'], boa: [300, 3, 'pick'], ringlight: [800, 2, 'pick'], disco_ball: [1500, 4, 'pick'], dvds: [1500, 6, 'pick'],
    })
    expect(table('03')).toEqual({
      painting: [4000, 0, 'must'], laundry: [5000, 0, 'must'], outfit: [900, 2, 'pick'], hangover: [800, 3, 'pick'], heels: [1300, 3, 'pick'],
      hotel_lamp: [3600, 3, 'pick'], ceramic_foot: [3600, 7, 'pick'], gnome: [6500, 9, 'pick'], cheese: [2800, 5, 'pick'], liquor: [1500, 5, 'pick'],
      robe: [1300, 4, 'pick'], emergency_socks: [150, 3, 'pick'],
    })
  })

  it('shared items keep one weight in every level and one Chaos value in every Chaos level', () => {
    const weights = new Map<string, Set<number>>()
    const chaos = new Map<string, Set<number>>()
    for (const l of levels)
      for (const i of l.items) {
        weights.set(i.id, (weights.get(i.id) ?? new Set()).add(i.weight))
        if (l.target !== undefined) chaos.set(i.id, (chaos.get(i.id) ?? new Set()).add(i.chaos))
        expect(Number.isInteger(i.weight), `${l.id}/${i.id}`).toBe(true)
      }
    for (const [id, set] of weights) expect(set.size, `${id} has different weights across levels`).toBe(1)
    for (const [id, set] of chaos) expect(set.size, `${id} has different Chaos across levels`).toBe(1)
  })
})
