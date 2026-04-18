import { defineConfig } from 'vite';

// GitHub Pages serves project pages from /<repo>/, so the base path must match.
// Override via BASE_PATH env var for forks or custom domains.
const repoBase = process.env.BASE_PATH ?? '/jelly-world/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? repoBase : '/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
}));
