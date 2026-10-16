import { expect, test } from '@playwright/test'
import { board, boardGeometry, dragItem, packStep, pageHasNoHorizontalScroll, piece } from './helpers'
import { LEVEL1 } from './solutions'

const KEY = 'make-it-fit:progress:v1'
const tab = (page: import('@playwright/test').Page, n: number) => page.getByRole('button', { name: new RegExp(`^Level ${n}`) })
const stored = (page: import('@playwright/test').Page) => page.evaluate((k) => localStorage.getItem(k), KEY)

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('dragging snaps an item onto the grid and Undo puts it back', async ({ page }) => {
  await dragItem(page, 'charger', 3, 0)
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 4, row 1/)
  await expect(page.getByRole('region', { name: 'Objective' }).locator('.pill').first()).toContainText('1/5')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /not packed/)
})

test('an invalid drop is refused and explained', async ({ page }) => {
  await dragItem(page, 'jeans', 0, 0) // 6 wide on a 5 wide board
  await expect(piece(page, 'jeans')).toHaveAttribute('aria-label', /not packed/)
  await expect(page.getByRole('status').filter({ hasText: "doesn't fit there" })).toBeVisible()
})

test('rotating keeps one scale and never moves the tray, board or page', async ({ page }) => {
  const tray = page.getByLabel('Items to pack')
  const trayBefore = (await tray.boundingBox())!
  const boardBefore = (await board(page).boundingBox())!
  const cell = boardBefore.width / 5
  const jeans = piece(page, 'jeans')
  const a = (await jeans.boundingBox())!
  expect(a.width).toBeCloseTo(6 * cell, 0)
  expect(a.height).toBeCloseTo(cell, 0)
  const heightBefore = await page.evaluate(() => document.documentElement.scrollHeight)
  await jeans.click()
  await page.keyboard.press('r')
  const b = (await jeans.boundingBox())!
  expect(b.width).toBeCloseTo(cell, 0)
  expect(b.height).toBeCloseTo(6 * cell, 0)
  for (let i = 0; i < 4; i++) await page.keyboard.press('r') // full turns and back
  expect(await tray.boundingBox()).toEqual(trayBefore)
  expect(await board(page).boundingBox()).toEqual(boardBefore)
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(heightBefore)
})

test('keyboard: pick up, move, place, and Delete removes', async ({ page }) => {
  const charger = piece(page, 'charger')
  await charger.focus()
  await charger.press('Enter')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(charger).toHaveAttribute('aria-label', /packed at column 3, row 3/)
  await expect(charger).toBeFocused()
  await page.keyboard.press('Delete')
  await expect(charger).toHaveAttribute('aria-label', /not packed/)
})

test('objective area is concise and gives live green/red feedback while dragging', async ({ page }) => {
  const objective = page.getByRole('region', { name: 'Objective' })
  await expect(objective).toContainText('Fit all 5 items into the suitcase')
  await expect(objective).toContainText('Required')
  const { box, cell } = await boardGeometry(page)
  const p = (await piece(page, 'charger').boundingBox())!
  await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 2.5 * cell, box.y + 2.5 * cell, { steps: 8 })
  await expect(objective).toContainText('Green — it fits here.')
  await page.mouse.move(box.x + box.width + cell * 0.4, box.y + 2.5 * cell, { steps: 4 }) // half off the edge
  await expect(objective).toContainText('Red — it sticks out of the suitcase.')
  await page.mouse.up()
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /not packed/)
})

test('Level 1: solving it shows the success dialog, Next level moves on, progress persists, Clear resets', async ({ page }) => {
  await expect(tab(page, 2)).toBeDisabled()
  await expect(tab(page, 3)).toBeDisabled()
  for (const step of LEVEL1.slice(0, -1)) await packStep(page, step)
  const boardBefore = await board(page).boundingBox()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await packStep(page, LEVEL1[LEVEL1.length - 1])

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Packed!' })).toBeVisible()
  await expect(dialog).toContainText('Required items 5/5')
  await expect(dialog).not.toContainText('Bonus') // Level 1 has no bonus
  await expect(dialog).not.toContainText('Perfect pack')
  await expect(dialog).not.toContainText('Maximum bonus')
  await expect(dialog.getByRole('button', { name: 'Next level' })).toBeFocused()
  expect(await board(page).boundingBox()).toEqual(boardBefore) // success state never shifts the layout
  await expect(tab(page, 2)).toBeEnabled()
  expect(await stored(page)).toContain('"01"')

  await dialog.getByRole('button', { name: 'Next level' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(tab(page, 2)).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('region', { name: 'Objective' })).toContainText('Pack your items within the allowance')
  await expect(tab(page, 1)).toContainText('✓')

  await page.reload()
  await expect(tab(page, 2)).toBeEnabled()
  await expect(tab(page, 2)).toHaveAttribute('aria-current', 'page') // resumes at first unfinished level
  await expect(tab(page, 1)).toContainText('✓')

  await page.getByRole('button', { name: 'Clear saved progress' }).click()
  await expect(tab(page, 2)).toBeDisabled()
  await expect(tab(page, 1)).not.toContainText('✓')
  expect(JSON.parse((await stored(page))!).completed).toEqual({})
  await page.reload()
  await expect(tab(page, 1)).toHaveAttribute('aria-current', 'page')
  await expect(tab(page, 2)).toBeDisabled()
})

test('success dialog: focus is managed, Escape keeps packing, and it does not reappear', async ({ page }) => {
  for (const step of LEVEL1) await packStep(page, step)
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Next level' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Keep packing' })).toBeFocused()
  await page.keyboard.press('Tab') // focus stays trapped inside the dialog
  await expect(dialog.getByRole('button', { name: 'Next level' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.locator(':focus')).toBeVisible() // focus returned somewhere real
  const objective = page.getByRole('region', { name: 'Objective' })
  await expect(objective).toContainText('Packed!')
  await expect(objective.getByRole('button', { name: 'Next level →' })).toBeVisible()
  // undo + redo the last item: still solved again, but the dialog is not shown a second time
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(objective).not.toContainText('Packed!')
  await page.getByRole('button', { name: 'Undo' }).click()
  await page.keyboard.press('Control+z') // no-op past history start must not throw
  await expect(dialog).toHaveCount(0)
})

test('after completion the bonus can still be improved up to the Maximum bonus (Level 2)', async ({ page }) => {
  await page.getByRole('button', { name: 'L2', exact: true }).click()
  await page.getByRole('button', { name: 'Fill required only' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
  const objective = page.getByRole('region', { name: 'Objective' })
  const bonus = objective.locator('.pill.bonus')
  await expect(objective).toContainText('Packed!')
  await expect(bonus).toContainText('0/2')
  await expect(objective.locator('.pill.weight')).toContainText('5.15/7 kg')
  await expect(objective).not.toContainText('Maximum bonus')
  await packStep(page, { id: 'vibrator', rotations: 0, col: 1, row: 0 })
  await expect(bonus).toContainText('1/2')
  await expect(objective.locator('.pill.weight')).toContainText('5.55/7 kg')
  await expect(objective).toContainText('★ extras are optional.') // bonus is never presented as something missed
  await expect(bonus).not.toContainText('Maximum bonus')
  await packStep(page, { id: 'frame', rotations: 0, col: 4, row: 0 })
  await expect(bonus).toContainText('2/2')
  await expect(bonus).toContainText('Maximum bonus')
  await expect(bonus).not.toContainText('Perfect pack')
  await expect(objective.locator('.pill.weight')).toContainText('6.55/7 kg')
  await expect(objective).toContainText('Maximum bonus!')
  await expect(objective).not.toContainText('Perfect pack')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

for (const [w, h] of [[1440, 900], [1280, 720]] as const) {
  for (const id of ['L1', 'L2', 'L3']) {
    test(`${w}×${h}: ${id} fits the viewport without scrolling (board, tray, controls, objective)`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await page.getByRole('button', { name: id, exact: true }).click()
      await page.waitForTimeout(100)
      const noScroll = await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth)
      expect(noScroll).toBe(true)
      for (const loc of [
        board(page),
        page.getByLabel('Items to pack'),
        page.getByRole('region', { name: 'Objective' }),
        page.getByRole('button', { name: 'Rotate', exact: true }),
        page.getByRole('button', { name: 'Reset', exact: true }),
      ]) {
        const b = (await loc.boundingBox())!
        expect(b.y).toBeGreaterThanOrEqual(0)
        expect(b.y + b.height).toBeLessThanOrEqual(h)
        expect(b.x + b.width).toBeLessThanOrEqual(w)
      }
    })
  }
}

// Responsive matrix: the chosen arrangement must work at desktop, tablet, phone and landscape-phone sizes.
for (const [w, h] of [[1440, 900], [1280, 720], [1100, 700], [1024, 768], [768, 1024], [430, 932], [390, 844], [360, 740], [844, 390]] as const) {
  for (const id of ['L1', 'L2', 'L3']) {
    test(`layout ${w}×${h} ${id}: no horizontal scroll, suitcase and tools on screen, weight chips never clipped`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      const toggle = page.getByRole('button', { name: /Dev tools/ })
      if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click()
      await page.getByRole('button', { name: id, exact: true }).click()
      await toggle.click() // collapse so the dev panel cannot cover the game
      await page.waitForTimeout(100)
      expect(await pageHasNoHorizontalScroll(page)).toBe(true)
      const vp = page.viewportSize()!
      const inView = (b: { x: number; y: number; width: number; height: number }) => b.x >= -0.5 && b.x + b.width <= vp.width + 0.5 && b.y >= -0.5 && b.y + b.height <= vp.height + 0.5
      // the whole suitcase and the tool buttons are visible without scrolling the page
      expect(inView((await board(page).boundingBox())!), 'board on screen').toBe(true)
      for (const name of ['Rotate', 'Reset']) expect(inView((await page.getByRole('button', { name, exact: true }).boundingBox())!), `${name} on screen`).toBe(true)
      // every weight chip lies inside the tray and the page horizontally (the Level 3 bathrobe chip used to hang off the edge)
      const tray = (await page.getByLabel('Items to pack').boundingBox())!
      for (const chip of await page.locator('.in-tray .chip-w').all()) {
        const b = (await chip.boundingBox())!
        expect(b.x, 'chip left edge').toBeGreaterThanOrEqual(Math.max(tray.x, 0) - 0.5)
        expect(b.x + b.width, 'chip right edge').toBeLessThanOrEqual(Math.min(tray.x + tray.width, vp.width) + 0.5)
      }
    })
  }
}

test('phone: the suitcase and the tool buttons stay pinned while the Level 3 tray scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const toggle = page.getByRole('button', { name: /Dev tools/ })
  if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click()
  await page.getByRole('button', { name: 'L3', exact: true }).click()
  await toggle.click()
  const scrollable = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  expect(scrollable).toBeGreaterThan(200) // the tray really is longer than the screen
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(100)
  const b = (await board(page).boundingBox())!
  expect(b.y).toBeGreaterThanOrEqual(0)
  expect(b.y + b.height).toBeLessThanOrEqual(844)
  for (const name of ['Rotate', 'Undo']) {
    const r = (await page.getByRole('button', { name, exact: true }).boundingBox())!
    expect(r.y + r.height).toBeLessThanOrEqual(844)
  }
  // a tray item scrolled to the bottom can still be dragged onto the pinned suitcase
  await dragItem(page, 'emergency_socks', 0, 0)
  await expect(piece(page, 'emergency_socks')).toHaveAttribute('aria-label', /packed at column 1, row 1/)
})

test('reduced motion removes the dialog animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'L1', exact: true }).click()
  await page.getByRole('button', { name: 'Fill required only' }).click()
  const animation = await page.locator('.dialog').evaluate((el) => getComputedStyle(el).animationName)
  expect(animation).toBe('none')
})

test('phone: the success dialog fits the screen and its buttons are tappable size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const toggle = page.getByRole('button', { name: /Dev tools/ })
  if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click() // collapsed by default on phones
  await page.getByRole('button', { name: 'L2', exact: true }).click()
  await page.getByRole('button', { name: 'Fill max bonus' }).click()
  const d = (await page.locator('.dialog').boundingBox())!
  expect(d.x).toBeGreaterThanOrEqual(0)
  expect(d.x + d.width).toBeLessThanOrEqual(390)
  expect(d.y + d.height).toBeLessThanOrEqual(844)
  for (const name of ['Next level', 'Keep packing', 'Play again']) {
    const btn = page.locator('.dialog').getByRole('button', { name })
    if (await btn.count()) expect((await btn.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  }
})

test('dev tools never record progress or unlock levels', async ({ page }) => {
  await page.getByRole('button', { name: 'L3', exact: true }).click()
  await page.getByRole('button', { name: 'Fill max bonus' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await stored(page)).toBeNull()
  await expect(tab(page, 2)).toBeDisabled()
  await expect(tab(page, 3)).toBeDisabled()
  await page.reload()
  await expect(tab(page, 1)).toHaveAttribute('aria-current', 'page')
})

test('Level 2 allowance: the Maximum bonus is within 7 kg; going over blocks "Packed!" and Undo restores it', async ({ page }) => {
  await page.getByRole('button', { name: 'L2', exact: true }).click()
  await page.getByRole('button', { name: 'Fill max bonus' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Within the allowance 6.55/7 kg')
  await expect(dialog).toContainText('Bonus 2/2')
  await expect(dialog).toContainText('Maximum bonus!')
  await expect(dialog).not.toContainText('Perfect pack')
  await expect(dialog.locator('.bonus-result')).not.toContainText('/6')
  await dialog.getByRole('button', { name: 'Keep packing' }).click()
  const objective = page.getByRole('region', { name: 'Objective' })
  await expect(objective.locator('.pill.weight')).toContainText('6.55/7 kg')

  // Pack a verified arrangement by hand where the massager and then the disco ball bring the total to 7.05 kg.
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(objective.locator('.pill.weight')).toContainText('0/7 kg')
  const required = [
    { id: 'handbag', rotations: 0, col: 0, row: 0 },
    { id: 'flamingo', rotations: 0, col: 0, row: 3 },
    { id: 'outfit', rotations: 0, col: 2, row: 0 },
    { id: 'toiletries', rotations: 0, col: 4, row: 1 },
  ]
  for (const step of required) await packStep(page, step)
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click() // required items packed: 5.15 kg
  await packStep(page, { id: 'vibrator', rotations: 1, col: 3, row: 2 })
  await expect(objective.locator('.pill.weight')).toContainText('5.55/7 kg')
  await expect(objective).toContainText('Packed!')

  await packStep(page, { id: 'disco_ball', rotations: 0, col: 4, row: 3 }) // placing is allowed; the total is now 7.05 kg
  await expect(objective.locator('.pill.weight.over')).toContainText('7.05/7 kg')
  await expect(objective).toContainText('Over the allowance by 50 g')
  await expect(objective).not.toContainText('Packed!')

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(objective.locator('.pill.weight')).toContainText('5.55/7 kg')
  await expect(objective).toContainText('Packed!')
})

test('Level 3: a real packing that weighs exactly the 23 kg allowance succeeds', async ({ page }) => {
  await page.getByRole('button', { name: 'L3', exact: true }).click()
  const objective = page.getByRole('region', { name: 'Objective' })
  const steps = [
    { id: 'cutout', rotations: 0, col: 0, row: 0 },
    { id: 'laundry', rotations: 0, col: 5, row: 0 },
    { id: 'heels', rotations: 0, col: 0, row: 4 },
    { id: 'robe', rotations: 0, col: 0, row: 1 },
    { id: 'outfit', rotations: 3, col: 3, row: 1 },
    { id: 'hangover', rotations: 0, col: 6, row: 4 },
  ]
  for (const step of steps) await packStep(page, step) // required items: 12 kg
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
  await packStep(page, { id: 'ceramic_foot', rotations: 0, col: 3, row: 4 })
  await packStep(page, { id: 'gnome', rotations: 1, col: 5, row: 2 })
  await expect(objective.locator('.pill.weight')).toContainText('23/23 kg')
  await expect(objective.locator('.pill.weight')).not.toHaveClass(/over/)
  await expect(objective).toContainText('Packed!')
  await expect(objective.locator('.pill.bonus')).toContainText('3/5')
})

test('item weights are printed on every Level 2 item: grams below 1 kg, kilograms from 1 kg', async ({ page }) => {
  await page.getByRole('button', { name: 'L2', exact: true }).click()
  const weights = page.locator('.in-tray [data-weight]')
  await expect(weights).toHaveCount(10)
  for (const text of await weights.allTextContents()) expect(text).toMatch(/^★?\d+(\.\d+)? (g|kg)$/)
  await expect(piece(page, 'toiletries').locator('.wlabel')).toHaveText('1 kg') // printed on the drawn toiletries pouch
  await expect(piece(page, 'vibrator').locator('.wlabel')).toHaveText('★400 g') // every Level 2 item prints its weight on its own label
  await expect(piece(page, 'handbag').locator('.wlabel')).toHaveText('2.25 kg')
  await expect(piece(page, 'dvds').locator('.wlabel')).toHaveText('★1.5 kg')
})

for (const [n, id] of [[1, 'L1'], [2, 'L2'], [3, 'L3']] as const) {
  test(`phone width: Level ${n} has no horizontal scroll and everything is on screen`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const toggle = page.getByRole('button', { name: /Dev tools/ })
    if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click()
    await page.getByRole('button', { name: id, exact: true }).click()
    await toggle.click() // collapse so the dev panel cannot cover the game controls
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(await pageHasNoHorizontalScroll(page)).toBe(true)
    const b = (await board(page).boundingBox())!
    expect(b.x).toBeGreaterThanOrEqual(0)
    expect(b.x + b.width).toBeLessThanOrEqual(390)
    const tray = (await page.getByLabel('Items to pack').boundingBox())!
    expect(tray.x + tray.width).toBeLessThanOrEqual(390)
    await page.getByRole('button', { name: 'Rotate', exact: true }).click()
    expect(await pageHasNoHorizontalScroll(page)).toBe(true)
  })
}

test('desktop: Level 3 tray stays put while every item is rotated', async ({ page }) => {
  await page.getByRole('button', { name: 'L3', exact: true }).click()
  const tray = page.getByLabel('Items to pack')
  const before = await tray.boundingBox()
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  for (const id of ['cutout', 'laundry', 'outfit', 'hangover', 'heels', 'hotel_lamp', 'ceramic_foot', 'gnome', 'cheese', 'liquor', 'robe', 'emergency_socks']) {
    await piece(page, id).click()
    await page.keyboard.press('r')
    expect(await tray.boundingBox()).toEqual(before)
  }
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(pageHeight)
})

test.describe('dev workflow: Test win & continue', () => {
  const testWin = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /Test win/ }).click()

  test('walks L1 → L2 → L3 through the real success dialog without saving anything', async ({ page }) => {
    await expect(page.getByText('TEST MODE')).toHaveCount(0)
    await testWin(page)
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Packed!' })).toBeVisible()
    await expect(dialog).toContainText('TEST RUN — not saved')
    await expect(page.getByText(/TEST MODE/)).toBeVisible()
    await dialog.getByRole('button', { name: 'Next level' }).click()
    await expect(tab(page, 2)).toHaveAttribute('aria-current', 'page')
    await expect(tab(page, 1)).toContainText('✓ test')

    await testWin(page)
    await page.getByRole('dialog').getByRole('button', { name: 'Next level' }).click()
    await expect(tab(page, 3)).toHaveAttribute('aria-current', 'page')

    await testWin(page)
    const last = page.getByRole('dialog')
    await expect(last).toContainText('Bonus 5/5')
    await expect(last).toContainText('Perfect pack!')
    await expect(last).not.toContainText('Maximum bonus')
    await expect(last.getByRole('button', { name: 'Play again' })).toBeVisible() // last level: no next
    expect(await stored(page)).toBeNull()

    await page.reload() // reload isolation: all test state is gone
    await expect(page.getByText(/TEST MODE/)).toHaveCount(0)
    await expect(tab(page, 1)).toHaveAttribute('aria-current', 'page')
    await expect(tab(page, 2)).toBeDisabled()
    await expect(tab(page, 3)).toBeDisabled()
    await expect(tab(page, 1)).not.toContainText('✓')
    expect(await stored(page)).toBeNull()
  })

  test('never alters genuine saved progress', async ({ page }) => {
    const real = JSON.stringify({ version: 1, completed: { '01': { bestOptional: 0 } } })
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, real])
    await page.reload()
    await expect(tab(page, 2)).toBeEnabled() // genuinely unlocked
    await expect(tab(page, 2)).toHaveAttribute('aria-current', 'page')
    await testWin(page) // test-win Level 2
    await page.getByRole('dialog').getByRole('button', { name: 'Next level' }).click()
    await expect(tab(page, 3)).toHaveAttribute('aria-current', 'page')
    expect(await stored(page)).toBe(real)
    await page.reload()
    await expect(tab(page, 3)).toBeDisabled() // Level 2 was never really completed
    expect(await stored(page)).toBe(real)
  })

  test('Clear saved progress also drops temporary test unlocks', async ({ page }) => {
    await testWin(page)
    await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
    await expect(tab(page, 2)).toBeEnabled()
    await page.getByRole('button', { name: 'Clear saved progress' }).click()
    await expect(tab(page, 2)).toBeDisabled()
    await expect(tab(page, 1)).not.toContainText('✓')
  })
})
