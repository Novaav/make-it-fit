import { describe, expect, it } from 'vitest'
import { createGame, loadLevels, place, rotate, type GameState, type Item, type Level, type Orientation, type Placement } from './engine'
import { failureMessage, isScored, itemName, itemSummary, reasonText, scoreAnnouncement, statusNote, weightChipAnchor } from './status'

// A tiny level of two 1x1 items on a 2x1 board, so every sentence can be checked exactly.
const level = (over: Partial<Level> = {}): Level => ({
  id: 'T1',
  width: 2,
  height: 1,
  weightLimit: 1000,
  target: 2,
  perfect: 3,
  items: [
    { id: 'shirt', cells: [{ x: 0, y: 0 }], weight: 600, required: false, chaos: 2 },
    { id: 'jeans', cells: [{ x: 0, y: 0 }], weight: 500, required: false, chaos: 1 },
  ],
  ...over,
})
const at = (itemId: string, x: number): Placement => ({ itemId, orientation: 0, x, y: 0 })
const pack = (lv: Level, ...ps: Placement[]): GameState =>
  ps.reduce((g, p) => {
    const r = place(g, p)
    if (!r.ok) throw new Error(`could not place ${p.itemId}: ${r.error}`)
    return r.state
  }, createGame(lv))

describe('scoreAnnouncement', () => {
  it('says nothing on a level that shows no Chaos', () => {
    const lv = level({ items: level().items.map((i) => ({ ...i, chaos: 0 })), target: undefined, perfect: undefined })
    expect(isScored(lv)).toBe(false)
    expect(scoreAnnouncement(pack(lv, at('shirt', 0)))).toBe('')
  })
  it('reports Chaos against the target, the weight left and a win', () => {
    expect(scoreAnnouncement(pack(level(), at('shirt', 0)))).toBe(' Chaos 2 of 2. 400 g left. That wins the level.')
  })
  it('reports the weight over the allowance', () => {
    expect(scoreAnnouncement(pack(level(), at('shirt', 0), at('jeans', 1)))).toBe(' Chaos 3 of 2. Over the allowance by 100 g.')
  })
  it('announces a perfect pack', () => {
    expect(scoreAnnouncement(pack(level({ weightLimit: 2000 }), at('shirt', 0), at('jeans', 1)))).toBe(' Chaos 3 of 2. 900 g left. Perfect pack!')
  })
  it('leaves out the target and the weight on a level with neither (nothing mandatory, so any pack wins)', () => {
    expect(scoreAnnouncement(pack(level({ target: undefined, perfect: undefined, weightLimit: undefined }), at('shirt', 0)))).toBe(' Chaos 2. That wins the level.')
  })
})

describe('statusNote', () => {
  it('is empty before anything is packed', () => {
    expect(statusNote(createGame(level({ items: level().items.map((i, n) => ({ ...i, required: n === 0 })) })))).toBe('')
  })
  it('names the mandatory items that are still missing', () => {
    const lv = level({ items: level().items.map((i, n) => ({ ...i, required: n === 0 })), target: 9 })
    expect(statusNote(pack(lv, at('jeans', 0)))).toBe(`Still to pack: ${itemName('shirt')}.`)
  })
  it('warns when over the weight allowance, before anything else', () => {
    expect(statusNote(pack(level(), at('shirt', 0), at('jeans', 1)))).toBe('Over the allowance by 100 g — take something out.')
  })
  it('says when the suitcase is full but the target is not reached', () => {
    expect(statusNote(pack(level({ target: 9, weightLimit: 5000 }), at('shirt', 0), at('jeans', 1)))).toBe('Suitcase full at 3 Chaos. Swap something for more Chaos.')
  })
  it('is empty on a win, and on a level without a Chaos target while the case is not full', () => {
    expect(statusNote(pack(level(), at('shirt', 0)))).toBe('')
    expect(statusNote(pack(level({ target: undefined, perfect: undefined, weightLimit: 5000 }), at('shirt', 0), at('jeans', 1)))).toBe('')
  })
})

describe('itemSummary, failureMessage and weightChipAnchor', () => {
  const lv = level()
  it('summarises Chaos and weight, or marks a mandatory item without Chaos', () => {
    expect(itemSummary(lv, lv.items[0])).toBe(' Chaos 2, 600 g.')
    expect(itemSummary(level({ weightLimit: undefined }), lv.items[0])).toBe(' Chaos 2.')
    expect(itemSummary(lv, { ...lv.items[0], required: true, chaos: 0 })).toBe(' Mandatory, 600 g.')
    const bare = level({ weightLimit: undefined, target: undefined, perfect: undefined, items: lv.items.map((i) => ({ ...i, chaos: 0 })) })
    expect(itemSummary(bare, bare.items[0])).toBe('')
  })
  it('explains a refused move in words', () => {
    expect(failureMessage('overlap')).toBe("Can't do that: it overlaps another item.")
    expect(reasonText('out-of-bounds')).toBe('it sticks out of the suitcase')
  })
  it('anchors the weight chip on a cell the item covers (bottom-most, then right-most) in every orientation', () => {
    const items = loadLevels().flatMap((l) => l.items)
    const covered = (cells: readonly { x: number; y: number }[], a: { x: number; y: number }) => cells.some((c) => c.x === a.x && c.y === a.y)
    for (const item of items) {
      for (const o of [0, 1, 2, 3] as Orientation[]) {
        const a = weightChipAnchor(item, o)
        expect(a).toBeDefined()
        // the anchor is a real cell of the rotated item: no cell lies below it, and none to its right on the same row
        const cells = item.cells.length ? weightCells(item, o) : []
        expect(covered(cells, a), `${item.id} at ${o}`).toBe(true)
        expect(cells.every((c) => c.y <= a.y && (c.y < a.y || c.x <= a.x))).toBe(true)
      }
    }
  })
  it('uses a T shape to show why the bounding-box corner is wrong', () => {
    const tee = { id: 't', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }], weight: 1, required: false, chaos: 0 }
    expect(weightChipAnchor(tee, 0)).toEqual({ x: 1, y: 1 })
  })
})

function weightCells(item: Item, o: Orientation) {
  return rotate(item.cells, o)
}
