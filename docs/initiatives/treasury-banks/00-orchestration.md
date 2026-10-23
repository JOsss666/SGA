# Orquestación: feature-TreasuryBanks

- Slug: `treasury-banks`
- Estado: COMPLETE (tareas publicadas en Notion)
- Etapa activa: ninguna
- Última actualización: 2026-10-22

## Entregables y aprobaciones

| Etapa | Archivo(s) | Revisión | Estado | Aprobación/correcciones |
|---|---|---|---|---|
| 1 — Planeación | `01-planning/feature-plan.md` | v1 | Aprobada ("Procede") | — |
| 2 — Diseño/diagramas | `02-design/feature-design.md`, `02-design/README.md`, `02-design/diagrams/*` (mmd+svg+png) | v1 | Aprobada ("continua etapa 3") | — |
| 3 — Ejecución (tareas) | `03-execution/task-plan.md` | v1 | Aprobada y PUBLICADA en Notion (8 tareas coarse TBANKS-01..08) | Usuario: "publicar las 22 completas" + "agrupadas al estilo tablero" |

## Publicación en Notion (tablero: SGA - WorkFlow - Development · collection://27a8a604-4642-81c0-8bd1-000bd8adf457)

8 tareas creadas (coarse, cubren todo el feature). No se tocó ninguna tarea existente.

| ID | Tarea | Módulo | URL |
|---|---|---|---|
| TBANKS-01 | Decisiones e investigación previa | Back-end | https://app.notion.com/p/4028a604464281e9bf83e8c3f2cb32e6 |
| TBANKS-02 | Esquema de datos (migración aditiva) | Back-end | https://app.notion.com/p/4028a604464281219e8aed8ae22b1ded |
| TBANKS-03 | API y servicios (CRUD + parametrización) | Back-end | https://app.notion.com/p/4028a604464281b7bb5cf6b309c43431 |
| TBANKS-04 | Ingesta UMJP + saldo por moneda + reverse + auditoría | Back-end | https://app.notion.com/p/4028a60446428198986fc498cc827b95 |
| TBANKS-05 | Informes/estadísticas por día comercial | Back-end | https://app.notion.com/p/4028a60446428103b033da16362cfea4 |
| TBANKS-06 | FE: navegación + Mis bancos + Info General + parametrización | Tesorería | https://app.notion.com/p/4028a60446428150b7cdef20a417e51b |
| TBANKS-07 | FE: Movimientos + Acciones (documentos) + Informes | Tesorería | https://app.notion.com/p/4028a604464281c9ac87ec4990777f15 |
| TBANKS-08 | Integración documento→UMJP + pruebas | Back-end | https://app.notion.com/p/4028a6044642818496f1ff59b3247a45 |

Tareas de bancos preexistentes (NO modificadas; posible solape a revisar): "Volver funcional la sección de Bancos (Mis bancos)", "Crear Sección de Bancos" (x2), "Crear Seccion de BankDetails", "Crear Sección de Conciliación bancaria".

## Decisiones y bloqueos vigentes

- Decisiones locked (de este chat): saldo por moneda; movimientos solo desde documentos; sin conciliación bancaria; parametrización banco+cuenta con herencia; `currency` en `TransactionDetail`; auditoría append-only; hacer/deshacer a nivel detalle.
- Fase 0 completada: contratos JSON en `docs/bancos/contratos-json-bancos.md` (UMJP, Config Universal, Institución, Banco, Cuenta).
- 4 decisiones abiertas (§8 del brief) + ruta exacta documento→movimiento por confirmar.

## Próxima acción

- Esperar decisión del usuario sobre el plan de tareas (Etapa 3): corregir / aprobar sin publicar / aprobar y publicar en Notion. Para publicar falta destino de Notion inequívoco + conector autorizado.
