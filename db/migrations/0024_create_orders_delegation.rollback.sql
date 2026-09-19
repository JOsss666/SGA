-- Solo permite retirar una instalación todavía sin delegaciones ni solicitudes.
-- Aplicar dentro de una transacción y con respaldo previo.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Process"."ordersDelegation")
        OR EXISTS (SELECT 1 FROM "Process".orders_delegation_requests) THEN
        RAISE EXCEPTION 'No se puede retirar la migración: existen delegaciones o solicitudes registradas.';
    END IF;
END $$;
DROP TABLE "Process"."ordersDelegation";
DROP TABLE "Process".orders_delegation_requests;
DROP TABLE "Process".orders_delegation_config;
DROP INDEX IF EXISTS "Process".process_instance_parent_step;
DELETE FROM public.schema_migrations WHERE filename = '0024_create_orders_delegation.sql';
