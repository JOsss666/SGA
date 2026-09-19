import { companyTimeZoneSql } from '../../services/businessTimeZoneService.js';

export const createNexoProcessReportHandler = ({ useDataBase }) => async (req, res) => {
    // La compañía se identifica por header/body, igual que el resto de endpoints de la app.
    // (Evita depender de la cookie de sesión, que no viaja cross-site en Safari.)
    const rawCompanyId = req.get?.('X-SGA-Company-Id') ?? req.body?.company_id;
    const companyId = Number(rawCompanyId);
    if (!Number.isSafeInteger(companyId) || companyId <= 0) {
        return res.status(400).json({ error: 'Se requiere una compañía válida.' });
    }
    if (companyId !== 7) {
        return res.status(403).json({ error: 'Este informe está disponible únicamente para la compañía 7.' });
    }
    try {
        const sentence = `
            SELECT
                document.id,
                document.id AS doc_id,
                COALESCE(document.instance_id, document_instance.instance_id) AS instance_id,
                document."ownSerial" AS reference,
                document.description AS product,
                document.created_at AS "createdAt",
                document.created_at AT TIME ZONE (${companyTimeZoneSql('$1')}) AS created_at_local,
                ${companyTimeZoneSql('$1')} AS business_time_zone,
                COALESCE(parent_process.client_name, customer.names) AS "clientName",
                store.name AS store,
                COALESCE(document.status, 'active') AS document_status,
                COALESCE(items.components, '[]'::json) AS components,
                CASE
                    WHEN COALESCE(items.assigned_items, 0) = 0 THEN 'Por asignar'
                    WHEN COALESCE(items.completed_items, 0) = COALESCE(items.total_items, 0)
                        AND COALESCE(items.total_items, 0) > 0 THEN 'Pendiente de aprobación'
                    ELSE 'En producción'
                END AS status,
                CASE
                    WHEN document.created_at < NOW() - INTERVAL '30 days' THEN 'Vencido'
                    ELSE 'En tiempo'
                END AS priority,
                'Orden registrada' AS "clientStage",
                CASE WHEN COALESCE(items.assigned_items, 0) = 0
                    THEN 'Pendiente de asignación' ELSE 'Asignada a proveedor' END AS "administrationStage",
                COALESCE(items.provider_stage, 'Sin proveedor') AS "providerStage",
                parent_process.process_name AS "processName",
                parent_process.instance_name AS "processInstanceName",
                parent_process.instance_id AS "parentInstanceId",
                parent_process.instance_serial AS "processOwnSerial",
                parent_process.process_code AS "processCode",
                parent_process.step_name AS "processStage",
                parent_process.delivery_date AS "deliveryAt",
                paramdoc.reference AS "paramDocReference",
                COALESCE(subprocess.subprocesses, '[]'::json) AS "subprocesses"
            FROM "Ecosystem".documents document
            LEFT JOIN LATERAL (
                SELECT MAX(link.instance_id) AS instance_id
                FROM "Ecosystem".docs_instances link
                WHERE link.doc_id = document.id
            ) document_instance ON TRUE
            LEFT JOIN "Ecosystem".thirdparties customer
                ON customer.id = document."thirdParty_id"
                AND customer.company_id = document.company_id
            LEFT JOIN "Ecosystem".stores store
                ON store.id = document.store_id
            LEFT JOIN LATERAL (
                SELECT
                    COUNT(movement.id) AS total_items,
                    COUNT(assignment.id) FILTER (WHERE assignment.id IS NOT NULL) AS assigned_items,
                    0 AS completed_items,
                    STRING_AGG(DISTINCT supplier.names, ', ') FILTER (WHERE supplier.names IS NOT NULL) AS provider_stage,
                    JSON_AGG(JSON_BUILD_OBJECT(
                        'id', movement.id,
                        'name', COALESCE(service.name, 'Ítem de producción'),
                        'provider', supplier.names,
                        'workOrder', delegation_document."ownSerial",
                        'status', CASE WHEN assignment.id IS NULL THEN 'Por asignar' ELSE 'Asignado' END
                    ) ORDER BY movement.id) FILTER (WHERE movement.id IS NOT NULL) AS components
                FROM "Inventory".services_movement movement
                LEFT JOIN "Inventory"."products&services" service
                    ON service.id = movement.service_id
                LEFT JOIN "Process"."ordersDelegation" assignment
                    ON assignment.service_movement_id = movement.id
                    AND assignment.company_id = movement.company_id
                    AND assignment.status = 'active'
                LEFT JOIN "Ecosystem".thirdparties supplier
                    ON supplier.id = assignment."thirdParty_id"
                    AND supplier.company_id = movement.company_id
                LEFT JOIN "Ecosystem".documents delegation_document
                    ON delegation_document.id = assignment.delegation_document_id
                WHERE movement.company_id = document.company_id
                    AND movement.doc_id = document.id
            ) items ON TRUE
            LEFT JOIN LATERAL (
                -- Proceso "grande" (padre) al que está ligada la orden: la instancia
                -- de proceso sin parent_id enlazada por docs_instances o instance_id.
                -- El cliente se toma precisamente del tercero de esta instancia padre.
                SELECT parent_proc.name AS process_name, parent_step.name AS step_name,
                    parent_inst.delivery_date, parent_inst.name AS instance_name,
                    parent_client.names AS client_name,
                    parent_inst.id AS instance_id, parent_inst."ownSerial" AS instance_serial,
                    parent_proc.code AS process_code
                FROM "Process".process_instance parent_inst
                LEFT JOIN "Process".processes parent_proc ON parent_proc.id = parent_inst.process_id
                LEFT JOIN "Process".process_steps parent_step ON parent_step.id = parent_inst.step_id
                LEFT JOIN "Ecosystem".thirdparties parent_client
                    ON parent_client.id = parent_inst."thirdParty_id"
                    AND parent_client.company_id = parent_inst.company_id
                WHERE parent_inst.company_id = document.company_id
                    AND parent_inst.parent_id IS NULL
                    AND (parent_inst.id = document.instance_id
                        OR EXISTS (SELECT 1 FROM "Ecosystem".docs_instances link
                            WHERE link.doc_id = document.id AND link.instance_id = parent_inst.id))
                ORDER BY parent_inst.id DESC
                LIMIT 1
            ) parent_process ON TRUE
            LEFT JOIN LATERAL (
                -- Subprocesos (instancias hijas de la delegación) ligados a la orden:
                -- se devuelve cada uno con su instance_id y su etapa actual, para poder
                -- abrir individualmente el subproceso al que pertenece cada tag.
                SELECT JSON_AGG(JSON_BUILD_OBJECT(
                    'instance_id', child.id,
                    'name', child_step.name
                ) ORDER BY child.id) AS subprocesses
                FROM "Process".process_instance child
                JOIN "Process".process_steps child_step ON child_step.id = child.step_id
                WHERE child.company_id = document.company_id
                    AND child.parent_id IS NOT NULL
                    AND EXISTS (SELECT 1 FROM "Ecosystem".docs_instances link
                        WHERE link.doc_id = document.id AND link.instance_id = child.id)
            ) subprocess ON TRUE
            LEFT JOIN LATERAL (
                -- Referencia del paramDoc (JSON Parametrization) del que nació la
                -- orden: se vincula por documents_group (main_doc_id = paramDoc).
                SELECT paramdoc_doc."specialConfig"->'values'->>'reference' AS reference
                FROM "Ecosystem".documents_group dg
                JOIN "Ecosystem".documents paramdoc_doc ON paramdoc_doc.id = dg.main_doc_id
                    AND paramdoc_doc.document_type = 'JSON Parametrization'
                WHERE dg.doc_id = document.id
                ORDER BY paramdoc_doc.id DESC
                LIMIT 1
            ) paramdoc ON TRUE
            WHERE document.company_id = $1
                AND document.document_type = 'Client Order'
                AND document.status = 'active'
            ORDER BY document.created_at DESC, document.id DESC;
        `;
        const result = await useDataBase(sentence, [companyId], 1);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error al cargar informe NEXO 360:', error);
        return res.status(500).json({ error: 'No fue posible cargar el informe NEXO 360.' });
    }
};
