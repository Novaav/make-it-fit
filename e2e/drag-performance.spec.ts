import { expect, test, type Page } from '@playwright/test'
import { board, boardGeometry, piece } from './helpers'

// Measures what actually happens during a scripted drag: React commits (dev-only Profiler counter in
// App.tsx) and Chrome's own CPU counters. The commit count is deterministic and asserted; the CPU
// counters vary by machine, so they are reported (test annotations) but never asserted.

const STEPS = 240

async function cdpMetrics(page: Page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')
  const read = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))
  return read
}

async function scriptedDrag(page: Page, itemId: string) {
  const { box, cell } = await boardGeometry(page)
  const p = (await piece(page, itemId).boundingBox())!
  const start = { x: p.x + p.width / 2, y: p.y + p.height / 2 }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  // sweep across the whole board diagonally (crossing many cells), then drop on a valid spot
  await page.mouse.move(box.x + 0.5 * cell, box.y + 0.5 * cell, { steps: STEPS / 2 })
  await page.mouse.move(box.x + box.width - 0.5 * cell, box.y + box.height - 0.5 * cell, { steps: STEPS / 2 })
  await page.mouse.move(box.x + 2.5 * cell, box.y + 3.5 * cell, { steps: 10 })
  await page.mouse.up()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('a drag across the board causes only a handful of React commits, not one per pointermove', async ({ page }, info) => {
  const read = await cdpMetrics(page)
  await page.evaluate(() => ((window as unknown as { __commits: number }).__commits = 0))
  const before = await read()
  await scriptedDrag(page, 'passport')
  const after = await read()
  const commits = await page.evaluate(() => (window as unknown as { __commits: number }).__commits)
  const ms = (k: string) => Math.round((after[k] - before[k]) * 1000)
  const report = `pointermoves≈${STEPS + 10}, React commits=${commits}, script=${ms('ScriptDuration')}ms, layout=${ms('LayoutDuration')}ms, style=${ms('RecalcStyleDuration')}ms, task=${ms('TaskDuration')}ms`
  info.annotations.push({ type: 'drag-measurement', description: report })
  console.log(`[drag-measurement] ${report}`)
  // Before the refactor this was ≈ one commit per pointermove (≥ 250); now only target-cell/flag changes commit.
  expect(commits).toBeLessThanOrEqual(60)
  await expect(piece(page, 'passport')).toHaveAttribute('aria-label', /packed at column 3, row 4/)
})

test('the carried piece follows the pointer exactly, frame by frame, outside and inside the board', async ({ page }) => {
  const { box, cell } = await boardGeometry(page)
  const p = (await piece(page, 'passport').boundingBox())!
  await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2)
  await page.mouse.down()
  const path = [
    { x: p.x - 40, y: p.y + 30 },
    { x: box.x - 20, y: box.y + 40 }, // just outside the board: free-floating ghost
    { x: box.x + 2.3 * cell, y: box.y + 1.7 * cell }, // inside: snapped piece
    { x: box.x + box.width + 3, y: box.y + 3 * cell }, // leaves again
  ]
  for (const pt of path) {
    await page.mouse.move(pt.x, pt.y, { steps: 6 })
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const ghost = page.locator('.ghost')
    const carrying = page.locator('.piece.carrying')
    const inBoard = await carrying.count()
    if (inBoard) {
      // snapped: the piece sits on the grid cell nearest the pointer, never further than half a cell + margin
      const b = (await carrying.boundingBox())!
      expect(Math.abs(b.x + b.width / 2 - pt.x)).toBeLessThanOrEqual(cell)
      expect(Math.abs(b.y + b.height / 2 - pt.y)).toBeLessThanOrEqual(cell)
      await expect(ghost).toBeHidden()
    } else {
      const g = (await ghost.boundingBox())!
      expect(Math.abs(g.x + g.width / 2 - pt.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(g.y + g.height / 2 - pt.y)).toBeLessThanOrEqual(1)
    }
  }
  await page.mouse.up()
  await expect(page.locator('.ghost')).toHaveCount(0)
  await expect(piece(page, 'passport')).toHaveAttribute('aria-label', /not packed/) // dropped outside: nothing placed
})

test('rotating mid-drag keeps following the pointer and swaps the footprint', async ({ page }) => {
  const { box, cell } = await boardGeometry(page)
  const jeans = (await piece(page, 'jeans').boundingBox())!
  await page.mouse.move(jeans.x + jeans.width / 2, jeans.y + jeans.height / 2)
  await page.mouse.down()
  const at = { x: box.x - 0.9 * cell, y: box.y + 2 * cell } // beyond the half-cell snap margin: free-floating ghost
  await page.mouse.move(at.x, at.y, { steps: 8 })
  const before = (await page.locator('.ghost').boundingBox())!
  expect(before.width).toBeCloseTo(6 * cell, 0)
  await page.keyboard.press('r')
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  const after = (await page.locator('.ghost').boundingBox())!
  expect(after.width).toBeCloseTo(cell, 0)
  expect(after.height).toBeCloseTo(6 * cell, 0)
  expect(Math.abs(after.x + after.width / 2 - at.x)).toBeLessThanOrEqual(1)
  await page.mouse.up()
})

test('scrolling during a drag does not leave the snap target stale', async ({ page }) => {
  // Short desktop window: the page scrolls, and both the tray and the board stay on screen.
  await page.setViewportSize({ width: 1280, height: 420 })
  await page.reload()
  const shirt = (await piece(page, 'shirt').boundingBox())!
  await page.mouse.move(shirt.x + shirt.width / 2, shirt.y + shirt.height / 2)
  await page.mouse.down()
  const g0 = await boardGeometry(page)
  await page.mouse.move(g0.box.x + 2.5 * g0.cell, g0.box.y + 2 * g0.cell, { steps: 5 })
  await page.evaluate(() => window.scrollBy(0, 40))
  const g1 = await boardGeometry(page)
  expect(g1.box.y).toBeLessThan(g0.box.y) // the page really scrolled
  await page.mouse.move(g1.box.x + 2.5 * g1.cell, g1.box.y + 2 * g1.cell, { steps: 3 })
  await page.mouse.up()
  // a 3x2 shirt centred on that point has its top-left cell at column 2, row 2 (1-based)
  await expect(piece(page, 'shirt')).toHaveAttribute('aria-label', /packed at column 2, row 2/)
})
