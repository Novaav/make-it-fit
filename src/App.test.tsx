import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'
import LevelPlay from './LevelPlay'
import { loadLevels } from './engine'

describe('App initial render', () => {
  const html = renderToString(<App />).replace(/<!-- -->/g, '')

  it('shows all six Level 1 items in the tray as focusable buttons', () => {
    for (const id of ['passport', 'shirt', 'jeans', 'charger', 'toiletries', 'shoes']) {
      expect(html).toContain(`data-item="${id}"`)
    }
    expect(html.match(/class="piece in-tray/g)).toHaveLength(6)
  })

  it('starts empty, with undo/reset disabled and no completion message', () => {
    expect(html).toMatch(/Required<\/span><b>0\/6<\/b>/)
    expect(html).not.toContain('Everything fits')
    expect(html.match(/<button[^>]*disabled/g)).toHaveLength(5) // remove, undo, reset, locked Level 2 and 3 tabs
  })

  it('renders a 5x6 hidden cell grid', () => {
    expect(html.match(/class="cell /g)).toHaveLength(30)
  })
})

describe('tray markup', () => {
  const html = renderToString(<App />)
  it('places every tray item in a fixed grid area (not flow layout)', () => {
    expect(html.match(/grid-column:\d+ \/ span \d+;grid-row:\d+ \/ span \d+/g)).toHaveLength(6)
  })
})

describe('level selection and Level 2 markup', () => {
  const app = renderToString(<App />).replace(/<!-- -->/g, '')
  const l2 = renderToString(<LevelPlay level={loadLevels().find((l) => l.id === '02')!} onWin={() => {}} />).replace(/<!-- -->/g, '')

  it('starts on Level 1 with Level 2 locked and no weight meter', () => {
    expect(app).toMatch(/aria-current="page"[^>]*>Level 1/)
    expect(app).toMatch(/<button[^>]*disabled=""[^>]*>Level 2/)
    expect(app).not.toContain('role="meter"')
  })

  it('shows all ten Level 2 items in fixed grid areas, with a live weight meter', () => {
    expect(l2.match(/grid-column:\d+ \/ span \d+;grid-row:\d+ \/ span \d+/g)).toHaveLength(10)
    expect(l2).toContain('role="meter"')
    expect(l2).toContain('aria-valuemax="15"')
    expect(l2).toMatch(/Required<\/span><b>0\/5<\/b>/)
    expect(l2).toMatch(/class="pill weight"><b>0\/15 kg<\/b>/)
    expect(l2).toMatch(/Bonus<\/span><b>0\/2<\/b>/)
  })

  it('marks optional items and shows every item weight', () => {
    expect(l2.match(/class="chip-w bonus"/g)).toHaveLength(5)
    expect(l2.match(/class="chip-w"/g)).toHaveLength(5)
    expect(l2).toContain('Optional, 4 kg.')
  })
})

describe('Level 3 markup', () => {
  const l3 = renderToString(<LevelPlay level={loadLevels().find((l) => l.id === '03')!} onWin={() => {}} />).replace(/<!-- -->/g, '')
  it('shows all eight items in fixed slots, a 24 kg meter, and 3 optional items', () => {
    expect(l3.match(/grid-column:\d+ \/ span \d+;grid-row:\d+ \/ span \d+/g)).toHaveLength(8)
    expect(l3).toContain('aria-valuemax="24"')
    expect(l3).toMatch(/class="pill weight"><b>0\/24 kg<\/b>/)
    expect(l3).toMatch(/Bonus<\/span><b>0\/2<\/b>/)
    expect(l3.match(/class="chip-w bonus"/g)).toHaveLength(3)
  })
})

describe('objective clarity', () => {
  const html = (id: string) => renderToString(<LevelPlay level={loadLevels().find((l) => l.id === id)!} onWin={() => {}} />).replace(/<!-- -->/g, '')
  it('Level 1 states the goal and green/red meaning once; no weight or bonus pills', () => {
    const h = html('01')
    expect(h).toContain('Fit all 6 items into the suitcase. Green = fits, red = doesn&#x27;t.')
    expect(h).not.toContain('class="pill weight')
    expect(h).not.toContain('class="pill bonus')
    expect(h).not.toContain('Goal')
  })
  it('Levels 2-3 state required count, weight limit and the optional bonus in one sentence plus pills', () => {
    expect(html('02')).toContain('Pack all required items under 15 kg. ★ items are optional.')
    expect(html('03')).toContain('Pack all required items under 24 kg. ★ items are optional.')
    for (const id of ['02', '03']) {
      const h = html(id)
      expect(h).toContain('class="pill weight')
      expect(h).toContain('class="pill bonus')
      expect(h).not.toContain('<section class="goals"')
    }
  })
  it('bonus denominator is the verified maximum, never the optional item count; no Max! before solving', () => {
    for (const id of ['02', '03']) {
      const h = html(id)
      expect(h).toMatch(/Bonus<\/span><b>0\/2<\/b>/)
      expect(h).not.toMatch(/Bonus<\/span><b>0\/[35]<\/b>/)
      expect(h).not.toContain('Max!')
      expect(h).not.toContain('best 2')
    }
    expect(html('02')).toContain('5 optional ★ · at most 2 fit')
    expect(html('03')).toContain('3 optional ★ · at most 2 fit')
  })
  it('keeps the dialog closed and the controls help collapsed by default', () => {
    const h = html('02')
    expect(h).not.toContain('role="dialog"')
    expect(h).toMatch(/<details class="help">/)
  })
  it('shows each item weight with its unit on limit levels only', () => {
    expect(html('02').match(/class="chip-w[^"]*"[^>]*>\d+ kg/g)).toHaveLength(10)
    expect(html('01')).not.toContain('chip-w')
    // anchored on a covered cell: the hairdryer (T shape) chip sits at the end of its stem, cell (1,2) -> x=2,y=3
    expect(html('02')).toMatch(/--chip-x:2;--chip-y:3[^>]*>5 kg/)
  })
})
