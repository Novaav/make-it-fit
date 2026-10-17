import { expect, test, type Page } from '@playwright/test'

const INTRO = 'make-it-fit:intro:v1'
const PROGRESS = 'make-it-fit:progress:v1'
const note = (page: Page) => page.getByRole('region', { name: /^How to play Level/ })
const tab = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^Level ${n}`) })
const seen = (page: Page) => page.evaluate((k) => localStorage.getItem(k), INTRO)

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('first visit shows the Level 1 note; Next pages through it and the last page starts the game', async ({ page }) => {
  await expect(note(page)).toBeVisible()
  await expect(note(page)).toContainText('Pack it all.')
  await expect(note(page).getByRole('button', { name: 'Next' })).toBeFocused()
  await note(page).getByRole('button', { name: 'Next' }).click()
  await expect(note(page)).toContainText('Turn things.')
  await note(page).getByRole('button', { name: 'Back' }).click()
  await expect(note(page)).toContainText('Pack it all.')
  await note(page).getByRole('button', { name: 'Next' }).click()
  await note(page).getByRole('button', { name: 'Let’s pack' }).click()
  await expect(note(page)).toHaveCount(0)
  expect(JSON.parse((await seen(page))!)).toEqual({ version: 1, seen: { '01': true } })
})

test('Skip closes it, remembers it across a reload, and never touches game progress', async ({ page }) => {
  await note(page).getByRole('button', { name: 'Skip' }).click()
  await expect(note(page)).toHaveCount(0)
  expect(await page.evaluate((k) => localStorage.getItem(k), PROGRESS)).toBeNull()
  await page.reload()
  await expect(note(page)).toHaveCount(0)
})

test('Escape skips, and How to play replays the note without changing what is stored', async ({ page }) => {
  await expect(note(page).getByRole('button', { name: 'Next' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(note(page)).toHaveCount(0)
  const stored = await seen(page)
  await page.getByRole('button', { name: /How to play/ }).click()
  await expect(note(page)).toBeVisible()
  await expect(note(page)).toContainText('Pack it all.')
  await page.keyboard.press('Escape')
  await expect(note(page)).toHaveCount(0)
  expect(await seen(page)).toBe(stored)
})

test('arrow keys move between pages', async ({ page }) => {
  await expect(note(page).getByRole('button', { name: 'Next' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(note(page)).toContainText('Turn things.')
  await page.keyboard.press('ArrowLeft')
  await expect(note(page)).toContainText('Pack it all.')
})

test('Level 2 and Level 3 each introduce themselves once, with their own rules', async ({ page }) => {
  await page.evaluate(
    ([k, p]) => {
      localStorage.setItem(k, JSON.stringify({ version: 1, seen: { '01': true } }))
      localStorage.setItem(p, JSON.stringify({ version: 2, completed: { '01': {}, '02': {} } }))
    },
    [INTRO, PROGRESS],
  )
  await page.reload()
  await tab(page, 2).click()
  await expect(note(page)).toContainText('Collect Chaos.')
  await expect(note(page)).toContainText('Pack 20 Chaos to win')
  await note(page).getByRole('button', { name: 'Skip' }).click()
  await tab(page, 3).click()
  await expect(note(page)).toContainText('Baggage you can’t leave.')
  await note(page).getByRole('button', { name: 'Skip' }).click()
  await tab(page, 2).click()
  await expect(note(page)).toHaveCount(0) // already seen
  expect(JSON.parse((await seen(page))!).seen).toEqual({ '01': true, '02': true, '03': true })
})

test('reduced motion turns the paper animation off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  const names = await note(page).evaluate((el) => [el, ...el.querySelectorAll('*')].map((n) => getComputedStyle(n).animationName))
  expect(names.every((n) => n === 'none')).toBe(true)
})

test('TEST MODE neither shows nor records the note', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.evaluate((k) => localStorage.removeItem(k), INTRO)
  await page.getByRole('button', { name: 'Fill normal win' }).click()
  await expect(page.getByText(/TEST MODE/)).toBeVisible()
  await expect(note(page)).toHaveCount(0)
  expect(await seen(page)).toBeNull()
})

test('Chaos and mandatory badges are visible on every item without hover (desktop and phone)', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.evaluate(
    ([k, p]) => {
      localStorage.setItem(k, JSON.stringify({ version: 1, seen: { '01': true, '02': true, '03': true } }))
      localStorage.setItem(p, JSON.stringify({ version: 2, completed: { '01': {}, '02': {} } }))
    },
    [INTRO, PROGRESS],
  )
  await page.reload()
  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size)
    await tab(page, 2).click()
    const badges = page.locator('.in-tray .chaos-badge')
    await expect(badges).toHaveCount(10)
    for (const b of await badges.all()) await expect(b).toBeVisible()
    await tab(page, 3).click()
    await expect(page.locator('.in-tray .chaos-badge.must')).toHaveCount(2)
    await expect(page.locator('.in-tray .chaos-badge:not(.must)')).toHaveCount(10)
  }
})

test('saved version-1 progress (old bonus counts) still unlocks the levels it earned', async ({ page }) => {
  await page.evaluate(
    ([k, p]) => {
      localStorage.setItem(k, JSON.stringify({ version: 1, seen: { '01': true } }))
      localStorage.setItem(p, JSON.stringify({ version: 1, completed: { '01': { bestOptional: 0 } } }))
    },
    [INTRO, PROGRESS],
  )
  await page.reload()
  await expect(tab(page, 2)).toBeEnabled()
  await expect(tab(page, 1)).toContainText('✓')
})
