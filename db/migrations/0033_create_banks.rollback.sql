-- Retira la tabla solo si está vacía. Requiere respaldo previo; nunca usar CASCADE.
BEGIN;
LOCK TABLE "Treasury".banks IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Treasury".banks) THEN
        RAISE EXCEPTION 'No se puede retirar la migración: existen bancos registrados.';
    END IF;
END;
$$;
DROP TABLE "Treasury".banks;
DROP FUNCTION "Treasury".validate_bank_institution_scope();
DELETE FROM public.schema_migrations WHERE filename = '0033_create_banks.sql';
COMMIT;
