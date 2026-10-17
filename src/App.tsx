import { lazy, Profiler, Suspense, useEffect, useRef, useState } from 'react'
import { loadLevels, type Placement } from './engine'
import LevelPlay from './LevelPlay'
import { loadBoards, saveBoards, type Boards, type SavedBoard } from './boards'
import { PLAYABLE_LEVEL_IDS } from './levelMeta'
import { loadIntroSeen, saveIntroSeen, type IntroSeen } from './intro'
import {
  browserStorage,
  isUnlocked,
  loadProgress,
  recordCompletion,
  saveProgress,
  startingLevel,
  emptyProgress,
  type LevelResult,
  type Progress,
} from './progress'

const IDS: readonly string[] = PLAYABLE_LEVEL_IDS
// Cheats live in a lazily loaded module that only exists in development builds.
const DevTools = import.meta.env.DEV ? lazy(() => import('./dev/DevTools')) : null
// Development only: counts React commits so browser tests can measure re-renders during a drag.
const countCommit = () => {
  const w = window as unknown as { __commits?: number }
  w.__commits = (w.__commits ?? 0) + 1
}
const LEVELS = loadLevels().filter((l) => IDS.includes(l.id))

// The branded opening plays once per browsing session, for a player with nothing saved yet (a returning player goes
// straight in), never with reduced motion or under browser automation. `?intro` forces it, to review it.
const OPENING_KEY = 'make-it-fit:opening:v1'
const OPENING_MS = 1900
function shouldPlayOpening(returning: boolean): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    if (new URLSearchParams(window.location.search).has('intro')) return true
    if (navigator.webdriver || returning) return false
    return window.sessionStorage.getItem(OPENING_KEY) === null
  } catch {
    return false
  }
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress(browserStorage()))
  const [levelId, setLevelId] = useState(() => startingLevel(progress, IDS))
  const [devFill, setDevFill] = useState<{ levelId: string; nonce: number; placements: Placement[] }>()
  // Dev-only test session, held in memory: it never touches localStorage and vanishes on reload.
  const [testMode, setTestMode] = useState(false)
  const [testDone, setTestDone] = useState<Record<string, LevelResult>>({})
  // The player's current arrangement in each level. Saved separately from progress; test mode keeps its own, never saved.
  const [boards, setBoards] = useState<Boards>(() => loadBoards(browserStorage()))
  const [testBoards, setTestBoards] = useState<Boards>({})
  // Which how-to-play notes were seen (kept apart from progress), and a level whose note is being replayed on request.
  const [introSeen, setIntroSeen] = useState<IntroSeen>(() => loadIntroSeen(browserStorage()))
  const [replayIntro, setReplayIntro] = useState<string | null>(null)
  const [opening, setOpening] = useState(() =>
    shouldPlayOpening(Object.keys(progress.completed).length + Object.keys(boards).length + Object.keys(introSeen).length > 0),
  )
  // `go` starts the sequence once the fonts are in and the wordmark's start position is measured (the table stays empty until then)
  const [go, setGo] = useState(false)
  const appRef = useRef<HTMLDivElement>(null)
  const lockupRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!opening) return
    let alive = true
    const stop = () => setOpening(false)
    try {
      window.sessionStorage.setItem(OPENING_KEY, '1')
    } catch {
      // private mode: it simply plays again next time
    }
    let timer = 0
    const fonts = document.fonts?.ready ?? Promise.resolve()
    void Promise.race([fonts, new Promise((r) => window.setTimeout(r, 400))]).then(() => {
      const app = appRef.current
      const lockup = lockupRef.current
      if (!alive || !app || !lockup) return
      // read the wordmark's final place, then centre it, enlarged, on the table with the tag and button beneath it
      const r = lockup.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const scale = Math.max(1, Math.min(3.8, (vw * 0.84) / r.width, (vh * 0.3) / r.height))
      const w = r.width * scale
      const h = r.height * scale
      const top = Math.max(8, (vh - (h + 112)) / 2 - vh * 0.03)
      app.style.setProperty('--os', String(scale))
      app.style.setProperty('--ox', `${(vw - w) / 2 - r.left}px`)
      app.style.setProperty('--oy', `${top - r.top}px`)
      app.style.setProperty('--tag-top', `${top + h + 18}px`)
      setGo(true)
      timer = window.setTimeout(stop, OPENING_MS)
    })
    // the first touch, click or key press ends it at once, so the game is never made to wait
    window.addEventListener('pointerdown', stop, { capture: true, once: true })
    window.addEventListener('keydown', stop, { capture: true, once: true })
    return () => {
      alive = false
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', stop, { capture: true })
      window.removeEventListener('keydown', stop, { capture: true })
    }
  }, [opening])
  // Why a locked level is locked, shown briefly when its tab is pressed (a disabled button would stay silent, especially on touch).
  const [lockNote, setLockNote] = useState<string | null>(null)
  useEffect(() => {
    if (!lockNote) return
    const t = window.setTimeout(() => setLockNote(null), 4500)
    return () => window.clearTimeout(t)
  }, [lockNote])
  const effective: Progress =
    import.meta.env.DEV && testMode ? { ...progress, completed: { ...testDone, ...progress.completed } } : progress
  const level = LEVELS.find((l) => l.id === levelId)!
  const next = IDS[IDS.indexOf(levelId) + 1]

  const inTestMode = import.meta.env.DEV && testMode
  const handleBoardChange = (id: string, board: SavedBoard) => {
    if (inTestMode) {
      setTestBoards((b) => ({ ...b, [id]: board }))
      return
    }
    const next = { ...boards, [id]: board }
    setBoards(next)
    saveBoards(browserStorage(), next)
  }

  const handleWin = (chaos: number, perfect: boolean) => {
    if (inTestMode) return // TEST MODE: nothing is saved
    const updated = recordCompletion(progress, levelId, chaos, perfect)
    if (updated === progress) return
    setProgress(updated)
    saveProgress(browserStorage(), updated)
  }

  const levelView = (
    <LevelPlay
      key={levelId}
      level={level}
      onWin={handleWin}
      onTestWin={inTestMode ? () => setTestDone((t) => (t[levelId] ? t : { ...t, [levelId]: {} })) : undefined}
      saved={(inTestMode ? testBoards : boards)[levelId]}
      onBoardChange={(board) => handleBoardChange(levelId, board)}
      onDevFillUsed={() => setDevFill(undefined)}
      intro={{
        // a first visit shows the note; TEST MODE never does (and never saves that it was seen)
        // a first-visit note waits for the opening to finish (or be skipped), so the two never compete
        open: replayIntro === levelId || (!inTestMode && !introSeen[levelId] && !opening),
        replay: replayIntro === levelId,
        pending: !inTestMode && !introSeen[levelId],
        onOpen: () => setReplayIntro(levelId),
        onClose: () => {
          setReplayIntro(null)
          if (inTestMode || introSeen[levelId]) return
          const next = { ...introSeen, [levelId]: true as const }
          setIntroSeen(next)
          saveIntroSeen(browserStorage(), next)
        },
      }}
      isLast={!next}
      devFill={import.meta.env.DEV && devFill?.levelId === levelId ? devFill : undefined}
      onNext={next && isUnlocked(effective, IDS, next) ? () => setLevelId(next) : undefined}
    />
  )

  return (
    <div className={`app${opening ? ` opening${go ? ' go' : ''}` : ''}`} ref={appRef}>
      <header className="masthead">
        <div className="brand">
          <div className="brand-lockup" ref={lockupRef}>
          <svg className="brand-mark" viewBox="0 0 44 40" width="44" height="40" aria-hidden="true">
            <path d="M15 9V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" fill="none" stroke="#2b2433" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="2" y="9" width="40" height="28" rx="6" fill="#2a7480" stroke="#2b2433" strokeWidth="2.6" />
            <rect x="8" y="15" width="12" height="9" rx="2" fill="#e8806b" stroke="#2b2433" strokeWidth="1.8" />
            <rect x="22" y="15" width="14" height="9" rx="2" fill="#e3b04f" stroke="#2b2433" strokeWidth="1.8" />
            <rect x="8" y="26" width="18" height="6" rx="2" fill="#b7a4db" stroke="#2b2433" strokeWidth="1.8" />
            <path d="M28 26h8v6h-8z" fill="none" stroke="#fff8e9" strokeWidth="1.6" strokeDasharray="3 2" />
          </svg>
          <h1>Make <span className="wm-it">It</span> Fit</h1>
          </div>
          <p className="tagline">Bad decisions. Limited luggage.</p>
        </div>
        <nav className="levels" aria-label="Levels">
          {LEVELS.map((l) => {
            const unlocked = isUnlocked(effective, IDS, l.id)
            const done = progress.completed[l.id]
            const testOnly = import.meta.env.DEV && !done && !!testDone[l.id]
            return (
              <button
                key={l.id}
                type="button"
                className={`level-tab${l.id === levelId ? ' current' : ''}${done ? ' done' : ''}${testOnly ? ' test-done' : ''}`}
                aria-current={l.id === levelId ? 'page' : undefined}
                aria-disabled={unlocked ? undefined : true}
                title={unlocked ? undefined : `Locked: win Level ${Number(IDS[IDS.indexOf(l.id) - 1])} to unlock`}
                onClick={() => {
                  if (unlocked) {
                    setLockNote(null)
                    setLevelId(l.id)
                  } else {
                    const before = Number(IDS[IDS.indexOf(l.id) - 1])
                    setLockNote(
                      `Level ${Number(l.id)} is locked. Win Level ${before} to unlock it.` +
                        (import.meta.env.DEV ? ' (Dev: Jump opens any level, and a filled win unlocks the next one until you reload.)' : ''),
                    )
                  }
                }}
              >
                Level {Number(l.id)}
                {done && <span aria-label="completed earlier" title="Completed earlier"> ✓</span>}
                {testOnly && <span aria-label="test completion, not saved"> ✓ test</span>}
                {!unlocked && <span aria-label="locked"> 🔒</span>}
              </button>
            )
          })}
        </nav>
        {lockNote && (
          <p className="lock-note" role="status">
            {lockNote}
          </p>
        )}
      </header>
      {opening && (
        <div className="opening-layer">
          <div className="opening-stack">
            <p className="opening-tag" aria-hidden="true">Bad decisions. Limited luggage.</p>
            <button type="button" className="opening-play" onClick={() => setOpening(false)} aria-label="Play (skip the introduction)">
              Play
            </button>
          </div>
        </div>
      )}
      {import.meta.env.DEV ? (
        <Profiler id="level" onRender={countCommit}>
          {levelView}
        </Profiler>
      ) : (
        levelView
      )}
      {DevTools && (
        <Suspense fallback={null}>
          <DevTools
            levelId={levelId}
            testMode={testMode}
            onJump={(id) => {
              setTestMode(true)
              setDevFill(undefined)
              setLevelId(id)
            }}
            onFill={(placements) => {
              setTestMode(true)
              setDevFill((d) => ({ levelId, nonce: (d?.nonce ?? 0) + 1, placements }))
            }}
            onTestWin={(placements) => {
              setTestMode(true)
              setTestDone((t) => ({ ...t, [levelId]: {} }))
              setDevFill((d) => ({ levelId, nonce: (d?.nonce ?? 0) + 1, placements }))
            }}
            onClearProgress={() => {
              setProgress(emptyProgress)
              setTestDone({})
              saveProgress(browserStorage(), emptyProgress)
              setBoards({})
              setTestBoards({})
              saveBoards(browserStorage(), {})
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
