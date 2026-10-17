import { lazy, Profiler, Suspense, useState } from 'react'
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
      saved={(inTestMode ? testBoards : boards)[levelId]}
      onBoardChange={(board) => handleBoardChange(levelId, board)}
      onDevFillUsed={() => setDevFill(undefined)}
      intro={{
        // a first visit shows the note; TEST MODE never does (and never saves that it was seen)
        open: replayIntro === levelId || (!inTestMode && !introSeen[levelId]),
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
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 44 40" width="44" height="40" aria-hidden="true">
            <path d="M15 9V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" fill="none" stroke="#2b2433" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="2" y="9" width="40" height="28" rx="6" fill="#2a7480" stroke="#2b2433" strokeWidth="2.6" />
            <rect x="8" y="15" width="12" height="9" rx="2" fill="#e8806b" stroke="#2b2433" strokeWidth="1.8" />
            <rect x="22" y="15" width="14" height="9" rx="2" fill="#e3b04f" stroke="#2b2433" strokeWidth="1.8" />
            <rect x="8" y="26" width="18" height="6" rx="2" fill="#b7a4db" stroke="#2b2433" strokeWidth="1.8" />
            <path d="M28 26h8v6h-8z" fill="none" stroke="#fff8e9" strokeWidth="1.6" strokeDasharray="3 2" />
          </svg>
          <h1>Make <span className="wm-it">It</span> Fit</h1>
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
                disabled={!unlocked}
                title={unlocked ? undefined : 'Finish the previous level first'}
                onClick={() => setLevelId(l.id)}
              >
                Level {Number(l.id)}
                {done && <span aria-label="completed earlier" title="Completed earlier"> ✓</span>}
                {testOnly && <span aria-label="test completion, not saved"> ✓ test</span>}
                {!unlocked && <span aria-label="locked"> 🔒</span>}
              </button>
            )
          })}
        </nav>
      </header>
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
