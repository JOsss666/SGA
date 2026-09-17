# Portal de proveedores

Base independiente de Vite + React para SGA.

```sh
cd supplierPortal/supplierPortal
npm install
npm run dev
```

Servidor local: http://localhost:5174. `npm run build` genera `dist`; `npm run preview` permite revisarlo.

Copia `.env.example` a `.env.local` para configurar `VITE_API_URL`. Para desplegar, configura esa variable con la URL del backend del ambiente.

## Estructura

- `src/modules/userApp/pages`: páginas propias del portal.
- `src/modules/userApp/components` y `containers`: copia literal del estado local de Facturación al crear el módulo.
- `universalTable`, `universalRow` y `universalTableLoadingShader`, con sus CSS: copiados de Tesorería.
- Contextos, utilidades, servicios, login y recursos: conservados de Facturación para resolver las dependencias de los componentes.

El portal usa el acceso externo de terceros y permite consultar únicamente el informe de procesos, filtrado por el tercero conectado. Comparte como base el estado actual de clientsPortal; las diferencias específicas del proceso de proveedores se implementarán sobre esta copia. Los componentes heredados conservan sus dependencias al módulo compartido `costume-modules/zjSAS.S`; este proyecto se ejecuta dentro del monorepo.

El script de lint conserva las reglas de Facturación y puede reportar incidencias heredadas en el código copiado.
