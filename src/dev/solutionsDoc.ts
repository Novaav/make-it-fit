import { BEST_OPTIONAL, ITEM_NAMES, LEVEL_TITLES, PERFECT_LABEL } from '../levelMeta'
import { formatWeight } from '../weight'
import { createGame, isWon, loadLevels, optionalPlacedCount, place, placementCells, totalWeight } from '../engine'
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
    '  - **Fill required only** / **Fill max bonus** load the verified layouts below (each item is a separate Undo step), so you can check the completion card, allowance meter and progress saving immediately.',
    '  - Jump and Fill never save progress or unlock levels; **Clear saved progress** resets real unlocks, ✓ marks and best bonus counts.',
    '  - Browser tests (`npm run test:e2e`) play Level 1 by dragging with exactly these coordinates.',
    '- The panel and the solution data are not part of the production build (`npm run check:prod-clean` builds and verifies this).',
    '',
  ]
  for (const level of loadLevels()) {
    const placements = referenceSolution(level, true)
    let state = createGame(level)
    for (const p of placements) {
      const r = place(state, p)
      if (!r.ok) throw new Error(`Level ${level.id}: ${p.itemId} rejected (${r.error})`)
      state = r.state
    }
    if (!isWon(state)) throw new Error(`Level ${level.id}: reference layout is not a win`)
    const required = level.items.filter((i) => i.required)
    const optional = level.items.filter((i) => !i.required)
    const requiredOnly = referenceSolution(level, false)
    const requiredWeight = required.reduce((n, i) => n + i.weight, 0)
    const symbol = new Map(level.items.map((item, i) => [item.id, SYMBOLS[i]]))
    const grid: string[][] = Array.from({ length: level.height }, () => Array<string>(level.width).fill('.'))
    for (const p of placements) for (const c of placementCells(level, p)) grid[c.y][c.x] = symbol.get(p.itemId)!

    out.push(`## Level ${Number(level.id)} — ${LEVEL_TITLES[level.id]}`, '')
    out.push(
      `- Board: ${level.width} columns × ${level.height} rows. ` +
        (level.weightLimit !== undefined ? `Packing allowance: ${formatWeight(level.weightLimit)} (a total equal to the allowance succeeds).` : 'No weight allowance (this level teaches fitting and rotation only).'),
      `- Required items (${required.length}): ${required.map((i) => ITEM_NAMES[i.id]).join(', ')}.`,
      optional.length
        ? `- Optional items (${optional.length}): ${optional.map((i) => ITEM_NAMES[i.id]).join(', ')}.`
        : '- Optional items: none.',
      `- **Required-only solution**: pack the ${requiredOnly.length} required items from the table (weight ${formatWeight(requiredWeight)}).`,
    )
    if (optional.length) {
      const bonus = placements.filter((p) => !level.items.find((i) => i.id === p.itemId)!.required)
      out.push(
        `- **Maximum bonus solution**: all required items plus ${bonus.map((p) => ITEM_NAMES[p.itemId]).join(' and ')} (bonus ${optionalPlacedCount(state)} of ${BEST_OPTIONAL[level.id]}, the "${PERFECT_LABEL}" tier; total weight ${formatWeight(totalWeight(state))}). This is the verified maximum for the level; other sets can reach it too.`,
      )
    }
    out.push('', '| Item | Required | Weight | Rotation (presses) | Position (column,row) | Letter |', '|---|---|---|---|---|---|')
    for (const p of placements) {
      const item = level.items.find((i) => i.id === p.itemId)!
      out.push(
        `| ${ITEM_NAMES[p.itemId]} | ${item.required ? 'yes' : '**optional**'} | ${formatWeight(item.weight)} | ${p.orientation} | (${p.x},${p.y}) | ${symbol.get(p.itemId)} |`,
      )
    }
    out.push('', '```', '       ' + Array.from({ length: level.width }, (_, i) => i).join(' '))
    grid.forEach((row, y) => out.push(`row ${y}  ${row.join(' ')}`))
    out.push('```', '')
  }
  return out.join('\n')
}
