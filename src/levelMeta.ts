/** Display copy and verified reference values that are not part of the puzzle fixtures. */
export const ITEM_NAMES: Record<string, string> = {
  passport: 'Passport',
  shirt: 'Shirt',
  jeans: 'Jeans',
  charger: 'Phone charger',
  toiletries: 'Toiletries',
  shoes: 'Shoes',
  outfit: 'Outfit',
  dvd: 'Educational DVD',
  disco_ball: 'Disco ball',
  heels: 'Heels',
  ex_photo: 'Photo of the ex',
  extra_shoes: 'Extra shoes',
  hairdryer: 'Hairdryer',
  cutout: 'Cardboard cutout',
  hotel_lamp: 'Hotel lamp',
  emergency_socks: 'Emergency socks',
  ceramic_foot: 'Ceramic foot',
}

/** Levels playable in the UI, in order. */
export const PLAYABLE_LEVEL_IDS = ['01', '02', '03'] as const

/** Most optional items any legal layout can hold (verify_levels.py; see LEVEL_DESIGN.md). */
export const BEST_OPTIONAL: Record<string, number> = { '01': 0, '02': 2, '03': 2 }

export const WEIGHT_UNIT = 'kg'
