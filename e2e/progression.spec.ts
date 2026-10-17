import { expect, test, type Page } from '@playwright/test'
import { packStep } from './helpers'
import { LEVEL1, LEVEL2_NORMAL } from './solutions'

// Real progression: Level 1 unlocks Level 2, Level 2 unlocks Level 3, and it survives a reload. TEST MODE (the
// developer fills) may show the next level for the current session but must never save or permanently unlock anything.
const PROGRESS = 'make-it-fit:progress:v1'
const INTRO = 'make-it-fit:intro:v1'
const tab = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^Level ${n}`) })
const stored = (page: Page) => page.evaluate((k) => localStorage.getItem(k), PROGRESS)

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(([i]) => {
    localStorage.clear()
    localStorage.setItem(i, JSON.stringify({ version: 1, seen: { '01': true, '02': true, '03': true } }))
  }, [INTRO])
  await page.reload()
})

test('a real Level 1 win unlocks Level 2, a real Level 2 win unlocks Level 3, and both survive a reload', async ({ page }) => {
  await expect(tab(page, 2)).toBeDisabled()
  await expect(tab(page, 3)).toBeDisabled()
  for (const s of LEVEL1) await packStep(page, s)
  await page.getByRole('dialog').getByRole('button', { name: 'Next level' }).click()
  await expect(tab(page, 2)).toBeEnabled()
  await expect(tab(page, 2)).toHaveAttribute('aria-current', 'page')
  await expect(tab(page, 3)).toBeDisabled() // Level 2 is not won yet
  await expect(tab(page, 1)).toContainText('✓')

  await page.reload()
  await expect(tab(page, 2)).toHaveAttribute('aria-current', 'page') // resumes at the first unfinished level
  await expect(tab(page, 3)).toBeDisabled()

  for (const s of LEVEL2_NORMAL) await packStep(page, s)
  await page.getByRole('dialog').getByRole('button', { name: 'Next level' }).click()
  await expect(tab(page, 3)).toBeEnabled()
  await expect(tab(page, 3)).toHaveAttribute('aria-current', 'page')
  expect(Object.keys(JSON.parse((await stored(page))!).completed).sort()).toEqual(['01', '02'])

  await page.reload()
  await expect(tab(page, 3)).toBeEnabled()
  await expect(tab(page, 3)).toHaveAttribute('aria-current', 'page')
  await expect(tab(page, 1)).toContainText('✓')
  await expect(tab(page, 2)).toContainText('✓')
  await expect(tab(page, 3)).not.toContainText('✓') // unlocked and current, not completed
  await expect(tab(page, 3)).not.toContainText('🔒')
})

test('a locked tab says why when pressed and stays where it is; the lock is also in its accessible name', async ({ page }) => {
  await expect(tab(page, 3)).toHaveAttribute('aria-disabled', 'true')
  await expect(tab(page, 3)).toContainText('🔒')
  await expect(tab(page, 3)).toHaveAttribute('title', 'Locked: win Level 2 to unlock')
  await tab(page, 3).click({ force: true })
  await expect(page.getByRole('status').filter({ hasText: 'Level 3 is locked. Win Level 2 to unlock it.' })).toBeVisible()
  await expect(tab(page, 1)).toHaveAttribute('aria-current', 'page')
})

test('TEST MODE shows the next level for this session only: nothing saved, a reload locks it again', async ({ page }) => {
  for (const s of LEVEL1) await packStep(page, s)
  await page.getByRole('dialog').getByRole('button', { name: 'Next level' }).click()
  const saved = await stored(page)
  expect(Object.keys(JSON.parse(saved!).completed)).toEqual(['01'])
  await expect(tab(page, 3)).toBeDisabled()

  await page.getByRole('button', { name: 'Fill normal win' }).click() // a developer fill of Level 2
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('TEST RUN')
  await dialog.getByRole('button', { name: 'Next level' }).click() // offered, because the test win unlocks it for now
  await expect(tab(page, 3)).toHaveAttribute('aria-current', 'page')
  await expect(tab(page, 2)).toContainText('✓ test')
  expect(await stored(page)).toBe(saved) // progress is exactly as before

  await page.reload()
  await expect(page.getByText(/TEST MODE/)).toHaveCount(0)
  await expect(tab(page, 3)).toBeDisabled()
  await expect(tab(page, 2)).not.toContainText('✓')
  expect(await stored(page)).toBe(saved)
})

test('a Solution Explorer fill unlocks the next level for the session, never permanently', async ({ page }) => {
  await page.getByRole('button', { name: 'L2', exact: true }).click()
  await page.getByLabel('Solution Explorer').selectOption({ index: 0 })
  await page.getByRole('button', { name: 'Fill selected example' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click({ timeout: 10000 })
  await expect(tab(page, 3)).toBeEnabled()
  expect(await stored(page)).toBeNull()
  await page.reload()
  await expect(tab(page, 2)).toBeDisabled()
  await expect(tab(page, 3)).toBeDisabled()
  expect(await stored(page)).toBeNull()
})
