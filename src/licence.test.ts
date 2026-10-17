import { describe, expect, it } from 'vitest'
import rawLicence from '../LICENSE?raw'
import readme from '../README.md?raw'
import pkg from '../package.json'

const licence = rawLicence.replace(/\s+/g, ' ') // line breaks do not matter

// The licence, package metadata and README must tell the same story.
describe('licence', () => {
  it('names the owner, the year and the contact, and keeps third-party notices where it says they are', () => {
    expect(licence).toContain('Copyright (c) 2026 Nova Zandkarimi. All rights reserved.')
    expect(licence).toContain('https://github.com/Novaav')
    for (const name of ['React', 'Fraunces', 'Atkinson Hyperlegible', 'Caveat']) expect(licence).toContain(name)
    const notices = import.meta.glob('../public/third-party-notices.txt', { eager: true, query: '?raw' })
    const fonts = Object.keys(import.meta.glob('./assets/fonts/LICENSE-*.txt', { query: '?raw' }))
    expect(Object.keys(notices)).toHaveLength(1)
    expect(fonts.length).toBe(3)
    expect(licence).toContain('public/third-party-notices.txt')
    expect(licence).toContain('src/assets/fonts/LICENSE-*.txt')
  })
  it('grants no permission to run, copy, modify or redistribute, and does not forbid what GitHub allows', () => {
    expect(licence).toMatch(/no licence or permission is granted to use, copy, modify, redistribute/)
    expect(licence).toMatch(/viewing and forking the repository on GitHub/)
    expect(licence).not.toMatch(/private copy|machine learning|AI training/i)
  })
  it('is proprietary in package.json and the README says the same', () => {
    expect(pkg.license).toBe('UNLICENSED')
    expect(readme).toMatch(/Source-available, not open source/)
    expect(readme).toMatch(/Copyright \(c\) 2026 Nova Zandkarimi, all rights reserved/)
    expect(readme).toContain('(LICENSE)')
  })
})
