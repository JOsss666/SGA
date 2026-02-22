// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Asegúrate de que en Render esta variable NO esté como 'true'
  const isElectron = process.env.ELECTRON === 'true';

  const inputs = {main: resolve(__dirname, 'index.html')}

  if(isElectron){
      inputs.facturacion = resolve(__dirname, 'Facturation/Facturation/index.html')
      inputs.inventario = resolve(__dirname, 'Inventory/SGA-inventory/index.html')
      inputs.contabilidad = resolve(__dirname, 'Inventory/index.html')
      inputs.procesos = resolve(__dirname, 'Process/SGA-Process/index.html')
      inputs.tesoreria = resolve(__dirname, 'Treasury/SGA - Treasuty/index.html')
      inputs.management = resolve(__dirname, 'SGA-management/SGA-management/index.html')
  }

  return {
    plugins: [react()],
    // Si estás en producción para Web (Render), '/' es lo más seguro.
    base: isElectron ? './' : '/', 
    build: {
      rollupOptions: {
        input:inputs
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

