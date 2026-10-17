import { defineConfig } from '@playwright/test'

// Chromium-based projects use the installed Google Chrome; the webkit project uses Playwright's WebKit build.
const DEV = 'http://localhost:5180'
const PROD = 'http://localhost:5181'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: { headless: true, viewport: { width: 1280, height: 900 }, trace: 'off' },
  projects: [
    { name: 'dev', testMatch: /(game|arrangement-game|onboarding|progression|reliability|chaos|explorer|opening|drag-performance|art)\.spec\.ts/, use: { channel: 'chrome', baseURL: DEV } },
    // Safari/WebKit: drag rendering bugs have been Safari-specific, so the drag spec also runs on the WebKit engine.
    { name: 'webkit', testMatch: /(drag-performance|art|chaos|opening)\.spec\.ts/, use: { browserName: 'webkit', baseURL: DEV } },
    // Firefox smoke test: opt in with PW_FIREFOX=1 (CI does; locally run `npx playwright install firefox` first)
    ...(process.env.PW_FIREFOX ? [{ name: 'firefox', testMatch: /(opening|reliability|art|chaos)\.spec\.ts/, use: { browserName: 'firefox' as const, baseURL: DEV } }] : []),
    { name: 'prod', testMatch: /prod\.spec\.ts/, use: { channel: 'chrome', baseURL: PROD } },
  ],
  webServer: [
    { command: 'npx vite --port 5180 --strictPort', url: DEV, reuseExistingServer: false, timeout: 60_000 },
    {
      command: 'npx vite build && npx vite preview --port 5181 --strictPort',
      url: PROD,
      reuseExistingServer: false,
      timeout: 90_000,
    },
  ],
})
