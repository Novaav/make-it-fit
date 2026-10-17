import { expect, test, type Page } from '@playwright/test'
import { dragItem, pageHasNoHorizontalScroll } from './helpers'

const INTRO = 'make-it-fit:intro:v1'
const PROGRESS = 'make-it-fit:progress:v1'
const note = (page: Page) => page.getByRole('region', { name: /^How to play Level/ })
const tab = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^Level ${n}`) })
const piece = (page: Page, id: string) => page.locator(`[data-item="${id}"]`)
const seen = (page: Page) => page.evaluate((k) => localStorage.getItem(k), INTRO)

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('first visit shows the short Level 1 note; Next, Back and Got it work, and Skip is offered only before the last page', async ({ page }) => {
  await expect(note(page)).toBeVisible()
  await expect(note(page)).toContainText('Drag and turn.')
  await expect(note(page).getByRole('button', { name: 'Next' })).toBeFocused()
  await expect(note(page).getByRole('button', { name: 'Skip' })).toBeVisible()
  await expect(note(page).getByRole('button', { name: 'Back' })).toHaveCount(0)
  await note(page).getByRole('button', { name: 'Next' }).click()
  await expect(note(page)).toContainText('Packing makes Chaos.')
  await expect(note(page).getByRole('button', { name: 'Skip' })).toHaveCount(0) // last page: just go
  await note(page).getByRole('button', { name: 'Back' }).click()
  await expect(note(page)).toContainText('Drag and turn.')
  await note(page).getByRole('button', { name: 'Next' }).click()
  await note(page).getByRole('button', { name: 'Got it' }).click()
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
  await expect(note(page)).toContainText('Drag and turn.')
  await page.keyboard.press('Escape')
  await expect(note(page)).toHaveCount(0)
  expect(await seen(page)).toBe(stored)
})

test('arrow keys move between pages', async ({ page }) => {
  await expect(note(page).getByRole('button', { name: 'Next' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(note(page)).toContainText('Packing makes Chaos.')
  await page.keyboard.press('ArrowLeft')
  await expect(note(page)).toContainText('Drag and turn.')
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
  await expect(note(page)).toContainText('Now you choose.')
  await expect(note(page)).not.toContainText('20') // the objective card carries the numbers
  await note(page).getByRole('button', { name: 'Skip' }).click()
  await tab(page, 3).click()
  await expect(note(page)).toContainText('Baggage you can’t leave.')
  await expect(note(page).getByRole('button', { name: 'Skip' })).toHaveCount(0) // a single page needs only one button
  await expect(note(page).locator('.note-dots')).toHaveCount(0)
  await note(page).getByRole('button', { name: 'Got it' }).click()
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
    await tab(page, 1).click()
    await expect(page.locator('.in-tray .chaos-badge')).toHaveCount(5)
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

test('a first-visit note steps aside when the player starts playing; a replayed note stays until closed', async ({ page }) => {
  await expect(note(page)).toBeVisible()
  await dragItem(page, 'charger', 3, 0)
  await expect(note(page)).toHaveCount(0)
  expect(JSON.parse((await seen(page))!).seen['01']).toBe(true)
  await page.getByRole('button', { name: /How to play/ }).click()
  await expect(note(page)).toBeVisible()
  await piece(page, 'shirt').click()
  await page.keyboard.press('r')
  await expect(note(page)).toBeVisible() // asked for, so it stays
  await note(page).getByRole('button', { name: 'Skip' }).click()
  await expect(note(page)).toHaveCount(0)
})

test('keyboard: Tab reaches Skip and Next, Enter advances, and focus returns to How to play afterwards', async ({ page }) => {
  await expect(note(page).getByRole('button', { name: 'Next' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(note(page).getByRole('button', { name: 'Skip' })).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(note(page)).toContainText('Packing makes Chaos.')
  await page.keyboard.press('Escape')
  await expect(note(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /How to play/ })).toBeFocused()
})

for (const [w, h] of [[1440, 900], [1280, 800], [390, 844], [360, 740]] as const)
  for (const n of [1, 2, 3])
    test(`the note never covers the suitcase or the tool buttons, or overflows: Level ${n} at ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await page.evaluate(([p]) => localStorage.setItem(p, JSON.stringify({ version: 2, completed: { '01': {}, '02': {} } })), [PROGRESS])
      await page.evaluate(([k]) => localStorage.setItem(k, JSON.stringify({ version: 1, seen: {} })), [INTRO])
      await page.reload()
      const devTools = page.getByRole('button', { name: /Dev tools/ })
      if (w < 500 && (await devTools.getAttribute('aria-expanded')) === 'true') await devTools.click()
      await tab(page, n).click()
      await expect(note(page)).toBeVisible()
      await page.waitForTimeout(450) // the paper settles
      const n1 = (await note(page).boundingBox())!
      expect(n1.x).toBeGreaterThanOrEqual(0)
      expect(n1.x + n1.width).toBeLessThanOrEqual(w + 0.5)
      expect(n1.y + n1.height).toBeLessThanOrEqual(h + 0.5)
      expect(await pageHasNoHorizontalScroll(page)).toBe(true)
      const hit = (b: { x: number; y: number; width: number; height: number }) => b.x < n1.x + n1.width && b.x + b.width > n1.x && b.y < n1.y + n1.height && b.y + b.height > n1.y
      const board = (await page.getByRole('group', { name: /Packing area/ }).boundingBox())!
      expect(hit(board), 'covers the suitcase').toBe(false)
      for (const name of ['Rotate', 'Remove', 'Undo', 'Reset']) {
        const t = (await page.getByRole('button', { name, exact: true }).boundingBox())!
        expect(hit(t), `covers ${name}`).toBe(false)
      }
    })
