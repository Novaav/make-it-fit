export interface Box {
  left: number
  top: number
  width: number
  height: number
}

/** Something the how-to-play note should stay off, with how bad covering it would be. */
export interface Avoid {
  box: Box
  weight: number
}

const overlap = (a: Box, b: Box) => {
  const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)
  const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top)
  return w > 0 && h > 0 ? w * h : 0
}

/**
 * Where to pin the how-to-play note (viewport coordinates): the spot that covers the least of what the player needs.
 * Candidates are the four corners plus, for every thing to avoid, the spots just beside it; the suitcase and the tool
 * buttons weigh the most, the item tray less. Ties keep the first candidate, so the bottom right wins on an open screen.
 */
export function placeNote(viewport: { width: number; height: number }, size: { width: number; height: number }, avoid: Avoid[], margin = 12): { left: number; top: number } {
  const maxLeft = Math.max(margin, viewport.width - size.width - margin)
  const maxTop = Math.max(margin, viewport.height - size.height - margin)
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
  // the paper is tilted a little, so its bounding box is a few pixels taller than its layout box
  const gap = margin / 2 + 8
  const cands: { left: number; top: number }[] = [
    { left: maxLeft, top: maxTop },
    { left: margin, top: maxTop },
    { left: maxLeft, top: margin },
    { left: margin, top: margin },
  ]
  for (const { box } of avoid) {
    const below = box.top + box.height + gap
    const above = box.top - size.height - gap
    for (const left of [maxLeft, margin]) {
      cands.push({ left, top: clamp(below, margin, maxTop) })
      cands.push({ left, top: clamp(above, margin, maxTop) })
    }
    for (const left of [maxLeft, margin]) cands.push({ left, top: clamp(box.top, margin, maxTop) }) // lying over it, from its top edge
    cands.push({ left: clamp(box.left + box.width + gap, margin, maxLeft), top: maxTop })
    cands.push({ left: clamp(box.left - size.width - gap, margin, maxLeft), top: maxTop })
  }
  let best = cands[0]
  let bestScore = Infinity
  for (const c of cands) {
    const note = { left: c.left, top: c.top, width: size.width, height: size.height }
    const score = avoid.reduce((sum, a) => sum + a.weight * overlap(note, a.box), 0)
    if (score < bestScore) {
      best = c
      bestScore = score
    }
  }
  return best
}
