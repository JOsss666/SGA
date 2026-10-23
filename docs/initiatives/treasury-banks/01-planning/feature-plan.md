# Feature Plan — feature-TreasuryBanks

- **Iniciativa:** Bancos y cuentas bancarias dentro de Tesorería
- **Slug:** `treasury-banks`
- **Etapa:** 1 — Planeación (brief)
- **Revisión:** v1
- **Fecha:** 2026-10-22
- **Estado:** Borrador (pendiente de aprobación)

> Las afirmaciones de ingeniería se etiquetan como **Verificado**, **Propuesta**, **Supuesto** o **Pendiente**.

---

## 0. Las cuatro preguntas (lectura rápida)

- **¿Qué es?** Una funcionalidad **nueva y aditiva** dentro del módulo **Tesorería** que administra **bancos, cuentas bancarias y sus movimientos de dinero**.
- **¿Cuál es el objetivo?** Tener **control total y trazable** de las entradas y salidas de dinero por cuenta bancaria, con **saldo por moneda** y **auditoría completa**, alimentado **solo desde documentos**.
- **¿En qué consiste?** Un catálogo de instituciones (nivel ERP), bancos y cuentas por empresa, un contrato único de movimiento (**UMJP**) que emiten los documentos, y una UI con secciones (Movimientos, Información General, Acciones, Informes, Estadísticas).
- **¿Cómo lo vamos a hacer?** Reutilizando el patrón existente de Tesorería (controlador/servicio/esquema `"Treasury"` + rutas `/treasury/*`), de abajo hacia arriba: datos → API → frontend → integración.

---

## 1. Resumen ejecutivo

- **Nombre / tipo:** `feature-TreasuryBanks` — funcionalidad **nueva**, transversal (frontend Treasury + API + esquema `"Treasury"`).
- **Problema:** SGA controla cartera, cajas y anticipos, pero **no modela bancos ni cuentas bancarias** con saldo por moneda y auditoría. **Verificado:** no existe tabla `bank*` ni controlador/servicio de bancos en `api/`.
- **Resultado esperado:** sub-dominio de Bancos que administra débitos/créditos sobre cuentas bancarias, con saldo por moneda, parametrización en dos niveles y trazabilidad append-only.
- **Recomendación:** construirlo como **extensión aditiva de Tesorería**, no como módulo aparte.
- **Estado del brief:** **Preliminar.** Fase 0 (contratos JSON) ya definida en [docs/bancos/contratos-json-bancos.md](../../../bancos/contratos-json-bancos.md). Faltan las decisiones de §8 y trazar el punto exacto de integración documento→tesorería.

## 2. Requerimiento

- **Contexto actual:** Tesorería (app Vite "SGA - Treasuty") maneja cartera, cajas, anticipos y transacciones, pero el dinero en bancos no tiene modelo propio. **Verificado** por los contenedores existentes (`CashBoxes.jsx`, `TableTransactions.jsx`, `AcountsPlan.jsx`, `ThirdPartyAdvances.jsx`) y por los iconos `BankIcon.jsx`, `ConciliationIcon.jsx`, `MovmentIcon.jsx` sin pantalla de Bancos que los use.
- **Resultado deseado:** registrar instituciones bancarias (catálogo ERP), crear bancos y cuentas por empresa, y ver/operar sus movimientos con saldo por moneda, originados por documentos (compra, venta, ingreso, egreso, ajuste, POS).
- **Reglas de negocio (locked):** saldo por moneda; movimientos solo desde documentos; sin conciliación bancaria; parametrización banco+cuenta con herencia; `currency` a nivel `TransactionDetail`; auditoría append-only; hacer/deshacer a nivel detalle; `created_at` UTC + `business_date` por tienda.
- **Alcance incluido:** catálogo de instituciones, banco/cuenta por empresa, ingesta del contrato UMJP desde documentos, saldo por moneda, secciones de UI, auditoría.
- **Fuera de alcance:** conciliación bancaria; edición destructiva de históricos; originar dinero fuera de documentos.
- **Roles/permisos:** aislamiento por `company_id` (y `store_id` donde aplique), como el resto de Tesorería. **Verificado** en el patrón de `TreasuryController.js`.

## 3. Reconocimiento del repo

| Área / capa | Qué se inspeccionó | Hallazgo | Evidencia | Confianza |
|---|---|---|---|---|
| Módulo Tesorería (FE) | Árbol de `Treasury/SGA - Treasuty/src` | App Vite propia con `userApp/containers`; hay `BankIcon`/`ConciliationIcon` pero **ninguna pantalla de Bancos** | `Treasury/SGA - Treasuty/src/.../containers/*`, `src/assets/BankIcon.jsx` | Verificado |
| API — controlador | `TreasuryController.js` | Patrón: `readJsonBody`, `withTransaction`, SQL crudo `$n`, filtra por `company_id`/`store_id`/`created_at`, esquema `"Treasury"` + `"Ecosystem".documents` | `api/controllers/TreasuryController.js` | Verificado |
| API — rutas | `index.routes.js` | Endpoints `POST /treasury/<action>`; varios "PENDIENTE IMPLEMENTAR" | `api/routes/index.routes.js:388` | Verificado |
| Esquema `"Treasury"` | grep de tablas usadas | Existen `accounts_receivable/payable`, `cash_boxes`, `customer_advances`, `advance_applications`, `portfolio_payments`, `mv_thirdparty_payable_balances`. **No hay** tablas de bancos | grep sobre `api/**/*.js` | Verificado |
| Bancos (actual) | grep `bank_account`/`Banks`/`banco` en `api` | **Cero** referencias → net-new | búsqueda sin resultados | Verificado |
| Migraciones | `db/migrations` | 44 `.sql`; lugar de cambios de esquema (aditivos) | `db/migrations/*.sql` | Verificado |
| Zona horaria | servicios | `businessTimeZoneService.js` disponible para día comercial | `api/services/businessTimeZoneService.js` | Verificado |
| Integración doc→tesorería | servicios | `cashReceiptService`, `customerAdvanceService`, `parameterDocumentService` escriben a Tesorería en transacciones | `api/services/*` | Parcial — no se trazó la ruta exacta doc→movimiento |
| Plan de cuentas | contenedor FE | `AcountsPlan.jsx`/`ConceptsPlan.jsx` sugieren catálogo contable (fuente de `account_id`) | `.../containers/AcountsPlan.jsx` | Supuesto |

## 4. Mapa de comportamiento y brechas

| Escenario | Funcionamiento actual | Comportamiento requerido | Brecha / cambio |
|---|---|---|---|
| Registrar banco/cuenta | No existe | Catálogo instituciones + banco/cuenta por empresa | **Nuevo** FE + API + esquema |
| Mover dinero en banco | Dinero se mueve en cartera/caja, no en bancos | Documento emite **UMJP** → movimiento bancario | **Nuevo** punto de ingesta + persistencia |
| Ver saldo | Saldos de cartera/caja | **Saldo por moneda** derivado de detalles | **Nuevo** agregado por `(cuenta, moneda)` |
| Corregir movimiento | N/A | **Reverse** append-only (no borrar) | **Nuevo** hacer/deshacer |
| Auditar | `created_at`/scoping por compañía | Bitácora append-only por operación/detalle | **Nuevo** servicio de auditoría de bancos |

## 5. Propuesta técnica

**Flujo propuesto (extremo a extremo):** *(Propuesta)*
`Documento (venta/compra/ingreso/egreso/ajuste/POS) → emite UMJP → Banks Controller (/treasury/banks/*) → Banks Service / Movements Service / Audit Service en una transacción → esquema "Treasury" (instituciones, bancos, cuentas, transacciones, detalles, auditoría) → lecturas de saldo por moneda e informes → UI del módulo Tesorería.`

**Cambios por capa:**
- **Frontend (Treasury):** nuevos contenedores en `userApp/containers` para `buscar banco → cuentas → secciones (Movimientos / Info General / Acciones / Informes / Estadísticas)`, reutilizando `universalTable.jsx`, `TableTransactions.jsx` e iconos existentes. Aplicarán `sga-workflow` + `ui-ux-pro-max`.
- **API / contrato:** nuevos endpoints `POST /treasury/banks/...` siguiendo `readJsonBody` + `withTransaction` + SQL `$n` + scoping por `company_id`. **No** se modifican contratos existentes.
- **Servicios/dominio:** `banksService`, `banksMovementsService` (normaliza UMJP, calcula saldo por moneda, hacer/deshacer), `banksAuditService` (append-only), reutilizando `businessTimeZoneService`.
- **Esquema (aditivo, `db/migrations`):** tablas nuevas en `"Treasury"` para institución, banco, cuenta, transacción, detalle (con `currency`) y auditoría. `created_at` `timestamptz`. **Saldo derivado** (consulta/vista), **nunca materializado por trigger** (lección del bug de doble saldo del cierre de caja). Migración aditiva, transaccional, con rollback.
- **Integración:** definir el punto donde cada documento llama a `banksService` para emitir el UMJP, al estilo de `cashReceiptService`. **(Pendiente de confirmar la ruta exacta.)**
- **Multiempresa/idempotencia/transacciones:** scoping por `company_id`; `idempotency_key` evita doble posteo; operación en una transacción.

**Reutilización vs. alternativa:** se **reutiliza** la infraestructura de Tesorería en lugar de crear un módulo nuevo — menor costo, coherencia y aislamiento ya resueltos. Alternativa descartada: módulo bancos independiente (duplicaría auth, scoping y el concepto de "movimiento de dinero").

## 6. Plan de desarrollo por etapas (conceptual)

| Orden | Objetivo / salida verificable | Capas | Dependencias | Paralelismo | Validación |
|---|---|---|---|---|---|
| 0 | Contratos UMJP/config definidos | Docs | — | — | **Hecho** (docs/bancos) |
| 1 | Esquema aditivo de bancos en `"Treasury"` | Datos | Fase 0 | — | Migración aplica y revierte limpio |
| 2 | API + servicios (CRUD, ingesta UMJP, saldo por moneda, auditoría) | API | Etapa 1 | — | Endpoints responden; saldo correcto por moneda |
| 3 | UI del módulo Tesorería (navegación + secciones) | FE | Contrato de Etapa 2 (puede arrancar con mock) | Paralelo a 2 contra contrato | Flujos visibles y correctos |
| 4 | Integración documento→UMJP + pruebas (medianoche/DST, reverse, multimoneda) | API/FE | Etapas 2–3 | — | Documento genera movimiento auditable |

**Orden recomendado:** abajo→arriba (datos→API→FE), con el FE adelantable contra el contrato.

## 7. Riesgos, validación y liberación

- **Riesgo — doble saldo por triggers:** mitigar con saldo **derivado**, no materializado (precedente real en cierre de caja).
- **Riesgo — día comercial multi-tienda:** usar `businessTimeZoneService` + `context.business_date`; **pruebas de medianoche y DST**.
- **Riesgo — integración doc→banco no trazada:** confirmar la ruta antes de la Etapa 4. *(Pendiente)*
- **Validaciones sugeridas** (no ejecutadas): unitarias de saldo por moneda y reverse; contrato del UMJP; permisos por compañía; migración (apply/rollback); regresión de Tesorería.
- **Liberación:** despliegue por etapas; todo aditivo, sin tocar contratos ni datos históricos.

## 8. Supuestos, preguntas y decisiones

| Tipo | Dato | Impacto si cambia | Quién confirma |
|---|---|---|---|
| Decisión | `concept` del detalle: enum cerrado vs. abierto | Validación y reportes | Usuario |
| Decisión | `account_id` del detalle: contrapartida opcional vs. heredada | Modelo contable | Usuario |
| Decisión | `operation: modify` real vs. solo reverse+create | Auditoría | Usuario |
| Decisión | Catálogo de instituciones: cerrado vs. mixto (`company_private`) | Alcance de admin | Usuario |
| Pendiente | Ruta exacta documento→movimiento | Diseño de integración | Investigación Etapa 4 |
| Supuesto | `account_id` sale del plan de cuentas existente (`AcountsPlan`) | Vínculo contable | Verificar en `Contability`/esquema |

## 9. Paquete de transferencia

- **Decisiones locked** (respetar): saldo por moneda; solo documentos; sin conciliación; parametrización 2 niveles con herencia; `currency` en detalle; append-only; reverse a nivel detalle.
- **Evidencia a enlazar:** [docs/bancos/contratos-json-bancos.md](../../../bancos/contratos-json-bancos.md), `api/controllers/TreasuryController.js`, `api/routes/index.routes.js:388`, `db/migrations/`, `api/services/businessTimeZoneService.js`.
- **Para la Etapa 2 (diseño/diagramas):** probablemente aporten valor un **diagrama de dominio** (5 niveles) y uno de **los 3 flujos** (captura/comando/ejecución); la Etapa 2 decidirá si se generan.
- **Insumos para el desglose:** dependencias por etapa, resultados verificables y las 4 decisiones de §8 por cerrar.

---

_Etapa 1 · feature-TreasuryBanks · v1 · 2026-10-22 · Borrador_
