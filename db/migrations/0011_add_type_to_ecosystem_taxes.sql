-- Migration: 0011_add_type_to_ecosystem_taxes
-- Fecha:     2026-07-09
-- Motivo:    Clasificar impuestos/retenciones por contexto transaccional:
--            purchase, sell o both.
-- Regla:     solo aditiva; los impuestos existentes quedan como both para
--            conservar el comportamiento actual de la app.
-- Rollback:  ALTER TABLE "Ecosystem".taxes DROP COLUMN "type";
--            DROP TYPE public.tax_type;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
          AND t.typname = 'tax_type'
    ) THEN
        CREATE TYPE public.tax_type AS ENUM ('purchase', 'sell', 'both');
    END IF;
END $$;

ALTER TYPE public.tax_type ADD VALUE IF NOT EXISTS 'purchase';
ALTER TYPE public.tax_type ADD VALUE IF NOT EXISTS 'sell';
ALTER TYPE public.tax_type ADD VALUE IF NOT EXISTS 'both';

ALTER TABLE "Ecosystem".taxes
    ADD COLUMN IF NOT EXISTS "type" public.tax_type NOT NULL DEFAULT 'both';

ALTER TABLE "Ecosystem".taxes
    ALTER COLUMN "type" SET DEFAULT 'both';

INSERT INTO public.schema_migrations (filename)
VALUES ('0011_add_type_to_ecosystem_taxes.sql')
ON CONFLICT (filename) DO NOTHING;
