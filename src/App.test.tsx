import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'
import LevelPlay from './LevelPlay'
import { loadLevels } from './engine'

const play = (id: string) =>
  renderToString(<LevelPlay level={loadLevels().find((l) => l.id === id)!} onWin={() => {}} />).replace(/<!-- -->/g, '')

describe('App initial render (Level 1)', () => {
  const html = renderToString(<App />).replace(/<!-- -->/g, '')

  it('shows all five Level 1 items in the tray as focusable buttons', () => {
    for (const id of ['shirt', 'jeans', 'charger', 'toiletries', 'shoes']) expect(html).toContain(`data-item="${id}"`)
    expect(html).not.toContain('data-item="passport"') // the passport is no longer a suitcase item
    expect(html.match(/class="piece in-tray/g)).toHaveLength(5)
  })

  it('starts empty, with undo/reset disabled and no completion message', () => {
    expect(html).toMatch(/Required<\/span><b>0\/5<\/b>/)
    expect(html).not.toContain('Packed!')
    expect(html.match(/<button[^>]*disabled/g)).toHaveLength(5) // remove, undo, reset, locked Level 2 and 3 tabs
  })

  it('renders a 5x6 hidden cell grid and the level title', () => {
    expect(html.match(/class="cell /g)).toHaveLength(30)
    expect(html).toContain('Level 1 · Pack Like a Grown-Up')
  })

  it('places every tray item in a fixed grid area (not flow layout)', () => {
    expect(html.match(/grid-column:\d+ \/ span \d+;grid-row:\d+ \/ span \d+/g)).toHaveLength(5)
  })

  it('starts on Level 1 with Level 2 locked and no allowance meter or bonus', () => {
    expect(html).toMatch(/aria-current="page"[^>]*>Level 1/)
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Level 2/)
    expect(html).not.toContain('role="meter"')
    expect(html).not.toContain('pill bonus')
    expect(html).not.toContain('Bonus')
    expect(html).not.toContain('Perfect pack')
  })
})

describe('Level 1 copy', () => {
  it('explains green/red once, says nothing about weight or bonus, and shows no weights', () => {
    const h = play('01')
    expect(h).toContain('Fit all 5 items into the suitcase. Green = fits, red = doesn&#x27;t.')
    expect(h).not.toContain('allowance')
    expect(h).not.toContain('data-weight')
    expect(h).not.toContain('chip-w')
  })
})

describe('Level 2 markup', () => {
  const l2 = play('02')

  it('shows all ten items in fixed grid areas and an allowance meter in kilograms', () => {
    expect(l2.match(/grid-column:\d+ \/ span \d+;grid-row:\d+ \/ span \d+/g)).toHaveLength(10)
    expect(l2).toContain('Level 2 · Carry-On, Questionable Decisions')
    expect(l2).toContain('role="meter"')
    expect(l2).toContain('aria-label="Packing allowance: 7 kg"')
    expect(l2).toContain('aria-valuemax="7"')
    expect(l2).toMatch(/Required<\/span><b>0\/4<\/b>/)
    expect(l2).toMatch(/Allowance<\/span><b>0\/7 kg<\/b>/)
    expect(l2).toMatch(/Bonus<\/span><b>0\/2<\/b>/)
  })

  it('tells the player the rule in plain words, with an inclusive allowance and no claim about the suitcase', () => {
    expect(l2).toContain('Pack your items within the allowance. ★ items are optional extras.')
    expect(l2).toContain('title="Packing allowance: 7 kg"')
    expect(l2).not.toMatch(/under \d/) // exact-limit packing succeeds, so never "under"
    expect(l2).not.toContain("doesn't weigh")
  })

  it('every item shows its weight (grams below 1 kg, kilograms above); optional items are marked', () => {
    expect(l2.match(/data-weight="\d+"/g)).toHaveLength(10)
    expect(l2).toContain('Optional, 1.5 kg.')
    expect(l2).toContain('Optional, 400 g.')
    expect(l2).toContain('Required, 2.25 kg.')
    expect(l2).toContain('Required, 900 g.')
    expect(l2).toMatch(/class="wlabel wl-dark"[^>]*data-weight="1000"[^>]*>1<span class="unit"> kg<\/span>/) // toiletries, drawn art
    expect(l2).toContain('Optional, 300 g.')
  })

  it('the bonus denominator is the verified maximum (2), never the optional item count (6), with no tier claimed before solving', () => {
    expect(l2).not.toMatch(/Bonus<\/span><b>0\/6<\/b>/)
    expect(l2).not.toContain('Perfect pack')
    expect(l2).toContain('6 optional ★ · at most 2 fit')
  })

  it('keeps the dialog closed and the controls help collapsed by default', () => {
    expect(l2).not.toContain('role="dialog"')
    expect(l2).toMatch(/<details class="help">/)
  })

  it('every Level 2 item is illustrated: no placeholder remains', () => {
    expect(l2).not.toContain('placeholder art')
  })
})

describe('Level 3 markup', () => {
  const l3 = play('03')
  it('unfinished Level 3 artwork is still clearly labelled as a placeholder', () => {
    expect(l3).toContain('placeholder art')
  })
  it('shows all twelve items in fixed slots, a 23 kg allowance and a 0-5 bonus', () => {
    expect(l3.match(/grid-column:\d+ \/ span \d+;grid-row:\d+ \/ span \d+/g)).toHaveLength(12)
    expect(l3).toContain('Level 3 · Excess Baggage')
    expect(l3).toContain('aria-label="Packing allowance: 23 kg"')
    expect(l3).toMatch(/Allowance<\/span><b>0\/23 kg<\/b>/)
    expect(l3).toMatch(/Required<\/span><b>0\/5<\/b>/)
    expect(l3).toMatch(/Bonus<\/span><b>0\/5<\/b>/)
    expect(l3.match(/data-weight="/g)).toHaveLength(12)
    expect(l3).toContain('Optional, 6.5 kg.')
    expect(l3).toContain('Optional, 150 g.')
  })
})
