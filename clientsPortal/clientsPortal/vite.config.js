import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// Este portal reutiliza código compartido de ../../costume-modules/*. Esos archivos
// resuelven sus imports "pelados" (papaparse, xlsx, etc.) desde su propia ubicación,
// subiendo hacia el node_modules de la RAÍZ del repo — que Render no instala para este
// static site (solo instala el node_modules de este portal). Para que la resolución no
// dependa de la raíz, forzamos que toda dependencia declarada por este portal se resuelva
// desde ESTE node_modules, sin importar desde qué carpeta se importe.
const dependencyAliases = Object.keys(pkg.dependencies || {}).map((dep) => ({
  find: dep,
  replacement: fileURLToPath(new URL(`./node_modules/${dep}`, import.meta.url)),
}));

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: { alias: dependencyAliases },
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
