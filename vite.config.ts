import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Navegadores bloqueiam type="module" e crossorigin em file://.
// Trocar por script comum mantém o dist/index.html abrindo com dois cliques.
const openFromDisk = (): Plugin => ({
  name: 'open-from-disk',
  transformIndexHtml: {
    order: 'post',
    handler: (html) => html.replace(/<script type="module" crossorigin/g, '<script defer').replace(/ crossorigin/g, ''),
  },
});

export default defineConfig({
  base: './',
  plugins: [react(), openFromDisk()],
  build: {
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    cssMinify: false,
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'js/app.js',
        assetFileNames: (asset) => (asset.names?.some((n) => n.endsWith('.css')) ? 'css/style.css' : 'fonts/[name][extname]'),
      },
    },
  },
  server: { port: 5173, strictPort: false },
});
