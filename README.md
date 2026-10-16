# Make It Fit

**Bad decisions. Limited luggage.**

A small browser puzzle game about packing an open suitcase. Drag, rotate and fit illustrated belongings into the case, stay within the packing allowance, and squeeze in optional bonus items. Three hand-made levels, no timer, no sound, no account, no server.

Status: playable local build. Not deployed. Artwork is original but temporary.

## How to play

- **Goal:** pack every required item. From Level 2 there is also a packing allowance (7 kg for the cabin bag, 23 kg for the checked bag): the weight of the packed items must be at most the allowance, and exactly the allowance is fine. The game weighs the illustrated items only. Weights are shown in kilograms.
- **Bonus:** items marked ★ are optional extras. The pill `★ Bonus n/m` compares your count with the verified best possible; reaching it is the *Maximum bonus* (called *Perfect pack* on Level 3). It is never required to complete a level.
- **Feedback:** while placing, green means the item fits there and red means it overlaps something or sticks out. Each item shows its weight on levels with an allowance.
- **Finish:** a success dialog shows your results. Choose **Next level** or **Keep packing** (you can keep improving the bonus after completing a level). Unlimited undo and reset.
- **Progress:** completed levels and best bonus counts are saved in your browser's `localStorage` only. Levels unlock in order.

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

The suitcase is a hidden cell grid and every item is a set of cells, so geometry, overlap and rotation are deterministic and unit-tested headlessly. Level data (including the verified maximum bonus per level) comes from `VERIFIED_LEVELS.json`.

## License

Copyright © the author. **All rights reserved.** No licence is granted to use, copy, modify or distribute this code or artwork.
