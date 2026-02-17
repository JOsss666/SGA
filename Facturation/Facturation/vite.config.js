// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // CRÍTICO: Hace que las rutas sean relativas para Electron
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        facturacion: resolve(__dirname, 'Facturation/Facturation/index.html'),
        inventario: resolve(__dirname, 'Inventory/SGA-inventory/index.html'),
        //contabilidad: resolve(__dirname, 'Inventory/index.html'),
        procesos: resolve(__dirname, 'Process/SGA-Process/index.html'),
        tesoreria: resolve(__dirname, 'Treasury/SGA - Treasuty/index.html'),
        management: resolve(__dirname, 'SGA-management/SGA-management/index.html'),
        // Añade cada carpeta que tenga su propio index.html
      }
    }
  }
});