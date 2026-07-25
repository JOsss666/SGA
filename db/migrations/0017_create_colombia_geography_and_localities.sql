-- Migration: 0017_create_colombia_geography_and_localities
-- Fecha:     2026-07-25
-- Etapa:     catálogo geográfico para creación de terceros
-- Regla:     solo aditiva
-- Requiere:  0002 y 0007
-- Rollback:  ALTER TABLE "Fiscal".third_party_company_relations DROP COLUMN locality_id;
--            DROP TABLE "Fiscal".localities;

-- Una localidad es un asentamiento dentro de un municipio. No se mezcla con
-- jurisdictions porque una ciudad no siempre es una división administrativa.
CREATE TABLE IF NOT EXISTS "Fiscal".localities (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    municipality_id  bigint       NOT NULL REFERENCES "Fiscal".jurisdictions(id),
    type              varchar(30)  NOT NULL DEFAULT 'municipal_seat'
                      CHECK (type IN (
                          'municipal_seat',
                          'city',
                          'town',
                          'village',
                          'population_center',
                          'district',
                          'locality',
                          'other'
                      )),
    code              varchar(30),
    name              varchar(200) NOT NULL,
    is_municipal_seat boolean      NOT NULL DEFAULT false,
    active            boolean      NOT NULL DEFAULT true,
    created_at        timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_locality UNIQUE (municipality_id, type, name)
);

CREATE INDEX IF NOT EXISTS idx_localities_municipality
    ON "Fiscal".localities (municipality_id);

CREATE INDEX IF NOT EXISTS idx_localities_name
    ON "Fiscal".localities (lower(name));

COMMENT ON TABLE "Fiscal".localities IS
    'Ciudades, cabeceras municipales, corregimientos y centros poblados contenidos en un municipio.';

-- El primer catálogo de ciudades se deriva de las cabeceras de los 1.122
-- municipios/distritos ya sembrados por 0007. Esto es determinista e idempotente.
INSERT INTO "Fiscal".localities
    (municipality_id, type, code, name, is_municipal_seat)
SELECT
    j.id,
    'municipal_seat',
    j.code,
    j.name,
    true
FROM "Fiscal".jurisdictions j
JOIN "Fiscal".countries c ON c.id = j.country_id
WHERE c.iso_code_2 = 'CO'
  AND j.level = 'municipality'
ON CONFLICT ON CONSTRAINT uq_locality DO NOTHING;

-- Domicilio detallado de la relación tercero-compañía. jurisdiction_id sigue
-- representando el municipio fiscal y locality_id la ciudad/localidad postal.
ALTER TABLE "Fiscal".third_party_company_relations
    ADD COLUMN IF NOT EXISTS locality_id bigint REFERENCES "Fiscal".localities(id);

CREATE INDEX IF NOT EXISTS idx_tp_company_relations_locality
    ON "Fiscal".third_party_company_relations (locality_id);

COMMENT ON COLUMN "Fiscal".third_party_company_relations.locality_id IS
    'Ciudad/localidad postal del tercero; debe pertenecer al municipio indicado por jurisdiction_id.';

-- Migra relaciones existentes a la cabecera de su municipio cuando sea posible.
UPDATE "Fiscal".third_party_company_relations r
SET locality_id = l.id,
    updated_at = now()
FROM "Fiscal".localities l
WHERE l.municipality_id = r.jurisdiction_id
  AND l.is_municipal_seat
  AND r.locality_id IS NULL;

INSERT INTO public.schema_migrations (filename)
VALUES ('0017_create_colombia_geography_and_localities.sql')
ON CONFLICT (filename) DO NOTHING;
