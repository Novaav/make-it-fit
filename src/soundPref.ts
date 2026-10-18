import type { StorageLike } from './progress'

/** Whether sound effects are muted. Kept apart from progress; only a validated boolean is ever read back. */
export const SOUND_KEY = 'make-it-fit:sound:v1'

/**
 * Sound is OFF until the player turns it on. Nothing is audible, and no audio context exists, until the speaker button
 * is pressed once; the choice is then saved and respected on later visits.
 */
export const DEFAULT_MUTED = true

export function parseMuted(raw: string | null): boolean {
  if (!raw) return DEFAULT_MUTED
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || (data as { version?: unknown }).version !== 1) return DEFAULT_MUTED
    const muted = (data as { muted?: unknown }).muted
    return typeof muted === 'boolean' ? muted : DEFAULT_MUTED
  } catch {
    return DEFAULT_MUTED
  }
}

export function loadMuted(storage: StorageLike | null): boolean {
  try {
    return parseMuted(storage?.getItem(SOUND_KEY) ?? null)
  } catch {
    return DEFAULT_MUTED
  }
}

export function saveMuted(storage: StorageLike | null, muted: boolean): void {
  try {
    storage?.setItem(SOUND_KEY, JSON.stringify({ version: 1, muted }))
  } catch {
    // storage unavailable: the choice lasts until the page closes
  }
}
