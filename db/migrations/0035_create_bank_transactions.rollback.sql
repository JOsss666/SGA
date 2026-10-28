-- Retira la tabla solo si está vacía. Requiere respaldo previo; nunca usar CASCADE.
-- Revertir antes 0036, 0037 y 0038: dependen de esta tabla y de bank_forbid_mutation().
BEGIN;
LOCK TABLE "Treasury".bank_transactions IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Treasury".bank_transactions) THEN
        RAISE EXCEPTION 'No se puede retirar la migración: existen movimientos bancarios registrados.';
    END IF;
END;
$$;
DROP TABLE "Treasury".bank_transactions;
DROP FUNCTION "Treasury".bank_forbid_mutation();
DELETE FROM public.schema_migrations WHERE filename = '0035_create_bank_transactions.sql';
COMMIT;
