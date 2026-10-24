# -*- coding: utf-8 -*-
"""
Informe de contratos JSON — Módulo Bancos (Fase 0) · estilo SGA360°.

Documento de referencia para el equipo: explica, campo por campo, los objetos
JSON con los que trabajan el FrontEnd y los Controllers del módulo de Bancos.

    python informe_contratos_bancos.py [ruta_salida.pdf]
"""
import sys
from sga_report_style import SgaReport, P, heading, callout, table, bullets, small, code


# --------------------------------------------------------------------------- #
# Ejemplos JSON (se pintan como bloque de código antes de cada tabla)
# --------------------------------------------------------------------------- #
UMJP_EXAMPLE = """{
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
  "actor": { "user_id": "uuid-usuario" },        // para auditoria
  "context": {                                   // procedencia de la captura
    "store_id": "uuid-tienda",
    "store_name": "Tienda Centro",
    "country": "CO",
    "captured_at_local": "2026-10-22T10:40:00-05:00",
    "time_zone": "America/Bogota",               // IANA de la tienda
    "business_date": "2026-10-22",               // dia comercial resuelto
    "channel": "pos",
    "device_id": "pos-03"
  },
  "details": [                                   // <-- NIVEL MINIMO
    {
      "detail_id": "uuid-detalle-1",
      "currency": "COP",                         // la moneda vive AQUI
      "amount": 1000000,
      "direction": "in",                         // in = ingreso | out = egreso
      "concept": "principal",                    // principal|impuesto|retencion|comision
      "account_id": "uuid-cuenta-contable",      // contrapartida contable (opcional)
      "reverses_detail_id": null,                // reverse: apunta al detalle revertido
      "metadata": {}
    }
  ]
}"""

CONFIG_UNIVERSAL_EXAMPLE = """{
  "schema_version": "1.0",
  "supported_currencies": ["COP", "USD", "EUR"],
  "default_currency": "COP",
  "document_types": ["compra","venta","ingreso","egreso","ajuste","pos"],
  "operations": ["create", "modify", "reverse"],
  "direction_convention": { "in": "+1", "out": "-1" },
  "balance": {
    "mode": "derived",                           // saldo NO materializado por trigger
    "group_by": ["bank_account_id", "currency"]  // saldo POR MONEDA
  },
  "audit": {
    "mode": "append_only",
    "required": ["actor.user_id", "operation", "created_at"]
  },
  "rounding": {
    "strategy": "half_up",
    "decimals_by_currency": { "COP": 0, "USD": 2, "EUR": 2 }
  }
}"""

INSTITUCION_EXAMPLE = """{
  "institution_id": "uuid-institucion",
  "code": "BANCOLOMBIA",                         // codigo estable y unico
  "name": "Bancolombia",
  "countries": ["CO"],
  "logo_url": "https://cdn.sga/bancolombia.png",
  "available_franchises": ["visa", "mastercard"],
  "operating_currencies": ["COP", "USD"],
  "scope": "erp_global",                         // compartida a todos los clientes
  "status": "active"
}"""

BANCO_EXAMPLE = """{
  "bank_id": "uuid-banco-empresa",
  "company_id": "uuid-compania",
  "institution_id": "uuid-institucion",          // referencia al catalogo
  "alias": "Bancolombia operativo",
  "account_id": null,                            // el banco NO apunta a cuenta contable
  "defaults": {                                  // valores que heredan sus cuentas
    "allowed_currencies": ["COP", "USD"],
    "primary_currency": "COP",
    "enabled_documents": ["compra","venta","ingreso","egreso","ajuste"]
  },
  "audit_level": "full",
  "status": "active",
  "settings": {}
}"""

CUENTA_EXAMPLE = """{
  "bank_account_id": "uuid-cuenta-bancaria",
  "bank_id": "uuid-banco-empresa",
  "account_number": "123-45678-9",
  "account_id": "uuid-cuenta-contable",          // EL PUENTE CONTABLE
  "franchise": "visa",
  "name": "Cuenta corriente COP",
  "description": "Cuenta operativa principal",
  "currency_policy": {
    "allowed_currencies": ["COP", "USD"],        // multimoneda -> saldo por moneda
    "primary_currency": "COP"
  },
  "inheritance": {
    "inherits_from_bank": true,
    "overrides": { "enabled_documents": ["venta","ingreso","egreso"] }
  },
  "status": "active",
  "created_at": "2026-10-22T15:40:00Z",
  "settings": {}
}"""


def build(out_path):
    r = SgaReport(
        out_path=out_path,
        title="Contratos JSON — Módulo Bancos",
        subtitle="Fase 0 · definición de contratos · esquema 1.0",
        footer="Referencia para FrontEnd y Controllers · Confidencial",
    )

    # ------------------------------------------------------------------ #
    r.add(callout(
        "<b>Para qué es este documento.</b> Aquí está la fuente de verdad de los objetos "
        "JSON del módulo de Bancos. De aquí beben el <b>FrontEnd</b> (qué envía y qué pinta) "
        "y los <b>Controllers/Services</b> (qué reciben, validan y persisten). Antes de "
        "escribir un endpoint o una pantalla, confirma aquí qué representa cada campo."))

    # ------------------------------------------------------------------ #
    r.add(heading("1. Modelo mental y jerarquía"))
    r.add(P(
        "El dinero se modela en cinco niveles. Los dos primeros son <b>configuración</b>; "
        "los tres últimos son el <b>movimiento</b>:"))
    r.add(table(
        ["Nivel", "Qué es", "Alcance"],
        [
            ["Institución Bancaria", "El banco como institución (p. ej. Bancolombia)", "Catálogo global del ERP, compartido"],
            ["Banco (empresa)", "Instancia que agrupa cuentas y parametriza", "Por empresa"],
            ["Cuenta Bancaria", "Nº de cuenta + puente a la cuenta contable", "Por empresa"],
            ["Transaction (movimiento)", "Proyección de un documento", "Por cuenta bancaria"],
            ["TransactionDetail", "Línea con moneda y monto — nivel mínimo", "Unidad de hacer/deshacer"],
        ],
        col_widths=[0.26, 0.42, 0.32],
    ))
    r.add(small(
        "Reglas de oro: la Institución se registra <b>una sola vez</b> y se comparte; el Banco "
        "<b>no</b> apunta a cuenta contable; la Cuenta Bancaria <b>sí</b> (es el puente); la "
        "<b>moneda vive en el detalle</b>, por eso el saldo es por moneda; nada se borra "
        "(deshacer = detalle inverso); Bancos <b>consume</b> documentos, no origina dinero."))

    # ------------------------------------------------------------------ #
    r.add(heading("2. Movimiento — UniversalMovementJsonParametrization (UMJP)"))
    r.add(P(
        "Nombre del contrato: <b>UniversalMovementJsonParametrization</b> (abreviado <b>UMJP</b>). "
        "Es lo que cualquier documento (compra, venta, ingreso, egreso, ajuste, POS) entrega "
        "al Banks Controller. Un movimiento es una Transaction con uno o más detalles."))
    r.add(code(UMJP_EXAMPLE))
    r.add(small("Ejemplo del UMJP. A continuación, el detalle de cada campo."))
    r.add(table(
        ["Campo", "Tipo", "Oblig.", "Qué representa"],
        [
            ["schema_version", "string", "Sí", "Versión del contrato que emite el documento."],
            ["idempotency_key", "string", "Sí", "Clave única del posteo; si llega repetida, no se duplica."],
            ["operation", "enum", "Sí", "create | modify | reverse — intención del comando."],
            ["bank_account_id", "uuid", "Sí", "Cuenta bancaria destino; define a qué saldo impacta."],
            ["company_id", "uuid", "Sí", "Empresa dueña; aísla datos entre clientes."],
            ["origin", "object", "Sí", "Documento de origen (módulo, tipo, id, número)."],
            ["description", "string", "No", "Texto para mostrar en la lista de movimientos."],
            ["created_at", "ISO-8601 UTC", "Sí", "Instante universal (timestamptz); manda para ordenar/filtrar."],
            ["actor", "object", "Sí", "Quién ejecuta (user_id); imprescindible para auditoría."],
            ["context", "object", "Recom.", "Procedencia de la captura (tienda, país, zona, día comercial)."],
            ["details", "array", "Sí (1+)", "Líneas del movimiento; el dinero vive aquí."],
        ],
        col_widths=[0.20, 0.13, 0.10, 0.57],
    ))

    r.add(heading("2.1 Bloque origin — documento de origen"))
    r.add(table(
        ["Campo", "Tipo", "Oblig.", "Qué representa"],
        [
            ["module", "string", "Sí", "Módulo emisor (ventas, compras, pos, ...)."],
            ["document_type", "enum", "Sí", "compra | venta | ingreso | egreso | ajuste | pos."],
            ["document_id", "uuid", "Sí", "Id del documento en su módulo; rastrea de vuelta al origen."],
            ["document_number", "string", "No", "Número legible del documento (p. ej. FV-00912)."],
        ],
        col_widths=[0.22, 0.13, 0.10, 0.55],
    ))

    r.add(heading("2.2 Bloque context — procedencia y presentación"))
    r.add(P(
        "<b>Por qué existe:</b> created_at es el instante universal (UTC). El context guarda el "
        "<b>día comercial y la zona horaria reales de la tienda</b>, porque una misma empresa "
        "puede tener tiendas en países/zonas distintas. No se deduce de la empresa; se captura "
        "con el movimiento."))
    r.add(table(
        ["Campo", "Tipo", "Oblig.", "Qué representa"],
        [
            ["store_id", "uuid", "No", "Tienda / punto de venta de la captura."],
            ["store_name", "string", "No", "Nombre legible de la tienda para informes."],
            ["country", "ISO-3166", "No", "País de la captura."],
            ["captured_at_local", "ISO-8601 offset", "No", "Hora local de la tienda (solo presentación)."],
            ["time_zone", "IANA", "Recom.", "Zona horaria de la tienda (p. ej. America/Bogota)."],
            ["business_date", "YYYY-MM-DD", "Recom.", "Día comercial ya resuelto; clave para agrupar informes."],
            ["channel", "enum", "No", "pos | web | app | ..."],
            ["device_id", "string", "No", "Terminal/dispositivo de captura."],
        ],
        col_widths=[0.22, 0.16, 0.10, 0.52],
    ))

    r.add(heading("2.3 TransactionDetail — nivel mínimo"))
    r.add(table(
        ["Campo", "Tipo", "Oblig.", "Qué representa"],
        [
            ["detail_id", "uuid", "Sí", "Unidad sobre la que se hace y se deshace."],
            ["currency", "ISO-4217", "Sí", "Moneda del detalle; define en qué moneda suma al saldo."],
            ["amount", "number > 0", "Sí", "Monto siempre positivo; el signo lo da direction."],
            ["direction", "enum", "Sí", "in = ingreso (suma) | out = egreso (resta)."],
            ["concept", "enum/str", "Sí", "principal | impuesto | retencion | comision | ..."],
            ["account_id", "uuid", "No", "Contrapartida contable; si falta, hereda la de la cuenta."],
            ["reverses_detail_id", "uuid|null", "No", "En un reverse, apunta al detail_id original."],
            ["metadata", "object", "No", "Datos extra del detalle sin migrar esquema."],
        ],
        col_widths=[0.22, 0.14, 0.10, 0.54],
    ))

    # ------------------------------------------------------------------ #
    r.add(heading("3. Config Universal — reglas base del módulo"))
    r.add(P(
        "Baseline compartido del que heredan institución, banco y cuenta. Define enums, "
        "convenciones y reglas globales."))
    r.add(code(CONFIG_UNIVERSAL_EXAMPLE))
    r.add(table(
        ["Campo", "Qué representa"],
        [
            ["supported_currencies", "Monedas que admite el ERP; ningún detalle puede salirse de aquí."],
            ["default_currency", "Moneda por defecto cuando no se especifica otra."],
            ["document_types", "Tipos de documento válidos como origen de movimientos."],
            ["operations", "Operaciones permitidas en el controller (create/modify/reverse)."],
            ["direction_convention", "Cómo se traduce in/out a signo contable."],
            ["balance.mode = derived", "El saldo se CALCULA de los detalles; no se materializa por trigger."],
            ["balance.group_by", "Ejes de agregación: por cuenta Y por moneda."],
            ["audit.mode = append_only", "La auditoría solo agrega; nunca edita ni borra."],
            ["audit.required", "Campos mínimos que toda operación debe traer para auditar."],
            ["rounding", "Estrategia de redondeo y decimales por moneda."],
        ],
        col_widths=[0.30, 0.70],
    ))

    # ------------------------------------------------------------------ #
    r.add(heading("4. Institución Bancaria — catálogo global del ERP"))
    r.add(P(
        "Dato maestro compartido. Lo mantiene el administrador del ERP; el cliente la "
        "<b>selecciona</b>, no la crea ni la muta."))
    r.add(code(INSTITUCION_EXAMPLE))
    r.add(table(
        ["Campo", "Tipo", "Oblig.", "Qué representa"],
        [
            ["institution_id", "uuid", "Sí", "Identificador en el catálogo."],
            ["code", "string", "Sí", "Código estable y único (p. ej. BANCOLOMBIA)."],
            ["name", "string", "Sí", "Nombre comercial mostrado a todos los clientes."],
            ["countries", "array ISO-3166", "Sí", "Países donde opera."],
            ["logo_url", "string", "No", "Logo mostrado en la UI."],
            ["available_franchises", "array", "No", "Franquicias disponibles (visa, mastercard, ...)."],
            ["operating_currencies", "array ISO-4217", "Sí", "Monedas que maneja; acota lo que banco/cuenta permiten."],
            ["scope", "enum", "Sí", "erp_global (compartida) | company_private (de una empresa)."],
            ["status", "enum", "Sí", "active | inactive — disponible para selección."],
        ],
        col_widths=[0.22, 0.16, 0.10, 0.52],
    ))

    # ------------------------------------------------------------------ #
    r.add(heading("5. Config Banco — instancia por empresa"))
    r.add(P(
        "Agrupa cuentas y referencia a una institución del catálogo. No lleva nombre/logo "
        "propios (los toma de la institución) y <b>no apunta a cuenta contable</b>."))
    r.add(code(BANCO_EXAMPLE))
    r.add(table(
        ["Campo", "Tipo", "Oblig.", "Qué representa"],
        [
            ["bank_id", "uuid", "Sí", "Identificador del banco de la empresa."],
            ["company_id", "uuid", "Sí", "Empresa dueña."],
            ["institution_id", "uuid", "Sí", "Referencia a la institución (nombre, logo, país salen de ahí)."],
            ["alias", "string", "No", "Nombre interno opcional que la empresa le da."],
            ["account_id", "null", "Sí", "Siempre null: el banco no apunta a cuenta contable."],
            ["defaults", "object", "Sí", "Valores que heredan sus cuentas (monedas, documentos)."],
            ["audit_level", "enum", "No", "full | basic — detalle de auditoría del banco."],
            ["status", "enum", "Sí", "active | inactive."],
            ["settings", "object", "No", "Parametrización extensible sin migrar esquema."],
        ],
        col_widths=[0.20, 0.13, 0.10, 0.57],
    ))

    # ------------------------------------------------------------------ #
    r.add(heading("6. Config Cuenta Bancaria — instancia por empresa"))
    r.add(P(
        "La estructura que vincula con la contabilidad. Hereda del banco y solo redefine lo "
        "que necesita."))
    r.add(code(CUENTA_EXAMPLE))
    r.add(table(
        ["Campo", "Tipo", "Oblig.", "Qué representa"],
        [
            ["bank_account_id", "uuid", "Sí", "Identificador de la cuenta bancaria."],
            ["bank_id", "uuid", "Sí", "Banco (empresa) al que pertenece."],
            ["account_number", "string", "Sí", "Número de cuenta del banco real."],
            ["account_id", "uuid", "Sí", "Puente contable: cuenta contable del sistema."],
            ["franchise", "string", "No", "Franquicia de la cuenta/tarjeta."],
            ["name", "string", "Sí", "Nombre de la cuenta para la UI."],
            ["description", "string", "No", "Descripción opcional."],
            ["currency_policy", "object", "Sí", "allowed_currencies + primary_currency (saldo por moneda)."],
            ["inheritance", "object", "Sí", "inherits_from_bank + overrides respecto al banco."],
            ["status", "enum", "Sí", "active | inactive."],
            ["created_at", "ISO-8601 UTC", "Sí", "Alta de la cuenta (timestamptz)."],
            ["settings", "object", "No", "Parametrización extensible."],
        ],
        col_widths=[0.20, 0.14, 0.10, 0.56],
    ))

    return r.build()


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "Informe_Contratos_Bancos_SGA360.pdf"
    print("Generado:", build(out))
