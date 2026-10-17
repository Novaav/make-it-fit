import type { StorageLike } from './progress'

/** Which levels' how-to-play notes the player has seen. Kept apart from progress and from saved arrangements. */
export const INTRO_KEY = 'make-it-fit:intro:v1'

export type IntroSeen = Readonly<Record<string, true>>
export const nothingSeen: IntroSeen = {}

export function parseIntroSeen(raw: string | null): IntroSeen {
  if (!raw) return nothingSeen
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || (data as { version?: unknown }).version !== 1) return nothingSeen
    const seen = (data as { seen?: unknown }).seen
    if (typeof seen !== 'object' || seen === null || Array.isArray(seen)) return nothingSeen
    const clean: Record<string, true> = {}
    for (const [id, v] of Object.entries(seen)) if (v === true) clean[id] = true
    return clean
  } catch {
    return nothingSeen
  }
}

export function loadIntroSeen(storage: StorageLike | null): IntroSeen {
  try {
    return parseIntroSeen(storage?.getItem(INTRO_KEY) ?? null)
  } catch {
    return nothingSeen
  }
}

export function saveIntroSeen(storage: StorageLike | null, seen: IntroSeen): void {
  try {
    storage?.setItem(INTRO_KEY, JSON.stringify({ version: 1, seen }))
  } catch {
    // storage unavailable: the note simply shows again next visit
  }
}
