import { defineConfig } from 'vite';

export default defineConfig({
  // No plugins needed — pure Vanilla TS
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  // Vitest configuration
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});
