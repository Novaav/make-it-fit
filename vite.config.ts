import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // relative asset paths: the build works from a site root and from a sub-folder (project pages, previews)
  base: './',
  plugins: [react()],
  test: { include: ['src/**/*.test.{ts,tsx}'], css: true },
})
