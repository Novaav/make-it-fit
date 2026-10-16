import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { loadLevels } from '../engine'
import { ItemArt } from './ItemArt'

const level = loadLevels().find((l) => l.id === '01')!
const html = (id: string, orientation: 0 | 1 | 2 | 3 = 0) => renderToStaticMarkup(<ItemArt item={level.items.find((i) => i.id === id)!} orientation={orientation} />)

describe('illustrated items', () => {
  it('clip to the occupied cells with shapes only (a <g> inside <clipPath> is invalid and clips everything away)', () => {
    for (const id of ['shirt', 'jeans', 'charger', 'toiletries', 'shoes']) {
      const markup = html(id)
      const clip = /<clipPath[^>]*>(.*?)<\/clipPath>/.exec(markup)
      expect(clip, `${id}: has a clipPath`).not.toBeNull()
      expect(clip![1]).not.toContain('<g')
      expect(clip![1]).toContain('<rect')
      expect(markup).toContain('clip-path="url(#')
    }
  })

  it('rotates the clip with the item and keeps ids unique per instance', () => {
    expect(html('jeans', 1)).toMatch(/<clipPath[^>]* transform="translate\(0 6\) rotate\(-90\)"/)
    const ids = (markup: string) => [...markup.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
    const both = renderToStaticMarkup(
      <>
        <ItemArt item={level.items.find((i) => i.id === 'shirt')!} orientation={0} />
        <ItemArt item={level.items.find((i) => i.id === 'shirt')!} orientation={0} />
      </>,
    )
    const all = ids(both)
    expect(new Set(all).size).toBe(all.length)
  })

  it('keeps the light overlay only on painted pixels (alpha mask), so empty parts of a cell stay clear', () => {
    const markup = html('charger')
    expect(markup).toContain('<mask')
    expect(markup).toContain('mask="url(#')
  })
})

describe('Level 2 artwork', () => {
  const level2 = loadLevels().find((l) => l.id === '02')!
  it('every Level 2 item is illustrated (no placeholder) and clips to its cells at every rotation', () => {
    for (const item of level2.items) {
      for (const o of [0, 1, 2, 3] as const) {
        const markup = renderToStaticMarkup(<ItemArt item={item} orientation={o} />)
        expect(markup, `${item.id} @ ${o}`).not.toContain('placeholder art')
        expect(markup, `${item.id} @ ${o}`).toContain('clip-path="url(#')
        const clip = /<clipPath[^>]*>(.*?)<\/clipPath>/.exec(markup)
        expect(clip![1]).not.toContain('<g')
      }
    }
  })
})
