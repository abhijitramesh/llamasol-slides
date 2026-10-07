import { defineConfig } from 'vite';

export default defineConfig({
  root: 'slides',
  base: './',
  server: { port: 5173, strictPort: true },
  build: { outDir: '../dist', emptyOutDir: true },
});
