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
    const p = recordCompletion(emptyProgress, '01')
    expect(isUnlocked(p, IDS, '02')).toBe(true)
    expect(startingLevel(p, IDS)).toBe('02')
    expect(startingLevel(recordCompletion(p, '02', 21), IDS)).toBe('03')
  })

  it('keeps the best Chaos and the perfect flag, and returns the same object when nothing improves', () => {
    const p = recordCompletion(emptyProgress, '02', 21)
    expect(p.completed['02']).toEqual({ bestChaos: 21 })
    expect(recordCompletion(p, '02', 20)).toBe(p)
    expect(recordCompletion(p, '02', 21)).toBe(p)
    expect(recordCompletion(p, '02', 24).completed['02']).toEqual({ bestChaos: 24 })
    const perfect = recordCompletion(p, '02', 25, true)
    expect(perfect.completed['02']).toEqual({ bestChaos: 25, perfect: true })
    expect(recordCompletion(perfect, '02', 21)).toBe(perfect) // a perfect result is never lost
    expect(recordCompletion(emptyProgress, '01').completed['01']).toEqual({})
    expect(emptyProgress.completed).toEqual({}) // not mutated
  })
})

describe('three-level chain', () => {
  it('unlocks strictly in order and ends on the last level when all are done', () => {
    let p = recordCompletion(emptyProgress, '01')
    expect(isUnlocked(p, IDS, '03')).toBe(false)
    p = recordCompletion(p, '02', 21)
    expect(isUnlocked(p, IDS, '03')).toBe(true)
    expect(startingLevel(p, IDS)).toBe('03')
    p = recordCompletion(p, '03', 22)
    expect(startingLevel(p, IDS)).toBe('03')
    expect(isUnlocked(emptyProgress, IDS, '03')).toBe(false)
  })
  it('does not unlock a level just because a later one is recorded', () => {
    const p = recordCompletion(emptyProgress, '03', 22)
    expect(isUnlocked(p, IDS, '02')).toBe(false)
  })
})

describe('persistence', () => {
  it('round-trips through storage', () => {
    const s = memory()
    const p = recordCompletion(recordCompletion(emptyProgress, '01'), '02', 23, true)
    saveProgress(s, p)
    expect(JSON.parse(s.data[PROGRESS_KEY])).toEqual(p)
    expect(loadProgress(s)).toEqual(p)
  })

  it('falls back to empty progress for corrupt or hostile data', () => {
    for (const raw of ['{', 'null', '[]', '{"version":3,"completed":{}}', '{"version":2,"completed":null}', '{"version":1,"completed":null}', '{"completed":{}}']) {
      expect(parseProgress(raw)).toEqual(emptyProgress)
    }
    const dirty = '{"version":2,"completed":{"01":{},"02":{"bestChaos":-4},"03":"x","04":{"bestChaos":1.5,"perfect":"yes"},"05":{"bestChaos":21,"perfect":true}}}'
    expect(parseProgress(dirty).completed).toEqual({ '01': {}, '02': {}, '04': {}, '05': { bestChaos: 21, perfect: true } })
  })

  it('migrates a version 1 save: completed levels stay completed (and keep unlocking), old bonus counts are dropped', () => {
    const v1 = '{"version":1,"completed":{"01":{"bestOptional":0},"02":{"bestOptional":3},"03":"x","04":{"bestOptional":-1}}}'
    const migrated = parseProgress(v1)
    expect(migrated).toEqual({ version: 2, completed: { '01': {}, '02': {} } })
    expect(isUnlocked(migrated, IDS, '03')).toBe(true)
  })
})
