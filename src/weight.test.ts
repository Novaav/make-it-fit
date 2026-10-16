import { describe, expect, it } from 'vitest'
import { formatLoad, formatWeight, splitWeight } from './weight'

describe('weight formatting', () => {
  it.each([
    [150, '150 g'], [300, '300 g'], [850, '850 g'], [900, '900 g'], [999, '999 g'],
    [1000, '1 kg'], [1500, '1.5 kg'], [2250, '2.25 kg'], [7000, '7 kg'], [23000, '23 kg'],
  ])('%i g is shown as %s', (grams, text) => expect(formatWeight(grams)).toBe(text))

  it('splits number and unit', () => {
    expect(splitWeight(900)).toEqual({ value: '900', unit: 'g' })
    expect(splitWeight(1000)).toEqual({ value: '1', unit: 'kg' })
  })

  it('formats a running total that sits before the allowance', () => {
    expect(formatLoad(0)).toBe('0')
    expect(formatLoad(900)).toBe('900 g')
    expect(formatLoad(5150)).toBe('5.15')
    expect(formatLoad(7000)).toBe('7')
  })
})
