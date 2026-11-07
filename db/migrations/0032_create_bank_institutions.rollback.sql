-- Retira la tabla solo si está vacía. Requiere respaldo previo; nunca usar CASCADE.
BEGIN;
LOCK TABLE "Treasury".bank_institutions IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Treasury".bank_institutions) THEN
        RAISE EXCEPTION 'No se puede retirar la migración: existen instituciones bancarias registradas.';
    END IF;
END;
$$;
DROP TABLE "Treasury".bank_institutions;
DELETE FROM public.schema_migrations WHERE filename = '0032_create_bank_institutions.sql';
COMMIT;
