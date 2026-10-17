import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { Level } from '../engine'
import { LEVEL_TITLES } from '../levelMeta'
import { placeNote, type Avoid } from '../ui/notePlacement'

type Doodle = 'drag' | 'turn' | 'chaos' | 'limits' | 'lock' | 'perfect'
export interface IntroPage {
  title: string
  lines: string[]
  doodle: Doodle
}

/**
 * The how-to-play notes for a level. They say only what the objective card does not (it already states the goal, the
 * target and the allowance): Level 1 packing, turning and Chaos; Level 2 choosing; Level 3 mandatory items.
 */
export function introPages(level: Level): IntroPage[] {
  if (level.target === undefined) {
    return [
      { title: 'Drag and turn.', lines: ['Drag each item into the suitcase.', 'Press R to turn what won’t fit.'], doodle: 'drag' },
      { title: 'Packing makes Chaos.', lines: ['Every item carries a stamped Chaos number.', 'Watch your total climb. No target yet.'], doodle: 'chaos' },
    ]
  }
  if (level.items.some((i) => i.required)) {
    return [{ title: 'Baggage you can’t leave.', lines: ['Items stamped MUST always come.', 'They take their space and weight first.'], doodle: 'lock' }]
  }
  return [
    { title: 'Now you choose.', lines: ['Nothing is mandatory.', 'Heavy things may not be worth it.'], doodle: 'chaos' },
    { title: 'Short of the target?', lines: ['Swap an item for a more chaotic one.', 'Turning things squeezes in more.'], doodle: 'perfect' },
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
 * A handwritten note pinned to the table (not a modal): one or two short pages, Skip / Back / Next (Got it on the last page), Escape skips.
 * Focus starts on the primary button; the paper animations switch off for reduced motion (see styles.css).
 */
export default function IntroNote({ level, onClose }: Props) {
  const pages = introPages(level)
  const [index, setIndex] = useState(0)
  const nextRef = useRef<HTMLButtonElement>(null)
  const noteRef = useRef<HTMLElement>(null)
  // Pinned where it covers the least: never the suitcase or the tool buttons if there is anywhere else, the tray last.
  const [spot, setSpot] = useState<CSSProperties | undefined>(undefined)
  const page = pages[index]
  const last = index === pages.length - 1
  useEffect(() => nextRef.current?.focus(), [])
  useLayoutEffect(() => {
    const el = noteRef.current
    if (!el) return
    let frame = 0
    const place = () => {
      frame = 0
      const rect = (e: Element, weight: number): Avoid | null => {
        const r = e.getBoundingClientRect()
        return r.width > 0 && r.height > 0 ? { box: { left: r.left, top: r.top, width: r.width, height: r.height }, weight } : null
      }
      const avoid = [
        ...[...document.querySelectorAll('.masthead, .board')].map((e) => rect(e, 20)),
        ...[...document.querySelectorAll('.objective')].map((e) => rect(e, 2)),
        ...[...document.querySelectorAll('.toolbar')].map((e) => rect(e, 20)),
        ...[...document.querySelectorAll('.piece.in-tray')].map((e) => rect(e, 1)),
      ].filter((a): a is Avoid => a !== null)
      const width = Math.min(330, window.innerWidth - (window.innerWidth <= 760 ? 16 : 24))
      el.style.width = `${width}px`
      const p = placeNote({ width: window.innerWidth, height: window.innerHeight }, { width, height: el.offsetHeight }, avoid, 8)
      setSpot({ left: p.left, top: p.top, right: 'auto', bottom: 'auto', width })
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place)
    }
    place()
    // the table can still be settling (fonts, the chosen arrangement): follow its size for as long as the note is open
    const watched = [...document.querySelectorAll('.level, .board, .toolbar')]
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    watched.forEach((e) => observer?.observe(e))
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [index])
  const go = (i: number) => setIndex(Math.max(0, Math.min(pages.length - 1, i)))
  return (
    <section
      ref={noteRef}
      className="intro-note"
      style={spot}
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
        {pages.length > 1 && (
          <span className="note-dots" aria-label={`Page ${index + 1} of ${pages.length}`}>
            {pages.map((_, i) => (
              <i key={i} className={i === index ? 'on' : ''} aria-hidden="true" />
            ))}
          </span>
        )}
        {!last && (
          <button type="button" className="note-skip" onClick={onClose}>
            Skip
          </button>
        )}
        {index > 0 && (
          <button type="button" className="note-back" onClick={() => go(index - 1)}>
            Back
          </button>
        )}
        <button type="button" className="note-next" ref={nextRef} onClick={() => (last ? onClose() : go(index + 1))}>
          {last ? 'Got it' : 'Next'}
        </button>
      </div>
    </section>
  )
}
