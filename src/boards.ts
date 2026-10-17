import { createGame, place, type GameState, type Level, type Orientation, type Placement } from './engine'
import type { StorageLike } from './progress'

/**
 * The player's current arrangement in each level, kept separately from progress (achievements). A saved board is only
 * ever a starting point: it is replayed through the engine, so a corrupt, outdated or impossible save can never put an
 * invalid arrangement on screen, and being "completed earlier" is never taken as proof that the board is valid now.
 */
export const BOARDS_KEY = 'make-it-fit:boards:v1'

/** What was saved for one level: the arrangement, and a fingerprint of the level it was made for. */
export interface SavedBoard {
  readonly sig: string
  readonly placements: readonly Placement[]
}
export type Boards = Readonly<Record<string, SavedBoard>>
export const emptyBoards: Boards = {}

/** Changes whenever a level's board, allowance, targets, items, shapes, weights, Chaos or required flags change, so an old save can never be misapplied. */
export function levelSignature(level: Level): string {
  const items = level.items.map((i) => `${i.id}${i.required ? '!' : '?'}${i.chaos}@${i.weight}:${i.cells.map((c) => `${c.x}.${c.y}`).join(',')}`).join('|')
  return `${level.width}x${level.height}/${level.weightLimit ?? '-'}/${level.target ?? '-'}/${level.perfect ?? '-'}:${items}`
}

export const snapshot = (level: Level, placements: readonly Placement[]): SavedBoard => ({ sig: levelSignature(level), placements })

const isOrientation = (n: unknown): n is Orientation => n === 0 || n === 1 || n === 2 || n === 3
const isCoord = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 100

/** Validates untrusted stored JSON. Anything malformed or of another version yields no saved boards. */
export function parseBoards(raw: string | null): Boards {
  if (!raw) return emptyBoards
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || (data as { version?: unknown }).version !== 1) return emptyBoards
    const boards = (data as { boards?: unknown }).boards
    if (typeof boards !== 'object' || boards === null || Array.isArray(boards)) return emptyBoards
    const clean: Record<string, SavedBoard> = {}
    for (const [levelId, entry] of Object.entries(boards)) {
      const { sig, placements: list } = (entry ?? {}) as { sig?: unknown; placements?: unknown }
      if (typeof sig !== 'string' || !Array.isArray(list)) continue
      const seen = new Set<string>()
      const placements: Placement[] = []
      let ok = true
      for (const p of list) {
        const { itemId, orientation, x, y } = (p ?? {}) as Record<string, unknown>
        if (typeof itemId !== 'string' || seen.has(itemId) || !isOrientation(orientation) || !isCoord(x) || !isCoord(y)) {
          ok = false
          break
        }
        seen.add(itemId)
        placements.push({ itemId, orientation, x, y })
      }
      if (ok) clean[levelId] = { sig, placements } // one bad entry discards just that level's board
    }
    return clean
  } catch {
    return emptyBoards
  }
}

export function loadBoards(storage: StorageLike | null): Boards {
  try {
    return parseBoards(storage?.getItem(BOARDS_KEY) ?? null)
  } catch {
    return emptyBoards
  }
}

export function saveBoards(storage: StorageLike | null, boards: Boards): void {
  try {
    storage?.setItem(BOARDS_KEY, JSON.stringify({ version: 1, boards }))
  } catch {
    // storage unavailable or full: the arrangement just won't survive a reload
  }
}

/**
 * Replays saved placements onto an empty board. If any placement is not legal in the current level data (unknown item,
 * overlap, out of bounds), the whole saved board is dropped and the player gets an empty suitcase. Over the allowance is
 * allowed, exactly as it is in play.
 */
export function restoreGame(level: Level, saved: SavedBoard | undefined): GameState {
  let game = createGame(level)
  if (!saved || saved.sig !== levelSignature(level)) return game
  for (const p of saved.placements) {
    const r = place(game, p)
    if (!r.ok) return createGame(level)
    game = r.state
  }
  // restoring is not something the player did: it must not be undoable into a half-restored board
  return { ...game, history: [] }
}
