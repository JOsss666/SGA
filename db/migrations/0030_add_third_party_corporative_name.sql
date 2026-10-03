-- Migration: 0030_add_third_party_corporative_name
-- Fecha:     2026-10-03
-- Regla:     solo aditiva e idempotente
-- Motivo:    almacenar la razón social separada de los nombres personales del tercero.
-- Rollback:  revertir el código y conservar la columna nullable; eliminarla
--            descartaría razones sociales que se hayan guardado después.

ALTER TABLE "Ecosystem".thirdparties
    ADD COLUMN IF NOT EXISTS corporative_name varchar(200);

COMMENT ON COLUMN "Ecosystem".thirdparties.corporative_name IS
    'Razón social legal del tercero, separada de sus nombres y apellidos personales.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0030_add_third_party_corporative_name.sql')
ON CONFLICT (filename) DO NOTHING;
