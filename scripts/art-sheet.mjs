// Renders contact sheets and in-game screenshots for visual review into art-review/ (git-ignored).
// Usage: npm run art:sheet   (starts a temporary Vite dev server; uses the installed Google Chrome)
import { mkdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'

const OUT = 'art-review'
mkdirSync(OUT, { recursive: true })
const server = await createServer({ server: { port: 5188, strictPort: true }, logLevel: 'error' })
await server.listen()
const base = 'http://localhost:5188'
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const ctx = await browser.newContext({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  for (const section of ['desktop', 'rotations', 'phone', 'weights', 'carried', 'silhouettes', 'jeans']) {
    await page.goto(`${base}/art-sheet.html?section=${section}`)
    await page.waitForSelector('#sheet svg')
    await page.locator('#sheet').screenshot({ path: `${OUT}/sheet-${section}.png` })
    console.log(`wrote ${OUT}/sheet-${section}.png`)
  }
  await ctx.close()

  // In-game views at real sizes.
  const game = async (name, viewport, run) => {
    const c = await browser.newContext({ viewport, deviceScaleFactor: 2 })
    const p = await c.newPage()
    await p.goto(base)
    await p.evaluate(() => localStorage.clear())
    await p.reload()
    await p.waitForSelector('[data-item="passport"]')
    const toggle = p.getByRole('button', { name: /Dev tools/ })
    const open = async () => (await toggle.getAttribute('aria-expanded')) === 'false' && toggle.click()
    const hidePanel = () => p.evaluate(() => document.querySelectorAll('.dev-tools,.test-banner').forEach((e) => (e.style.visibility = 'hidden')))
    await run(p, { open, hidePanel })
    await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
    console.log(`wrote ${OUT}/${name}.png`)
    await c.close()
  }
  await game('game-L1-desktop-empty', { width: 1440, height: 900 }, async (p, { hidePanel }) => {
    await p.waitForTimeout(400)
    await hidePanel()
  })
  await game('game-L1-desktop-packed', { width: 1440, height: 900 }, async (p, { open, hidePanel }) => {
    await open()
    await p.getByRole('button', { name: 'Fill required only' }).click()
    await p.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
    await p.waitForTimeout(300)
    await hidePanel()
  })
  await game('game-L1-desktop-carrying', { width: 1440, height: 900 }, async (p, { hidePanel }) => {
    const shirt = await p.locator('[data-item="shirt"]').boundingBox()
    const board = await p.locator('.board').boundingBox()
    await p.mouse.move(shirt.x + shirt.width / 2, shirt.y + shirt.height / 2)
    await p.mouse.down()
    await p.mouse.move(board.x + board.width * 0.5, board.y + board.height * 0.4, { steps: 12 })
    await p.waitForTimeout(250)
    await hidePanel()
  })
  await game('game-L1-phone', { width: 390, height: 844 }, async (p, { hidePanel }) => {
    await p.waitForTimeout(400)
    await hidePanel()
  })
  await game('game-L2-desktop-tray-weights', { width: 1440, height: 900 }, async (p, { open, hidePanel }) => {
    await open()
    await p.getByRole('button', { name: 'L2', exact: true }).click()
    await p.waitForTimeout(400)
    await hidePanel()
  })
} finally {
  await browser.close()
  await server.close()
}
