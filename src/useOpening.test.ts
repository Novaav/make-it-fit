import { describe, expect, it } from 'vitest'
import { openingLayout, shouldPlayOpening } from './useOpening'

const base = { search: '', automated: false, returning: false, shownThisSession: false }

describe('shouldPlayOpening', () => {
  it('shows it to a new player on the first visit of a session', () => {
    expect(shouldPlayOpening(base)).toBe(true)
  })
  it('skips it for returning players, automation and a session that already pressed Play', () => {
    expect(shouldPlayOpening({ ...base, returning: true })).toBe(false)
    expect(shouldPlayOpening({ ...base, automated: true })).toBe(false)
    expect(shouldPlayOpening({ ...base, shownThisSession: true })).toBe(false)
  })
  it('?intro forces it for review, whatever else is true', () => {
    expect(shouldPlayOpening({ search: '?intro', automated: true, returning: true, shownThisSession: true })).toBe(true)
    expect(shouldPlayOpening({ ...base, search: '?other=1&intro' })).toBe(true)
    expect(shouldPlayOpening({ ...base, search: '?other=1', returning: true })).toBe(false)
  })
})

describe('openingLayout', () => {
  const rest = { left: 28, top: 15, width: 235, height: 40 }
  it('centres the enlarged wordmark horizontally, on whole pixels, with the tag below it', () => {
    const l = openingLayout(rest, 1280, 800)
    const w = rest.width * l.scale
    expect(Math.abs(rest.left + l.dx + w / 2 - 640)).toBeLessThanOrEqual(0.5)
    expect(Number.isInteger(l.dx) && Number.isInteger(l.dy)).toBe(true)
    expect(l.tagTop).toBeGreaterThan(rest.top + l.dy + rest.height * l.scale)
  })
  it('never shrinks the wordmark and caps how far it is enlarged', () => {
    expect(openingLayout({ ...rest, width: 2000 }, 800, 600).scale).toBe(1)
    expect(openingLayout({ ...rest, width: 50, height: 10 }, 3000, 3000).scale).toBe(3.8)
  })
  it('fits a narrow phone and a short landscape screen', () => {
    const phone = openingLayout(rest, 390, 844)
    expect(rest.width * phone.scale).toBeLessThanOrEqual(390 * 0.84 + 0.01)
    const land = openingLayout(rest, 844, 390)
    expect(rest.height * land.scale).toBeLessThanOrEqual(390 * 0.3 + 0.01)
    expect(land.tagTop + 100).toBeLessThanOrEqual(390)
  })
})
