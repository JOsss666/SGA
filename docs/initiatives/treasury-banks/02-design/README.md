# Paquete de diseño — feature-TreasuryBanks (Etapa 2)

- **Iniciativa:** `treasury-banks`
- **Fecha:** 2026-10-22 · **Revisión:** v1 · **Estado:** Propuesto (pendiente de aprobación)

## Archivos

| Archivo | Audiencia | Propósito | Estado |
|---|---|---|---|
| [feature-design.md](feature-design.md) | Desarrollo, QA, coworkers | Especificación funcional + diseño técnico + criterios de aceptación + diagramas | Propuesto |
| README.md (este) | Orquestador / equipo | Índice del paquete | Propuesto |
| [diagrams/modelo-datos.png](diagrams/modelo-datos.png) | Desarrollo, QA | Imagen renderizada del modelo de datos | Propuesto |
| [diagrams/modelo-datos.svg](diagrams/modelo-datos.svg) | Desarrollo, QA | Versión vectorial del modelo de datos | Propuesto |
| [diagrams/modelo-datos.mmd](diagrams/modelo-datos.mmd) | Desarrollo | Fuente Mermaid editable del modelo de datos | Propuesto |
| [diagrams/secuencia-ingesta-reverse.png](diagrams/secuencia-ingesta-reverse.png) | Desarrollo, QA | Imagen renderizada del flujo de ingesta y reverso | Propuesto |
| [diagrams/secuencia-ingesta-reverse.svg](diagrams/secuencia-ingesta-reverse.svg) | Desarrollo, QA | Versión vectorial de la secuencia | Propuesto |
| [diagrams/secuencia-ingesta-reverse.mmd](diagrams/secuencia-ingesta-reverse.mmd) | Desarrollo | Fuente Mermaid editable de la secuencia | Propuesto |

## Diagramas (imágenes en el documento y fuentes Mermaid editables)

- **Modelo de datos (§6.1)** — responde: ¿cómo se relacionan institución, banco, cuenta, transacción, detalle y auditoría, y dónde viven la moneda y el puente contable?
- **Secuencia de ingesta + reverse (§6.2)** — responde: ¿qué ocurre, en orden, al registrar un movimiento desde un documento y cómo se deshace sin borrar?

![Vista previa del modelo de datos](diagrams/modelo-datos.png)

![Vista previa de la secuencia de ingesta y reverso](diagrams/secuencia-ingesta-reverse.png)

Se eligió **Mermaid** como fuente editable y versionable; el paquete incluye gráficos SVG y vistas PNG que se visualizan directamente en `feature-design.md`.

**Diagramas evaluados y omitidos:** arquitectura de módulos y ciclo de vida del movimiento — no reducían ambigüedad respecto a la secuencia y la prosa (ver §6.3).

## Limitaciones / consistencia a conservar

- Nombres de tablas (`bank_institutions`, `banks`, `bank_accounts`, `bank_transactions`, `bank_transaction_details`, `bank_audit`) y endpoints (`/treasury/banks/*`) son **Propuesta** — no existen aún.
- **Pendiente P1:** ruta exacta documento→movimiento, por confirmar antes de la Etapa 4.
- **Supuesto S1:** `account_id` proviene del plan de cuentas existente.
- **Decisiones abiertas D1–D4** afectan detalle fino, no el plan por etapas.

---

## Adenda 2026-11-20 — Backend implementado (borrador)

Describe lo que existe hoy en `work.Juan`, antes de empezar las pruebas. No reemplaza ni modifica el diseño v1 de arriba (que sigue marcando endpoints como "Propuesta").

| Archivo | Audiencia | Propósito | Estado |
|---|---|---|---|
| [backend-implementado.md](backend-implementado.md) | Desarrollo, QA | Qué hay, para qué sirve, endpoints, reglas de `registerMovement`, criterios de prueba y discrepancias | Borrador |
| [diagrams/backend-arquitectura.svg](diagrams/backend-arquitectura.svg) | Desarrollo, QA | Imagen: capas y endpoints, de la petición a la BD | Borrador |
| [diagrams/backend-arquitectura.mmd](diagrams/backend-arquitectura.mmd) | Desarrollo | Fuente Mermaid editable de la arquitectura | Borrador |
| [diagrams/backend-registro-movimiento.svg](diagrams/backend-registro-movimiento.svg) | Desarrollo, QA | Imagen: secuencia de `registerMovement` (create/reverse, errores) | Borrador |
| [diagrams/backend-registro-movimiento.mmd](diagrams/backend-registro-movimiento.mmd) | Desarrollo | Fuente Mermaid editable de la secuencia | Borrador |

- **Pregunta de la arquitectura:** ¿qué piezas existen hoy y cómo se conectan, de la petición HTTP a la BD?
- **Pregunta de la secuencia:** ¿qué valida y qué escribe el backend al registrar un movimiento, y qué errores devuelve?
- **Herramienta:** Mermaid como fuente; los SVG se dibujaron a mano porque no hay renderizador de Mermaid instalado (no se instaló nada). Si cambia el código, hay que actualizar fuente y SVG.
- **Diagramas evaluados y omitidos:** ciclo de vida del movimiento (solo `create`/`reverse`, ya cubierto por [bd-implementada-reverse-saldo.svg](diagrams/bd-implementada-reverse-saldo.svg)) y modelo de datos (ya cubierto por [bd-implementada-er.svg](diagrams/bd-implementada-er.svg)).
- **Inconsistencias a conservar:** `0039_add_bank_contract_fields` está aplicada en la BD viva pero su archivo no está en `db/migrations/` de `work.Juan` (sí en `test`, commit `a527b354`); `feature-design.md`, este README y `estructura-bd-implementada.md` quedaron desactualizados respecto al backend; los errores de validación de `banksService` salen como 500.
