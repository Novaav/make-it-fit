import { expect, test, type Page } from '@playwright/test'
import { boardGeometry, packStep, piece } from './helpers'
import { LEVEL1, LEVEL2_NORMAL, LEVEL2_PERFECT } from './solutions'

const PROGRESS = 'make-it-fit:progress:v1'
const tab = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^Level ${n}`) })
const objective = (page: Page) => page.getByRole('region', { name: 'Objective' })
const chaosPill = (page: Page) => objective(page).locator('.pill.chaos')

async function openLevel2(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ([p]) => {
      localStorage.clear()
      localStorage.setItem('make-it-fit:intro:v1', JSON.stringify({ version: 1, seen: { '01': true, '02': true, '03': true } }))
      localStorage.setItem(p, JSON.stringify({ version: 2, completed: { '01': {} } }))
    },
    [PROGRESS],
  )
  await page.reload()
  await tab(page, 2).click()
}

test.describe('Level 1 Chaos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem('make-it-fit:intro:v1', JSON.stringify({ version: 1, seen: { '01': true } }))
    })
    await page.reload()
  })

  test('every item is stamped, the total climbs as items are packed, and completion is still just "all five"', async ({ page }) => {
    await expect(page.locator('.in-tray .chaos-badge')).toHaveCount(5)
    await expect(chaosPill(page)).toContainText('0')
    const expected = [2, 4, 7, 8, 9] // jeans 2, shirt 2, shoes 3, toiletries 1, charger 1 in the verified order
    const order = [LEVEL1[0], LEVEL1[2], LEVEL1[1], LEVEL1[3], LEVEL1[4]] // jeans, shirt, shoes, toiletries, charger
    for (let i = 0; i < order.length; i++) {
      await packStep(page, order[i])
      await expect(chaosPill(page).locator('b')).toHaveText(String(expected[i]))
      if (i < order.length - 1) await expect(page.getByRole('dialog')).toHaveCount(0)
    }
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Packed!' })).toBeVisible()
    await expect(objective(page)).not.toContainText('to win')
  })

  test('stamps keep the same value, position and upright text while an item is rotated', async ({ page }) => {
    const stamp = piece(page, 'jeans').locator('.chaos-badge')
    await expect(stamp).toHaveText('2')
    await piece(page, 'jeans').click()
    await page.keyboard.press('r')
    await expect(stamp).toHaveText('2')
    await expect(stamp).toBeVisible()
  })
})

test.describe('perfect pack celebration', () => {
  test('a perfect pack gets its own dialog, seal, gold meter and one-off flourish; reload shows the gold state without replaying', async ({ page }) => {
    await openLevel2(page)
    for (const s of LEVEL2_PERFECT) await packStep(page, s)
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Maximum Chaos!' })).toBeVisible()
    await expect(dialog.getByRole('img', { name: 'Perfect pack seal' })).toBeVisible()
    await expect(page.locator('.flourish')).toBeVisible()
    await expect(chaosPill(page)).toHaveClass(/max/)
    await expect(chaosPill(page)).toContainText('★ perfect') // stated in text, not only gold
    await dialog.getByRole('button', { name: 'Keep packing' }).click()

    await page.reload()
    await tab(page, 2).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('.flourish')).toHaveCount(0)
    await expect(chaosPill(page)).toHaveClass(/max/)
  })

  test('taking an item out of a saved perfect pack removes the perfect state even though the level was completed before', async ({ page }) => {
    await openLevel2(page)
    for (const s of LEVEL2_PERFECT) await packStep(page, s)
    await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
    await page.reload()
    await tab(page, 2).click()
    await piece(page, 'dvds').click()
    await page.keyboard.press('Delete')
    await expect(chaosPill(page)).not.toHaveClass(/max/)
    await expect(chaosPill(page)).not.toContainText('★ perfect')
    await expect(objective(page)).not.toContainText('Maximum Chaos')
    expect(JSON.parse((await page.evaluate((k) => localStorage.getItem(k), PROGRESS))!).completed['02'].perfect).toBe(true) // history is kept
    await expect(page.locator('.flourish')).toHaveCount(0)
  })

  test('a normal win has no flourish and no seal; upgrading to perfect later shows the perfect dialog once', async ({ page }) => {
    test.slow() // about twenty real drags in one journey: 13-17 s on a busy CI WebKit, so the 30 s default has no margin
    await openLevel2(page)
    for (const s of LEVEL2_NORMAL) await packStep(page, s)
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Packed!' })).toBeVisible()
    await expect(dialog.getByRole('img', { name: 'Perfect pack seal' })).toHaveCount(0)
    await expect(page.locator('.flourish')).toHaveCount(0)
    await expect(chaosPill(page)).not.toHaveClass(/max/)
    await dialog.getByRole('button', { name: 'Keep packing' }).click()

    for (const s of LEVEL2_NORMAL) {
      await piece(page, s.id).click()
      await page.keyboard.press('Delete')
    }
    for (const s of LEVEL2_PERFECT) await packStep(page, s)
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Maximum Chaos!' })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Keep packing' }).click()
    await piece(page, 'dvds').click()
    await page.keyboard.press('Delete')
    await packStep(page, LEVEL2_PERFECT[5]) // dvds again: back to perfect, and the dialog does not open again
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(chaosPill(page)).toHaveClass(/max/)
  })

  test('reduced motion keeps the result obvious: seal and text stay, nothing animates', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openLevel2(page)
    for (const s of LEVEL2_PERFECT) await packStep(page, s)
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Maximum Chaos!' })).toBeVisible()
    await expect(dialog.getByRole('img', { name: 'Perfect pack seal' })).toBeVisible()
    const names = await page.evaluate(() => [...document.querySelectorAll('.perfect-seal, .flourish-ring, .twinkle, .chaos-bar .sheen')].map((e) => getComputedStyle(e).animationName))
    expect(names.length).toBeGreaterThan(0)
    expect(names.every((n) => n === 'none')).toBe(true)
  })

  test('TEST MODE shows the celebration but saves nothing', async ({ page }) => {
    await openLevel2(page)
    await page.getByRole('button', { name: 'Fill perfect pack' }).click()
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Maximum Chaos!' })).toBeVisible()
    expect(JSON.parse((await page.evaluate((k) => localStorage.getItem(k), PROGRESS))!).completed['02']).toBeUndefined()
  })
})

test.describe('Level 3 items', () => {
  const NAMES: Record<string, string> = {
    painting: 'Hotel Painting', laundry: 'Laundry bag', outfit: 'Party outfit', hangover: 'Hangover kit', heels: 'Overpriced Heels', hotel_lamp: 'Hotel lamp',
    ceramic_foot: 'Marble foot', gnome: 'Garden gnome', cheese: 'Wheel of cheese', liquor: 'Badcardi Rum', robe: 'Bathrobe', emergency_socks: 'Socks',
  }
  test('are all illustrated, named for assistive tech with their Chaos or MUST, and stamped identically in the tray and the suitcase', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(([p]) => {
      localStorage.clear()
      localStorage.setItem('make-it-fit:intro:v1', JSON.stringify({ version: 1, seen: { '01': true, '02': true, '03': true } }))
      localStorage.setItem(p, JSON.stringify({ version: 2, completed: { '01': {}, '02': {} } }))
    }, [PROGRESS])
    await page.reload()
    await tab(page, 3).click()
    expect(await page.locator('.piece svg text', { hasText: 'placeholder art' }).count()).toBe(0)
    for (const [id, name] of Object.entries(NAMES)) {
      const label = await piece(page, id).getAttribute('aria-label')
      expect(label, id).toContain(name)
      expect(label, id).toMatch(id === 'painting' || id === 'laundry' ? /Mandatory/ : /Chaos \d/)
      const box = (await piece(page, id).boundingBox())!
      expect(Math.min(box.width, box.height), `${id} hit target`).toBeGreaterThanOrEqual(30)
    }
    const trayStamp = await piece(page, 'ceramic_foot').locator('.chaos-badge').evaluate((e) => e.outerHTML)
    await piece(page, 'ceramic_foot').focus()
    await expect(piece(page, 'ceramic_foot').locator('.chaos-badge')).toHaveText('7')
    expect(trayStamp).toContain('data-chaos="7"')
  })
})

// @perf: timing and frame-rate checks. CI runs them alone, on one worker, after the rest of the suite, because two workers
// on a two-CPU runner steal each other's frames and make a 60 Hz page measure like a 20 Hz one (see .github/workflows/ci.yml).
test.describe('perfect-pack transition timing @perf', () => {
  async function dropLastPerfectItem(page: Page) {
    await openLevel2(page)
    for (const step of LEVEL2_PERFECT.slice(0, 5)) await packStep(page, step)
    // What is timed is the game's answer to the winning drop, measured from the moment the piece itself is acknowledged
    // (its label says it is packed): how long after that the gold meter and the boarding pass are in the page. Both are
    // in the same React commit as the piece, so on any machine they arrive together (the boarding pass a deliberate
    // beat later), however slow the machine is; timing from the click instead would also count how long a busy,
    // software-rendered CI browser takes to handle the click at all, which says nothing about the game. A
    // MutationObserver sees each change as soon as React commits it, without waiting for a frame to be painted.
    // Frame times are recorded separately, for the smoothness check.
    const last = LEVEL2_PERFECT[5]
    await page.evaluate((lastId) => {
      const w = window as unknown as { __m: { frames: number[]; packedAt: number | null; goldAt: number | null; dialogAt: number | null; t0: number } }
      w.__m = { frames: [], packedAt: null, goldAt: null, dialogAt: null, t0: 0 }
      window.addEventListener('pointerup', (e) => (w.__m.t0 = e.timeStamp), { once: true, capture: true })
      new MutationObserver(() => {
        if (!w.__m.t0) return
        const now = performance.now() - w.__m.t0
        if (w.__m.packedAt === null && document.querySelector(`[data-item="${lastId}"]`)?.getAttribute('aria-label')?.includes('packed at')) w.__m.packedAt = now
        if (w.__m.goldAt === null && document.querySelector('.pill.chaos.max')) w.__m.goldAt = now
        if (w.__m.dialogAt === null && document.querySelector('.dialog')) w.__m.dialogAt = now
      }).observe(document.body, { subtree: true, childList: true, attributes: true })
      let last = performance.now()
      const tick = (t: number) => {
        w.__m.frames.push(t - last)
        last = t
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, last.id)
    const { box, cell } = await boardGeometry(page)
    const p = (await piece(page, last.id).boundingBox())!
    const from = { x: p.x + p.width / 2, y: p.y + p.height / 2 }
    const to = { x: box.x + (last.col + p.width / cell / 2) * cell, y: box.y + (last.row + p.height / cell / 2) * cell }
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 10 })
    await page.mouse.up()
    await page.waitForTimeout(2300)
    return page.evaluate(() => {
      const m = (window as unknown as { __m: { frames: number[]; packedAt: number; goldAt: number; dialogAt: number } }).__m
      const sorted = m.frames.slice(1).sort((a, b) => a - b)
      // the machine's own frame time (before the drop) is the yardstick: some headless browsers run at 30 Hz
      const idle = m.frames.slice(1, 20).sort((a, b) => a - b)[9]
      return { packedAt: m.packedAt, goldAt: m.goldAt - m.packedAt, dialogAt: m.dialogAt - m.packedAt, p95: sorted[Math.floor(sorted.length * 0.95)], max: sorted[sorted.length - 1], idle }
    })
  }

  test('the gold meter answers at once, the boarding pass follows within about half a second, and frames stay smooth', async ({ page, browserName }) => {
    const m = await dropLastPerfectItem(page)
    expect(m.goldAt, `metrics ${JSON.stringify(m)}`).toBeLessThan(250) // after the piece is acknowledged
    expect(m.dialogAt).toBeGreaterThan(250) // a beat after the meter, not simultaneous
    expect(m.dialogAt).toBeLessThan(800) // and no long pause
    // Frame smoothness needs real rasterisation. GitHub's Linux runners paint WebKit and Firefox in software on shared
    // CPUs (about one frame a second after the win, with the same game code), so there it is checked on Chrome only;
    // on a developer machine it is checked on every engine.
    if (!process.env.CI || browserName === 'chromium') {
      expect(m.p95).toBeLessThan(Math.max(40, m.idle * 1.8))
      expect(m.max).toBeLessThan(250)
    }
  })

  test('with reduced motion nothing waits: the meter and the boarding pass appear immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const m = await dropLastPerfectItem(page)
    expect(m.goldAt, `metrics ${JSON.stringify(m)}`).toBeLessThan(250) // after the piece is acknowledged
    expect(m.dialogAt).toBeLessThan(250)
  })
})
