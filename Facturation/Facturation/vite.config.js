// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Asegúrate de que en Render esta variable NO esté como 'true'
  const isElectron = process.env.ELECTRON === 'true';

  return {
    plugins: [react()],
    // Si estás en producción para Web (Render), '/' es lo más seguro.
    base: isElectron ? './' : '/', 
    build: {
      rollupOptions: {
        input: {
            main: resolve(__dirname, 'index.html'),
            facturacion: resolve(__dirname, 'Facturation/Facturation/index.html'),
            inventario: resolve(__dirname, 'Inventory/SGA-inventory/index.html'),
            contabilidad: resolve(__dirname, 'Inventory/index.html'),
            procesos: resolve(__dirname, 'Process/SGA-Process/index.html'),
            tesoreria: resolve(__dirname, 'Treasury/SGA - Treasuty/index.html'),
            management: resolve(__dirname, 'SGA-management/SGA-management/index.html'),
        }
      },
      outDir: 'dist',
      // Es recomendable vaciar la carpeta de salida en cada build
      emptyOutDir: true,
    },
    server: {
      port: 5173
    }
  };
});

