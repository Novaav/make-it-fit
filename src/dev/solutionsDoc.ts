import { ITEM_NAMES, LEVEL_TITLES } from '../levelMeta'
import { formatWeight } from '../weight'
import { createGame, isPerfect, isWon, loadLevels, place, placementCells, totalChaos, totalWeight, type Level, type Placement } from '../engine'
import { referenceSolution } from './solutions'

const SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Builds TEST_SOLUTIONS.md; throws if any listed layout is not accepted as a win by the engine. */
export function renderSolutionsDoc(): string {
  const out: string[] = [
    '# TEST_SOLUTIONS — verified layouts for all levels',
    '',
    '_Generated from `VERIFIED_LEVELS.json` and `src/engine/solutions.fixture.json`; every layout below was replayed through the TypeScript engine (`place` + `isWon`) while generating this file, and `src/dev/solutionsDoc.test.ts` fails if this file drifts from the engine. Do not edit by hand._',
    '',
    '## Conventions',
    '',
    '- **Position `(column,row)`**: board cell of the item\'s **top-left corner after rotation**; the **top-left cell of the suitcase is `(0,0)`**, columns grow to the right, rows grow downward.',
    '- **Rotation**: number of times to press **Rotate** (or `R`) on the item, starting from its tray orientation. Each press turns it 90° counter-clockwise on screen. `0` = as shown in the tray at the start.',
    '- To place by mouse/touch: drag so the item\'s top-left cell lands on the position (the item snaps to the grid; the green footprint confirms it). By keyboard: pick up with Enter, move with arrows, Enter to place; the status line announces the column/row after placing.',
    '- Each grid below shows letters for packed items and `.` for empty cells.',
    '',
    '## Quick testing without replaying earlier levels',
    '',
    '- Run `npm run dev`. A **Dev tools** panel appears at the bottom-left of the page (development server only):',
    '  - **Jump L1 / L2 / L3** opens any level regardless of progress.',
    '  - **Fill normal win** / **Fill perfect pack** load the verified layouts below (each item is a separate Undo step), so you can check the completion card, meters and progress saving immediately.',
    '  - Jump and Fill never save progress or unlock levels; **Clear saved progress** resets real unlocks, ✓ marks and best Chaos scores.',
    '  - Browser tests (`npm run test:e2e`) play Level 1 by dragging with exactly these coordinates.',
    '- The panel and the solution data are not part of the production build (`npm run check:prod-clean` builds and verifies this).',
    '',
  ]
  for (const level of loadLevels()) {
    out.push(`## Level ${Number(level.id)} — ${LEVEL_TITLES[level.id]}`, '')
    const required = level.items.filter((i) => i.required)
    out.push(
      `- Board: ${level.width} columns × ${level.height} rows. ` +
        (level.weightLimit !== undefined ? `Packing allowance: ${formatWeight(level.weightLimit)} (a total equal to the allowance succeeds).` : 'No weight allowance (this level teaches fitting and rotation only).'),
    )
    if (level.target !== undefined) {
      out.push(
        `- Chaos: win at ${level.target}, perfect pack at ${level.perfect}. ${required.length ? `Mandatory: ${required.map((i) => ITEM_NAMES[i.id]).join(', ')}.` : 'Nothing is mandatory: any items may be packed.'}`,
        `- Items (Chaos, weight): ${level.items.map((i) => `${ITEM_NAMES[i.id]} (${i.required ? 'mandatory' : `${i.chaos}`}, ${formatWeight(i.weight)})`).join('; ')}.`,
      )
    } else {
      out.push(`- Every item is mandatory: ${required.map((i) => ITEM_NAMES[i.id]).join(', ')}.`)
    }
    out.push('')
    const kinds: ('normal' | 'perfect')[] = level.target === undefined ? ['perfect'] : ['normal', 'perfect']
    for (const kind of kinds) out.push(...renderLayout(level, kind, referenceSolution(level, kind)))
  }
  return out.join('\n')
}

function renderLayout(level: Level, kind: 'normal' | 'perfect', placements: Placement[]): string[] {
  let state = createGame(level)
  for (const p of placements) {
    const r = place(state, p)
    if (!r.ok) throw new Error(`Level ${level.id} ${kind}: ${p.itemId} rejected (${r.error})`)
    state = r.state
  }
  if (!isWon(state)) throw new Error(`Level ${level.id} ${kind}: reference layout is not a win`)
  if (kind === 'perfect' && level.perfect !== undefined && (!isPerfect(state) || totalChaos(state) !== level.perfect)) {
    throw new Error(`Level ${level.id}: the perfect layout does not reach the perfect score`)
  }
  const symbol = new Map(level.items.map((item, i) => [item.id, SYMBOLS[i]]))
  const grid: string[][] = Array.from({ length: level.height }, () => Array<string>(level.width).fill('.'))
  for (const p of placements) for (const c of placementCells(level, p)) grid[c.y][c.x] = symbol.get(p.itemId)!
  const label =
    level.target === undefined
      ? 'Solution'
      : kind === 'normal'
        ? `Normal win (a pack of the most chaotic items that fit): Chaos ${totalChaos(state)} of the ${level.target} needed`
        : `Perfect pack: Chaos ${totalChaos(state)}, the maximum`
  const out = [`### ${label}; total weight ${formatWeight(totalWeight(state))}`, '']
  out.push('| Item | Mandatory | Chaos | Weight | Rotation (presses) | Position (column,row) | Letter |', '|---|---|---|---|---|---|---|')
  for (const p of placements) {
    const item = level.items.find((i) => i.id === p.itemId)!
    out.push(
      `| ${ITEM_NAMES[p.itemId]} | ${item.required ? 'yes' : ''} | ${level.target === undefined ? '' : item.chaos} | ${formatWeight(item.weight)} | ${p.orientation} | (${p.x},${p.y}) | ${symbol.get(p.itemId)} |`,
    )
  }
  out.push('', '```', '       ' + Array.from({ length: level.width }, (_, i) => i).join(' '))
  grid.forEach((row, y) => out.push(`row ${y}  ${row.join(' ')}`))
  out.push('```', '')
  return out
}
