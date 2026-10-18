import { lazy, Profiler, Suspense, useEffect, useState } from 'react'
import { loadLevels, type Placement } from './engine'
import LevelPlay from './LevelPlay'
import { loadBoards, saveBoards, type Boards, type SavedBoard } from './boards'
import { PLAYABLE_LEVEL_IDS } from './levelMeta'
import { loadIntroSeen, saveIntroSeen, type IntroSeen } from './intro'
import { useOpening } from './useOpening'
import { sound } from './sound'
import { loadMuted, saveMuted } from './soundPref'
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
  const returning = Object.keys(progress.completed).length + Object.keys(boards).length + Object.keys(introSeen).length > 0
  const { opening, go, leaving, appRef, lockupRef, playRef, play } = useOpening(returning)
  // Sound on/off: the choice is saved on its own, and the sound system itself starts only from a player action.
  const [muted, setMuted] = useState(() => {
    const m = loadMuted(browserStorage())
    sound.setMuted(m)
    return m
  })
  const toggleSound = () => {
    const next = !muted
    setMuted(next)
    sound.setMuted(next)
    saveMuted(browserStorage(), next)
    if (!next) {
      sound.unlock()
      sound.play('pickup') // a small tick, so turning sound on is confirmed by ear as well
    }
  }
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
    <div className={`app${opening ? ` opening${go ? ' go' : ''}${leaving ? ' leaving' : ''}` : ''}`} ref={appRef}>
      <header className="masthead">
        <div className="brand">
          <div className="brand-slot">
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
          </div>
          <p className="tagline">Bad decisions. Limited luggage.</p>
        </div>
        <div className="masthead-tools">
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
                    if (l.id !== levelId) sound.play('click')
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
        <button type="button" className="sound-toggle" aria-pressed={!muted} aria-label="Sound effects" title={muted ? 'Sound is off' : 'Sound is on'} onClick={toggleSound}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            {muted ? (
              <path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
        </div>
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
            <button type="button" className="opening-play" ref={playRef} onClick={() => { sound.unlock(); play() }} onTouchStart={() => {}}>
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
