import { useEffect, useRef, useState } from 'react'

/**
 * The branded opening: shown to a player with nothing saved yet, once per browsing session. It waits, as long as it takes,
 * until Play is pressed (nothing else starts the game). A returning player, and browser automation, go straight in;
 * `?intro` forces it, to review it. Reduced motion shows it without movement. The look is all in styles.css (`.opening`,
 * `.go`, `.leaving`); this module decides when it shows, measures where the wordmark starts, and sequences Play.
 */
export const OPENING_KEY = 'make-it-fit:opening:v1'
/** How long the move into the masthead lasts; styles.css times its animations to this. */
export const LEAVE_MS = 880

export interface OpeningFacts {
  /** The address's query string, e.g. "?intro". */
  search: string
  /** navigator.webdriver: true under browser automation. */
  automated: boolean
  /** Whether anything is saved (progress, arrangements or seen notes). */
  returning: boolean
  /** Whether Play was already pressed in this browsing session. */
  shownThisSession: boolean
}

/** Whether the opening is shown on load. */
export function shouldPlayOpening({ search, automated, returning, shownThisSession }: OpeningFacts): boolean {
  if (new URLSearchParams(search).has('intro')) return true
  return !automated && !returning && !shownThisSession
}

/** Where the wordmark starts: centred on the table, enlarged (drawn large, then shrunk into place), with the tag and button below. */
export interface OpeningLayout {
  scale: number
  /** Offsets of the enlarged wordmark's top-left corner from its resting place, in whole pixels. */
  dx: number
  dy: number
  /** Top of the tag and Play stack. */
  tagTop: number
}

/** `rest` is the wordmark's box in the masthead (its final place). */
export function openingLayout(rest: { left: number; top: number; width: number; height: number }, vw: number, vh: number): OpeningLayout {
  const scale = Math.max(1, Math.min(3.8, (vw * 0.84) / rest.width, (vh * 0.3) / rest.height))
  const w = rest.width * scale
  const h = rest.height * scale
  const top = Math.max(8, (vh - (h + 112)) / 2 - vh * 0.03)
  return { scale, dx: Math.round((vw - w) / 2) - rest.left, dy: Math.round(top) - rest.top, tagTop: top + h + 18 }
}

const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function initialOpening(returning: boolean): boolean {
  if (typeof window === 'undefined') return false
  try {
    return shouldPlayOpening({
      search: window.location.search,
      automated: navigator.webdriver,
      returning,
      shownThisSession: window.sessionStorage.getItem(OPENING_KEY) !== null,
    })
  } catch {
    return false
  }
}

export function useOpening(returning: boolean) {
  const [opening, setOpening] = useState(() => initialOpening(returning))
  // `go` shows the composition once the fonts are in and the wordmark's position is measured (until then the table is empty);
  // `leaving` is the move into the masthead after Play, which ends the opening when it has settled.
  const [go, setGo] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [measureKey, setMeasureKey] = useState(0)
  const appRef = useRef<HTMLDivElement>(null)
  const lockupRef = useRef<HTMLDivElement>(null)
  const playRef = useRef<HTMLButtonElement>(null)

  const play = () => {
    if (leaving) return
    try {
      window.sessionStorage.setItem(OPENING_KEY, '1')
    } catch {
      // private mode: it simply shows again next time
    }
    if (reducedMotion()) setOpening(false)
    else setLeaving(true)
  }

  useEffect(() => {
    if (!leaving) return
    const t = window.setTimeout(() => {
      setOpening(false)
      setLeaving(false)
    }, LEAVE_MS)
    return () => window.clearTimeout(t)
  }, [leaving])

  // the game underneath cannot be reached (by keyboard, touch or a screen reader) while the opening is up
  useEffect(() => {
    if (!opening) return
    const under = Array.from(appRef.current?.querySelectorAll<HTMLElement>(':scope > :not(.masthead):not(.opening-layer), .masthead-tools') ?? [])
    under.forEach((e) => e.setAttribute('inert', ''))
    return () => {
      under.forEach((e) => e.removeAttribute('inert'))
      // keyboard focus returns to the game (a first-visit note, if it opens, takes focus itself)
      requestAnimationFrame(() => {
        if (document.activeElement === document.body) document.querySelector<HTMLElement>('.level-tab.current')?.focus({ preventScroll: true })
      })
    }
  }, [opening])

  useEffect(() => {
    if (!opening) return
    let alive = true
    const fonts = document.fonts?.ready ?? Promise.resolve()
    void Promise.race([fonts, new Promise((r) => window.setTimeout(r, 400))]).then(() => {
      const app = appRef.current
      const lockup = lockupRef.current
      if (!alive || !app || !lockup) return
      // read the wordmark's final place, then centre it, enlarged, on the table with the tag and button beneath it
      const rest = lockup.getBoundingClientRect()
      const l = openingLayout(rest, window.innerWidth, window.innerHeight)
      // The wordmark is drawn at its large size (CSS zoom) and shrinks into place, so its text and mark are always
      // rasterised at least as large as they are shown (scaling a small bitmap up is what made the old version soft).
      // The slot keeps the masthead's layout; the start position is a whole pixel.
      app.style.setProperty('--lw', `${rest.width}px`)
      app.style.setProperty('--lh', `${rest.height}px`)
      app.style.setProperty('--os', String(l.scale))
      app.style.setProperty('--is', String(1 / l.scale))
      app.style.setProperty('--ox', `${l.dx}px`)
      app.style.setProperty('--oy', `${l.dy}px`)
      app.style.setProperty('--tag-top', `${l.tagTop}px`)
      setGo(true)
      requestAnimationFrame(() => playRef.current?.focus({ preventScroll: true }))
    })
    return () => {
      alive = false
    }
  }, [opening, measureKey])

  // it waits indefinitely, so a rotated phone or resized window must re-centre it (not the browser bar sliding on a phone)
  useEffect(() => {
    if (!opening) return
    let size = [window.innerWidth, window.innerHeight]
    let timer = 0
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (window.innerWidth === size[0] && Math.abs(window.innerHeight - size[1]) < 100) return
        size = [window.innerWidth, window.innerHeight]
        setGo(false)
        setMeasureKey((k) => k + 1)
      }, 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [opening])

  return { opening, go, leaving, appRef, lockupRef, playRef, play }
}
