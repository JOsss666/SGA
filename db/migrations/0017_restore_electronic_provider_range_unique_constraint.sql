-- Migration: 0017_restore_electronic_provider_range_unique_constraint
-- Fecha:     2026-08-31
-- Regla:     aditiva; restaura la unicidad requerida por el UPSERT del caché
-- Rollback:  ALTER TABLE "Facturation".electronic_provider_numbering_ranges
--            DROP CONSTRAINT IF EXISTS uq_electronic_provider_range;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'Facturation'
            AND rel.relname = 'electronic_provider_numbering_ranges'
            AND con.contype IN ('u', 'p')
            AND ARRAY(
                SELECT att.attname::text
                FROM unnest(con.conkey) WITH ORDINALITY AS cols(attnum, ord)
                JOIN pg_attribute att
                    ON att.attrelid = con.conrelid
                    AND att.attnum = cols.attnum
                ORDER BY cols.ord
            ) = ARRAY['credential_id', 'company_id', 'provider_range_id']
    ) THEN
        ALTER TABLE "Facturation".electronic_provider_numbering_ranges
            ADD CONSTRAINT uq_electronic_provider_range
            UNIQUE (credential_id, company_id, provider_range_id);
    END IF;
END $$;

INSERT INTO public.schema_migrations (filename)
VALUES ('0017_restore_electronic_provider_range_unique_constraint.sql')
ON CONFLICT (filename) DO NOTHING;
