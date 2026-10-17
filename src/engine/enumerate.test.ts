import { describe, expect, it } from 'vitest'
import { loadLevels, uniqueRotations, type Item, type Level } from './index'

/**
 * Independent re-derivation of the puzzle maths with the TypeScript engine's own shape and rotation code
 * (not the Python solver): every subset of optional items is tested for weight and, separately, for whether
 * it can be packed on the board. If the level data or BEST_OPTIONAL drift, this fails.
 */
function packs(level: Level, items: readonly Item[], allowRotation = true): boolean {
  const W = level.width
  const H = level.height
  if (items.reduce((n, i) => n + i.cells.length, 0) > W * H) return false
  const ordered = [...items].sort((a, b) => b.cells.length - a.cells.length)
  const options = ordered.map((item) => {
    const masks: bigint[] = []
    const rotations = uniqueRotations(item.cells)
    for (const { shape } of allowRotation ? rotations : rotations.slice(0, 1)) {
      const w = Math.max(...shape.map((c) => c.x)) + 1
      const h = Math.max(...shape.map((c) => c.y)) + 1
      for (let oy = 0; oy + h <= H; oy++)
        for (let ox = 0; ox + w <= W; ox++) masks.push(shape.reduce((m, c) => m | (1n << BigInt((oy + c.y) * W + ox + c.x)), 0n))
    }
    return masks
  })
  const dead = new Set<string>()
  const go = (k: number, occ: bigint): boolean => {
    if (k === options.length) return true
    const key = `${k}:${occ}`
    if (dead.has(key)) return false
    for (const m of options[k]) if ((occ & m) === 0n && go(k + 1, occ | m)) return true
    dead.add(key)
    return false
  }
  return go(0, 0n)
}

function* subsets<T>(items: readonly T[]): Generator<T[]> {
  for (let mask = 0; mask < 1 << items.length; mask++) yield items.filter((_, i) => mask & (1 << i))
}

function analyse(level: Level) {
  const required = level.items.filter((i) => i.required)
  const optional = level.items.filter((i) => !i.required)
  const limit = level.weightLimit ?? Infinity
  const rows = [...subsets(optional)].map((sub) => {
    const items = [...required, ...sub]
    const mask = sub.reduce((m, i) => m | (1 << optional.indexOf(i)), 0)
    return {
      mask,
      ids: sub.map((i) => i.id).sort(),
      chaos: sub.reduce((n, i) => n + i.chaos, 0),
      weightOk: items.reduce((n, i) => n + i.weight, 0) <= limit,
      fits: packs(level, items),
    }
  })
  const legal = rows.filter((r) => r.weightOk && r.fits)
  const legalMasks = new Set(legal.map((r) => r.mask))
  const perfect = Math.max(...legal.map((r) => r.chaos))
  const chaosOf = (mask: number) => optional.reduce((n, i, k) => n + (mask & (1 << k) ? i.chaos : 0), 0)
  /** Packs items in the given order, keeping each one only if the pack stays legal (weight and space). */
  const greedy = (order: (a: Item, b: Item) => number) => {
    let cur = 0
    for (const item of [...optional].sort(order)) if (legalMasks.has(cur | (1 << optional.indexOf(item)))) cur |= 1 << optional.indexOf(item)
    return chaosOf(cur)
  }
  const cells = (i: Item) => i.cells.length
  return {
    legal,
    perfect,
    optimalSets: legal.filter((r) => r.chaos === perfect).map((r) => r.ids.join('+')).sort(),
    bestIgnoringWeight: Math.max(...rows.filter((r) => r.fits).map((r) => r.chaos)),
    bestIgnoringSpace: Math.max(...rows.filter((r) => r.weightOk).map((r) => r.chaos)),
    passing: (target: number) => legal.filter((r) => r.chaos >= target).length,
    strategies: {
      'highest Chaos first': greedy((a, b) => b.chaos - a.chaos),
      'lowest Chaos first': greedy((a, b) => a.chaos - b.chaos),
      'lightest first': greedy((a, b) => a.weight - b.weight),
      'heaviest first': greedy((a, b) => b.weight - a.weight),
      'smallest first': greedy((a, b) => cells(a) - cells(b)),
      'biggest first': greedy((a, b) => cells(b) - cells(a)),
      'Chaos per kg': greedy((a, b) => b.chaos / b.weight - a.chaos / a.weight),
      'Chaos per cell': greedy((a, b) => b.chaos / cells(b) - a.chaos / cells(a)),
    },
  }
}

const levels = loadLevels()
const lv = (id: string) => levels.find((l) => l.id === id)!

describe('independent enumeration of the three levels (the TypeScript engine against the Python solver)', () => {
  it('level 1: the items fit, rotation is mandatory, and there is no Chaos', () => {
    const l = lv('01')
    expect(packs(l, l.items)).toBe(true)
    expect(packs(l, l.items, false)).toBe(false) // the 6-long jeans can only stand up on a 5-wide board
    expect([l.target, l.perfect]).toEqual([undefined, undefined])
  })

  it('level 2: perfect 25 Chaos with two optimal packs; 20 wins; weight and space both bind', () => {
    const l = lv('02')
    const a = analyse(l)
    expect(a.perfect).toBe(25)
    expect(l.perfect).toBe(a.perfect)
    expect(l.target).toBe(Math.ceil(0.8 * a.perfect)) // the win threshold is 80% of the best possible
    expect(a.optimalSets).toEqual(
      ['handbag+outfit+flamingo+vibrator+boa+dvds', 'handbag+flamingo+vibrator+boa+ringlight+dvds'].map((x) => x.split('+').sort().join('+')).sort(),
    )
    expect(a.legal).toHaveLength(719) // of 1,024 packs, every one a legal pack
    expect(a.passing(20)).toBe(102)
    expect(a.bestIgnoringWeight).toBe(27) // both rules matter: dropping either one raises the best score
    expect(a.bestIgnoringSpace).toBe(26)
  })

  it('level 2: no simple strategy reaches the perfect score, "pack the most chaotic first" wins, ignoring Chaos does not', () => {
    const { strategies: s } = analyse(lv('02'))
    expect(s).toEqual({
      'highest Chaos first': 21, 'lowest Chaos first': 14, 'lightest first': 16, 'heaviest first': 17,
      'smallest first': 21, 'biggest first': 18, 'Chaos per kg': 24, 'Chaos per cell': 22,
    })
    expect(Math.max(...Object.values(s))).toBeLessThan(25)
    expect(s['highest Chaos first']).toBeGreaterThanOrEqual(20)
    for (const dumb of ['lowest Chaos first', 'lightest first', 'heaviest first', 'biggest first'] as const) expect(s[dumb]).toBeLessThan(20)
  })

  it('level 3: perfect 26 Chaos with one optimal pack that leaves room; 21 wins; the gnome is a trap', () => {
    const l = lv('03')
    const a = analyse(l)
    expect(a.perfect).toBe(26)
    expect(l.perfect).toBe(a.perfect)
    expect(l.target).toBe(Math.ceil(0.8 * a.perfect))
    expect(a.optimalSets).toEqual(['hangover+ceramic_foot+cheese+liquor+robe+emergency_socks'].map((x) => x.split('+').sort().join('+')))
    expect(a.legal).toHaveLength(571)
    expect(a.passing(21)).toBe(82)
    expect(a.bestIgnoringWeight).toBe(31)
    expect(a.bestIgnoringSpace).toBe(30)
    // the most chaotic item (the 8-Chaos, 6.5 kg gnome) is in no perfect pack
    expect(a.optimalSets.every((x) => !x.includes('gnome'))).toBe(true)
    const gnome = l.items.find((i) => i.id === 'gnome')!
    expect(Math.max(...l.items.map((i) => i.chaos))).toBe(gnome.chaos)
  })

  it('level 3: no simple strategy reaches the perfect score; only reasoned or Chaos-first play wins', () => {
    const { strategies: s } = analyse(lv('03'))
    expect(s).toEqual({
      'highest Chaos first': 22, 'lowest Chaos first': 16, 'lightest first': 19, 'heaviest first': 18,
      'smallest first': 22, 'biggest first': 18, 'Chaos per kg': 23, 'Chaos per cell': 24,
    })
    expect(Math.max(...Object.values(s))).toBeLessThan(26)
    for (const dumb of ['lowest Chaos first', 'lightest first', 'heaviest first', 'biggest first'] as const) expect(s[dumb]).toBeLessThan(21)
  })

  it('every mandatory item fits together with the lightest pack, and mandatory items carry no Chaos', () => {
    for (const l of levels) {
      const required = l.items.filter((i) => i.required)
      expect(packs(l, required), `level ${l.id} mandatory items fit`).toBe(true)
      expect(required.reduce((n, i) => n + i.weight, 0)).toBeLessThanOrEqual(l.weightLimit ?? Infinity)
      if (l.target !== undefined) for (const i of required) expect(i.chaos).toBe(0)
    }
  })
})
