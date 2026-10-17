import { expect, test } from '@playwright/test'

// Cell-fidelity law for the illustrated items: the artwork is gameplay information, so it may paint ONLY the
// cells the item occupies, and every occupied cell must visibly contain art. The sheet page rasterises each item at
// each unique rotation and reports the painted fraction of every cell (see src/dev/artSheet.tsx).
interface Cell { x: number; y: number; occupied: boolean; painted: number }
interface Report { id: string; orientation: number; cells: Cell[] }

const LEVELS = [
  // 4 shirt + 2 jeans + 2 charger + 1 toiletries + 4 shoes unique rotations
  { level: '01', ids: ['shirt', 'jeans', 'charger', 'toiletries', 'shoes'], reports: 13 },
  // 4 handbag + 4 outfit + 1 toiletries + 2 flamingo + 2 massager + 2 frame + 2 boa + 4 ring light + 1 disco ball + 4 DVDs
  { level: '02', ids: ['handbag', 'outfit', 'toiletries', 'flamingo', 'vibrator', 'frame', 'boa', 'ringlight', 'disco_ball', 'dvds'], reports: 26 },
  // 1 painting + 2 laundry + 4 outfit + 1 hangover + 4 heels + 4 lamp + 4 ceramic foot + 2 gnome + 1 cheese + 2 spirit + 4 robe + 2 socks
  { level: '03', ids: ['painting', 'laundry', 'outfit', 'hangover', 'heels', 'hotel_lamp', 'ceramic_foot', 'gnome', 'cheese', 'liquor', 'robe', 'emergency_socks'], reports: 31 },
]

for (const { level, ids, reports: expected } of LEVELS) test(`Level ${level}: illustrated items paint only their occupied cells, and every occupied cell holds art`, async ({ page }) => {
  await page.goto(`/art-sheet.html?level=${level}&section=rotations`)
  await page.waitForSelector('#sheet svg')
  const reports: Report[] = await page.evaluate(() => (window as unknown as { __artCheck: () => Promise<Report[]> }).__artCheck())

  expect(reports).toHaveLength(expected)
  expect(new Set(reports.map((r) => r.id))).toEqual(new Set(ids))

  for (const r of reports) {
    const label = `${r.id} @ ${r.orientation * 90}°`
    const occupied = r.cells.filter((c) => c.occupied)
    const empty = r.cells.filter((c) => !c.occupied)
    // Nothing may be painted in cells the item does not occupy (arch/gap cells of U and T shapes).
    for (const c of empty) expect(c.painted, `${label}: painted outside its cells at (${c.x},${c.y})`).toBeLessThanOrEqual(0.002)
    // No occupied cell may look empty, and the item as a whole must fill most of its footprint.
    for (const c of occupied) expect(c.painted, `${label}: occupied cell (${c.x},${c.y}) looks empty`).toBeGreaterThanOrEqual(0.25)
    const average = occupied.reduce((sum, c) => sum + c.painted, 0) / occupied.length
    expect(average, `${label}: average cell coverage`).toBeGreaterThanOrEqual(0.5)
  }
})
