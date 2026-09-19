-- Migration: 0026_add_external_third_parties_access_key
-- Fecha:     2026-09-14
-- Motivo:    identificador opaco para los accesos externos de terceros.
-- Regla:     aditiva; conserva columnas, permisos y datos existentes.
-- Rollback:  antes del COMMIT, ROLLBACK. Después, conservar la columna y
--            desactivar su consumo en la aplicación; no eliminar claves emitidas.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "Ecosystem"."externalThirdPatiesAccess"
    ADD COLUMN IF NOT EXISTS "accesKey" uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS external_third_parties_access_acces_key_uidx
    ON "Ecosystem"."externalThirdPatiesAccess" ("accesKey");

COMMENT ON COLUMN "Ecosystem"."externalThirdPatiesAccess"."accesKey" IS
    'Identificador UUID aleatorio del acceso externo. No sustituye la validación de permisos, compañía ni vencimiento.';

-- Registro de aplicación.
INSERT INTO public.schema_migrations (filename)
VALUES ('0026_add_external_third_parties_access_key.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;
