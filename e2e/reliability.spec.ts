import { expect, test, type Page } from '@playwright/test'
import { packStep } from './helpers'
import { LEVEL1 } from './solutions'

// Reliability: damaged or hostile saved data must never stop the game, and normal play must raise no runtime errors.
const PROGRESS = 'make-it-fit:progress:v1'
const BOARDS = 'make-it-fit:boards:v1'
const INTRO = 'make-it-fit:intro:v1'

function watch(page: Page) {
  const problems: string[] = []
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`)
  })
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`))
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`)
  })
  return problems
}

const BAD: Record<string, string>[] = [
  { [PROGRESS]: '{not json', [BOARDS]: '[[[', [INTRO]: 'null' },
  { [PROGRESS]: JSON.stringify({ version: 2, completed: { '01': 'yes', '02': null, '99': {}, '03': { bestChaos: 'lots', perfect: 'maybe' } } }), [BOARDS]: JSON.stringify({ version: 1, boards: { '01': { sig: 5, placements: 'x' }, '02': { sig: 'a', placements: [{ itemId: 7 }] } } }), [INTRO]: JSON.stringify({ version: 1, seen: ['01', 5, null] }) },
  { [PROGRESS]: JSON.stringify({ version: 99, completed: { '01': {}, '02': {} } }), [BOARDS]: JSON.stringify({ version: 1, boards: { '01': { sig: 'old', placements: [{ itemId: 'shirt', orientation: 9, x: -4, y: 1e9 }] } } }), [INTRO]: '"seen"' },
  { [PROGRESS]: '{"version":2,"completed":{"__proto__":{"polluted":true},"constructor":{}}}', [BOARDS]: '{"version":1,"boards":{"__proto__":{"x":1}}}', [INTRO]: '{"version":1,"seen":{"__proto__":true}}' },
  { [PROGRESS]: 'x'.repeat(400_000), [BOARDS]: 'y'.repeat(400_000), [INTRO]: '' },
]

for (const [i, bad] of BAD.entries())
  test(`damaged saved data #${i + 1} is ignored: the game starts clean on Level 1 and stays playable, with no errors`, async ({ page }) => {
    const problems = watch(page)
    await page.goto('/')
    await page.evaluate((entries) => {
      localStorage.clear()
      for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v)
    }, bad)
    await page.reload()
    await page.getByRole('button', { name: 'Skip' }).click({ timeout: 3000 }).catch(() => undefined) // a first-visit note may be showing
    await expect(page.getByRole('button', { name: /^Level 1/ })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('button', { name: /^Level 3/ })).toBeDisabled()
    await packStep(page, LEVEL1[4])
    await expect(page.getByRole('region', { name: 'Objective' })).toContainText('1/5')
    expect(await page.evaluate(() => ({}).hasOwnProperty.call(Object.prototype, 'polluted') || ({} as Record<string, unknown>).polluted !== undefined)).toBe(false)
    expect(problems).toEqual([])
  })

test('a full first game (play, rotate, undo, reset, switch levels, win) raises no runtime errors or failed requests', async ({ page }) => {
  const problems = watch(page)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: 'Skip' }).click()
  for (const step of LEVEL1) await packStep(page, step)
  await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
  await page.getByRole('button', { name: 'Undo' }).click()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.getByRole('button', { name: /^Level 2/ }).click({ force: true })
  expect(problems).toEqual([])
})

test('a screen reader hears the running score, the weight left and a win after every change', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(([i, p]) => {
    localStorage.clear()
    localStorage.setItem(i, JSON.stringify({ version: 1, seen: { '01': true, '02': true } }))
    localStorage.setItem(p, JSON.stringify({ version: 2, completed: { '01': {} } }))
  }, [INTRO, PROGRESS])
  await page.reload()
  await page.getByRole('button', { name: /^Level 2/ }).click()
  await page.getByRole('button', { name: 'Skip' }).click({ timeout: 1500 }).catch(() => undefined)
  const live = page.locator('.status')
  await expect(live).toHaveAttribute('role', 'status')
  await packStep(page, { id: 'handbag', rotations: 0, col: 0, row: 0 })
  await expect(live).toContainText('Louis Regretton handbag packed. Chaos 6 of 20. 4.25 kg left.')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(live).toContainText('Chaos 0 of 20. 6.5 kg left.')
})

test('Level 1 can be won with the keyboard alone (focus, rotate, pick up, arrows, place) and the win is announced', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(([i]) => {
    localStorage.clear()
    localStorage.setItem(i, JSON.stringify({ version: 1, seen: { '01': true } }))
  }, [INTRO])
  await page.reload()
  for (const step of LEVEL1) {
    const item = page.locator(`[data-item="${step.id}"]`)
    await item.focus()
    for (let i = 0; i < step.rotations; i++) await page.keyboard.press('r')
    await page.keyboard.press('Enter') // pick up
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowLeft')
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowUp')
    for (let i = 0; i < step.col; i++) await page.keyboard.press('ArrowRight')
    for (let i = 0; i < step.row; i++) await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter') // place
    await expect(item).toHaveAttribute('aria-label', new RegExp(`packed at column ${step.col + 1}, row ${step.row + 1}`))
  }
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Packed!' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Next level' })).toBeFocused() // focus moved into the dialog
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})
