import type { TrayLayout } from './trayLayout'

/**
 * Chooses how a level is laid out for a viewport: which tray arrangement, and whether the tray sits beside the
 * suitcase ("side") or under it ("stack"). The goal is the largest comfortable cell size, so that objects never
 * have to shrink until they stop being recognisable. All numbers are CSS pixels of fixed chrome around the cells;
 * they mirror the stylesheet and are verified against the real DOM by the browser tests.
 */
export interface Viewport {
  w: number
  h: number
}

export interface Arrangement {
  layout: TrayLayout
  mode: 'side' | 'stack' | 'wing'
  /** Cell size in whole CSS pixels (board and tray share it, so an item never changes scale). */
  cell: number
  /** True when everything fits the viewport without scrolling the page. */
  fits: boolean
  /** How many pixels the page is taller than the viewport (0 when it fits). */
  overflow: number
}

interface Chrome {
  pageX: number // horizontal page padding, both sides together
  gap: number // gap between suitcase and tray column
  caseX: number // suitcase shell: horizontal chrome around the board
  trayX: number // tray: horizontal chrome around its cells
  head: number // masthead
  objective: number // objective tag above the suitcase
  chaosExtra: number // extra objective height on Chaos levels (goal sentence and the Chaos / weight pills)
  caseY: number // suitcase shell: vertical chrome around the board
  trayY: number // tray heading and padding above/below its cells
  tools: number // toolbar, help and status under the tray
}

const WIDE: Chrome = { pageX: 48, gap: 44, caseX: 76, trayX: 44, head: 72, objective: 212, chaosExtra: 0, caseY: 146, trayY: 76, tools: 152 }
/** The suitcase column is never narrower than this, so the objective tag keeps its pills on one row. */
const MIN_CASE = 440
const COMPACT: Chrome = { pageX: 20, gap: 0, caseX: 32, trayX: 16, head: 58, objective: 144, chaosExtra: 52, caseY: 80, trayY: 44, tools: 130 }

/** Stacked layout on a tablet: wide page margins, the masthead wraps to two rows, compact tag and suitcase. */
const TABLET_STACK: Chrome = { pageX: 48, gap: 0, caseX: 32, trayX: 16, head: 112, objective: 146, chaosExtra: 10, caseY: 144, trayY: 60, tools: 120 }

export const COMPACT_MAX_WIDTH = 760
/** Landscape phones are short, so they also get the compact chrome. */
export const COMPACT_MAX_HEIGHT = 480
/** Below this a cell is too small for the artwork's detail; prefer a layout that scrolls over one this small. */
export const COMFORT_CELL = 38

/** Page scroll costs this many pixels of overflow per pixel of cell size lost, when no arrangement fits. */
const SCROLL_COST = 20

/** Stacked layouts scroll, so cells stay finger-sized rather than filling a wide tablet. */
const MAX_STACK_CELL = 56

const cap = (boardCols: number) => (boardCols > 6 ? 72 : 80)

/** Landscape phones: the suitcase is pinned on the left, the objective, tray and tools scroll on the right. */
function evaluateWing(board: { width: number; height: number }, layout: TrayLayout, { w, h }: Viewport): Arrangement[] {
  const byHeight = (h - 56 - 26 - 44 - 12 - 44) / board.height
  const byWidth = (w - COMPACT.pageX - 16 - COMPACT.caseX - COMPACT.trayX - 20) / (board.width + layout.cols)
  const cell = Math.max(1, Math.floor(Math.min(MAX_STACK_CELL, cap(board.width), byHeight, byWidth)))
  return [{ layout, mode: 'wing', cell, fits: false, overflow: 0 }]
}

function evaluate(
  board: { width: number; height: number; target?: number },
  layout: TrayLayout,
  mode: 'side' | 'stack',
  { w, h }: Viewport,
): Arrangement[] {
  const base = mode === 'side' ? WIDE : w <= COMPACT_MAX_WIDTH ? COMPACT : TABLET_STACK
  const c = board.target === undefined ? base : { ...base, objective: base.objective + base.chaosExtra }
  const maxCell = mode === 'side' ? cap(board.width) : Math.min(cap(board.width), MAX_STACK_CELL)
  const byBoardHeight = (h - c.head - c.objective - c.caseY) / board.height
  let needed: (cell: number) => number
  const cells: number[] = []
  if (mode === 'side') {
    const room = w - c.pageX - c.gap - c.trayX
    const byWidth = Math.min((room - c.caseX) / (board.width + layout.cols), (room - MIN_CASE) / layout.cols)
    const byTrayHeight = (h - c.head - c.trayY - c.tools) / layout.rows
    cells.push(Math.floor(Math.min(maxCell, byWidth, byTrayHeight, byBoardHeight)))
    needed = (k) => Math.max(c.head + c.trayY + c.tools + layout.rows * k, c.head + c.objective + c.caseY + board.height * k)
  } else {
    const byWidth = (w - c.pageX - Math.max(c.caseX, c.trayX)) / Math.max(board.width, layout.cols)
    // The suitcase itself must always be fully visible, even when the tray below scrolls.
    const full = Math.floor(Math.min(maxCell, byWidth, (h - c.caseY - 90) / board.height))
    needed = (k) => c.head + c.objective + c.caseY + board.height * k + c.trayY + layout.rows * k + c.tools
    cells.push(full)
    // A slightly smaller cell may let the whole page fit without scrolling (tablets): offer it as a second candidate.
    const fitCell = Math.floor((h - needed(0)) / (board.height + layout.rows))
    if (fitCell >= COMFORT_CELL && fitCell < full) cells.push(fitCell)
  }
  return cells.map((cell) => {
    const k = Math.max(cell, 1)
    const overflow = Math.max(0, needed(k) - h)
    return { layout, mode, cell: k, fits: overflow === 0, overflow }
  })
}

export function chooseArrangement(board: { width: number; height: number; target?: number }, layouts: readonly TrayLayout[], vp: Viewport): Arrangement {
  const landscapePhone = vp.h <= COMPACT_MAX_HEIGHT && vp.w >= 600
  const all = layouts.flatMap((l) => (landscapePhone ? evaluateWing(board, l, vp) : (['side', 'stack'] as const).flatMap((m) => evaluate(board, l, m, vp))))
  // Comfortable cells first; then the biggest cell, discounted by how far the page would scroll; then prefer fitting, then side by side, then the smaller tray.
  const rank = (a: Arrangement) => [a.cell >= COMFORT_CELL ? 1 : 0, a.cell >= COMFORT_CELL ? a.cell - a.overflow / SCROLL_COST : a.cell, a.fits ? 1 : 0, a.mode === 'side' ? 1 : 0, -a.layout.cols * a.layout.rows]
  return all.reduce((best, a) => {
    const ra = rank(a)
    const rb = rank(best)
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] > rb[i] ? a : best
    return best
  })
}
