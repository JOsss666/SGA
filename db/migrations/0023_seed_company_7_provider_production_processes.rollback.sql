-- Rollback: 0023_seed_company_7_provider_production_processes
-- Elimina únicamente los procesos sembrados si todavía no tienen instancias.

DO $$
DECLARE
    target_company_id CONSTANT bigint := 7;
    configured_process_ids bigint[];
BEGIN
    SELECT ARRAY_AGG(process.id ORDER BY process.id)
    INTO configured_process_ids
    FROM "Process".processes process
    WHERE process.company_id = target_company_id
        AND process.code IN ('GPC', 'PP');

    IF COALESCE(cardinality(configured_process_ids), 0) = 0 THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "Process".process_instance instance
        WHERE instance.company_id = target_company_id
            AND instance.process_id = ANY(configured_process_ids)
    ) THEN
        RAISE EXCEPTION 'No se puede revertir: existen instancias asociadas a los procesos GPC o PP.';
    END IF;

    DELETE FROM "Process".processes
    WHERE company_id = target_company_id
        AND code IN ('GPC', 'PP');

    DELETE FROM public.schema_migrations
    WHERE filename = '0023_seed_company_7_provider_production_processes.sql';
END $$;
