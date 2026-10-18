import { expect, type Page } from '@playwright/test'
import type { Step } from './solutions'

export const piece = (page: Page, id: string) => page.locator(`[data-item="${id}"]`)
export const board = (page: Page) => page.getByRole('group', { name: /Packing area/ })

export async function boardGeometry(page: Page) {
  const b = board(page)
  const box = (await b.boundingBox())!
  const [, cols] = /(\d+) columns by (\d+) rows/.exec((await b.getAttribute('aria-label'))!)!.map(Number)
  return { box, cell: box.width / cols }
}

/** Drag a piece with the mouse so that its top-left cell lands on (col,row). */
export async function dragItem(page: Page, id: string, col: number, row: number) {
  const { box, cell } = await boardGeometry(page)
  const p = (await piece(page, id).boundingBox())!
  const start = { x: p.x + p.width / 2, y: p.y + p.height / 2 }
  const target = { x: box.x + (col + p.width / cell / 2) * cell, y: box.y + (row + p.height / cell / 2) * cell }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 12, start.y + 12, { steps: 3 })
  await page.mouse.move(target.x, target.y, { steps: 10 })
  await page.mouse.up()
}

export async function packStep(page: Page, step: Step) {
  if (step.rotations) {
    await piece(page, step.id).click()
    for (let i = 0; i < step.rotations; i++) await page.keyboard.press('r')
  }
  await dragItem(page, step.id, step.col, step.row)
  await expect(piece(page, step.id)).toHaveAttribute('aria-label', new RegExp(`packed at column ${step.col + 1}, row ${step.row + 1}`))
}

export async function pageHasNoHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
}

// ---- progression and layout helpers (next-level.spec.ts, responsive.spec.ts) ----
export const INTRO = JSON.stringify({ version: 1, seen: { '01': true, '02': true, '03': true } })
export const next = (page: Page) => page.locator('.toolbar').getByRole('button', { name: 'Next level →' })
export const toolbarButtons = (page: Page) => page.locator('.toolbar button')

export async function load(page: Page, completed: Record<string, object>, board?: { id: string; kind: 'normal' | 'perfect' }) {
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
export const geometry = (page: Page) =>
  page.evaluate(() => {
    window.scrollTo(0, 0) // sticky parts move with the scroll; measure from the top of the page
    const top = (sel: string) => Math.round(document.querySelector(sel)!.getBoundingClientRect().top + scrollY)
    const h = (sel: string) => Math.round(document.querySelector(sel)!.getBoundingClientRect().height)
    return { masthead: h('.masthead'), objectiveTop: top('.objective'), objective: h('.objective'), board: top('[aria-label^="Packing area"]'), tray: top('.tray'), toolbar: top('.toolbar') }
  })

