import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    globals: true,
    environment: 'node',
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
  },
});
