import { describe, expect, it } from 'vitest'
import {
  PROGRESS_KEY,
  emptyProgress,
  isUnlocked,
  loadProgress,
  parseProgress,
  recordCompletion,
  saveProgress,
  startingLevel,
  type StorageLike,
} from './progress'

const memory = (initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } => ({
  data: { ...initial },
  getItem(k) {
    return this.data[k] ?? null
  },
  setItem(k, v) {
    this.data[k] = v
  },
})
const IDS = ['01', '02', '03']

describe('progression', () => {
  it('unlocks only the first level on a fresh profile', () => {
    expect(isUnlocked(emptyProgress, IDS, '01')).toBe(true)
    expect(isUnlocked(emptyProgress, IDS, '02')).toBe(false)
    expect(isUnlocked(emptyProgress, IDS, 'nope')).toBe(false)
    expect(startingLevel(emptyProgress, IDS)).toBe('01')
  })

  it('completing a level unlocks the next and moves the starting level', () => {
    const p = recordCompletion(emptyProgress, '01', 0)
    expect(isUnlocked(p, IDS, '02')).toBe(true)
    expect(startingLevel(p, IDS)).toBe('02')
    expect(startingLevel(recordCompletion(p, '02', 1), IDS)).toBe('03')
  })

  it('keeps the best optional count and returns the same object when nothing improves', () => {
    const p = recordCompletion(emptyProgress, '02', 2)
    expect(recordCompletion(p, '02', 1)).toBe(p)
    expect(recordCompletion(p, '02', 2)).toBe(p)
    expect(recordCompletion(p, '02', 3).completed['02'].bestOptional).toBe(3)
    expect(emptyProgress.completed).toEqual({}) // not mutated
  })
})

describe('three-level chain', () => {
  it('unlocks strictly in order and ends on the last level when all are done', () => {
    let p = recordCompletion(emptyProgress, '01', 0)
    expect(isUnlocked(p, IDS, '03')).toBe(false)
    p = recordCompletion(p, '02', 1)
    expect(isUnlocked(p, IDS, '03')).toBe(true)
    expect(startingLevel(p, IDS)).toBe('03')
    p = recordCompletion(p, '03', 2)
    expect(startingLevel(p, IDS)).toBe('03')
    expect(isUnlocked(emptyProgress, IDS, '03')).toBe(false)
  })
  it('does not unlock a level just because a later one is recorded', () => {
    const p = recordCompletion(emptyProgress, '03', 0)
    expect(isUnlocked(p, IDS, '02')).toBe(false)
  })
})

describe('persistence', () => {
  it('round-trips through storage', () => {
    const s = memory()
    const p = recordCompletion(recordCompletion(emptyProgress, '01', 0), '02', 2)
    saveProgress(s, p)
    expect(JSON.parse(s.data[PROGRESS_KEY])).toEqual(p)
    expect(loadProgress(s)).toEqual(p)
  })

  it('falls back to empty progress for corrupt or hostile data', () => {
    for (const raw of ['{', 'null', '[]', '{"version":2,"completed":{}}', '{"version":1,"completed":null}']) {
      expect(parseProgress(raw)).toEqual(emptyProgress)
    }
    const dirty = '{"version":1,"completed":{"01":{"bestOptional":1},"02":{"bestOptional":-4},"03":"x","04":{"bestOptional":1.5}}}'
    expect(parseProgress(dirty).completed).toEqual({ '01': { bestOptional: 1 } })
  })

  it('survives missing or throwing storage', () => {
    const p = recordCompletion(emptyProgress, '01', 0)
    expect(() => saveProgress(null, p)).not.toThrow()
    expect(loadProgress(null)).toEqual(emptyProgress)
    const broken: StorageLike = {
      getItem() {
        throw new Error('denied')
      },
      setItem() {
        throw new Error('full')
      },
    }
    expect(() => saveProgress(broken, p)).not.toThrow()
    expect(loadProgress(broken)).toEqual(emptyProgress)
  })
})
