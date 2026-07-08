-- Migration: 0008_add_jurisdiction_to_relations
-- Fecha:     2026-07-08
-- Etapa:     3 — soporte para domicilio fiscal del tercero en el modelo nuevo
-- Motivo:    el modelo nuevo no tenía dónde guardar el municipio del tercero
--            (legacy: thirdPartyTaxInfo.municipality_id). Sin esto, la vista de
--            compatibilidad de la Etapa 4 no puede devolver municipality_id
--            desde el modelo nuevo.
-- Regla:     solo aditiva (ADD COLUMN nullable, sin default que reescriba filas)
-- Rollback:  ALTER TABLE "Fiscal".third_party_company_relations DROP COLUMN jurisdiction_id;

ALTER TABLE "Fiscal".third_party_company_relations
    ADD COLUMN IF NOT EXISTS jurisdiction_id bigint REFERENCES "Fiscal".jurisdictions(id);

COMMENT ON COLUMN "Fiscal".third_party_company_relations.jurisdiction_id
    IS 'Domicilio fiscal del tercero (municipio). Equivale al legacy thirdPartyTaxInfo.municipality_id (id Factus = jurisdictions.external_code)';

INSERT INTO public.schema_migrations (filename)
VALUES ('0008_add_jurisdiction_to_relations.sql')
ON CONFLICT (filename) DO NOTHING;
