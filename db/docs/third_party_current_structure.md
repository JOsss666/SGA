# Estructura actual de Terceros (baseline pre-refactor)

**Fecha de captura:** 2026-07-08 (verificado contra la DB viva de Render, PostgreSQL 18.4).
**Propósito:** Etapa 0 de la hoja de trabajo del refactor de terceros. Este documento es el punto de retorno seguro: describe exactamente cómo está la estructura ANTES de agregar el modelo nuevo.

> Regla de oro del refactor: NO borrar, NO renombrar, NO cambiar tipos de columnas existentes. Solo agregar.

## Respaldos

- Backup completo de la DB: solicitado por el usuario en Render (2026-07-08).
- Backup local complementario (gitignored, contiene datos personales): `db/backups/2026-07-08_pre_thirdparty_refactor/` — CSV de las 3 tablas (147 filas c/u) + `schema_snapshot.txt` con el `\d+` completo.

## Conteos al momento de la captura

| Tabla | Filas |
|---|---|
| `Ecosystem.thirdparties` | 147 |
| `Ecosystem."thirdPartyComercialInfo"` | 147 |
| `Ecosystem."thirdPartyTaxInfo"` | 147 |
| `Ecosystem.documents` con `thirdParty_id` | 12 894 |
| `Ecosystem.transactions` con `thirdParty_id` | 3 577 |

## 1. `Ecosystem.thirdparties`

| Columna | Tipo | Null | Default |
|---|---|---|---|
| `company_id` | bigint | NOT NULL | — (FK → `Ecosystem.companies.company_id`) |
| `id` | bigint | NOT NULL | `generated always as identity` (PK `thirdPartyId`) |
| `names` | varchar(200) | NOT NULL | |
| `lastNames` | varchar(200) | NOT NULL | |
| `indentification_type` | enum `identification_type` | NOT NULL | |
| `indentification_number` | varchar(100) | NOT NULL | |
| `mail` | varchar(300) | NOT NULL | |
| `phone` | varchar(100) | NULL | |
| `country` | varchar(100) | NULL | |
| `city` | varchar(100) | NULL | |
| `address` | varchar(100) | NULL | |
| `created_at` | timestamptz | NOT NULL | `CURRENT_TIMESTAMP` |
| `type` | enum `thirdparty_type` | NOT NULL | |
| `img` | varchar(2000) | NULL | URL Cloudinary `noUserImg` |
| `first_name` | varchar(100) | NULL | |
| `second_name` | varchar(100) | NULL | |
| `first_surname` | varchar(100) | NULL | |
| `second_surname` | varchar(100) | NULL | |

Índices/constraints:
- PK `thirdPartyId` (id)
- UNIQUE `unique_company_id` (`company_id`, `indentification_number`) ← regla de duplicidad actual por compañía
- FK `company_id` → companies

## 2. `Ecosystem."thirdPartyComercialInfo"`

| Columna | Tipo | Null | Default |
|---|---|---|---|
| `thirdParty_id` | bigint | NOT NULL | FK → thirdparties(id) ON DELETE CASCADE (NOT VALID) |
| `company_id` | bigint | NOT NULL | FK → companies |
| `credit` | boolean | NOT NULL | false |
| `credit_term` | integer | NOT NULL | 0 |
| `credit_value` | real | NOT NULL | 0 |
| `interest_rate` | real | NOT NULL | 0 |
| `credit_balance` | numeric(18,6) | NOT NULL | 0 |
| `aviable_credit` | numeric(18,6) | NOT NULL | **GENERATED ALWAYS AS** `(credit_value - credit_balance)` STORED |
| `comercial_state` | enum `comercial_state` | NOT NULL | `'active'` |
| `favor_balance` | numeric(18,6) | NOT NULL | 0 |

Sin PK declarada ni unique sobre `thirdParty_id` (a diferencia de taxInfo).

## 3. `Ecosystem."thirdPartyTaxInfo"`

| Columna | Tipo | Null | Default |
|---|---|---|---|
| `thirdParty_id` | bigint | NOT NULL | FK → thirdparties(id) ON DELETE CASCADE (NOT VALID); UNIQUE `unique_thirdparty_tax_info` |
| `company_id` | bigint | NOT NULL | FK → companies |
| `regime` | varchar(500) | NULL | texto libre |
| `IVA_responsability` | varchar(500) | NOT NULL | código Factus como texto (18/21/22) |
| `retention_type` | varchar(500) | NULL | texto libre |
| `economic_activity` | varchar(500) | NULL | texto libre |
| `attachedRut` | varchar(1000) | NULL | ruta/URL de adjunto |
| `municipality_id` | varchar(100) | NOT NULL | `149` |
| `nature` | varchar(100) | NOT NULL | `2` (1=jurídica, 2=natural) |
| `identidicationType_id` | varchar(100) | NOT NULL | código Factus (NIT=6, CC=3, …) |
| `dv` | integer | NULL | calculado por trigger |

**Trigger:** `trigger_auto_dv` BEFORE INSERT OR UPDATE → `Ecosystem.sincronizar_dv_tercero()`: si `identidicationType_id='6'` o el tipo de doc del tercero es `NIT`, setea `dv = public.calcular_dv(indentification_number)`; si no, `dv = NULL`. ⚠️ Cualquier migración/doble escritura que toque esta tabla dispara este trigger.

## 4. Enums involucrados

| Enum | Valores |
|---|---|
| `identification_type` | CC, NIT, CE, PAS, TE, RC, TI |
| `thirdparty_type` | client, supplier, employee, contractor, partner, other, **both** |
| `comercial_state` | active, disabled, blocked, reported, **pending**, **cancelled** |

(`both` / `pending` / `cancelled` no aparecen en los formularios del frontend — existen solo a nivel de DB.)

## 5. Todo lo que referencia `thirdParty_id` (impacto de cualquier cambio)

Columnas `thirdParty_id` en la base (11 tablas, todas con FK hacia `thirdparties.id`):

| Tabla | Nota FK |
|---|---|
| `Ecosystem.documents` | NOT VALID |
| `Ecosystem.transactions` | NOT VALID |
| `Ecosystem.transaction_detail` | validada |
| `Ecosystem."thirdPartyComercialInfo"` | CASCADE, NOT VALID |
| `Ecosystem."thirdPartyTaxInfo"` | CASCADE, NOT VALID |
| `Inventory."inventoryMovements"` | validada |
| `Inventory.services_movement` | validada |
| `Process.process_instance` | NOT VALID |
| `Treasury.accounts_receivable` | validada |
| `Treasury.portfolio_payments` | validada |
| `Treasury.accounts_payable` | validada (creada por la feature de compras) |

Vistas materializadas que dependen de terceros (se refrescan con `REFRESH MATERIALIZED VIEW CONCURRENTLY`):
- `Ecosystem.mv_thirdparty_account_balances`
- `Treasury.mv_thirdparty_payable_balances`

## 6. Endpoints backend actuales (NO tocar en Etapas 0–4)

Todos en `api/controllers/index.controller.js`, rutas en `api/routes/index.routes.js`:

| Ruta | Función | Qué hace |
|---|---|---|
| `POST /createThirdParty` | `createThirdParty` | 3 INSERTs: thirdparties → comercialInfo → taxInfo |
| `POST /getThirdParties` | `getThirdParties` | listado, JOIN opcional comercial/tax/mv_balances |
| `POST /getThirdPartyDetails` | `getThirdPartyDetails` | detalle por id |
| `POST /updateThirdPartyGeneralInfo` | `updateThirdPartyGeneralInfo` | UPDATE thirdparties |
| `POST /updateThirdPartyComercialInfo` | `updateThirdPartyComercialInfo` | UPDATE comercialInfo |
| `POST /updateThirdPartyTaxInfo` | `updateThirdPartyTaxInfo` | UPDATE taxInfo (destructivo, sin historia) |
| `POST /deleteThirdParty` | `deleteThirdParty` | borrado |

Frontend: 5 copias de `FormNewThirdParties.jsx` + `ThirdPartiesDetailsSections/` (Facturation, Treasury, SGA-management, Inventory, Process). **Solo se modificará la copia de `Facturation/Facturation`** (decisión del usuario 2026-07-08).

## 7. ⚠️ Colisiones de nombres detectadas para la Etapa 1

La hoja de trabajo pide crear catálogos `taxes` y `document_types`, pero en la DB viva:

- **`Ecosystem.taxes` ya existe** (motor actual de impuestos/retenciones: `id, company_id, account_id, code, rate, base, parent_id, path, "isRetention"`), consumido por `concept_taxes` y el flujo de compras.
- **`document_types` ya existe como ENUM** (tipos de documento contable: Sell Invoice, Purchase Invoice, …), usado por `documents.document_type` y `transactions.doc_type`. El catálogo homónimo de la hoja de trabajo se refiere a *tipos de documento de identidad/soporte del tercero* — es otro concepto.

**Recomendación (a confirmar en la revisión de Etapa 0):** crear todo el modelo nuevo en un schema propio (p. ej. `"ThirdParties"` o `"Fiscal"`), de modo que `"Fiscal".taxes` y `"Fiscal".document_types` no colisionen con lo existente y el modelo nuevo quede autocontenible y fácil de identificar.

## 8. Otros hechos relevantes

- No existe tabla `municipalities` en la DB: los municipios vienen del API de Factus vía `/electronicFacturation/getMunicipalities`; `municipality_id` guarda el código externo.
- No existe ningún sistema de migraciones previo — los cambios se aplicaban a mano sobre la DB viva. A partir de ahora usar `db/migrations/` (ver su README).
- Los `.sql` de `*/Documentation/CreationSQL*.sql` son documentación MySQL desactualizada; **no** reflejan el esquema Postgres real.
