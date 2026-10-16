import { INK, Inked, Lod1, Lod2, Stitch, line, type ItemArtDef } from './kit'

/** Deterministic pseudo-random numbers, so every render of a hand-tuned procedural detail is identical. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}
const f = (n: number) => Number(n.toFixed(3))
const star = (x: number, y: number, r: number) =>
  `M${f(x)} ${f(y - r)}L${f(x + r * 0.28)} ${f(y - r * 0.28)}L${f(x + r)} ${f(y)}L${f(x + r * 0.28)} ${f(y + r * 0.28)}L${f(x)} ${f(y + r)}L${f(x - r * 0.28)} ${f(y + r * 0.28)}L${f(x - r)} ${f(y)}L${f(x - r * 0.28)} ${f(y - r * 0.28)}Z`

/* ---------- Party outfit (T tetromino): a sequinned plunge top, price tag still on ---------- */
const MAG = '#c23c9c'
const MAG_D = '#8e2272'
const MAG_L = '#ee7fcb'
const MAG_INK = '#4d0f40'
const GOLD = '#e8c96a'
const GOLD_D = '#a8862a'
const TOP =
  'M.13 .22C.5 .1 .85 .09 1.14 .09L1.5 .84L1.86 .09C2.15 .09 2.5 .1 2.87 .22L2.94 .88L1.93 .95L1.93 1.93Q1.5 1.99 1.07 1.93L1.07 .95L.06 .88Z'

const outfit: ItemArtDef = {
  zone: { x: 1.5, y: 1.6, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        {/* overlapping sequin discs: each one catches the light at its upper left */}
        <pattern id={`${uid}-seq`} width={0.12} height={0.12} patternUnits="userSpaceOnUse">
          {[
            [0.06, 0.06],
            [0, 0],
            [0.12, 0],
            [0, 0.12],
            [0.12, 0.12],
          ].map(([x, y]) => (
            <g key={`${x}${y}`}>
              <circle cx={x} cy={y} r={0.066} fill={MAG} stroke={MAG_D} strokeWidth={0.009} />
              <path d={`M${x - 0.04} ${y - 0.01}Q${x - 0.015} ${y - 0.05} ${x + 0.02} ${y - 0.04}`} stroke="#ffd3f0" strokeWidth={0.012} fill="none" strokeLinecap="round" />
            </g>
          ))}
        </pattern>
        <linearGradient id={`${uid}-shade`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset="0" stopColor="#4d0f40" stopOpacity={0.3} />
          <stop offset="0.3" stopColor="#fff" stopOpacity={0.1} />
          <stop offset="0.7" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#4d0f40" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <Inked d={TOP} fill={MAG} ink={MAG_INK} />
      <path d={TOP} fill={`url(#${uid}-seq)`} />
      <path d={TOP} fill={`url(#${uid}-shade)`} />
      {/* soft folds where the sleeves turn under, and the lit shoulder line */}
      <path d="M1.07 .95C.8 .88 .5 .84 .26 .9L.06 .88 .26 .86C.55 .8 .9 .86 1.07 .93Z" fill={MAG_INK} opacity={0.4} />
      <path d="M1.93 .95C2.2 .88 2.5 .84 2.74 .9L2.94 .88 2.74 .86C2.45 .8 2.1 .86 1.93 .93Z" fill={MAG_INK} opacity={0.4} />
      <path d="M1.14 .1C.9 .15 .7 .2 .42 .3M1.86 .1C2.1 .15 2.3 .2 2.58 .3" stroke={MAG_L} strokeWidth={0.03} opacity={0.7} {...line} />
      <path d="M1.8 1.05V1.9Q1.5 1.96 1.2 1.9V1.94Q1.5 2 1.93 1.93V.95Z" fill={MAG_INK} opacity={0.3} />
      {/* gold piping round the plunge neckline, with a flat bead chain on the hem */}
      <path d="M1.14 .09L1.5 .82L1.86 .09" stroke={GOLD_D} strokeWidth={0.075} {...line} />
      <path d="M1.14 .09L1.5 .82L1.86 .09" stroke={GOLD} strokeWidth={0.05} {...line} />
      <path d="M1.14 .09L1.5 .82" stroke="#fff6d0" strokeWidth={0.012} opacity={0.8} {...line} />
      <Stitch d="M1.1 1.86Q1.5 1.93 1.9 1.86" color={GOLD} w={0.03} dash="0.025 0.05" />
      {/* sleeve cuffs with a gold edge */}
      <path d="M.06 .88L.15 .26 .3 .29 .23 .9Z" fill={MAG_D} opacity={0.6} />
      <path d="M2.94 .88L2.85 .26 2.7 .29 2.77 .9Z" fill={MAG_D} opacity={0.6} />
      <path d="M.06 .88L.15 .26M2.94 .88L2.85 .26" stroke={GOLD} strokeWidth={0.03} {...line} />
      {/* the price tag, still on: kraft card on a string looped through the neckline */}
      <path d="M1.5 .82C1.44 1.0 1.34 1.16 1.36 1.3" stroke="#7a5a33" strokeWidth={0.018} {...line} />
      <g transform="rotate(-6 1.5 1.55)">
        <path d="M1.2 1.3H1.8Q1.88 1.3 1.88 1.38V1.76Q1.88 1.84 1.8 1.84H1.2Q1.12 1.84 1.12 1.76V1.38Q1.12 1.3 1.2 1.3Z" fill="#d9b787" stroke="#7a5a33" strokeWidth={0.025} strokeLinejoin="round" />
        <circle cx={1.5} cy={1.36} r={0.03} fill="#f2e3c6" stroke="#7a5a33" strokeWidth={0.012} />
        <rect x={1.17} y={1.42} width={0.66} height={0.36} rx={0.02} fill="#f4e3c3" opacity={0.9} />
      </g>
      <Lod1>
        {/* a stray sequin, a glint and a drop of spilled drink on the sleeve */}
        <path d={star(0.5, 0.52, 0.1)} fill="#fff" opacity={0.9} />
        <path d={star(2.44, 0.6, 0.07)} fill="#fff" opacity={0.8} />
        <path d={star(1.17, 1.32, 0.06)} fill="#fff" opacity={0.7} />
      </Lod1>
      <Lod2>
        <circle cx={2.6} cy={0.7} r={0.085} fill="none" stroke="#5a2a40" strokeWidth={0.02} opacity={0.35} />
      </Lod2>
    </>
  ),
}

/* ---------- Red-soled heels (U pentomino): a pair lying on their sides, tied together at the ankle straps ---------- */
const PATENT = '#241f30'
const PATENT_L = '#4a4260'
const LACQUER = '#d3262f'
// one stiletto in profile, toe to the left, heel to the right, collar up (length 2, height 1); rotated into place below
const PUMP =
  'M.06 .84C.02 .66 .1 .5 .32 .46C.54 .42 .68 .34 .84 .26C1.0 .18 1.16 .16 1.34 .16C1.52 .16 1.62 .14 1.68 .06C1.74 .02 1.84 .04 1.86 .14C1.9 .32 1.86 .5 1.8 .64L1.64 .67C1.3 .74 .94 .76 .64 .86C.44 .92 .16 .92 .06 .84Z'
const SOLE_LINE = 'M.07 .86C.16 .93 .44 .91 .64 .86C.94 .76 1.3 .74 1.64 .67'

function Pump({ uid }: { uid: string }) {
  return (
    <>
      {/* the stiletto, tapering to a metal tip, under the heel seat */}
      <path d="M1.58 .64L1.85 .6L1.78 .99L1.7 .99Z" fill="#0e0a14" stroke="#0e0a14" strokeWidth={0.03} strokeLinejoin="round" />
      <path d="M1.6 .66L1.82 .62L1.76 .96L1.71 .96Z" fill={PATENT} />
      <path d="M1.64 .7L1.7 .95" stroke="#fff" strokeWidth={0.018} opacity={0.5} {...line} />
      <path d="M1.7 .96H1.78V1H1.7Z" fill="#b9bfcc" stroke="#4a4f58" strokeWidth={0.01} />
      <Inked d={PUMP} fill={PATENT} ink="#0e0a14" w={0.04} />
      {/* the red lacquered sole along the underside: dark edge, then the lacquer */}
      <path d={SOLE_LINE} stroke="#3a0a10" strokeWidth={0.15} {...line} />
      <path d={SOLE_LINE} stroke={LACQUER} strokeWidth={0.1} {...line} />
      <path d="M.2 .9C.3 .93 .44 .92 .56 .89" stroke="#ff9d97" strokeWidth={0.02} opacity={0.8} {...line} />
      {/* glossy patent highlights */}
      <path d="M.12 .78C.14 .68 .22 .63 .34 .61" stroke="#fff" strokeWidth={0.035} opacity={0.55} {...line} />
      <path d="M.9 .4C1.1 .32 1.3 .3 1.5 .3" stroke={PATENT_L} strokeWidth={0.04} {...line} />
      <path d="M1.2 .68C1.4 .66 1.6 .62 1.76 .56" stroke={PATENT_L} strokeWidth={0.03} {...line} />
      <path d={PUMP} fill={`url(#${uid}-gloss)`} />
      {/* the foot opening: pale insole seen over the far collar */}
      <path d="M.86 .38C1.0 .3 1.16 .27 1.34 .27C1.5 .27 1.6 .24 1.66 .15L1.7 .26C1.62 .34 1.52 .38 1.4 .38C1.2 .38 1.04 .4 .9 .46Z" fill="#e9d8c4" stroke="#0e0a14" strokeWidth={0.02} strokeLinejoin="round" />
      {/* a gold buckle on the heel counter where the ankle strap starts */}
      <rect x={1.56} y={0.14} width={0.14} height={0.12} rx={0.02} fill={GOLD} stroke="#5b4a22" strokeWidth={0.02} />
    </>
  )
}

const heels: ItemArtDef = {
  zone: { x: 1.5, y: 0.74, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-gloss`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.3} />
          <stop offset="0.4" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#fff2b8" />
          <stop offset="0.5" stopColor={GOLD} />
          <stop offset="1" stopColor={GOLD_D} />
        </linearGradient>
      </defs>
      {/* two stilettos on their sides, soles outwards, heels up; each opening faces the other */}
      <g transform="translate(.015 .03) scale(.97) matrix(0 -1 -1 0 1 2)">
        <Pump uid={uid} />
      </g>
      <g transform="translate(2.015 .03) scale(.97) matrix(0 -1 1 0 0 2)">
        <Pump uid={uid} />
      </g>
      {/* the ankle straps meet at a gold buckle: the pair is tied together like the sneakers */}
      <path d="M.8 .3C1.0 .24 1.18 .28 1.32 .32M2.2 .3C2.0 .24 1.82 .28 1.68 .32" stroke="#0e0a14" strokeWidth={0.115} {...line} />
      <path d="M.8 .3C1.0 .24 1.18 .28 1.32 .32M2.2 .3C2.0 .24 1.82 .28 1.68 .32" stroke={PATENT} strokeWidth={0.08} {...line} />
      <path d="M.88 .27C1.04 .23 1.18 .26 1.28 .29" stroke="#fff" strokeWidth={0.014} opacity={0.5} {...line} />
      <Inked d="M1.3 .21H1.7Q1.76 .21 1.76 .27V.38Q1.76 .44 1.7 .44H1.3Q1.24 .44 1.24 .38V.27Q1.24 .21 1.3 .21Z" fill={`url(#${uid}-gold)`} ink="#5b4a22" w={0.028} />
      <path d="M1.5 .22V.43" stroke="#5b4a22" strokeWidth={0.03} {...line} />
      <rect x={1.31} y={0.265} width={0.34} height={0.11} rx={0.02} fill="none" stroke="#fff6d0" strokeWidth={0.012} opacity={0.7} />
      {/* a kraft tag hangs from the buckle: the weight prints on it */}
      <path d="M1.5 .44C1.5 .5 1.5 .54 1.5 .56" stroke="#7a5a33" strokeWidth={0.018} {...line} />
      <path d="M1.14 .56H1.86Q1.94 .56 1.94 .64V.94Q1.94 1.0 1.86 1.0H1.14Q1.06 1.0 1.06 .94V.64Q1.06 .56 1.14 .56Z" fill="#e3c699" stroke="#7a5a33" strokeWidth={0.025} strokeLinejoin="round" />
      <circle cx={1.5} cy={0.62} r={0.025} fill="#f2e3c6" stroke="#7a5a33" strokeWidth={0.01} />
    </>
  ),
}

/* ---------- Pocket massager (3x1): a quilted zip pouch with a note on it ---------- */
const TEAL = '#2f8f8a'
const TEAL_D = '#1d5c58'
const TEAL_L = '#7cc8c0'
const POUCH2 = 'M.36 .12H2.64Q2.94 .12 2.94 .5Q2.94 .88 2.64 .88H.36Q.06 .88 .06 .5Q.06 .12 .36 .12Z'

const vibrator: ItemArtDef = {
  zone: { x: 1.5, y: 0.58, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <pattern id={`${uid}-quilt`} width={0.26} height={0.26} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0H.26M0 0V.26" stroke={TEAL_D} strokeWidth={0.014} opacity={0.65} />
          <circle cx={0} cy={0} r={0.015} fill={TEAL_L} />
        </pattern>
        <linearGradient id={`${uid}-velvet`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
          <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#0b2b29" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <Inked d={POUCH2} fill={TEAL} ink="#0e3a37" />
      <path d={POUCH2} fill={`url(#${uid}-quilt)`} />
      <path d={POUCH2} fill={`url(#${uid}-velvet)`} />
      {/* zip along the top with a brass pull, and a gathered end */}
      <path d="M.3 .2H2.7" stroke="#0e3a37" strokeWidth={0.07} {...line} />
      <path d="M.3 .2H2.7" stroke="#c9b07a" strokeWidth={0.04} strokeDasharray="0.03 0.03" {...line} />
      <path d="M2.2 .14H2.42Q2.48 .14 2.48 .2Q2.48 .26 2.42 .26H2.2Z" fill="#e6d49e" stroke="#6b5a2c" strokeWidth={0.02} strokeLinejoin="round" />
      <path d="M2.48 .2L2.58 .34" stroke="#6b5a2c" strokeWidth={0.025} {...line} />
      <circle cx={2.6} cy={0.37} r={0.04} fill="none" stroke="#6b5a2c" strokeWidth={0.02} />
      <path d="M.12 .5Q.2 .5 .24 .64M.12 .5Q.2 .5 .24 .36" stroke="#0e3a37" strokeWidth={0.02} opacity={0.5} {...line} />
      {/* leather tab (the weight label) stitched across the middle */}
      <rect x={1.08} y={0.4} width={0.84} height={0.36} rx={0.04} fill="#c99a63" stroke="#7a5326" strokeWidth={0.025} />
      <Stitch d="M1.12 .44H1.88V.72H1.12Z" color="#7a5326" w={0.014} dash="0.04 0.035" />
      {/* a sticky note on the left, with a wink */}
      <g transform="rotate(-8 0.6 0.58)">
        <path d="M.34 .38H.86V.82H.34Z" fill="#f7e27a" stroke="#a88a1c" strokeWidth={0.02} strokeLinejoin="round" />
        <path d="M.34 .74Q.6 .78 .86 .74V.82H.34Z" fill="#e5cc55" />
        <Lod1>
          <circle cx={0.52} cy={0.54} r={0.03} fill="#4a3d10" />
          <path d="M.64 .54H.72" stroke="#4a3d10" strokeWidth={0.025} {...line} />
          <path d="M.48 .64Q.6 .72 .74 .62" stroke="#4a3d10" strokeWidth={0.022} {...line} />
        </Lod1>
      </g>
      {/* a small embroidered heart on the right */}
      <path d="M2.2 .66C2.12 .6 2.1 .52 2.16 .5C2.2 .48 2.24 .52 2.25 .55C2.26 .52 2.3 .48 2.34 .5C2.4 .52 2.38 .6 2.3 .66Z" fill="#f08aa6" stroke="#9c3a58" strokeWidth={0.015} strokeLinejoin="round" />
    </>
  ),
}

/* ---------- Party speaker (2x1) ---------- */
const GRAPH = '#3e3e56'
const GRAPH_D = '#1e1e2d'

const speaker: ItemArtDef = {
  zone: { x: 1.0, y: 0.61, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <pattern id={`${uid}-mesh`} width={0.07} height={0.07} patternUnits="userSpaceOnUse">
          <circle cx={0.0175} cy={0.0175} r={0.016} fill="#14141f" />
          <circle cx={0.0525} cy={0.0525} r={0.016} fill="#14141f" />
        </pattern>
        <linearGradient id={`${uid}-body`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#5a5a78" />
          <stop offset="0.5" stopColor={GRAPH} />
          <stop offset="1" stopColor={GRAPH_D} />
        </linearGradient>
        <linearGradient id={`${uid}-steel`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#f0f2f6" />
          <stop offset="1" stopColor="#8e95a4" />
        </linearGradient>
      </defs>
      <Inked d="M.3 .1H1.7Q1.94 .1 1.94 .34V.66Q1.94 .9 1.7 .9H.3Q.06 .9 .06 .66V.34Q.06 .1 .3 .1Z" fill={`url(#${uid}-body)`} ink={GRAPH_D} />
      {/* rubber end caps */}
      <path d="M.3 .1Q.06 .1 .06 .34V.66Q.06 .9 .3 .9H.4V.1Z" fill="#2a2a3c" />
      <path d="M1.7 .1Q1.94 .1 1.94 .34V.66Q1.94 .9 1.7 .9H1.6V.1Z" fill="#2a2a3c" />
      <path d="M.4 .1V.9M1.6 .1V.9" stroke="#14141f" strokeWidth={0.025} {...line} />
      {/* perforated grille with a steel bezel */}
      <rect x={0.46} y={0.2} width={1.08} height={0.6} rx={0.1} fill="#6d7488" stroke="#14141f" strokeWidth={0.025} />
      <rect x={0.5} y={0.24} width={1.0} height={0.52} rx={0.08} fill={`url(#${uid}-mesh)`} />
      <rect x={0.5} y={0.24} width={1.0} height={0.52} rx={0.08} fill="#9aa2b8" opacity={0.18} />
      {/* LED strip along the top: one bulb for each colour of a bad idea */}
      {['#ff5d7a', '#ffb43a', '#ffe35a', '#5be0a0', '#4fb6ff', '#b07bff'].map((c, i) => (
        <circle key={c} cx={0.58 + i * 0.168} cy={0.155} r={0.03} fill={c} stroke="#14141f" strokeWidth={0.008} />
      ))}
      {/* bluetooth rune on the left cap, glitter star sticker on the right */}
      <circle cx={0.23} cy={0.5} r={0.11} fill="#2f7be0" stroke="#14141f" strokeWidth={0.02} />
      <path d="M.2 .43L.27 .5L.2 .57M.2 .43L.2 .57M.2 .5L.27 .43M.2 .5L.27 .57" stroke="#fff" strokeWidth={0.02} {...line} />
      <path d={star(1.77, 0.5, 0.12)} fill="#ffd34d" stroke="#8a6a12" strokeWidth={0.02} strokeLinejoin="round" />
      <Lod1>
        <path d={star(1.8, 0.45, 0.04)} fill="#fff" />
        <path d="M1.72 .54l.02.02M1.8 .55l.01.01" stroke="#fff6c8" strokeWidth={0.02} {...line} />
      </Lod1>
      {/* a strip of masking tape across the grille: the weight prints on it */}
      <g transform="rotate(-2 1 0.62)">
        <rect x={0.52} y={0.45} width={0.96} height={0.32} fill="#f1e6c8" stroke="#bda96d" strokeWidth={0.015} />
        <path d="M.52 .45L.49 .48L.52 .51L.49 .54L.52 .57L.49 .6L.52 .63L.49 .66L.52 .69L.49 .72L.52 .75M1.48 .45L1.51 .48L1.48 .51L1.51 .54L1.48 .57L1.51 .6L1.48 .63L1.51 .66L1.48 .69L1.51 .72L1.48 .75" stroke="#bda96d" strokeWidth={0.012} fill="none" />
      </g>
    </>
  ),
}

/* ---------- Disco ball (2x2): a mirrored sphere on a hook ---------- */
const BALL = { cx: 1, cy: 1.1, r: 0.86 }
function ballTiles() {
  const rnd = rng(7)
  const out: { d: string; fill: string }[] = []
  const rows = 9
  for (let j = 0; j < rows; j++) {
    const p0 = ((-90 + (180 / rows) * j) * Math.PI) / 180
    const p1 = ((-90 + (180 / rows) * (j + 1)) * Math.PI) / 180
    const cols = Math.max(5, Math.round(12 * Math.cos((p0 + p1) / 2)))
    for (let i = 0; i < cols; i++) {
      const t0 = (-Math.PI / 2) + (Math.PI / cols) * i
      const t1 = (-Math.PI / 2) + (Math.PI / cols) * (i + 1)
      const pt = (t: number, p: number) => `${f(BALL.cx + BALL.r * Math.cos(p) * Math.sin(t))} ${f(BALL.cy + BALL.r * Math.sin(p))}`
      const d = `M${pt(t0, p0)}L${pt(t1, p0)}L${pt(t1, p1)}L${pt(t0, p1)}Z`
      const tm = (t0 + t1) / 2
      const pm = (p0 + p1) / 2
      // light from the upper left: brighter where the tile faces it
      const lit = 0.5 - 0.5 * (Math.sin(tm) * 0.7 + Math.sin(pm) * 0.7)
      const base = [
        ['#f4f7ff', '#c8d4ee', '#9aabcf'],
        ['#fff4fa', '#e8c8dc', '#bf93b0'],
        ['#fffbe8', '#ebe0b4', '#c2b27a'],
      ][Math.floor(rnd() * 3 * 0.999)]
      const k = Math.min(2, Math.max(0, Math.round((1 - lit) * 2 + (rnd() - 0.5) * 0.9)))
      out.push({ d, fill: base[k] })
    }
  }
  return out
}
const TILES = ballTiles()

const disco_ball: ItemArtDef = {
  zone: { x: 1.0, y: 1.55, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <clipPath id={`${uid}-ball`}>
          <circle cx={BALL.cx} cy={BALL.cy} r={BALL.r} />
        </clipPath>
        <radialGradient id={`${uid}-glow`} cx={0.35} cy={0.3} r={0.75}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#2a3358" stopOpacity={0.45} />
        </radialGradient>
      </defs>
      {/* hook and cord */}
      <path d="M1 .02V.26" stroke="#4a4f66" strokeWidth={0.05} {...line} />
      <path d="M.93 .12Q1 .02 1.07 .12" stroke="#c9ced9" strokeWidth={0.03} {...line} />
      <circle cx={BALL.cx} cy={BALL.cy} r={BALL.r + 0.02} fill="#2f3550" />
      <g clipPath={`url(#${uid}-ball)`}>
        <rect x={0} y={0.2} width={2} height={1.9} fill="#8a97b8" />
        {TILES.map((t, i) => (
          <path key={i} d={t.d} fill={t.fill} stroke="#6b7690" strokeWidth={0.018} strokeLinejoin="round" />
        ))}
        <circle cx={BALL.cx} cy={BALL.cy} r={BALL.r} fill={`url(#${uid}-glow)`} />
      </g>
      <circle cx={BALL.cx} cy={BALL.cy} r={BALL.r} fill="none" stroke="#2f3550" strokeWidth={0.05} />
      {/* glints */}
      <path d={star(0.62, 0.6, 0.14)} fill="#fff" />
      <path d={star(1.5, 0.44, 0.07)} fill="#fff" opacity={0.9} />
      <Lod1>
        <path d={star(1.7, 0.95, 0.06)} fill="#fff" opacity={0.85} />
        <path d={star(0.38, 1.3, 0.06)} fill="#fff" opacity={0.8} />
      </Lod1>
      {/* a price sticker, half peeled (the weight label) */}
      <g transform="rotate(-7 1 1.55)">
        <rect x={0.52} y={1.38} width={0.96} height={0.34} rx={0.04} fill="#ffe27a" stroke="#a88a1c" strokeWidth={0.02} />
        <path d="M1.48 1.38L1.48 1.72L1.34 1.72Z" fill="#e9c94a" />
      </g>
    </>
  ),
}

/* ---------- Framed photo of the ex (2x3): the ex has been dealt with ---------- */
const FRAME_G = '#d8a93e'
const FRAME_D = '#8a6416'

const frame: ItemArtDef = {
  zone: { x: 1.0, y: 2.44, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-gilt`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#f5d77a" />
          <stop offset="0.5" stopColor={FRAME_G} />
          <stop offset="1" stopColor="#a67a1e" />
        </linearGradient>
        <linearGradient id={`${uid}-sky`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#8ec5e8" />
          <stop offset="1" stopColor="#ffd9a8" />
        </linearGradient>
      </defs>
      <Inked d="M.14 .06H1.86Q1.94 .06 1.94 .14V2.86Q1.94 2.94 1.86 2.94H.14Q.06 2.94 .06 2.86V.14Q.06 .06 .14 .06Z" fill={`url(#${uid}-gilt)`} ink={FRAME_D} />
      {/* carved bevels of the moulding */}
      <rect x={0.2} y={0.2} width={1.6} height={2.6} rx={0.05} fill="none" stroke={FRAME_D} strokeWidth={0.03} opacity={0.7} />
      <rect x={0.14} y={0.14} width={1.72} height={2.72} rx={0.06} fill="none" stroke="#fff3b8" strokeWidth={0.02} opacity={0.7} />
      {[
        [0.16, 0.16],
        [1.84, 0.16],
        [0.16, 2.84],
        [1.84, 2.84],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r={0.08} fill="#f0cc6a" stroke={FRAME_D} strokeWidth={0.025} />
          <circle cx={x} cy={y} r={0.03} fill={FRAME_D} />
        </g>
      ))}
      {/* cream mat and the photograph */}
      <rect x={0.3} y={0.3} width={1.4} height={2.4} rx={0.03} fill="#f6ecd6" stroke="#b9a77d" strokeWidth={0.02} />
      <rect x={0.42} y={0.42} width={1.16} height={1.72} fill={`url(#${uid}-sky)`} stroke="#6b5a3a" strokeWidth={0.025} />
      <path d="M.42 1.72Q1 1.5 1.58 1.7V2.14H.42Z" fill="#8cbf7a" />
      <path d="M.42 1.86Q1 1.7 1.58 1.88V2.14H.42Z" fill="#6aa65c" />
      <circle cx={1.3} cy={0.66} r={0.12} fill="#fff1b0" opacity={0.9} />
      {/* the happy couple: she is fine */}
      <path d="M.5 2.14C.5 1.7 .6 1.5 .86 1.46C1.06 1.5 1.12 1.7 1.12 2.14Z" fill="#5a77c9" stroke="#2a3a78" strokeWidth={0.025} strokeLinejoin="round" />
      <circle cx={0.8} cy={1.2} r={0.2} fill="#f2c7a1" stroke="#8a5a36" strokeWidth={0.025} />
      <path d="M.58 1.2C.54 .94 .78 .9 .94 .96C1.06 1.0 1.04 1.12 1.02 1.2C.96 1.04 .78 1.02 .58 1.2Z" fill="#5a3320" stroke="#2f1a10" strokeWidth={0.02} strokeLinejoin="round" />
      <path d="M.73 1.24H.74M.87 1.24H.88" stroke="#2f1a10" strokeWidth={0.04} {...line} />
      <path d="M.72 1.32Q.8 1.38 .9 1.31" stroke="#a23a3a" strokeWidth={0.025} {...line} />
      {/* ... the ex has been scribbled out in thick black marker, with a doodled moustache for good measure */}
      <path d="M1.12 2.14C1.12 1.74 1.2 1.54 1.38 1.5C1.56 1.54 1.6 1.74 1.58 2.14Z" fill="#8a8a96" stroke="#3a3a46" strokeWidth={0.02} strokeLinejoin="round" />
      <circle cx={1.36} cy={1.2} r={0.19} fill="#cfcfd8" />
      <path d="M1.14 1.0L1.6 1.08L1.14 1.16L1.6 1.24L1.14 1.32L1.6 1.4L1.16 1.44M1.2 .94L1.58 1.02M1.18 1.1L1.6 1.18M1.2 1.26L1.58 1.34" stroke="#17141c" strokeWidth={0.075} {...line} />
      <path d="M1.22 1.5L1.5 1.58M1.2 1.58L1.5 1.66M1.28 1.72L1.56 1.78" stroke="#17141c" strokeWidth={0.07} {...line} />
      {/* cracked glass */}
      <path d="M.42 .42L.96 .9L.86 1.1L1.2 1.58L1.1 1.86L1.58 2.14" stroke="#fff" strokeWidth={0.02} opacity={0.75} {...line} />
      <path d="M.96 .9L1.3 .8M1.2 1.58L1.48 1.52" stroke="#fff" strokeWidth={0.014} opacity={0.6} {...line} />
      <path d="M.42 .42L.9 .42L.42 .86Z" fill="#fff" opacity={0.2} />
      {/* brass nameplate: the weight prints here */}
      <rect x={0.5} y={2.3} width={1.0} height={0.28} rx={0.03} fill="#e6d49e" stroke="#6b5a2c" strokeWidth={0.025} />
      <circle cx={0.56} cy={2.44} r={0.018} fill="#6b5a2c" />
      <circle cx={1.44} cy={2.44} r={0.018} fill="#6b5a2c" />
    </>
  ),
}

/* ---------- Deflated flamingo (3x2): a floppy pink pool float, valve open ---------- */
const PINK = '#f27ba0'
const PINK_D = '#d1527a'
const PINK_L = '#ffb7cd'
const PINK_INK = '#7a2646'
const BODY =
  'M1.3 1.16C1.28 .86 1.64 .7 2.04 .72C2.5 .74 2.84 .9 2.94 1.1C2.98 1.34 2.94 1.58 2.8 1.76C2.54 1.94 2.0 1.98 1.66 1.9C1.36 1.82 1.3 1.46 1.3 1.16Z'
const NECK = 'M1.62 1.34C1.1 1.4 .78 1.4 .56 1.2C.36 1.0 .5 .78 .58 .62'
const WING = 'M2.0 .78C1.7 .5 1.6 .26 1.9 .12C2.34 -.0 2.9 .24 2.96 .7C2.7 .84 2.3 .9 2.0 .78Z'

const flamingo: ItemArtDef = {
  zone: { x: 2.2, y: 1.54, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-vinyl`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#ffa3bf" />
          <stop offset="0.6" stopColor={PINK} />
          <stop offset="1" stopColor={PINK_D} />
        </linearGradient>
      </defs>
      {/* limp legs trailing out of the body, with webbed feet */}
      {['M1.9 1.86C1.7 1.98 1.3 1.98 1.04 1.9C.84 1.84 .7 1.84 .5 1.9', 'M2.2 1.9C2.0 2.0 1.5 2.0 1.2 1.96'].map((d) => (
        <g key={d}>
          <path d={d} stroke={PINK_INK} strokeWidth={0.115} {...line} />
          <path d={d} stroke={PINK_D} strokeWidth={0.075} {...line} />
        </g>
      ))}
      <path d="M.5 1.9L.3 1.8L.34 1.96L.28 2.0L.5 1.96Z" fill={PINK_D} stroke={PINK_INK} strokeWidth={0.02} strokeLinejoin="round" />
      {/* the folded wing flopped over the back */}
      <Inked d={WING} fill={PINK_D} ink={PINK_INK} w={0.04} />
      <path d="M2.0 .74C2.1 .5 2.4 .36 2.74 .4M2.1 .8C2.3 .62 2.62 .56 2.86 .62" stroke={PINK_L} strokeWidth={0.025} opacity={0.7} {...line} />
      <path d="M1.86 .3C2.2 .18 2.6 .2 2.84 .4" stroke={PINK_INK} strokeWidth={0.02} opacity={0.5} {...line} />
      {/* the long neck, flopped in an S across the lining */}
      <path d={NECK} stroke={PINK_INK} strokeWidth={0.46} {...line} />
      <path d={NECK} stroke={`url(#${uid}-vinyl)`} strokeWidth={0.4} {...line} />
      <path d="M1.6 1.2C1.1 1.26 .82 1.26 .64 1.1C.5 .96 .6 .8 .64 .7" stroke={PINK_L} strokeWidth={0.05} opacity={0.75} {...line} />
      <path d="M1.5 1.52C1.04 1.56 .72 1.54 .46 1.32" stroke={PINK_INK} strokeWidth={0.025} opacity={0.4} {...line} />
      {/* body */}
      <Inked d={BODY} fill={`url(#${uid}-vinyl)`} ink={PINK_INK} w={0.045} />
            <path d="M1.56 1.4C1.7 1.5 1.74 1.62 1.72 1.74M2.5 1.7C2.6 1.64 2.72 1.58 2.8 1.46" stroke={PINK_INK} strokeWidth={0.025} opacity={0.5} {...line} />
      <path d="M1.6 .82C1.8 .72 2.0 .7 2.2 .72" stroke={PINK_L} strokeWidth={0.03} opacity={0.7} {...line} />
      {/* the head: a droopy eyelid and a black-tipped beak pointing at the floor */}
      <circle cx={0.58} cy={0.5} r={0.2} fill={PINK} stroke={PINK_INK} strokeWidth={0.04} />
      <path d="M.44 .56C.26 .56 .2 .72 .3 .9C.34 .98 .44 .94 .48 .84Z" fill="#ffd08a" stroke="#7a4a14" strokeWidth={0.03} strokeLinejoin="round" />
      <path d="M.3 .9C.34 .98 .44 .94 .48 .84L.42 .82Z" fill="#2b2433" />
      <circle cx={0.6} cy={0.46} r={0.065} fill="#fffaf0" stroke={PINK_INK} strokeWidth={0.02} />
      <circle cx={0.61} cy={0.48} r={0.03} fill="#2b2433" />
      <path d="M.53 .42Q.6 .36 .68 .43Z" fill={PINK_D} stroke={PINK_INK} strokeWidth={0.02} strokeLinejoin="round" />
      <path d="M.5 .35C.56 .3 .64 .3 .7 .34" stroke={PINK_L} strokeWidth={0.025} opacity={0.8} {...line} />
      {/* the valve, open, and a sad little puff of air */}
      <circle cx={1.78} cy={1.0} r={0.09} fill="#5aa7e0" stroke="#1d4f7a" strokeWidth={0.03} />
      <circle cx={1.78} cy={1.0} r={0.04} fill="#cfe8fb" stroke="#1d4f7a" strokeWidth={0.015} />
      <Lod1>
        <path d="M1.9 .94C2.0 .88 2.06 .9 2.1 .84M1.92 1.04C2.06 1.0 2.14 1.04 2.22 .98" stroke="#fffaf0" strokeWidth={0.025} opacity={0.9} {...line} />
      </Lod1>
      {/* patch kit sticker (the weight label) */}
      <g transform="rotate(4 2.2 1.52)">
        <rect x={1.72} y={1.36} width={0.96} height={0.34} rx={0.04} fill="#fff6e6" stroke="#b6a77f" strokeWidth={0.018} />
        <path d="M1.72 1.36H2.68V1.42H1.72Z" fill="#f2c94c" />
      </g>
    </>
  ),
}

/* ---------- Feather boa (4x1): a fluffy lilac boa tied with a gold thread ---------- */
const BOA_COLORS = ['#7e57c2', '#9b7bd9', '#b79df0', '#d7c8ff', '#5e3f9e']
const spineY = (x: number) => 0.5 + 0.15 * Math.sin(x * 1.75 + 0.5)
function boaFeathers() {
  const rnd = rng(11)
  const out: { d: string; c: string; w: number }[] = []
  for (let layer = 0; layer < 4; layer++) {
    for (let x = 0.1; x < 3.92; x += 0.035) {
      const y = spineY(x)
      const slope = 0.15 * 1.75 * Math.cos(x * 1.75 + 0.5)
      const nx = -slope / Math.hypot(1, slope)
      const ny = 1 / Math.hypot(1, slope)
      const side = rnd() < 0.5 ? -1 : 1
      const len = 0.2 + rnd() * (layer === 0 ? 0.17 : 0.11)
      const ang = (rnd() - 0.5) * 0.9
      const dx = nx * Math.cos(ang) * side - ny * Math.sin(ang)
      const dy = ny * Math.cos(ang) * side + nx * Math.sin(ang)
      const x1 = x + (rnd() - 0.5) * 0.04
      const ex = x1 + dx * len
      const ey = y + dy * len
      const cx = x1 + dx * len * 0.5 + (rnd() - 0.5) * 0.08
      const cy = y + dy * len * 0.5 + (rnd() - 0.5) * 0.04
      out.push({ d: `M${f(x1)} ${f(y)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(Math.min(0.96, Math.max(0.04, ey)))}`, c: BOA_COLORS[(layer + Math.floor(rnd() * 3)) % 5], w: 0.034 + rnd() * 0.026 })
    }
  }
  return out
}
const FEATHERS = boaFeathers()
const SPINE = (() => {
  let d = ''
  for (let x = 0.14; x <= 3.88; x += 0.1) d += `${d ? 'L' : 'M'}${f(x)} ${f(spineY(x))}`
  return d
})()

const boa: ItemArtDef = {
  zone: { x: 2.0, y: 0.5, tone: 'dark' },
  draw: () => (
    <>
      <path d={SPINE} stroke="#3f2a73" strokeWidth={0.42} {...line} />
      {FEATHERS.map((p, i) => (
        <path key={i} d={p.d} stroke={p.c} strokeWidth={p.w} {...line} />
      ))}
      <path d={SPINE} stroke="#6a4cb4" strokeWidth={0.26} {...line} />
      <path d={SPINE} stroke="#a58be8" strokeWidth={0.06} opacity={0.7} {...line} />
      {/* gold lamé thread winding through it */}
      <path d={SPINE} stroke={GOLD} strokeWidth={0.03} strokeDasharray="0.02 0.07" {...line} />
      <Lod1>
        <path d={star(0.62, 0.34, 0.05)} fill={GOLD} />
        <path d={star(3.3, 0.66, 0.05)} fill={GOLD} />
        <path d={star(1.2, 0.7, 0.04)} fill="#fff" opacity={0.8} />
      </Lod1>
      {/* ribbon tie and a cream care tag: the weight prints on it */}
      <path d="M1.98 .26L2.02 .74" stroke="#d99a2b" strokeWidth={0.1} {...line} />
      <path d="M1.98 .26L2.02 .74" stroke="#f2c261" strokeWidth={0.05} {...line} />
      <g transform="rotate(-4 2.0 0.5)">
        <rect x={1.52} y={0.34} width={0.96} height={0.32} rx={0.03} fill="#fbf1de" stroke="#b9a77d" strokeWidth={0.02} />
        <Lod2>
          <path d="M1.58 .4H1.74" stroke="#c9b894" strokeWidth={0.012} {...line} />
        </Lod2>
      </g>
    </>
  ),
}

/* ---------- Ring light and tripod (T pentomino): the influencer weekend ---------- */
const ringlight: ItemArtDef = {
  zone: { x: 1.5, y: 1.62, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-led`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#fffdf2" />
          <stop offset="1" stopColor="#ffe9a8" />
        </linearGradient>
        <linearGradient id={`${uid}-steel`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset="0" stopColor="#8e95a4" />
          <stop offset="0.35" stopColor="#f0f2f6" />
          <stop offset="1" stopColor="#7a8190" />
        </linearGradient>
      </defs>
      {/* warm glow behind the ring */}
      <ellipse cx={1.5} cy={0.52} rx={1.42} ry={0.46} fill="#ffe9a8" opacity={0.55} />
      {/* the ring, tipped back so it reads as an ellipse: dark casing, LED band, dark hollow with the phone clamp */}
      <Inked d="M1.5 .06C2.3 .06 2.88 .26 2.88 .52C2.88 .78 2.3 .98 1.5 .98C.7 .98 .12 .78 .12 .52C.12 .26 .7 .06 1.5 .06Z" fill="#3a3a48" ink="#14141f" />
      <ellipse cx={1.5} cy={0.52} rx={1.3} ry={0.38} fill={`url(#${uid}-led)`} stroke="#c9a85a" strokeWidth={0.02} />
      <ellipse cx={1.5} cy={0.52} rx={0.94} ry={0.24} fill="#2a2a38" stroke="#14141f" strokeWidth={0.03} />
      <ellipse cx={1.5} cy={0.55} rx={0.84} ry={0.18} fill="#3a3a4c" />
      <Lod2>
        {Array.from({ length: 28 }, (_, i) => {
          const a = (i / 28) * Math.PI * 2
          return <circle key={i} cx={f(1.5 + 1.12 * Math.cos(a))} cy={f(0.52 + 0.31 * Math.sin(a))} r={0.017} fill="#e2b84a" />
        })}
      </Lod2>
      <path d="M.36 .4C.7 .22 1.1 .17 1.5 .17" stroke="#fff" strokeWidth={0.035} opacity={0.8} {...line} />
      {/* phone clamp in the hollow, with its camera eye */}
      <rect x={1.38} y={0.46} width={0.24} height={0.2} rx={0.03} fill="#161620" stroke="#8e95a4" strokeWidth={0.02} />
      <circle cx={1.5} cy={0.56} r={0.04} fill="#3d6a99" stroke="#9fc4e8" strokeWidth={0.015} />
      {/* telescoping stand: a steel pole, then a grip with the label, then a locking collar */}
      <rect x={1.43} y={0.96} width={0.14} height={0.4} fill={`url(#${uid}-steel)`} stroke="#4a4f58" strokeWidth={0.025} />
      <path d="M1.4 1.0H1.6" stroke="#2b2f36" strokeWidth={0.04} {...line} />
      <Inked d="M1.1 1.34H1.9Q1.96 1.34 1.96 1.4V1.88Q1.96 1.94 1.9 1.94H1.1Q1.04 1.94 1.04 1.88V1.4Q1.04 1.34 1.1 1.34Z" fill="#434455" ink="#14141f" w={0.03} />
      <rect x={1.1} y={1.44} width={0.8} height={0.36} rx={0.03} fill="#f1e6c8" stroke="#bda96d" strokeWidth={0.015} />
      <path d="M1.12 1.38H1.88" stroke="#fff" strokeWidth={0.02} opacity={0.4} {...line} />
      <rect x={1.4} y={1.92} width={0.2} height={0.1} rx={0.02} fill={`url(#${uid}-steel)`} stroke="#4a4f58" strokeWidth={0.02} />
      {/* tripod legs fanning out to rubber feet */}
      {[
        ['M1.46 2.02L1.14 2.86', 1.14, 2.86],
        ['M1.5 2.02L1.5 2.9', 1.5, 2.9],
        ['M1.54 2.02L1.86 2.86', 1.86, 2.86],
      ].map(([d, x, y]) => (
        <g key={String(d)}>
          <path d={String(d)} stroke="#14141f" strokeWidth={0.13} {...line} />
          <path d={String(d)} stroke="#555768" strokeWidth={0.085} {...line} />
          <path d={String(d)} stroke="#8d90a8" strokeWidth={0.02} {...line} />
          <circle cx={Number(x)} cy={Number(y)} r={0.07} fill="#14141f" />
        </g>
      ))}
      <circle cx={1.5} cy={2.04} r={0.1} fill="#6d7488" stroke="#14141f" strokeWidth={0.03} />
      <Lod1>
        <path d={star(2.6, 0.2, 0.06)} fill="#fff6c0" />
        <path d={star(0.4, 0.8, 0.045)} fill="#fff6c0" />
      </Lod1>
    </>
  ),
}

/* ---------- Louis Regretton handbag (7 cells: a 3x2 body with its handle in the cell above): absurdly expensive ---------- */
const EMER = '#1f8a68'
const EMER_D = '#0e4a37'
const EMER_L = '#6fd1ac'
const BAG_BODY = 'M.12 1.22Q.12 1.1 .26 1.1H2.74Q2.88 1.1 2.88 1.22L2.97 2.62Q2.99 2.94 2.68 2.94H.32Q.01 2.94 .03 2.62Z'

const handbag: ItemArtDef = {
  zone: { x: 1.5, y: 2.34, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        {/* puffy quilted pillows: each pillow is lit at its upper left */}
        <pattern id={`${uid}-quilt`} width={0.34} height={0.34} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={0.34} height={0.34} fill={EMER} />
          <rect x={0.02} y={0.02} width={0.3} height={0.3} rx={0.1} fill={EMER_L} opacity={0.5} />
          <rect x={0.07} y={0.07} width={0.2} height={0.2} rx={0.07} fill={EMER} opacity={0.55} />
          <path d="M0 0H.34M0 0V.34" stroke={EMER_D} strokeWidth={0.026} />
        </pattern>
        <linearGradient id={`${uid}-gold`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#fff4bf" />
          <stop offset="0.45" stopColor="#f0cc5e" />
          <stop offset="1" stopColor="#a8821f" />
        </linearGradient>
        <linearGradient id={`${uid}-shade`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.16} />
          <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#031a12" stopOpacity={0.4} />
        </linearGradient>
      </defs>
      {/* tissue paper bursting out of the top, because it is that expensive */}
      <path d="M.7 1.14C.76 .86 .92 .78 1.04 .84C1.1 .62 1.4 .56 1.5 .72C1.62 .56 1.9 .62 1.96 .84C2.1 .78 2.26 .86 2.3 1.14Z" fill="#fff6e8" stroke="#b9a77d" strokeWidth={0.03} strokeLinejoin="round" />
      <path d="M1.04 .84C1.08 .96 1.06 1.06 1.0 1.14M1.5 .72C1.52 .9 1.5 1.02 1.46 1.12M1.96 .84C1.92 .96 1.94 1.06 2.0 1.14" stroke="#d8c9a6" strokeWidth={0.02} {...line} />
      {/* a chunky solid-gold hoop handle with bead collars */}
      <path d="M1.02 1.18C1.0 .5 1.18 .1 1.5 .1C1.82 .1 2.0 .5 1.98 1.18" stroke="#5b4a22" strokeWidth={0.2} {...line} />
      <path d="M1.02 1.18C1.0 .5 1.18 .1 1.5 .1C1.82 .1 2.0 .5 1.98 1.18" stroke={`url(#${uid}-gold)`} strokeWidth={0.15} {...line} />
      <path d="M1.07 1.0C1.06 .52 1.2 .2 1.44 .17" stroke="#fffbe0" strokeWidth={0.035} opacity={0.9} {...line} />
      {[1.02, 1.98].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={1.14} rx={0.13} ry={0.08} fill={`url(#${uid}-gold)`} stroke="#5b4a22" strokeWidth={0.03} />
        </g>
      ))}
      {/* body: quilted pillows with a lit top edge and a shaded underside */}
      <Inked d={BAG_BODY} fill={EMER} ink={EMER_D} w={0.045} />
      <path d={BAG_BODY} fill={`url(#${uid}-quilt)`} />
      <path d={BAG_BODY} fill={`url(#${uid}-shade)`} />
      <path d="M.2 1.18H2.8" stroke="#bff0dc" strokeWidth={0.035} opacity={0.8} {...line} />
      <Stitch d="M.2 1.3H2.8M.12 2.82H2.88" color="#c9f0dd" w={0.018} />
      {/* gold zip along the top edge with a ridiculous coin pull */}
      <path d="M.3 1.2H2.7" stroke="#5b4a22" strokeWidth={0.06} {...line} />
      <path d="M.3 1.2H2.7" stroke={GOLD} strokeWidth={0.035} strokeDasharray="0.03 0.03" {...line} />
      <path d="M2.7 1.2L2.8 1.5" stroke="#5b4a22" strokeWidth={0.03} {...line} />
      <circle cx={2.8} cy={1.58} r={0.12} fill={`url(#${uid}-gold)`} stroke="#5b4a22" strokeWidth={0.03} />
      <circle cx={2.8} cy={1.58} r={0.06} fill="none" stroke="#8a6c1c" strokeWidth={0.02} />
      {/* the giant gold turn-lock with a diamond the size of a grape */}
      <Inked d="M1.22 1.36H1.78Q1.9 1.36 1.9 1.48V1.72Q1.9 1.84 1.78 1.84H1.22Q1.1 1.84 1.1 1.72V1.48Q1.1 1.36 1.22 1.36Z" fill={`url(#${uid}-gold)`} ink="#5b4a22" w={0.04} />
      <path d="M1.5 1.44L1.66 1.58L1.5 1.76L1.34 1.58Z" fill="#d6f4ff" stroke="#3d7a96" strokeWidth={0.025} strokeLinejoin="round" />
      <path d="M1.34 1.58H1.66M1.5 1.44V1.76M1.42 1.5L1.5 1.58L1.58 1.5" stroke="#fff" strokeWidth={0.014} opacity={0.9} {...line} />
      <Lod1>
        <path d={star(1.76, 1.42, 0.06)} fill="#fff" />
        <path d={star(1.2, 1.78, 0.04)} fill="#fff" opacity={0.8} />
      </Lod1>
      {/* gold feet studs along the bottom */}
      {[0.28, 1.0, 2.0, 2.72].map((x) => (
        <circle key={x} cx={x} cy={2.88} r={0.06} fill={`url(#${uid}-gold)`} stroke="#5b4a22" strokeWidth={0.02} />
      ))}
      {/* the receipt: a paper strip as long as the bag, hanging from the side pocket with a torn bottom */}
      <g transform="rotate(5 0.5 2)">
        <path d="M.22 1.5H.78V2.66L.72 2.72L.66 2.66L.6 2.72L.54 2.66L.48 2.72L.42 2.66L.36 2.72L.3 2.66L.22 2.7Z" fill="#fffaf0" stroke="#b6a77f" strokeWidth={0.02} strokeLinejoin="round" />
        <path d="M.28 1.62H.72M.28 1.74H.66M.28 1.86H.7M.28 1.98H.6M.28 2.1H.68" stroke="#cbbfa0" strokeWidth={0.02} {...line} />
        <path d="M.28 2.28H.72" stroke="#2b2433" strokeWidth={0.04} {...line} />
        <Lod1>
          <path d="M.3 2.44H.7M.3 2.54H.52" stroke="#c0392b" strokeWidth={0.05} {...line} />
        </Lod1>
      </g>
      {/* the price tag on a gold string (the weight label sits on it) */}
      <path d="M2.8 1.7C2.84 1.9 2.7 2.0 2.5 2.1" stroke="#8a6c1c" strokeWidth={0.02} {...line} />
      <g transform="rotate(-3 1.5 2.34)">
        <rect x={0.94} y={2.16} width={1.12} height={0.36} rx={0.04} fill="#fffaf0" stroke="#b6a77f" strokeWidth={0.02} />
        <rect x={0.94} y={2.16} width={1.12} height={0.06} fill="#c0392b" />
      </g>
    </>
  ),
}

/* ---------- Mom's Porn Collection (P pentomino): a taped-up box of vintage DVDs, labelled by Mom ---------- */
const KRAFT = '#c99a63'
const KRAFT_D = '#9b6f3a'
const KRAFT_L = '#e1bb86'
const DVD_COLORS = ['#c0392b', '#2f5d9b', '#d9a23a', '#3b8f6e', '#7a4aa8', '#2b2433', '#d86a8a']

const dvds: ItemArtDef = {
  zone: { x: 1.4, y: 1.78, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-cb`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor={KRAFT_L} />
          <stop offset="1" stopColor={KRAFT} />
        </linearGradient>
        <radialGradient id={`${uid}-disc`} cx={0.35} cy={0.3} r={0.9}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.35" stopColor="#bfe3ff" />
          <stop offset="0.6" stopColor="#f3c9ff" />
          <stop offset="1" stopColor="#9bb3d6" />
        </radialGradient>
      </defs>
      {/* the DVDs standing in the open box: a row of coloured spines */}
      <rect x={0.12} y={0.08} width={1.76} height={0.62} rx={0.04} fill="#3a2a1a" />
      {DVD_COLORS.concat(DVD_COLORS).slice(0, 11).map((c, i) => (
        <g key={i} transform={`rotate(${((i * 37) % 7) - 3} ${0.2 + i * 0.15} 0.4)`}>
          <rect x={0.16 + i * 0.15} y={0.06} width={0.13} height={0.58} rx={0.015} fill={c} stroke="#14101a" strokeWidth={0.015} />
          <path d={`M${0.19 + i * 0.15} .14V.5`} stroke="#fff" strokeWidth={0.014} opacity={0.5} {...line} />
          <rect x={0.17 + i * 0.15} y={0.1} width={0.11} height={0.05} fill="#fff6e6" opacity={0.9} />
        </g>
      ))}
      {/* the cardboard box: open flaps, a front panel and shipping tape */}
      <Inked d="M.06 .62H1.94V2.0Q1.94 2.08 1.86 2.08H.14Q.06 2.08 .06 2.0Z" fill={`url(#${uid}-cb)`} ink={KRAFT_D} w={0.04} />
      <path d="M.06 .62L.02 .52L.2 .44M1.94 .62L1.98 .52L1.8 .44" stroke={KRAFT_D} strokeWidth={0.03} {...line} />
      <path d="M.06 .62H1.94" stroke="#fff3d6" strokeWidth={0.025} opacity={0.6} {...line} />
      <path d="M.1 1.9H1.9" stroke={KRAFT_D} strokeWidth={0.025} opacity={0.4} {...line} />
      <rect x={0.84} y={0.62} width={0.32} height={0.44} fill="#f0e2c4" opacity={0.75} />
      {/* Mom's own handwriting: MOM'S on a strip of masking tape, and the big marker label */}
      <g transform="rotate(-3 1 .84)">
        <rect x={0.34} y={0.7} width={1.32} height={0.24} fill="#f1e6c8" stroke="#bda96d" strokeWidth={0.015} />
        <text x={1.0} y={0.89} textAnchor="middle" fontFamily="'Marker Felt','Segoe Print','Bradley Hand',cursive" fontWeight={700} fontSize={0.2} fill="#2b2433" textLength={0.9}>
          MOM&apos;S
        </text>
      </g>
      <text x={1.0} y={1.52} textAnchor="middle" fontFamily="'Arial Black','Helvetica Neue',Impact,sans-serif" fontWeight={900} fontSize={0.5} fill="#1a1620" stroke="#1a1620" strokeWidth={0.015} textLength={1.5} lengthAdjust="spacingAndGlyphs">
        PORN
      </text>
      <Lod1>
        <path d="M.3 1.62H1.7" stroke="#1a1620" strokeWidth={0.03} opacity={0.5} {...line} />
      </Lod1>
      {/* a shipping label printed with a weight (the label zone) */}
      <g transform="rotate(2 1.4 1.78)">
        <rect x={0.94} y={1.64} width={0.92} height={0.34} rx={0.03} fill="#fffaf0" stroke="#b6a77f" strokeWidth={0.018} />
      </g>
      {/* spilled out of the box: a leaning stack of cases and a loose disc */}
      <g transform="rotate(-8 0.5 2.5)">
        <rect x={0.14} y={2.12} width={0.74} height={0.78} rx={0.04} fill="#2f5d9b" stroke="#14101a" strokeWidth={0.03} />
        <rect x={0.2} y={2.2} width={0.62} height={0.3} fill="#fff6e6" opacity={0.9} />
        <text x={0.51} y={2.43} textAnchor="middle" fontFamily="'Arial Black',Impact,sans-serif" fontWeight={900} fontSize={0.19} fill="#2f5d9b">
          DVD
        </text>
        <rect x={0.14} y={2.12} width={0.1} height={0.78} fill="#1f4372" />
      </g>
      <g transform="rotate(5 0.6 2.4)">
        <rect x={0.2} y={2.02} width={0.7} height={0.2} rx={0.03} fill="#c0392b" stroke="#14101a" strokeWidth={0.025} />
        <path d="M.28 2.12H.72" stroke="#fff6e6" strokeWidth={0.03} {...line} />
      </g>
      <circle cx={0.66} cy={2.66} r={0.2} fill={`url(#${uid}-disc)`} stroke="#6b7690" strokeWidth={0.025} />
      <circle cx={0.66} cy={2.66} r={0.055} fill="#fff6e6" stroke="#6b7690" strokeWidth={0.02} />
      <path d="M.52 2.56Q.62 2.48 .74 2.5" stroke="#fff" strokeWidth={0.03} opacity={0.9} {...line} />
    </>
  ),
}

export const LEVEL2_ART: Record<string, ItemArtDef> = { outfit, heels, handbag, dvds, vibrator, speaker, disco_ball, frame, flamingo, boa, ringlight }
export { INK }
