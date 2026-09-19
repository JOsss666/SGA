import { companyTimeZoneSql } from '../../services/businessTimeZoneService.js';

export const createNexoProcessReportHandler = ({ useDataBase }) => async (req, res) => {
    if (!req.auth?.userId) {
        return res.status(401).json({ error: 'Se requiere una sesión autenticada.' });
    }
    const companyId = req.auth.companyId;
    if (companyId !== 7 || (req.body?.company_id != null && String(req.body.company_id) !== '7')) {
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
                customer.names AS "clientName",
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
                COALESCE(items.provider_stage, 'Sin proveedor') AS "providerStage"
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
