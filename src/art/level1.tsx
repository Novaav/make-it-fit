import { INK, Inked, Lod1, Lod2, Stitch, line, type ItemArtDef } from './kit'

/* ---------- Passport (1x1) ---------- */
const NAVY = '#2f4b66'
const GOLD = '#e3be5a'
const PAGE = '#f4ebd3'

const passport: ItemArtDef = {
  zone: { x: 0.5, y: 0.79, tone: 'light' },
  draw: () => (
    <>
      <Inked d="M.15 .06H.85Q.94 .06 .94 .15V.85Q.94 .94 .85 .94H.15Q.06 .94 .06 .85V.15Q.06 .06 .15 .06Z" fill={NAVY} ink="#16232f" />
      {/* page block showing along the right and bottom edges */}
      <path d="M.885 .13V.865Q.885 .905 .85 .905H.13V.87H.85Q.86 .87 .86 .85V.13Z" fill={PAGE} stroke="#b9a977" strokeWidth={0.012} />
      {/* spine crease and binding stitches */}
      <path d="M.2 .1V.9" stroke="#1c2f43" strokeWidth={0.025} {...line} />
      <Stitch d="M.145 .13V.87" color="#8fb0cf" />
      {/* gold-foil globe */}
      <g stroke={GOLD} strokeWidth={0.03} {...line}>
        <circle cx={0.54} cy={0.4} r={0.19} />
        <ellipse cx={0.54} cy={0.4} rx={0.085} ry={0.19} strokeWidth={0.022} />
        <path d="M.35 .4H.73M.4 .29H.68M.4 .51H.68" strokeWidth={0.02} />
      </g>
      <Lod1>
        <path d="M.54 .12 .565 .17 .62 .18 .575 .21 .59 .26 .54 .23 .49 .26 .505 .21 .46 .18 .515 .17Z" fill={GOLD} />
      </Lod1>
      {/* quiet foil band: the weight label sits here */}
      <path d="M.24 .685H.82" stroke={GOLD} strokeWidth={0.014} opacity={0.55} {...line} />
      <path d="M.24 .875H.82" stroke={GOLD} strokeWidth={0.014} opacity={0.55} {...line} />
      <Lod1>
        {/* red ribbon bookmark and a doodled smiley on a corner of boarding pass tucked into the cover */}
        <path d="M.66 .87V.935L.69 .91 .72 .935V.87Z" fill="#c9473b" />
        <g transform="rotate(8 .8 .2)">
          <rect x={0.68} y={0.1} width={0.18} height={0.14} rx={0.012} fill="#fbf6e8" stroke="#c7b98e" strokeWidth={0.01} />
          <path d="M.7 .15H.84M.7 .18H.8" stroke="#9b8c62" strokeWidth={0.012} {...line} />
          <circle cx={0.8} cy={0.205} r={0.022} fill="none" stroke="#6b5d3a" strokeWidth={0.01} />
        </g>
      </Lod1>
      <Lod2>
        {/* leatherette grain */}
        <g fill="#8fb0cf" opacity={0.22}>
          {[[0.3, 0.2], [0.42, 0.62], [0.28, 0.55], [0.7, 0.57], [0.6, 0.64], [0.33, 0.7], [0.78, 0.42], [0.25, 0.32]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={0.008} />
          ))}
        </g>
      </Lod2>
    </>
  ),
}

/* ---------- T-shirt (T tetromino: sleeves + torso) ---------- */
const CORAL = '#e8806b'
const CORAL_D = '#c4604c'
const CORAL_INK = '#6b2f2a'
const TEE =
  'M.13 .22C.5 .1 .85 .09 1.14 .09Q1.5 .52 1.86 .09C2.15 .09 2.5 .1 2.87 .22L2.94 .88L1.93 .95L1.93 1.93Q1.5 1.99 1.07 1.93L1.07 .95L.06 .88Z'

const shirt: ItemArtDef = {
  zone: { x: 1.5, y: 1.6, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <pattern id={`${uid}-jersey`} width={0.05} height={0.05} patternUnits="userSpaceOnUse">
          <path d="M0 .025H.05" stroke="#fff" strokeWidth={0.006} opacity={0.18} />
        </pattern>
      </defs>
      <Inked d={TEE} fill={CORAL} ink={CORAL_INK} />
      <path d={TEE} fill={`url(#${uid}-jersey)`} />
      <defs>
        <linearGradient id={`${uid}-torso`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset="0" stopColor="#7a2f26" stopOpacity={0.2} />
          <stop offset="0.35" stopColor="#fff" stopOpacity={0.1} />
          <stop offset="0.7" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="1" stopColor="#7a2f26" stopOpacity={0.22} />
        </linearGradient>
        <linearGradient id={`${uid}-arm`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.16} />
          <stop offset="1" stopColor="#7a2f26" stopOpacity={0.18} />
        </linearGradient>
      </defs>
      <path d="M1.07 .95V1.93Q1.5 1.99 1.93 1.93V.95Z" fill={`url(#${uid}-torso)`} />
      <path d="M.06 .88L.13 .22C.5 .1 .85 .09 1.14 .09L1.1 .95Z" fill={`url(#${uid}-arm)`} />
      <path d="M2.94 .88L2.87 .22C2.5 .1 2.15 .09 1.86 .09L1.9 .95Z" fill={`url(#${uid}-arm)`} />
      {/* set-in sleeve seams from the armpit up to the shoulder, and a soft drag fold across the chest */}
      <Stitch d="M1.09 .93C1.0 .62 1.04 .3 1.14 .12M1.91 .93C2.0 .62 1.96 .3 1.86 .12" color="#fbd2c6" w={0.018} dash="0.04 0.035" />
      <path d="M1.12 1.08C1.3 1.02 1.55 1.1 1.88 1.04" stroke="#fff" strokeWidth={0.03} opacity={0.18} {...line} />
      <path d="M1.12 1.13C1.35 1.08 1.6 1.15 1.88 1.1" stroke={CORAL_D} strokeWidth={0.025} opacity={0.35} {...line} />
      {/* sleeve cuffs */}
      <path d="M.06 .88L.15 .26 .33 .3 .26 .9Z" fill={CORAL_D} opacity={0.55} />
      <path d="M2.94 .88L2.85 .26 2.67 .3 2.74 .9Z" fill={CORAL_D} opacity={0.55} />
      <Stitch d="M.2 .86 .28 .31M2.8 .86 2.72 .31" color="#fbd2c6" />
      {/* fabric shade under the sleeves and along the lower right */}
      <path d="M1.07 .95C.8 .88 .5 .84 .26 .9L.06 .88 .26 .86C.55 .8 .9 .86 1.07 .93Z" fill={CORAL_D} opacity={0.5} />
      <path d="M1.93 .95C2.2 .88 2.5 .84 2.74 .9L2.94 .88 2.74 .86C2.45 .8 2.1 .86 1.93 .93Z" fill={CORAL_D} opacity={0.5} />
      <path d="M1.8 1.0V1.9Q1.5 1.96 1.2 1.9V1.94Q1.5 2 1.93 1.93V.95Z" fill={CORAL_D} opacity={0.35} />
      {/* back of the neck seen inside the collar, then the ribbed collar */}
      <path d="M1.14 .09Q1.5 .52 1.86 .09Q1.5 .24 1.14 .09Z" fill="#a34a3b" />
      <path d="M1.14 .1Q1.5 .54 1.86 .1" stroke="#f7c3b4" strokeWidth={0.12} {...line} />
      <path d="M1.14 .1Q1.5 .54 1.86 .1" stroke="#d98b78" strokeWidth={0.02} strokeDasharray="0.03 0.03" {...line} />
      {/* shoulder seams and wrinkles from the armpits */}
      <path d="M1.14 .11C.9 .16 .7 .22 .45 .3M1.86 .11C2.1 .16 2.3 .22 2.55 .3" stroke={CORAL_D} strokeWidth={0.018} {...line} />
      <path d="M1.1 .93C.95 .78 .8 .72 .62 .68M1.1 .98C.9 .9 .75 .86 .58 .85M1.9 .93C2.05 .78 2.2 .72 2.38 .68M1.9 .98C2.1 .9 2.25 .86 2.42 .85" stroke={CORAL_D} strokeWidth={0.016} opacity={0.8} {...line} />
      <path d="M1.1 1.26Q1.5 1.33 1.9 1.24" stroke="#fff" strokeWidth={0.02} opacity={0.22} {...line} />
      {/* hem with a stitched turn-up */}
      <Stitch d="M1.1 1.82Q1.5 1.89 1.9 1.82" color="#fbd2c6" />
      {/* printed care label inside the hem: the weight sits here */}
      <rect x={1.3} y={1.43} width={0.4} height={0.34} rx={0.03} fill="#fbf1de" stroke="#b9a77d" strokeWidth={0.012} />
      <Lod2>
        <path d="M1.35 1.49H1.65M1.35 1.7H1.6" stroke="#c9b894" strokeWidth={0.012} {...line} />
      </Lod2>
      <Lod1>
        {/* size tag poking out of the collar, and a coffee drip on the sleeve */}
        <rect x={1.43} y={0.16} width={0.14} height={0.1} rx={0.01} fill="#fbf1de" stroke="#b9a77d" strokeWidth={0.008} />
        <circle cx={0.52} cy={0.56} r={0.095} fill="none" stroke="#7a4a2f" strokeWidth={0.025} opacity={0.4} />
        <circle cx={0.52} cy={0.56} r={0.07} fill="#7a4a2f" opacity={0.12} />
        <circle cx={0.66} cy={0.72} r={0.022} fill="#7a4a2f" opacity={0.4} />
      </Lod1>
    </>
  ),
}

/* ---------- Jeans (6x1): folded flat, waistband at the left, two legs stacked towards the hems ---------- */
const DENIM = '#5e86b5'
const DENIM_D = '#3f6591'
const DENIM_L = '#8db0d8'
const DENIM_INK = '#1f3552'
const ORANGE = '#e8a04a'
const COPPER = '#c58a4a'
const BAND = 'M.15 .06H.93V.94H.15Q.05 .94 .05 .84V.16Q.05 .06 .15 .06Z'
// back leg (seen below and beyond the front leg) and front leg
const BACK = 'M.9 .3L5.9 .4Q5.97 .41 5.97 .49V.75Q5.97 .81 5.9 .82L.9 .94Z'
const FRONT = 'M.9 .06L5.68 .16Q5.77 .17 5.77 .25V.55Q5.77 .63 5.68 .64L.9 .88Z'

const jeans: ItemArtDef = {
  zone: { x: 0.49, y: 0.6, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <pattern id={`${uid}-twill`} width={0.07} height={0.07} patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
          <path d="M0 .035H.07" stroke="#2f5381" strokeWidth={0.014} opacity={0.32} />
        </pattern>
      </defs>
      {/* back leg: darker, with its own hem peeking out beyond the front leg */}
      <Inked d={BACK} fill={DENIM_D} ink={DENIM_INK} />
      <path d={BACK} fill={`url(#${uid}-twill)`} />
      <path d="M5.5 .4V.82" stroke={DENIM_INK} strokeWidth={0.03} opacity={0.55} {...line} />
      <Stitch d="M5.62 .43V.8M5.8 .43V.79" color={ORANGE} w={0.018} />
      {/* front leg */}
      <Inked d={FRONT} fill={DENIM} ink={DENIM_INK} />
      <path d={FRONT} fill={`url(#${uid}-twill)`} />
      {/* the fold: a lit crease down the middle and shade where the cloth turns under */}
      <path d="M1 .46L5.6 .4" stroke={DENIM_L} strokeWidth={0.04} opacity={0.55} {...line} />
      <path d="M1 .8L5.6 .6" stroke={DENIM_INK} strokeWidth={0.05} opacity={0.22} {...line} />
      <path d="M1.4 .3Q2.4 .42 3.6 .36" stroke={DENIM_L} strokeWidth={0.02} opacity={0.5} {...line} />
      <path d="M1.6 .62L2.3 .6M2.8 .58L3.6 .56" stroke={DENIM_L} strokeWidth={0.018} opacity={0.6} {...line} />
      {/* outseam, flat-felled: two rows of stitching along the lower edge */}
      <Stitch d="M1 .81L5.5 .6M1 .75L5.5 .55" color={ORANGE} w={0.022} />
      {/* front pocket: scooped opening with rivets, and a coin pocket */}
      <path d="M1.12 .1C1.2 .45 1.65 .58 2.05 .46C2.1 .36 2.15 .24 2.2 .12" fill="none" stroke={DENIM_INK} strokeWidth={0.03} opacity={0.5} strokeLinecap="round" strokeLinejoin="round" />
      <Stitch d="M1.1 .1C1.18 .43 1.63 .55 2.03 .43C2.08 .34 2.13 .24 2.18 .12" color={ORANGE} w={0.026} />
      <rect x={1.35} y={0.12} width={0.28} height={0.14} rx={0.015} fill="none" stroke={DENIM_INK} strokeWidth={0.015} opacity={0.5} />
      <Stitch d="M1.33 .11H1.65V.28H1.33Z" color={ORANGE} w={0.016} dash="0.04 0.035" />
      <circle cx={1.12} cy={0.12} r={0.036} fill={COPPER} stroke="#7a5326" strokeWidth={0.01} />
      <circle cx={2.2} cy={0.135} r={0.036} fill={COPPER} stroke="#7a5326" strokeWidth={0.01} />
      <Lod1>
        {/* receipt corner peeking out of the pocket */}
        <path d="M1.75 .09L1.97 .095L1.95 .22L1.78 .21Z" fill="#fbf1de" stroke="#b9a77d" strokeWidth={0.01} />
        <path d="M1.8 .13H1.93M1.8 .17H1.9" stroke="#c9b894" strokeWidth={0.01} {...line} />
      </Lod1>
      {/* knee wear and fade whiskers */}
      <ellipse cx={3.7} cy={0.38} rx={0.5} ry={0.14} fill={DENIM_L} opacity={0.22} />
      <Lod1>
        <path d="M2.7 .22L3.1 .27M2.8 .31L3.2 .34" stroke={DENIM_L} strokeWidth={0.018} opacity={0.65} {...line} />
      </Lod1>
      {/* hem of the front leg: turned-up cuff showing the lighter inside */}
      <path d="M5.2 .15L5.68 .16Q5.77 .17 5.77 .25V.55Q5.77 .63 5.68 .64L5.2 .65Z" fill={DENIM_L} opacity={0.9} />
      <path d="M5.2 .15V.65" stroke={DENIM_INK} strokeWidth={0.03} opacity={0.6} {...line} />
      <Stitch d="M5.3 .18V.62M5.45 .18V.62" color={ORANGE} w={0.02} />
      {/* waistband: a clearly separate, squarer piece */}
      <Inked d={BAND} fill={DENIM_D} ink={DENIM_INK} />
      <path d={BAND} fill={`url(#${uid}-twill)`} />
      <Stitch d="M.1 .12V.88M.88 .12V.88" color={ORANGE} w={0.02} />
      {/* fly: J-stitch beside the waistband and a zip line */}
      <Stitch d="M1.04 .1V.5Q1.04 .66 1.2 .66" color={ORANGE} w={0.024} />
      <path d="M.98 .1V.56" stroke="#9aa5b3" strokeWidth={0.02} strokeDasharray="0.02 0.02" {...line} />
      {/* belt loops straddling the waistband seam */}
      <rect x={0.84} y={0.17} width={0.2} height={0.12} rx={0.02} fill={DENIM_D} stroke={DENIM_INK} strokeWidth={0.015} />
      <rect x={0.84} y={0.7} width={0.2} height={0.12} rx={0.02} fill={DENIM_D} stroke={DENIM_INK} strokeWidth={0.015} />
      {/* button above, leather patch below (the weight label) */}
      <circle cx={0.49} cy={0.2} r={0.075} fill={COPPER} stroke="#6a4520" strokeWidth={0.02} />
      <circle cx={0.49} cy={0.2} r={0.032} fill="none" stroke="#6a4520" strokeWidth={0.012} />
      <rect x={0.2} y={0.4} width={0.58} height={0.4} rx={0.04} fill="#c99a63" stroke="#7a5326" strokeWidth={0.02} />
      <Stitch d="M.24 .44H.74V.76H.24Z" color="#7a5326" w={0.014} dash="0.04 0.035" />
    </>
  ),
}

/* ---------- Phone charger (2x1) ---------- */
const MINT = '#8fcba8'
const MINT_INK = '#2f5a45'

const charger: ItemArtDef = {
  zone: { x: 0.53, y: 0.5, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-plug`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#b9e2cb" />
          <stop offset="0.55" stopColor={MINT} />
          <stop offset="1" stopColor="#5fa583" />
        </linearGradient>
        <linearGradient id={`${uid}-steel`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#e4e7ec" />
          <stop offset="1" stopColor="#9aa1ac" />
        </linearGradient>
      </defs>
      {/* contact shadow: the whole object rests on the lining */}
      <g transform="translate(.025 .035)" opacity={0.2} fill="#2b2433" stroke="#2b2433" strokeWidth={0.02} strokeLinejoin="round" strokeLinecap="round">
        <path d="M.22 .15H.78Q.84 .15 .84 .22V.78Q.84 .86 .76 .86H.26Q.2 .86 .2 .8V.2Q.2 .15 .22 .15Z" />
        <path d="M.92 .5C1.1 .5 1.08 .17 1.38 .19C1.74 .22 1.76 .84 1.4 .82C1.1 .8 1.08 .36 1.38 .36C1.56 .36 1.58 .55 1.72 .5" fill="none" strokeWidth={0.13} />
        <rect x={1.68} y={0.36} width={0.27} height={0.28} rx={0.05} stroke="none" />
      </g>
      {/* cable: a thick coil with a dark edge, cream core, highlight and shaded underside, tied in a small knot */}
      <path d="M.92 .5C1.1 .5 1.08 .17 1.38 .19C1.74 .22 1.76 .84 1.4 .82C1.1 .8 1.08 .36 1.38 .36C1.56 .36 1.58 .55 1.72 .5" stroke="#3b3b44" strokeWidth={0.15} {...line} />
      <path d="M.92 .5C1.1 .5 1.08 .17 1.38 .19C1.74 .22 1.76 .84 1.4 .82C1.1 .8 1.08 .36 1.38 .36C1.56 .36 1.58 .55 1.72 .5" stroke="#f1eee6" strokeWidth={0.105} {...line} />
      <path d="M.92 .53C1.1 .53 1.1 .2 1.38 .22C1.7 .25 1.72 .8 1.4 .79C1.12 .78 1.1 .4 1.38 .4" stroke="#bdb6a6" strokeWidth={0.03} opacity={0.75} {...line} />
      <path d="M1.05 .3C1.12 .2 1.25 .17 1.35 .19M1.5 .26C1.62 .3 1.67 .45 1.64 .62" stroke="#fff" strokeWidth={0.028} opacity={0.85} {...line} />
      {/* USB-C connector: dark moulded boot with grip ribs, steel tip with a slot */}
      <Inked d="M1.66 .34H1.82V.66H1.66Q1.62 .66 1.62 .62V.38Q1.62 .34 1.66 .34Z" fill="#5a5f69" ink="#2b2f36" w={0.03} />
      <path d="M1.66 .4V.6M1.7 .4V.6M1.74 .4V.6" stroke="#3a3e46" strokeWidth={0.015} {...line} />
      <Inked d="M1.82 .39H1.92Q1.97 .39 1.97 .44V.56Q1.97 .61 1.92 .61H1.82Z" fill={`url(#${uid}-steel)`} ink="#4a4f58" w={0.028} />
      <rect x={1.87} y={0.46} width={0.07} height={0.08} rx={0.035} fill="#2b2433" />
      <path d="M1.84 .42H1.92" stroke="#fff" strokeWidth={0.015} opacity={0.8} {...line} />
      {/* strain relief with moulded ribs */}
      <path d="M.8 .38H.88L.95 .43V.57L.88 .62H.8Z" fill="#6a756f" stroke="#2f3a35" strokeWidth={0.02} strokeLinejoin="round" />
      <path d="M.84 .4V.6M.88 .41V.59" stroke="#3f4a45" strokeWidth={0.015} {...line} />
      {/* pins: plastic collars, then steel */}
      <rect x={0.14} y={0.25} width={0.1} height={0.19} rx={0.03} fill="#7fbf9d" stroke={MINT_INK} strokeWidth={0.02} />
      <rect x={0.14} y={0.56} width={0.1} height={0.19} rx={0.03} fill="#7fbf9d" stroke={MINT_INK} strokeWidth={0.02} />
      <rect x={0.05} y={0.3} width={0.14} height={0.09} rx={0.025} fill={`url(#${uid}-steel)`} stroke="#4a4f58" strokeWidth={0.02} />
      <rect x={0.05} y={0.61} width={0.14} height={0.09} rx={0.025} fill={`url(#${uid}-steel)`} stroke="#4a4f58" strokeWidth={0.02} />
      {/* plug body: a moulded block with a lit top edge, shaded sides and a flat front panel */}
      <Inked d="M.24 .14H.76Q.86 .14 .86 .24V.76Q.86 .86 .76 .86H.24Q.2 .86 .2 .8V.2Q.2 .14 .24 .14Z" fill={`url(#${uid}-plug)`} ink={MINT_INK} />
      <path d="M.28 .17H.74" stroke="#fff" strokeWidth={0.03} opacity={0.65} {...line} />
      <path d="M.84 .26V.76Q.84 .84 .76 .84H.26" stroke="#3f7f5f" strokeWidth={0.05} opacity={0.55} {...line} />
      <rect x={0.28} y={0.24} width={0.48} height={0.52} rx={0.07} fill="#a8d9bd" stroke="#6fb28f" strokeWidth={0.015} />
      <Lod1>
        <path d="M.31 .79H.73M.78 .3V.7" stroke="#3f7f5f" strokeWidth={0.012} opacity={0.5} {...line} />
      </Lod1>
    </>
  ),
}

/* ---------- Toiletries (2x2 clear zip pouch) ---------- */
const LAV = '#7a64a8'
const LAV_INK = '#3d2f63'
const POUCH = 'M.14 .08H1.86Q1.94 .08 1.94 .16V1.84Q1.94 1.94 1.84 1.94H.16Q.06 1.94 .06 1.84V.16Q.06 .08 .14 .08Z'

const toiletries: ItemArtDef = {
  zone: { x: 1.62, y: 1.68, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <linearGradient id={`${uid}-pvc`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor="#f6f2fc" />
          <stop offset="1" stopColor="#ddd5ee" />
        </linearGradient>
      </defs>
      <Inked d={POUCH} fill={`url(#${uid}-pvc)`} ink={LAV_INK} />
      {/* heat-sealed edges and the soft gusset fold */}
      <Stitch d="M.14 .45V1.78Q.14 1.86 .22 1.86H1.78Q1.86 1.86 1.86 1.78V.45" color="#b7a9d6" w={0.02} dash="0.07 0.04" />
      <path d="M.1 1.62Q1 1.7 1.9 1.6" stroke="#cbbfe3" strokeWidth={0.02} {...line} />
      {/* pump bottle */}
      <rect x={0.2} y={0.82} width={0.46} height={0.96} rx={0.1} fill="#f6f4fb" stroke="#5a4a86" strokeWidth={0.03} />
      <rect x={0.23} y={1.12} width={0.4} height={0.63} rx={0.07} fill="#b7a4db" opacity={0.85} />
      <rect x={0.22} y={1.22} width={0.42} height={0.34} fill="#fbf1de" stroke="#8d7fb4" strokeWidth={0.012} />
      <circle cx={0.43} cy={1.39} r={0.07} fill="#e8806b" />
      <path d="M.38 .64H.5V.82H.38Z" fill="#e8806b" stroke="#6b2f2a" strokeWidth={0.02} strokeLinejoin="round" />
      <path d="M.28 .56H.62L.6 .64H.3Z" fill="#c4604c" stroke="#6b2f2a" strokeWidth={0.02} strokeLinejoin="round" />
      <path d="M.56 .56H.76V.6H.56Z" fill="#c4604c" stroke="#6b2f2a" strokeWidth={0.015} strokeLinejoin="round" />
      <path d="M.27 .9V1.65" stroke="#fff" strokeWidth={0.03} opacity={0.55} {...line} />
      {/* toothbrush */}
      <g transform="rotate(4 1.3 .64)">
        <rect x={0.8} y={0.57} width={0.96} height={0.12} rx={0.06} fill="#8fcba8" stroke="#2f5a45" strokeWidth={0.02} />
        <rect x={1.7} y={0.54} width={0.2} height={0.18} rx={0.05} fill="#f6f4fb" stroke="#2f5a45" strokeWidth={0.02} />
        <Lod2>
          <path d="M1.72 .52V.48M1.77 .52V.47M1.82 .52V.48M1.87 .52V.49" stroke="#6fb7c4" strokeWidth={0.025} {...line} />
        </Lod2>
      </g>
      {/* toothpaste tube with a crimped end and a cap */}
      <g transform="rotate(-12 1.35 1.25)">
        <rect x={0.9} y={1.1} width={0.92} height={0.3} rx={0.07} fill="#f7f7f2" stroke="#3a6a73" strokeWidth={0.025} />
        <rect x={0.9} y={1.2} width={0.92} height={0.1} fill="#6fb7c4" />
        <rect x={0.82} y={1.13} width={0.12} height={0.24} rx={0.04} fill="#4a7fc0" stroke="#27456f" strokeWidth={0.02} />
        <path d="M1.78 1.11L1.86 1.15 1.78 1.19 1.86 1.23 1.78 1.27 1.86 1.31 1.78 1.35 1.78 1.39" stroke="#3a6a73" strokeWidth={0.02} {...line} />
        <path d="M1.0 1.13H1.7" stroke="#fff" strokeWidth={0.02} opacity={0.7} {...line} />
      </g>
      {/* round cream jar */}
      <circle cx={1.0} cy={1.72} r={0.19} fill="#fbf6ee" stroke="#8d7fb4" strokeWidth={0.025} />
      <circle cx={1.0} cy={1.72} r={0.13} fill="#e8806b" stroke="#6b2f2a" strokeWidth={0.02} />
      <path d="M.93 1.67Q1 1.62 1.07 1.67" stroke="#fff" strokeWidth={0.02} opacity={0.6} {...line} />
      {/* zip tape across the top with teeth and a metal pull */}
      <path d="M.14 .08H1.86Q1.94 .08 1.94 .16V.38H.06V.16Q.06 .08 .14 .08Z" fill={LAV} stroke={LAV_INK} strokeWidth={0.03} strokeLinejoin="round" />
      <path d="M.12 .23H1.88" stroke="#d6cdee" strokeWidth={0.07} strokeDasharray="0.035 0.035" />
      <rect x={1.46} y={0.14} width={0.34} height={0.2} rx={0.07} fill="#d9d4c8" stroke="#5a5560" strokeWidth={0.025} />
      <circle cx={1.7} cy={0.24} r={0.04} fill="#7a64a8" />
      {/* clear plastic sheen */}
      <path d="M.1 1.05L.82 .42L.96 .42L.1 1.2Z" fill="#fff" opacity={0.28} />
      <path d="M.1 1.35L1.1 .42L1.16 .42L.1 1.43Z" fill="#fff" opacity={0.18} />
      {/* white sticker (the weight label) */}
      <rect x={1.36} y={1.5} width={0.5} height={0.36} rx={0.04} fill="#fffaf0" stroke="#b6a77f" strokeWidth={0.015} />
      <Lod2>
        <path d="M1.4 1.56H1.6" stroke="#cbbfa0" strokeWidth={0.012} {...line} />
      </Lod2>
    </>
  ),
}

/* ---------- Sneakers (U pentomino: a pair tied together by the laces) ---------- */
const MUSTARD = '#e3b04f'
const MUSTARD_D = '#a67c22'
const SHOE_INK = '#5a3f12'
const SOLE = '#fff6e6'
const SHOE =
  'M.3 .02C.12 .02 .07 .28 .09 .6C.07 1 .02 1.25 .03 1.5C.03 1.86 .24 1.98 .5 1.98C.76 1.98 .97 1.86 .97 1.5C.98 1.25 .93 1 .91 .6C.93 .28 .88 .02 .7 .02Z'

function Sneaker({ uid }: { uid: string }) {
  return (
    <>
      <Inked d={SHOE} fill={SOLE} ink={SHOE_INK} w={0.05} />
      {/* upper */}
      <path d={SHOE} fill={MUSTARD} stroke={MUSTARD_D} strokeWidth={0.025} transform="translate(.5 1) scale(.86) translate(-.5 -1)" />
      <path d={SHOE} fill={`url(#${uid}-canvas)`} transform="translate(.5 1) scale(.86) translate(-.5 -1)" />
      {/* rubber toe cap with a stitched edge (the weight label) */}
      <path d="M.18 1.45C.2 1.2 .8 1.2 .82 1.45C.84 1.8 .66 1.9 .5 1.9C.34 1.9 .16 1.8 .18 1.45Z" fill="#fff1d2" stroke="#b98e2e" strokeWidth={0.03} />
      <path d="M.2 1.34C.35 1.26 .65 1.26 .8 1.34" fill="none" stroke="#b98e2e" strokeWidth={0.025} strokeLinecap="round" strokeLinejoin="round" />
      {/* tongue with a little tag, collar opening and heel counter */}
      <path d="M.36 .55C.4 .48 .6 .48 .64 .55L.66 1.1C.58 1.16 .42 1.16 .34 1.1Z" fill="#f2c96e" stroke={MUSTARD_D} strokeWidth={0.025} strokeLinejoin="round" />
      <rect x={0.44} y={0.58} width={0.12} height={0.07} rx={0.01} fill="#fff6e6" stroke={MUSTARD_D} strokeWidth={0.01} />
      <ellipse cx={0.5} cy={0.36} rx={0.28} ry={0.25} fill="#5b3f2e" stroke={MUSTARD_D} strokeWidth={0.05} />
      <path d="M.3 .3Q.5 .18 .7 .3" fill="none" stroke="#a37a52" strokeWidth={0.03} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M.16 .56C.13 .34 .2 .16 .3 .1" fill="none" stroke={MUSTARD_D} strokeWidth={0.025} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M.84 .56C.87 .34 .8 .16 .7 .1" fill="none" stroke={MUSTARD_D} strokeWidth={0.025} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={0.44} y={0.01} width={0.12} height={0.09} rx={0.02} fill="#fff6e6" stroke={SHOE_INK} strokeWidth={0.015} />
      {/* eyelets and criss-crossed laces */}
      {[0.76, 0.9, 1.04].map((y) => (
        <g key={y}>
          <path d={`M.3 ${y}L.7 ${y + 0.07}M.7 ${y}L.3 ${y + 0.07}`} stroke="#fff6e6" strokeWidth={0.045} {...line} />
          <circle cx={0.28} cy={y} r={0.035} fill="#5b3f2e" stroke="#fff6e6" strokeWidth={0.012} />
          <circle cx={0.72} cy={y} r={0.035} fill="#5b3f2e" stroke="#fff6e6" strokeWidth={0.012} />
        </g>
      ))}
      <Lod2>
        <path d="M.12 1.5V1.58M.1 1.38V1.44M.88 1.5V1.58M.9 1.38V1.44M.3 1.94V1.97M.7 1.94V1.97" stroke={SHOE_INK} strokeWidth={0.02} {...line} />
      </Lod2>
    </>
  )
}

const shoes: ItemArtDef = {
  zone: { x: 2.5, y: 1.58, tone: 'dark' },
  draw: (uid) => (
    <>
      <defs>
        <pattern id={`${uid}-canvas`} width={0.06} height={0.06} patternUnits="userSpaceOnUse">
          <path d="M0 0L.06 .06M.06 0L0 .06" stroke="#8a6419" strokeWidth={0.008} opacity={0.22} />
        </pattern>
      </defs>
      <g transform="translate(.06 .06) scale(.88 .94)">
        <Sneaker uid={uid} />
      </g>
      <g transform="translate(2.94 .06) scale(-.88 .94)">
        <Sneaker uid={uid} />
      </g>
      {/* the laces leave the top eyelet of each shoe, cross the gap as flat laces and are tied together in a bow */}
      {[
        'M.694 .774C.86 .79 1.04 .66 1.38 .53',
        'M2.306 .774C2.14 .79 1.96 .66 1.62 .53',
      ].map((d) => (
        <g key={d}>
          <path d={d} stroke={SHOE_INK} strokeWidth={0.095} {...line} />
          <path d={d} stroke="#fff6e6" strokeWidth={0.062} {...line} />
          <path d={d} stroke="#e1d2ad" strokeWidth={0.012} {...line} />
        </g>
      ))}
      {/* bow: two ribbon loops and two tails with aglets, over a knot */}
      <g strokeLinejoin="round" strokeLinecap="round" fill="none">
        {[
          'M1.5 .5C1.34 .27 1.14 .2 1.1 .34C1.07 .46 1.3 .53 1.5 .5',
          'M1.5 .5C1.66 .27 1.86 .2 1.9 .34C1.93 .46 1.7 .53 1.5 .5',
          'M1.5 .52C1.44 .66 1.36 .8 1.27 .93',
          'M1.5 .52C1.58 .66 1.66 .8 1.74 .92',
        ].map((d) => (
          <g key={d}>
            <path d={d} stroke={SHOE_INK} strokeWidth={0.09} />
            <path d={d} stroke="#fff6e6" strokeWidth={0.056} />
          </g>
        ))}
        <path d="M1.27 .93L1.255 .965M1.74 .92L1.755 .955" stroke="#7a5326" strokeWidth={0.05} />
        <ellipse cx={1.5} cy={0.505} rx={0.075} ry={0.06} fill="#efe3c6" stroke={SHOE_INK} strokeWidth={0.028} />
        <path d="M1.45 .48C1.5 .52 1.55 .5 1.57 .53" stroke="#b79d62" strokeWidth={0.015} />
      </g>
      <Lod1>
        {/* a pebble stuck in the left tread */}
        <ellipse cx={0.2} cy={1.55} rx={0.04} ry={0.03} fill="#9a958d" stroke={SHOE_INK} strokeWidth={0.012} />
      </Lod1>
    </>
  ),
}

export const ITEM_ART: Record<string, ItemArtDef> = { passport, shirt, jeans, charger, toiletries, shoes }
export { INK }
