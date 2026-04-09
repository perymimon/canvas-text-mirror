import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/angular.ts'],  // Angular requires a full Angular test setup
    },
  },
})