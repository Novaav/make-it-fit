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

test('a drag across the board causes only a handful of React commits, not one per pointermove', async ({ page, browserName }, info) => {
  const read = browserName === 'chromium' ? await cdpMetrics(page) : null
  await page.evaluate(() => ((window as unknown as { __commits: number }).__commits = 0))
  const before = read ? await read() : {}
  await scriptedDrag(page, 'charger')
  const after = read ? await read() : {}
  const commits = await page.evaluate(() => (window as unknown as { __commits: number }).__commits)
  const ms = (k: string) => Math.round(((after[k] ?? 0) - (before[k] ?? 0)) * 1000)
  const report = `pointermoves≈${STEPS + 10}, React commits=${commits}, script=${ms('ScriptDuration')}ms, layout=${ms('LayoutDuration')}ms, style=${ms('RecalcStyleDuration')}ms, task=${ms('TaskDuration')}ms`
  info.annotations.push({ type: 'drag-measurement', description: report })
  console.log(`[drag-measurement] ${report}`)
  // Before the refactor this was ≈ one commit per pointermove (≥ 250); now only target-cell/flag changes commit.
  expect(commits).toBeLessThanOrEqual(60)
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 3, row 4/)
})

// One carried object, always: a single `.carried` element shows the item for the whole drag, the original is
// hidden (never a faded second copy), and nothing is left behind afterwards.
const frames = (page: Page, n = 2) =>
  page.evaluate((k) => new Promise<void>((resolve) => { let i = 0; const f = () => (++i >= k ? resolve() : requestAnimationFrame(f)); requestAnimationFrame(f) }), n)

const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)).then(() => undefined))

async function expectSingleCarried(page: Page, id: string) {
  await expect(page.locator('.carried')).toHaveCount(1)
  await expect(page.locator(`[data-carrying="${id}"]`)).toHaveCount(1)
  await expect(page.locator(`[data-carrying="${id}"]`)).toBeVisible()
  await expect(piece(page, id)).toBeHidden() // the original is hidden, not left as a faded copy
}

test('exactly one carried object follows the pointer, outside and inside the board, and nothing is left behind', async ({ page }) => {
  const { box, cell } = await boardGeometry(page)
  const p = (await piece(page, 'charger').boundingBox())!
  await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2)
  await page.mouse.down()
  const path = [
    { x: p.x - 40, y: p.y + 30 },
    { x: box.x - 1.2 * cell, y: box.y + 40 }, // outside the board: free-floating
    { x: box.x + 2.3 * cell, y: box.y + 1.7 * cell }, // inside: snapped to a cell
    { x: box.x + box.width + 1.2 * cell, y: box.y + 3 * cell }, // leaves again
    { x: box.x + 1.4 * cell, y: box.y + 4.4 * cell }, // and back in
  ]
  for (const pt of path) {
    await page.mouse.move(pt.x, pt.y, { steps: 6 })
    await frames(page)
    await settle(page) // let the 70 ms snap glide (a transform transition) finish before measuring
    await expectSingleCarried(page, 'charger')
    const b = (await page.locator('.carried').boundingBox())!
    const inside = pt.x > box.x - cell / 2 && pt.x < box.x + box.width + cell / 2 && pt.y > box.y - cell / 2 && pt.y < box.y + box.height + cell / 2
    if (inside) {
      // snapped: its corner sits exactly on a grid line of the board
      const gx = (b.x - box.x) / cell
      const gy = (b.y - box.y) / cell
      expect(Math.abs(gx - Math.round(gx))).toBeLessThan(0.03)
      expect(Math.abs(gy - Math.round(gy))).toBeLessThan(0.03)
      await expect(page.locator('.carried')).toHaveClass(/snapped/)
    } else {
      // free: centred under the pointer within a pixel, no lag
      expect(Math.abs(b.x + b.width / 2 - pt.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(b.y + b.height / 2 - pt.y)).toBeLessThanOrEqual(1)
      await expect(page.locator('.carried')).not.toHaveClass(/snapped/)
    }
  }
  await page.mouse.move(box.x + box.width + 1.5 * cell, box.y + box.height + 1.5 * cell, { steps: 4 })
  await page.mouse.up()
  await frames(page)
  await expect(page.locator('.carried')).toHaveCount(0)
  await expect(piece(page, 'charger')).toBeVisible()
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /not packed/) // dropped outside: nothing placed
})

test('the carried object moves by transform only: no left/top/size animation, never a second painted copy', async ({ page }) => {
  const { box, cell } = await boardGeometry(page)
  const p = (await piece(page, 'shirt').boundingBox())!
  await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2)
  await page.mouse.down()
  const seen = new Set<string>()
  for (let i = 0; i < 24; i++) {
    await page.mouse.move(box.x + (i / 23) * box.width, box.y + (0.5 + (i % 5) * 0.8) * cell, { steps: 2 })
    await frames(page, 1)
    const info = await page.evaluate(() => {
      const el = document.querySelector('.carried') as HTMLElement
      const cs = getComputedStyle(el)
      const running = document.getAnimations().map((a) => (a as CSSTransition).transitionProperty ?? a.constructor.name)
      return { position: cs.position, left: cs.left, top: cs.top, running, copies: document.querySelectorAll('[data-carrying]').length }
    })
    expect(info.position).toBe('fixed')
    expect(info.left).toBe('0px') // position is never changed through left/top
    expect(info.top).toBe('0px')
    expect(info.copies).toBe(1)
    for (const prop of info.running) seen.add(prop)
  }
  // The only thing ever allowed to animate while carrying is the compositor-friendly transform.
  expect([...seen].filter((prop) => prop !== 'transform')).toEqual([])
  await page.mouse.up()
})

test('the original stays out of sight while carried, and returns on cancel, on a refused drop and across repeated drags', async ({ page }) => {
  const { box, cell } = await boardGeometry(page)
  const count = await page.locator('.piece').count()
  const toolbarVisible = () => piece(page, 'charger').isVisible()
  for (let round = 0; round < 4; round++) {
    const p = (await piece(page, 'charger').boundingBox())!
    await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 2 * cell, box.y + 2 * cell, { steps: 5 })
    await frames(page)
    await expectSingleCarried(page, 'charger')
    if (round % 2 === 0) {
      // browser takes the pointer away (pointercancel): the item goes home, nothing lingers
      await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel')))
    } else {
      // dropped on an occupied/illegal place is covered elsewhere; here drop outside the suitcase and tray
      await page.mouse.move(box.x + box.width + 2 * cell, box.y + box.height + 2 * cell, { steps: 3 })
      await page.mouse.up()
    }
    await frames(page)
    await expect(page.locator('.carried')).toHaveCount(0)
    expect(await toolbarVisible()).toBe(true)
    expect(await page.locator('.piece').count()).toBe(count) // no element was duplicated or lost
    await page.mouse.up().catch(() => {})
  }
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /not packed/)
})

test('repeated real drags: place, pick up from the board, move it, and take it out again', async ({ page }) => {
  const { box, cell } = await boardGeometry(page)
  const drag = async (id: string, to: { x: number; y: number }) => {
    const b = (await piece(page, id).boundingBox())!
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 8 })
    await frames(page)
    await expectSingleCarried(page, id)
    await page.mouse.up()
    await frames(page)
    await expect(page.locator('.carried')).toHaveCount(0)
  }
  await drag('charger', { x: box.x + 1.2 * cell, y: box.y + 0.5 * cell }) // tray -> board
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 1, row 1/)
  await drag('charger', { x: box.x + 3.2 * cell, y: box.y + 2.5 * cell }) // board -> another cell
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 3, row 3/)
  const tray = (await page.getByLabel('Items to pack').boundingBox())!
  await drag('charger', { x: tray.x + tray.width / 2, y: tray.y + tray.height / 2 }) // board -> tray removes it
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /not packed/)
  await expect(piece(page, 'charger')).toBeVisible()
})

test('rotating mid-drag keeps the single carried object following the pointer and swaps its footprint', async ({ page }) => {
  const { box, cell } = await boardGeometry(page)
  const jeans = (await piece(page, 'jeans').boundingBox())!
  await page.mouse.move(jeans.x + jeans.width / 2, jeans.y + jeans.height / 2)
  await page.mouse.down()
  const at = { x: box.x - 0.9 * cell, y: box.y + 2 * cell } // beyond the half-cell snap margin: free-floating
  await page.mouse.move(at.x, at.y, { steps: 8 })
  await frames(page)
  const before = (await page.locator('.carried').boundingBox())!
  expect(before.width).toBeCloseTo(6 * cell, 0)
  await page.keyboard.press('r')
  await frames(page)
  await expectSingleCarried(page, 'jeans')
  const after = (await page.locator('.carried').boundingBox())!
  expect(after.width).toBeCloseTo(cell, 0)
  expect(after.height).toBeCloseTo(6 * cell, 0)
  expect(Math.abs(after.x + after.width / 2 - at.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(after.y + after.height / 2 - at.y)).toBeLessThanOrEqual(1)
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

test.describe('touch', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })

  test('a real touch drag (pointer type "touch") places an item and does not scroll the page', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'injects touch through the Chrome DevTools Protocol')
    await page.reload()
    const toggle = page.getByRole('button', { name: /Dev tools/ })
    if ((await toggle.getAttribute('aria-expanded')) === 'true') await toggle.click()
    const { box, cell } = await boardGeometry(page)
    const shirt = (await piece(page, 'shirt').boundingBox())!
    const cdp = await page.context().newCDPSession(page)
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x?: number, y?: number) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: x!, y: y! }] })
    const scrollBefore = await page.evaluate(() => window.scrollY)
    const boardBefore = (await board(page).boundingBox())!
    const from = { x: shirt.x + shirt.width / 2, y: shirt.y + shirt.height / 2 }
    const to = { x: box.x + 2.5 * cell, y: box.y + 2 * cell }
    await touch('touchStart', from.x, from.y)
    for (let i = 1; i <= 20; i++) await touch('touchMove', from.x + ((to.x - from.x) * i) / 20, from.y + ((to.y - from.y) * i) / 20)
    // the board must not shift while the hint text changes mid-drag (it used to re-centre on phones)
    expect(await board(page).boundingBox()).toEqual(boardBefore)
    await page.waitForTimeout(60) // a real finger rests for a few frames before lifting
    await touch('touchEnd')
    await expect(piece(page, 'shirt')).toHaveAttribute('aria-label', /packed at column 2, row 2/)
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)
  })
})
