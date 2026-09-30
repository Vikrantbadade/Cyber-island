import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    fileParallelism: false, // all suites share one real PostgreSQL DB
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
