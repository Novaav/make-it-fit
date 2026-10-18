import { expect, test } from '@playwright/test'
import { packStep } from './helpers'
import { LEVEL1 } from './solutions'

test('production build has no dev tools or solution data', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Dev tools')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Fill perfect pack' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Test win/ })).toHaveCount(0)
  await expect(page.getByText(/TEST MODE|TEST RUN/)).toHaveCount(0)
  const html = await page.content()
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1])
  expect(scripts.length).toBeGreaterThan(0)
  for (const src of scripts) {
    const body = await (await page.request.get(src)).text()
    expect(body).not.toContain('Fill perfect pack')
    expect(body).not.toContain('Clear saved progress')
    expect(body).not.toContain('Test win')
    expect(body).not.toContain('TEST MODE')
    expect(body).not.toContain('TEST RUN')
    expect(body).not.toContain('dev-tools')
  }
})

test('production: Level 1 can be won by hand, unlocking and persisting Level 2', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('make-it-fit:intro:v1', JSON.stringify({ version: 1, seen: { '01': true } }))
  })
  await page.reload()
  await expect(page.getByRole('button', { name: /^Level 2/ })).toBeDisabled()
  for (const step of LEVEL1) await packStep(page, step)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Packed!' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Level 2/ })).toBeEnabled()
  await page.reload()
  await expect(page.getByRole('button', { name: /^Level 2/ })).toBeEnabled()
  await expect(page.getByRole('button', { name: /^Level 1/ })).toContainText('✓')
})

test('production page has its metadata, a favicon, no console errors and no failed requests', async ({ page }) => {
  const problems: string[] = []
  page.on('pageerror', (e) => problems.push(e.message))
  page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
  page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()} ${r.url()}`))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Make\s*It\s*Fit/ })).toBeVisible()
  await expect(page).toHaveTitle('Make It Fit')
  expect(await page.locator('meta[name="description"]').getAttribute('content')).toContain('packing puzzle')
  expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBeTruthy()
  expect(await page.locator('link[rel="icon"]').getAttribute('href')).toContain('data:image/svg+xml')
  expect(await page.locator('html').getAttribute('lang')).toBe('en')
  await page.waitForTimeout(500)
  expect(problems).toEqual([])
})

test('production assets load with relative paths, so the build works from a sub-folder', async ({ page }) => {
  await page.goto('/')
  const html = await page.content()
  expect(html).not.toMatch(/(?:src|href)="\/assets\//)
})

test('the shipped Content-Security-Policy and headers file work: the game runs and plays with no violations', async ({ page, request, baseURL }) => {
  const { readFileSync } = await import('node:fs')
  const headersFile = readFileSync('public/_headers', 'utf8')
  const csp = /Content-Security-Policy:\s*(.+)/.exec(headersFile)![1].trim()
  expect(csp).toContain("default-src 'self'")
  expect(csp).not.toMatch(/https?:\/\//) // no third-party origin is ever allowed
  expect(csp).not.toContain("'unsafe-eval'")
  expect(headersFile).toMatch(/\/assets\/\*\s+Cache-Control: public, max-age=31536000, immutable/)
  expect((await request.get(`${baseURL}/_headers`)).ok()).toBe(true) // Vite copies it into the build for Cloudflare Pages

  const problems: string[] = []
  page.on('pageerror', (e) => problems.push(e.message))
  page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`)))
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } })
  })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: 'Skip' }).click({ timeout: 4000 }).catch(() => undefined)
  await packStep(page, LEVEL1[4])
  await expect(page.getByRole('region', { name: 'Objective' })).toContainText('1/5')
  expect(problems).toEqual([])
})
