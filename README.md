# Make It Fit

**Bad decisions. Limited luggage.**

A small browser puzzle game about packing an open suitcase for a trip you should not be taking. Drag and rotate belongings onto a grid, stay under the weight allowance, and collect enough **Chaos** to win. The items are the joke: a marble foot, a garden gnome, a flamingo, a hotel painting that has to come along. There are three hand-made levels, optional soft sound effects (off until you turn them on), no timer, no account and no server.

Built with React 19, TypeScript, Vite, a Python puzzle solver, Vitest, Playwright and GitHub Actions. All artwork is original SVG drawn in code.

<!--
DEMO (add after deployment; use real files only):
  - one 30-45 s video:  assets/demo/make-it-fit.mp4 (+ poster)
  - exactly three screenshots: opening, a level in play, a perfect pack
  - the verified live URL
-->

## What makes it interesting

- **Every puzzle is proven by an exhaustive solver.** `verify_levels.py` (Python, standard library only) tries every combination of items and shows each level is solvable. Level 3, for example, has 532 legal packs, 37 that win and exactly one perfect combination. The level data and solution fixtures are generated from it, and CI fails if they drift.
- **The rules are a pure TypeScript engine** with no React or DOM in it: shapes, rotation, collision, undo, weight and win checks. It is tested headlessly, and the engine replays the solver's answers as a cross-check between two implementations.
- **Dragging is tuned for WebKit.** Pointer input is applied once per animation frame and React re-renders only when the snapped target cell changes. Browser tests measure React commits and frame time during a drag on Chrome and Playwright's WebKit engine.
- **Saved data is treated as untrusted.** Progress and arrangements are versioned, validated and replayed through the engine, so a corrupt or outdated save cannot put an invalid board on screen.
- **Accessible by design:** the whole game plays from the keyboard, the score and weight are announced to screen readers, focus is always visible, and `prefers-reduced-motion` is respected.
- **Sound without assets.** The effects are synthesised with the Web Audio API, so there are no audio files or requests. Sound is off until the player turns it on, no audio context exists before that, and nothing in the game depends on hearing it.

## How it works

The suitcase is a grid and every item is a set of cells, so collision and rotation are exact. An item fits only if all its cells are on the board and none overlap another item. Rotate in 90° steps.

- **Weight** is shown on each item and as a running total (under 1 kg in grams). Going over the allowance is allowed while you pack and shown clearly; you win only when the total is within it, and exactly the allowance is fine.
- **Chaos** is a number stamped on every item. The total counts up as you pack.
- **Level 1** (5×6): pack all five items. There is no allowance and no target, and the solver shows it cannot be done without rotating.
- **Level 2** (6×5, 6.5 kg): choose from ten items and reach 20 Chaos. A perfect pack reaches 25.
- **Level 3** (7×6, 20.5 kg): two items (the painting and the laundry bag) must come, choose from ten more, and reach 24 Chaos. A perfect pack reaches 29.

Each target is 80% of the level's perfect score, rounded up. The game never says which combination is perfect; reaching it earns a gold meter and a seal on the boarding pass. Undo and reset are unlimited.

| Action | Mouse / touch | Keyboard |
|---|---|---|
| Move an item | Drag onto the suitcase (snaps to the grid) | `Tab` to an item, `Enter` to pick up, arrows to move, `Enter` to place |
| Rotate 90° | `Rotate` button; right-click while dragging | `R` |
| Cancel a move | Drop outside the suitcase | `Esc` |
| Remove an item | Drag back to the tray, or `Remove` | `Delete` / `Backspace` |
| Undo | `Undo` button | `Ctrl`/`⌘` + `Z` |

After a win, **Next level →** appears in the action row beside Rotate, Remove, Undo and Reset (also after *Keep packing*), and the suitcase does not move. First-time visitors see a branded start screen that waits, with no timer, until **Play** is pressed. Returning players skip it, and `?intro` replays it. Progress and your arrangement in each level are saved in the browser's `localStorage` only.

## Architecture

```
VERIFIED_LEVELS.json ──► src/engine (pure rules) ──► LevelPlay.tsx (drag, keyboard, dialogs) ──► App.tsx (levels, progress)
        ▲                                                                                              │
verify_levels.py (solver)                                                                  localStorage (validated)
```

A static single-page app with no network requests after load. `App` owns the open level, saved progress and arrangements; `LevelPlay` owns the live state of one level; `src/ui` holds pointer and layout maths; `src/status.ts` holds every sentence the game announces. Tradeoffs, including why `LevelPlay.tsx` is large on purpose and why the linter is Oxlint rather than ESLint, are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Verification

Run locally on the current branch:

- **Type check and lint:** `tsc -b` and Oxlint (`--deny-warnings`), both clean.
- **Unit tests:** 239 Vitest tests in 22 files covering the engine, solver fixtures, persistence, layout and drag maths, announcements, the sound system (against a mocked audio context) and the licence.
- **Solver:** `verify_levels.py` reproduces the committed puzzle data and fixtures exactly.
- **Browser tests:** Playwright drives real drags, rotation, keyboard play, progression, persistence and the opening at phone, tablet and desktop sizes, on Chrome, Playwright's WebKit and a Firefox subset, against both the dev server and the production build. The responsive checks cover phone, tablet and desktop widths from 320 to 1280 px on all three levels, including the suitcase staying still when a level is solved and text enlarged to 200% (simulated by scaling the root font size).
- **Production build:** `npm run check:prod-clean` fails if dev tools or solution data reach `dist`, and a test runs the game under the shipped Content-Security-Policy with no violations.

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs all of the above on every pull request as six parallel jobs: the static checks, then Chrome (two shards), WebKit (two shards) and Firefox. The timing-sensitive checks run alone on one worker so a busy runner cannot distort them.

## Run it locally

Node.js 24 (what CI uses) and Python 3.

```bash
npm ci
npm run dev            # dev server; includes a dev-only panel for jumping between levels
npm run build          # production build into dist/
```

To run the checks:

```bash
npx tsc -b
npm run lint
npm test                      # Vitest
python3 verify_levels.py      # solver; then `git diff --exit-code` on the generated files
npm run check:prod-clean
npx playwright install chrome webkit firefox   # once
PW_FIREFOX=1 npm run test:e2e
```

The browser tests use your installed Google Chrome plus Playwright's WebKit and Firefox builds, and start their own servers on ports 5180 and 5181.

## Limitations

- The author has played the game on a real iPhone, but there is no recorded device test, and desktop Safari, Safari's text-size setting and VoiceOver have not been tested. The WebKit tests use Playwright's engine, which is not Safari itself.
- Three levels. Progress lives in one browser: there are no accounts or sync.
- Adding a level means running the solver and regenerating its data. Item shapes and layouts are tuned for the shipped levels.
- Chaos values and difficulty are design choices, not measurements, and have had no formal playtesting.
- Not deployed yet.

## Where to look in the code

- Rules: `src/engine/` (`shape.ts`, `game.ts`); cross-checks in `engine.test.ts` and `enumerate.test.ts`.
- Solver: `verify_levels.py`, specification in `LEVEL_DESIGN.md`.
- Drag and keyboard interaction: `src/LevelPlay.tsx`, `src/ui/`; measured by `e2e/drag-performance.spec.ts`.
- Persistence: `src/progress.ts`, `src/boards.ts`.
- Opening: `src/useOpening.ts`, `e2e/opening.spec.ts`.
- Production checks: `e2e/prod.spec.ts`, `public/_headers`.
- Architecture notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Licence

Source-available, not open source. Copyright (c) 2026 Nova Zandkarimi, all rights reserved. You may read the code, play the game, and clone and run a private copy to evaluate it; no permission is given to redistribute, host or modify and distribute it, or to use it commercially. See [`LICENSE`](LICENSE) for the exact terms, which preserve your rights under applicable law and GitHub's terms (including forking on GitHub). Third-party components keep their own licences: React (MIT) and three fonts (SIL OFL 1.1), listed in [`public/third-party-notices.txt`](public/third-party-notices.txt).
