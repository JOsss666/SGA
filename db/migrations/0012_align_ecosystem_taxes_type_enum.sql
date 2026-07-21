-- Migration: 0012_align_ecosystem_taxes_type_enum
-- Fecha:     2026-07-09
-- Motivo:    Alinear "Ecosystem".taxes."type" con el enum real public.tax_type.
--            En algunas bases la columna ya existía antes de 0011 con default
--            'sell'. Este ajuste fija el default nuevo en 'both' sin cambiar
--            datos existentes.
-- Rollback:  ALTER TABLE "Ecosystem".taxes ALTER COLUMN "type" SET DEFAULT 'sell';

ALTER TYPE public.tax_type ADD VALUE IF NOT EXISTS 'purchase';
ALTER TYPE public.tax_type ADD VALUE IF NOT EXISTS 'sell';
ALTER TYPE public.tax_type ADD VALUE IF NOT EXISTS 'both';

ALTER TABLE "Ecosystem".taxes
    ALTER COLUMN "type" SET DEFAULT 'both';

-- Limpieza idempotente del enum temporal creado por una versión previa de 0011.
DROP TYPE IF EXISTS "Ecosystem".tax_transaction_type;

INSERT INTO public.schema_migrations (filename)
VALUES ('0012_align_ecosystem_taxes_type_enum.sql')
ON CONFLICT (filename) DO NOTHING;
