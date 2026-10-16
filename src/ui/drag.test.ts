import { describe, expect, it } from 'vitest'
import { dragTarget, sameTarget, type DragGeometry } from './drag'
import { pointInRect, pointerToOrigin } from './geometry'

const g: DragGeometry = {
  board: { left: 100, top: 50, width: 250, height: 300 }, // 5×6 board, 50 px cells
  tray: { left: 500, top: 50, width: 300, height: 300 },
  cols: 5,
  rows: 6,
}

describe('dragTarget', () => {
  it('snaps a 1×1 item to the cell under the pointer', () => {
    expect(dragTarget(g, 225, 225, 1, 1, false)).toEqual({ x: 2, y: 3, snapped: true, overTray: false })
  })

  it('centres larger boxes under the pointer (rotated bounds change the origin)', () => {
    expect(dragTarget(g, 200, 125, 2, 1, false)).toMatchObject({ x: 1, y: 1 })
    expect(dragTarget(g, 200, 125, 1, 2, false)).toMatchObject({ x: 2, y: 1 }) // same pointer, rotated item
  })

  it('treats the half-cell margin around the board as snapped, and beyond it as free', () => {
    expect(dragTarget(g, 100 - 25, 200, 1, 1, false).snapped).toBe(true)
    expect(dragTarget(g, 100 - 26, 200, 1, 1, false).snapped).toBe(false)
    expect(dragTarget(g, 350 + 25, 200, 1, 1, false).snapped).toBe(true)
    expect(dragTarget(g, 350 + 26, 200, 1, 1, false).snapped).toBe(false)
  })

  it('reports the tray only for items that come from the board', () => {
    expect(dragTarget(g, 600, 200, 1, 1, true).overTray).toBe(true)
    expect(dragTarget(g, 600, 200, 1, 1, false).overTray).toBe(false)
    expect(dragTarget(g, 400, 200, 1, 1, true).overTray).toBe(false)
  })

  it('is exactly the composition of the original helpers for any pointer position', () => {
    for (let px = 0; px < 900; px += 37) {
      for (let py = 0; py < 420; py += 29) {
        for (const [w, h] of [[1, 1], [2, 1], [1, 6], [3, 2], [5, 5]] as const) {
          const o = pointerToOrigin(px, py, g.board, g.cols, g.rows, w, h)
          expect(dragTarget(g, px, py, w, h, true)).toEqual({
            ...o,
            snapped: pointInRect(px, py, g.board, 25),
            overTray: pointInRect(px, py, g.tray),
          })
        }
      }
    }
  })

  it('sameTarget lets the UI skip re-rendering until something visible changes', () => {
    const a = dragTarget(g, 225, 225, 1, 1, false)
    expect(sameTarget(a, dragTarget(g, 226, 226, 1, 1, false))).toBe(true) // same cell, same flags
    expect(sameTarget(a, dragTarget(g, 275, 225, 1, 1, false))).toBe(false) // next cell
    expect(sameTarget(a, dragTarget(g, 500, 225, 1, 1, false))).toBe(false) // left the board
  })
})
