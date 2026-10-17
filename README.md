# Make It Fit

**Bad decisions. Limited luggage.**

A small browser puzzle game about packing an open suitcase. Drag, rotate and fit illustrated belongings into the case, stay within the packing allowance, and collect as much Chaos as the suitcase allows. Three hand-made levels, no timer, no sound, no account, no server.

Status: playable local build. Not deployed. Artwork is original but temporary.

## How to play

- **Goal (Level 1):** pack every item; rotate where needed. Every item carries a stamped Chaos number and the total counts up as you pack, but nothing has to be reached.
- **Goal (Levels 2-3):** reach the target **Chaos** (every item has a Chaos number, always visible) within the weight allowance (6.5 kg, then 20.5 kg); exactly the allowance is fine. Level 3 also has two **MUST** items that must come. A perfect pack beats the target by a few points; the game never reveals which combination does it, and reaching it earns a gold meter, a stitched-gold flourish and a PERFECT PACK seal on the boarding pass. Weights under 1 kg are shown in grams (900 g), the rest in kilograms (2.25 kg).
- **Developer tools (dev server only):** the dev panel jumps between levels and fills verified layouts through TEST MODE, including a **Solution Explorer** with solver-verified normal wins and every perfect pack. Nothing there is saved or shipped in production.
- **Feedback:** while placing, green means the item fits there and red means it overlaps something or sticks out. Each item shows its weight on levels with an allowance.
- **Finish:** a normal win and a perfect win each show their own dialog once; **Next level** or **Keep packing** (you can keep chasing a perfect pack). Unlimited undo and reset. A short handwritten how-to note opens the first time you enter each level; **How to play** replays it.
- **Progress:** completed levels and best Chaos are saved in your browser's `localStorage` only, and so is the arrangement you left in each level. A level completed earlier keeps its check mark, but the suitcase is only "Packed!" while its current arrangement is valid. Levels unlock in order.

## Controls

| Action | Mouse / touch | Keyboard |
|---|---|---|
| Move an item | Drag it onto the suitcase (snaps to the grid) | `Tab` to an item, `Enter` to pick up, arrow keys to move, `Enter` to place |
| Rotate 90° | `Rotate` button, or `R`; right-click while dragging | `R` |
| Cancel a move | Drop outside the suitcase | `Esc` |
| Take an item out | Drag it back to the tray, or `Remove` | `Delete` / `Backspace` |
| Undo | `Undo` button | `Ctrl`/`⌘` + `Z` |

Rotation and the layout of the "To pack" tray are designed so that rotating an item never changes the size of the panel. Reduced-motion preferences are respected.

## Run it

Requires Node.js (LTS) and npm.

```bash
npm install
npm run dev          # development server (includes dev-only test tools, see below)
npm run build        # production build into dist/
npx vite preview     # serve the production build locally
```

## Test it

```bash
npx tsc -b                     # type check
npm test                       # unit tests (Vitest): engine, UI helpers, progress, markup
python3 verify_levels.py       # re-verifies the puzzle data with the reference solver
npm run check:prod-clean       # production build must contain no dev tools or solution data
npm run test:e2e               # browser tests (Playwright) in a real browser
```

- The browser tests use your locally installed **Google Chrome** (`channel: 'chrome'` in `playwright.config.ts`), start their own dev and preview servers on ports 5180 and 5181, and play real drags, rotations, keyboard flows, progression and persistence at desktop and phone sizes.
- `TEST_SOLUTIONS.md` lists engine-verified layouts for every level (coordinates, rotations and grids). A test fails if the file drifts from the engine; regenerate with `npx vitest run -u src/dev/solutionsDoc.test.ts`.

### Dev-only test tools

On `npm run dev` a small **Dev tools** panel (bottom-left) offers *Test win & continue*, level jump, filling a verified layout, and clearing saved progress. These never write to saved progress; test unlocks live in memory and disappear on reload, and a yellow **TEST MODE** strip marks the session. The panel and the solution data are compiled out of production builds (`npm run check:prod-clean`).

## Project layout

```
src/engine/       pure TypeScript rules: shapes, rotation, placement, undo, win/weight checks (no React)
src/ui/           pointer/grid maths and the fixed per-level tray layouts
src/components/   temporary SVG item artwork
src/LevelPlay.tsx the playable level screen
src/App.tsx       level tabs, progression and the dev-only test session
src/progress.ts   validated localStorage persistence
src/dev/          development-only tools and the generator for TEST_SOLUTIONS.md
e2e/              Playwright browser tests
VERIFIED_LEVELS.json, verify_levels.py, LEVEL_DESIGN.md   puzzle data, its verifier and its specification
```

The suitcase is a hidden cell grid and every item is a set of cells, so geometry, overlap and rotation are deterministic and unit-tested headlessly. Level data (including the verified perfect Chaos per level) comes from `VERIFIED_LEVELS.json`.

## License

Copyright © the author. **All rights reserved.** No licence is granted to use, copy, modify or distribute this code or artwork.
