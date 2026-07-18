-- Migration: 0010_create_compatibility_views
-- Fecha:     2026-07-08
-- Etapa:     4 — vistas de compatibilidad: leen el MODELO NUEVO pero devuelven
--            el shape viejo que consume el frontend/backend actual.
-- Regla:     solo aditiva (CREATE OR REPLACE VIEW; no toca tablas)
-- Fuentes por campo (v_third_party_current_tax_info):
--   regime, retention_type      -> clasificación vigente en Fiscal (nombre legible)
--   IVA_responsability          -> external_code (Factus 18/21/22) de la clasificación vigente
--   municipality_id             -> jurisdictions.external_code vía relations.jurisdiction_id
--                                  (fallback: legacy si la relación no tiene jurisdicción)
--   economic_activity, nature, identidicationType_id, dv, attachedRut
--                               -> legacy thirdPartyTaxInfo (aún no modelados en Fiscal;
--                                  attachedRut preferirá el documento RUT nuevo si existe)
-- Rollback:  DROP VIEW "Fiscal".v_third_party_current_tax_info;
--            DROP VIEW "Fiscal".v_third_party_current_profile;
--            DROP VIEW "Fiscal".v_third_party_current_classifications;

-- ── Vista auxiliar: clasificación fiscal VIGENTE por relación y tipo ───────
--    (la más reciente por classification_date, ignorando las ya vencidas)
CREATE OR REPLACE VIEW "Fiscal".v_third_party_current_classifications AS
SELECT DISTINCT ON (tc.relation_id, tc.classification_type_id)
    tc.relation_id,
    tc.classification_type_id,
    ct.code  AS classification_type_code,
    tc.classification_value_id,
    cv.code  AS classification_value_code,
    cv.name  AS classification_value_name,
    cv.external_code,
    tc.classification_date,
    tc.valid_until,
    tc.source,
    tc.id    AS classification_id
FROM "Fiscal".third_party_tax_classifications tc
JOIN "Fiscal".tax_classification_types  ct ON ct.id = tc.classification_type_id
JOIN "Fiscal".tax_classification_values cv ON cv.id = tc.classification_value_id
WHERE tc.valid_until IS NULL OR tc.valid_until >= CURRENT_DATE
ORDER BY tc.relation_id, tc.classification_type_id,
         tc.classification_date DESC, tc.id DESC;

-- ── Vista fiscal actual (shape compatible con thirdPartyTaxInfo) ───────────
CREATE OR REPLACE VIEW "Fiscal".v_third_party_current_tax_info AS
SELECT
    r.third_party_id                                   AS "thirdParty_id",
    r.company_id,
    r.id                                               AS relation_id,
    -- Shape legacy, alimentado por el modelo nuevo:
    COALESCE(c_reg.classification_value_name,  ti.regime)          AS regime,
    c_reg.classification_value_code                                AS regime_code,
    COALESCE(c_iva.external_code, ti."IVA_responsability")         AS "IVA_responsability",
    c_iva.classification_value_code                                AS iva_responsibility_code,
    COALESCE(c_ret.classification_value_name, ti.retention_type)   AS retention_type,
    c_ret.classification_value_code                                AS retention_agent_code,
    -- Aún no modelados en Fiscal (fuente legacy):
    ti.economic_activity,
    COALESCE(j.external_code, ti.municipality_id)                  AS municipality_id,
    j.code                                                         AS municipality_dane_code,
    j.name                                                         AS municipality_name,
    ti.nature,
    ti."identidicationType_id",
    ti.dv,
    COALESCE(doc.file_url, ti."attachedRut")                       AS "attachedRut"
FROM "Fiscal".third_party_company_relations r
LEFT JOIN "Ecosystem"."thirdPartyTaxInfo" ti
       ON ti."thirdParty_id" = r.third_party_id AND ti.company_id = r.company_id
LEFT JOIN "Fiscal".jurisdictions j ON j.id = r.jurisdiction_id
LEFT JOIN "Fiscal".v_third_party_current_classifications c_reg
       ON c_reg.relation_id = r.id AND c_reg.classification_type_code = 'TAX_REGIME'
LEFT JOIN "Fiscal".v_third_party_current_classifications c_iva
       ON c_iva.relation_id = r.id AND c_iva.classification_type_code = 'IVA_RESPONSIBILITY'
LEFT JOIN "Fiscal".v_third_party_current_classifications c_ret
       ON c_ret.relation_id = r.id AND c_ret.classification_type_code = 'RETENTION_AGENT'
LEFT JOIN LATERAL (
    SELECT d.file_url
    FROM "Fiscal".third_party_documents d
    JOIN "Fiscal".document_types dt ON dt.id = d.document_type_id AND dt.code = 'RUT'
    WHERE d.relation_id = r.id AND d.status = 'valid'
    ORDER BY d.created_at DESC
    LIMIT 1
) doc ON true;

-- ── Perfil general actual del tercero (identidad legacy + estado nuevo) ────
CREATE OR REPLACE VIEW "Fiscal".v_third_party_current_profile AS
SELECT
    r.id                    AS relation_id,
    t.id                    AS third_party_id,
    r.company_id,
    -- Identidad (dueño: modelo legacy, sin cambios)
    t.names, t."lastNames",
    t.first_name, t.second_name, t.first_surname, t.second_surname,
    t.indentification_type, t.indentification_number,
    t.mail, t.phone, t.country, t.city, t.address, t.img, t.created_at,
    -- 'type' legacy reconstruido desde los roles activos del modelo nuevo
    CASE
        WHEN bool_or(ro.role = 'client')  FILTER (WHERE ro.active)
         AND bool_or(ro.role = 'supplier') FILTER (WHERE ro.active)
        THEN 'both'
        ELSE COALESCE(
            (array_agg(ro.role ORDER BY ro.started_at) FILTER (WHERE ro.active))[1],
            t.type::text)
    END                     AS type,
    array_remove(array_agg(DISTINCT ro.role) FILTER (WHERE ro.active), NULL) AS active_roles,
    -- Estado (dueño: modelo nuevo)
    r.status                AS comercial_state,
    r.jurisdiction_id,
    j.external_code         AS municipality_id,
    j.name                  AS municipality_name,
    dep.name                AS department_name,
    EXISTS (
        SELECT 1 FROM "Fiscal".third_party_blocks b
        WHERE b.relation_id = r.id
          AND b.released_at IS NULL
          AND (b.ends_at IS NULL OR b.ends_at > now())
    )                       AS is_blocked
FROM "Fiscal".third_party_company_relations r
JOIN "Ecosystem".thirdparties t ON t.id = r.third_party_id
LEFT JOIN "Fiscal".third_party_roles ro ON ro.relation_id = r.id
LEFT JOIN "Fiscal".jurisdictions j   ON j.id = r.jurisdiction_id
LEFT JOIN "Fiscal".jurisdictions dep ON dep.id = j.parent_id
GROUP BY r.id, t.id, r.company_id, r.status, r.jurisdiction_id,
         j.external_code, j.name, dep.name;

INSERT INTO public.schema_migrations (filename)
VALUES ('0010_create_compatibility_views.sql')
ON CONFLICT (filename) DO NOTHING;
