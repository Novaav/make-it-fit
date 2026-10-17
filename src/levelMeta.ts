/** Display copy and verified reference values that are not part of the puzzle fixtures. */
export const ITEM_NAMES: Record<string, string> = {
  shirt: 'T-shirt',
  jeans: 'Jeans',
  shoes: 'Sneakers',
  toiletries: 'Toiletries',
  charger: 'Laptop charger',
  outfit: 'Party outfit',
  heels: 'Overpriced Heels',
  handbag: 'Louis Regretton handbag',
  dvds: "Mom's Porn Collection",
  vibrator: 'Pocket massager',
  speaker: 'Party speaker',
  disco_ball: 'Disco ball',
  frame: 'Framed photo of the ex',
  flamingo: 'Inflatable flamingo',
  boa: 'Feather boa',
  ringlight: 'Ring light and tripod',
  painting: 'Hotel Painting',
  laundry: 'Laundry bag',
  hangover: 'Hangover kit',
  hotel_lamp: 'Hotel lamp',
  ceramic_foot: 'Marble foot',
  gnome: 'Garden gnome',
  cheese: 'Wheel of cheese',
  liquor: 'Badcardi Rum',
  robe: 'Bathrobe',
  emergency_socks: 'Socks',
}

/** Levels playable in the UI, in order. */
export const PLAYABLE_LEVEL_IDS = ['01', '02', '03'] as const

export const LEVEL_TITLES: Record<string, string> = {
  '01': 'Pack Like a Grown-Up',
  '02': 'Carry-On, Questionable Decisions',
  '03': 'Excess Baggage',
}

export { WEIGHT_UNIT } from './weight'
