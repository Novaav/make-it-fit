import { describe, expect, it } from 'vitest'
import { artTransform, pointInRect, pointerToOrigin } from './geometry'

const rect = { left: 100, top: 50, width: 250, height: 300 } // 5x6 board, 50px cells

describe('pointerToOrigin', () => {
  it('snaps so the item box is centred under the pointer', () => {
    // 1x1 item, pointer in the middle of cell (2,3)
    expect(pointerToOrigin(225, 225, rect, 5, 6, 1, 1)).toEqual({ x: 2, y: 3 })
    // 2x1 item, pointer on the line between cells 1 and 2 -> origin 1
    expect(pointerToOrigin(200, 75, rect, 5, 6, 2, 1)).toEqual({ x: 1, y: 0 })
  })
  it('gives out-of-board origins outside the rect', () => {
    expect(pointerToOrigin(0, 0, rect, 5, 6, 1, 1).x).toBeLessThan(0)
  })
})

describe('pointInRect', () => {
  it('honours the margin', () => {
    expect(pointInRect(95, 60, rect)).toBe(false)
    expect(pointInRect(95, 60, rect, 10)).toBe(true)
  })
})

describe('artTransform', () => {
  it('is the identity for orientation 0', () => {
    expect(artTransform(3, 2, 0)).toEqual({ tx: 0, ty: 0, angle: 0 })
  })
  it('keeps the rotated box in the positive quadrant', () => {
    // 2x1 art turned once is a 1x2 box: rotate(-90) sends [0,2]x[0,1] to [0,1]x[-2,0]
    expect(artTransform(2, 1, 1)).toEqual({ tx: 0, ty: 2, angle: -90 })
    expect(artTransform(2, 1, 2)).toEqual({ tx: 2, ty: 1, angle: -180 })
    expect(artTransform(2, 1, 3)).toEqual({ tx: 1, ty: 0, angle: -270 })
  })
})
