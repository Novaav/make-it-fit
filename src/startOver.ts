import { BOARDS_KEY } from './boards'
import { INTRO_KEY } from './intro'
import { PROGRESS_KEY } from './progress'
import { OPENING_KEY } from './useOpening'

/** What "Start over" deletes: progress, each level's arrangement and the seen how-to-play notes. The sound choice stays. */
export const SAVED_GAME_KEYS = [PROGRESS_KEY, BOARDS_KEY, INTRO_KEY] as const

type Removable = Pick<Storage, 'removeItem'>

/** Removes the saved game (and the "opening already shown this session" flag, so the opening plays again). Never throws. */
export function clearSavedGame(local: Removable | null, session: Removable | null): void {
  for (const key of SAVED_GAME_KEYS) {
    try {
      local?.removeItem(key)
    } catch {
      // storage blocked: there is nothing saved to clear
    }
  }
  try {
    session?.removeItem(OPENING_KEY)
  } catch {
    // ignored for the same reason
  }
}

/** Clears the saved game, then reloads on the plain address (no `?intro`), so a first-visit start screen and note follow. */
export function startOver(): void {
  let local: Storage | null = null
  let session: Storage | null = null
  try {
    local = window.localStorage
    session = window.sessionStorage
  } catch {
    // blocked: reload anyway
  }
  clearSavedGame(local, session)
  window.location.replace(window.location.pathname)
}
