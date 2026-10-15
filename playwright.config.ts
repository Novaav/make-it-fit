import { defineConfig } from '@playwright/test'

// Uses the locally installed Google Chrome (no browser download). Free, local only.
const DEV = 'http://localhost:5180'
const PROD = 'http://localhost:5181'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [['list']],
  use: { channel: 'chrome', headless: true, viewport: { width: 1280, height: 900 }, trace: 'off' },
  projects: [
    { name: 'dev', testMatch: /game\.spec\.ts/, use: { baseURL: DEV } },
    { name: 'prod', testMatch: /prod\.spec\.ts/, use: { baseURL: PROD } },
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
