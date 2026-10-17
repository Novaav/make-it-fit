import { expect, test, type Page } from '@playwright/test'
import { board, packStep, piece } from './helpers'
import { LEVEL1, LEVEL2_NORMAL } from './solutions'

// Arrangement and progression: what the suitcase looks like when you come back, and what "completed" means.
const BOARDS = 'make-it-fit:boards:v1'
const PROGRESS = 'make-it-fit:progress:v1'
const tab = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^Level ${n}`) })
const objective = (page: Page) => page.getByRole('region', { name: 'Objective' })
const stored = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key)
const packedCount = (page: Page) => page.locator('.piece.on-board').count()

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('make-it-fit:intro:v1', JSON.stringify({ version: 1, seen: { '01': true, '02': true, '03': true } }))
  })
  await page.reload()
})

async function winLevel1(page: Page) {
  for (const s of LEVEL1) await packStep(page, s)
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
}

test('each level keeps its own arrangement when you switch levels, and after a reload', async ({ page }) => {
  await winLevel1(page)
  await tab(page, 2).click()
  await packStep(page, LEVEL2_NORMAL[0])
  await packStep(page, LEVEL2_NORMAL[1])
  await expect(objective(page).locator('.pill.chaos')).toContainText('11')

  await tab(page, 1).click()
  await expect(objective(page)).toContainText('5/5') // Level 1 is exactly as it was left
  await expect(page.getByRole('dialog')).toHaveCount(0) // coming back is not a new achievement
  await tab(page, 2).click()
  expect(await packedCount(page)).toBe(2)
  await expect(piece(page, 'handbag')).toHaveAttribute('aria-label', /packed at column 1, row 1/)
  await expect(objective(page).locator('.pill.chaos')).toContainText('11')

  await page.reload()
  await expect(tab(page, 2)).toHaveAttribute('aria-current', 'page') // resumes at the first unfinished level
  expect(await packedCount(page)).toBe(2)
  await expect(piece(page, 'flamingo')).toHaveAttribute('aria-label', /packed at column 4, row 1/)
  await tab(page, 1).click()
  await expect(objective(page)).toContainText('5/5')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('a level completed earlier is never shown as complete while its current arrangement is not', async ({ page }) => {
  await winLevel1(page)
  await tab(page, 2).click()
  for (const s of LEVEL2_NORMAL) await packStep(page, s)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
  expect(JSON.parse((await stored(page, PROGRESS))!).completed['02']).toBeTruthy() // the achievement is recorded

  await piece(page, 'dvds').click()
  await page.keyboard.press('Delete') // now the arrangement is below the target
  await expect(objective(page)).not.toContainText('Packed!')
  await expect(objective(page).locator('.pill.chaos')).toContainText('15')

  await tab(page, 1).click()
  await tab(page, 2).click()
  await expect(objective(page)).not.toContainText('Packed!') // the old achievement does not make it complete
  await expect(objective(page).locator('.pill.chaos')).toContainText('15')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(tab(page, 2)).toContainText('✓') // ...but it is still remembered as completed earlier
  await expect(tab(page, 2).locator('[title="Completed earlier"]')).toHaveCount(1)
  expect(JSON.parse((await stored(page, PROGRESS))!).completed['02']).toBeTruthy() // legitimate progress is never erased

  await page.reload()
  await tab(page, 2).click()
  await expect(objective(page)).not.toContainText('Packed!')
  await expect(objective(page).locator('.pill.chaos')).toContainText('15')
  await expect(tab(page, 3)).toBeEnabled() // the unlock earned earlier stays
})

test('a restored, still complete level does not reopen its completion dialog', async ({ page }) => {
  await winLevel1(page)
  await tab(page, 2).click()
  await tab(page, 1).click()
  await expect(objective(page)).toContainText('Packed!')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.reload()
  await tab(page, 1).click()
  await expect(objective(page)).toContainText('Packed!')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  // the Next level shortcut still belongs to the valid current arrangement
  await expect(objective(page).getByRole('button', { name: /Next level/ })).toBeVisible()
})

test('corrupt, outdated or impossible saved boards are ignored safely', async ({ page }) => {
  for (const raw of ['{not json', JSON.stringify({ version: 2, boards: {} }), JSON.stringify({ version: 1, boards: { '01': { sig: 'old', placements: [{ itemId: 'shirt', orientation: 0, x: 0, y: 0 }] } } }), JSON.stringify({ version: 1, boards: { '01': { sig: 'x', placements: [{ itemId: 'shirt', orientation: 7, x: -1, y: 0 }] } } })]) {
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [BOARDS, raw])
    await page.reload()
    await expect(objective(page)).toContainText('0/5')
    expect(await packedCount(page)).toBe(0)
    await packStep(page, LEVEL1[4]) // and the game is fully playable
    await expect(objective(page)).toContainText('1/5')
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
  }
})

test('TEST MODE never touches the saved arrangement or progress', async ({ page }) => {
  await packStep(page, LEVEL1[4]) // charger: a genuine arrangement
  const boardsBefore = await stored(page, BOARDS)
  expect(boardsBefore).toContain('charger')
  await page.getByRole('button', { name: 'Fill normal win' }).click() // enters test mode and fills the suitcase
  await expect(page.getByText(/TEST MODE/)).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
  expect(await packedCount(page)).toBe(5)
  expect(await stored(page, BOARDS)).toBe(boardsBefore)
  expect(await stored(page, PROGRESS)).toBeNull()

  await page.reload() // leaving test mode: the genuine arrangement is back
  await expect(objective(page)).toContainText('1/5')
  expect(await packedCount(page)).toBe(1)
  expect(await stored(page, BOARDS)).toBe(boardsBefore)
})

test('a dev fill is applied once: returning to the level never refills it', async ({ page }) => {
  await page.getByRole('button', { name: /Test win/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Next level' }).click()
  await page.getByRole('button', { name: 'Fill normal win' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
  await piece(page, 'dvds').click()
  await page.keyboard.press('Delete')
  await expect(objective(page).locator('.pill.chaos')).toContainText('15')
  await tab(page, 1).click()
  await tab(page, 2).click()
  await expect(objective(page)).not.toContainText('Packed!') // used to be refilled and reopen the dialog
  await expect(objective(page).locator('.pill.chaos')).toContainText('15')
  expect(await packedCount(page)).toBe(3)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('the packing note says "good decisions" is crossed out', async ({ page }) => {
  const note = page.locator('.prop-list')
  await expect(note.locator('text', { hasText: 'good decisions' })).toHaveAttribute('text-decoration', 'line-through')
  await expect(note).not.toContainText('a plan')
})

test.describe('item identification', () => {
  test('hover, click and keyboard focus show name, weight and Chaos/mandatory, for packed and unpacked items, without moving anything', async ({ page }) => {
    await winLevel1(page)
    await tab(page, 2).click()
    const info = page.locator('.item-info')
    await expect(info).toContainText('Hover, tap or focus') // nothing selected yet: a hint
    await packStep(page, LEVEL2_NORMAL[0]) // handbag packed (and selected, as after any drag)
    const boardBefore = await board(page).boundingBox()
    const infoBefore = await info.boundingBox()

    await piece(page, 'handbag').hover() // packed, required
    await expect(info).toContainText('Louis Regretton handbag')
    await expect(info).toContainText('2.25 kg')
    await expect(info).toContainText('Chaos 6')
    await piece(page, 'dvds').hover() // unpacked, optional
    await expect(info).toContainText("Mom's Porn Collection")
    await expect(info).toContainText('1.5 kg')
    await expect(info).toContainText('Chaos 6')
    await piece(page, 'vibrator').hover()
    await expect(info).toContainText('Pocket massager')
    await expect(info).toContainText('400 g')

    await page.mouse.move(5, 5) // leave: back to the selected item
    await expect(info).toContainText('Louis Regretton handbag')
    await piece(page, 'boa').click() // click selects, and the selection stays after the mouse leaves
    await page.mouse.move(5, 5)
    await expect(info).toContainText('Feather boa')
    await expect(info).toContainText('300 g')

    await page.keyboard.press('Escape')
    await piece(page, 'flamingo').focus() // keyboard focus
    await expect(info).toContainText('Inflatable flamingo')
    await expect(info).toContainText('Chaos 5')
    expect(await board(page).boundingBox()).toEqual(boardBefore)
    expect(await info.boundingBox()).toEqual(infoBefore)
  })

  test('the info line follows the item being dragged and does not stop dragging', async ({ page }) => {
    await packStep(page, LEVEL1[4])
    await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed/)
    await piece(page, 'jeans').hover()
    await expect(page.locator('.item-info')).toContainText('Jeans')
    await expect(page.locator('.item-info')).not.toContainText('kg') // Level 1 has no allowance, so no weights
    await expect(page.locator('.item-info')).toContainText('Chaos 2') // Level 1 shows Chaos but no weights
  })
})

test.describe('touch', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })
  test('tapping an item shows what it is', async ({ page }) => {
    await page.reload()
    const toggle = page.getByRole('button', { name: /Dev tools/ })
    if ((await toggle.getAttribute('aria-expanded')) === 'true') await toggle.click()
    await page.evaluate(() => window.scrollTo(0, 150))
    await page.locator('[data-item="shirt"]').tap()
    await expect(page.locator('.item-info')).toContainText('T-shirt')
    await expect(page.locator('.item-info')).toContainText('Chaos 2')
  })
})
