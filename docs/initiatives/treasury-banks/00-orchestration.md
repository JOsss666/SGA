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

Revisión final: **30 tareas granulares numeradas (TBANK 0.1 … 4.5)** por petición del usuario (más específicas, no agrupadas). Las 8 tareas coarse previas (TBANKS-01..08) se movieron a Papelera (reversibles).

- **Etapa 0 (decisiones/investigación):** TBANK 0.1–0.2. 0.1 asignada a José Murillo.
- **Etapa 1 (BD y migraciones):** TBANK 1.1–1.7 — **todas asignadas a José Murillo** (6c524b3b-28a0-4511-8106-31acd9b3027e).
- **Etapa 2 (API/servicios):** TBANK 2.1–2.9.
- **Etapa 3 (Frontend/Tesorería):** TBANK 3.1–3.7.
- **Etapa 4 (integración + pruebas):** TBANK 4.1–4.5.

Estado: todas "Sin empezar"; Estado tarea "Sin empezar" para 0.1/0.2 (disponibles) y "Pendiente de desarrollos" para el resto (bloqueadas por predecesora). ID/dependencias/criterios en el cuerpo de cada página.

Tareas de bancos preexistentes (NO modificadas): "Volver funcional la sección de Bancos (Mis bancos)", "Crear Sección de Bancos" (x2), "Crear Seccion de BankDetails", "Crear Sección de Conciliación bancaria". Dos están "Pagada"/asignadas y una es de Conciliación (fuera de alcance), por lo que no se archivó ninguna.

## Decisiones y bloqueos vigentes

- Decisiones locked (de este chat): saldo por moneda; movimientos solo desde documentos; sin conciliación bancaria; parametrización banco+cuenta con herencia; `currency` en `TransactionDetail`; auditoría append-only; hacer/deshacer a nivel detalle.
- Fase 0 completada: contratos JSON en `docs/bancos/contratos-json-bancos.md` (UMJP, Config Universal, Institución, Banco, Cuenta).
- 4 decisiones abiertas (§8 del brief) + ruta exacta documento→movimiento por confirmar.

## Próxima acción

- Esperar decisión del usuario sobre el plan de tareas (Etapa 3): corregir / aprobar sin publicar / aprobar y publicar en Notion. Para publicar falta destino de Notion inequívoco + conector autorizado.
