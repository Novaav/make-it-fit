import fixture from '../engine/solutions.fixture.json'
import { loadLevels, uniqueRotations, type Level, type Orientation, type Placement } from '../engine'

type Row = [string, number, number, number]
const rows = fixture as unknown as Record<string, { perfect: Row[]; normal: Row[] }>

/**
 * Reference layouts from the Python verifier. `perfect` reaches the level's maximum Chaos; `normal` is a pack of the
 * most chaotic items that still fit (an intuitive way to win). The fixture's rotation number indexes the distinct
 * rotations of a shape; the engine counts quarter turns.
 */
export function referenceSolution(level: Level, kind: 'perfect' | 'normal' = 'perfect'): Placement[] {
  const placements: Placement[] = []
  for (const [itemId, rotation, x, y] of rows[level.id]?.[kind] ?? []) {
    const item = level.items.find((i) => i.id === itemId)
    if (!item) throw new Error(`Fixture item ${itemId} missing from level ${level.id}`)
    const orientation: Orientation = uniqueRotations(item.cells)[rotation].orientation
    placements.push({ itemId, orientation, x, y })
  }
  return placements
}

export const allLevels = () => loadLevels()
