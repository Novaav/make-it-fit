import { LEVEL1_ART } from './level1'
import { LEVEL2_ART } from './level2'
import type { ItemArtDef } from './kit'

/** Every illustrated item by id. Items without an entry still show the labelled placeholder. */
export const ITEM_ART: Record<string, ItemArtDef> = { ...LEVEL1_ART, ...LEVEL2_ART }
