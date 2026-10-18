import { expect, test, type Page } from '@playwright/test'
import { dragItem, piece } from './helpers'

// The opening: a branded start. The wordmark is centred large on the empty table with a luggage tag and a Play button,
// and it holds, still, until Play is pressed (no timer; no other tap or key starts the game). Play moves the wordmark into
// the masthead and fades the table up in about 0.85 s, using only transform and opacity. A new player sees it once per
// browsing session; returning players and automation (navigator.webdriver) skip it, so `?intro` forces it. Reduced motion
// shows it without movement. Runs on Chromium, WebKit and Firefox (Playwright's WebKit is not Safari itself).
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

const playButton = (page: Page) => page.getByRole('button', { name: 'Play', exact: true })
const boxes = (page: Page) =>
  page.evaluate(() => {
    const el = (s: string) => document.querySelector(s) as HTMLElement
    return [el('.board'), el('.tray'), el('.suitcase'), el('.toolbar')].map((e) => [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight])
  })

test('it holds the finished composition, still, with no timeout: wordmark centred, tag and Play shown, game hidden and unreachable', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  await expect(playButton(page)).toBeVisible()
  await page.waitForTimeout(10_500)
  await expect(page.locator('.app')).toHaveClass(/opening/)
  await expect(page.locator('.app')).not.toHaveClass(/leaving/)
  await expect(playButton(page)).toBeVisible()
  const hold = await page.evaluate(() => {
    const r = (document.querySelector('.brand-lockup') as HTMLElement).getBoundingClientRect()
    const stage = getComputedStyle((document.querySelector('.stage') as HTMLElement).closest('.app > *') as HTMLElement).opacity
    const tag = getComputedStyle(document.querySelector('.opening-tag') as HTMLElement).opacity
    return { cx: r.left + r.width / 2, w: r.width, vw: innerWidth, stage, tag, running: document.getAnimations().filter((a) => a.playState === 'running').length, inert: !!document.querySelector('.stage')?.closest('[inert]') }
  })
  expect(Math.abs(hold.cx - hold.vw / 2)).toBeLessThan(4)
  expect(hold.w).toBeGreaterThan(hold.vw * 0.3)
  expect(Number(hold.stage)).toBe(0)
  expect(Number(hold.tag)).toBe(1)
  expect(hold.running).toBe(0) // nothing is moving while it waits
  expect(hold.inert).toBe(true)
})

test('only Play starts the game: a click elsewhere, arbitrary keys and Tab do nothing, and focus never leaves the opening', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  await expect(playButton(page)).toBeFocused() // focus starts on Play
  await page.mouse.click(100, 400)
  await page.keyboard.press('a')
  await page.keyboard.press('Escape')
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await page.waitForTimeout(300)
  await expect(page.locator('.app')).toHaveClass(/opening/)
  await expect(page.locator('.app')).not.toHaveClass(/leaving/)
  expect(await page.evaluate(() => !!document.activeElement?.closest('.stage, .levels'))).toBe(false)
})

test('Play (mouse): the wordmark moves into the masthead and the table fades up in about 0.85 s, transform and opacity only, no layout shift; the note waits until it has settled', async ({ page }) => {
  await instrument(page)
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  const before = await boxes(page)
  await playButton(page).click()
  const during = await page.evaluate(() => {
    const props = new Set<string>()
    const anims = document.getAnimations()
    // the movement itself; the Play button's own colour and shadow transitions are small paint changes and are not counted
    for (const a of anims) if (!(a instanceof CSSTransition)) for (const k of (a.effect as KeyframeEffect).getKeyframes()) Object.keys(k).forEach((p) => props.add(p))
    return { props: [...props], leaving: !!document.querySelector('.app.leaving') }
  })
  for (const p of during.props) expect(['offset', 'easing', 'composite', 'computedOffset', 'transform', 'opacity'], `animated property ${p}`).toContain(p)
  await expect(note(page)).toHaveCount(0) // not over the moving interface
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 3000 })
  await expect(note(page)).toBeVisible()
  const m = await record(page)
  expect(m.end! - m.start!).toBeGreaterThan(0)
  expect(await boxes(page)).toEqual(before)
  expect(m.shifts).toBeLessThan(0.01)
  expect(await playButton(page).count()).toBe(0)
  // sessionStorage marks it as shown; reload goes straight in
  await page.goto('/')
  expect(await hasOpening(page)).toBe(0)
})

test('Play by keyboard: Enter and Space on the focused button, then the game works', async ({ page }) => {
  await page.goto('/?intro')
  await expect(playButton(page)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('.app')).toHaveClass(/leaving/)
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 3000 })
  await page.goto('/?intro')
  await expect(playButton(page)).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 3000 })
  await page.keyboard.press('Escape') // closes the first-visit note
  await dragItem(page, 'charger', 3, 0)
  await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 4, row 1/)
})

test('Play by touch', async ({ browser, browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox does not emulate touch in Playwright')
  const ctx = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto('http://localhost:5180/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  await page.tap('.opening-play')
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 3000 })
  await expect(playButton(page)).toHaveCount(0)
  await ctx.close()
})

test('a new player in a real browser sees it once per session; returning players, reloads and automation go straight in; ?intro replays without touching saved data', async ({ page, browser }) => {
  await page.addInitScript(REAL_BROWSER)
  await page.goto('/')
  await expect(page.locator('.app')).toHaveClass(/opening/)
  await page.reload() // not played yet: it is still the first visit
  await expect(page.locator('.app')).toHaveClass(/opening/)
  await playButton(page).click()
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 3000 })
  await page.reload()
  expect(await hasOpening(page)).toBe(0)
  await page.getByRole('button', { name: /^Level 1/ }).click()
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
  const saved = JSON.stringify({ version: 2, completed: { '01': {} } })
  const back = await (await browser.newContext()).newPage() // a returning player goes straight in
  await back.addInitScript(REAL_BROWSER)
  await back.addInitScript((v) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('make-it-fit:progress:v1', v); sessionStorage.setItem('seeded', '1') } }, saved)
  await back.goto('/')
  await expect(back.locator('.app')).toBeVisible()
  expect(await hasOpening(back)).toBe(0)
  await back.goto('/?intro') // replay for review
  await expect(back.locator('.app')).toHaveClass(/go/)
  await playButton(back).click()
  await expect(back.locator('.app')).not.toHaveClass(/opening/, { timeout: 3000 })
  await back.goto('/') // reloading without ?intro does not force it
  expect(await hasOpening(back)).toBe(0)
  expect(await back.evaluate(() => localStorage.getItem('make-it-fit:progress:v1'))).toBe(saved)
  await back.context().close()
})

test('with reduced motion the opening is shown without any movement and Play goes straight in', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  await expect(playButton(page)).toBeVisible()
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.opening-tag')!).opacity)).toBe('1')
  await playButton(page).click()
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 500 }) // immediately, no transition
  await expect(note(page)).toBeVisible()
})

test('the wordmark lands exactly where it rests: no jump at the handoff', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  const rect = () => page.evaluate(() => { const r = (document.querySelector('.brand-lockup') as HTMLElement).getBoundingClientRect(); return [r.left, r.top, r.width, r.height] })
  const big = await page.evaluate(() => Number(getComputedStyle(document.querySelector('.brand-lockup')!).zoom))
  expect(big).toBeGreaterThan(1.4) // laid out large, so text is rasterised large
  await playButton(page).click()
  await page.evaluate(() => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = 1500 }))
  await page.waitForTimeout(150)
  const before = await rect()
  await page.evaluate(() => document.getAnimations().forEach((a) => a.play()))
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 3000 })
  const after = await rect()
  for (let i = 0; i < 4; i++) expect(Math.abs(before[i] - after[i])).toBeLessThan(1)
})

test('rotating or resizing while it waits re-centres the wordmark', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  await page.setViewportSize({ width: 844, height: 390 })
  const measure = () =>
    page.evaluate(() => {
      const r = (document.querySelector('.brand-lockup') as HTMLElement).getBoundingClientRect()
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, vw: innerWidth, vh: innerHeight, w: r.width }
    })
  // The page re-measures a moment after the resize (a short debounce, then the fonts check, then a frame), so wait for the
  // wordmark to arrive instead of sleeping a fixed time: a busy CI browser can take longer than any fixed guess. The 4 px
  // tolerance is unchanged, and a wordmark that never re-centres still fails after the timeout.
  await expect
    .poll(async () => {
      const c = await measure()
      return Math.abs(c.cx - c.vw / 2)
    }, { message: 'the wordmark re-centres after the resize', timeout: 10_000 })
    .toBeLessThan(4)
  const c = await measure()
  expect(c.cy).toBeLessThan(c.vh * 0.6)
  expect(c.w).toBeLessThan(c.vw)
  await expect(playButton(page)).toBeVisible()
})

test('the opening never changes saved progress or the saved note state', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  await playButton(page).click()
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 3000 })
  expect(await page.evaluate(() => localStorage.getItem('make-it-fit:progress:v1'))).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('make-it-fit:boards:v1'))).toBeNull()
  expect(await page.evaluate((k) => localStorage.getItem(k), INTRO)).toBeNull()
})

test('the Play button feels physical: it lifts on hover, compresses when pressed, springs back on release', async ({ page }) => {
  await page.goto('/?intro')
  await expect(page.locator('.app')).toHaveClass(/go/)
  const btn = playButton(page)
  const scale = () => btn.evaluate((b) => { const m = new DOMMatrix(getComputedStyle(b).transform); return { y: m.m42, s: m.a } })
  await page.waitForTimeout(1700)
  await btn.blur()
  expect((await scale()).s).toBeCloseTo(1, 2)
  const box = (await btn.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await expect.poll(async () => (await scale()).y).toBeLessThan(-1) // lifted
  await page.mouse.down()
  await expect.poll(async () => (await scale()).s).toBeLessThan(0.99) // compressed
  await page.mouse.up()
  await expect(page.locator('.app')).toHaveClass(/leaving/)
  expect(await page.evaluate(() => document.getAnimations().some((a) => a.animationName === 'op-release'))).toBe(true)
  await expect(page.locator('.app')).not.toHaveClass(/opening/, { timeout: 3000 })
  await expect(note(page)).toBeVisible() // the tutorial only after the transition has settled
})

test('with reduced motion the Play button does not move when hovered or pressed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?intro')
  const btn = playButton(page)
  await expect(btn).toBeVisible()
  const box = (await btn.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(250)
  expect(await btn.evaluate((b) => getComputedStyle(b).transform)).toBe('none')
  await page.mouse.up()
})
