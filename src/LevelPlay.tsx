import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  clampOrigin,
  commitPlacement,
  createGame,
  isOverWeight,
  isWon,
  optionalPlacedCount,
  totalWeight,
  itemBounds,
  previewPlacement,
  rotate,
  remove,
  reset,
  rotatePlaced,
  undo,
  type ActionResult,
  type GameState,
  type Level,
  type Orientation,
  type Placement,
  type PlacementError,
  place,
} from './engine'
import { ItemArt } from './components/ItemArt'
import { dragTarget, sameTarget, type DragGeometry } from './ui/drag'
import { TRAY_LAYOUTS } from './ui/trayLayout'
import { BEST_OPTIONAL, ITEM_NAMES, WEIGHT_UNIT } from './levelMeta'

const name = (id: string) => ITEM_NAMES[id] ?? id
const REASONS: Record<PlacementError, string> = {
  'out-of-bounds': 'it sticks out of the suitcase',
  overlap: 'it overlaps another item',
  'unknown-item': 'unknown item',
  'already-placed': 'already packed',
  'not-placed': 'not packed',
  'nothing-to-undo': 'nothing to undo',
}

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
  onWin: (optionalPacked: number) => void
  /** Offered on the completion card when there is a next playable level. */
  onNext?: () => void
  /** True when no level follows this one. */
  isLast?: boolean
  /** Development builds only: replace the board with these placements (undoable step by step). */
  devFill?: { nonce: number; placements: readonly Placement[] }
}

export default function LevelPlay({ level: LEVEL, onWin, onNext, isLast, devFill }: Props) {
  const layout = TRAY_LAYOUTS[LEVEL.id]
  const [game, setGame] = useState<GameState>(() => createGame(LEVEL))
  const [carry, setCarryState] = useState<Carry | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [trayTurns, setTrayTurns] = useState<Record<string, Orientation>>({})
  const [message, setMessage] = useState('')

  const boardRef = useRef<HTMLDivElement>(null)
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
  const celebrated = useRef(false)
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
      setMessage(ok)
    } else setMessage(`Can't do that: ${REASONS[result.error]}.`)
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
    if (apply(remove(gameRef.current, id), `${name(id)} taken out.`)) setTrayTurns((t) => ({ ...t, [id]: o }))
    setSelected(null)
  }

  const rotateCarry = () => {
    const c = carryRef.current!
    const orientation = ((c.orientation + 1) % 4) as Orientation
    const turned = { ...c, orientation }
    if (c.mode === 'pointer') setCarry(retarget(turned, pointerPos.current.x, pointerPos.current.y))
    else setCarry({ ...turned, ...clampOrigin(LEVEL, c.itemId, orientation, c.x, c.y) })
  }

  const rotateSelected = (id: string | null) => {
    if (carryRef.current) return rotateCarry()
    if (!id) return setMessage('Select an item first, then rotate it.')
    if (placementOf(id)) apply(rotatePlaced(gameRef.current, id), `${name(id)} rotated.`)
    else {
      setTrayTurns((t) => ({ ...t, [id]: (((t[id] ?? 0) + 1) % 4) as Orientation }))
      setMessage(`${name(id)} rotated.`)
    }
  }

  const commitCarry = (c: Carry) => {
    const pv = previewPlacement(gameRef.current, c.itemId, c.orientation, c.x, c.y)
    if (pv.error) {
      setMessage(`${name(c.itemId)} doesn't fit there: ${REASONS[pv.error]}.`)
      return false
    }
    apply(commitPlacement(gameRef.current, pv.placement), `${name(c.itemId)} packed.`)
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
    setDialogOpen(false)
    setGame(reset(gameRef.current))
    setSelected(null)
    setTrayTurns({})
    setMessage('Suitcase emptied.')
  }

  const doUndo = () => {
    if (apply(undo(gameRef.current), 'Undone.')) setSelected(null)
  }

  const startPointer = (e: ReactPointerEvent, itemId: string, source: Source) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (carryRef.current?.mode === 'keyboard') setCarry(null)
    pending.current = { itemId, source, sx: e.clientX, sy: e.clientY }
  }

  const pickUpWithKeyboard = (itemId: string, source: Source) => {
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

  // Any change to the carried item (new cell, rotation, snapped flip, keyboard step) re-places it before paint.
  useLayoutEffect(() => {
    placeCarried()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carry])

  const winSignal = isWon(game) ? optionalPlacedCount(game) : -1
  useEffect(() => {
    // Dev-tool fills must never write real progress.
    if (winSignal >= 0 && !devTainted.current) onWin(winSignal)
    if (winSignal >= 0 && !celebrated.current) {
      celebrated.current = true
      returnFocus.current = document.activeElement as HTMLElement | null
      setDialogOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winSignal])

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
  const optionalItems = LEVEL.items.filter((i) => !i.required)
  const optionalCount = optionalPlacedCount(game)
  const limit = LEVEL.weightLimit
  const weight = totalWeight(game)
  const overWeight = isOverWeight(game)
  const showWin = isWon(game)
  const requiredDone = packedCount === required.length
  const bestBonus = BEST_OPTIONAL[LEVEL.id] ?? 0
  const solved = showWin
  // "Max!" only for a valid solution: the denominator is the verified maximum, not the optional item count.
  const bonusMaxed = solved && optionalItems.length > 0 && optionalCount >= bestBonus
  const goalText =
    limit === undefined
      ? `Fit all ${required.length} items into the suitcase. Green = fits, red = doesn't.`
      : `Pack all required items under ${limit} ${WEIGHT_UNIT}. ★ items are optional.`
  const liveHint =
    carry && snapped && preview
      ? preview.error
        ? `Red — ${REASONS[preview.error]}.`
        : 'Green — it fits here.'
      : null
  const overTray = !!carry && carry.mode === 'pointer' && carry.overTray
  const selectedPlaced = !!selected && placedIds.has(selected)

  const pieceVars = (itemId: string, o: Orientation) => {
    const b = itemBounds(LEVEL, itemId, o)
    return { '--cw': b.width, '--ch': b.height } as React.CSSProperties
  }
  const itemById = (id: string) => LEVEL.items.find((i) => i.id === id)!
  // Anchor the weight chip on a cell the item really covers (bottom-most, then right-most),
  // not on the bounding-box corner, which is empty for T/U/L shapes.
  const chips = (id: string, o: Orientation) => {
    if (limit === undefined) return null
    const cells = rotate(itemById(id).cells, o)
    const anchor = cells.reduce((a, c) => (c.y > a.y || (c.y === a.y && c.x > a.x) ? c : a))
    return (
      <span
        className={`chip-w${itemById(id).required ? '' : ' bonus'}`}
        style={{ '--chip-x': anchor.x + 1, '--chip-y': anchor.y + 1 } as React.CSSProperties}
        aria-hidden="true"
      >
        {itemById(id).weight} {WEIGHT_UNIT}
        {itemById(id).required ? '' : ' ★'}
      </span>
    )
  }
  const describe = (id: string) =>
    limit === undefined
      ? ''
      : ` ${itemById(id).required ? 'Required' : 'Optional'}, ${itemById(id).weight} ${WEIGHT_UNIT}.`

  return (
    <div
      className="level"
      style={
        {
          '--cols': LEVEL.width,
          '--rows': LEVEL.height,
          '--tcols': layout.cols,
          '--trows': layout.rows,
          '--span': Math.max(LEVEL.width, layout.cols),
          '--cell-max': `${Math.max(LEVEL.width, layout.cols) > 6 ? 72 : 80}px`,
        } as React.CSSProperties
      }
    >
      <main className="stage">
        <section className="case-wrap" aria-label={`Level ${Number(LEVEL.id)} suitcase`}>
          <section className={`objective${solved ? ' solved' : ''}`} aria-label="Objective">
            <p className="goal-line" aria-live="off">
              {solved ? (
                <>
                  <b>✓ Level packed.</b>{' '}
                  {optionalItems.length > 0 && !bonusMaxed ? 'Add more ★ items for a better bonus.' : 'Bonus maxed.'}
                </>
              ) : (
                liveHint ?? goalText
              )}
            </p>
            <div className="pills">
              <span className={`pill${requiredDone ? ' ok' : ''}`}>
                <span className="pill-label">Required</span>
                <b>{packedCount}/{required.length}</b>
                {requiredDone && <span aria-hidden="true">✓</span>}
              </span>
              {limit !== undefined && (
                <span className={`pill weight${overWeight ? ' over' : ''}`}>
                  <b>{weight}/{limit} {WEIGHT_UNIT}</b>
                  <span
                    className="mini-bar"
                    role="meter"
                    aria-label="Suitcase weight"
                    aria-valuemin={0}
                    aria-valuemax={limit}
                    aria-valuenow={weight}
                    aria-valuetext={`${weight} of ${limit} ${WEIGHT_UNIT}`}
                  >
                    <span style={{ width: `${Math.min(100, (weight / limit) * 100)}%` }} />
                  </span>
                </span>
              )}
              {optionalItems.length > 0 && (
                <span className={`pill bonus${bonusMaxed ? ' max' : ''}`}>
                  <span className="pill-label">★ Bonus</span>
                  <b>{optionalCount}/{bestBonus}</b>
                  {bonusMaxed && <span className="max-tag">Max!</span>}
                </span>
              )}
              {solved && (
                <button type="button" className="pill-action" onClick={onNext ?? doReset}>
                  {onNext ? 'Next level →' : 'Play again'}
                </button>
              )}
            </div>
            <p className={`over-note${overWeight ? ' on' : ''}`} role="status">
              {overWeight ? `Over by ${weight - (limit ?? 0)} ${WEIGHT_UNIT} — take something out.` : ''}
            </p>
          </section>
          <div className="suitcase">
            <div className="handle" aria-hidden="true" />
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
                    onPointerDown={(e) => startPointer(e, p.itemId, 'board')}
                    onClick={(e) => e.detail === 0 && pickUpWithKeyboard(p.itemId, 'board')}
                  >
                    <ItemArt item={itemById(p.itemId)} orientation={o} />
                    {chips(p.itemId, o)}
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
                    : optionalItems.length > 0
                      ? `${optionalItems.length} optional ★ · at most ${bestBonus} fit`
                      : ''}
              </span>
            </div>
            <div className="tray-items">
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
                      title={name(item.id)}
                      aria-label={`${name(item.id)}, not packed.${describe(item.id)} Enter to pick up, R to rotate.`}
                      onPointerDown={(e) => startPointer(e, item.id, 'tray')}
                      onClick={(e) => e.detail === 0 && pickUpWithKeyboard(item.id, 'tray')}
                    >
                      <ItemArt item={item} orientation={o} />
                      {chips(item.id, o)}
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
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="done-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={dialogKeys}
          >
            <p className="dialog-kicker">Level {Number(LEVEL.id)}</p>
            {import.meta.env.DEV && devTainted.current && <p className="test-tag">TEST RUN — not saved</p>}
            <h2 id="done-title">Packed!</h2>
            <ul className="results">
              <li>
                <span className="ok">✓</span> Required items <b>{packedCount}/{required.length}</b>
              </li>
              {limit !== undefined && (
                <li>
                  <span className="ok">✓</span> Weight <b>{weight}/{limit} {WEIGHT_UNIT}</b>
                </li>
              )}
              {optionalItems.length > 0 && (
                <li className={`bonus-result${bonusMaxed ? ' max' : ''}`}>
                  <span className="ok" aria-hidden="true">★</span> Bonus <b>{optionalCount}/{bestBonus}</b>
                  {bonusMaxed ? <span className="max-tag">Max!</span> : <span className="sub"> — max is {bestBonus}</span>}
                </li>
              )}
            </ul>
            {isLast && <p className="sub">That&apos;s every level. Suitcase closed, dignity optional.</p>}
            <div className="dialog-actions">
              <button type="button" ref={primaryRef} className="primary" onClick={onNext ? onNext : () => { closeDialog(); doReset() }}>
                {onNext ? 'Next level' : 'Play again'}
              </button>
              <button type="button" onClick={closeDialog}>Keep packing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
