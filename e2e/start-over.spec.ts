import { expect, test } from '@playwright/test'
import { load } from './helpers'

// "Start over": a returning player can deliberately wipe the saved game and see the opening and Level 1 again.
// It is only ever reached through a visible control and a confirmation; loading the page, or an address, never clears anything.
const PROGRESS = 'make-it-fit:progress:v1'
const BOARDS = 'make-it-fit:boards:v1'
const INTRO_KEY = 'make-it-fit:intro:v1'
const SOUND = 'make-it-fit:sound:v1'
const REAL_BROWSER = () => Object.defineProperty(navigator, 'webdriver', { get: () => false }) // automation skips the opening

const stored = (page: import('@playwright/test').Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key)
const startOverLink = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Start over' }).first()

test('a first visit shows Start over disabled (no layout shift), and an address never clears a saved game', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(startOverLink(page)).toBeDisabled()

  await load(page, { '01': { chaos: 9 } })
  await expect(startOverLink(page)).toBeEnabled()
  for (const url of ['/', '/?intro', '/?reset', '/?start-over']) {
    await page.goto(url)
    expect(await stored(page, PROGRESS)).toContain('"01"')
    expect(await stored(page, INTRO_KEY)).not.toBeNull()
  }
})

test('cancelling the confirmation keeps everything (button, Escape and backdrop)', async ({ page }) => {
  await load(page, { '01': { chaos: 9 } })
  const before = [await stored(page, PROGRESS), await stored(page, INTRO_KEY)]
  const dialog = page.getByRole('alertdialog', { name: 'Start over?' })

  await startOverLink(page).click()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Keep my progress' })).toBeFocused() // the safe choice is the default
  await dialog.getByRole('button', { name: 'Keep my progress' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(startOverLink(page)).toBeFocused()

  await startOverLink(page).click()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)

  await startOverLink(page).click()
  await page.mouse.click(5, 5)
  await expect(dialog).toHaveCount(0)

  expect([await stored(page, PROGRESS), await stored(page, INTRO_KEY)]).toEqual(before)
  await expect(page.getByRole('button', { name: /^Level 1/ })).toContainText('✓')
})

test('confirming clears the saved game but keeps the sound choice, then shows the opening and Level 1 again', async ({ page }) => {
  await page.addInitScript(REAL_BROWSER)
  await load(page, { '01': { chaos: 9 }, '02': { chaos: 20 } })
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ version: 1, muted: false })), SOUND)
  await page.evaluate((k) => sessionStorage.setItem(k, '1'), 'make-it-fit:opening:v1')
  await page.reload()
  await expect(page.locator('.app.opening')).toHaveCount(0) // a returning player goes straight in

  await startOverLink(page).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Start over' }).click()

  await expect(page.locator('.app.opening')).toHaveCount(1) // the opening plays again
  expect(await stored(page, PROGRESS)).toBeNull()
  expect(await stored(page, BOARDS)).toBeNull()
  expect(await stored(page, INTRO_KEY)).toBeNull()
  expect(await stored(page, SOUND)).toContain('"muted":false')
  expect(page.url()).not.toContain('?')

  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Level 1/ })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('button', { name: /^Level 1/ })).not.toContainText('✓')
  await expect(page.getByRole('button', { name: /^Level 2/ })).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByLabel(/How to play Level 1/)).toBeVisible() // the first-visit note again
  await expect(startOverLink(page)).toBeDisabled() // nothing saved yet, so nothing to start over
})

test('the control is disabled in TEST MODE and a test win never reaches the real save', async ({ page }) => {
  await load(page, { '01': { chaos: 9 } })
  const before = await stored(page, PROGRESS)
  const toggle = page.getByRole('button', { name: /Dev tools/ })
  await expect(toggle).toBeVisible()
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click()
  await page.getByRole('button', { name: 'Fill normal win' }).click()
  await expect(page.getByText(/TEST MODE/)).toBeVisible()
  await expect(startOverLink(page)).toBeDisabled() // disabled, not hidden, so nothing shifts
  expect(await stored(page, PROGRESS)).toBe(before)
})

test('Start over is reachable on a phone: no horizontal scroll, a 44 px hit area and bottom-right placement', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await load(page, { '01': { chaos: 9 } })
  await startOverLink(page).scrollIntoViewIfNeeded()
  const box = await startOverLink(page).boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(28)
  const hitArea = await startOverLink(page).evaluate((el) => {
    const a = getComputedStyle(el, '::after') // an invisible pseudo-element that extends the target
    return parseFloat(a.height)
  })
  expect(hitArea).toBeGreaterThanOrEqual(44)
  expect(box!.x + box!.width).toBeGreaterThan(360 - 40) // bottom right, inside the page padding
  expect(box!.x + box!.width).toBeLessThanOrEqual(360 - 8)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await startOverLink(page).scrollIntoViewIfNeeded()
  await startOverLink(page).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  const d = await dialog.boundingBox()
  expect(d!.x).toBeGreaterThanOrEqual(0)
  expect(d!.x + d!.width).toBeLessThanOrEqual(360)
})
