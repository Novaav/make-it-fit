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
