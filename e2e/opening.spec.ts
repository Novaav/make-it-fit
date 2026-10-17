import { expect, test, type Page } from '@playwright/test'
import { dragItem, piece } from './helpers'

// The opening: a branded first impression. The wordmark is centred large on the empty table with a luggage tag and a
// Play button, then travels to the masthead while the packing table fades up. About 1.9 s, transform and opacity only,
// once per browsing session for a new player; a tap, key press or Play ends it; reduced motion has none. Automation
// (navigator.webdriver) skips it, so `?intro` forces it (that is also how the owner reviews it). Runs on Chromium and on
// Playwright's WebKit engine (which is not Safari itself).
const INTRO = 'make-it-fit:intro:v1'
const REAL_BROWSER = () => Object.defineProperty(navigator, 'webdriver', { get: () => false })

/** Records when .app gains and loses the opening class, and the frame times in between. */
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __e: { start: number | null; end: number | null; frames: number[]; shifts: number } }
    w.__e = { start: null, end: null, frames: [], shifts: 0 }
    const check = () => {
      const app = document.querySelector('.app')
      const on = !!app?.classList.contains('opening')
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
const hasOpening = (page: Page) => page.locator('.app.opening').count()
const note = (page: Page) => page.getByRole('region', { name: /^How to play Level/ })

test('the opening: wordmark centred on the empty table, tag and Play, then it travels into the masthead; transform and opacity only, about 1.9 s, no layout shift', async ({ page }) => {
  await instrument(page)
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/opening/)
  await expect(page.locator('.app')).toHaveClass(/go/)
  const early = await page.evaluate(() => {
    const props = new Set<string>()
    const anims = document.getAnimations()
    for (const a of anims) for (const k of (a.effect as KeyframeEffect).getKeyframes()) Object.keys(k).forEach((p) => props.add(p))
    const el = (s: string) => document.querySelector(s) as HTMLElement
    return { count: anims.length, props: [...props], layout: [el('.board'), el('.tray'), el('.suitcase'), el('.toolbar')].map((e) => [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight]) }
  })
  expect(early.count).toBeGreaterThan(8)
  for (const p of early.props) expect(['offset', 'easing', 'composite', 'computedOffset', 'transform', 'opacity'], `animated property ${p}`).toContain(p)
  // while the wordmark holds at the centre the table is still empty, and the tag and a Play button are shown
  await page.evaluate(() => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = 900 }))
  const hold = await page.evaluate(() => {
    const r = (document.querySelector('.brand-lockup') as HTMLElement).getBoundingClientRect()
    const stage = getComputedStyle((document.querySelector('.stage') as HTMLElement).closest('.app > *') as HTMLElement).opacity
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, vw: innerWidth, vh: innerHeight, stage }
  })
  expect(Math.abs(hold.cx - hold.vw / 2)).toBeLessThan(4)
  expect(hold.cy).toBeLessThan(hold.vh * 0.6)
  expect(hold.w).toBeGreaterThan(hold.vw * 0.3)
  expect(Number(hold.stage)).toBe(0)
  await expect(page.getByRole('button', { name: /^Play/ })).toBeVisible()
  await page.evaluate(() => document.getAnimations().forEach((a) => a.play()))
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 5000 })
  const m = await record(page)
  const ms = m.end! - m.start!
  expect(ms).toBeGreaterThan(1500)
  expect(ms).toBeLessThan(2600)
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
  expect(await page.getByRole('button', { name: /^Play/ }).count()).toBe(0)
  // nothing from the opening is still running (the first-visit note's own paper animation may have just begun)
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && !(a.effect as KeyframeEffect).target?.closest?.('.intro-note')).length)).toBe(0)
})

test('a new player in a real browser sees it once per session: not on reload, level switch or return, but in a new session; automation and returning players skip it', async ({ page, browser }) => {
  await page.addInitScript(REAL_BROWSER)
  await page.goto('/')
  await expect(page.locator('.app')).toHaveClass(/opening/)
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 5000 })
  await page.reload()
  expect(await hasOpening(page)).toBe(0)
  await page.getByRole('button', { name: /^Level 1/ }).click()
  expect(await hasOpening(page)).toBe(0)
  await page.goto('/?back=1')
  expect(await hasOpening(page)).toBe(0)
  const fresh = await (await browser.newContext()).newPage() // a new browsing session
  await fresh.addInitScript(REAL_BROWSER)
  await fresh.goto('/')
  await expect(fresh.locator('.app')).toHaveClass(/opening/)
  await fresh.context().close()
  const auto = await (await browser.newContext()).newPage() // browser automation reports navigator.webdriver
  await auto.goto('/')
  await expect(auto.locator('.app')).toBeVisible()
  expect(await hasOpening(auto)).toBe(0)
  await auto.context().close()
  const back = await (await browser.newContext()).newPage() // a returning player goes straight in
  await back.addInitScript(REAL_BROWSER)
  await back.addInitScript(() => localStorage.setItem('make-it-fit:progress:v1', JSON.stringify({ version: 2, completed: { '01': {} } })))
  await back.goto('/')
  await expect(back.locator('.app')).toBeVisible()
  expect(await hasOpening(back)).toBe(0)
  await back.goto('/?intro') // ...unless they ask for it
  await expect(back.locator('.app')).toHaveClass(/opening/)
  await back.context().close()
})

test('Play ends it at once and the game works straight away; the first-visit note does not appear afterwards', async ({ page }) => {
  await instrument(page)
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  await page.waitForTimeout(500)
  const box = (await page.getByRole('button', { name: /^Play/ }).boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2) // the press itself ends it, before a click can form
  expect(await hasOpening(page)).toBe(0)
  const m = await record(page)
  expect(m.end! - m.start!).toBeLessThan(1500) // interrupted well before the full length
  await dragItem(page, 'charger', 3, 0)
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 4, row 1/)
})

test('a touch anywhere also ends it and the first piece picked up is not blocked', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  await page.waitForTimeout(350)
  await page.mouse.click(100, 400)
  expect(await hasOpening(page)).toBe(0)
  await dragItem(page, 'charger', 3, 0)
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 4, row 1/)
  await page.waitForTimeout(500)
  await expect(note(page)).toHaveCount(0) // the player had already started
})

test('a key press also ends it, and Enter on the focused Play button works', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/opening/)
  await page.keyboard.press('Tab')
  await expect(page.locator('.app')).not.toHaveClass(/opening/)
  await page.goto('/?intro')
  await page.getByRole('button', { name: /^Play/ }).focus()
  await expect(page.getByRole('button', { name: /^Play/ })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('.app')).not.toHaveClass(/opening/)
})

test('the first-visit note waits for the opening and then appears; both are clear of each other', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/opening/)
  await expect(note(page)).toHaveCount(0)
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 5000 })
  await expect(note(page)).toBeVisible()
})

test('with reduced motion there is no opening at all, even when asked for: the finished layout appears at once and the note shows', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await instrument(page)
  await page.goto('/?intro')
  await expect(page.locator('.app')).toBeVisible()
  expect(await hasOpening(page)).toBe(0)
  expect((await record(page)).start).toBeNull()
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && !(a.effect as KeyframeEffect).target?.closest?.('.intro-note')).length)).toBe(0)
  await expect(note(page)).toBeVisible()
})

test('the opening never changes saved progress or the saved note state', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 5000 })
  expect(await page.evaluate(() => localStorage.getItem('make-it-fit:progress:v1'))).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('make-it-fit:boards:v1'))).toBeNull()
  expect(await page.evaluate((k) => localStorage.getItem(k), INTRO)).toBeNull()
})

test('the wordmark lands exactly where it rests: no jump when the opening hands over, and it is drawn large (never an enlarged small bitmap)', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  const rect = () => page.evaluate(() => { const r = (document.querySelector('.brand-lockup') as HTMLElement).getBoundingClientRect(); return [r.left, r.top, r.width, r.height] })
  await page.evaluate(() => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = 600 }))
  const big = await page.evaluate(() => { const l = document.querySelector('.brand-lockup') as HTMLElement; return { zoom: getComputedStyle(l).zoom, h1: parseFloat(getComputedStyle(l.querySelector('h1')!).fontSize), w: l.getBoundingClientRect().width } })
  expect(Number(big.zoom)).toBeGreaterThan(1.4) // laid out large, so text is rasterised large
  await page.evaluate(() => document.getAnimations().forEach((a) => { a.currentTime = 1900 }))
  await page.waitForTimeout(150)
  const before = await rect()
  await page.getByRole('button', { name: /^Play/ }).evaluate((b: HTMLElement) => b.click())
  await expect(page.locator('.app')).not.toHaveClass(/opening/)
  const after = await rect()
  for (let i = 0; i < 4; i++) expect(Math.abs(before[i] - after[i])).toBeLessThan(1)
})
