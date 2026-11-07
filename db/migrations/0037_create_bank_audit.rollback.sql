-- Retira la tabla solo si está vacía. Requiere respaldo previo; nunca usar CASCADE.
BEGIN;
LOCK TABLE "Treasury".bank_audit IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Treasury".bank_audit) THEN
        RAISE EXCEPTION 'No se puede retirar la migración: existe bitácora bancaria registrada.';
    END IF;
END;
$$;
DROP TABLE "Treasury".bank_audit;
DELETE FROM public.schema_migrations WHERE filename = '0037_create_bank_audit.sql';
COMMIT;
