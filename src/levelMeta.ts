/** Display copy and verified reference values that are not part of the puzzle fixtures. */
export const ITEM_NAMES: Record<string, string> = {
  shirt: 'T-shirt',
  jeans: 'Jeans',
  shoes: 'Sneakers',
  toiletries: 'Toiletries',
  charger: 'Laptop charger',
  outfit: 'Party outfit',
  heels: 'Red-soled heels',
  handbag: 'Louis Regretton handbag',
  dvds: "Mom's Porn Collection",
  vibrator: 'Pocket massager',
  speaker: 'Party speaker',
  disco_ball: 'Disco ball',
  frame: 'Framed photo of the ex',
  flamingo: 'Inflatable flamingo',
  boa: 'Feather boa',
  ringlight: 'Ring light and tripod',
  cutout: 'Cardboard cutout',
  laundry: 'Laundry bag',
  hangover: 'Hangover kit',
  hotel_lamp: 'Hotel lamp',
  ceramic_foot: 'Ceramic foot',
  gnome: 'Concrete garden gnome',
  cheese: 'Wheel of cheese',
  liquor: 'Bottle of local spirit',
  robe: 'Hotel bathrobe',
  emergency_socks: 'Emergency socks',
}

/** Levels playable in the UI, in order. */
export const PLAYABLE_LEVEL_IDS = ['01', '02', '03'] as const

export const LEVEL_TITLES: Record<string, string> = {
  '01': 'Pack Like a Grown-Up',
  '02': 'Carry-On, Questionable Decisions',
  '03': 'Excess Baggage',
}

/**
 * Most optional items any legal layout can hold. Proved by `verify_levels.py` and independently by
 * `src/engine/enumerate.test.ts`, which fails if these drift from the level data.
 */
export const BEST_OPTIONAL: Record<string, number> = { '01': 0, '02': 2, '03': 5 }

/** Name of the top bonus tier: an optional achievement, never a requirement. "Perfect pack" is reserved for Level 3. */
export const maxBonusLabel = (levelId: string): string => (levelId === '03' ? 'Perfect pack' : 'Maximum bonus')

export { WEIGHT_UNIT } from './weight'
