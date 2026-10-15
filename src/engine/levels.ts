import verified from '../../VERIFIED_LEVELS.json'
import { normalize } from './shape'
import type { Level } from './types'

interface RawItem {
  id: string
  cells: [number, number][]
  weight: number
  required: boolean
}
interface RawLevel {
  id: string
  board: [number, number]
  weight_limit?: number
  items: RawItem[]
}

/** Adapts the immutable reference fixtures to engine types. */
export function loadLevels(raw: RawLevel[] = verified as RawLevel[]): Level[] {
  return raw.map((l) => ({
    id: l.id,
    width: l.board[0],
    height: l.board[1],
    weightLimit: l.weight_limit,
    items: l.items.map((i) => ({
      id: i.id,
      cells: normalize(i.cells.map(([x, y]) => ({ x, y }))),
      weight: i.weight,
      required: i.required,
    })),
  }))
}
