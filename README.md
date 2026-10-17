# Make It Fit

**Bad decisions. Limited luggage.**

A small browser puzzle game about packing an open suitcase. Drag, rotate and fit illustrated belongings into the case, stay within the packing allowance, and collect as much Chaos as the suitcase allows. Three hand-made levels, no timer, no sound, no account, no server.

**Built with:** React 19, TypeScript, Vite, Vitest, Playwright, a Python puzzle solver, GitHub Actions. All artwork is original, drawn as SVG in code.

Status: feature-complete (three levels). <!-- Add the playable link and screenshots here once the game is published. -->

## Why the engineering is interesting

- **The puzzles are proven, not guessed.** A separate exhaustive solver (Python) shows every level is solvable and finds its perfect score; CI fails if the committed puzzle data drifts from what it derives.
- **The rules are a pure TypeScript engine** (grid shapes, rotation, collision, undo, win and weight rules) with no React in it, so they are tested headlessly.
- **Dragging is tuned for Safari's engine.** Pointer input is applied once per frame and React re-renders only when the snapped target changes; browser tests measure it on Chrome and Playwright's WebKit.
- **Saved data is treated as untrusted.** Progress and arrangements are versioned, validated and replayed through the engine, so a corrupt save can never put an invalid board on screen.
- **Accessible by construction:** full keyboard play, screen-reader announcements, visible focus, reduced-motion support.

How it fits together: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

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

A new player's first visit of a browsing session opens with a branded start: the wordmark sits large on the empty table with its tagline and a Play button, and it waits, with no timer, until Play is pressed (no other tap or key starts the game); Play moves the wordmark into the masthead as the packing table fades up (about 0.85 s), and the how-to-play note follows once that has settled. Returning players, browser automation and a visit already started in the same session go straight in, reduced motion shows the start without movement, and `?intro` on the address replays it for review. Rotation and the layout of the "To pack" tray are designed so that rotating an item never changes the size of the panel. Reduced-motion preferences are respected.

## Build and run (for the author and anyone the author has permitted)

The [licence](LICENSE) lets you read this code and play the hosted game; it does not grant permission to run, copy or modify the code, so please ask first (contact in the licence). These commands document how the project is built and verified.

Requires Node.js 22 or newer (CI uses 24) and npm.

```bash
npm install
npm run dev          # development server (includes dev-only test tools, see below)
npm run build        # production build into dist/
npx vite preview     # serve the production build locally
```

## Test it

The browser tests need Chrome and the Playwright browsers once: `npx playwright install chrome webkit firefox`.

```bash
npx tsc -b                     # type check
npm run lint                   # static analysis (Oxlint)
npm test                       # unit tests (Vitest): engine, UI helpers, progress, markup
python3 verify_levels.py       # re-verifies the puzzle data with the reference solver
npm run check:prod-clean       # production build must contain no dev tools or solution data
npm run test:e2e               # browser tests (Playwright): Chrome, WebKit and the production build
PW_FIREFOX=1 npm run test:e2e  # also a Firefox smoke test (npx playwright install firefox first)
```

- The browser tests use your locally installed **Google Chrome** (plus Playwright's WebKit engine, which is not Safari itself) (`channel: 'chrome'` in `playwright.config.ts`), start their own dev and preview servers on ports 5180 and 5181, and play real drags, rotations, keyboard flows, progression and persistence at desktop and phone sizes.
- `TEST_SOLUTIONS.md` lists engine-verified layouts for every level (coordinates, rotations and grids). A test fails if the file drifts from the engine; regenerate with `npx vitest run -u src/dev/solutionsDoc.test.ts`.

### Dev-only test tools

On `npm run dev` a small **Dev tools** panel (bottom-left) offers *Test win & continue*, level jump, filling a verified layout, and clearing saved progress. These never write to saved progress; test unlocks live in memory and disappear on reload, and a yellow **TEST MODE** strip marks the session. The panel and the solution data are compiled out of production builds (`npm run check:prod-clean`).

## Quality notes

- **Puzzle data is proven, not guessed.** `verify_levels.py` is a separate exhaustive solver, written in Python: it shows each level is solvable, finds the perfect Chaos, and CI fails if the committed puzzle data and solution fixtures drift from its output. The game engine is pure TypeScript with no React dependency and is unit-tested headlessly.
- **Accessibility.** Everything can be played from the keyboard, the running score, weight left and the win are announced to screen readers, focus is visible, dialogs manage focus, and `prefers-reduced-motion` removes the opening movement and other animation.
- **Browsers.** Automated tests run on Chrome, Playwright's WebKit engine (which is not Safari itself) and a Firefox smoke subset, at phone, tablet and desktop sizes, against both the development server and the production build. Checking real Safari and a physical iPhone is a manual step.
- **Production build.** Static files only, no third-party requests; a strict Content-Security-Policy and caching headers are in `public/_headers` and are covered by a test. The build is checked to contain no developer tools or solution data (`npm run check:prod-clean`).
- **Third-party material.** React (MIT) and three fonts (SIL OFL 1.1) are used; their notices ship with the game in `public/third-party-notices.txt`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the engine, the solver, state and persistence fit together.

## Limitations

- Three levels, one device: progress and saved arrangements live in the browser's `localStorage`; there are no accounts or sync.
- Real Safari and physical-phone behaviour have only been checked informally, not by an automated or documented device test; the automated suite uses Playwright's WebKit engine, which is not Safari.
- The browser test suite expects Google Chrome (`channel: 'chrome'`) plus Playwright's WebKit and Firefox builds (`npx playwright install chrome webkit firefox`).
- Rotation and layouts are tuned for the three shipped levels; adding a level means regenerating the puzzle data with the solver.

## Project layout

```
src/engine/       pure TypeScript rules: shapes, rotation, placement, undo, win/weight checks (no React)
src/ui/           pointer/grid maths and the fixed per-level tray layouts
src/art/          original SVG item artwork per level, plus STYLE.md (the art style guide)
src/components/   item art renderer, Chaos stamps, perfect-pack seal and flourish, the how-to-play note
src/LevelPlay.tsx the playable level screen
src/App.tsx       level tabs, progression and the dev-only test session
src/progress.ts   validated localStorage persistence
src/dev/          development-only tools and the generator for TEST_SOLUTIONS.md
e2e/              Playwright browser tests
VERIFIED_LEVELS.json, verify_levels.py, LEVEL_DESIGN.md   puzzle data, its verifier and its specification
```

The suitcase is a hidden cell grid and every item is a set of cells, so geometry, overlap and rotation are deterministic and unit-tested headlessly. Level data (including the verified perfect Chaos per level) comes from `VERIFIED_LEVELS.json`.

## Licence

Source-available, not open source. Copyright (c) 2026 Nova Zandkarimi, all rights reserved: the code is public to read and the game is free to play, and no other permission is granted to use, copy, modify, redistribute or commercially exploit it. See [`LICENSE`](LICENSE). Nothing there limits rights the law or GitHub's terms of service give you (for example viewing and forking on GitHub). Third-party components (React under MIT, three fonts under the SIL Open Font License) keep their own licences; see [`public/third-party-notices.txt`](public/third-party-notices.txt).
