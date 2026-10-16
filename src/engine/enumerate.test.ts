import { describe, expect, it } from 'vitest'
import { BEST_OPTIONAL } from '../levelMeta'
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
    return { ids: sub.map((i) => i.id).sort(), size: sub.length, weightOk: items.reduce((n, i) => n + i.weight, 0) <= limit, fits: packs(level, items) }
  })
  const legal = rows.filter((r) => r.weightOk && r.fits)
  const best = Math.max(...legal.map((r) => r.size))
  return {
    rows,
    best,
    maxSets: legal.filter((r) => r.size === best).map((r) => r.ids.join('+')).sort(),
    weightTraps: rows.filter((r) => r.size >= 2 && r.fits && !r.weightOk).length,
    spaceTraps: rows.filter((r) => r.size >= 2 && r.weightOk && !r.fits).length,
    legalBySize: (k: number) => legal.filter((r) => r.size === k).length,
  }
}

const levels = loadLevels()
const lv = (id: string) => levels.find((l) => l.id === id)!

describe('independent enumeration of the three levels', () => {
  it('level 1: required items fit, rotation is mandatory, and there is no bonus', () => {
    const l = lv('01')
    expect(packs(l, l.items)).toBe(true)
    expect(packs(l, l.items, false)).toBe(false) // the 6-long jeans can only stand up on a 5-wide board
    expect(BEST_OPTIONAL['01']).toBe(0)
  })

  it('level 2: maximum bonus 3 with eight legal sets; both the allowance and the board genuinely constrain', () => {
    const a = analyse(lv('02'))
    expect(a.best).toBe(3)
    expect(BEST_OPTIONAL['02']).toBe(a.best)
    expect(a.maxSets).toEqual(
      [
        'boa+disco_ball+speaker', 'boa+frame+speaker', 'boa+flamingo+speaker', 'flamingo+ringlight+speaker', 'boa+ringlight+speaker',
        'boa+disco_ball+frame', 'boa+disco_ball+flamingo', 'boa+disco_ball+ringlight',
      ].map((s) => s.split('+').sort().join('+')).sort(),
    )
    expect(a.legalBySize(2)).toBe(15) // every pair fits and is light enough
    expect(a.legalBySize(3)).toBe(8) // of 20 triples
    expect(a.legalBySize(4)).toBe(0)
    expect(a.weightTraps).toBe(5) // fit on the board but over 7 kg
    expect(a.spaceTraps).toBe(6) // within 7 kg but cannot be packed
  })

  it('level 3: maximum bonus 5 with exactly three legal "perfect pack" sets; weight and space both bind', () => {
    const a = analyse(lv('03'))
    expect(a.best).toBe(5)
    expect(BEST_OPTIONAL['03']).toBe(a.best)
    expect(a.maxSets).toEqual(
      ['hotel_lamp+ceramic_foot+liquor+robe+emergency_socks', 'hotel_lamp+cheese+liquor+robe+emergency_socks', 'ceramic_foot+cheese+liquor+robe+emergency_socks']
        .map((s) => s.split('+').sort().join('+')).sort(),
    )
    expect(a.legalBySize(4)).toBe(17)
    expect(a.legalBySize(3)).toBe(29) // of 35 triples
    expect(a.weightTraps).toBe(23)
    expect(a.spaceTraps).toBe(0)
  })

  it('the bonus never requires anything: every level is completable with required items only', () => {
    for (const l of levels) {
      const required = l.items.filter((i) => i.required)
      expect(packs(l, required), `level ${l.id} required items fit`).toBe(true)
      expect(required.reduce((n, i) => n + i.weight, 0)).toBeLessThanOrEqual(l.weightLimit ?? Infinity)
    }
  })
})
