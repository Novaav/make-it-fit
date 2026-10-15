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
  await dragItem(page, 'passport', 4, 0)
  await expect(piece(page, 'passport')).toHaveAttribute('aria-label', /packed at column 5, row 1/)
  await expect(page.getByRole('region', { name: 'Objective' }).locator('.pill').first()).toContainText('1/6')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(piece(page, 'passport')).toHaveAttribute('aria-label', /not packed/)
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
  const passport = piece(page, 'passport')
  await passport.focus()
  await passport.press('Enter')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(passport).toHaveAttribute('aria-label', /packed at column 4, row 3/)
  await expect(passport).toBeFocused()
  await page.keyboard.press('Delete')
  await expect(passport).toHaveAttribute('aria-label', /not packed/)
})

test('objective area is concise and gives live green/red feedback while dragging', async ({ page }) => {
  const objective = page.getByRole('region', { name: 'Objective' })
  await expect(objective).toContainText('Fit all 6 items into the suitcase')
  await expect(objective).toContainText('Required')
  const { box, cell } = await boardGeometry(page)
  const p = (await piece(page, 'passport').boundingBox())!
  await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 2.5 * cell, box.y + 2.5 * cell, { steps: 8 })
  await expect(objective).toContainText('Green — it fits here.')
  await page.mouse.move(box.x + box.width + cell * 0.4, box.y + 2.5 * cell, { steps: 4 }) // half off the edge
  await expect(objective).toContainText('Red — it sticks out of the suitcase.')
  await page.mouse.up()
  await expect(piece(page, 'passport')).toHaveAttribute('aria-label', /not packed/)
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
  await expect(dialog).toContainText('Required items 6/6')
  await expect(dialog.getByRole('button', { name: 'Next level' })).toBeFocused()
  expect(await board(page).boundingBox()).toEqual(boardBefore) // success state never shifts the layout
  await expect(tab(page, 2)).toBeEnabled()
  expect(await stored(page)).toContain('"01"')

  await dialog.getByRole('button', { name: 'Next level' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(tab(page, 2)).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('region', { name: 'Objective' })).toContainText('Pack all required items under 15 kg')
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
  await expect(objective).toContainText('Level packed.')
  await expect(objective.getByRole('button', { name: 'Next level →' })).toBeVisible()
  // undo + redo the last item: still solved again, but the dialog is not shown a second time
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(objective).not.toContainText('Level packed.')
  await page.getByRole('button', { name: 'Undo' }).click()
  await page.keyboard.press('Control+z') // no-op past history start must not throw
  await expect(dialog).toHaveCount(0)
})

test('after completion the bonus can still be improved (Level 2)', async ({ page }) => {
  await page.getByRole('button', { name: 'L2', exact: true }).click()
  await page.getByRole('button', { name: 'Fill required only' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
  const objective = page.getByRole('region', { name: 'Objective' })
  await expect(objective).toContainText('Level packed.')
  await expect(objective.locator('.pill.bonus')).toContainText('0/2')
  await expect(objective.locator('.pill.bonus')).not.toContainText('Max!')
  await dragItem(page, 'ex_photo', 4, 1)
  await expect(objective.locator('.pill.bonus')).toContainText('1/2')
  await expect(objective.locator('.pill.bonus')).not.toContainText('Max!')
  await expect(objective).toContainText('Add more ★ items')
  await dragItem(page, 'extra_shoes', 0, 2)
  await expect(objective.locator('.pill.bonus')).toContainText('2/2')
  await expect(objective.locator('.pill.bonus')).toContainText('Max!')
  await expect(objective.locator('.pill.weight')).toContainText('15/15 kg')
  await expect(objective).toContainText('Bonus maxed.')
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

test('Level 2 weight rule: over the limit blocks completion, undo restores it', async ({ page }) => {
  await page.getByRole('button', { name: 'L2', exact: true }).click()
  await page.getByRole('button', { name: 'Fill max bonus' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Weight 15/15 kg')
  await expect(dialog).toContainText('Bonus 2/2')
  await expect(dialog).toContainText('Max!')
  await expect(dialog.locator('.bonus-result')).not.toContainText('/5')
  await dialog.getByRole('button', { name: 'Keep packing' }).click()
  const objective = page.getByRole('region', { name: 'Objective' })
  await expect(objective.locator('.pill.weight')).toContainText('15/15 kg')

  await page.getByRole('button', { name: 'Fill required only' }).click()
  await expect(objective.locator('.pill.weight')).toContainText('10/15 kg')
  await dragItem(page, 'disco_ball', 4, 1) // +4 kg, still within the limit
  await expect(piece(page, 'disco_ball')).toHaveAttribute('aria-label', /packed at column 5, row 2/)
  await expect(objective.locator('.pill.weight')).toContainText('14/15 kg')
  await expect(objective).toContainText('Level packed.')

  await dragItem(page, 'extra_shoes', 0, 2) // +3 kg: allowed, but over the limit
  await expect(piece(page, 'extra_shoes')).toHaveAttribute('aria-label', /packed at column 1, row 3/)
  await expect(objective.locator('.pill.weight.over')).toContainText('17/15 kg')
  await expect(objective).toContainText('Over by 2 kg')
  await expect(objective).not.toContainText('Level packed.')

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(objective.locator('.pill.weight')).toContainText('14/15 kg')
  await expect(objective).toContainText('Level packed.')
})

test('item weights are visible on every Level 2 item', async ({ page }) => {
  await page.getByRole('button', { name: 'L2', exact: true }).click()
  const chips = page.locator('.in-tray .chip-w')
  await expect(chips).toHaveCount(10)
  for (const text of await chips.allTextContents()) expect(text).toMatch(/^\d+ kg( ★)?$/)
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
  for (const id of ['cutout', 'outfit', 'hotel_lamp', 'ceramic_foot', 'toiletries', 'charger', 'emergency_socks']) {
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
    await expect(last).toContainText('Bonus 2/2')
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
