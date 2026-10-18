import { expect, test, type Page } from '@playwright/test'
import { dragItem, packStep, pageHasNoHorizontalScroll, piece } from './helpers'
import { LEVEL1 } from './solutions'
import { LEAD_HZ } from '../src/sound'

// A stand-in for the browser's audio: nothing is played, every tone that would start is written down.
// The real sound system runs unchanged on top of it.
async function fakeAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __tones: number[]; __noises: number[]; __contexts: number }
    w.__tones = []
    w.__noises = [] // the starting centre (Hz) of each noise source's filter
    w.__contexts = 0
    const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} })
    const node = () => ({ connect: (n: unknown) => n, disconnect() {} })
    class FakeAudioContext {
      state = 'running'
      currentTime = 0
      sampleRate = 8000
      destination = {}
      constructor() {
        w.__contexts++
      }
      resume = () => Promise.resolve()
      close = () => Promise.resolve()
      createGain = () => ({ ...node(), gain: param() })
      createBuffer = (_c: number, n: number) => ({ getChannelData: () => new Float32Array(n) })
      createBiquadFilter = () => {
        const frequency = param()
        let first = 0
        frequency.setValueAtTime = (hz: number) => void (first ||= hz)
        return { ...node(), frequency, Q: param(), first: () => first }
      }
      createBufferSource = () => {
        let filter: { first: () => number } | undefined
        return { connect: (n: { first: () => number }) => ((filter = n), n), disconnect() {}, start: () => w.__noises.push(filter?.first() ?? 0), stop() {} }
      }
      createOscillator = () => {
        const frequency = param()
        let first = 0
        frequency.setValueAtTime = (hz: number) => void (first ||= hz)
        return { ...node(), frequency, start: () => w.__tones.push(first), stop() {} }
      }
    }
    ;(window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext
  })
}

const tones = (page: Page) => page.evaluate(() => (window as unknown as { __tones: number[] }).__tones.map((hz) => Math.round(hz * 100) / 100))
// waits past the sounds' minimum gaps first, so a script that acts faster than any player does not hit the rate limit
const clearTones = async (page: Page) => {
  await page.waitForTimeout(700)
  await page.evaluate(() => {
    const w = window as unknown as { __tones: number[]; __noises: number[] }
    w.__tones.length = 0
    w.__noises.length = 0
  })
}
const noises = (page: Page) => page.evaluate(() => (window as unknown as { __noises: number[] }).__noises.map((hz) => Math.round(hz)))
const count = (list: number[], hz: number) => list.filter((x) => x === hz).length
const contexts = (page: Page) => page.evaluate(() => (window as unknown as { __contexts: number }).__contexts)
const toggle = (page: Page) => page.getByRole('button', { name: 'Sound effects' })

const ON = { 'make-it-fit:sound:v1': '{"version":1,"muted":false}' } // a player who has turned sound on earlier
const PLACE = [LEAD_HZ.place]
const COMPLETE = [523.25, 659.25, 783.99, 1046.5]

async function start(page: Page, storage: Record<string, string> = ON) {
  await fakeAudio(page)
  await page.goto('/')
  await page.evaluate((extra) => {
    localStorage.clear()
    localStorage.setItem('make-it-fit:intro:v1', JSON.stringify({ version: 1, seen: { '01': true, '02': true, '03': true } }))
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v)
  }, storage)
  await page.reload()
}

test.describe('sound effects', () => {
  test('a new player hears nothing: sound is off, no audio exists, and the game plays; turning it on is explicit and saved', async ({ page }) => {
    await start(page, {})
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    await dragItem(page, 'charger', 0, 0)
    await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 1, row 1/)
    await piece(page, 'shoes').click()
    await page.keyboard.press('r')
    expect(await contexts(page)).toBe(0)
    expect(await tones(page)).toEqual([])
    expect(await page.evaluate(() => localStorage.getItem('make-it-fit:sound:v1'))).toBeNull()
    await toggle(page).click()
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
    expect(await contexts(page)).toBe(1)
    expect(await page.evaluate(() => localStorage.getItem('make-it-fit:sound:v1'))).toBe('{"version":1,"muted":false}')
    await page.reload()
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true') // remembered
    expect(await contexts(page)).toBe(0) // but nothing starts until the player acts
  })

  test('nothing starts before the player acts; a drag, a drop and a bad drop each make their own sound', async ({ page }) => {
    await start(page)
    expect(await contexts(page)).toBe(0)
    await dragItem(page, 'charger', 0, 0)
    await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 1, row 1/)
    expect(await contexts(page)).toBe(1)
    expect(await tones(page)).toEqual([LEAD_HZ.pickup, ...PLACE])
    await clearTones(page)
    await dragItem(page, 'toiletries', 0, 0) // on top of the charger
    await expect(piece(page, 'toiletries')).toHaveAttribute('aria-label', /not packed/)
    expect(await tones(page)).toEqual([LEAD_HZ.pickup, LEAD_HZ.invalid, 370]) // a soft two-note step down
  })

  test('rotating makes one click, even from a held key; taking an item out has its own sound', async ({ page }) => {
    await start(page)
    await piece(page, 'shoes').click()
    await clearTones(page)
    await page.keyboard.press('r')
    expect(await tones(page)).toEqual([LEAD_HZ.rotate])
    await dragItem(page, 'charger', 0, 0)
    await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed/)
    await clearTones(page)
    await piece(page, 'charger').focus()
    await page.keyboard.press('Delete')
    await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /not packed/)
    expect(await tones(page)).toEqual([LEAD_HZ.remove])
  })

  test('the keyboard flow sounds once per action', async ({ page }) => {
    await start(page)
    await piece(page, 'charger').focus()
    await clearTones(page)
    await page.keyboard.press('Enter')
    expect(await tones(page)).toEqual([LEAD_HZ.pickup])
    await clearTones(page)
    await page.keyboard.press('Enter')
    await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed/)
    expect(await tones(page)).toEqual(PLACE)
  })

  test('winning plays the completion cue once, after the last piece lands', async ({ page }) => {
    await start(page)
    for (const step of LEVEL1.slice(0, -1)) await packStep(page, step)
    await clearTones(page)
    await packStep(page, LEVEL1[LEVEL1.length - 1])
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await tones(page)).toEqual([LEAD_HZ.pickup, ...PLACE, ...COMPLETE])
    expect(count(await noises(page), 2200)).toBe(1) // the zipper, once
  })

  test('mute: accessible pressed state, silences every sound, persists across reloads, and can be undone from the keyboard', async ({ page }) => {
    await start(page, ON)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
    await toggle(page).click()
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    await clearTones(page)
    await dragItem(page, 'charger', 0, 0)
    await piece(page, 'shoes').click()
    await page.keyboard.press('r')
    expect(await tones(page)).toEqual([])
    expect(await page.evaluate(() => localStorage.getItem('make-it-fit:sound:v1'))).toBe('{"version":1,"muted":true}')
    await page.reload()
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    await toggle(page).focus()
    await page.keyboard.press('Enter')
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
    expect(await tones(page)).toEqual([LEAD_HZ.pickup]) // a small tick confirms sound is back
    // muting never touches saved game progress
    expect(await page.evaluate(() => localStorage.getItem('make-it-fit:progress:v1'))).toBeNull()
  })

  test('a muted player who reloads never creates an audio context', async ({ page }) => {
    await start(page, { 'make-it-fit:sound:v1': '{"version":1,"muted":true}' })
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    await dragItem(page, 'charger', 0, 0)
    expect(await contexts(page)).toBe(0)
  })

  test('a damaged saved preference is ignored: sound stays off', async ({ page }) => {
    await start(page, { 'make-it-fit:sound:v1': '{"version":1,"muted":"no"}' })
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    await dragItem(page, 'charger', 0, 0)
    expect(await contexts(page)).toBe(0)
  })

  test('the game works with no Web Audio at all', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { AudioContext: unknown }).AudioContext = undefined
      ;(window as unknown as { webkitAudioContext: unknown }).webkitAudioContext = undefined
    })
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('make-it-fit:intro:v1', JSON.stringify({ version: 1, seen: { '01': true } }))
      localStorage.setItem('make-it-fit:sound:v1', '{"version":1,"muted":false}')
    })
    await page.reload()
    // listen only now: the first load was cut short by the reload above, and a cancelled module fetch is not a game error
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await dragItem(page, 'charger', 0, 0)
    await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed at column 1, row 1/)
    await toggle(page).click()
    await toggle(page).click()
    expect(errors).toEqual([])
  })
})

for (const [w, h] of [[360, 740], [390, 844], [768, 1024], [1280, 900]] as const) {
  test(`the sound button is whole, on screen and a comfortable target at ${w}×${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    await start(page)
    const box = (await toggle(page).boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(40)
    expect(box.height).toBeGreaterThanOrEqual(40)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(w)
    expect(await pageHasNoHorizontalScroll(page)).toBe(true)
    const tabs = await page.locator('.level-tab').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()))
    for (const t of tabs) expect(box.x + box.width <= t.left + 1 || t.right <= box.x + 1 || box.y + box.height <= t.top + 1 || t.bottom <= box.y + 1).toBe(true)
  })
}

test('the sound button is unreachable while the opening waits, and reachable after Play', async ({ page }) => {
  await fakeAudio(page)
  await page.addInitScript(() => localStorage.setItem('make-it-fit:sound:v1', '{"version":1,"muted":false}'))
  await page.goto('/?intro')
  await expect(page.locator('.opening-play')).toBeVisible()
  await expect(page.locator('.masthead-tools')).toHaveAttribute('inert', '') // set just after the first paint
  await page.locator('.opening-play').click()
  await expect(page.locator('.app.opening')).toHaveCount(0)
  await expect(toggle(page)).toBeVisible()
  expect(await page.evaluate(() => document.querySelector('.masthead-tools')?.hasAttribute('inert'))).toBe(false)
  expect(await contexts(page)).toBe(1) // started by the Play press (this player has sound on)
})

test.describe('button clicks and page turns', () => {
  const CLICK = LEAD_HZ.click
  const PAPER = [LEAD_HZ.paper, 4500]

  test('Undo and Reset click once each by mouse and by keyboard; disabled buttons and the Rotate and Remove buttons add no click', async ({ page }) => {
    await start(page)
    await page.getByRole('button', { name: 'Undo' }).click({ force: true }) // disabled: nothing to undo
    await page.getByRole('button', { name: 'Reset' }).click({ force: true })
    expect(await tones(page)).toEqual([])
    await dragItem(page, 'charger', 0, 0)
    await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed/)
    await clearTones(page)
    await page.getByRole('button', { name: 'Undo' }).click()
    expect(count(await tones(page), CLICK)).toBe(1)
    await dragItem(page, 'charger', 0, 0)
    await clearTones(page)
    await page.getByRole('button', { name: 'Reset' }).focus()
    await page.keyboard.press('Enter')
    expect(count(await tones(page), CLICK)).toBe(1)
    await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /not packed/)
    await piece(page, 'shoes').click()
    await clearTones(page)
    await page.getByRole('button', { name: 'Rotate', exact: true }).click()
    expect(await tones(page)).toEqual([LEAD_HZ.rotate]) // Rotate keeps its own sound, with no extra click
  })

  test('level tabs click only when the level really changes', async ({ page }) => {
    await start(page, { ...ON, 'make-it-fit:progress:v1': '{"version":2,"completed":{"01":{}}}' })
    await expect(page.getByRole('button', { name: /^Level 2/ })).toHaveAttribute('aria-current', 'page') // opens on the next unfinished level
    await page.getByRole('button', { name: /^Level 2/ }).click() // already here
    await page.getByRole('button', { name: /^Level 3/ }).click({ force: true }) // locked
    expect(await tones(page)).toEqual([])
    await page.getByRole('button', { name: /^Level 1/ }).click()
    expect(await tones(page)).toEqual([CLICK])
  })

  test('the win dialog: Keep packing clicks once', async ({ page }) => {
    await start(page)
    for (const step of LEVEL1) await packStep(page, step)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await clearTones(page)
    await dialog.getByRole('button', { name: 'Keep packing' }).click()
    expect(await tones(page)).toEqual([CLICK])
    await expect(dialog).toHaveCount(0)
  })

  test('Next level in the dialog is one click and one level change (the dialog opens after the win cue)', async ({ page }) => {
    await start(page)
    for (const step of LEVEL1) await packStep(page, step)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await clearTones(page)
    await dialog.getByRole('button', { name: 'Next level' }).click()
    expect(await tones(page)).toEqual([CLICK])
    await expect(page.getByRole('button', { name: /^Level 2/ })).toHaveAttribute('aria-current', 'page')
  })

  test('the how-to-play note turns pages with paper, only when the page changes, and closes with a click', async ({ page }) => {
    await start(page, { ...ON, 'make-it-fit:intro:v1': '{"version":1,"seen":{}}' })
    const note = page.getByRole('region', { name: /How to play Level 1/ })
    await expect(note).toBeVisible()
    expect(await tones(page)).toEqual([]) // appearing makes no sound
    await clearTones(page)
    await note.getByRole('button', { name: 'Next' }).click()
    expect(await noises(page)).toEqual(PAPER)
    expect(await tones(page)).toEqual([])
    await clearTones(page)
    await note.getByRole('button', { name: 'Back' }).click()
    expect(await noises(page)).toEqual(PAPER)
    await clearTones(page)
    await note.getByRole('button', { name: 'Next' }).focus()
    await page.keyboard.press('ArrowLeft') // already on the first page: nothing turns
    expect(await noises(page)).toEqual([])
    await page.keyboard.press('ArrowRight')
    expect(await noises(page)).toEqual(PAPER)
    await clearTones(page)
    await page.keyboard.press('ArrowRight') // last page: nothing turns
    expect(await noises(page)).toEqual([])
    await note.getByRole('button', { name: 'Got it' }).click()
    expect(await tones(page)).toEqual([CLICK])
    await expect(note).toHaveCount(0)
  })

  test('muted, none of these buttons make a sound', async ({ page }) => {
    await start(page, { 'make-it-fit:sound:v1': '{"version":1,"muted":true}', 'make-it-fit:intro:v1': '{"version":1,"seen":{}}' })
    const note = page.getByRole('region', { name: /How to play Level 1/ })
    await note.getByRole('button', { name: 'Next' }).click()
    await note.getByRole('button', { name: 'Got it' }).click()
    await dragItem(page, 'charger', 0, 0)
    await page.getByRole('button', { name: 'Undo' }).click()
    expect(await tones(page)).toEqual([])
    expect(await noises(page)).toEqual([])
    expect(await contexts(page)).toBe(0)
  })
})

test.describe('touch', () => {
  test.use({ hasTouch: true })
  test('a tap on Undo clicks once, not once for the touch and again for the click', async ({ page }) => {
    await start(page)
    await dragItem(page, 'charger', 0, 0)
    await expect(piece(page, 'charger')).toHaveAttribute('aria-label', /packed/)
    await clearTones(page)
    await page.getByRole('button', { name: 'Undo' }).tap()
    expect(count(await tones(page), LEAD_HZ.click)).toBe(1)
  })
})

for (const reduced of [false, true]) {
  test(`the win dialog buttons sink when pressed, like Rotate and Reset, ${reduced ? 'instantly with reduced motion' : 'with a short spring'}`, async ({ page }) => {
    if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
    await start(page, {})
    for (const step of LEVEL1) await packStep(page, step)
    const next = page.getByRole('dialog').getByRole('button', { name: 'Next level' })
    await expect(next).toBeVisible()
    const probe = () => next.evaluate((e) => ({ transform: getComputedStyle(e).transform, duration: getComputedStyle(e).transitionDuration, shadow: getComputedStyle(e).boxShadow }))
    const before = await probe()
    expect(before.transform).toBe('none')
    expect(before.duration.split(', ').every((d) => d === (reduced ? '0s' : '0.09s'))).toBe(true)
    const b = (await next.boundingBox())!
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(200)
    const pressed = await probe()
    expect(pressed.transform).toBe('matrix(1, 0, 0, 1, 2, 3)')
    expect(pressed.shadow).toBe('none')
    await page.mouse.move(b.x - 40, b.y - 40) // slide off to cancel the press
    await page.mouse.up()
    await expect(next).toBeVisible()
    await page.waitForTimeout(200)
    expect((await probe()).transform).toBe('none')
  })
}
