# Deploying Make It Fit (Cloudflare Pages)

Make It Fit is a static single-page app: no server, no database, no environment variables, no third-party requests. Deploy it as **its own Cloudflare Pages project**, separate from any other site (for example a portfolio), so releases, caching and rollbacks stay independent.

## Settings

| Setting | Value |
|---|---|
| Framework preset | None (Vite is configured in the repo) |
| Build command | `npm run build` (runs `tsc -b` then `vite build`) |
| Build output directory | `dist` |
| Root directory | `/` (repository root) |
| Node.js | 24 (the version CI uses); set `NODE_VERSION=24` as a build variable |
| Environment variables | none |
| Production branch | `main` |

Every other branch and pull request gets a preview deployment automatically; production only changes when `main` changes.

## What the build ships

- `dist/index.html`, one fingerprinted JS bundle (about 105 kB gzipped), one CSS file and four self-hosted WOFF2 fonts under `dist/assets/`.
- `dist/_headers` (from `public/_headers`): security headers (strict Content-Security-Policy with no third-party origins, `nosniff`, referrer and permissions policies, no framing) and caching (`/assets/*` immutable for a year because filenames are hashed; the page itself always revalidates).
- `dist/og.jpg`: a social-preview picture (a real screenshot of the game).
- Asset paths are relative (`base: './'`), so the build also works from a sub-folder.
- There is no client-side routing, so no `_redirects` or SPA fallback is needed. HTTPS is provided by Cloudflare; the game stores nothing but `localStorage` and one `sessionStorage` key in the visitor's own browser.
- Development tools and solution data are compiled out; `npm run check:prod-clean` fails the build if they leak.

## Before the first public deploy

1. Put the final domain into the page metadata: add `<meta property="og:image" content="https://YOUR-DOMAIN/og.jpg">`, `<meta property="og:url" content="https://YOUR-DOMAIN/">` and `<meta name="twitter:card" content="summary_large_image">` to `index.html` (crawlers need absolute URLs, which is why they are not in the repository yet).
2. Add the chosen `LICENSE` file at the repository root and keep `src/assets/fonts/LICENSE-*.txt` and `public/third-party-notices.txt` in place; the SIL Open Font Licence requires the font licences to travel with the fonts.
3. Make sure GitHub Actions is green on the commit being deployed (type check, unit tests, solver, production-clean, Chrome, WebKit and Firefox browser tests).
4. Open the preview URL on a real iPhone and in desktop Safari (the automated suite uses Playwright's WebKit engine, which is not Safari itself).

## Verify a build locally

```bash
npm ci
npm run build
npx vite preview     # http://localhost:4173
```

## Rollback

Cloudflare Pages keeps every deployment; promote the previous one from the dashboard, or revert the commit on `main`.
