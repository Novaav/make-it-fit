import { describe, expect, it } from 'vitest'
import notices from '../public/third-party-notices.txt?raw'
import pkg from '../package.json'

// The production build ships public/third-party-notices.txt: it must name every runtime dependency and every bundled font.
describe('third-party notices', () => {
  it('mentions every runtime dependency', () => {
    for (const name of Object.keys(pkg.dependencies)) expect(notices, name).toContain(name)
    expect(notices).toContain('Permission is hereby granted, free of charge')
  })

  it('carries the Open Font Licence and a copyright line for every bundled font', () => {
    for (const font of ['Fraunces', 'Atkinson Hyperlegible', 'Caveat']) expect(notices, font).toContain(font)
    expect(notices).toContain('SIL OPEN FONT LICENSE Version 1.1')
    expect(notices).toContain('Braille Institute of America')
    expect(notices).toContain('Fraunces Project Authors')
    expect(notices).toContain('Caveat Project Authors')
  })
})
