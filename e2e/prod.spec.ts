import { expect, test } from '@playwright/test'
import { packStep } from './helpers'
import { LEVEL1 } from './solutions'

test('production build has no dev tools or solution data', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Dev tools')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Fill max bonus' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Test win/ })).toHaveCount(0)
  await expect(page.getByText(/TEST MODE|TEST RUN/)).toHaveCount(0)
  const html = await page.content()
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1])
  expect(scripts.length).toBeGreaterThan(0)
  for (const src of scripts) {
    const body = await (await page.request.get(src)).text()
    expect(body).not.toContain('Fill max bonus')
    expect(body).not.toContain('Clear saved progress')
    expect(body).not.toContain('Test win')
    expect(body).not.toContain('TEST MODE')
    expect(body).not.toContain('TEST RUN')
    expect(body).not.toContain('dev-tools')
  }
})

test('production: Level 1 can be won by hand, unlocking and persisting Level 2', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('button', { name: /^Level 2/ })).toBeDisabled()
  for (const step of LEVEL1) await packStep(page, step)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Packed!' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Level 2/ })).toBeEnabled()
  await page.reload()
  await expect(page.getByRole('button', { name: /^Level 2/ })).toBeEnabled()
  await expect(page.getByRole('button', { name: /^Level 1/ })).toContainText('✓')
})
