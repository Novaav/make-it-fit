import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  clampOrigin,
  commitPlacement,
  createGame,
  isOverWeight,
  isWon,
  isPerfect,
  totalChaos,
  totalWeight,
  itemBounds,
  previewPlacement,
  remove,
  reset,
  rotatePlaced,
  undo,
  type ActionResult,
  type GameState,
  type Level,
  type Orientation,
  type Placement,
  place,
} from './engine'
import { ItemArt } from './components/ItemArt'
import { WeightLabel, hasLabelZone } from './art/WeightLabel'
import { dragTarget, sameTarget, type DragGeometry } from './ui/drag'
import { TRAY_LAYOUTS } from './ui/trayLayout'
import { sound } from './sound'
import { chooseArrangement } from './ui/fit'
import { useViewport } from './ui/useViewport'
import TableProps from './components/TableProps'
import { ChaosBadge } from './components/ChaosBadge'
import PerfectFlourish from './components/PerfectFlourish'
import PerfectSeal from './components/PerfectSeal'
import IntroNote from './components/IntroNote'
import { LEVEL_TITLES } from './levelMeta'
import { failureMessage, itemName, reasonText, itemSummary, scoreAnnouncement, statusNote, weightChipAnchor } from './status'
import { formatLoad, formatWeight } from './weight'
import { restoreGame, snapshot, type SavedBoard } from './boards'

const name = itemName

type Source = 'tray' | 'board'
interface Carry {
  itemId: string
  orientation: Orientation
  x: number
  y: number
  source: Source
  mode: 'pointer' | 'keyboard'
  /** Pointer drags only (updated when the target cell or flags change, never per pointer move). */
  snapped: boolean
  overTray: boolean
}
interface Pending {
  itemId: string
  source: Source
  sx: number
  sy: number
}

interface Props {
  level: Level
  /** Called whenever the current pack is a win, with its Chaos and whether it is perfect. */
  onWin: (chaos: number, perfect: boolean) => void
  /** Development only: a win reached through a dev fill counts as a session-only test completion (never saved). */
  onTestWin?: () => void
  /** Offered on the completion card when there is a next playable level. */
  onNext?: () => void
  /** True when no level follows this one. */
  isLast?: boolean
  /** Development builds only: replace the board with these placements (undoable step by step). */
  devFill?: { nonce: number; placements: readonly Placement[] }
  /** The saved arrangement for this level, if any. Only a starting point: it is replayed through the engine. */
  saved?: SavedBoard
  /** Called with the new arrangement after the player changes it (never for a restore). */
  onBoardChange?: (board: SavedBoard) => void
  /** A dev fill is applied once; this tells the app to forget it so a remount can never apply it again. */
  onDevFillUsed?: () => void
  /** The how-to-play note: shown on a first visit (`open`), replayable from the objective. */
  /** `replay` is true when the player asked for the note again; a first-visit note steps aside when they start playing. */
  intro?: { open: boolean; replay?: boolean; /** a first-visit note that has not been seen yet (it may still be waiting for the entrance) */ pending?: boolean; onOpen: () => void; onClose: () => void }
}

export default function LevelPlay({ level: LEVEL, onWin, onTestWin, onNext, isLast, devFill, saved, onBoardChange, onDevFillUsed, intro }: Props) {
  const viewport = useViewport()
  const arrangement = useMemo(() => chooseArrangement(LEVEL, TRAY_LAYOUTS[LEVEL.id], viewport), [LEVEL, viewport])
  const layout = arrangement.layout
  const [game, setGame] = useState<GameState>(() => restoreGame(LEVEL, saved))
  const [carry, setCarryState] = useState<Carry | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [trayTurns, setTrayTurns] = useState<Record<string, Orientation>>({})
  const [message, setMessage] = useState('')

  const boardRef = useRef<HTMLDivElement>(null)
  const levelRef = useRef<HTMLDivElement>(null)
  const trayRef = useRef<HTMLDivElement>(null)
  const pending = useRef<Pending | null>(null)
  // Pointer drag pipeline: the latest pointer position and the single scheduled frame live in refs, so pointer
  // moves cost no React render; React is told only when the snap target or flags change. Layout is measured at
  // most once per frame (and on pointer-up), never per raw pointer event, and never cached across frames, so
  // scrolling, resizing or a text change that shifts the board can never leave the snap target stale.
  const pointerPos = useRef({ x: 0, y: 0 })
  const frame = useRef(0)
  // The ONE element that shows the carried item for the whole drag (tray -> board -> drop). It is positioned only
  // through `transform` (see placeCarried), so the browser moves a single compositor layer and never repaints a
  // stale copy at an earlier position.
  const carriedRef = useRef<HTMLDivElement | null>(null)
  const focusAfter = useRef<string | null>(null)
  const devTainted = useRef(false)
  // A level that comes back already packed (restored) is not a new achievement: no dialog, no fanfare.
  const celebrated = useRef(isWon(game))
  const celebratedPerfect = useRef(isPerfect(game))
  const [dialogKind, setDialogKind] = useState<'normal' | 'perfect'>(isPerfect(game) ? 'perfect' : 'normal')
  const replayRef = useRef<HTMLButtonElement>(null)
  const dialogOpenRef = useRef(false)
  const returnFocus = useRef<HTMLElement | null>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const [dialogOpen, setDialogOpenState] = useState(false)
  const gameRef = useRef(game)
  const carryRef = useRef<Carry | null>(null)
  const selectedRef = useRef<string | null>(null)
  const trayTurnsRef = useRef(trayTurns)
  gameRef.current = game
  selectedRef.current = selected
  trayTurnsRef.current = trayTurns

  const setCarry = (c: Carry | null) => {
    carryRef.current = c
    setCarryState(c)
  }

  const placementOf = (id: string) => gameRef.current.placements.find((p) => p.itemId === id)
  const orientationOf = (id: string): Orientation => placementOf(id)?.orientation ?? trayTurnsRef.current[id] ?? 0

  const apply = (result: ActionResult, ok: string) => {
    if (result.ok) {
      setGame(result.state)
      setMessage(ok + scoreAnnouncement(result.state))
    } else setMessage(failureMessage(result.error))
    return result.ok
  }

  const measure = (): DragGeometry => ({
    board: boardRef.current!.getBoundingClientRect(),
    tray: trayRef.current!.getBoundingClientRect(),
    cols: LEVEL.width,
    rows: LEVEL.height,
  })

  /** Recompute the snap target for a pointer position against freshly measured layout. */
  const retarget = (c: Carry, px: number, py: number, g: DragGeometry = measure()): Carry => {
    const b = itemBounds(LEVEL, c.itemId, c.orientation)
    return { ...c, ...dragTarget(g, px, py, b.width, b.height, c.source === 'board') }
  }

  /**
   * Put the carried item where it belongs, in viewport coordinates, straight in the DOM: snapped to its board cell
   * (pointer over the board, or keyboard mode) or centred under the pointer. Only `transform` ever changes.
   */
  const placeCarried = (g: DragGeometry = measure()) => {
    const el = carriedRef.current
    const c = carryRef.current
    if (!el || !c) return
    const cell = g.board.width / g.cols
    const snapped = c.mode === 'keyboard' || c.snapped
    let x: number
    let y: number
    if (snapped) {
      x = g.board.left + c.x * cell
      y = g.board.top + c.y * cell
    } else {
      const b = itemBounds(LEVEL, c.itemId, c.orientation)
      x = pointerPos.current.x - (b.width * cell) / 2
      y = pointerPos.current.y - (b.height * cell) / 2
    }
    el.classList.toggle('snapped', snapped) // before the transform, so leaving the board never glides
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  const cancelFrame = () => {
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = 0
  }

  /** Apply the latest pointer position: move the carried item in the DOM; commit React state only if the target changed. */
  const flushPointer = () => {
    frame.current = 0
    const c = carryRef.current
    if (!c) return
    const g = measure()
    if (c.mode === 'pointer') {
      const next = retarget(c, pointerPos.current.x, pointerPos.current.y, g)
      if (!sameTarget(c, next)) setCarry(next)
    }
    placeCarried(g)
  }

  const dropRemove = (id: string) => {
    const o = orientationOf(id)
    if (apply(remove(gameRef.current, id), `${name(id)} taken out.`)) {
      sound.play('remove')
      setTrayTurns((t) => ({ ...t, [id]: o }))
    }
    setSelected(null)
  }

  const rotateCarry = () => {
    const c = carryRef.current!
    const orientation = ((c.orientation + 1) % 4) as Orientation
    const turned = { ...c, orientation }
    sound.play('rotate')
    if (c.mode === 'pointer') setCarry(retarget(turned, pointerPos.current.x, pointerPos.current.y))
    else setCarry({ ...turned, ...clampOrigin(LEVEL, c.itemId, orientation, c.x, c.y) })
  }

  const rotateSelected = (id: string | null) => {
    dismissNote()
    if (carryRef.current) return rotateCarry()
    if (!id) return setMessage('Select an item first, then rotate it.')
    if (placementOf(id)) sound.play(apply(rotatePlaced(gameRef.current, id), `${name(id)} rotated.`) ? 'rotate' : 'invalid')
    else {
      sound.play('rotate')
      setTrayTurns((t) => ({ ...t, [id]: (((t[id] ?? 0) + 1) % 4) as Orientation }))
      setMessage(`${name(id)} rotated.`)
    }
  }

  const commitCarry = (c: Carry) => {
    const pv = previewPlacement(gameRef.current, c.itemId, c.orientation, c.x, c.y)
    if (pv.error) {
      setMessage(`${name(c.itemId)} doesn't fit there: ${reasonText(pv.error)}.`)
      sound.play('invalid')
      return false
    }
    apply(commitPlacement(gameRef.current, pv.placement), `${name(c.itemId)} packed.`)
    sound.play('place')
    return true
  }

  const setDialogOpen = (open: boolean) => {
    dialogOpenRef.current = open
    setDialogOpenState(open)
  }
  const closeDialog = () => {
    setDialogOpen(false)
    const target = returnFocus.current
    returnFocus.current = null
    ;(target && target !== document.body && document.contains(target) ? target : document.querySelector<HTMLElement>('.toolbar button:not(:disabled)'))?.focus()
  }
  const dialogKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      closeDialog()
    } else if (e.key === 'Tab') {
      const buttons = [...e.currentTarget.querySelectorAll<HTMLElement>('button')]
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const doReset = () => {
    devTainted.current = false
    celebrated.current = false
    celebratedPerfect.current = false
    setDialogOpen(false)
    setGame(reset(gameRef.current))
    setSelected(null)
    setTrayTurns({})
    setMessage('Suitcase emptied.')
  }

  const doUndo = () => {
    if (apply(undo(gameRef.current), 'Undone.')) setSelected(null)
  }

  // A first-visit note steps aside as soon as the player starts playing (picks something up or turns it).
  const dismissNote = () => {
    if (intro && !intro.replay && (intro.open || intro.pending)) intro.onClose()
  }

  const startPointer = (e: ReactPointerEvent, itemId: string, source: Source) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dismissNote()
    sound.unlock()
    if (carryRef.current?.mode === 'keyboard') setCarry(null)
    pending.current = { itemId, source, sx: e.clientX, sy: e.clientY }
  }

  const pickUpWithKeyboard = (itemId: string, source: Source) => {
    dismissNote()
    sound.unlock()
    sound.play('pickup')
    const o = orientationOf(itemId)
    const p = placementOf(itemId)
    const b = itemBounds(LEVEL, itemId, o)
    const start = p ?? { x: Math.floor((LEVEL.width - b.width) / 2), y: Math.floor((LEVEL.height - b.height) / 2) }
    setSelected(itemId)
    setCarry({ itemId, orientation: o, x: start.x, y: start.y, source, mode: 'keyboard', snapped: true, overTray: false })
    setMessage(`${name(itemId)} picked up. Arrow keys move, R rotates, Enter places, Escape cancels.`)
    boardRef.current?.focus()
  }

  // Window-level handlers read only refs, so they are registered once and always see current state.
  const handlers = useRef({ move: (_e: PointerEvent) => {}, up: (_e: PointerEvent) => {}, key: (_e: KeyboardEvent) => {} })
  handlers.current = {
    move(e) {
      pointerPos.current = { x: e.clientX, y: e.clientY }
      const c = carryRef.current
      if (!c) {
        const p = pending.current
        if (!p || Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 6) return
        setSelected(p.itemId)
        sound.play('pickup')
        setCarry(
          retarget(
            { itemId: p.itemId, orientation: orientationOf(p.itemId), x: 0, y: 0, source: p.source, mode: 'pointer', snapped: false, overTray: false },
            e.clientX,
            e.clientY,
          ),
        )
      } else if (c.mode === 'pointer' && !frame.current) {
        frame.current = requestAnimationFrame(flushPointer)
      }
    },
    up(e) {
      const c = carryRef.current
      const p = pending.current
      pending.current = null
      if (c?.mode === 'pointer') {
        cancelFrame()
        // Same semantics as before: the origin comes from the last pointer move, the drop zone from the pointer-up position.
        const last = retarget(c, pointerPos.current.x, pointerPos.current.y)
        const drop = dragTarget(measure(), e.clientX, e.clientY, 1, 1, c.source === 'board')
        if (drop.overTray) dropRemove(c.itemId)
        else if (drop.snapped) commitCarry(last)
        setCarry(null)
      } else if (p) setSelected((s) => (s === p.itemId ? null : p.itemId))
    },
    key(e) {
      if (dialogOpenRef.current) {
        if (e.key === 'Escape') closeDialog()
        return
      }
      const c = carryRef.current
      const k = e.key
      if (c) {
        if (k === 'Escape') {
          e.preventDefault()
          focusAfter.current = c.mode === 'keyboard' ? c.itemId : null
          setCarry(null)
          setMessage('Cancelled.')
        } else if (k === 'r' || k === 'R') {
          e.preventDefault()
          rotateCarry()
        } else if (c.mode === 'keyboard') {
          const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k]
          if (d) {
            e.preventDefault()
            setCarry({ ...c, ...clampOrigin(LEVEL, c.itemId, c.orientation, c.x + d[0], c.y + d[1]) })
          } else if (k === 'Enter' || k === ' ') {
            e.preventDefault()
            if (commitCarry(c)) {
              focusAfter.current = c.itemId
              setCarry(null)
            }
          }
        }
        return
      }
      if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'z') {
        e.preventDefault()
        doUndo()
        return
      }
      const focused = (document.activeElement as HTMLElement | null)?.dataset?.item ?? null
      const target = focused ?? selectedRef.current
      if (!target) return
      if ((k === 'Delete' || k === 'Backspace') && placementOf(target)) {
        e.preventDefault()
        dropRemove(target)
      } else if (k === 'r' || k === 'R') rotateSelected(target)
    },
  }
  useEffect(() => {
    const move = (e: PointerEvent) => handlers.current.move(e)
    const up = (e: PointerEvent) => handlers.current.up(e)
    const cancel = () => {
      pending.current = null
      cancelFrame()
      if (carryRef.current?.mode === 'pointer') setCarry(null)
    }
    // Scrolling/resizing moves the board under a stationary pointer or keyboard cursor: re-place on the next frame.
    const relayout = () => {
      if (carryRef.current && !frame.current) frame.current = requestAnimationFrame(flushPointer)
    }
    const key = (e: KeyboardEvent) => handlers.current.key(e)
    const menu = (e: MouseEvent) => {
      if (carryRef.current?.mode === 'pointer') {
        e.preventDefault()
        rotateCarry()
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('keydown', key)
    window.addEventListener('contextmenu', menu)
    window.addEventListener('scroll', relayout, { capture: true, passive: true })
    window.addEventListener('resize', relayout)
    return () => {
      cancelFrame()
      window.removeEventListener('scroll', relayout, { capture: true })
      window.removeEventListener('resize', relayout)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('keydown', key)
      window.removeEventListener('contextmenu', menu)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (focusAfter.current && !carry) {
      document.querySelector<HTMLElement>(`[data-item="${focusAfter.current}"]`)?.focus()
      focusAfter.current = null
    }
  })

  // Tell the stylesheet how big the cells are so small screens drop microdetail (lod2 < 56 px, lod1 < 40 px).
  useEffect(() => {
    const board = boardRef.current
    const root = levelRef.current
    if (!board || !root) return
    const apply = () => {
      const cell = board.getBoundingClientRect().width / LEVEL.width
      root.dataset.cell = cell < 40 ? 'xs' : cell < 56 ? 'sm' : 'lg'
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(board)
    return () => ro.disconnect()
  }, [LEVEL.width])

  // Any change to the carried item (new cell, rotation, snapped flip, keyboard step) re-places it before paint.
  useLayoutEffect(() => {
    placeCarried()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carry])

  // Report every change the player makes (not the restore itself) so the app can keep and save the arrangement.
  const reported = useRef(game.placements)
  useEffect(() => {
    if (game.placements === reported.current) return
    reported.current = game.placements
    onBoardChange?.(snapshot(LEVEL, game.placements))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.placements])

  const won = isWon(game)
  const perfectNow = isPerfect(game)
  const chaos = totalChaos(game)
  // The flourish plays whenever the pack BECOMES perfect (also after taking something out and packing it back),
  // never for a restored perfect pack or a historical completion. Derived from the current arrangement only.
  const [spark, setSpark] = useState(false)
  const [wasPerfect, setWasPerfect] = useState(perfectNow)
  if (perfectNow !== wasPerfect) {
    setWasPerfect(perfectNow)
    setSpark(perfectNow)
  }
  useEffect(() => {
    if (!spark) return
    const t = window.setTimeout(() => setSpark(false), 1900)
    return () => window.clearTimeout(t)
  }, [spark])
  useEffect(() => {
    if (!won) return
    // Dev-tool fills must never write real progress.
    if (devTainted.current) onTestWin?.()
    else onWin(chaos, perfectNow)
    // At most one normal and one perfect completion dialog per visit; a restored winning pack opens none.
    const kind = perfectNow ? 'perfect' : 'normal'
    const shown = perfectNow ? celebratedPerfect : celebrated
    if (shown.current) return
    shown.current = true
    sound.play(perfectNow ? 'perfect' : 'complete')
    celebrated.current = true
    if (perfectNow) celebratedPerfect.current = true
    returnFocus.current = document.activeElement as HTMLElement | null
    setDialogKind(kind)
    // A perfect pack: the gold meter, its sheen, the gold ring and the sparkles all start at once; the boarding pass is
    // stamped a beat later (just as the sheen finishes), not after a long pause. With reduced motion there is no wait.
    const wait = perfectNow && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 420 : 0
    if (!wait) {
      setDialogOpen(true)
      return
    }
    const t = window.setTimeout(() => setDialogOpen(true), wait)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won, chaos, perfectNow])

  useEffect(() => {
    if (dialogOpen) primaryRef.current?.focus()
  }, [dialogOpen])

  const devNonce = devFill?.nonce
  useEffect(() => {
    if (!devFill) return
    devTainted.current = true
    let next = createGame(LEVEL)
    for (const p of devFill.placements) {
      const r = place(next, p)
      if (r.ok) next = r.state
    }
    setGame(next)
    setSelected(null)
    setMessage('Dev: solution loaded.')
    onDevFillUsed?.() // consumed: returning to this level later must never re-apply it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devNonce])

  // ---- render ----
  const placedIds = new Set(game.placements.map((p) => p.itemId))
  const snapped = !!carry && (carry.mode === 'keyboard' || carry.snapped)
  const preview = carry ? previewPlacement(game, carry.itemId, carry.orientation, carry.x, carry.y) : null
  const cellState = new Map<string, 'valid' | 'invalid'>()
  if (snapped && preview) {
    for (const c of preview.cells) {
      if (c.x >= 0 && c.y >= 0 && c.x < LEVEL.width && c.y < LEVEL.height) cellState.set(`${c.x},${c.y}`, preview.error ? 'invalid' : 'valid')
    }
  }
  const required = LEVEL.items.filter((i) => i.required)
  const packedCount = required.filter((i) => placedIds.has(i.id)).length
  const limit = LEVEL.weightLimit
  const weight = totalWeight(game)
  const overWeight = isOverWeight(game)
  const solved = isWon(game)
  // Chaos is shown on every item from Level 1; only Levels 2-3 have a Chaos target (Level 1 is still won by packing all five).
  const scored = LEVEL.items.some((i) => i.chaos > 0)
  const hasChaos = LEVEL.target !== undefined
  const target = LEVEL.target ?? 0
  const perfectScore = LEVEL.perfect ?? 0
  const mandatoryNames = required.map((i) => name(i.id))
  const goalText = !hasChaos
    ? `Fit all ${required.length} items into the suitcase. Green = fits, red = doesn't.`
    : `${required.length ? `${mandatoryNames.join(' and ')} must come. Then reach` : 'Reach'} ${target} Chaos within ${formatWeight(limit ?? 0)}.${required.length ? '' : ` Perfect: ${perfectScore}.`}`
  const liveHint =
    carry && snapped && preview
      ? preview.error
        ? `Red — ${reasonText(preview.error)}.`
        : 'Green — it fits here.'
      : null
  const overTray = !!carry && carry.mode === 'pointer' && carry.overTray
  const selectedPlaced = !!selected && placedIds.has(selected)

  const pieceVars = (itemId: string, o: Orientation) => {
    const b = itemBounds(LEVEL, itemId, o)
    return { '--cw': b.width, '--ch': b.height } as React.CSSProperties
  }
  const itemById = (id: string) => LEVEL.items.find((i) => i.id === id)!
  const chips = (id: string, o: Orientation, room = '0px') => {
    const item = itemById(id)
    const badge = scored ? <ChaosBadge item={item} orientation={o} /> : null
    if (limit === undefined) return badge
    // Redrawn items print the weight on a label zone built into the illustration; others still use a chip.
    if (hasLabelZone(id))
      return (
        <>
          {badge}
          <WeightLabel item={item} orientation={o} grams={item.weight} />
        </>
      )
    const anchor = weightChipAnchor(item, o)
    return (
      <>
        {badge}
        <span
          className="chip-w"
          data-weight={item.weight}
          style={{ '--chip-x': anchor.x + 1, '--chip-y': anchor.y + 1, '--chip-room': room } as React.CSSProperties}
          aria-hidden="true"
        >
          {formatWeight(item.weight)}
        </span>
      </>
    )
  }
  const describe = (id: string) => itemSummary(LEVEL, itemById(id))

  // What the info line shows: the item being carried, else the one under the mouse, else the focused one, else the selected one.
  const infoId = carry?.itemId ?? hoverId ?? focusId ?? selected
  const infoItem = infoId ? itemById(infoId) : null
  const infoHandlers = (id: string) => ({
    onPointerEnter: (e: ReactPointerEvent) => {
      if (e.pointerType === 'mouse' && !carryRef.current) setHoverId(id)
    },
    onPointerLeave: () => setHoverId(null),
    onFocus: () => setFocusId(id),
    onBlur: () => setFocusId((f) => (f === id ? null : f)),
  })
  const note = statusNote(game)

  return (
    <div
      className="level"
      ref={levelRef}
      style={
        {
          '--cols': LEVEL.width,
          '--rows': LEVEL.height,
          '--tcols': layout.cols,
          '--trows': layout.rows,
          '--cell': `${arrangement.cell}px`,
        } as React.CSSProperties
      }
      data-level={LEVEL.id}
      data-arrange={arrangement.mode}
    >
      <TableProps />
      <main className="stage">
        <section className="case-wrap" aria-label={`Level ${Number(LEVEL.id)} suitcase`}>
          <section className={`objective${solved ? ' solved' : ''}`} aria-label="Objective">
          {intro?.open && (
            <IntroNote
              level={LEVEL}
              onClose={() => {
                intro.onClose()
                requestAnimationFrame(() => replayRef.current?.focus())
              }}
            />
          )}
            <p className="level-title">
              Level {Number(LEVEL.id)} · {LEVEL_TITLES[LEVEL.id]}
              {intro && (
                <button type="button" className="note-replay" ref={replayRef} onClick={intro.onOpen} aria-label="How to play (replay the instructions)">
                  <span className="note-replay-long">How to play</span>
                  <span className="note-replay-short" aria-hidden="true">?</span>
                </button>
              )}
            </p>
            <p className="goal-line" aria-live="off">
              {solved ? (
                <>
                  <b>✓ Packed!</b> {hasChaos ? (perfectNow ? `Maximum Chaos: ${chaos}!` : `${chaos} Chaos. Perfect is ${perfectScore}.`) : ''}
                </>
              ) : (
                liveHint ?? goalText
              )}
            </p>
            <div className="pills">
              {hasChaos && (
                <span className={`pill chaos${solved ? ' ok' : ''}${perfectNow ? ' max' : ''}${spark ? ' spark' : ''}`}>
                  <span className="pill-label">Chaos</span>
                  <b>{chaos}</b>
                  <span className="of">of {target} to win</span>
                  <span
                    className="chaos-bar"
                    role="meter"
                    aria-label="Chaos"
                    aria-valuemin={0}
                    aria-valuemax={perfectScore}
                    aria-valuenow={chaos}
                    aria-valuetext={`${chaos} Chaos. ${target} wins, ${perfectScore} is perfect.`}
                  >
                    <span className="fill" style={{ width: `${Math.min(100, (chaos / perfectScore) * 100)}%` }} />
                    {perfectNow && <span className="sheen" aria-hidden="true" />}
                    <i className="tick win" style={{ left: `${(target / perfectScore) * 100}%` }} aria-hidden="true" />
                  </span>
                  <span className="of perfect">{perfectNow ? '★ perfect' : `perfect ${perfectScore}`}</span>
                </span>
              )}
              {required.length > 0 && (
                <span className={`pill${packedCount === required.length ? ' ok' : ''}`}>
                  <span className="pill-label">{hasChaos ? 'Must pack' : 'Required'}</span>
                  <b>{packedCount}/{required.length}</b>
                  {packedCount === required.length && <span aria-hidden="true">✓</span>}
                </span>
              )}
              {scored && !hasChaos && (
                <span className="pill chaos plain">
                  <span className="pill-label">Chaos</span>
                  <b>{chaos}</b>
                </span>
              )}
              {limit !== undefined && (
                <span className={`pill weight${overWeight ? ' over' : ''}`} title={`Packing allowance: ${formatWeight(limit)}`}>
                  <span className="pill-label">Weight</span>
                  <b>{formatLoad(weight)}/{formatWeight(limit)}</b>
                  <span
                    className="mini-bar"
                    role="meter"
                    aria-label={`Packing allowance: ${formatWeight(limit)}`}
                    aria-valuemin={0}
                    aria-valuemax={limit / 1000}
                    aria-valuenow={weight / 1000}
                    aria-valuetext={`${formatWeight(weight)} packed of ${formatWeight(limit)}`}
                  >
                    <span style={{ width: `${Math.min(100, (weight / limit) * 100)}%` }} />
                  </span>
                  {!overWeight && <span className="of">{formatWeight(limit - weight)} left</span>}
                </span>
              )}
              {solved && (
                <button type="button" className="pill-action" onClick={onNext ?? doReset}>
                  {onNext ? 'Next level →' : 'Play again'}
                </button>
              )}
            </div>
            <p className={`over-note${overWeight ? ' on' : note ? ' missing' : ''}`} role="status">
              {note}
            </p>
          </section>
          <div className="case-stick">
          <p className="case-strip" aria-hidden="true">
            {hasChaos ? <span>Chaos {chaos}/{target}</span> : <span>Packed {packedCount}/{required.length}{scored && ` · Chaos ${chaos}`}</span>}
            {limit !== undefined && <span className={overWeight ? 'over' : ''}>{formatLoad(weight)}/{formatWeight(limit)}</span>}
          </p>
          <div className={`suitcase${overWeight ? ' strain' : ''}`}>
            <div className="handle" aria-hidden="true" />
            <span className="hw corner tl" aria-hidden="true" />
            <span className="hw corner tr" aria-hidden="true" />
            <span className="hw corner bl" aria-hidden="true" />
            <span className="hw corner br" aria-hidden="true" />
            <span className="hw latch l" aria-hidden="true" />
            <span className="hw latch r" aria-hidden="true" />
            {spark && <PerfectFlourish />}
            <div
              ref={boardRef}
              className={`board${carry?.mode === 'keyboard' ? ' keyboard-active' : ''}`}
              tabIndex={-1}
              role="group"
              aria-label={`Packing area, ${LEVEL.width} columns by ${LEVEL.height} rows`}
            >
              {game.placements.map((p) => {
                const o = p.orientation
                return (
                  <button
                    key={p.itemId}
                    type="button"
                    className={`piece on-board${selected === p.itemId ? ' selected' : ''}${carry?.itemId === p.itemId ? ' lifted' : ''}`}
                    style={{ ...pieceVars(p.itemId, o), '--x': p.x, '--y': p.y } as React.CSSProperties}
                    data-item={p.itemId}
                    aria-label={`${name(p.itemId)}, packed at column ${p.x + 1}, row ${p.y + 1}.${describe(p.itemId)} Enter to move, R to rotate, Delete to take out.`}
                    {...infoHandlers(p.itemId)}
                    onPointerDown={(e) => startPointer(e, p.itemId, 'board')}
                    onClick={(e) => e.detail === 0 && pickUpWithKeyboard(p.itemId, 'board')}
                  >
                    <ItemArt item={itemById(p.itemId)} orientation={o} />
                    {chips(p.itemId, o, `calc(var(--cell) * ${p.x} + 26px)`)}
                  </button>
                )
              })}
              {carry && (
                <div
                  ref={carriedRef}
                  className={`carried${snapped ? ` snapped ${preview?.error ? 'bad' : 'good'}` : ''}`}
                  data-carrying={carry.itemId}
                  aria-hidden="true"
                  style={{
                    width: `calc(var(--cell) * ${itemBounds(LEVEL, carry.itemId, carry.orientation).width})`,
                    height: `calc(var(--cell) * ${itemBounds(LEVEL, carry.itemId, carry.orientation).height})`,
                  }}
                >
                  <ItemArt item={itemById(carry.itemId)} orientation={carry.orientation} />
                </div>
              )}
              <div className="cells" aria-hidden="true">
                {Array.from({ length: LEVEL.width * LEVEL.height }, (_, i) => {
                  const x = i % LEVEL.width
                  const y = Math.floor(i / LEVEL.width)
                  return <div key={i} className={`cell ${cellState.get(`${x},${y}`) ?? ''}`} />
                })}
              </div>
            </div>
          </div>
          <p className={`item-info${infoItem ? '' : ' idle'}`} aria-hidden="true">
            {infoItem ? (
              <>
                <b>{name(infoItem.id)}</b>
                {limit !== undefined && <span>{formatWeight(infoItem.weight)}</span>}
                <span className={infoItem.required ? 'req' : 'opt'}>{infoItem.required && infoItem.chaos === 0 ? (hasChaos ? 'Mandatory' : 'Required') : `Chaos ${infoItem.chaos}`}</span>
              </>
            ) : (
              'Hover, tap or focus an item to see what it is.'
            )}
          </p>
          </div>
        </section>

        <aside className="side">
          <div ref={trayRef} className={`tray${overTray ? ' drop-remove' : ''}`} aria-label="Items to pack">
            <div className="tray-head">
              <h2>To pack</h2>
              <span className="tray-note">
                {carry?.source === 'board'
                  ? 'Drop here to take it out.'
                  : selected && !placedIds.has(selected)
                    ? name(selected)
                    : scored
                      ? hasChaos && required.length
                        ? 'MUST = mandatory · stamps = Chaos'
                        : 'Stamps show each item’s Chaos'
                      : ''}
              </span>
            </div>
            <div className="tray-items">
              {/* Outlines where packed items lay, so a half-empty tabletop still looks deliberate. */}
              {LEVEL.items
                .filter((item) => placedIds.has(item.id))
                .flatMap((item) =>
                  item.cells.map((c, i) => (
                    <div
                      key={`${item.id}-${i}`}
                      className="ghost"
                      aria-hidden="true"
                      style={{ gridColumn: layout.slots[item.id].col + c.x, gridRow: layout.slots[item.id].row + c.y }}
                    />
                  )),
                )}
              {placedIds.size === LEVEL.items.length && (
                <p className="tray-empty" aria-hidden="true">
                  Everything is in the suitcase.
                </p>
              )}
              {LEVEL.items.map((item) => {
                if (placedIds.has(item.id)) return null
                const o = trayTurns[item.id] ?? 0
                const slot = layout.slots[item.id]
                const box = Math.max(...item.cells.map((c) => c.x), ...item.cells.map((c) => c.y)) + 1
                return (
                  <div
                    key={item.id}
                    className={`slot${carry?.itemId === item.id ? ' lifted' : ''}`}
                    style={{ gridColumn: `${slot.col} / span ${box}`, gridRow: `${slot.row} / span ${box}` }}
                  >
                    <button
                      type="button"
                      className={`piece in-tray${selected === item.id ? ' selected' : ''}`}
                      style={pieceVars(item.id, o)}
                      data-item={item.id}
                      aria-label={`${name(item.id)}, not packed.${describe(item.id)} Enter to pick up, R to rotate.`}
                      {...infoHandlers(item.id)}
                      onPointerDown={(e) => startPointer(e, item.id, 'tray')}
                      onClick={(e) => e.detail === 0 && pickUpWithKeyboard(item.id, 'tray')}
                    >
                      <ItemArt item={item} orientation={o} />
                      {chips(item.id, o, `calc(var(--cell) * ${slot.col - 1} + 16px)`)}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="toolbar">
            <button type="button" onClick={() => rotateSelected(selected)}>Rotate</button>
            <button type="button" onClick={() => selected && dropRemove(selected)} disabled={!selectedPlaced}>Remove</button>
            <button type="button" onClick={doUndo} disabled={game.history.length === 0}>Undo</button>
            <button type="button" onClick={doReset} disabled={game.placements.length === 0}>
              Reset
            </button>
          </div>

          <details className="help">
            <summary>Controls</summary>
            <p>
              Drag items into the suitcase. Rotate with <kbd>R</kbd>, right-click, or the Rotate button. Keyboard: <kbd>Tab</kbd> to an item, <kbd>Enter</kbd> to pick up, arrows to move, <kbd>Enter</kbd> to place, <kbd>Esc</kbd> to cancel. <kbd>Delete</kbd> removes, <kbd>Ctrl/⌘ Z</kbd> undoes.
            </p>
          </details>
          <p className="status" role="status" aria-live="polite">{message}</p>
        </aside>
      </main>

      {dialogOpen && (
        <div className="backdrop" onClick={closeDialog}>
          <div
            className={`dialog${dialogKind === 'perfect' ? ' perfect' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="done-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={dialogKeys}
          >
            <div className="dialog-scroll">
            <div className="dialog-band" aria-hidden="true">
              <span>{dialogKind === 'perfect' ? 'First class' : 'Boarding pass'}</span>
              <span>Gate {Number(LEVEL.id)}</span>
            </div>
            {dialogKind === 'perfect' && <PerfectSeal />}
            <p className="dialog-kicker">Level {Number(LEVEL.id)} · {LEVEL_TITLES[LEVEL.id]}</p>
            {import.meta.env.DEV && devTainted.current && <p className="test-tag">TEST RUN — not saved</p>}
            <h2 id="done-title">{dialogKind === 'perfect' ? 'Maximum Chaos!' : 'Packed!'}</h2>
            <ul className="results">
              {required.length > 0 && (
                <li>
                  <span className="ok">✓</span> {hasChaos ? 'Mandatory items' : 'Required items'} <b>{packedCount}/{required.length}</b>
                </li>
              )}
              {hasChaos && (
                <li>
                  <span className="ok">✓</span> Chaos <b>{chaos}</b> (needed {target})
                </li>
              )}
              {scored && !hasChaos && (
                <li>
                  <span className="ok">✓</span> Chaos packed <b>{chaos}</b>
                </li>
              )}
              {limit !== undefined && (
                <li>
                  <span className="ok">✓</span> Within the allowance <b>{formatLoad(weight)}/{formatWeight(limit)}</b>
                </li>
              )}
              {hasChaos && (
                <li className={`bonus-result${perfectNow ? ' max' : ''}`}>
                  <span className="ok" aria-hidden="true">★</span>{' '}
                  {perfectNow ? <b>The most Chaos this suitcase can hold.</b> : <>A perfect pack is <b>{perfectScore}</b> Chaos. Can you find it?</>}
                </li>
              )}
            </ul>
            {isLast && <p className="sub">That&apos;s every level. Suitcase closed, dignity optional.</p>}
            <div className="barcode" aria-hidden="true" />
            <div className="dialog-actions">
              <button type="button" ref={primaryRef} className="primary" onClick={onNext ? onNext : () => { closeDialog(); doReset() }}>
                {onNext ? 'Next level' : 'Play again'}
              </button>
              <button type="button" onClick={closeDialog}>Keep packing</button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
