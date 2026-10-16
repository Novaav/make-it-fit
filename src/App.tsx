import { lazy, Profiler, Suspense, useState } from 'react'
import { loadLevels, type Placement } from './engine'
import LevelPlay from './LevelPlay'
import { BEST_OPTIONAL, PLAYABLE_LEVEL_IDS } from './levelMeta'
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
  const effective: Progress =
    import.meta.env.DEV && testMode ? { ...progress, completed: { ...testDone, ...progress.completed } } : progress
  const level = LEVELS.find((l) => l.id === levelId)!
  const next = IDS[IDS.indexOf(levelId) + 1]

  const handleWin = (optionalPacked: number) => {
    const updated = recordCompletion(progress, levelId, optionalPacked)
    if (updated === progress) return
    setProgress(updated)
    saveProgress(browserStorage(), updated)
  }

  const levelView = (
    <LevelPlay
      key={levelId}
      level={level}
      onWin={handleWin}
      isLast={!next}
      devFill={import.meta.env.DEV && devFill?.levelId === levelId ? devFill : undefined}
      onNext={next && isUnlocked(effective, IDS, next) ? () => setLevelId(next) : undefined}
    />
  )

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <h1>Make It Fit</h1>
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
                {done && <span aria-label="completed"> ✓</span>}
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
              setTestDone((t) => ({ ...t, [levelId]: { bestOptional: BEST_OPTIONAL[levelId] ?? 0 } }))
              setDevFill((d) => ({ levelId, nonce: (d?.nonce ?? 0) + 1, placements }))
            }}
            onClearProgress={() => {
              setProgress(emptyProgress)
              setTestDone({})
              saveProgress(browserStorage(), emptyProgress)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
