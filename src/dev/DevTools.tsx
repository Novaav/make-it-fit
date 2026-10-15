import { useState } from 'react'
import './devtools.css'
import { allLevels } from './solutions'
import { referenceSolution } from './solutions'
import type { Placement } from '../engine'

interface Props {
  levelId: string
  onJump: (levelId: string) => void
  onFill: (placements: Placement[]) => void
  onTestWin: (placements: Placement[]) => void
  testMode: boolean
  onClearProgress: () => void
}

/** Development-only helper panel. Loaded lazily behind `import.meta.env.DEV`; never in production. */
export default function DevTools({ levelId, onJump, onFill, onTestWin, testMode, onClearProgress }: Props) {
  // Open on desktop; collapsed on phone-sized screens so it never covers the game controls.
  const [open, setOpen] = useState(() => window.innerWidth > 760)
  const levels = allLevels()
  const level = levels.find((l) => l.id === levelId)!
  return (
    <>
      {testMode && (
        <div className="test-banner" role="status">
          TEST MODE — nothing is saved. Reload to leave.
        </div>
      )}
    <aside className={`dev-tools${testMode ? ' testing' : ''}`} aria-label="Development tools">
      <button type="button" className="toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        Dev tools {open ? '▾' : '▸'}
      </button>
      {open && (
        <>
      <small>Nothing here is saved.</small>
      <button type="button" className="primary" onClick={() => onTestWin(referenceSolution(level, true))}>
        Test win &amp; continue
      </button>
      <div>
        Jump:
        {levels.map((l) => (
          <button key={l.id} type="button" onClick={() => onJump(l.id)} aria-current={l.id === levelId}>
            L{Number(l.id)}
          </button>
        ))}
      </div>
      <div>
        <button type="button" onClick={() => onFill(referenceSolution(level, false))}>Fill required only</button>
        <button type="button" onClick={() => onFill(referenceSolution(level, true))}>Fill max bonus</button>
      </div>
      <button type="button" onClick={onClearProgress}>Clear saved progress</button>
        </>
      )}
    </aside>
    </>
  )
}
