import { describe, expect, it } from 'vitest'
import { BOARDS_KEY } from './boards'
import { INTRO_KEY } from './intro'
import { PROGRESS_KEY } from './progress'
import { SOUND_KEY } from './soundPref'
import { OPENING_KEY } from './useOpening'
import { clearSavedGame, SAVED_GAME_KEYS } from './startOver'

const fakeStorage = (initial: Record<string, string>) => {
  const data = { ...initial }
  return { data, removeItem: (k: string) => void delete data[k] }
}

describe('clearSavedGame', () => {
  it('removes progress, arrangements and seen notes, and the session opening flag, but keeps the sound choice', () => {
    const local = fakeStorage({ [PROGRESS_KEY]: '{}', [BOARDS_KEY]: '{}', [INTRO_KEY]: '{}', [SOUND_KEY]: '{"version":1,"muted":false}', other: 'x' })
    const session = fakeStorage({ [OPENING_KEY]: '1' })
    clearSavedGame(local, session)
    expect(Object.keys(local.data).sort()).toEqual([SOUND_KEY, 'other'].sort())
    expect(session.data).toEqual({})
  })

  it('lists exactly the three saved-game keys', () => {
    expect([...SAVED_GAME_KEYS]).toEqual([PROGRESS_KEY, BOARDS_KEY, INTRO_KEY])
  })

  it('never throws when storage is missing or blocked', () => {
    const blocked = {
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(() => clearSavedGame(null, null)).not.toThrow()
    expect(() => clearSavedGame(blocked, blocked)).not.toThrow()
  })
})
