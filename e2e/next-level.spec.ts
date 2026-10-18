import { expect, test, type Page } from '@playwright/test'
import { packStep, pageHasNoHorizontalScroll, piece } from './helpers'
import { LEVEL1, LEVEL2_NORMAL } from './solutions'

// After a win the way on ("Next level →") sits in the same row as Rotate, Remove, Undo and Reset, so nothing above it
// moves; the last level has no such button; and the level tabs never wrap when a check mark or a lock changes.
const INTRO = JSON.stringify({ version: 1, seen: { '01': true, '02': true, '03': true } })
const next = (page: Page) => page.locator('.toolbar').getByRole('button', { name: 'Next level →' })
const toolbarButtons = (page: Page) => page.locator('.toolbar button')

async function load(page: Page, completed: Record<string, object>, board?: { id: string; kind: 'normal' | 'perfect' }) {
  await page.goto('/')
  // the saved arrangement is built with the game's own modules, served by the dev server
  const boards = board
    ? await page.evaluate(async ({ id, kind }) => {
        const { loadLevels } = await import(/* @vite-ignore */ '/src/engine/index.ts')
        const { snapshot } = await import(/* @vite-ignore */ '/src/boards.ts')
        const { referenceSolution } = await import(/* @vite-ignore */ '/src/dev/solutions.ts')
        const level = loadLevels().find((l: { id: string }) => l.id === id)!
        return JSON.stringify({ version: 1, boards: { [id]: snapshot(level, referenceSolution(level, kind)) } })
      }, board)
    : null
  await page.evaluate(
    ([i, c, b]) => {
      localStorage.clear()
      localStorage.setItem('make-it-fit:intro:v1', i!)
      localStorage.setItem('make-it-fit:progress:v1', c!)
      if (b) localStorage.setItem('make-it-fit:boards:v1', b)
    },
    [INTRO, JSON.stringify({ version: 2, completed }), boards],
  )
  await page.reload()
  if (board) await page.getByRole('button', { name: new RegExp(`^Level ${Number(board.id)}`) }).click() // the app opens on the next unfinished level
}

/** Where the layout sits, in page coordinates, so a scroll cannot hide a jump. */
const geometry = (page: Page) =>
  page.evaluate(() => {
    window.scrollTo(0, 0) // sticky parts move with the scroll; measure from the top of the page
    const top = (sel: string) => Math.round(document.querySelector(sel)!.getBoundingClientRect().top + scrollY)
    const h = (sel: string) => Math.round(document.querySelector(sel)!.getBoundingClientRect().height)
    return { masthead: h('.masthead'), objectiveTop: top('.objective'), objective: h('.objective'), board: top('[aria-label^="Packing area"]'), tray: top('.tray'), toolbar: top('.toolbar') }
  })

test.describe('Next level after Keep packing (real play, desktop)', () => {
  test('Level 1: Keep packing leaves Next level in the action row, and it works', async ({ page }) => {
    await load(page, {})
    for (const s of LEVEL1) await packStep(page, s)
    await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
    await expect(next(page)).toBeVisible()
    await next(page).click()
    await expect(page.getByRole('button', { name: /^Level 2/ })).toHaveAttribute('aria-current', 'page')
    await expect(next(page)).toHaveCount(0) // a fresh level has none until it is won
  })

  test('Level 2: after a normal win and Keep packing, Next level stays while chasing the perfect pack; the objective card gained nothing', async ({ page }) => {
    await load(page, { '01': {} })
    const before = await geometry(page)
    for (const s of LEVEL2_NORMAL) await packStep(page, s)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Keep packing' }).click()
    await expect(next(page)).toBeVisible()
    const after = await geometry(page)
    expect(Math.abs(after.board - before.board)).toBeLessThanOrEqual(1) // (one pixel of rounding allowed, as below)
    expect(Math.abs(after.objective - before.objective)).toBeLessThanOrEqual(1)
    expect(after.masthead).toBe(before.masthead)
    await expect(page.getByRole('region', { name: 'Objective' }).getByRole('button', { name: /Next level|Play again/ })).toHaveCount(0)
    await next(page).click()
    await expect(page.getByRole('button', { name: /^Level 3/ })).toHaveAttribute('aria-current', 'page')
  })
})

for (const [w, h] of [[390, 844], [360, 740], [1280, 900]] as const) {
  test.describe(`${w}×${h}`, () => {
    test.use({ viewport: { width: w, height: h } })

    for (const [id, kind, done] of [['01', 'normal', {}], ['02', 'normal', { '01': {} }], ['02', 'perfect', { '01': {} }], ['03', 'normal', { '01': {}, '02': {} }], ['03', 'perfect', { '01': {}, '02': {} }]] as const) {
      test(`Level ${Number(id)} ${kind}: solving does not move the masthead, objective, suitcase, tray or actions`, async ({ page }) => {
        // the same level, packed (restored from a save) and then with one item taken out by keyboard: the two states must sit identically
        await load(page, { ...done, [id]: {} }, { id, kind })
        await expect(page.getByRole('region', { name: 'Objective' })).toContainText('Packed!')
        const solved = await geometry(page)
        await page.locator('[data-item].in-board, [data-item]:not(.in-tray)').first().focus()
        await page.keyboard.press('Delete')
        await expect(page.getByRole('region', { name: 'Objective' })).not.toContainText('Packed!')
        const open = await geometry(page)
        // within one pixel: WebKit rounds fractional text heights differently between two sentences; the jumps this guards against were 8 to 23 px
        for (const key of Object.keys(solved) as (keyof typeof solved)[]) expect(Math.abs(solved[key] - open[key]), key).toBeLessThanOrEqual(1)
        expect(await pageHasNoHorizontalScroll(page)).toBe(true)
      })
    }

    for (const [id, done] of [['01', {}], ['02', { '01': {} }], ['03', { '01': {}, '02': {} }]] as const) {
      test(`Level ${Number(id)}: from an empty suitcase to a solved one nothing above the suitcase moves`, async ({ page }) => {
        await load(page, { ...done, [id]: {} }, { id, kind: 'normal' })
        await expect(page.getByRole('region', { name: 'Objective' })).toContainText('Packed!')
        const solved = await geometry(page)
        await page.getByRole('button', { name: 'Reset' }).click()
        await expect(page.getByRole('region', { name: 'Objective' })).not.toContainText('Packed!')
        const empty = await geometry(page)
        for (const key of Object.keys(solved) as (keyof typeof solved)[]) expect(Math.abs(solved[key] - empty[key]), key).toBeLessThanOrEqual(1)
      })
    }

    test('the action row holds Next level beside the other four on one line, with comfortable touch targets', async ({ page }) => {
      await load(page, { '01': {}, '02': {} }, { id: '02', kind: 'normal' })
      await page.getByRole('button', { name: /^Level 2/ }).click()
      await expect(next(page)).toBeVisible()
      const boxes = await toolbarButtons(page).evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), w: r.width, h: r.height, clipped: e.scrollWidth > e.clientWidth + 1 } }))
      expect(boxes).toHaveLength(5)
      expect(new Set(boxes.map((b) => b.top)).size).toBe(1) // one row
      for (const b of boxes) {
        expect(b.w).toBeGreaterThanOrEqual(44)
        expect(b.h).toBeGreaterThanOrEqual(42)
        expect(b.clipped).toBe(false)
      }
      expect(await pageHasNoHorizontalScroll(page)).toBe(true)
    })

    test('the last level has no Next level, and still offers Reset to play it again', async ({ page }) => {
      await load(page, { '01': {}, '02': {}, '03': {} }, { id: '03', kind: 'perfect' })
      await page.getByRole('button', { name: /^Level 3/ }).click()
      await expect(page.getByRole('region', { name: 'Objective' })).toContainText('Packed!')
      await expect(next(page)).toHaveCount(0)
      await expect(toolbarButtons(page)).toHaveCount(4)
      await expect(page.getByRole('button', { name: 'Reset' })).toBeEnabled()
    })

    test('a level that is not solved shows no Next level, even with the next level unlocked', async ({ page }) => {
      await load(page, { '01': {}, '02': {} })
      await page.getByRole('button', { name: /^Level 2/ }).click()
      await expect(next(page)).toHaveCount(0)
    })
  })
}

for (const [w, h] of [[390, 844], [375, 667], [360, 740]] as const) {
  test(`the level tabs never wrap or change the masthead as levels are completed at ${w}×${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    const seen: string[] = []
    for (const done of [{}, { '01': {} }, { '01': {}, '02': {} }, { '01': {}, '02': {}, '03': {} }]) {
      await load(page, done)
      seen.push(
        await page.evaluate(() => `${Math.round(document.querySelector('.masthead')!.getBoundingClientRect().height)}:${[...document.querySelectorAll('.level-tab')].map((e) => Math.round(e.getBoundingClientRect().height)).join('/')}:${document.documentElement.scrollWidth <= document.documentElement.clientWidth}`),
      )
    }
    expect(new Set(seen).size).toBe(1) // identical in every state
    expect(seen[0].endsWith(':true')).toBe(true)
  })
}

test.describe('keyboard and touch', () => {
  test('Next level is reachable and operable from the keyboard', async ({ page }) => {
    await load(page, { '01': {} }, { id: '02', kind: 'normal' })
    await expect(next(page)).toBeVisible()
    await next(page).focus()
    await expect(next(page)).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /^Level 3/ })).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('touch', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })
  test('a tap on Next level moves on', async ({ page }) => {
    await load(page, { '01': {} }, { id: '02', kind: 'normal' })
    await next(page).tap()
    await expect(page.getByRole('button', { name: /^Level 3/ })).toHaveAttribute('aria-current', 'page')
  })
})

test('the in-tray items are untouched by the progression row', async ({ page }) => {
  await load(page, {})
  await expect(piece(page, 'shirt')).toBeVisible()
})
