/**
 * Fixed tray layouts, in board-cell units, one per level. Each item is anchored top-left in its
 * own square box (max(width, height) cells), and the cells it can ever occupy are the union of
 * its rotations. Layouts are packed (exhaustive search) so those unions never overlap, so rotating
 * an item in the tray cannot change the panel size or touch a neighbour. Boxes themselves may
 * overlap where one item's unused corner holds another.
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
    },
  },
  '02': {
    cols: 8,
    rows: 9,
    slots: {
      ringlight: { col: 1, row: 1 },
      outfit: { col: 4, row: 1 },
      heels: { col: 6, row: 3 },
      frame: { col: 1, row: 4 },
      flamingo: { col: 1, row: 7 },
      boa: { col: 4, row: 6 },
      vibrator: { col: 5, row: 7 },
      toiletries: { col: 7, row: 1 },
      disco_ball: { col: 4, row: 4 },
      speaker: { col: 6, row: 8 },
    },
  },
  '03': {
    cols: 10,
    rows: 11,
    slots: {
      cutout: { col: 1, row: 1 },
      laundry: { col: 6, row: 1 },
      outfit: { col: 8, row: 3 },
      heels: { col: 5, row: 5 },
      hotel_lamp: { col: 1, row: 6 },
      ceramic_foot: { col: 8, row: 6 },
      gnome: { col: 4, row: 8 },
      robe: { col: 1, row: 9 },
      liquor: { col: 8, row: 9 },
      hangover: { col: 9, row: 1 },
      cheese: { col: 6, row: 10 },
      emergency_socks: { col: 9, row: 10 },
    },
  },
}
