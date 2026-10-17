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

  it('introduces Chaos with no target: every item is stamped, the total counts up, and nothing must be reached', () => {
    const h = play('01')
    expect(h.match(/class="chaos-badge"/g)).toHaveLength(5)
    for (const [value, n] of [['2', 2], ['3', 1], ['1', 2]] as const) expect(h.match(new RegExp(`data-chaos="${value}"`, 'g')), `Chaos ${value}`).toHaveLength(n)
    expect(h).toMatch(/Chaos<\/span><b>0<\/b>/)
    expect(h).toMatch(/Required<\/span><b>0\/5<\/b>/)
    for (const word of ['to win', 'perfect', 'chaos-bar', 'Must pack', 'MUST']) expect(h, word).not.toContain(word)
    expect(h).toContain('Chaos 2.') // item descriptions mention it for screen readers
  })
})

describe('Level 2 markup', () => {
  const l2 = play('02')

  it('shows all ten items, nothing mandatory, and the Chaos, target, perfect score and weight right away', () => {
    expect(l2.match(/grid-column:\d+ \/ span \d+;grid-row:\d+ \/ span \d+/g)).toHaveLength(10)
    expect(l2).toContain('Level 2 · Carry-On, Questionable Decisions')
    expect(l2).toMatch(/Chaos<\/span><b>0<\/b><span class="of">of 20 to win<\/span>/)
    expect(l2).toContain('perfect 25')
    expect(l2).toMatch(/Weight<\/span><b>0\/6.5 kg<\/b>/)
    expect(l2).toContain('6.5 kg left')
    expect(l2).toContain('aria-label="Packing allowance: 6.5 kg"')
    expect(l2).toContain('aria-valuemax="25"')
    expect(l2).toContain('aria-valuetext="0 Chaos. 20 wins, 25 is perfect."')
    expect(l2).not.toContain('Must pack') // no mandatory items on this level
    expect(l2).not.toContain('MUST')
  })

  it('states the rule in one plain sentence, without the old optional-star bonus', () => {
    expect(l2).toContain('Reach 20 Chaos within 6.5 kg. Perfect: 25.')
    for (const old of ['Bonus', '★', 'optional', 'Required', 'Maximum bonus', 'Perfect pack']) expect(l2, old).not.toContain(old)
    expect(l2).not.toMatch(/under \d/) // exact-limit packing succeeds, so never "under"
  })

  it('every item shows its Chaos in a badge and its weight on its label, without hover', () => {
    expect(l2.match(/class="chaos-badge"/g)).toHaveLength(10)
    expect(l2.match(/data-chaos="\d"/g)).toHaveLength(10)
    expect(l2).toMatch(/data-chaos="6"[^>]*>6<\/span>/) // the DVDs and the handbag
    expect(l2.match(/data-weight="\d+"/g)).toHaveLength(10)
    expect(l2).toContain('Chaos 6, 2.25 kg.')
    expect(l2).toContain('Chaos 2, 900 g.')
    expect(l2).toContain('Chaos 3, 300 g.')
    expect(l2).toContain('Chaos 1, 1 kg.')
    expect(l2).toMatch(/class="wlabel wl-dark"[^>]*data-weight="1000"[^>]*>1<span class="unit"> kg<\/span>/) // toiletries, drawn art
  })

  it('keeps the dialog closed and the controls help collapsed by default; no placeholder art remains', () => {
    expect(l2).not.toContain('role="dialog"')
    expect(l2).toMatch(/<details class="help">/)
    expect(l2).not.toContain('placeholder art')
  })
})

describe('Level 3 markup', () => {
  const l3 = play('03')
  it('every Level 3 item is illustrated: no placeholder art remains', () => {
    expect(l3).not.toContain('placeholder art')
  })
  it('marks the two mandatory items MUST, and shows Chaos, target, perfect score and weight', () => {
    expect(l3.match(/grid-column:\d+ \/ span \d+;grid-row:\d+ \/ span \d+/g)).toHaveLength(12)
    expect(l3).toContain('Level 3 · Excess Baggage')
    expect(l3.match(/class="chaos-badge must"/g)).toHaveLength(2)
    expect(l3.match(/class="chaos-badge"/g)).toHaveLength(10)
    expect(l3).toContain('Cardboard cutout and Laundry bag must come. Then reach 21 Chaos within 21 kg. Perfect: 26.')
    expect(l3).toMatch(/Must pack<\/span><b>0\/2<\/b>/)
    expect(l3).toMatch(/Chaos<\/span><b>0<\/b><span class="of">of 21 to win<\/span>/)
    expect(l3).toContain('perfect 26')
    expect(l3).toMatch(/Weight<\/span><b>0\/21 kg<\/b>/)
    expect(l3).toContain('aria-label="Packing allowance: 21 kg"')
    expect(l3.match(/data-weight="/g)).toHaveLength(12)
    expect(l3).toContain('Mandatory, 4 kg.')
    expect(l3).toContain('Chaos 8, 6.5 kg.') // the gnome
    expect(l3).toContain('Chaos 3, 150 g.')
    for (const old of ['Bonus', '★', 'Optional']) expect(l3, old).not.toContain(old)
  })
})
