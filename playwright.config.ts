import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    headless: true,
  },
  webServer: {
    command: 'npx vite tests/e2e --port 5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
})