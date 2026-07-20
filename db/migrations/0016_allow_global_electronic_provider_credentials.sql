-- Allow company_id = 0 for global electronic provider credentials.
-- These credentials work as fallback when a company has no provider-specific row.

DO $$
DECLARE
    constraint_record record;
BEGIN
    FOR constraint_record IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'Facturation'
            AND rel.relname = 'electronic_provider_credentials'
            AND con.contype = 'f'
            AND pg_get_constraintdef(con.oid) LIKE '%"Ecosystem".companies%'
    LOOP
        EXECUTE format(
            'ALTER TABLE "Facturation".electronic_provider_credentials DROP CONSTRAINT IF EXISTS %I',
            constraint_record.conname
        );
    END LOOP;
END $$;

COMMENT ON COLUMN "Facturation".electronic_provider_credentials.company_id IS
    'Usar 0 para credenciales globales fallback. Si existe una credencial activa de la empresa, tiene prioridad.';

ALTER TABLE "Facturation".electronic_provider_numbering_ranges
    DROP CONSTRAINT IF EXISTS uq_electronic_provider_range;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'Facturation'
            AND rel.relname = 'electronic_provider_numbering_ranges'
            AND con.conname = 'uq_electronic_provider_range'
    ) THEN
        ALTER TABLE "Facturation".electronic_provider_numbering_ranges
            ADD CONSTRAINT uq_electronic_provider_range
            UNIQUE (credential_id, company_id, provider_range_id);
    END IF;
END $$;
