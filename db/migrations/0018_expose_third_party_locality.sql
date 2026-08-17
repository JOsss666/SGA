-- Migration: 0018_expose_third_party_locality
-- Fecha:     2026-07-25
-- Etapa:     catálogo geográfico para creación de terceros
-- Regla:     solo aditiva (reemplaza vistas propias del modelo Fiscal)
-- Requiere:  0010 y 0017
-- Rollback:  reaplicar 0010_create_compatibility_views.sql

CREATE OR REPLACE VIEW "Fiscal".v_third_party_current_profile AS
SELECT
    r.id                    AS relation_id,
    t.id                    AS third_party_id,
    r.company_id,
    t.names, t."lastNames",
    t.first_name, t.second_name, t.first_surname, t.second_surname,
    t.indentification_type, t.indentification_number,
    t.mail, t.phone, t.country, t.city, t.address, t.img, t.created_at,
    CASE
        WHEN bool_or(ro.role = 'client') FILTER (WHERE ro.active)
         AND bool_or(ro.role = 'supplier') FILTER (WHERE ro.active)
        THEN 'both'
        ELSE COALESCE(
            (array_agg(ro.role ORDER BY ro.started_at) FILTER (WHERE ro.active))[1],
            t.type::text)
    END                     AS type,
    array_remove(array_agg(DISTINCT ro.role) FILTER (WHERE ro.active), NULL) AS active_roles,
    r.status                AS comercial_state,
    -- Las siguientes cinco columnas conservan exactamente el contrato y orden
    -- de 0010. Las columnas nuevas se agregan solo después de is_blocked.
    r.jurisdiction_id,
    municipality.external_code AS municipality_id,
    municipality.name       AS municipality_name,
    dep.name                AS department_name,
    EXISTS (
        SELECT 1 FROM "Fiscal".third_party_blocks b
        WHERE b.relation_id = r.id
          AND b.released_at IS NULL
          AND (b.ends_at IS NULL OR b.ends_at > now())
    )                       AS is_blocked,
    -- Extensión aditiva: nuevas columnas al final para no romper consumidores.
    country.id              AS country_id,
    country.iso_code_2      AS country_iso_code_2,
    country.name            AS country_name,
    dep.id                  AS department_id,
    dep.code                AS department_code,
    municipality.code       AS municipality_dane_code,
    r.locality_id,
    locality.name           AS locality_name,
    locality.type           AS locality_type
FROM "Fiscal".third_party_company_relations r
JOIN "Ecosystem".thirdparties t ON t.id = r.third_party_id
LEFT JOIN "Fiscal".third_party_roles ro ON ro.relation_id = r.id
LEFT JOIN "Fiscal".jurisdictions municipality ON municipality.id = r.jurisdiction_id
LEFT JOIN "Fiscal".jurisdictions dep ON dep.id = municipality.parent_id
LEFT JOIN "Fiscal".countries country ON country.id = municipality.country_id
LEFT JOIN "Fiscal".localities locality ON locality.id = r.locality_id
GROUP BY
    r.id, t.id, r.company_id, r.status, r.jurisdiction_id, r.locality_id,
    country.id, country.iso_code_2, country.name,
    dep.id, dep.code, dep.name,
    municipality.code, municipality.external_code, municipality.name,
    locality.name, locality.type;

INSERT INTO public.schema_migrations (filename)
VALUES ('0018_expose_third_party_locality.sql')
ON CONFLICT (filename) DO NOTHING;
