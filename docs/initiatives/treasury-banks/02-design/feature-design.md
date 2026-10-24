# Diseño — feature-TreasuryBanks

- **Iniciativa:** Bancos y cuentas bancarias dentro de Tesorería (`treasury-banks`)
- **Etapa:** 2 — Diseño y diagramas
- **Revisión:** v1
- **Fecha:** 2026-10-22
- **Estado:** Propuesto (pendiente de aprobación)
- **Insumo:** [01-planning/feature-plan.md](../01-planning/feature-plan.md) (Etapa 1, aprobada)

> Etiquetas: **Verificado** (existe en el repo), **Propuesta** (se construirá), **Supuesto** (por confirmar), **Pendiente** (sin resolver). Los nombres de tablas/endpoints marcados **Propuesta** aún no existen.

---

## 1. Propósito y resumen

feature-TreasuryBanks añade al módulo **Tesorería** la capacidad de administrar **bancos, cuentas bancarias y sus movimientos de dinero**. El objetivo es tener **control total y trazable** de las entradas y salidas por cuenta, con **saldo por moneda** y **auditoría append-only**, donde el dinero **solo se mueve a partir de documentos** (compra, venta, ingreso, egreso, ajuste, POS). **Estado: Propuesto.**

## 2. Alcance y fuera de alcance

**Incluido:**
- Catálogo de **instituciones bancarias** a nivel ERP (compartido).
- **Banco** y **cuenta bancaria** por empresa, con parametrización en dos niveles (herencia + override).
- Ingesta del contrato único de movimiento **UMJP** emitido por documentos.
- **Saldo por moneda** (derivado de los detalles).
- UI con secciones: Movimientos, Información General, Acciones, Informes, Estadísticas.
- **Auditoría append-only** y **hacer/deshacer** a nivel de detalle (reverse).

**Fuera de alcance:**
- Conciliación bancaria (extracto vs. registros).
- Edición destructiva de históricos; cualquier borrado físico.
- Originar dinero fuera de documentos (no hay movimientos "sueltos").

## 3. Comportamiento esperado (escenarios y reglas)

- **E1 — Registrar institución (admin ERP):** el administrador crea "Bancolombia" una sola vez; queda disponible para todas las empresas. Regla: el cliente **selecciona**, no crea la institución (salvo decisión D4).
- **E2 — Crear banco/cuenta (empresa):** la empresa elige una institución y crea su banco (agrupador) y sus cuentas. La **cuenta** guarda `account_number` y `account_id` (puente a la cuenta contable). Regla: el **banco no apunta a cuenta contable**; la **cuenta sí**.
- **E3 — Registrar movimiento desde documento:** al confirmar un documento, este emite un **UMJP** (`operation: create`) con uno o más detalles; cada detalle lleva su `currency`, `amount` y `direction`. El sistema registra la transacción y actualiza el saldo **por moneda**.
- **E4 — Deshacer (reverse):** una corrección emite `operation: reverse` con detalles de dirección inversa y `reverses_detail_id` al original. **Nada se borra**; el saldo se recompone.
- **E5 — Ver saldo e informes:** el usuario ve el saldo **por moneda** de cada cuenta y los informes/estadísticas agrupados por **día comercial** (zona de la tienda).
- **E6 — Idempotencia:** si el mismo documento reintenta el posteo con igual `idempotency_key`, **no se duplica** el movimiento.
- **E7 — Aislamiento multiempresa:** toda lectura/escritura se filtra por `company_id`. **Verificado** como patrón vigente en Tesorería.

## 4. Criterios de aceptación (verificables)

- **CA1:** Crear banco/cuenta persiste con `company_id`, `institution_id` y (en cuenta) `account_id`; el banco nunca almacena `account_id`.
- **CA2:** Un UMJP `create` con N detalles crea 1 transacción y N detalles con su `currency`; el saldo de la cuenta refleja la suma **por moneda** (no mezcla monedas).
- **CA3:** Un UMJP con `idempotency_key` repetido no crea un segundo movimiento.
- **CA4:** Un `reverse` genera detalles inversos enlazados por `reverses_detail_id`, deja el histórico intacto y recompone el saldo; existe registro de auditoría de la acción.
- **CA5:** Todo alta/reverso queda en la bitácora append-only con `actor.user_id`, `operation` y `created_at`.
- **CA6:** Los informes agrupan por `business_date` usando `businessTimeZoneService`; pruebas de medianoche/DST pasan.
- **CA7:** Lecturas/escrituras ajenas a la `company_id` del solicitante no son accesibles.
- **CA8:** La migración de esquema aplica y revierte limpio (apply/rollback) sin tocar datos existentes.

## 5. Diseño técnico

**Capas afectadas** (todo **aditivo**):

- **Frontend (Treasury "SGA - Treasuty"):** nuevos contenedores en `src/modules/userApp/containers/` para la navegación `buscar banco → cuentas → secciones`. Reutiliza `universalTable.jsx`, `TableTransactions.jsx` e iconos `BankIcon`/`MovmentIcon`/`ConciliationIcon` ya existentes. **Verificado** que el módulo y esos assets existen; las pantallas de Bancos son **Propuesta**. Aplicarán `sga-workflow` + `ui-ux-pro-max`.
- **API / rutas:** nuevos endpoints `POST /treasury/banks/...` registrados en `api/routes/index.routes.js`, siguiendo el patrón `POST /treasury/<action>`. **Verificado** el patrón; los endpoints concretos son **Propuesta**:
  - `registerMovement` (ingesta UMJP: create/modify/reverse)
  - `listBanks`, `createBank`, `listAccounts`, `createAccount`
  - `getAccountBalance` (saldo por moneda), `listMovements`, `getReports`
  - (admin) `listInstitutions`, `createInstitution`
- **Controlador:** `banksController` con el patrón `readJsonBody` + `withTransaction` + SQL `$n` + scoping por `company_id`. **Verificado** el patrón en `api/controllers/TreasuryController.js`.
- **Servicios/dominio (Propuesta):** `banksService` (bancos/cuentas + resolución de parametrización con herencia), `banksMovementsService` (normaliza UMJP, calcula saldo por moneda, reverse), `banksAuditService` (bitácora append-only). Reutiliza `businessTimeZoneService`. **Verificado** que ese servicio existe.
- **Esquema (aditivo, `db/migrations`):** tablas nuevas en el esquema `"Treasury"` (ver §6.1). `created_at` como `timestamptz`. **Saldo derivado** mediante consulta/vista agregada por `(bank_account_id, currency)`; **no** se materializa por trigger (lección del bug de doble saldo del cierre de caja). **Verificado** que `db/migrations` es el mecanismo y que el esquema `"Treasury"` existe; las tablas son **Propuesta**.
- **Integración documento→banco:** el documento invoca `banksService.registerMovement` dentro de su transacción, al estilo de `cashReceiptService`/`customerAdvanceService`. **Pendiente** confirmar la ruta exacta doc→movimiento antes de implementarla.

**Seguridad / consistencia:** scoping por `company_id`; `idempotency_key` evita doble posteo; toda la operación corre en una transacción (`withTransaction`). No se modifica ni elimina ningún contrato existente.

## 6. Flujos y diagramas

### 6.1 Modelo de datos (dominio de 5 niveles)

**Pregunta que responde:** ¿cómo se relacionan institución, banco, cuenta, transacción, detalle y auditoría, y dónde viven la moneda y el puente contable?
**Leyenda:** todas las entidades son **Propuesta** (nuevas en el esquema `"Treasury"`). `account_id` referencia el plan de cuentas contable existente (**Supuesto**, por confirmar en `Contability`/esquema).

![Diagrama del modelo de datos propuesto para Tesorería](diagrams/modelo-datos.png)

Fuente editable: [modelo-datos.mmd](diagrams/modelo-datos.mmd).

### 6.2 Secuencia: ingesta de movimiento y reverse

**Pregunta que responde:** ¿qué pasa, en orden, cuando un documento registra un movimiento, y cómo se deshace sin borrar?
**Leyenda:** `Documento` y `businessTimeZoneService` son **Verificado**; `Banks Controller/Services` y las tablas `bank_*` son **Propuesta**.

![Secuencia propuesta de ingesta y reverso de movimientos](diagrams/secuencia-ingesta-reverse.png)

Fuente editable: [secuencia-ingesta-reverse.mmd](diagrams/secuencia-ingesta-reverse.mmd).

### 6.3 Diagramas evaluados y omitidos

- **Arquitectura de módulos:** omitido. El cruce FE→API→DB se entiende con la secuencia (6.2) y la prosa de §5; un diagrama de módulos adicional no reduce ambigüedad.
- **Ciclo de vida del movimiento:** omitido como diagrama propio. Los estados relevantes (create → reverse, append-only) se representan dentro de 6.2 sin ambigüedad.

## 7. Errores, límites y casos especiales

- **Moneda no permitida por la cuenta:** el detalle se rechaza si su `currency` no está en `currency_policy.allowed_currencies`.
- **Reverse de un detalle ya revertido:** debe impedirse o marcarse (evitar doble reverso). **Pendiente** de regla fina.
- **Documento sin cuenta bancaria válida:** el UMJP se rechaza con error de validación (no crea movimiento parcial).
- **Fallo a mitad de transacción:** rollback completo; no quedan transacciones ni auditoría parciales.
- **Día comercial en tiendas de distinta zona:** `business_date` se toma del `context` del movimiento, no de la empresa.

## 8. Decisiones, supuestos y preguntas abiertas

**Decisiones locked (de Etapa 1, respetar):** saldo por moneda; solo documentos; sin conciliación; parametrización 2 niveles con herencia; `currency` en detalle; append-only; reverse a nivel detalle.

**Abiertas (bloquean parte del diseño fino, no el plan):**
- **D1** `concept` del detalle: enum cerrado vs. abierto.
- **D2** `account_id` del detalle: contrapartida opcional vs. heredada de la cuenta.
- **D3** `operation: modify` real vs. solo `reverse` + `create`.
- **D4** Catálogo de instituciones: cerrado (solo admin ERP) vs. mixto (`company_private`).
- **Supuesto S1:** `account_id` sale del plan de cuentas existente (`AcountsPlan`) — confirmar en `Contability`/esquema.
- **Pendiente P1:** ruta exacta documento→movimiento.

## 9. Plan por etapas y dependencias (del brief)

| Orden | Objetivo / salida verificable | Capas | Dependencias | Paralelismo |
|---|---|---|---|---|
| 1 | Esquema aditivo de bancos en `"Treasury"` | Datos | Fase 0 | — |
| 2 | API + servicios (CRUD, ingesta UMJP, saldo por moneda, auditoría) | API | Etapa 1 | — |
| 3 | UI del módulo Tesorería (navegación + secciones) | FE | Contrato de Etapa 2 (mock) | Paralelo a 2 |
| 4 | Integración documento→UMJP + pruebas | API/FE | Etapas 2–3 | — |

**Orden:** abajo→arriba (datos→API→FE), FE adelantable contra el contrato. El desglose atómico queda para la Etapa 3.

## 10. Validación (sugerida, no ejecutada)

- Unitarias: saldo por moneda; reverse; idempotencia.
- Contrato: forma del UMJP y rechazos de validación.
- Permisos: aislamiento por `company_id`.
- Datos: migración apply/rollback; sin reescritura de históricos.
- Fechas: medianoche y DST por día comercial.
- Regresión: que Tesorería (cartera/cajas/anticipos) no se vea afectada.

## 11. Referencias

- Contratos Fase 0: [docs/bancos/contratos-json-bancos.md](../../../bancos/contratos-json-bancos.md)
- Patrón controlador: `api/controllers/TreasuryController.js`
- Rutas: `api/routes/index.routes.js:388`
- Migraciones: `db/migrations/`
- Día comercial: `api/services/businessTimeZoneService.js`
- Módulo FE: `Treasury/SGA - Treasuty/src/modules/userApp/containers/`

---

_Etapa 2 · feature-TreasuryBanks · v1 · 2026-10-22 · Propuesto_
