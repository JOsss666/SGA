-- Migration: 0009_migrate_thirdparties_to_fiscal
-- Fecha:     2026-07-08
-- Etapa:     3 — migración inicial de los 147 terceros al modelo nuevo (solo copia,
--            la app sigue leyendo/escribiendo el modelo viejo)
-- Regla:     solo aditiva e idempotente (re-ejecutar no duplica)
-- Decisiones (aprobadas por el usuario):
--   * municipality_id vacío ('') → 164 (Santo Tomás, Atlántico)
--   * regime/retention_type legacy no confiables ('-', '2', '01', '03') →
--     valor default del catálogo, preservando el valor original en notes
--   * classification_date = thirdparties.created_at (no existe fecha real de RUT)
--   * attachedRut: ningún valor legacy es archivo/URL real → 0 documentos migrados
-- Rollback:  DELETE ... WHERE source='migration' / notes LIKE 'ETAPA3%' (ver doc)

-- ── 1. Relaciones tercero ↔ compañía ──────────────────────────────────────
INSERT INTO "Fiscal".third_party_company_relations
    (third_party_id, company_id, status, started_at, jurisdiction_id, notes)
SELECT
    t.id,
    t.company_id,
    COALESCE(ci.comercial_state::text, 'active'),
    t.created_at,
    j.id,
    'ETAPA3: migrado del modelo legacy'
    || CASE WHEN NULLIF(TRIM(ti.municipality_id), '') IS NULL
            THEN ' (municipality_id legacy vacío, asignado 164 Santo Tomás por decisión del usuario)'
            ELSE '' END
FROM "Ecosystem".thirdparties t
LEFT JOIN "Ecosystem"."thirdPartyComercialInfo" ci ON ci."thirdParty_id" = t.id
LEFT JOIN "Ecosystem"."thirdPartyTaxInfo"       ti ON ti."thirdParty_id" = t.id
LEFT JOIN "Fiscal".jurisdictions j
       ON j.level = 'municipality'
      AND j.external_code = COALESCE(NULLIF(TRIM(ti.municipality_id), ''), '164')
ON CONFLICT ON CONSTRAINT uq_tp_company_relation DO NOTHING;

-- ── 2. Roles desde thirdparties.type ('both' → client + supplier) ─────────
INSERT INTO "Fiscal".third_party_roles (relation_id, role, started_at)
SELECT r.id, x.role, t.created_at
FROM "Ecosystem".thirdparties t
JOIN "Fiscal".third_party_company_relations r
  ON r.third_party_id = t.id AND r.company_id = t.company_id
CROSS JOIN LATERAL (
    SELECT unnest(CASE WHEN t.type::text = 'both'
                       THEN ARRAY['client','supplier']
                       ELSE ARRAY[t.type::text] END) AS role
) x
ON CONFLICT ON CONSTRAINT uq_tp_role DO NOTHING;

-- ── 3. Clasificaciones fiscales versionadas (source = 'migration') ─────────
-- 3a. IVA_RESPONSIBILITY: mapeo directo por código Factus (18/21/22);
--     valores ilegibles ('', '-') → default 21, preservando el original.
INSERT INTO "Fiscal".third_party_tax_classifications
    (relation_id, classification_type_id, classification_value_id,
     classification_date, source, notes, created_by)
SELECT
    r.id, ct.id, cv.id,
    t.created_at::date, 'migration',
    CASE WHEN TRIM(COALESCE(ti."IVA_responsability", '')) NOT IN ('18','21','22')
         THEN 'ETAPA3: valor legacy no mapeable IVA_responsability=' || quote_literal(COALESCE(ti."IVA_responsability",'NULL')) || ', asignado default'
         ELSE 'ETAPA3: migrado de thirdPartyTaxInfo.IVA_responsability=' || TRIM(ti."IVA_responsability") END,
    'migration_etapa3'
FROM "Ecosystem".thirdparties t
JOIN "Ecosystem"."thirdPartyTaxInfo" ti ON ti."thirdParty_id" = t.id
JOIN "Fiscal".third_party_company_relations r
  ON r.third_party_id = t.id AND r.company_id = t.company_id
JOIN "Fiscal".tax_classification_types ct ON ct.code = 'IVA_RESPONSIBILITY'
JOIN "Fiscal".tax_classification_values cv
  ON cv.classification_type_id = ct.id
 AND cv.external_code = CASE WHEN TRIM(COALESCE(ti."IVA_responsability", '')) IN ('18','21','22')
                             THEN TRIM(ti."IVA_responsability") ELSE '21' END
WHERE NOT EXISTS (
    SELECT 1 FROM "Fiscal".third_party_tax_classifications e
    WHERE e.relation_id = r.id AND e.classification_type_id = ct.id AND e.source = 'migration'
);

-- 3b. TAX_REGIME: legacy 'regime' no confiable → default ORDINARIO + original en notes.
INSERT INTO "Fiscal".third_party_tax_classifications
    (relation_id, classification_type_id, classification_value_id,
     classification_date, source, notes, created_by)
SELECT
    r.id, ct.id, cv.id,
    t.created_at::date, 'migration',
    'ETAPA3: regime legacy=' || quote_literal(COALESCE(ti.regime,'NULL')) || ' sin mapeo confiable, asignado default ORDINARIO',
    'migration_etapa3'
FROM "Ecosystem".thirdparties t
JOIN "Ecosystem"."thirdPartyTaxInfo" ti ON ti."thirdParty_id" = t.id
JOIN "Fiscal".third_party_company_relations r
  ON r.third_party_id = t.id AND r.company_id = t.company_id
JOIN "Fiscal".tax_classification_types ct ON ct.code = 'TAX_REGIME'
JOIN "Fiscal".tax_classification_values cv
  ON cv.classification_type_id = ct.id AND cv.code = 'ORDINARIO'
WHERE NOT EXISTS (
    SELECT 1 FROM "Fiscal".third_party_tax_classifications e
    WHERE e.relation_id = r.id AND e.classification_type_id = ct.id AND e.source = 'migration'
);

-- 3c. RETENTION_AGENT: legacy 'retention_type' no confiable → default NO_AGENTE + original en notes.
INSERT INTO "Fiscal".third_party_tax_classifications
    (relation_id, classification_type_id, classification_value_id,
     classification_date, source, notes, created_by)
SELECT
    r.id, ct.id, cv.id,
    t.created_at::date, 'migration',
    'ETAPA3: retention_type legacy=' || quote_literal(COALESCE(ti.retention_type,'NULL')) || ' sin mapeo confiable, asignado default NO_AGENTE',
    'migration_etapa3'
FROM "Ecosystem".thirdparties t
JOIN "Ecosystem"."thirdPartyTaxInfo" ti ON ti."thirdParty_id" = t.id
JOIN "Fiscal".third_party_company_relations r
  ON r.third_party_id = t.id AND r.company_id = t.company_id
JOIN "Fiscal".tax_classification_types ct ON ct.code = 'RETENTION_AGENT'
JOIN "Fiscal".tax_classification_values cv
  ON cv.classification_type_id = ct.id AND cv.code = 'NO_AGENTE'
WHERE NOT EXISTS (
    SELECT 1 FROM "Fiscal".third_party_tax_classifications e
    WHERE e.relation_id = r.id AND e.classification_type_id = ct.id AND e.source = 'migration'
);

-- ── 4. attachedRut → third_party_documents (solo si es archivo/URL real) ──
--    Con los datos actuales inserta 0 filas (145 vacíos, 2 con '-').
INSERT INTO "Fiscal".third_party_documents
    (relation_id, document_type_id, file_url, status, notes, uploaded_by)
SELECT r.id, dt.id, TRIM(ti."attachedRut"), 'valid',
       'ETAPA3: migrado de thirdPartyTaxInfo.attachedRut', 'migration_etapa3'
FROM "Ecosystem".thirdparties t
JOIN "Ecosystem"."thirdPartyTaxInfo" ti ON ti."thirdParty_id" = t.id
JOIN "Fiscal".third_party_company_relations r
  ON r.third_party_id = t.id AND r.company_id = t.company_id
JOIN "Fiscal".document_types dt ON dt.code = 'RUT'
WHERE TRIM(COALESCE(ti."attachedRut", '')) ILIKE 'http%'
  AND NOT EXISTS (
    SELECT 1 FROM "Fiscal".third_party_documents e
    WHERE e.relation_id = r.id AND e.document_type_id = dt.id
      AND e.file_url = TRIM(ti."attachedRut")
);

-- ── 5. Auditoría: un evento por tercero migrado, con snapshot legacy ───────
INSERT INTO "Fiscal".audit_events
    (company_id, event_type, entity_schema, entity_table, entity_id, payload, performed_by)
SELECT
    t.company_id, 'third_party.migrated_etapa3', 'Fiscal', 'third_party_company_relations', r.id,
    jsonb_build_object(
        'third_party_id', t.id,
        'legacy_type', t.type::text,
        'legacy_taxInfo', to_jsonb(ti) - 'attachedRut',
        'legacy_comercial_state', ci.comercial_state::text
    ),
    'migration_etapa3'
FROM "Ecosystem".thirdparties t
JOIN "Fiscal".third_party_company_relations r
  ON r.third_party_id = t.id AND r.company_id = t.company_id
LEFT JOIN "Ecosystem"."thirdPartyTaxInfo"       ti ON ti."thirdParty_id" = t.id
LEFT JOIN "Ecosystem"."thirdPartyComercialInfo" ci ON ci."thirdParty_id" = t.id
WHERE NOT EXISTS (
    SELECT 1 FROM "Fiscal".audit_events e
    WHERE e.event_type = 'third_party.migrated_etapa3' AND e.entity_id = r.id
);

INSERT INTO public.schema_migrations (filename)
VALUES ('0009_migrate_thirdparties_to_fiscal.sql')
ON CONFLICT (filename) DO NOTHING;
