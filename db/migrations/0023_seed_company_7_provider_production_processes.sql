-- Migration: 0023_seed_company_7_provider_production_processes
-- Fecha:     2026-09-09
-- Etapa:     parametrización inicial de procesos para company_id = 7
-- Regla:     aditiva e idempotente; no crea instancias ni documentos
-- Rollback:  0023_seed_company_7_provider_production_processes.rollback.sql

DO $$
DECLARE
    target_company_id CONSTANT bigint := 7;
    main_process_id bigint;
    supplier_process_id bigint;
    classification_step_id bigint;
    invoiced_step_id bigint;
    company_role_ids bigint[];
BEGIN
    PERFORM pg_advisory_xact_lock(7, 20260909);

    IF NOT EXISTS (
        SELECT 1
        FROM "Ecosystem".companies
        WHERE company_id = target_company_id
    ) THEN
        RAISE EXCEPTION 'La compañía % no existe.', target_company_id;
    END IF;

    SELECT ARRAY_AGG(role.id ORDER BY role.id)
    INTO company_role_ids
    FROM "Ecosystem".roles role
    WHERE role.company_id = target_company_id;

    IF COALESCE(cardinality(company_role_ids), 0) = 0 THEN
        RAISE EXCEPTION 'La compañía % no tiene roles configurados.', target_company_id;
    END IF;

    SELECT process.id
    INTO main_process_id
    FROM "Process".processes process
    WHERE process.company_id = target_company_id
        AND process.code = 'GPC'
    ORDER BY process.id
    LIMIT 1;

    IF main_process_id IS NULL THEN
        INSERT INTO "Process".processes (
            company_id,
            name,
            description,
            status,
            code,
            img
        ) VALUES (
            target_company_id,
            'Gestión de producción para cliente',
            'Gestiona pedidos de clientes, producción paralela por proveedores, entrega y facturación.',
            'active',
            'GPC',
            'https://cdnmain.sga360.co/static/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.webp'
        )
        RETURNING id INTO main_process_id;
    ELSE
        UPDATE "Process".processes
        SET name = 'Gestión de producción para cliente',
            description = 'Gestiona pedidos de clientes, producción paralela por proveedores, entrega y facturación.',
            status = 'active'
        WHERE id = main_process_id
            AND company_id = target_company_id;
    END IF;

    INSERT INTO "Process".process_steps (
        company_id, process_id, name, "order", required_roll,
        end_process, parent_id, description, optional
    ) VALUES
        (target_company_id, main_process_id,
            'Parametrización cliente', 0, company_role_ids, false, NULL,
            'Registro inicial y documentación del cliente.', false),
        (target_company_id, main_process_id,
            'Clasificación y Presupuesto', 1, company_role_ids, false, NULL,
            'Clasificación del trabajo y creación de una o más órdenes de cliente.', false),
        (target_company_id, main_process_id,
            'Asignación Proveedores', 2, company_role_ids, false, NULL,
            'Creación de las delegaciones que originarán los subprocesos de proveedor.', false),
        (target_company_id, main_process_id,
            'En producción', 3, company_role_ids, false, NULL,
            'Ejecución paralela de los subprocesos de producción de proveedores.', false),
        (target_company_id, main_process_id,
            'Terminando', 4, company_role_ids, false, NULL,
            'Preparación final posterior a la producción de proveedores.', false),
        (target_company_id, main_process_id,
            'Entregado a cliente', 5, company_role_ids, false, NULL,
            'Confirmación de la entrega realizada al cliente.', false),
        (target_company_id, main_process_id,
            'Facturado', 6, company_role_ids, false, NULL,
            'Creación y asociación de la factura de venta.', false),
        (target_company_id, main_process_id,
            'Finalizado', 7, company_role_ids, true, NULL,
            'Cierre del proceso principal.', false)
    ON CONFLICT (process_id, "order") DO UPDATE
    SET company_id = EXCLUDED.company_id,
        name = EXCLUDED.name,
        required_roll = EXCLUDED.required_roll,
        end_process = EXCLUDED.end_process,
        description = EXCLUDED.description,
        optional = EXCLUDED.optional;

    SELECT step.id
    INTO classification_step_id
    FROM "Process".process_steps step
    WHERE step.process_id = main_process_id
        AND step."order" = 1;

    SELECT step.id
    INTO invoiced_step_id
    FROM "Process".process_steps step
    WHERE step.process_id = main_process_id
        AND step."order" = 6;

    IF NOT EXISTS (
        SELECT 1
        FROM "Process".step_doc_realtion relation
        WHERE relation.company_id = target_company_id
            AND relation.step_id = classification_step_id
            AND relation."docType" = 'Client Order'
    ) THEN
        INSERT INTO "Process".step_doc_realtion (
            company_id, "docType", step_id, required, min_number, max_number
        ) VALUES (
            target_company_id,
            'Client Order',
            classification_step_id,
            true,
            1,
            NULL
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "Process".step_doc_realtion relation
        WHERE relation.company_id = target_company_id
            AND relation.step_id = invoiced_step_id
            AND relation."docType" = 'Sell Invoice'
    ) THEN
        INSERT INTO "Process".step_doc_realtion (
            company_id, "docType", step_id, required, min_number, max_number
        ) VALUES (
            target_company_id,
            'Sell Invoice',
            invoiced_step_id,
            true,
            1,
            NULL
        );
    END IF;

    SELECT process.id
    INTO supplier_process_id
    FROM "Process".processes process
    WHERE process.company_id = target_company_id
        AND process.code = 'PP'
    ORDER BY process.id
    LIMIT 1;

    IF supplier_process_id IS NULL THEN
        INSERT INTO "Process".processes (
            company_id,
            name,
            description,
            status,
            code,
            img
        ) VALUES (
            target_company_id,
            'Producción de proveedores',
            'Subproceso independiente creado por cada documento de delegación a proveedor.',
            'active',
            'PP',
            'https://cdnmain.sga360.co/static/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.webp'
        )
        RETURNING id INTO supplier_process_id;
    ELSE
        UPDATE "Process".processes
        SET name = 'Producción de proveedores',
            description = 'Subproceso independiente creado por cada documento de delegación a proveedor.',
            status = 'active'
        WHERE id = supplier_process_id
            AND company_id = target_company_id;
    END IF;

    INSERT INTO "Process".process_steps (
        company_id, process_id, name, "order", required_roll,
        end_process, parent_id, description, optional
    ) VALUES
        (target_company_id, supplier_process_id,
            'Asignado', 0, company_role_ids, false, NULL,
            'Etapa inicial del trabajo delegado al proveedor.', false),
        (target_company_id, supplier_process_id,
            'En ejecución', 1, company_role_ids, false, NULL,
            'Permite asociar documentos de compra y adjuntos cuando estén disponibles.', false),
        (target_company_id, supplier_process_id,
            'Ejecutado', 2, company_role_ids, false, NULL,
            'Trabajo ejecutado; la restricción de adjuntos se configurará posteriormente.', false),
        (target_company_id, supplier_process_id,
            'Aprobado', 3, company_role_ids, false, NULL,
            'Trabajo del proveedor revisado y aprobado.', false),
        (target_company_id, supplier_process_id,
            'Entregado', 4, company_role_ids, true, NULL,
            'Cierre del subproceso de producción del proveedor.', false)
    ON CONFLICT (process_id, "order") DO UPDATE
    SET company_id = EXCLUDED.company_id,
        name = EXCLUDED.name,
        required_roll = EXCLUDED.required_roll,
        end_process = EXCLUDED.end_process,
        description = EXCLUDED.description,
        optional = EXCLUDED.optional;
END $$;

INSERT INTO public.schema_migrations (filename)
VALUES ('0023_seed_company_7_provider_production_processes.sql')
ON CONFLICT (filename) DO NOTHING;
