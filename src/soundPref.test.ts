import { describe, expect, it } from 'vitest'
import { DEFAULT_MUTED, loadMuted, parseMuted, saveMuted, SOUND_KEY } from './soundPref'
import type { StorageLike } from './progress'

const memory = (): StorageLike & { data: Record<string, string> } => {
  const data: Record<string, string> = {}
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) }
}

describe('sound preference', () => {
  it('defaults to muted when nothing is saved', () => {
    expect(DEFAULT_MUTED).toBe(true)
    expect(parseMuted(null)).toBe(true)
    expect(loadMuted(memory())).toBe(true)
    expect(loadMuted(null)).toBe(true)
  })
  it('round-trips both choices', () => {
    const s = memory()
    saveMuted(s, false)
    expect(loadMuted(s)).toBe(false) // an explicit choice to hear sound is respected
    saveMuted(s, true)
    expect(loadMuted(s)).toBe(true)
    saveMuted(s, false)
    expect(JSON.parse(s.data[SOUND_KEY])).toEqual({ version: 1, muted: false })
  })
  it.each([
    ['not json', '{oops'],
    ['wrong version', '{"version":2,"muted":true}'],
    ['no version', '{"muted":true}'],
    ['muted as a string', '{"version":1,"muted":"true"}'],
    ['muted as a number', '{"version":1,"muted":1}'],
    ['an array', '[true]'],
    ['null', 'null'],
    ['a bare boolean', 'true'],
  ])('ignores %s and falls back to the default', (_n, raw) => {
    expect(parseMuted(raw)).toBe(DEFAULT_MUTED)
  })
  it('never throws when storage is blocked', () => {
    const blocked: StorageLike = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    }
    expect(loadMuted(blocked)).toBe(DEFAULT_MUTED)
    expect(() => saveMuted(blocked, true)).not.toThrow()
  })
})
