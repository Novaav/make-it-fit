import { Contact, Inked, Lod1, Stitch, line, type ItemArtDef } from './kit'

/*
 * Level 3 artwork. Same rules as Level 1 and 2 (see STYLE.md): cell units, lit from the upper left, hand-inked outline,
 * one material cue plus one small joke per item, the top-left of each item's first cell kept calm for the Chaos stamp,
 * and a plain label zone for the printed weight.
 */

/* ---------- Hotel Painting (3x3, MUST): a gilt-framed sunset with a chipped corner, a torn hanger, a room tag and an inventory sticker ---------- */
const GILT = '#d9aa4a'
const GILT_D = '#8f6414'
const GILT_L = '#f6dd8e'
const FRAME_INK = '#4a2f0a'
const PANEL = 'M.14 .04H2.86Q2.96 .04 2.96 .14V2.86Q2.96 2.96 2.86 2.96H.14Q.04 2.96 .04 2.86V.14Q.04 .04 .14 .04Z'

const painting: ItemArtDef = {
  zone: { x: 1.38, y: 2.7, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-gilt`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor={GILT_L} />
          <stop offset="0.5" stopColor={GILT} />
          <stop offset="1" stopColor="#a97a1e" />
        </linearGradient>
        <linearGradient id={`${uid}-sky`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#7a5fc4" />
          <stop offset="0.45" stopColor="#ff7f8e" />
          <stop offset="0.75" stopColor="#ffb36b" />
          <stop offset="1" stopColor="#ffd98a" />
        </linearGradient>
        <linearGradient id={`${uid}-sea`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#3f8fc8" />
          <stop offset="1" stopColor="#1f4f86" />
        </linearGradient>
        <clipPath id={`${uid}-canvas`}>
          <rect x={0.42} y={0.42} width={2.16} height={1.92} rx={0.03} />
        </clipPath>
      </defs>
      <Contact d={PANEL} />
      <Inked d={PANEL} fill={`url(#${uid}-gilt)`} ink={FRAME_INK} w={0.05} />
      {/* moulded frame: a raised bead line, an inner bevel, and simple corner rosettes */}
      <path d="M.2 .2H2.8V2.8H.2Z" fill="none" stroke={GILT_D} strokeWidth={0.025} strokeDasharray="0.05 0.04" opacity={0.75} />
      <path d="M.3 .3H2.7V2.46H.3Z" fill="#f2e6c8" stroke={GILT_D} strokeWidth={0.04} />
      {[
        [2.7, 0.3],
        [2.7, 2.7],
        [0.3, 2.7],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r={0.1} fill={GILT_L} stroke={GILT_D} strokeWidth={0.025} />
          <circle cx={x} cy={y} r={0.04} fill={GILT_D} />
        </g>
      ))}
      {/* the picture: a very orange sunset, a sailing boat, one palm tree, birds, a signature */}
      <g clipPath={`url(#${uid}-canvas)`}>
        <rect x={0.42} y={0.42} width={2.16} height={1.92} fill={`url(#${uid}-sky)`} />
        <circle cx={1.55} cy={1.35} r={0.42} fill="#ffe27a" stroke="#f3a43a" strokeWidth={0.03} />
        <rect x={0.42} y={1.38} width={2.16} height={0.96} fill={`url(#${uid}-sea)`} />
        <path d="M1.2 1.55H1.9M1.28 1.68H1.82M1.34 1.82H1.76M1.4 1.96H1.7" stroke="#ffe27a" strokeWidth={0.04} {...line} />
        <path d="M.5 1.62Q.9 1.55 1.3 1.62M1.9 1.75Q2.2 1.7 2.55 1.77M.6 2.1Q1.1 2.02 1.6 2.1" stroke="#7fb8e6" strokeWidth={0.025} opacity={0.7} {...line} />
        <path d="M2.0 1.3L2.0 .72L2.38 1.3ZM2.0 1.32H2.46L2.36 1.46H2.04Z" fill="#fff6e6" stroke="#4a2a5a" strokeWidth={0.02} strokeLinejoin="round" />
        <path d="M2.0 .72V1.32" stroke="#4a2a5a" strokeWidth={0.025} />
        <path d="M.62 1.62Q.6 1.1 .72 .8" stroke="#3a1f4a" strokeWidth={0.05} {...line} />
        <path d="M.72 .8Q.5 .72 .4 .84M.72 .8Q.78 .62 .98 .64M.72 .8Q.98 .78 1.08 .96M.72 .8Q.6 .96 .5 1.0" stroke="#2a3f2a" strokeWidth={0.05} {...line} />
        <path d="M1.0 .62q.05-.06 .1 0q.05-.06 .1 0M1.3 .5q.05-.06 .1 0q.05-.06 .1 0" stroke="#3a1f4a" strokeWidth={0.02} {...line} />
        <path d="M2.0 2.2Q2.12 2.12 2.2 2.22T2.4 2.2" stroke="#fff6e6" strokeWidth={0.02} {...line} />
        <path d="M0 0L3 3" stroke="#fff" strokeWidth={0.25} opacity={0.0} />
        <path d="M.42 1.2L1.2 .42H1.55L.42 1.55Z" fill="#fff" opacity={0.18} />
      </g>
      <path d="M.3 .3H2.7V2.46H.3Z" fill="none" stroke={FRAME_INK} strokeWidth={0.025} opacity={0.6} />
      {/* the chipped corner: bare wood and a few splinters */}
      <path d="M.04 2.42L.3 2.56L.2 2.7L.46 2.78L.38 2.96H.04Z" fill="#5a3a1c" stroke={FRAME_INK} strokeWidth={0.025} strokeLinejoin="round" />
      <path d="M.1 2.62L.2 2.56M.14 2.8L.28 2.78" stroke="#c89a5a" strokeWidth={0.025} {...line} />
      <path d="M.52 2.86l.07-.04.03.07z" fill={GILT_L} stroke={GILT_D} strokeWidth={0.012} />
      {/* brass plate: where the weight is printed */}
      <rect x={0.72} y={2.56} width={1.34} height={0.3} rx={0.04} fill="#f2dc92" stroke={GILT_D} strokeWidth={0.03} />
      {/* torn hanger: a steel bracket with a lump of wall still attached, and the wire */}
      <path d="M.36 .36L1.5 .1L2.64 .36" stroke="#3a3a42" strokeWidth={0.02} opacity={0.75} {...line} />
      <path d="M1.18 .04L1.34 .1L1.5 .03L1.68 .1L1.84 .04L1.78 .24L1.64 .32L1.5 .26L1.36 .34L1.22 .24Z" fill="#fbf7ee" stroke="#b6ad98" strokeWidth={0.02} strokeLinejoin="round" />
      <rect x={1.34} y={0.08} width={0.32} height={0.14} rx={0.025} fill="#9aa0ac" stroke="#3a3f4a" strokeWidth={0.02} />
      <circle cx={1.4} cy={0.15} r={0.025} fill="#3a3f4a" />
      <circle cx={1.6} cy={0.15} r={0.025} fill="#3a3f4a" />
      {/* inventory sticker with a barcode */}
      <rect x={2.2} y={2.54} width={0.62} height={0.34} rx={0.025} fill="#fffaf0" stroke="#c4b48a" strokeWidth={0.015} />
      <rect x={2.2} y={2.54} width={0.62} height={0.08} rx={0.02} fill="#e8602c" />
      <path d="M2.26 2.68V2.84M2.3 2.68V2.84M2.36 2.68V2.84M2.4 2.68V2.84M2.46 2.68V2.84M2.5 2.68V2.84M2.58 2.68V2.84M2.62 2.68V2.84M2.68 2.68V2.84M2.74 2.68V2.84M2.78 2.68V2.84" stroke="#2b2433" strokeWidth={0.016} />
    </>
  ),
}

/* ---------- Laundry bag (3x2, MUST): a canvas sack on its side, hotel towels spilling from its open mouth ---------- */
const CANVAS = '#efe5cf'
const CANVAS_D = '#cbbb98'
const NAVY = '#2f4a7d'
const BAG = 'M.74 .4C1.2 .08 2.3 .0 2.75 .26Q3.0 .6 2.96 1Q3.02 1.45 2.74 1.76C2.3 2.02 1.2 1.94 .74 1.62Q.6 1.45 .6 1Q.6 .58 .74 .4Z'

const laundry: ItemArtDef = {
  zone: { x: 1.95, y: 1.02, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <pattern id={`${uid}-weave`} width={0.06} height={0.06} patternUnits="userSpaceOnUse">
          <path d="M0 .03H.06M.03 0V.06" stroke={CANVAS_D} strokeWidth={0.008} opacity={0.5} />
        </pattern>
        <pattern id={`${uid}-terry`} width={0.07} height={0.07} patternUnits="userSpaceOnUse">
          <circle cx={0.02} cy={0.02} r={0.012} fill="#d8d4c8" />
          <circle cx={0.055} cy={0.05} r={0.012} fill="#d8d4c8" />
        </pattern>
        <linearGradient id={`${uid}-belly`} x1={0} y1={0} x2={0.2} y2={1}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#5b4a2a" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <Contact d={BAG} />
      {/* towels spilling out of the open mouth: three stacked folds, the top one with a gold monogram */}
      <g>
        <Inked d="M.06 1.36Q.04 1.2 .2 1.18H.82V1.7H.2Q.06 1.68 .06 1.5Z" fill="#f4f1ea" ink="#6b6a62" w={0.035} />
        <path d="M.1 1.5H.8" stroke="#8aa4c8" strokeWidth={0.04} />
        <Inked d="M.1 .96Q.08 .8 .24 .78H.84V1.28H.24Q.1 1.26 .1 1.1Z" fill="#fbfaf6" ink="#6b6a62" w={0.035} />
        <path d="M.14 1.14H.82" stroke="#8aa4c8" strokeWidth={0.04} />
        <Inked d="M.14 .6Q.12 .44 .3 .42H.86V.88H.3Q.14 .86 .14 .7Z" fill="#fffefb" ink="#6b6a62" w={0.035} />
        <circle cx={0.52} cy={0.66} r={0.13} fill="none" stroke="#d9aa4a" strokeWidth={0.03} />
        <path d="M.45 .59V.73M.59 .59V.73M.45 .66H.59" stroke="#d9aa4a" strokeWidth={0.035} {...line} />
        <path d="M.18 .46H.84M.18 .58H.4M.66 .58H.84" stroke="#f0eee6" strokeWidth={0.02} opacity={0.9} {...line} />
      </g>
      <Inked d={BAG} fill={CANVAS} ink="#5c4a28" w={0.045} />
      <path d={BAG} fill={`url(#${uid}-weave)`} />
      {/* navy bands round the sack and loose stitching at the mouth */}
      <path d="M1.35 .06Q1.5 1 1.35 1.96M2.5 .08Q2.67 1 2.5 1.9" stroke={NAVY} strokeWidth={0.2} opacity={0.9} {...line} />
      <path d="M1.35 .06Q1.5 1 1.35 1.96M2.5 .08Q2.67 1 2.5 1.9" stroke="#fff" strokeWidth={0.02} strokeDasharray="0.05 0.05" opacity={0.6} {...line} />
      <path d="M.7 .44Q.78 1 .7 1.6" stroke="#6b5a36" strokeWidth={0.035} opacity={0.6} {...line} />
      <path d={BAG} fill={`url(#${uid}-belly)`} />
      {/* the slack drawstring, a toggle and a sewn label patch for the weight */}
      <path d="M.72 .5C.9 .7 .8 .9 .92 1.2C1.0 1.4 .86 1.6 .96 1.78" stroke="#22304e" strokeWidth={0.07} {...line} />
      <path d="M.72 .5C.9 .7 .8 .9 .92 1.2C1.0 1.4 .86 1.6 .96 1.78" stroke="#4a6aa8" strokeWidth={0.035} {...line} />
      <circle cx={0.96} cy={1.8} r={0.055} fill="#d9a441" stroke="#6a4a12" strokeWidth={0.015} />
      <rect x={1.6} y={0.68} width={0.7} height={0.68} rx={0.05} fill="#fbf6ea" stroke="#c4b48a" strokeWidth={0.02} />
      <Stitch d="M1.65 .73H2.25V1.31H1.65Z" color={NAVY} w={0.014} dash="0.04 0.035" />
      <Lod1>
        <path d="M1.84 .43Q1.96 .38 2.06 .43" stroke="#7a5a3a" strokeWidth={0.02} {...line} />
        <ellipse cx={2.7} cy={1.5} rx={0.1} ry={0.07} fill="#8a6a46" opacity={0.3} />
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

/* ---------- Overpriced Heels (3x2 U): a pair of patent stilettos soles-up (red lacquer soles), a price tag hung between them ---------- */
const SOLE =
  'M.5 .05C.72 .1 .9 .42 .9 .75C.9 1 .72 1.1 .7 1.3C.68 1.55 .8 1.75 .66 1.9Q.5 1.98 .34 1.9C.2 1.75 .32 1.55 .3 1.3C.28 1.1 .1 1 .1 .75C.1 .42 .28 .1 .5 .05Z'
const HEEL_INK = '#140a10'

const heels: ItemArtDef = {
  zone: { x: 1.5, y: 1.16, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-lacquer`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#f0454a" />
          <stop offset="0.55" stopColor="#d3202a" />
          <stop offset="1" stopColor="#8f0f19" />
        </linearGradient>
        <g id={`${uid}-shoe`}>
          <Contact d={SOLE} />
          <Inked d={SOLE} fill="#1b0f17" ink={HEEL_INK} w={0.05} />
          {/* the red lacquered sole inside a black patent welt */}
          <path d={SOLE} fill={`url(#${uid}-lacquer)`} transform="translate(.5 1) scale(.86 .9) translate(-.5 -1)" />
          <path d="M.32 .3C.4 .16 .55 .12 .66 .2" stroke="#fff" strokeWidth={0.04} opacity={0.75} {...line} />
          <path d="M.24 .8C.34 1.0 .66 1.0 .76 .8" stroke="#8f0f19" strokeWidth={0.025} opacity={0.7} {...line} />
          <path d="M.5 .9l.05.07l-.05.07l-.05-.07z" fill="#f0c860" stroke="#7a5a12" strokeWidth={0.012} />
          {/* the stiletto: a black pin seen end-on with a gold cap, on a patent heel seat */}
          <circle cx={0.5} cy={1.66} r={0.15} fill="#1b0f17" stroke={HEEL_INK} strokeWidth={0.02} />
          <circle cx={0.5} cy={1.66} r={0.06} fill="#f0c860" stroke="#7a5a12" strokeWidth={0.012} />
          <path d="M.42 1.58Q.46 1.54 .52 1.55" stroke="#fff" strokeWidth={0.02} opacity={0.6} {...line} />
        </g>
      </defs>
      <use href={`#${uid}-shoe`} transform="translate(-.02 0) rotate(-5 .5 1)" />
      <use href={`#${uid}-shoe`} transform="translate(3.02 0) scale(-1 1) rotate(-5 .5 1)" />
      {/* a cord ties them together; the hang tag carries the absurd price */}
      <path d="M.78 .95Q1.5 .4 2.22 .95" stroke="#140a10" strokeWidth={0.03} {...line} />
      <g transform="rotate(2 1.5 .8)">
        <rect x={1.12} y={0.36} width={0.76} height={0.96} rx={0.05} fill="#fbf1de" stroke="#b6a77f" strokeWidth={0.02} />
        <circle cx={1.5} cy={0.48} r={0.035} fill="#b6a77f" />
        <text x={1.5} y={0.7} textAnchor="middle" fontSize={0.11} fill="#7a6a58" style={{ fontFamily: 'var(--ui)' }}>
          €2,990
        </text>
        <path d="M1.28 .66H1.72" stroke="#7a6a58" strokeWidth={0.012} />
        <text x={1.5} y={0.94} textAnchor="middle" fontSize={0.2} fontWeight={800} fill="#c8323a" style={{ fontFamily: 'var(--ui)' }}>
          €2,490
        </text>
      </g>
    </>
  ),
}

/* ---------- Hotel lamp (L4): a pleated shade, a brass-collared wooden baluster and a swiped room-key tag ---------- */
const LAMP_SHADE = 'M.08 .92L.3 .12Q.32 .08 .38 .08H1.62Q1.68 .08 1.7 .12L1.92 .92Q1.94 .98 1.86 .98H.14Q.06 .98 .08 .92Z'
const BALUSTER = 'M1.34 .98H1.66V1.32Q1.82 1.5 1.84 1.8Q1.86 2.08 1.68 2.26H1.32Q1.14 2.08 1.16 1.8Q1.18 1.5 1.34 1.32Z'

const hotelLamp: ItemArtDef = {
  zone: { x: 1.5, y: 1.82, tone: 'light' },
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
      <Inked d="M1.1 2.3H1.9Q1.94 2.3 1.94 2.34V2.7Q1.94 2.76 1.88 2.76H1.12Q1.06 2.76 1.06 2.7V2.34Q1.06 2.3 1.1 2.3Z" fill="#5a3418" ink="#24120a" />
      <path d="M1.14 2.37H1.7" stroke="#d9b47c" strokeWidth={0.03} opacity={0.5} {...line} />
      {/* the cord ends in an unplugged plug, still holding a chip of the wall socket */}
      <path d="M1.08 2.62C1.0 2.84 1.06 2.9 1.2 2.9" stroke="#2a1a10" strokeWidth={0.05} {...line} />
      <rect x={1.2} y={2.82} width={0.3} height={0.14} rx={0.04} fill="#2a1a10" stroke="#0e0804" strokeWidth={0.015} />
      <path d="M1.5 2.86H1.62M1.5 2.93H1.62" stroke="#c8c4b8" strokeWidth={0.04} {...line} />
      <path d="M1.64 2.8L1.92 2.82L1.9 2.96L1.7 2.98Z" fill="#f4f1e8" stroke="#a49c88" strokeWidth={0.015} strokeLinejoin="round" />
      <circle cx={1.8} cy={2.89} r={0.025} fill="#8c8678" />
      <Inked d={BALUSTER} fill={`url(#${uid}-wood)`} ink="#24120a" />
      <path d="M1.3 1.45Q1.24 1.8 1.32 2.12" stroke="#e1b98c" strokeWidth={0.035} opacity={0.6} {...line} />
      {/* brass collar and finial */}
      <rect x={1.3} y={0.98} width={0.4} height={0.14} rx={0.03} fill="#e1b04a" stroke="#6a4a12" strokeWidth={0.025} />
      <rect x={1.3} y={2.2} width={0.4} height={0.1} rx={0.03} fill="#e1b04a" stroke="#6a4a12" strokeWidth={0.025} />
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

/* ---------- Marble foot (3x2 U): a statue's foot broken off at the ankle, iron dowel and a museum tag ---------- */
const FOOT =
  'M.12 .06H1.6Q1.8 .08 1.98 .2Q2.3 .28 2.5 .72Q2.58 1.1 2.56 1.55Q2.52 1.95 2.3 1.95H2.24Q2.02 1.95 2.02 1.72Q2 1.36 1.5 1.12Q1 1.36 .98 1.72Q.98 1.95 .78 1.95H.46Q.12 1.95 .08 1.55Q0 1 .12 .06Z'

const ceramicFoot: ItemArtDef = {
  zone: { x: 1.15, y: 0.56, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-marble`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="0.5" stopColor="#e7dfcb" />
          <stop offset="1" stopColor="#9d9279" />
        </linearGradient>
        <clipPath id={`${uid}-foot`}>
          <path d={FOOT} />
        </clipPath>
      </defs>
      <Contact d={FOOT} />
      {/* toes first, so the instep overlaps them: big toe largest, a chipped second toe */}
      {[
        [2.66, 0.8, 0.21, 0.19],
        [2.7, 1.1, 0.15, 0.14],
        [2.68, 1.37, 0.13, 0.12],
        [2.64, 1.6, 0.12, 0.11],
        [2.58, 1.8, 0.1, 0.1],
      ].map(([cx, cy, rx, ry]) => (
        <ellipse key={cy} cx={cx} cy={cy} rx={rx} ry={ry} fill="#f3ecdb" stroke="#3a342a" strokeWidth={0.045} />
      ))}
      <path d="M2.76 1.0l.07.05l-.04.07l.06.04" stroke="#4a4338" strokeWidth={0.02} fill="none" strokeLinejoin="round" />
      <Inked d={FOOT} fill={`url(#${uid}-marble)`} ink="#3a342a" w={0.06} />
      <g clipPath={`url(#${uid}-foot)`}>
        {/* veining and a lit edge */}
        <path d="M.1 .9C.5 .7 .7 1.1 1.2 .8S1.9 .7 2.4 1.1M.2 1.5C.6 1.3 .8 1.7 1.0 1.5M1.6 .3C1.8 .5 1.7 .7 1.95 .85M2.2 1.5C2.4 1.4 2.5 1.6 2.65 1.5" stroke="#8a8f9a" strokeWidth={0.02} opacity={0.5} {...line} />
        <path d="M.3 1.2C.5 1.1 .7 1.3 .9 1.2M1.4 .5C1.55 .55 1.7 .5 1.8 .6" stroke="#b9a98a" strokeWidth={0.014} opacity={0.6} {...line} />
        {/* carved sandal straps */}
        <path d="M.35 .3Q.42 .8 .38 1.3M.62 .3Q.7 .8 .66 1.25" stroke="#6f6757" strokeWidth={0.055} {...line} />
        <path d="M.35 .3Q.42 .8 .38 1.3M.62 .3Q.7 .8 .66 1.25" stroke="#fff" strokeWidth={0.012} opacity={0.8} {...line} />
        <path d="M2.0 .25Q2.1 .7 2.35 .95" stroke="#6f6757" strokeWidth={0.05} {...line} />
        <path d="M.1 1.75Q1.0 1.9 2.1 1.8" stroke="#8d8576" strokeWidth={0.04} opacity={0.35} {...line} />
      </g>
      {[0.94, 1.24, 1.49, 1.7].map((y) => (
        <path key={y} d={`M2.48 ${y}Q2.66 ${y + 0.03} 2.82 ${y - 0.02}`} stroke="#3a342a" strokeWidth={0.03} {...line} />
      ))}
      <path d="M2.72 .68Q2.82 .76 2.74 .88" stroke="#8d8576" strokeWidth={0.03} {...line} />
      {/* the break at the ankle: a flat, crystalline plane with a rusted iron dowel */}
      <path d="M.12 .12L.28 .03L.46 .12L.7 .03L.95 .13L1.2 .04L1.45 .12L1.62 .06L1.82 .16L1.5 .3L.9 .27L.3 .28Z" fill="#b9b09b" stroke="#3a342a" strokeWidth={0.025} strokeLinejoin="round" />
      <rect x={0.7} y={0.1} width={0.14} height={0.12} rx={0.02} fill="#9a5a2a" stroke="#4a2a12" strokeWidth={0.02} />
      <path d="M1.1 .12h.05M1.3 .2h.05M.5 .2h.05" stroke="#8a8372" strokeWidth={0.02} {...line} />
      {/* museum inventory tag tied round the big toe */}
      <path d="M2.55 .88Q2.2 1.1 2.3 1.3" stroke="#6a5a38" strokeWidth={0.025} {...line} />
      <g transform="rotate(-8 2.3 1.5)">
        <rect x={2.08} y={1.3} width={0.44} height={0.5} rx={0.03} fill="#fbf1de" stroke="#b6a77f" strokeWidth={0.02} />
        <circle cx={2.3} cy={1.36} r={0.025} fill="#b6a77f" />
        <text x={2.3} y={1.62} textAnchor="middle" fontSize={0.12} fontWeight={800} fill="#3a2a1a" style={{ fontFamily: 'var(--ui)' }}>
          1847
        </text>
        <path d="M2.14 1.7H2.46" stroke="#b6a77f" strokeWidth={0.015} />
      </g>
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

/* ---------- Badcardi Rum (3x1): an amber añejo in a shouldered bottle, black screw cap, cream label, red foil ---------- */
const BOTTLE = 'M.22 .12H1.68Q1.98 .12 2.1 .26Q2.24 .42 2.46 .42H2.6V.58H2.46Q2.24 .58 2.1 .74Q1.98 .88 1.68 .88H.22Q.1 .88 .1 .76V.24Q.1 .12 .22 .12Z'

const liquor: ItemArtDef = {
  zone: { x: 1.1, y: 0.69, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-glass`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#f0b255" />
          <stop offset="0.4" stopColor="#c0701f" />
          <stop offset="1" stopColor="#64300b" />
        </linearGradient>
      </defs>
      <Contact d={BOTTLE} />
      <Inked d={BOTTLE} fill={`url(#${uid}-glass)`} ink="#3a1a06" w={0.04} />
      {/* embossed glass: a shoulder ring, a base ring, a lit edge */}
      <path d="M1.92 .2Q2.02 .5 1.92 .8M.2 .8H.5M.2 .2H.5" stroke="#6a3410" strokeWidth={0.03} opacity={0.6} {...line} />
      <path d="M.28 .17H1.6" stroke="#fff" strokeWidth={0.04} opacity={0.55} {...line} />
      <path d="M.3 .83H1.6" stroke="#ffd38a" strokeWidth={0.02} opacity={0.5} {...line} />
      {/* a cream label with a red border: BADCARDI, RUM, an aged-rum star line, a gold seal; the weight sits at the bottom */}
      <rect x={0.5} y={0.16} width={1.3} height={0.68} rx={0.035} fill="#f6ead0" stroke="#7a2a22" strokeWidth={0.03} />
      <rect x={0.56} y={0.22} width={1.18} height={0.56} rx={0.02} fill="none" stroke="#c8453b" strokeWidth={0.015} />
      <text x={1.15} y={0.43} textAnchor="middle" textLength={1.0} lengthAdjust="spacingAndGlyphs" fontSize={0.19} fontWeight={800} fill="#1c1514" style={{ fontFamily: 'var(--ui)' }}>
        BADCARDI
      </text>
      <path d="M.7 .5H.9M1.4 .5H1.6" stroke="#c8453b" strokeWidth={0.02} {...line} />
      <text x={1.15} y={0.545} textAnchor="middle" fontSize={0.1} fontWeight={800} letterSpacing={0.05} fill="#7a2a22" style={{ fontFamily: 'var(--ui)' }}>
        ★ RUM ★
      </text>
      <circle cx={0.7} cy={0.67} r={0.055} fill="#d9aa4a" stroke="#7a5a12" strokeWidth={0.012} />
      {/* shoulder sticker, red foil on the neck, a black screw cap with ridges and a gold ring */}
      <circle cx={1.94} cy={0.64} r={0.09} fill="#2f6fc4" stroke="#fff" strokeWidth={0.02} />
      <path d="M1.94 .57l.02.05h.05l-.04.03.02.05l-.05-.03l-.05.03l.02-.05l-.04-.03h.05z" fill="#ffd23a" />
      <path d="M2.32 .4Q2.38 .5 2.32 .6" stroke="#c8323a" strokeWidth={0.1} {...line} />
      <rect x={2.58} y={0.4} width={0.36} height={0.2} rx={0.03} fill="#1c1514" stroke="#0a0706" strokeWidth={0.02} />
      <rect x={2.56} y={0.4} width={0.05} height={0.2} rx={0.015} fill="#d9aa4a" stroke="#7a5a12" strokeWidth={0.012} />
      <path d="M2.68 .42V.58M2.74 .42V.58M2.8 .42V.58M2.86 .42V.58" stroke="#3a3432" strokeWidth={0.02} {...line} />
      <path d="M2.62 .43H2.9" stroke="#fff" strokeWidth={0.015} opacity={0.5} {...line} />
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
  painting,
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
