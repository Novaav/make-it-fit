const STAR = 'M0 -10Q1.4 -1.4 10 0Q1.4 1.4 0 10Q-1.4 1.4 -10 0Q-1.4 -1.4 0 -10Z'

const SPARKLES = [
  { x: 2, y: 3, s: 22, d: 0 },
  { x: 98, y: 6, s: 16, d: 180 },
  { x: 100, y: 50, s: 20, d: 340 },
  { x: 96, y: 97, s: 22, d: 90 },
  { x: 4, y: 96, s: 16, d: 260 },
  { x: 0, y: 46, s: 18, d: 430 },
]

/**
 * One-shot flourish for reaching the maximum Chaos: a gold stitched line is drawn round the suitcase and six small
 * four-point sparkles twinkle once on its edge. Decorative only (the result is also stated in text and by the seal);
 * plain CSS, removed from the page after a moment, and switched off for reduced motion.
 */
export default function PerfectFlourish() {
  return (
    <div className="flourish" aria-hidden="true">
      <span className="flourish-ring" />
      {SPARKLES.map((s, i) => (
        <svg key={i} className="twinkle" viewBox="-12 -12 24 24" width={s.s} height={s.s} style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${Math.round(s.d * 0.6)}ms` }}>
          <path d={STAR} />
        </svg>
      ))}
    </div>
  )
}
