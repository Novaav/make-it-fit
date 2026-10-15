/** Local-only progress: which levels are done and the best optional-item count for each. */
export const PROGRESS_KEY = 'make-it-fit:progress:v1'

export interface LevelResult {
  /** Most optional items packed in any winning layout. */
  readonly bestOptional: number
}

export interface Progress {
  readonly version: 1
  readonly completed: Readonly<Record<string, LevelResult>>
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const emptyProgress: Progress = { version: 1, completed: {} }

/** Validates untrusted stored JSON; anything malformed yields empty progress. */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return emptyProgress
    const completed = (data as { completed?: unknown }).completed
    if ((data as { version?: unknown }).version !== 1 || typeof completed !== 'object' || completed === null) {
      return emptyProgress
    }
    const clean: Record<string, LevelResult> = {}
    for (const [id, value] of Object.entries(completed)) {
      const best = (value as { bestOptional?: unknown } | null)?.bestOptional
      if (typeof best === 'number' && Number.isInteger(best) && best >= 0) clean[id] = { bestOptional: best }
    }
    return { version: 1, completed: clean }
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
export function recordCompletion(progress: Progress, levelId: string, optionalPacked: number): Progress {
  const best = progress.completed[levelId]?.bestOptional
  if (best !== undefined && best >= optionalPacked) return progress
  return { ...progress, completed: { ...progress.completed, [levelId]: { bestOptional: optionalPacked } } }
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
