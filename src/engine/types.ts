export interface Cell {
  readonly x: number
  readonly y: number
}

/** Cells normalized to a (0,0) minimum corner, sorted by x then y. */
export type Shape = readonly Cell[]

/** Number of 90-degree turns applied to an item's base shape (0-3). */
export type Orientation = 0 | 1 | 2 | 3

export interface Item {
  readonly id: string
  readonly cells: Shape
  readonly weight: number
  /** Must be packed for the level to be won (Level 1 items, Level 3's hotel painting and laundry bag). */
  readonly required: boolean
  /** What the item adds to the Chaos score (0 on levels without Chaos). */
  readonly chaos: number
}

export interface Level {
  readonly id: string
  readonly width: number
  readonly height: number
  readonly weightLimit?: number
  /** Chaos needed to win (levels with Chaos only). */
  readonly target?: number
  /** The maximum Chaos any legal pack can reach: the perfect score. */
  readonly perfect?: number
  readonly items: readonly Item[]
}

/** `x`,`y` is the board position of the rotated shape's bounding-box corner. */
export interface Placement {
  readonly itemId: string
  readonly orientation: Orientation
  readonly x: number
  readonly y: number
}

export interface GameState {
  readonly level: Level
  readonly placements: readonly Placement[]
  /** Earlier placement lists, oldest first, for undo. */
  readonly history: readonly (readonly Placement[])[]
}

export type PlacementError =
  | 'unknown-item'
  | 'already-placed'
  | 'not-placed'
  | 'out-of-bounds'
  | 'overlap'
  | 'nothing-to-undo'

export type ActionResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly error: PlacementError }
