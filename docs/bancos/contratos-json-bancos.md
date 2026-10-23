# Contratos JSON — Módulo Bancos (Fase 0)

> **Propósito.** Este documento es la **fuente de verdad** de los objetos JSON con los
> que trabaja el módulo de Bancos. De aquí beben el **FrontEnd** (qué envía y qué
> pinta) y los **Controllers / Services** (qué reciben, validan y persisten).
> Antes de escribir un endpoint o una pantalla, lee aquí qué representa cada campo.
>
> **Estado:** Fase 0 — definición de contratos. Versión de esquema: `1.0`.

---

## Índice

1. [Modelo mental y jerarquía](#1-modelo-mental-y-jerarquía)
2. [Movimiento — UniversalMovementJsonParametrization (UMJP)](#2-movimiento--universalmovementjsonparametrization-umjp)
3. [Config Universal (reglas base del módulo)](#3-config-universal-reglas-base-del-módulo)
4. [Institución Bancaria (catálogo global del ERP)](#4-institución-bancaria-catálogo-global-del-erp)
5. [Config Banco (instancia por empresa)](#5-config-banco-instancia-por-empresa)
6. [Config Cuenta Bancaria (instancia por empresa)](#6-config-cuenta-bancaria-instancia-por-empresa)

---

## 1. Modelo mental y jerarquía

```
Institución Bancaria        ← CATÁLOGO global del ERP, compartido a todos los clientes
 └─ Banco (empresa)         ← instancia por empresa: agrupa cuentas + parametrización
     └─ Cuenta Bancaria     ← nº de cuenta + account_id→cuenta contable + config propia
         └─ Transaction     ← un MOVIMIENTO; proyección de un documento (no se crea suelto)
             └─ TransactionDetail  ← NIVEL MÍNIMO: currency, monto, signo → unidad de hacer/deshacer
```

Reglas de oro:

- **La Institución es catálogo compartido** (Bancolombia se registra una vez, no por empresa).
- **El Banco agrupa y NO apunta a cuenta contable.**
- **La Cuenta Bancaria es el puente contable** (`account_id`) y es una estructura, no un atributo.
- **La moneda vive en el detalle** → el saldo siempre es **por moneda**.
- **Nada se borra:** deshacer = detalle inverso trazado (auditoría *append-only*).
- **Bancos consume documentos**, no origina dinero por su cuenta.

---

## 2. Movimiento — UniversalMovementJsonParametrization (UMJP)

**Nombre del contrato:** `UniversalMovementJsonParametrization` (abreviado **UMJP**).

Es lo que **cualquier documento** (compra, venta, ingreso, egreso, ajuste, POS) entrega
al `Banks Controller`. Un movimiento = una `Transaction` con uno o más `TransactionDetail`.

```jsonc
{
  "schema_version": "1.0",
  "idempotency_key": "doc:venta:FV-00912:v1",   // evita doble registro del documento
  "operation": "create",                         // create | modify | reverse
  "bank_account_id": "uuid-cuenta-bancaria",     // a qué cuenta impacta
  "company_id": "uuid-compania",
  "origin": {                                    // Bancos CONSUME documentos
    "module": "ventas",
    "document_type": "factura_venta",            // compra|venta|ingreso|egreso|ajuste|pos
    "document_id": "uuid-documento",
    "document_number": "FV-00912"
  },
  "description": "Pago factura FV-00912",
  "created_at": "2026-10-22T15:40:00Z",          // timestamptz UTC (instante universal)
  "actor": { "user_id": "uuid-usuario" },        // para auditoría
  "context": {                                   // procedencia de la captura
    "store_id": "uuid-tienda",
    "store_name": "Tienda Centro",
    "country": "CO",
    "captured_at_local": "2026-10-22T10:40:00-05:00",
    "time_zone": "America/Bogota",               // IANA de la tienda
    "business_date": "2026-10-22",               // día comercial resuelto
    "channel": "pos",
    "device_id": "pos-03"
  },
  "details": [                                   // <-- NIVEL MÍNIMO
    {
      "detail_id": "uuid-detalle-1",
      "currency": "COP",                         // la moneda vive AQUÍ
      "amount": 1000000,
      "direction": "in",                         // in = ingreso | out = egreso
      "concept": "principal",                    // principal|impuesto|retencion|comision
      "account_id": "uuid-cuenta-contable",      // contrapartida contable (opcional)
      "reverses_detail_id": null,                // reverse: apunta al detalle revertido
      "metadata": {}
    }
  ]
}
```

### 2.1 Campos de nivel movimiento (`Transaction`)

| Campo | Tipo | Obligatorio | Qué representa |
|-------|------|:-----------:|----------------|
| `schema_version` | string | Sí | Versión del contrato que emite el documento. Permite evolucionar sin romper consumidores. |
| `idempotency_key` | string | Sí | Clave única del posteo. Si llega dos veces la misma clave, el controller **no duplica** el movimiento. Evita el doble saldo. |
| `operation` | enum `create` \| `modify` \| `reverse` | Sí | Intención del comando. `create` registra; `reverse` genera el inverso; `modify` (si se habilita) edita. |
| `bank_account_id` | uuid | Sí | Cuenta bancaria **destino** del movimiento. Define a qué saldo impacta. |
| `company_id` | uuid | Sí | Empresa dueña del movimiento. Aísla datos entre clientes del ERP. |
| `origin` | object | Sí | Documento que origina el movimiento. Ver 2.2. |
| `description` | string | No | Texto libre para mostrar en la lista de movimientos. |
| `created_at` | string ISO-8601 **UTC** | Sí | **Instante universal** en que ocurre el movimiento. Se persiste como `timestamptz`. Es la verdad para **ordenar y filtrar**. |
| `actor` | object | Sí | Quién ejecuta la acción. Ver 2.3. Imprescindible para auditoría. |
| `context` | object | Recomendado | Procedencia y presentación del punto de captura. Ver 2.4. |
| `details` | array\<TransactionDetail\> | Sí (mín. 1) | Líneas del movimiento. El dinero vive aquí. Ver 2.5. |

### 2.2 `origin` — documento de origen

| Campo | Tipo | Obligatorio | Qué representa |
|-------|------|:-----------:|----------------|
| `module` | string | Sí | Módulo emisor (`ventas`, `compras`, `pos`, …). |
| `document_type` | enum | Sí | Tipo de documento: `compra` \| `venta` \| `ingreso` \| `egreso` \| `ajuste` \| `pos`. |
| `document_id` | uuid | Sí | Identificador del documento en su módulo. Permite rastrear de vuelta al origen. |
| `document_number` | string | No | Número legible del documento (p. ej. `FV-00912`) para la UI. |

### 2.3 `actor` — quién ejecuta

| Campo | Tipo | Obligatorio | Qué representa |
|-------|------|:-----------:|----------------|
| `user_id` | uuid | Sí | Usuario que dispara la operación. Se guarda en la auditoría. |

### 2.4 `context` — procedencia y presentación

> **Por qué existe:** `created_at` es el instante universal (UTC). El `context` guarda el
> **día comercial y la zona horaria reales de la tienda**, porque una misma empresa puede
> tener tiendas en países/zonas distintas. No se deduce de la empresa; se captura con el movimiento.

| Campo | Tipo | Obligatorio | Qué representa |
|-------|------|:-----------:|----------------|
| `store_id` | uuid | No | Tienda / punto de venta donde se capturó el movimiento. |
| `store_name` | string | No | Nombre legible de la tienda para informes. |
| `country` | string ISO-3166 | No | País de la captura. |
| `captured_at_local` | string ISO-8601 con offset | No | Hora **local** de la tienda al capturar (solo presentación). |
| `time_zone` | string IANA | Recomendado | Zona horaria de la tienda (p. ej. `America/Bogota`). Base del día comercial. |
| `business_date` | string `YYYY-MM-DD` | Recomendado | **Día comercial** ya resuelto. Clave para agrupar informes/estadísticas. |
| `channel` | enum | No | Canal: `pos` \| `web` \| `app` \| … |
| `device_id` | string | No | Dispositivo/terminal de captura. |

### 2.5 `TransactionDetail` — nivel mínimo

| Campo | Tipo | Obligatorio | Qué representa |
|-------|------|:-----------:|----------------|
| `detail_id` | uuid | Sí | Identificador del detalle. Es la **unidad sobre la que se hace y deshace**. |
| `currency` | string ISO-4217 | Sí | **Moneda del detalle.** Define en qué moneda suma al saldo. |
| `amount` | number (> 0) | Sí | Monto **siempre positivo**; el signo lo da `direction`. |
| `direction` | enum `in` \| `out` | Sí | `in` = ingreso (suma), `out` = egreso (resta). |
| `concept` | string/enum | Sí | Naturaleza de la línea: `principal` \| `impuesto` \| `retencion` \| `comision` \| … Permite descomponer un movimiento. |
| `account_id` | uuid | No | Contrapartida contable afectada por este detalle (si aplica). Si se omite, se asume la cuenta contable de la cuenta bancaria. |
| `reverses_detail_id` | uuid \| null | No | En un `reverse`, apunta al `detail_id` que está revirtiendo. En altas normales va `null`. |
| `metadata` | object | No | Datos extra específicos del detalle, sin migrar esquema. |

---

## 3. Config Universal (reglas base del módulo)

Baseline compartido del que heredan institución, banco y cuenta. Define enums,
convenciones y reglas globales.

```jsonc
{
  "schema_version": "1.0",
  "supported_currencies": ["COP", "USD", "EUR"],
  "default_currency": "COP",
  "document_types": ["compra", "venta", "ingreso", "egreso", "ajuste", "pos"],
  "operations": ["create", "modify", "reverse"],
  "direction_convention": { "in": "+1", "out": "-1" },
  "balance": {
    "mode": "derived",
    "group_by": ["bank_account_id", "currency"]
  },
  "audit": {
    "mode": "append_only",
    "required": ["actor.user_id", "operation", "created_at"]
  },
  "rounding": {
    "strategy": "half_up",
    "decimals_by_currency": { "COP": 0, "USD": 2, "EUR": 2 }
  }
}
```

| Campo | Tipo | Qué representa |
|-------|------|----------------|
| `schema_version` | string | Versión global del contrato del módulo. |
| `supported_currencies` | array\<string\> | Monedas que el ERP admite. Ningún detalle puede salirse de aquí. |
| `default_currency` | string | Moneda por defecto cuando no se especifica otra. |
| `document_types` | array\<enum\> | Tipos de documento válidos como origen de movimientos. |
| `operations` | array\<enum\> | Operaciones permitidas en el controller. |
| `direction_convention` | object | Cómo se traduce `in`/`out` a signo contable. |
| `balance.mode` | enum `derived` | El saldo se **calcula** de los detalles; **no** se materializa por trigger. |
| `balance.group_by` | array\<string\> | Ejes de agregación del saldo: por cuenta **y por moneda**. |
| `audit.mode` | enum `append_only` | La auditoría solo agrega; nunca edita ni borra registros previos. |
| `audit.required` | array\<string\> | Campos mínimos que toda operación debe traer para auditar. |
| `rounding.strategy` | enum | Estrategia de redondeo (`half_up`, …). |
| `rounding.decimals_by_currency` | object | Decimales por moneda (COP 0, USD 2, …). |

---

## 4. Institución Bancaria (catálogo global del ERP)

Dato maestro **compartido**. Lo mantiene el administrador del ERP; el cliente la
**selecciona**, no la crea ni la muta.

```jsonc
{
  "institution_id": "uuid-institucion",
  "code": "BANCOLOMBIA",
  "name": "Bancolombia",
  "countries": ["CO"],
  "logo_url": "https://cdn.../bancolombia.png",
  "available_franchises": ["visa", "mastercard"],
  "operating_currencies": ["COP", "USD"],
  "scope": "erp_global",
  "status": "active"
}
```

| Campo | Tipo | Obligatorio | Qué representa |
|-------|------|:-----------:|----------------|
| `institution_id` | uuid | Sí | Identificador de la institución en el catálogo. |
| `code` | string | Sí | Código estable y único (p. ej. `BANCOLOMBIA`). Útil para integraciones. |
| `name` | string | Sí | Nombre comercial mostrado a todos los clientes. |
| `countries` | array\<ISO-3166\> | Sí | Países donde opera la institución. |
| `logo_url` | string | No | Logo mostrado en la UI. |
| `available_franchises` | array\<string\> | No | Franquicias disponibles (visa, mastercard, …). |
| `operating_currencies` | array\<ISO-4217\> | Sí | Monedas que la institución maneja. Acota lo que un banco/cuenta puede permitir. |
| `scope` | enum `erp_global` \| `company_private` | Sí | `erp_global` = compartida; `company_private` = creada por una empresa (ver decisión abierta). |
| `status` | enum `active` \| `inactive` | Sí | Si está disponible para selección. |

---

## 5. Config Banco (instancia por empresa)

El banco de la empresa: agrupa cuentas y referencia a una institución del catálogo.
**No lleva nombre/logo propios** (los toma de la institución) y **no apunta a cuenta contable**.

```jsonc
{
  "bank_id": "uuid-banco-empresa",
  "company_id": "uuid-compania",
  "institution_id": "uuid-institucion",
  "alias": "Bancolombia operativo",
  "account_id": null,
  "defaults": {
    "allowed_currencies": ["COP", "USD"],
    "primary_currency": "COP",
    "enabled_documents": ["compra", "venta", "ingreso", "egreso", "ajuste"]
  },
  "audit_level": "full",
  "status": "active",
  "settings": {}
}
```

| Campo | Tipo | Obligatorio | Qué representa |
|-------|------|:-----------:|----------------|
| `bank_id` | uuid | Sí | Identificador del banco de la empresa. |
| `company_id` | uuid | Sí | Empresa dueña. |
| `institution_id` | uuid | Sí | Referencia a la institución del catálogo (de ahí salen nombre, logo, país). |
| `alias` | string | No | Nombre interno opcional que la empresa le da a este banco. |
| `account_id` | null | Sí (siempre `null`) | Se deja explícito: el **banco no apunta a cuenta contable**. |
| `defaults` | object | Sí | Valores que **heredan** sus cuentas. Ver 5.1. |
| `audit_level` | enum `full` \| `basic` | No | Nivel de detalle de auditoría para este banco. |
| `status` | enum `active` \| `inactive` | Sí | Estado del banco. |
| `settings` | object | No | Parametrización extensible sin migrar esquema. |

### 5.1 `defaults` — herencia hacia las cuentas

| Campo | Tipo | Qué representa |
|-------|------|----------------|
| `allowed_currencies` | array\<ISO-4217\> | Monedas permitidas por defecto en sus cuentas (acotado a `operating_currencies` de la institución). |
| `primary_currency` | string | Moneda principal por defecto. |
| `enabled_documents` | array\<enum\> | Documentos habilitados por defecto en sus cuentas. |

---

## 6. Config Cuenta Bancaria (instancia por empresa)

La estructura que vincula con la contabilidad. Hereda del banco y **solo redefine lo que necesita**.

```jsonc
{
  "bank_account_id": "uuid-cuenta-bancaria",
  "bank_id": "uuid-banco-empresa",
  "account_number": "123-45678-9",
  "account_id": "uuid-cuenta-contable",
  "franchise": "visa",
  "name": "Cuenta corriente COP",
  "description": "Cuenta operativa principal",
  "currency_policy": {
    "allowed_currencies": ["COP", "USD"],
    "primary_currency": "COP"
  },
  "inheritance": {
    "inherits_from_bank": true,
    "overrides": {
      "enabled_documents": ["venta", "ingreso", "egreso"]
    }
  },
  "status": "active",
  "created_at": "2026-10-22T15:40:00Z",
  "settings": {}
}
```

| Campo | Tipo | Obligatorio | Qué representa |
|-------|------|:-----------:|----------------|
| `bank_account_id` | uuid | Sí | Identificador de la cuenta bancaria. |
| `bank_id` | uuid | Sí | Banco (empresa) al que pertenece. |
| `account_number` | string | Sí | Número de cuenta del banco real. |
| `account_id` | uuid | Sí | **Puente contable:** cuenta contable del sistema a la que apunta. |
| `franchise` | string | No | Franquicia de la cuenta/tarjeta (dentro de las disponibles en la institución). |
| `name` | string | Sí | Nombre de la cuenta para la UI. |
| `description` | string | No | Descripción opcional. |
| `currency_policy` | object | Sí | Política de moneda de la cuenta. Ver 6.1. |
| `inheritance` | object | Sí | Herencia y overrides respecto al banco. Ver 6.2. |
| `status` | enum `active` \| `inactive` | Sí | Estado de la cuenta. |
| `created_at` | string ISO-8601 UTC | Sí | Alta de la cuenta, `timestamptz`. |
| `settings` | object | No | Parametrización extensible. |

### 6.1 `currency_policy`

| Campo | Tipo | Qué representa |
|-------|------|----------------|
| `allowed_currencies` | array\<ISO-4217\> | Monedas que esta cuenta admite. Al ser multimoneda, el **saldo se lleva por moneda**. |
| `primary_currency` | string | Moneda principal de la cuenta (para presentación por defecto). |

### 6.2 `inheritance`

| Campo | Tipo | Qué representa |
|-------|------|----------------|
| `inherits_from_bank` | boolean | Si toma los `defaults` del banco como base. |
| `overrides` | object | Solo las claves que esta cuenta redefine respecto al banco. |

---

_Documento de la Fase 0 del módulo Bancos · esquema `1.0` · SGA360°_
