-- Migration: 0022_extend_integration_token_ttl
-- Fecha:     2026-09-03
-- Motivo:    ampliar la vigencia de los JWT de integración a 3 horas.
-- Regla:     cambio transaccional; no modifica tokens ya emitidos.

BEGIN;

ALTER TABLE "Integration".clients
    DROP CONSTRAINT IF EXISTS chk_integration_token_ttl;

ALTER TABLE "Integration".clients
    ALTER COLUMN access_token_ttl SET DEFAULT 10800,
    ADD CONSTRAINT chk_integration_token_ttl
        CHECK (access_token_ttl BETWEEN 60 AND 10800);

UPDATE "Integration".clients
SET access_token_ttl = 10800,
    updated_at = now()
WHERE access_token_ttl <> 10800;

INSERT INTO public.schema_migrations (filename)
VALUES ('0022_extend_integration_token_ttl.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;
