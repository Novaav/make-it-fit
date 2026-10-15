import css from '../styles.css?raw'
import { describe, expect, it } from 'vitest'

// Regression: tray pieces were drawn at 0.72 of board scale, so every item (jeans most visibly)
// appeared to grow when picked up or placed. All pieces must size from --cell alone.
describe('piece scale consistency', () => {
  it('can read the stylesheet (guards against a vacuous pass)', () => {
    expect(css).toContain('.piece')
  })

  it('has no per-context scale factor on pieces', () => {
    expect(css).not.toMatch(/--k\b/)
    expect(css).not.toMatch(/\.in-tray\s*\{[^}]*(--k|width|height|scale|zoom)/)
  })

  it('sizes every piece as cells * --cell', () => {
    expect(css).toMatch(/width:\s*calc\(var\(--cell\) \* var\(--cw\)\)/)
    expect(css).toMatch(/height:\s*calc\(var\(--cell\) \* var\(--ch\)\)/)
  })
})
