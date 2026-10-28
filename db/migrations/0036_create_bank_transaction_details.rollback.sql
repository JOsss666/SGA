-- Retira la tabla solo si está vacía. Requiere respaldo previo; nunca usar CASCADE.
-- Revertir antes 0037 y 0038.
BEGIN;
LOCK TABLE "Treasury".bank_transaction_details IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Treasury".bank_transaction_details) THEN
        RAISE EXCEPTION 'No se puede retirar la migración: existen detalles de movimientos bancarios.';
    END IF;
END;
$$;
DROP TABLE "Treasury".bank_transaction_details;
DROP FUNCTION "Treasury".validate_bank_detail();
DELETE FROM public.schema_migrations WHERE filename = '0036_create_bank_transaction_details.sql';
COMMIT;
