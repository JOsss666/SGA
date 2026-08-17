-- Migration: 0021_add_company_business_time_zone
-- Fecha:     2026-08-16
-- Etapa:     zona horaria comercial multiempresa
-- Regla:     solo aditiva; no modifica transaction_detail ni sus históricos
-- Rollback:  db/migrations/0021_add_company_business_time_zone.rollback.sql

BEGIN;

ALTER TABLE "Ecosystem".company_settings
    ADD COLUMN IF NOT EXISTS time_zone text;

-- Compatibilidad con las compañías actuales del despliegue colombiano.
-- Las nuevas zonas se administran por API y se validan contra pg_timezone_names.
UPDATE "Ecosystem".company_settings
SET time_zone = 'America/Bogota'
WHERE time_zone IS NULL;

ALTER TABLE "Ecosystem".company_settings
    ALTER COLUMN time_zone SET DEFAULT 'America/Bogota',
    ALTER COLUMN time_zone SET NOT NULL;

COMMENT ON COLUMN "Ecosystem".company_settings.time_zone IS
    'Zona horaria IANA usada para fechas comerciales, cierres e informes.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0021_add_company_business_time_zone.sql')
ON CONFLICT DO NOTHING;

COMMIT;

