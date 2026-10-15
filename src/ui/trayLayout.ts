/**
 * Fixed tray layouts, in board-cell units, one per level. Each item is anchored top-left in its
 * own square box (max(width, height) cells), and the cells it can ever occupy are the union of
 * its rotations. Layouts are packed so those unions never overlap, so rotating an item in the
 * tray cannot change the panel size or touch a neighbour. Boxes themselves may overlap where
 * one item's unused corner holds another (e.g. a 4-cell strip's box also holds a 3x3 item).
 */
export interface TraySlot {
  /** 1-based grid column / row of the box's top-left cell. */
  col: number
  row: number
}

export interface TrayLayout {
  cols: number
  rows: number
  slots: Record<string, TraySlot>
}

export const TRAY_LAYOUTS: Record<string, TrayLayout> = {
  '01': {
    cols: 6,
    rows: 6,
    slots: {
      jeans: { col: 1, row: 1 },
      shirt: { col: 2, row: 2 },
      shoes: { col: 4, row: 4 },
      toiletries: { col: 5, row: 2 },
      charger: { col: 2, row: 5 },
      passport: { col: 3, row: 6 },
    },
  },
  '02': {
    cols: 8,
    rows: 7,
    slots: {
      hairdryer: { col: 1, row: 1 },
      outfit: { col: 4, row: 1 },
      heels: { col: 6, row: 3 },
      extra_shoes: { col: 1, row: 4 },
      dvd: { col: 2, row: 5 },
      toiletries: { col: 7, row: 1 },
      disco_ball: { col: 3, row: 6 },
      ex_photo: { col: 5, row: 6 },
      charger: { col: 7, row: 6 },
      passport: { col: 5, row: 4 },
    },
  },
  '03': {
    cols: 8,
    rows: 8,
    slots: {
      cutout: { col: 1, row: 1 },
      outfit: { col: 6, row: 1 },
      hotel_lamp: { col: 6, row: 4 },
      ceramic_foot: { col: 1, row: 6 },
      toiletries: { col: 5, row: 7 },
      charger: { col: 4, row: 6 },
      emergency_socks: { col: 7, row: 7 },
      passport: { col: 2, row: 2 },
    },
  },
}
