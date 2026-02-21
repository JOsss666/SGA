// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isElectron = process.env.ELECTRON === 'true';

  return {
    plugins: [react()],
    base: isElectron ? './' : '/', 
    build: {
      rollupOptions: {
        input: {
          // El index principal de la raíz
          main: resolve(__dirname, 'index.html'),
          
          // La ruta exacta basada en tu captura de pantalla:
          // SGA (raíz) -> Facturation -> Facturation -> index.html
          facturacion: resolve(__dirname, 'Facturation/Facturation/index.html'),
        }
      },
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 5173
    }
  };
});