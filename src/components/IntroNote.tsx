import { useEffect, useRef, useState } from 'react'
import type { Level } from '../engine'
import { LEVEL_TITLES } from '../levelMeta'
import { formatWeight } from '../weight'

type Doodle = 'drag' | 'turn' | 'chaos' | 'limits' | 'lock' | 'perfect'
export interface IntroPage {
  title: string
  lines: string[]
  doodle: Doodle
}

/** The how-to-play notes for a level, written from the level's own numbers so they can never disagree with the rules. */
export function introPages(level: Level): IntroPage[] {
  const allowance = level.weightLimit !== undefined ? formatWeight(level.weightLimit) : ''
  if (level.target === undefined) {
    // Level 1: the familiar pack-everything rule, plus the first look at Chaos (it only counts up; nothing to reach).
    return [
      { title: 'Pack it all.', lines: ['Drag each item into the suitcase.', 'Green means it fits. Red means it doesn’t.'], doodle: 'drag' },
      { title: 'Turn things.', lines: ['Press R (or Rotate) to turn an item.', 'Everything has to fit. Yes, even the jeans.'], doodle: 'turn' },
      { title: 'Packing makes Chaos.', lines: ['Every item carries a stamped Chaos number.', 'Watch your total climb. No target yet.'], doodle: 'chaos' },
    ]
  }
  const mandatory = level.items.filter((i) => i.required)
  if (mandatory.length) {
    // Later levels only need the new rule; Chaos was explained on Levels 1 and 2.
    return [
      { title: 'Baggage you can’t leave.', lines: ['Items stamped MUST always come.', 'They take their space and weight first.'], doodle: 'lock' },
      { title: 'Then collect Chaos.', lines: [`Reach ${level.target} Chaos within ${allowance}.`, `A perfect pack is ${level.perfect}.`], doodle: 'chaos' },
    ]
  }
  return [
    { title: 'Now you choose.', lines: ['Nothing is mandatory.', `Pack ${level.target} Chaos to win.`], doodle: 'chaos' },
    { title: 'Mind the limits.', lines: [`Weight limit: ${allowance}.`, 'The suitcase is only so big. Rotate to squeeze things in.'], doodle: 'limits' },
    { title: 'Want it perfect?', lines: [`Perfect is ${level.perfect} Chaos.`, 'Full but short? Swap something for a more chaotic item.'], doodle: 'perfect' },
  ]
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function DoodleArt({ kind }: { kind: Doodle }) {
  return (
    <svg className="note-doodle" viewBox="0 0 90 56" width="90" height="56" aria-hidden="true" focusable="false">
      {kind === 'drag' && <path {...stroke} d="M6 44C22 40 34 24 52 18M52 18l-12 0M52 18l-4 11M60 40h22v-14h-22z" />}
      {kind === 'turn' && <path {...stroke} d="M64 14a22 22 0 1 0 8 22M64 14l9-8M64 14l10 6" />}
      {kind === 'chaos' && <path {...stroke} d="M45 28c0-6 8-6 8 0s-14 6-14-4 20-14 20 4-26 24-30 0M72 8l3 7 7 2-7 3-3 7-3-7-7-3 7-2z" />}
      {kind === 'limits' && <path {...stroke} d="M12 46h66M45 46V22M20 22h50M20 22l-8 14h16zM70 22l-8 14h16z" />}
      {kind === 'lock' && <path {...stroke} d="M26 26h38v24H26zM33 26v-8a12 12 0 0 1 24 0v8M45 36v6" />}
      {kind === 'perfect' && <path {...stroke} d="M45 6l9 18 20 3-14 14 3 20-18-10-18 10 3-20-14-14 20-3z" transform="scale(.8) translate(12 -2)" />}
    </svg>
  )
}

interface Props {
  level: Level
  onClose: () => void
}

/**
 * A handwritten note pinned to the table (not a modal): two or three short pages, Skip / Back / Next, Escape skips.
 * Focus starts on the primary button; the paper animations switch off for reduced motion (see styles.css).
 */
export default function IntroNote({ level, onClose }: Props) {
  const pages = introPages(level)
  const [index, setIndex] = useState(0)
  const nextRef = useRef<HTMLButtonElement>(null)
  const page = pages[index]
  const last = index === pages.length - 1
  useEffect(() => nextRef.current?.focus(), [])
  const go = (i: number) => setIndex(Math.max(0, Math.min(pages.length - 1, i)))
  return (
    <section
      className="intro-note"
      role="region"
      aria-label={`How to play Level ${Number(level.id)}: ${LEVEL_TITLES[level.id]}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose()
        } else if (e.key === 'ArrowRight') go(index + 1)
        else if (e.key === 'ArrowLeft') go(index - 1)
      }}
    >
      <span className="note-tape left" aria-hidden="true" />
      <span className="note-tape right" aria-hidden="true" />
      <p className="note-kicker">Level {Number(level.id)} · how to play</p>
      <div className="note-page" key={index} aria-live="polite">
        <h2>{page.title}</h2>
        <ul>
          {page.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <DoodleArt kind={page.doodle} />
      </div>
      <div className="note-foot">
        <span className="note-dots" aria-label={`Page ${index + 1} of ${pages.length}`}>
          {pages.map((_, i) => (
            <i key={i} className={i === index ? 'on' : ''} aria-hidden="true" />
          ))}
        </span>
        <button type="button" className="note-skip" onClick={onClose}>
          Skip
        </button>
        {index > 0 && (
          <button type="button" className="note-back" onClick={() => go(index - 1)}>
            Back
          </button>
        )}
        <button type="button" className="note-next" ref={nextRef} onClick={() => (last ? onClose() : go(index + 1))}>
          {last ? 'Let’s pack' : 'Next'}
        </button>
      </div>
    </section>
  )
}
