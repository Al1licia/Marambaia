import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Um único index.html na raiz serve para tudo:
 * - GitHub Pages (main / root) e dois cliques no arquivo usam ./js/app.js e ./css/style.css;
 * - no "npm run dev" este plugin troca essas linhas pelo código-fonte em src/main.tsx.
 */
const devEntry = (): Plugin => ({
  name: 'dev-entry',
  apply: 'serve',
  transformIndexHtml: (html) =>
    html
      .replace(/\s*<link rel="stylesheet" href="\.\/css\/style\.css" \/>/, '')
      .replace('<script defer src="./js/app.js"></script>', '<script type="module" src="/src/main.tsx"></script>'),
});

export default defineConfig({
  base: './',
  plugins: [react(), devEntry()],
  build: {
    // O build escreve js/, css/ e fonts/ na raiz, ao lado do index.html, sem apagar mais nada.
    outDir: '.',
    emptyOutDir: false,
    copyPublicDir: false,
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    cssMinify: false,
    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        // Script comum (não "module") para abrir também com dois cliques, em file://.
        format: 'iife',
        entryFileNames: 'js/app.js',
        assetFileNames: (asset) => (asset.names?.some((n) => n.endsWith('.css')) ? 'css/style.css' : 'fonts/[name][extname]'),
      },
    },
  },
  server: { port: 5173, strictPort: false },
});
