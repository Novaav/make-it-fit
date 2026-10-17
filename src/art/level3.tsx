import { Contact, Inked, Lod1, Stitch, line, type ItemArtDef } from './kit'

/*
 * Level 3 artwork. Same rules as Level 1 and 2 (see STYLE.md): cell units, lit from the upper left, hand-inked outline,
 * one material cue plus one small joke per item, the top-left of each item's first cell kept calm for the Chaos stamp,
 * and a plain label zone for the printed weight.
 */

/* ---------- Cardboard cutout (5x4, MUST): a kraft standee of a very pleased man, arms out, on a folded foot ---------- */
const KRAFT = '#d3a967'
const KRAFT_D = '#a87c3d'
const KRAFT_L = '#ecd09a'
const KRAFT_INK = '#5b3b14'
const SUIT = '#34456f'
const CUT =
  'M.12 .03H4.88Q4.97 .03 4.97 .12V.94Q4.97 1 4.9 1H3.0V3H3.88Q3.97 3 3.97 3.09V3.88Q3.97 3.97 3.88 3.97H1.12Q1.03 3.97 1.03 3.88V3.09Q1.03 3 1.12 3H2V1H.1Q.03 1 .03 .94V.12Q.03 .03 .12 .03Z'

const cutout: ItemArtDef = {
  zone: { x: 2.5, y: 3.58, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <pattern id={`${uid}-flute`} width={0.09} height={0.09} patternUnits="userSpaceOnUse">
          <path d="M0 .045H.09" stroke={KRAFT_D} strokeWidth={0.012} opacity={0.35} />
        </pattern>
        <linearGradient id={`${uid}-print`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.2} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#10162c" stopOpacity={0.22} />
        </linearGradient>
      </defs>
      <Contact d={CUT} />
      <Inked d={CUT} fill={KRAFT} ink={KRAFT_INK} w={0.045} />
      <path d={CUT} fill={`url(#${uid}-flute)`} />
      {/* printed face: arms band, jacket, tie, trousers */}
      <path d="M.13 .58H4.87Q4.94 .58 4.94 .66V.86Q4.94 .93 4.87 .93H.13Q.06 .93 .06 .86V.66Q.06 .58 .13 .58Z" fill={SUIT} stroke="#161d36" strokeWidth={0.025} />
      <path d="M2.05 .93H2.95V2.02H2.05Z" fill={SUIT} stroke="#161d36" strokeWidth={0.025} />
      <path d="M2.05 2.02H2.48V3H2.05ZM2.52 2.02H2.95V3H2.52Z" fill="#3b3d4c" stroke="#161d36" strokeWidth={0.02} />
      <path d="M2.25 .93L2.5 1.35L2.75 .93Z" fill="#fbf6ea" />
      <path d="M2.5 1.0L2.58 1.14L2.55 1.72L2.5 1.82L2.45 1.72L2.42 1.14Z" fill="#d64a3f" stroke="#7a1f1a" strokeWidth={0.015} strokeLinejoin="round" />
      <path d="M2.05 .93L2.3 1.5L2.2 2.02M2.95 .93L2.7 1.5L2.8 2.02" stroke="#1d2744" strokeWidth={0.02} {...line} />
      <path d="M2.12 1.2h.1v.08h-.1z" fill="#fbf6ea" />
      <path d="M2.05 1.98H2.95" stroke="#1a1d2a" strokeWidth={0.05} {...line} />
      {/* sleeves, cuffs and thumbs-up hands */}
      <path d="M.52 .6V.92M4.48 .6V.92" stroke="#1d2744" strokeWidth={0.02} {...line} />
      <circle cx={0.2} cy={0.76} r={0.13} fill="#f0c4a0" stroke="#7a4b2c" strokeWidth={0.02} />
      <circle cx={4.8} cy={0.76} r={0.13} fill="#f0c4a0" stroke="#7a4b2c" strokeWidth={0.02} />
      <path {...line} d="M0.2 .66V.5Q.2 .42 .26 .45L.28 .62M4.8 .66V.5Q4.8 .42 4.74 .45L4.72 .62" stroke="#7a4b2c" strokeWidth={0.02} fill="#f0c4a0" />
      {/* head: smug grin, big hair, ears */}
      <circle cx={2.2} cy={0.34} r={0.06} fill="#e7b690" stroke="#7a4b2c" strokeWidth={0.015} />
      <circle cx={2.8} cy={0.34} r={0.06} fill="#e7b690" stroke="#7a4b2c" strokeWidth={0.015} />
      <ellipse cx={2.5} cy={0.32} rx={0.3} ry={0.28} fill="#f3c9a4" stroke="#7a4b2c" strokeWidth={0.025} />
      <path d="M2.2 .26C2.22 .06 2.5 .02 2.62 .06C2.74 .08 2.82 .14 2.8 .26C2.7 .16 2.5 .12 2.2 .26Z" fill="#4a2f1b" stroke="#2a1a0e" strokeWidth={0.02} strokeLinejoin="round" />
      <path d="M2.36 .36h.01M2.64 .36h.01" stroke="#2a1a0e" strokeWidth={0.06} {...line} />
      <path d="M2.34 .44Q2.5 .58 2.66 .44Z" fill="#fff" stroke="#7a2a22" strokeWidth={0.02} strokeLinejoin="round" />
      <path d="M2.3 .27Q2.36 .23 2.42 .26M2.58 .26Q2.64 .23 2.7 .27" stroke="#2a1a0e" strokeWidth={0.02} {...line} />
      <path d={CUT} fill={`url(#${uid}-print)`} opacity={0.5} />
      {/* shoes and the folded stand: corrugated edge, crease, tape, 'this way up' arrows */}
      <path d="M1.95 2.9Q1.95 2.78 2.1 2.8H2.46V3.14H1.95ZM3.05 2.9Q3.05 2.78 2.9 2.8H2.54V3.14H3.05Z" fill="#2a2430" stroke="#120e16" strokeWidth={0.02} />
      <path d="M1.1 3.06H3.9" stroke={KRAFT_D} strokeWidth={0.03} strokeDasharray="0.07 0.05" {...line} />
      <path d="M1.1 3.82H3.9" stroke={KRAFT_D} strokeWidth={0.04} {...line} />
      <path d="M1.14 3.88Q1.3 3.78 1.46 3.88T1.78 3.88T2.1 3.88T2.42 3.88T2.74 3.88T3.06 3.88T3.38 3.88T3.7 3.88T3.86 3.88" stroke={KRAFT_D} strokeWidth={0.025} opacity={0.8} {...line} />
      <path d="M1.4 3.75V3.28M1.4 3.28L1.28 3.42M1.4 3.28L1.52 3.42M3.6 3.75V3.28M3.6 3.28L3.48 3.42M3.6 3.28L3.72 3.42" stroke="#c4453a" strokeWidth={0.06} {...line} />
      <rect x={3.15} y={0.97} width={0.7} height={0.16} rx={0.02} fill="#f3e6a8" opacity={0.75} transform="rotate(-8 3.5 1.05)" />
      <Lod1>
        <path d="M.1 .08L.3 .03L.22 .16Z" fill={KRAFT_L} stroke={KRAFT_D} strokeWidth={0.012} />
        <rect x={3.2} y={3.2} width={0.55} height={0.3} rx={0.02} fill="#fbf6ea" stroke="#b6a77f" strokeWidth={0.012} />
        <path d="M3.26 3.26V3.44M3.3 3.26V3.44M3.36 3.26V3.44M3.4 3.26V3.44M3.48 3.26V3.44M3.54 3.26V3.44M3.6 3.26V3.44M3.66 3.26V3.44M3.7 3.26V3.44" stroke="#2b2433" strokeWidth={0.02} />
      </Lod1>
    </>
  ),
}

/* ---------- Laundry bag (3x2, MUST): a canvas drawstring sack on its side, a stray sock escaping ---------- */
const CANVAS = '#efe5cf'
const CANVAS_D = '#cbbb98'
const NAVY = '#2f4a7d'
const BAG = 'M.62 .4C1.1 .08 2.3 .0 2.75 .26Q3.0 .6 2.96 1Q3.02 1.45 2.74 1.76C2.3 2.02 1.1 1.94 .62 1.62Q.5 1.45 .5 1Q.5 .58 .62 .4Z'
const NECK = 'M.05 .62Q.3 .5 .66 .4V1.62Q.3 1.5 .05 1.38Q-.02 1 .05 .62Z'

const laundry: ItemArtDef = {
  zone: { x: 1.9, y: 1.02, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <pattern id={`${uid}-weave`} width={0.06} height={0.06} patternUnits="userSpaceOnUse">
          <path d="M0 .03H.06M.03 0V.06" stroke={CANVAS_D} strokeWidth={0.008} opacity={0.5} />
        </pattern>
        <linearGradient id={`${uid}-belly`} x1={0} y1={0} x2={0.2} y2={1}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#5b4a2a" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <Contact d={BAG} />
      <Contact d={NECK} />
      {/* the sock that escaped */}
      <path d="M.18 1.42Q.1 1.62 .22 1.84Q.4 1.98 .58 1.86Q.6 1.7 .48 1.52Z" fill="#e9a0b8" stroke="#8a3a56" strokeWidth={0.03} strokeLinejoin="round" />
      <path d="M.2 1.62Q.35 1.7 .5 1.62M.26 1.78Q.4 1.84 .55 1.76" stroke="#fbf1de" strokeWidth={0.05} {...line} />
      <Inked d={NECK} fill={CANVAS} ink="#5c4a28" />
      <Inked d={BAG} fill={CANVAS} ink="#5c4a28" w={0.045} />
      <path d={BAG} fill={`url(#${uid}-weave)`} />
      <path d={NECK} fill={`url(#${uid}-weave)`} />
      {/* navy bands round the sack and the gathers at the neck */}
      <path d="M1.2 .06Q1.35 1 1.2 1.96M2.45 .08Q2.62 1 2.45 1.9" stroke={NAVY} strokeWidth={0.2} opacity={0.9} {...line} />
      <path d="M1.2 .06Q1.35 1 1.2 1.96M2.45 .08Q2.62 1 2.45 1.9" stroke="#fff" strokeWidth={0.02} strokeDasharray="0.05 0.05" opacity={0.6} {...line} />
      <path d="M.18 .66Q.3 1 .18 1.34M.3 .58Q.42 1 .3 1.42M.42 .5Q.54 1 .42 1.5" stroke="#6b5a36" strokeWidth={0.022} opacity={0.55} {...line} />
      <path d={BAG} fill={`url(#${uid}-belly)`} />
      {/* drawstring: a cord pulled tight, a bow, toggle and dangling ends */}
      <path d="M.66 .42Q.72 1 .66 1.6" stroke="#22304e" strokeWidth={0.1} {...line} />
      <path d="M.66 .42Q.72 1 .66 1.6" stroke="#4a6aa8" strokeWidth={0.05} {...line} />
      <path d="M.66 1.0C.5 .86 .36 .9 .4 1.02C.44 1.12 .58 1.06 .66 1.0ZM.66 1.0C.5 1.14 .36 1.12 .4 1.0" fill="#4a6aa8" stroke="#22304e" strokeWidth={0.025} strokeLinejoin="round" />
      <path d="M.66 1.02C.6 1.2 .5 1.3 .42 1.32M.66 1.02C.7 1.2 .62 1.34 .56 1.4" stroke="#22304e" strokeWidth={0.05} {...line} />
      <circle cx={0.42} cy={1.33} r={0.05} fill="#d9a441" stroke="#6a4a12" strokeWidth={0.015} />
      {/* sewn label patch: the weight goes here */}
      <rect x={1.55} y={0.68} width={0.7} height={0.68} rx={0.05} fill="#fbf6ea" stroke="#c4b48a" strokeWidth={0.02} />
      <Stitch d="M1.6 .73H2.2V1.31H1.6Z" color={NAVY} w={0.014} dash="0.04 0.035" />
      <Lod1>
        <path d="M1.78 .43Q1.9 .38 2.0 .43" stroke="#7a5a3a" strokeWidth={0.02} {...line} />
        <ellipse cx={2.7} cy={1.5} rx={0.1} ry={0.07} fill="#8a6a46" opacity={0.3} />
        <path d="M2.62 1.44l.16.1M2.66 1.58l.12-.06" stroke="#8a6a46" strokeWidth={0.015} opacity={0.5} {...line} />
      </Lod1>
    </>
  ),
}

/* ---------- Hangover kit (2x2): a teal first-aid tin with sunglasses, a blister pack and a tired-eye sticker ---------- */
const TEAL = '#3b9c97'
const TIN = 'M.14 .08H1.86Q1.94 .08 1.94 .16V1.84Q1.94 1.92 1.86 1.92H.14Q.06 1.92 .06 1.84V.16Q.06 .08 .14 .08Z'

const hangover: ItemArtDef = {
  zone: { x: 1.42, y: 1.58, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-tin`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#6fc9c2" />
          <stop offset="0.55" stopColor={TEAL} />
          <stop offset="1" stopColor="#1f5e5c" />
        </linearGradient>
      </defs>
      <Contact d={TIN} />
      <Inked d={TIN} fill={`url(#${uid}-tin)`} ink="#133a39" />
      <path d="M.1 .28H1.9" stroke="#133a39" strokeWidth={0.03} opacity={0.5} {...line} />
      <path d="M.1 .32H1.9" stroke="#bff0ea" strokeWidth={0.015} opacity={0.6} {...line} />
      <path d="M.2 .14H1.1" stroke="#fff" strokeWidth={0.035} opacity={0.5} {...line} />
      {[0.2, 1.8].flatMap((x) => [0.2, 1.8].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={0.035} fill="#bff0ea" stroke="#133a39" strokeWidth={0.012} />))}
      {/* white cross on a round badge */}
      <circle cx={0.62} cy={0.88} r={0.38} fill="#fbf6ea" stroke="#133a39" strokeWidth={0.03} />
      <path d="M.5 .66H.74V.76H.84V1H.74V1.1H.5V1H.4V.76H.5Z" fill="#d6483c" stroke="#7a1f1a" strokeWidth={0.02} strokeLinejoin="round" />
      {/* sunglasses hooked over the top right corner */}
      <path d="M1.05 .52Q1.2 .46 1.35 .5" stroke="#1c1722" strokeWidth={0.05} {...line} />
      <ellipse cx={1.2} cy={0.7} rx={0.24} ry={0.19} fill="#1c1722" stroke="#0a070d" strokeWidth={0.02} transform="rotate(-8 1.2 .7)" />
      <ellipse cx={1.68} cy={0.66} rx={0.24} ry={0.19} fill="#1c1722" stroke="#0a070d" strokeWidth={0.02} transform="rotate(-8 1.68 .66)" />
      <path d="M1.42 .68Q1.44 .62 1.46 .68" stroke="#1c1722" strokeWidth={0.05} {...line} />
      <path d="M1.08 .62Q1.16 .56 1.26 .6M1.56 .58Q1.64 .53 1.74 .56" stroke="#9ad3ee" strokeWidth={0.035} opacity={0.8} {...line} />
      {/* blister pack of pills */}
      <rect x={0.2} y={1.4} width={0.72} height={0.4} rx={0.05} fill="#e4e8ee" stroke="#6b7482" strokeWidth={0.02} />
      {[0.34, 0.53, 0.72].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={1.6} rx={0.08} ry={0.1} fill="#fbf6ea" stroke="#8a93a2" strokeWidth={0.015} />
          <path d={`M${x - 0.03} 1.56Q${x} 1.52 ${x + 0.03} 1.56`} stroke="#fff" strokeWidth={0.015} {...line} />
        </g>
      ))}
      {/* the weight label: a stuck paper tag */}
      <rect x={1.0} y={1.38} width={0.8} height={0.42} rx={0.04} fill="#fbf1de" stroke="#b6a77f" strokeWidth={0.015} transform="rotate(-3 1.46 1.58)" />
      <Lod1>
        <path d="M.5 1.22Q.6 1.3 .7 1.22" stroke="#7a3a8a" strokeWidth={0.03} {...line} />
      </Lod1>
    </>
  ),
}

/* ---------- Red-soled heels (3x2 U): a pair of patent stilettos tied together by a gold chain and a padlock ---------- */
const HEEL_INK = '#1a1018'
const SHOE_L =
  'M.5 .03C.7 .1 .88 .42 .9 .7C.92 .95 .74 1.05 .72 1.25C.7 1.5 .78 1.75 .66 1.9Q.5 1.98 .34 1.9C.22 1.75 .3 1.5 .28 1.25C.26 1.05 .08 .95 .1 .7C.12 .42 .3 .1 .5 .03Z'

const heels: ItemArtDef = {
  zone: { x: 1.5, y: 0.99, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-gloss`} x1={0} y1={0} x2={1} y2={0.4}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="0.3" stopColor="#fff" stopOpacity={0.05} />
          <stop offset="1" stopColor="#000" stopOpacity={0.25} />
        </linearGradient>
        <g id={`${uid}-shoe`}>
          {/* the stiletto: a slim black pin with a red tip lift and a gold cap, below the heel cup */}
          <path d="M.5 1.42V1.93" stroke="#0e070d" strokeWidth={0.14} {...line} />
          <path d="M.5 1.42V1.93" stroke="#2a1d2a" strokeWidth={0.08} {...line} />
          <path d="M.47 1.5V1.85" stroke="#fff" strokeWidth={0.015} opacity={0.6} {...line} />
          <path d="M.5 1.93V1.97" stroke="#e6bd55" strokeWidth={0.09} {...line} />
          <g transform="translate(0 .04) scale(1 .76)">
          <Contact d={SHOE_L} />
          <Inked d={SHOE_L} fill="#2a1d2a" ink={HEEL_INK} w={0.045} />
          <path d={SHOE_L} fill={`url(#${uid}-gloss)`} />
          {/* the foot opening lined in red, a pointed toe cap seam, the ankle strap with a buckle and the stiletto tip */}
          <path d="M.5 .74C.68 .78 .74 .98 .68 1.18Q.5 1.34 .32 1.18C.26 .98 .32 .78 .5 .74Z" fill="#c8323a" stroke={HEEL_INK} strokeWidth={0.03} strokeLinejoin="round" />
          <path d="M.34 .84Q.5 .8 .66 .84" stroke="#ff8a8f" strokeWidth={0.025} opacity={0.7} {...line} />
          <path d="M.14 .6Q.5 .5 .86 .6" stroke="#0e070d" strokeWidth={0.03} {...line} />
          <path d="M.3 1.5H.7" stroke="#0e070d" strokeWidth={0.1} {...line} />
          <path d="M.3 1.5H.7" stroke="#c8323a" strokeWidth={0.05} {...line} />
          <rect x={0.44} y={1.44} width={0.12} height={0.12} rx={0.02} fill="#e6bd55" stroke="#6a4a12" strokeWidth={0.02} />
          <path d="M.34 .16C.4 .1 .5 .08 .56 .1" stroke="#fff" strokeWidth={0.035} opacity={0.8} {...line} />
          </g>
        </g>
      </defs>
      <use href={`#${uid}-shoe`} transform="translate(-.07 0) scale(1.14 1) rotate(-7 .5 1)" />
      <use href={`#${uid}-shoe`} transform="translate(3 0) scale(-1 1) translate(-.07 0) scale(1.14 1) rotate(-7 .5 1)" />
      {/* gold chain between the toe boxes, a padlock charm and a hang tag */}
      <path d="M.82 .3Q1.5 .66 2.18 .3" stroke="#6a4a12" strokeWidth={0.075} {...line} />
      <path d="M.82 .3Q1.5 .66 2.18 .3" stroke="#e6bd55" strokeWidth={0.045} strokeDasharray="0.06 0.03" {...line} />
      <rect x={1.36} y={0.4} width={0.28} height={0.22} rx={0.04} fill="#e6bd55" stroke="#6a4a12" strokeWidth={0.025} />
      <path {...line} d="M1.42 .4V.34Q1.5 .22 1.58 .34V.4" fill="none" stroke="#6a4a12" strokeWidth={0.04} />
      <circle cx={1.5} cy={0.52} r={0.03} fill="#6a4a12" />
      <path d="M1.5 .62V.7" stroke="#6a4a12" strokeWidth={0.02} {...line} />
      <rect x={1.08} y={0.7} width={0.84} height={0.58} rx={0.05} fill="#fbf1de" stroke="#b6a77f" strokeWidth={0.02} transform="rotate(2 1.5 .95)" />
      <circle cx={1.5} cy={0.76} r={0.025} fill="#b6a77f" />
    </>
  ),
}

/* ---------- Hotel lamp (L4): a pleated shade, a brass-collared wooden baluster and a swiped room-key tag ---------- */
const LAMP_SHADE = 'M.08 .92L.3 .12Q.32 .08 .38 .08H1.62Q1.68 .08 1.7 .12L1.92 .92Q1.94 .98 1.86 .98H.14Q.06 .98 .08 .92Z'
const BALUSTER = 'M1.34 .98H1.66V1.32Q1.82 1.5 1.84 1.8Q1.86 2.1 1.68 2.3H1.32Q1.14 2.1 1.16 1.8Q1.18 1.5 1.34 1.32Z'

const hotelLamp: ItemArtDef = {
  zone: { x: 1.5, y: 1.85, tone: 'light' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-wood`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset="0" stopColor="#8a5a34" />
          <stop offset="0.35" stopColor="#6a4020" />
          <stop offset="1" stopColor="#3f2410" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx={0.5} cy={0.9} r={0.7}>
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset="1" stopColor="#f6dc86" />
        </radialGradient>
      </defs>
      <Contact d={LAMP_SHADE} />
      <Contact d={BALUSTER} />
      {/* base block and baluster */}
      <Inked d="M1.0 2.34H2.0Q2.02 2.34 2.02 2.38V2.88Q2.02 2.94 1.96 2.94H1.04Q.98 2.94 .98 2.88V2.38Q.98 2.34 1.0 2.34Z" fill="#5a3418" ink="#24120a" />
      <path d="M1.06 2.42H1.7" stroke="#d9b47c" strokeWidth={0.03} opacity={0.5} {...line} />
      <Inked d={BALUSTER} fill={`url(#${uid}-wood)`} ink="#24120a" />
      <path d="M1.3 1.45Q1.24 1.8 1.32 2.12" stroke="#e1b98c" strokeWidth={0.035} opacity={0.6} {...line} />
      {/* brass collar and finial */}
      <rect x={1.3} y={0.98} width={0.4} height={0.14} rx={0.03} fill="#e1b04a" stroke="#6a4a12" strokeWidth={0.025} />
      <rect x={1.3} y={2.22} width={0.4} height={0.1} rx={0.03} fill="#e1b04a" stroke="#6a4a12" strokeWidth={0.025} />
      <path d="M1.34 1.02H1.6" stroke="#fff3b0" strokeWidth={0.02} {...line} />
      {/* the shade: a lit pleated drum with a bright inner rim */}
      <Inked d={LAMP_SHADE} fill="#f3e6c4" ink="#6a5428" />
      <path d={LAMP_SHADE} fill={`url(#${uid}-glow)`} opacity={0.65} />
      <path d="M.14 .96H1.86" stroke="#c9a85c" strokeWidth={0.07} opacity={0.8} {...line} />
      <path d="M.3 .12L.2 .92M.55 .08L.5 .95M.8 .08L.78 .95M1.05 .08L1.05 .95M1.3 .08L1.32 .95M1.55 .08L1.6 .95M1.72 .12L1.82 .92" stroke="#b79b5a" strokeWidth={0.018} opacity={0.65} {...line} />
      <path d="M.36 .13H1.56" stroke="#fff" strokeWidth={0.035} opacity={0.75} {...line} />
      <Stitch d="M.16 .9H1.84" color="#9c7c36" w={0.014} />
      {/* braided cord and a swiped room-key tag */}
      <path d="M1.7 1.4Q2.0 1.6 1.92 2.0" stroke="#3a2a1a" strokeWidth={0.04} {...line} />
      <path d="M1.7 1.2L1.9 1.45" stroke="#6a4a12" strokeWidth={0.02} {...line} />
      <g transform="rotate(8 1.85 1.62)">
        <rect x={1.7} y={1.42} width={0.26} height={0.4} rx={0.04} fill="#c8323a" stroke="#6a1018" strokeWidth={0.02} />
        <circle cx={1.83} cy={1.5} r={0.03} fill="#fbf6ea" />
        <path d="M1.75 1.64H1.91M1.75 1.7H1.88" stroke="#fbf6ea" strokeWidth={0.02} {...line} />
      </g>
    </>
  ),
}

/* ---------- Ceramic foot (3x2 U): a delft-glazed reflexology foot, broken off at the ankle ---------- */
const FOOT =
  'M.12 .06H1.6Q1.8 .08 1.98 .2Q2.4 .28 2.66 .72Q2.74 1.1 2.7 1.55Q2.66 1.95 2.4 1.95H2.24Q2.02 1.95 2.02 1.72Q2.0 1.36 1.5 1.12Q1.0 1.36 .98 1.72Q.98 1.95 .78 1.95H.46Q.12 1.95 .08 1.55Q0 1.0 .12 .06Z'
const BLUE = '#2f5aa8'

const ceramicFoot: ItemArtDef = {
  zone: { x: 1.15, y: 0.52, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-glaze`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#e9eef8" />
          <stop offset="1" stopColor="#b9c6de" />
        </linearGradient>
      </defs>
      <Contact d={FOOT} />
      <Inked d={FOOT} fill={`url(#${uid}-glaze)`} ink="#1d3768" w={0.045} />
      {/* toes, in front of the instep: big toe first, each with a painted nail */}
      {[
        [2.8, 0.78, 0.21, 0.19],
        [2.84, 1.1, 0.15, 0.14],
        [2.82, 1.37, 0.13, 0.12],
        [2.78, 1.6, 0.12, 0.11],
        [2.72, 1.8, 0.1, 0.1],
      ].map(([cx, cy, rx, ry]) => (
        <g key={cy}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#f6f8fd" stroke="#1d3768" strokeWidth={0.035} />
          <path d={`M${cx + rx * 0.35} ${cy - ry * 0.5}Q${cx + rx * 0.9} ${cy} ${cx + rx * 0.35} ${cy + ry * 0.5}Z`} fill="#d6483c" opacity={0.9} />
        </g>
      ))}
      {/* the broken ankle: a gold repair line (kintsugi) across the top */}
      <path d="M.14 .1H1.58Q1.7 .1 1.8 .16" stroke="#d9a93e" strokeWidth={0.07} {...line} />
      <path d="M.2 .09H1.2" stroke="#fff3b0" strokeWidth={0.02} {...line} />
      {/* cobalt vine and flowers, reflexology zone lines */}
      <path d="M.2 1.0Q.5 .7 .85 .85T1.45 .62Q1.9 .5 2.3 .8" stroke={BLUE} strokeWidth={0.04} {...line} />
      <path d="M.2 1.4Q.6 1.2 .9 1.5" stroke={BLUE} strokeWidth={0.03} {...line} />
      {[
        [0.45, 0.78],
        [1.6, 0.55],
        [0.38, 1.55],
        [2.35, 0.86],
        [2.5, 1.45],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={x} cy={y - 0.09} rx={0.05} ry={0.08} fill={BLUE} transform={`rotate(${a} ${x} ${y})`} />
          ))}
          <circle cx={x} cy={y} r={0.04} fill="#f4d36b" />
        </g>
      ))}
      <path d="M2.0 1.0Q2.4 1.3 2.8 1.2M2.1 1.4H2.7" stroke="#8aa4d6" strokeWidth={0.02} strokeDasharray="0.04 0.04" {...line} />
      <path d="M1.2 .22Q1.3 .5 1.15 .75M1.9 .28Q1.8 .5 1.95 .7" stroke="#aebbd6" strokeWidth={0.012} opacity={0.8} {...line} />
      <path d="M.2 .2Q.5 .14 .9 .18" stroke="#fff" strokeWidth={0.04} opacity={0.9} {...line} />
      <Lod1>
        <path d="M.9 1.1l.1.12l.12-.08M2.55 1.2l.08.1" stroke="#8aa4d6" strokeWidth={0.012} {...line} />
      </Lod1>
    </>
  ),
}

/* ---------- Concrete garden gnome (2x3): chipped red hat, mossy base, a casting seam, a tiny mushroom ---------- */
const CONCRETE = '#a6a299'
const CONCRETE_D = '#7c786f'
const CONCRETE_L = '#cfcbc1'
const GNOME_BODY = 'M.34 1.7H1.66Q1.9 2.3 1.84 2.7H.16Q.1 2.3 .34 1.7Z'
const HAT = 'M1.04 .03C1.18 .1 1.5 .55 1.82 .98Q1.84 1.08 1.74 1.08H.26Q.16 1.08 .18 .98C.5 .55 .86 .1 1.04 .03Z'
const BEARD = 'M.28 1.18Q.2 1.7 .46 2.12Q.52 2.35 .7 2.28Q.8 2.5 1.0 2.4Q1.2 2.5 1.3 2.28Q1.48 2.35 1.54 2.12Q1.8 1.7 1.72 1.18Q1.0 1.34 .28 1.18Z'

const gnome: ItemArtDef = {
  zone: { x: 1.0, y: 1.9, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <pattern id={`${uid}-grit`} width={0.14} height={0.14} patternUnits="userSpaceOnUse">
          <circle cx={0.03} cy={0.04} r={0.011} fill="#5d5a52" opacity={0.55} />
          <circle cx={0.1} cy={0.09} r={0.008} fill="#fff" opacity={0.5} />
          <circle cx={0.07} cy={0.13} r={0.009} fill="#5d5a52" opacity={0.4} />
        </pattern>
        <linearGradient id={`${uid}-stone`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.28} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#2b2820" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      {/* grass and moss plinth */}
      <path d="M.04 2.7Q.5 2.6 1 2.66T1.96 2.7V2.9Q1.96 2.97 1.88 2.97H.12Q.04 2.97 .04 2.9Z" fill="#6f9a48" stroke="#2f4a1c" strokeWidth={0.04} strokeLinejoin="round" />
      <path d="M.2 2.7l.04-.16.06.16M.5 2.68l.05-.2.07.2M1.4 2.68l.04-.18.06.18M1.7 2.7l.05-.16.05.16" stroke="#3f6a26" strokeWidth={0.035} {...line} />
      <Contact d={GNOME_BODY} />
      {/* boots */}
      <Inked d="M.3 2.48Q.3 2.4 .4 2.4H.9Q.96 2.4 .96 2.48V2.66H.3Z" fill={CONCRETE_D} ink="#3e3b34" />
      <Inked d="M1.04 2.48Q1.04 2.4 1.1 2.4H1.6Q1.7 2.4 1.7 2.48V2.66H1.04Z" fill={CONCRETE_D} ink="#3e3b34" />
      {/* faded blue coat, belt and buckle */}
      <Inked d={GNOME_BODY} fill="#5f86ad" ink="#233a55" />
      <path d={GNOME_BODY} fill={`url(#${uid}-grit)`} />
      <path d="M.2 2.2H1.8" stroke="#1d1a17" strokeWidth={0.12} {...line} />
      <rect x={0.86} y={2.12} width={0.28} height={0.18} rx={0.03} fill="#d9a441" stroke="#6a4a12" strokeWidth={0.02} />
      {/* mushroom held in the right hand */}
      <path d="M1.48 2.2Q1.46 2.02 1.6 2.0Q1.76 2.02 1.74 2.2Z" fill="#d6483c" stroke="#7a1f1a" strokeWidth={0.025} strokeLinejoin="round" />
      <circle cx={1.55} cy={2.1} r={0.025} fill="#fbf6ea" />
      <circle cx={1.65} cy={2.14} r={0.02} fill="#fbf6ea" />
      <path d="M1.58 2.2V2.3" stroke="#e9dcc0" strokeWidth={0.05} {...line} />
      <circle cx={1.55} cy={2.33} r={0.09} fill="#e8b48a" stroke="#7a4b2c" strokeWidth={0.025} />
      <circle cx={0.45} cy={2.33} r={0.09} fill="#e8b48a" stroke="#7a4b2c" strokeWidth={0.025} />
      {/* concrete beard and moustache, nose, eyes under the brim */}
      <Inked d={BEARD} fill={CONCRETE_L} ink="#4d4a42" />
      <path d={BEARD} fill={`url(#${uid}-grit)`} />
      <path d="M.46 1.5Q.62 1.62 .8 1.46Q.9 1.5 1.0 1.44Q1.1 1.5 1.2 1.46Q1.38 1.62 1.54 1.5Q1.5 1.34 1.0 1.3Q.5 1.34 .46 1.5Z" fill="#ddd9cf" stroke="#4d4a42" strokeWidth={0.025} strokeLinejoin="round" />
      <path d="M.6 1.9Q.7 2.1 .65 2.2M1.4 1.9Q1.3 2.1 1.35 2.2M1.0 1.75V2.2" stroke="#8c887e" strokeWidth={0.02} opacity={0.7} {...line} />
      <circle cx={1.0} cy={1.2} r={0.15} fill="#e58e86" stroke="#7a2f2a" strokeWidth={0.03} />
      <path d="M.92 1.14Q.95 1.1 .99 1.12" stroke="#fff" strokeWidth={0.02} opacity={0.8} {...line} />
      <path d="M.7 1.0h.1M1.2 1.0h.1" stroke="#2b2820" strokeWidth={0.06} {...line} />
      {/* the hat: red paint chipped to bare concrete */}
      <Contact d={HAT} />
      <Inked d={HAT} fill="#c8453b" ink="#5a1712" w={0.045} />
      <path d="M.3 .84Q.34 .7 .5 .64L.46 .86ZM1.3 .5L1.46 .58L1.36 .68ZM1.5 .86L1.64 .8L1.7 .92Z" fill={CONCRETE} stroke="none" />
      <path d={HAT} fill={`url(#${uid}-grit)`} />
      <path d="M.2 1.0Q1 1.1 1.8 1.0" stroke="#7a2a22" strokeWidth={0.05} opacity={0.6} {...line} />
      <path d="M.9 .16Q.8 .4 .62 .62" stroke="#ff9a8e" strokeWidth={0.035} opacity={0.7} {...line} />
      {/* casting seam, hairline crack and moss on the left shoulder */}
      <path d="M1.0 1.08V1.2M1.0 2.3V2.66" stroke={CONCRETE_D} strokeWidth={0.02} opacity={0.7} {...line} />
      <path d="M.5 2.3L.58 2.42L.54 2.56" stroke="#4d4a42" strokeWidth={0.015} {...line} />
      <path d="M.18 2.0Q.3 1.9 .4 2.02Q.3 2.12 .18 2.06Z" fill="#6f9a48" opacity={0.85} />
      <path d={GNOME_BODY} fill={`url(#${uid}-stone)`} opacity={0.5} />
      <path d={BEARD} fill={`url(#${uid}-stone)`} opacity={0.5} />
    </>
  ),
}

/* ---------- Wheel of cheese (2x2): a waxed rind, a wedge already gone and one very small mouse ---------- */
const WHEEL = 'M1 .08A.92 .92 0 1 1 1 1.92A.92 .92 0 1 1 1 .08Z'
const WEDGE = 'M1 1L1.62 .3A.92 .92 0 0 1 1.9 1.1Z'

const cheese: ItemArtDef = {
  zone: { x: 0.8, y: 1.38, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <radialGradient id={`${uid}-dome`} cx={0.35} cy={0.3} r={0.9}>
          <stop offset="0" stopColor="#ffe98a" />
          <stop offset="0.6" stopColor="#f2c64a" />
          <stop offset="1" stopColor="#d79a28" />
        </radialGradient>
        <clipPath id={`${uid}-wheel`}>
          <path d={WHEEL} />
        </clipPath>
      </defs>
      <Contact d={WHEEL} />
      {/* wooden board visible through the missing wedge */}
      <Inked d={WHEEL} fill="#c8923f" ink="#5a3a12" w={0.045} />
      <g clipPath={`url(#${uid}-wheel)`}>
        <path d={WEDGE} fill="#a8763a" />
        <path d="M1.2 1.6H1.9M1.0 1.8H1.9" stroke="#87592a" strokeWidth={0.02} opacity={0.7} {...line} />
      </g>
      {/* the wheel itself with the wedge cut out: top, rind rim */}
      <path d="M1 1L1.62 .3A.92 .92 0 1 0 1.9 1.1Z" fill={`url(#${uid}-dome)`} stroke="#5a3a12" strokeWidth={0.045} strokeLinejoin="round" />
      <path {...line} d="M1 .12A.88 .88 0 1 0 1.86 1.2" fill="none" stroke="#c98a22" strokeWidth={0.09} />
      <path {...line} d="M1 .2A.8 .8 0 1 0 1.78 1.2" fill="none" stroke="#fff3b0" strokeWidth={0.02} opacity={0.6} />
      {/* cut faces of the wedge */}
      <path d="M1 1L1.62 .3M1 1L1.9 1.1" stroke="#fff3b0" strokeWidth={0.05} {...line} />
      <path d="M1 1L1.62 .3M1 1L1.9 1.1" stroke="#a8761c" strokeWidth={0.015} {...line} />
      {/* holes */}
      {[
        [0.55, 0.55, 0.11],
        [0.4, 1.1, 0.08],
        [0.9, 0.35, 0.07],
        [0.75, 1.55, 0.1],
        [1.15, 0.7, 0.06],
        [1.35, 1.6, 0.09],
        [0.35, 1.5, 0.06],
      ].map(([x, y, r]) => (
        <g key={`${x}${y}`}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.85} fill="#c08a22" stroke="#8a5e12" strokeWidth={0.02} />
          <path d={`M${x - r * 0.6} ${y - r * 0.2}Q${x - r * 0.3} ${y - r * 0.7} ${x + r * 0.2} ${y - r * 0.6}`} stroke="#fff3b0" strokeWidth={0.015} opacity={0.8} {...line} />
        </g>
      ))}
      {/* a paper label and one small mouse */}
      <rect x={0.58} y={1.2} width={0.46} height={0.34} rx={0.03} fill="#fbf1de" stroke="#b6a77f" strokeWidth={0.015} transform="rotate(-6 .8 1.38)" />
      <ellipse cx={1.55} cy={1.45} rx={0.17} ry={0.11} fill="#9aa0ad" stroke="#40444f" strokeWidth={0.025} />
      <circle cx={1.69} cy={1.38} r={0.075} fill="#9aa0ad" stroke="#40444f" strokeWidth={0.025} />
      <circle cx={1.66} cy={1.32} r={0.04} fill="#e7a3b4" stroke="#40444f" strokeWidth={0.015} />
      <circle cx={1.72} cy={1.39} r={0.012} fill="#1a1a22" />
      <path d="M1.38 1.46Q1.2 1.55 1.22 1.7" stroke="#e7a3b4" strokeWidth={0.03} {...line} />
      <Lod1>
        <path d="M.3 .8Q.4 .72 .5 .8" stroke="#c98a22" strokeWidth={0.02} opacity={0.6} {...line} />
      </Lod1>
    </>
  ),
}

/* ---------- Bottle of local spirit (3x1): amber glass, wax-sealed cork, a chilli floating inside ---------- */
const BOTTLE = 'M.2 .14H1.8Q2.05 .14 2.15 .3Q2.3 .44 2.6 .44Q2.7 .44 2.7 .5Q2.7 .56 2.6 .56Q2.3 .56 2.15 .7Q2.05 .86 1.8 .86H.2Q.1 .86 .1 .76V.24Q.1 .14 .2 .14Z'

const liquor: ItemArtDef = {
  zone: { x: 1.1, y: 0.5, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-glass`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#e9a64c" />
          <stop offset="0.45" stopColor="#b8651d" />
          <stop offset="1" stopColor="#6e330c" />
        </linearGradient>
      </defs>
      <Contact d={BOTTLE} />
      <Inked d={BOTTLE} fill={`url(#${uid}-glass)`} ink="#3a1a06" w={0.04} />
      {/* chilli drifting in the spirit */}
      <path d="M.18 .66Q.35 .74 .56 .66Q.6 .62 .56 .6Q.36 .64 .2 .58Z" fill="#d9362c" stroke="#6a0f0a" strokeWidth={0.02} strokeLinejoin="round" />
      <path d="M.18 .6Q.12 .56 .13 .5" stroke="#3f7a2a" strokeWidth={0.035} {...line} />
      {/* label */}
      <rect x={0.58} y={0.2} width={1.12} height={0.6} rx={0.03} fill="#f4e7c7" stroke="#6a4a22" strokeWidth={0.025} />
      <rect x={0.63} y={0.25} width={1.02} height={0.5} rx={0.02} fill="none" stroke="#9a2a22" strokeWidth={0.02} />
      <path d="M.7 .31H1.58" stroke="#9a2a22" strokeWidth={0.04} {...line} />
      <path d="M.7 .69H1.58" stroke="#9a2a22" strokeWidth={0.02} {...line} />
      <Lod1>
        <path d="M.68 .5l.06-.1l.06.1l.06-.1l.06.1" stroke="#9a2a22" strokeWidth={0.02} {...line} />
      </Lod1>
      {/* neck: twine, red wax seal and cork */}
      <path d="M2.18 .34Q2.24 .5 2.18 .66" stroke="#d9c08c" strokeWidth={0.05} {...line} />
      <path d="M2.34 .44V.56" stroke="#3a1a06" strokeWidth={0.015} />
      <path d="M2.55 .38H2.74Q2.8 .38 2.8 .44V.56Q2.8 .62 2.74 .62H2.55Q2.5 .54 2.52 .5Q2.5 .44 2.55 .38Z" fill="#c7362c" stroke="#6a0f0a" strokeWidth={0.025} strokeLinejoin="round" />
      <path d="M2.68 .62Q2.7 .74 2.64 .8" stroke="#c7362c" strokeWidth={0.05} {...line} />
      <rect x={2.74} y={0.4} width={0.2} height={0.2} rx={0.04} fill="#d6a86a" stroke="#6a4520" strokeWidth={0.025} />
      {/* highlight streaks on the glass */}
      <path d="M.3 .2H1.7" stroke="#fff" strokeWidth={0.035} opacity={0.65} {...line} />
      <path d="M.3 .82H1.6" stroke="#ffd38a" strokeWidth={0.02} opacity={0.5} {...line} />
    </>
  ),
}

/* ---------- Hotel bathrobe (2x3 P): folded white waffle robe, shawl collar, knotted belt, gold crest ---------- */
const ROBE = 'M.12 .06H1.88Q1.96 .06 1.96 .14V1.9Q1.96 1.96 1.9 1.96H1.0V2.86Q1.0 2.94 .92 2.94H.14Q.06 2.94 .06 2.86V.14Q.06 .06 .12 .06Z'

const robe: ItemArtDef = {
  zone: { x: 1.5, y: 1.22, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <pattern id={`${uid}-waffle`} width={0.1} height={0.1} patternUnits="userSpaceOnUse">
          <path d="M0 .05H.1M.05 0V.1" stroke="#c9c6bc" strokeWidth={0.014} opacity={0.75} />
          <circle cx={0.05} cy={0.05} r={0.014} fill="#fff" />
        </pattern>
        <linearGradient id={`${uid}-fold`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.4} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#4a4a58" stopOpacity={0.28} />
        </linearGradient>
      </defs>
      <Contact d={ROBE} />
      <Inked d={ROBE} fill="#f6f4ee" ink="#5a5a66" w={0.045} />
      <path d={ROBE} fill={`url(#${uid}-waffle)`} />
      {/* shawl collar: a rolled, stitched V from the shoulders to the belt */}
      <path d="M.1 .1L1.0 1.2L1.9 .1" stroke="#b8b6ae" strokeWidth={0.2} {...line} />
      <path d="M.1 .1L1.0 1.2L1.9 .1" stroke="#fbfaf6" strokeWidth={0.13} {...line} />
      <path d="M.2 .06L1.0 1.0L1.8 .06" stroke="#d9d6cd" strokeWidth={0.015} {...line} />
      <Stitch d="M.06 .22L1.0 1.34L1.94 .22" color="#9a9890" w={0.014} />
      {/* folded sleeve cuff at the bottom */}
      <path d="M.1 2.42Q.5 2.5 .96 2.42" stroke="#9a9890" strokeWidth={0.025} {...line} />
      <Stitch d="M.12 2.52Q.5 2.6 .94 2.52" color="#9a9890" w={0.014} />
      <path d="M.12 1.96Q.5 2.04 1.0 1.96" stroke="#c9c6bc" strokeWidth={0.03} opacity={0.7} {...line} />
      {/* knotted belt and its dangling ends */}
      <path d="M.08 1.56Q1.0 1.7 1.94 1.5" stroke="#9a9890" strokeWidth={0.15} {...line} />
      <path d="M.08 1.56Q1.0 1.7 1.94 1.5" stroke="#efede6" strokeWidth={0.1} {...line} />
      <path d="M1.0 1.62C.9 1.46 .76 1.5 .8 1.62C.84 1.72 .94 1.68 1.0 1.62ZM1.0 1.62C1.1 1.46 1.24 1.5 1.2 1.62C1.16 1.72 1.06 1.68 1.0 1.62Z" fill="#efede6" stroke="#6b6a62" strokeWidth={0.025} strokeLinejoin="round" />
      <path d="M1.0 1.66Q.94 1.8 .84 1.9M1.0 1.66Q1.08 1.8 1.2 1.88" stroke="#6b6a62" strokeWidth={0.07} {...line} />
      <path d="M1.0 1.66Q.94 1.8 .84 1.9M1.0 1.66Q1.08 1.8 1.2 1.88" stroke="#efede6" strokeWidth={0.04} {...line} />
      {/* gold crest on the breast and a label patch lower right */}
      <circle cx={1.48} cy={0.7} r={0.18} fill="#e1b04a" stroke="#6a4a12" strokeWidth={0.025} />
      <path d="M1.48 .56L1.52 .66L1.62 .67L1.54 .74L1.57 .84L1.48 .78L1.39 .84L1.42 .74L1.34 .67L1.44 .66Z" fill="#fff3b0" stroke="#6a4a12" strokeWidth={0.012} strokeLinejoin="round" />
      <path d={ROBE} fill={`url(#${uid}-fold)`} />
      <Lod1>
        <path d="M.4 2.7Q.5 2.78 .62 2.72" stroke="#c9c6bc" strokeWidth={0.02} {...line} />
      </Lod1>
    </>
  ),
}

/* ---------- Emergency socks (2x1): two mismatched socks, one striped with a darned toe, one polka-dotted ---------- */
const SOCK_A = 'M.14 .07H1.68Q1.94 .07 1.94 .28Q1.94 .48 1.68 .48H.14Q.07 .48 .07 .42V.13Q.07 .07 .14 .07Z'
const SOCK_B = 'M1.86 .53H.32Q.06 .53 .06 .73Q.06 .93 .32 .93H1.86Q1.93 .93 1.93 .87V.59Q1.93 .53 1.86 .53Z'

const socks: ItemArtDef = {
  zone: { x: 1.7, y: 0.73, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <clipPath id={`${uid}-a`}>
          <path d={SOCK_A} />
        </clipPath>
        <clipPath id={`${uid}-b`}>
          <path d={SOCK_B} />
        </clipPath>
        <pattern id={`${uid}-knit`} width={0.05} height={0.05} patternUnits="userSpaceOnUse">
          <path d="M0 0L.025 .05L.05 0" stroke="#fff" strokeWidth={0.008} fill="none" opacity={0.35} />
        </pattern>
      </defs>
      <Contact d={SOCK_A} />
      <Contact d={SOCK_B} />
      {/* A: pink stripes, teal cuff stripes, a darned toe */}
      <Inked d={SOCK_A} fill="#ec8fb0" ink="#8a2f55" />
      <g clipPath={`url(#${uid}-a)`}>
        <rect x={0.07} y={0.07} width={0.5} height={0.42} fill="#fbf6ea" />
        <path d="M.07 .17H.57M.07 .3H.57" stroke="#2f7f7a" strokeWidth={0.06} />
        {[0.72, 0.9, 1.08, 1.26, 1.44].map((x) => (
          <path key={x} d={`M${x} .07V.48`} stroke="#fbf6ea" strokeWidth={0.07} opacity={0.9} />
        ))}
        <path d="M1.12 .16Q1.4 .08 1.46 .28Q1.4 .48 1.12 .4Z" fill="#c95f86" stroke="#8a2f55" strokeWidth={0.02} />
        <path d="M1.66 .16H1.92M1.66 .22H1.92M1.66 .28H1.92M1.66 .34H1.92M1.66 .4H1.92" stroke="#6a4a8a" strokeWidth={0.025} />
        <path d="M.62 .07V.48" stroke="#8a2f55" strokeWidth={0.025} opacity={0.6} />
      </g>
      <path d={SOCK_A} fill={`url(#${uid}-knit)`} />
      <path d="M.2 .12H1.6" stroke="#fff" strokeWidth={0.03} opacity={0.45} {...line} />
      {/* B: teal with cream polka dots, cuff at the right (the weight sits on it) */}
      <Inked d={SOCK_B} fill="#58b6b0" ink="#1d5754" />
      <g clipPath={`url(#${uid}-b)`}>
        {[0.39, 0.61, 0.83, 1.05, 1.27].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 0.82 : 0.64} r={0.055} fill="#fbf6ea" />
        ))}
        <path d="M.9 .6Q.62 .56 .56 .73Q.62 .9 .9 .86Z" fill="#3a8f89" stroke="#1d5754" strokeWidth={0.02} />
        <rect x={1.46} y={0.53} width={0.5} height={0.4} fill="#fbf6ea" />
        <path d="M1.46 .6H1.96M1.46 .86H1.96" stroke="#d6483c" strokeWidth={0.05} />
        <path d="M1.46 .53V.93" stroke="#1d5754" strokeWidth={0.025} opacity={0.6} />
      </g>
      <path d={SOCK_B} fill={`url(#${uid}-knit)`} />
      <path d="M.2 .58H1.4" stroke="#fff" strokeWidth={0.03} opacity={0.4} {...line} />
      <Lod1>
        <path d="M.12 .66Q.2 .6 .28 .66" stroke="#fbf6ea" strokeWidth={0.03} {...line} />
      </Lod1>
    </>
  ),
}

export const LEVEL3_ART: Record<string, ItemArtDef> = {
  cutout,
  laundry,
  hangover,
  heels,
  hotel_lamp: hotelLamp,
  ceramic_foot: ceramicFoot,
  gnome,
  cheese,
  liquor,
  robe,
  emergency_socks: socks,
}
