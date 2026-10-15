import { describe, expect, it } from 'vitest'
import { loadLevels, uniqueRotations, type Item } from '../engine'
import { TRAY_LAYOUTS } from './trayLayout'

// Regression: the tray was a flex-wrap flow, so rotating an item (jeans) resized its slot,
// reflowed the panel and shifted the page. Slots are now fixed per level, and the cells an item
// can occupy in any rotation (anchored top-left in its slot) never collide with another item's.
const levels = loadLevels()
const footprint = (item: Item, col: number, row: number) =>
  uniqueRotations(item.cells).flatMap(({ shape }) => shape.map((c) => `${col + c.x},${row + c.y}`))
const box = (item: Item) => Math.max(...item.cells.map((c) => c.x), ...item.cells.map((c) => c.y)) + 1

describe.each(Object.keys(TRAY_LAYOUTS))('tray layout for level %s', (id) => {
  const layout = TRAY_LAYOUTS[id]
  const level = levels.find((l) => l.id === id)!

  it('has exactly one slot per level item, with no stray slots', () => {
    expect(Object.keys(layout.slots).sort()).toEqual(level.items.map((i) => i.id).sort())
  })

  it('keeps every item and every rotation inside the fixed grid', () => {
    for (const item of level.items) {
      const { col, row } = layout.slots[item.id]
      expect(col).toBeGreaterThanOrEqual(1)
      expect(row).toBeGreaterThanOrEqual(1)
      expect(col + box(item) - 1, `${item.id} right edge`).toBeLessThanOrEqual(layout.cols)
      expect(row + box(item) - 1, `${item.id} bottom edge`).toBeLessThanOrEqual(layout.rows)
    }
  })

  it('never lets two items share a cell in any combination of rotations', () => {
    const owner = new Map<string, string>()
    for (const item of level.items) {
      const { col, row } = layout.slots[item.id]
      for (const cell of new Set(footprint(item, col, row))) {
        expect(owner.get(cell), `${item.id} collides with ${owner.get(cell)} at ${cell}`).toBeUndefined()
        owner.set(cell, item.id)
      }
    }
  })

  it('is not wastefully large: at most 1.5x the cells the items can ever cover', () => {
    const used = new Set(
      level.items.flatMap((i) => footprint(i, layout.slots[i.id].col, layout.slots[i.id].row)),
    ).size
    expect(layout.cols * layout.rows).toBeLessThanOrEqual(used * 1.5 + 8)
  })
})
