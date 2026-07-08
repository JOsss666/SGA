-- Migration: 0006_seed_fiscal_core_catalogs
-- Fecha:     2026-07-08
-- Etapa:     2 — poblar catálogos base ("paquete Colombia" como datos, no columnas)
-- Regla:     solo aditiva e idempotente (ON CONFLICT DO NOTHING)
-- Rollback:  DELETE de las filas sembradas (los códigos son estables)

-- ── País ──────────────────────────────────────────────────────────────────
INSERT INTO "Fiscal".countries (iso_code_2, iso_code_3, name)
VALUES ('CO', 'COL', 'Colombia')
ON CONFLICT (iso_code_2) DO NOTHING;

-- ── Jurisdicción raíz: Colombia como país ─────────────────────────────────
INSERT INTO "Fiscal".jurisdictions (country_id, parent_id, level, code, name)
SELECT c.id, NULL, 'country', 'CO', 'Colombia'
FROM "Fiscal".countries c WHERE c.iso_code_2 = 'CO'
ON CONFLICT ON CONSTRAINT uq_jurisdiction DO NOTHING;

-- ── Autoridades fiscales ──────────────────────────────────────────────────
INSERT INTO "Fiscal".tax_authorities (country_id, jurisdiction_id, code, name)
SELECT c.id, NULL, v.code, v.name
FROM "Fiscal".countries c,
     (VALUES
        ('DIAN',         'Dirección de Impuestos y Aduanas Nacionales'),
        ('MUN_HACIENDA', 'Secretarías de Hacienda Municipales (ICA)')
     ) AS v(code, name)
WHERE c.iso_code_2 = 'CO'
ON CONFLICT ON CONSTRAINT uq_tax_authority DO NOTHING;

-- ── Impuestos base ────────────────────────────────────────────────────────
INSERT INTO "Fiscal".taxes (tax_authority_id, code, name, scope, description)
SELECT a.id, v.code, v.name, v.scope, v.description
FROM "Fiscal".tax_authorities a
JOIN (VALUES
    ('DIAN',         'RENTA', 'Impuesto sobre la Renta',            'national',  'Retención en la fuente a título de renta'),
    ('DIAN',         'IVA',   'Impuesto al Valor Agregado',         'national',  'IVA y retención de IVA (reteIVA)'),
    ('MUN_HACIENDA', 'ICA',   'Impuesto de Industria y Comercio',   'municipal', 'ICA y retención de ICA (reteICA), tarifa por municipio y actividad')
) AS v(authority_code, code, name, scope, description)
  ON v.authority_code = a.code
WHERE a.country_id = (SELECT id FROM "Fiscal".countries WHERE iso_code_2 = 'CO')
ON CONFLICT ON CONSTRAINT uq_fiscal_tax DO NOTHING;

-- ── Tipos de clasificación fiscal (las 7 de la hoja de trabajo) ───────────
INSERT INTO "Fiscal".tax_classification_types (country_id, code, name, applies_to, description)
SELECT c.id, v.code, v.name, v.applies_to, v.description
FROM "Fiscal".countries c,
     (VALUES
        ('TAX_REGIME',         'Régimen tributario',                'both',        'Régimen del contribuyente ante la DIAN'),
        ('IVA_RESPONSIBILITY', 'Responsabilidad frente al IVA',     'both',        'Equivale al campo IVA_responsability actual (códigos Factus en external_code)'),
        ('RETENTION_AGENT',    'Calidad de agente retenedor',       'both',        'Si practica retención y/o se autorretiene'),
        ('GRAN_CONTRIBUYENTE', 'Gran contribuyente',                'both',        'Calificación DIAN de gran contribuyente'),
        ('STATE_ENTITY',       'Entidad estatal',                   'third_party', 'Entidades públicas: reglas de retención especiales'),
        ('INVOICE_OBLIGATED',  'Obligado a facturar',               'both',        'Obligado a expedir factura electrónica'),
        ('ICA_CLASSIFICATION', 'Clasificación ICA',                 'both',        'Tipo de actividad para ICA (tarifa municipal)')
     ) AS v(code, name, applies_to, description)
WHERE c.iso_code_2 = 'CO'
ON CONFLICT ON CONSTRAINT uq_classification_type DO NOTHING;

-- ── Valores de cada clasificación ─────────────────────────────────────────
INSERT INTO "Fiscal".tax_classification_values
    (classification_type_id, code, name, external_code, is_default)
SELECT t.id, v.code, v.name, v.external_code, v.is_default
FROM "Fiscal".tax_classification_types t
JOIN (VALUES
    -- Régimen tributario
    ('TAX_REGIME', 'ORDINARIO',        'Régimen ordinario',                          NULL, true),
    ('TAX_REGIME', 'SIMPLE',           'Régimen simple de tributación (RST)',        NULL, false),
    ('TAX_REGIME', 'ESPECIAL',         'Régimen tributario especial (ESAL)',         NULL, false),
    ('TAX_REGIME', 'NO_CONTRIBUYENTE', 'No contribuyente',                           NULL, false),
    -- Responsabilidad IVA (external_code = código Factus usado hoy por el frontend)
    ('IVA_RESPONSIBILITY', 'RESPONSABLE_IVA',        'Responsable de IVA',                   '18', false),
    ('IVA_RESPONSIBILITY', 'NO_RESPONSABLE_IVA',     'No aplica / No responsable de IVA',    '21', true),
    ('IVA_RESPONSIBILITY', 'NO_RESPONSABLE_CONSUMO', 'No responsable de consumo',            '22', false),
    -- Agente retenedor
    ('RETENTION_AGENT', 'NO_AGENTE',        'No es agente de retención',  NULL, true),
    ('RETENTION_AGENT', 'AGENTE_RETENCION', 'Agente de retención',        NULL, false),
    ('RETENTION_AGENT', 'AUTORRETENEDOR',   'Autorretenedor',             NULL, false),
    -- Gran contribuyente
    ('GRAN_CONTRIBUYENTE', 'NO', 'No es gran contribuyente', NULL, true),
    ('GRAN_CONTRIBUYENTE', 'SI', 'Gran contribuyente',       NULL, false),
    -- Entidad estatal
    ('STATE_ENTITY', 'NO', 'No es entidad estatal', NULL, true),
    ('STATE_ENTITY', 'SI', 'Entidad estatal',       NULL, false),
    -- Obligado a facturar
    ('INVOICE_OBLIGATED', 'NO', 'No obligado a facturar', NULL, true),
    ('INVOICE_OBLIGATED', 'SI', 'Obligado a facturar',    NULL, false),
    -- Clasificación ICA (genérica; la tarifa concreta vive en company_jurisdiction_tax_profiles)
    ('ICA_CLASSIFICATION', 'INDUSTRIAL', 'Actividad industrial',  NULL, false),
    ('ICA_CLASSIFICATION', 'COMERCIAL',  'Actividad comercial',   NULL, false),
    ('ICA_CLASSIFICATION', 'SERVICIOS',  'Actividad de servicios',NULL, false),
    ('ICA_CLASSIFICATION', 'FINANCIERA', 'Actividad financiera',  NULL, false),
    ('ICA_CLASSIFICATION', 'NO_SUJETO',  'No sujeto a ICA',       NULL, false)
) AS v(type_code, code, name, external_code, is_default)
  ON v.type_code = t.code
WHERE t.country_id = (SELECT id FROM "Fiscal".countries WHERE iso_code_2 = 'CO')
ON CONFLICT ON CONSTRAINT uq_classification_value DO NOTHING;

-- ── Tipos de documento soporte del tercero ────────────────────────────────
INSERT INTO "Fiscal".document_types (country_id, code, name, requires_expiration)
SELECT c.id, v.code, v.name, v.requires_expiration
FROM "Fiscal".countries c,
     (VALUES
        ('RUT',                'Registro Único Tributario (RUT)',           false),
        ('CAMARA_COMERCIO',    'Certificado de Cámara de Comercio',         true),
        ('DOC_IDENTIDAD',      'Documento de identidad',                    false),
        ('CERT_BANCARIA',      'Certificación bancaria',                    true),
        ('OTRO',               'Otro documento soporte',                    false)
     ) AS v(code, name, requires_expiration)
WHERE c.iso_code_2 = 'CO'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.schema_migrations (filename)
VALUES ('0006_seed_fiscal_core_catalogs.sql')
ON CONFLICT (filename) DO NOTHING;
