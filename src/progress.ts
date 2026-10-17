/** Local-only progress: which levels are done and the best optional-item count for each. */
export const PROGRESS_KEY = 'make-it-fit:progress:v1'

export interface LevelResult {
  /** Highest Chaos reached in a winning pack (absent for Level 1, and for levels completed before Chaos existed). */
  readonly bestChaos?: number
  /** True once the level's perfect score has been reached. */
  readonly perfect?: boolean
}

export interface Progress {
  readonly version: 2
  readonly completed: Readonly<Record<string, LevelResult>>
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const emptyProgress: Progress = { version: 2, completed: {} }

/**
 * Validates untrusted stored JSON. Version 1 saves (from before Chaos) migrate to version 2: every level completed
 * then stays completed (it unlocked what it unlocked), its old optional-item count is dropped because the scoring
 * rule changed. Anything malformed yields empty progress.
 */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return emptyProgress
    const { version, completed } = data as { version?: unknown; completed?: unknown }
    if ((version !== 1 && version !== 2) || typeof completed !== 'object' || completed === null) return emptyProgress
    const clean: Record<string, LevelResult> = {}
    for (const [id, value] of Object.entries(completed)) {
      if (typeof value !== 'object' || value === null) continue
      if (version === 1) {
        const best = (value as { bestOptional?: unknown }).bestOptional
        if (typeof best === 'number' && Number.isInteger(best) && best >= 0) clean[id] = {}
        continue
      }
      const { bestChaos, perfect } = value as { bestChaos?: unknown; perfect?: unknown }
      clean[id] = {
        ...(typeof bestChaos === 'number' && Number.isInteger(bestChaos) && bestChaos >= 0 ? { bestChaos } : {}),
        ...(perfect === true ? { perfect: true } : {}),
      }
    }
    return { version: 2, completed: clean }
  } catch {
    return emptyProgress
  }
}

export function loadProgress(storage: StorageLike | null): Progress {
  try {
    return parseProgress(storage?.getItem(PROGRESS_KEY) ?? null)
  } catch {
    return emptyProgress
  }
}

export function saveProgress(storage: StorageLike | null, progress: Progress): void {
  try {
    storage?.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // storage unavailable or full: progress just won't persist
  }
}

/** Returns the same object when nothing improves, so callers can skip saving. */
export function recordCompletion(progress: Progress, levelId: string, chaos = 0, perfect = false): Progress {
  const old = progress.completed[levelId]
  const bestChaos = Math.max(chaos, old?.bestChaos ?? 0)
  const isPerfect = perfect || old?.perfect === true
  if (old && bestChaos === (old.bestChaos ?? 0) && isPerfect === (old.perfect === true)) return progress
  const entry: LevelResult = { ...(bestChaos > 0 ? { bestChaos } : {}), ...(isPerfect ? { perfect: true } : {}) }
  return { ...progress, completed: { ...progress.completed, [levelId]: entry } }
}

/** A level is playable when it is first, or the level before it is completed. */
export function isUnlocked(progress: Progress, orderedIds: readonly string[], levelId: string): boolean {
  const index = orderedIds.indexOf(levelId)
  return index === 0 || (index > 0 && orderedIds[index - 1] in progress.completed)
}

/** First level not yet completed, or the last one when everything is done. */
export function startingLevel(progress: Progress, orderedIds: readonly string[]): string {
  return orderedIds.find((id) => !(id in progress.completed)) ?? orderedIds[orderedIds.length - 1]
}

export function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
