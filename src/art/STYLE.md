# Item art style guide

Rules distilled from the approved Level 1 and Level 2 illustrations. Use them for every new item (next: Level 3).

## Construction
- One SVG per item in cell units (1 cell = 1 unit), drawn inside its occupied cells. The visible footprint must match the logical cells at every rotation (`art` tests check coverage and overflow). Never change a shape to suit a drawing.
- `Contact` (soft shadow, offset lower right) under the silhouette, then `Inked` (hand-inked outline: heavier lower right) with the item colour. Outline weight 0.035-0.05 cells. Ink colour is a hue-shifted dark of the item colour, never black.
- Light comes from the upper left. Add one soft light-to-shade gradient over the main body, a lit edge on top and shade on the lower right. One crisp highlight (gloss for patent, glass, metal; sheen for fabric).
- Material vocabulary: fabric (weave pattern, seams, dashed `Stitch`), leather (stitched panel, rivets), plastic (moulded block, lit edge), metal (steel gradient), paper/card (label, curl). Each item has one memorable material cue plus one small joke or character detail (receipt, coffee drip, price tag, stamp).
- Accents: pick from the shared palette (coral `#e8806b`, mint `#8fcba8`, plum, mustard, denim blue, teal) so objects feel like one set; repeat one accent from a neighbouring item rather than inventing new hues.

## Legibility
- Silhouette alone must read at 40 px cells (contact sheet section F). Details go in `Lod1` (hidden below 40 px cells) and `Lod2` (hidden below 56 px). Never put information only in a detail tier.
- Each item reserves a label zone for its printed weight (`zone` in the item definition) and keeps it plain. Weight text never rotates; it is drawn by `WeightLabel`.
- Chaos is a separate stamp (`ChaosBadge`, plum ring on cream, upright, top-left of the first cell); keep that corner free of dark detail. MUST items use the square ink stamp.
- Keep each item under about 8 KB of SVG, no raster images, no external fonts inside the art.

## Review checklist
1. Contact sheet sections A (gameplay size), B (all rotations), C (40/48/56 px), D (label zones), F (silhouettes).
2. One-second test: can a stranger name it?
3. Compare against a Level 2 item at the same size for outline weight, shadow and saturation.

## Level 3 art plan (all eleven items are still labelled placeholders; the party outfit reuses Level 2 art)
Priority order, with the reason:
1. **Cardboard cutout** (10 cells, MUST) and **laundry bag** (6 cells, MUST): the first things a player sees; largest footprints; define the level's look.
2. **Concrete garden gnome** (Chaos 8, 6.5 kg): the deliberate trap and the funniest item; needs a heavy stone material and a clear gnome silhouette in a 2x3 block.
3. **Ceramic foot** (U5, Chaos 6) and **wheel of cheese** (2x2, Chaos 5): high-value, high-weight choices.
4. **Bottle of local spirit** (line 3), **hotel bathrobe** (P5), **hangover kit** (2x2): mid-value, distinct silhouettes.
5. **Hotel lamp** (L4), **heels** (U5), **emergency socks** (line 2): lowest value; socks are tiny and need a bold two-colour read.
Ship in two reviewable batches (1-2 first, then 3-5), each with its contact sheet.
