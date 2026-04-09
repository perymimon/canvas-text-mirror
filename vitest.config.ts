import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/angular.ts'],  // Angular requires a full Angular test setup
    },
  },
})