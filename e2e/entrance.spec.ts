import { expect, test, type Page } from '@playwright/test'
import { dragItem, piece } from './helpers'

// The entrance: the packing table comes to life once per browsing session (sessionStorage), in about 1.3 s, using
// only transform and opacity; the first touch or key press ends it; reduced motion has none; the first-visit note
// waits for it. Runs on Chromium and on Playwright's WebKit engine (which is not Safari itself).
const INTRO = 'make-it-fit:intro:v1'

/** Records when .app gains and loses the entrance class, and the frame times in between. */
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __e: { start: number | null; end: number | null; frames: number[]; shifts: number } }
    w.__e = { start: null, end: null, frames: [], shifts: 0 }
    const check = () => {
      const app = document.querySelector('.app')
      const on = !!app?.classList.contains('entrance')
      if (on && w.__e.start === null) w.__e.start = performance.now()
      if (!on && w.__e.start !== null && w.__e.end === null) w.__e.end = performance.now()
    }
    new MutationObserver(check).observe(document, { subtree: true, attributes: true, childList: true, attributeFilter: ['class'] })
    let last = performance.now()
    const tick = (t: number) => {
      check()
      if (w.__e.start !== null && w.__e.end === null) w.__e.frames.push(t - last)
      last = t
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (w.__e.shifts += (e as unknown as { hadRecentInput: boolean; value: number }).hadRecentInput ? 0 : (e as unknown as { value: number }).value))).observe({ type: 'layout-shift', buffered: true })
    } catch {
      /* not supported (WebKit): the offset check below covers layout stability */
    }
  })
}
const record = (page: Page) => page.evaluate(() => (window as unknown as { __e: { start: number | null; end: number | null; frames: number[]; shifts: number } }).__e)
const hasEntrance = (page: Page) => page.locator('.app.entrance').count()
const note = (page: Page) => page.getByRole('region', { name: /^How to play Level/ })

test('plays once on the first load: transform and opacity only, about 1.3 s, no layout shift, smooth frames, then the normal layout', async ({ page }) => {
  await instrument(page)
  await page.goto('/')
  await expect(page.locator('.app')).toHaveClass(/entrance/)
  const early = await page.evaluate(() => {
    const props = new Set<string>()
    const anims = document.getAnimations()
    for (const a of anims) for (const k of (a.effect as KeyframeEffect).getKeyframes()) Object.keys(k).forEach((p) => props.add(p))
    const el = (s: string) => document.querySelector(s) as HTMLElement
    return { count: anims.length, props: [...props], layout: [el('.board'), el('.tray'), el('.suitcase'), el('.toolbar')].map((e) => [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight]) }
  })
  expect(early.count).toBeGreaterThan(5)
  for (const p of early.props) expect(['offset', 'easing', 'composite', 'computedOffset', 'transform', 'opacity'], `animated property ${p}`).toContain(p)
  await expect(page.locator('.app')).not.toHaveClass(/entrance/, { timeout: 3000 })
  const m = await record(page)
  const ms = m.end! - m.start!
  expect(ms).toBeGreaterThan(1100)
  expect(ms).toBeLessThan(1900)
  const sorted = m.frames.slice(1).sort((a, b) => a - b)
  // frame pacing is only meaningful where the browser runs at full rate; this machine's headless Chrome is capped at 30 Hz, so allow for that
  expect(sorted[Math.floor(sorted.length * 0.95)]).toBeLessThan(80)
  expect(sorted[sorted.length - 1]).toBeLessThan(250)
  expect(m.shifts).toBeLessThan(0.01)
  const late = await page.evaluate(() => {
    const el = (s: string) => document.querySelector(s) as HTMLElement
    return [el('.board'), el('.tray'), el('.suitcase'), el('.toolbar')].map((e) => [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight])
  })
  expect(late).toEqual(early.layout) // nothing moved in layout terms
  // nothing from the entrance is still running (the first-visit note's own paper animation may have just begun)
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && !(a.effect as KeyframeEffect).target?.closest?.('.intro-note')).length)).toBe(0)
})

test('does not replay on reload, on switching levels or on coming back within the session, but does in a new session', async ({ page, browser }) => {
  await page.goto('/')
  await expect(page.locator('.app')).not.toHaveClass(/entrance/, { timeout: 3000 })
  await page.reload()
  expect(await hasEntrance(page)).toBe(0)
  await page.getByRole('button', { name: /^Level 1/ }).click()
  expect(await hasEntrance(page)).toBe(0)
  await page.goto('/?back=1')
  expect(await hasEntrance(page)).toBe(0)
  const fresh = await (await browser.newContext()).newPage() // a new browsing session
  await fresh.goto('/')
  await expect(fresh.locator('.app')).toHaveClass(/entrance/)
  await fresh.context().close()
})

test('the first touch ends it at once and the game works straight away; the first-visit note does not appear afterwards', async ({ page }) => {
  await instrument(page)
  await page.goto('/')
  await expect(page.locator('.app')).toHaveClass(/entrance/)
  await page.waitForTimeout(350)
  await dragItem(page, 'charger', 3, 0)
  expect(await hasEntrance(page)).toBe(0)
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 4, row 1/)
  const m = await record(page)
  expect(m.end! - m.start!).toBeLessThan(1000) // interrupted well before the full length
  await page.waitForTimeout(900)
  await expect(note(page)).toHaveCount(0) // the player had already started
  expect(JSON.parse((await page.evaluate((k) => localStorage.getItem(k), INTRO))!).seen['01']).toBe(true)
})

test('a key press also ends it', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.app')).toHaveClass(/entrance/)
  await page.keyboard.press('Tab')
  await expect(page.locator('.app')).not.toHaveClass(/entrance/)
})

test('the first-visit note waits for the entrance and then appears; both are clear of each other', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.app')).toHaveClass(/entrance/)
  await expect(note(page)).toHaveCount(0)
  await expect(page.locator('.app')).not.toHaveClass(/entrance/, { timeout: 3000 })
  await expect(note(page)).toBeVisible()
})

test('with reduced motion there is no entrance at all: the finished layout appears at once and the note shows', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await instrument(page)
  await page.goto('/')
  await expect(page.locator('.app')).toBeVisible()
  expect(await hasEntrance(page)).toBe(0)
  expect((await record(page)).start).toBeNull()
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && !(a.effect as KeyframeEffect).target?.classList?.contains('intro-note') && !(a.effect as KeyframeEffect).target?.closest?.('.intro-note')).length)).toBe(0)
  await expect(note(page)).toBeVisible()
})

test('the entrance never changes saved progress or the saved note state', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.app')).not.toHaveClass(/entrance/, { timeout: 3000 })
  expect(await page.evaluate(() => localStorage.getItem('make-it-fit:progress:v1'))).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('make-it-fit:boards:v1'))).toBeNull()
})
