# Portal de clientes

Base independiente de Vite + React para SGA.

```sh
cd clientsPortal/clientsPortal
npm install
npm run dev
```

Servidor local: http://localhost:5173. `npm run build` genera `dist`; `npm run preview` permite revisarlo.

Copia `.env.example` a `.env.local` para configurar `VITE_API_URL`. Para desplegar, configura esa variable con la URL del backend del ambiente.

## Estructura

- `src/modules/userApp/pages`: páginas propias del portal.
- `src/modules/userApp/components` y `containers`: copia literal del estado local de Facturación al crear el módulo.
- `universalTable`, `universalRow` y `universalTableLoadingShader`, con sus CSS: copiados de Tesorería.
- Contextos, utilidades, servicios, login y recursos: conservados de Facturación para resolver las dependencias de los componentes.

La entrada solo muestra la página base. Las rutas administrativas, autenticación y permisos específicos del portal todavía deben implementarse antes de habilitar sus funcionalidades. Los componentes heredados conservan sus rutas y dependencias al módulo compartido `costume-modules/zjSAS.S`; este proyecto se ejecuta dentro del monorepo.

El script de lint conserva las reglas de Facturación y puede reportar incidencias heredadas en el código copiado.
