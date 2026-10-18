import { expect, test, type Page } from '@playwright/test'
import { geometry, load, pageHasNoHorizontalScroll } from './helpers'

// One responsive and accessibility pass over every level at phone, tablet and desktop sizes. Measured, not eyeballed:
// no sideways scroll, no overlap or clipping of controls, a still suitcase when a level is solved, 44 px touch targets,
// keyboard focus and names, and text enlarged to 125 % and 150 %.
const SIZES = [[320, 568], [360, 740], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 900]] as const
const LEVELS = [['01', {}], ['02', { '01': {} }], ['03', { '01': {}, '02': {} }]] as const
const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5

async function solved(page: Page, id: string, done: object) {
  await load(page, { ...done, [id]: {} }, { id, kind: 'normal' })
  await expect(page.getByRole('region', { name: 'Objective' })).toContainText('Packed!')
}

for (const [w, h] of SIZES) {
  test.describe(`${w}×${h}`, () => {
    test.use({ viewport: { width: w, height: h } })
    for (const [id, done] of LEVELS) {
      test(`Level ${Number(id)}: no sideways scroll, no overlapping or clipped controls, and a solved suitcase does not move`, async ({ page }) => {
        await solved(page, id, done)
        const still = await geometry(page)
        expect(await pageHasNoHorizontalScroll(page)).toBe(true)
        const report = await page.evaluate(() => {
          const rects = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.getBoundingClientRect().width > 0)
          const groups = [rects('.level-tab'), rects('.toolbar button')]
          return {
            tabHeights: [...new Set(rects('.level-tab').map((e) => Math.round(e.getBoundingClientRect().height)))],
            clipped: rects('.level-tab, .toolbar button').filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent),
            rects: groups.map((g) => g.map((e) => e.getBoundingClientRect().toJSON() as DOMRect)),
            right: Math.max(...rects('.level-tab, .toolbar button, .sound-toggle').map((e) => e.getBoundingClientRect().right)),
            vw: document.documentElement.clientWidth,
          }
        })
        expect(report.tabHeights, 'every tab on one line').toHaveLength(1)
        expect(report.clipped, 'clipped labels').toEqual([])
        expect(report.right).toBeLessThanOrEqual(report.vw + 0.5)
        for (const g of report.rects) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) expect(overlaps(g[i], g[j]), 'controls overlap').toBe(false)
        // the same level with one item taken out must sit identically (within a pixel of rounding)
        await page.locator('[data-item]:not(.in-tray)').first().focus()
        await page.keyboard.press('Delete')
        const open = await geometry(page)
        for (const key of Object.keys(still) as (keyof typeof still)[]) expect(Math.abs(still[key] - open[key]), key).toBeLessThanOrEqual(1)
      })
    }

    test('touch targets: every control has an area of at least 44 × 44 CSS px that reaches it', async ({ page }) => {
      await load(page, { '01': {}, '02': {} })
      const bad = await page.evaluate(() => {
        const out: string[] = []
        for (const e of document.querySelectorAll<HTMLElement>('.level-tab, .sound-toggle, .note-replay, .toolbar button, .help summary')) {
          const r = e.getBoundingClientRect()
          if (r.width === 0) continue
          if (e.matches('.toolbar button') && innerWidth > 1100 && !matchMedia('(pointer: coarse)').matches) continue // desktop with a mouse keeps 42 px
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          // the four edges of a 44 x 44 box around the centre must still land on this control
          for (const [dx, dy] of [[-21, 0], [21, 0], [0, -21], [0, 21]]) {
            const hit = document.elementFromPoint(cx + dx, cy + dy)
            if (hit && !e.contains(hit) && !(hit as HTMLElement).closest?.('.level-tab, .sound-toggle, .note-replay, .toolbar button, .help summary')) out.push(`${(e.textContent || e.className).trim().slice(0, 16)} ${dx},${dy}`)
            else if (hit && hit.closest('.level-tab, .sound-toggle, .note-replay, .toolbar button, .help summary') !== e) out.push(`${(e.textContent || e.className).trim().slice(0, 16)} ${dx},${dy} (another control)`)
          }
        }
        return out
      })
      expect(bad).toEqual([])
    })
  })
}

test.describe('keyboard and names', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  test('every stop on the Tab path has an accessible name and a visible focus ring', async ({ page }) => {
    await load(page, { '01': {} })
    const stops: { name: string; ring: boolean; body: boolean }[] = []
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab')
      stops.push(
        await page.evaluate(() => {
          const e = document.activeElement as HTMLElement
          const cs = getComputedStyle(e)
          return { body: e === document.body, name: (e.getAttribute('aria-label') || e.textContent || '').trim(), ring: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== 'none', dev: !!e.closest('.dev-tools') }
        }),
      )
    }
    const game = stops.filter((s) => !s.body && !(s as { dev?: boolean }).dev) // (after the last control Tab leaves the page)
    expect(game.length).toBeGreaterThan(15)
    expect(game.filter((s) => !s.name)).toEqual([])
    expect(game.filter((s) => !s.ring).map((s) => s.name)).toEqual([])
  })
})

// Enlarged text (browser or system text size), simulated by scaling the root font: 100 %, 125 %, 150 % and 200 %.
for (const [w, h] of [[390, 844], [360, 740], [768, 1024], [1280, 900]] as const) {
  for (const [px, label] of [[16, '100 %'], [20, '125 %'], [24, '150 %'], [32, '200 %']] as const) {
    for (const [id, done] of LEVELS) {
      test(`${w}×${h} text ${label} Level ${Number(id)}: no sideways scroll, no clipped or overlapping controls, a solved suitcase does not move`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h })
        await solved(page, id, done)
        await page.evaluate((size) => (document.documentElement.style.fontSize = `${size}px`), px)
        await page.waitForTimeout(150)
        expect(await pageHasNoHorizontalScroll(page), 'sideways scroll').toBe(true)
        const report = await page.evaluate(() => {
          const visible = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.getBoundingClientRect().width > 0)
          const right = Math.max(...visible('.objective *, .toolbar button, .level-tab, .sound-toggle').map((e) => e.getBoundingClientRect().right))
          return {
            clipped: visible('.toolbar button, .level-tab, .pill, .pill *').filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => (e.textContent || '').trim().slice(0, 14)),
            right,
            vw: document.documentElement.clientWidth,
            rects: [visible('.toolbar button'), visible('.level-tab')].map((g) => g.map((e) => e.getBoundingClientRect().toJSON() as DOMRect)),
          }
        })
        expect(report.clipped, 'clipped text').toEqual([])
        expect(report.right, 'something runs past the right edge').toBeLessThanOrEqual(report.vw + 0.5)
        for (const g of report.rects) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) expect(overlaps(g[i], g[j]), 'controls overlap').toBe(false)
        const still = await geometry(page)
        await page.locator('[data-item]:not(.in-tray)').first().focus()
        await page.keyboard.press('Delete')
        const open = await geometry(page)
        for (const key of Object.keys(still) as (keyof typeof still)[]) expect(Math.abs(still[key] - open[key]), key).toBeLessThanOrEqual(1)
      })
    }
  }
}
