import { useEffect, useRef, useState } from 'react'
import type { Level } from '../engine'
import { LEVEL_TITLES } from '../levelMeta'
import { sound } from '../sound'

export interface IntroPage {
  title: string
  lines: string[]
}

/**
 * The how-to-play notes for a level. They say only what the objective card does not (it already states the goal, the
 * target and the allowance): Level 1 packing, turning and Chaos; Level 2 choosing; Level 3 mandatory items.
 */
export function introPages(level: Level): IntroPage[] {
  if (level.target === undefined) {
    return [
      { title: 'Drag and turn.', lines: ['Drag each item into the suitcase.', 'Press R to turn what won’t fit.'] },
      { title: 'Packing makes Chaos.', lines: ['Every item carries a stamped Chaos number.', 'Watch your total climb. No target yet.'] },
    ]
  }
  if (level.items.some((i) => i.required)) {
    return [{ title: 'Baggage you can’t leave.', lines: ['Items stamped MUST always come.', 'They take their space and weight first.'] }]
  }
  return [
    { title: 'Now you choose.', lines: ['Nothing is mandatory.', 'Heavy things may not be worth it.'] },
    { title: 'Short of the target?', lines: ['Swap an item for a more chaotic one.', 'Turning things squeezes in more.'] },
  ]
}

interface Props {
  level: Level
  onClose: () => void
}

/**
 * A handwritten note pinned to the table (not a modal): one or two short pages, Skip / Back / Next (Got it on the last page), Escape skips.
 * Focus starts on the primary button; the paper animations switch off for reduced motion (see styles.css).
 */
export default function IntroNote({ level, onClose }: Props) {
  const pages = introPages(level)
  const [index, setIndex] = useState(0)
  const nextRef = useRef<HTMLButtonElement>(null)
  const page = pages[index]
  const last = index === pages.length - 1
  useEffect(() => nextRef.current?.focus(), [])
  // Escape also works when nothing else has focus (for example right after clicking the table)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && (document.activeElement === document.body || document.activeElement === null)) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  // a page turn sounds only when the page really changes (Next, Back or an arrow key)
  const go = (i: number) => {
    const target = Math.max(0, Math.min(pages.length - 1, i))
    if (target === index) return
    sound.play('paper')
    setIndex(target)
  }
  const finish = () => {
    sound.play('click')
    onClose()
  }
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
      </div>
      <div className="note-foot">
        {pages.length > 1 && (
          <span className="note-dots" aria-label={`Page ${index + 1} of ${pages.length}`}>
            {pages.map((_, i) => (
              <i key={i} className={i === index ? 'on' : ''} aria-hidden="true" />
            ))}
          </span>
        )}
        {!last && (
          <button type="button" className="note-skip" onClick={finish}>
            Skip
          </button>
        )}
        {index > 0 && (
          <button type="button" className="note-back" onClick={() => go(index - 1)}>
            Back
          </button>
        )}
        <button type="button" className="note-next" ref={nextRef} onClick={() => (last ? finish() : go(index + 1))}>
          {last ? 'Got it' : 'Next'}
        </button>
      </div>
    </section>
  )
}
