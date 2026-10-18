import { expect, test, type Page } from '@playwright/test'

// The developer Solution Explorer: solver-verified complete placements, filled through TEST MODE (in memory only).
const PROGRESS = 'make-it-fit:progress:v1'
const INTRO = 'make-it-fit:intro:v1'
const objective = (page: Page) => page.getByRole('region', { name: 'Objective' })
const explorer = (page: Page) => page.getByLabel('Solution Explorer')

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(([i]) => {
    localStorage.clear()
    localStorage.setItem(i, JSON.stringify({ version: 1, seen: { '01': true, '02': true, '03': true } }))
  }, [INTRO])
  await page.reload()
  await page.getByRole('button', { name: 'L3', exact: true }).click()
})

test('lists the perfect pack and representative wins, and states that counts are item combinations', async ({ page }) => {
  const options = await explorer(page).locator('option').allTextContents()
  expect(options.length).toBeGreaterThanOrEqual(5)
  expect(options.some((o) => o.startsWith('★ Perfect pack: 29 Chaos'))).toBe(true)
  for (const word of ['Fewest items', 'Most items', 'Most rotated']) expect(options.some((o) => o.includes(word)), word).toBe(true)
  await expect(page.getByText('532 legal, 37 winning, 1 perfect item sets (not layouts)')).toBeVisible()
})

test('every example fills a real, winning suitcase; perfect ones score the maximum; nothing is saved', async ({ page }) => {
  test.setTimeout(90_000)
  const options = await explorer(page).locator('option').allTextContents()
  for (const [i, text] of options.entries()) {
    const chaos = /: (\d+) Chaos/.exec(text)![1]
    const reset = page.getByRole('button', { name: 'Reset', exact: true })
    if (await reset.isEnabled()) await reset.click()
    await explorer(page).selectOption({ index: i })
    await page.getByRole('button', { name: 'Fill selected example' }).click()
    await expect(objective(page).locator('.pill.chaos b')).toHaveText(chaos)
    await expect(objective(page)).toContainText('Packed!')
    if (text.startsWith('★')) await expect(page.getByRole('dialog').getByRole('heading', { name: 'Maximum Chaos!' })).toBeVisible({ timeout: 8000 })
    else await expect(page.getByRole('dialog').getByRole('heading', { name: 'Packed!' })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
  }
  await expect(page.getByText(/TEST MODE/)).toBeVisible()
  expect(await page.evaluate((k) => localStorage.getItem(k), PROGRESS)).toBeNull()
  expect(await page.evaluate((k) => localStorage.getItem(k), 'make-it-fit:boards:v1')).toBeNull()
})

test('TEST MODE stays in memory: a reload clears it and unlocks nothing', async ({ page }) => {
  await explorer(page).selectOption({ index: 0 })
  await page.getByRole('button', { name: 'Fill selected example' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
  await page.reload()
  await expect(page.getByText(/TEST MODE/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Level 3/ })).toBeDisabled()
  expect(await page.evaluate((k) => localStorage.getItem(k), PROGRESS)).toBeNull()
})

test('works at phone width: the select is operable and fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const select = explorer(page)
  await expect(select).toBeVisible()
  const box = (await select.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  // name what sticks out, so a failure says where
  const sticking = await page.evaluate(() => {
    const limit = document.documentElement.clientWidth
    return [...document.querySelectorAll('body *')]
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.right > limit + 0.5)
      .slice(0, 6)
      .map(({ e, r }) => `${e.tagName.toLowerCase()}.${String(e.className)} right=${Math.round(r.right)} limit=${limit}`)
  })
  expect(sticking).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
