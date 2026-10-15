import fixture from '../engine/solutions.fixture.json'
import { loadLevels, uniqueRotations, type Level, type Orientation, type Placement } from '../engine'

type Row = [string, number, number, number]
const rows = fixture as unknown as Record<string, Row[]>

/**
 * Reference layouts from the Python verifier (maximum optional items). The fixture's rotation
 * number indexes the distinct rotations of a shape; the engine counts quarter turns.
 */
export function referenceSolution(level: Level, includeOptional = true): Placement[] {
  const placements: Placement[] = []
  for (const [itemId, rotation, x, y] of rows[level.id] ?? []) {
    const item = level.items.find((i) => i.id === itemId)
    if (!item) throw new Error(`Fixture item ${itemId} missing from level ${level.id}`)
    if (!includeOptional && !item.required) continue
    const orientation: Orientation = uniqueRotations(item.cells)[rotation].orientation
    placements.push({ itemId, orientation, x, y })
  }
  return placements
}

export const allLevels = () => loadLevels()
