import { appendBusinessDateRange, companyTimeZoneSql } from '../../services/businessTimeZoneService.js';

const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export const createNexoOtpReportHandler = ({ useDataBase }) => async (req, res) => {
    const companyId = Number(req.get?.('X-SGA-Company-Id') ?? req.body?.company_id);
    if (!Number.isSafeInteger(companyId) || companyId <= 0) return res.status(400).json({ error: 'Se requiere una compañía válida.' });
    if (companyId !== 7) return res.status(403).json({ error: 'Este informe está disponible únicamente para NEXO 360.' });
    const { minDate, maxDate, showClient = true } = req.body ?? {};
    if (typeof showClient !== 'boolean') return res.status(400).json({ error: 'showClient debe ser booleano.' });
    if ((minDate && !validDate(minDate)) || (maxDate && !validDate(maxDate)) || (minDate && maxDate && minDate > maxDate)) {
        return res.status(400).json({ error: 'El rango de fechas no es válido.' });
    }
    const values = [companyId];
    const whereClauses = ["otp.company_id = $1", "otp.status = 'active'"];
    // process_instance.created_at es timestamp legacy UTC, verificado en catálogo.
    appendBusinessDateRange({ whereClauses, values, column: "(otp.created_at AT TIME ZONE 'UTC')", start: minDate, end: maxDate });
    const timeZone = companyTimeZoneSql('$1');
    try {
        const result = await useDataBase(`
            SELECT
                otp.id::text || ':' || COALESCE(source.id::text, 'none') AS id,
                otp.id AS "instanceId", parent.id AS "parentInstanceId",
                source.id AS "clientOrderId", source."ownSerial" AS "clientOrderSerial",
                child_process.code || '#' || otp."ownSerial" AS "otpIdentifier",
                parent_process.code || '#' || parent."ownSerial" AS "parentIdentifier",
                CASE WHEN source.id IS NOT NULL THEN 'Orden #' || source."ownSerial" END AS "clientOrder",
                ${showClient ? 'COALESCE(customer.names, order_customer.names) AS "clientName",' : ''}
                paramdoc.values->>'height' AS height,
                paramdoc.values->>'width' AS width,
                otp.name AS "processInstanceName",
                paramdoc.values->>'reference' AS "paramDocReference",
                step.name AS "processStage", supplier.names AS providers,
                step.name AS "productionStates",
                otp.created_at AT TIME ZONE 'UTC' AS "createdAt",
                (otp.created_at AT TIME ZONE 'UTC') AT TIME ZONE (${timeZone}) AS created_at_local,
                TO_CHAR((otp.created_at AT TIME ZONE 'UTC') AT TIME ZONE (${timeZone}), 'YYYY-MM-DD') AS business_date,
                ${timeZone} AS business_time_zone,
                TO_CHAR((otp.created_at AT TIME ZONE 'UTC') AT TIME ZONE (${timeZone}), 'DD/MM/YYYY') AS "createdDate",
                TO_CHAR(COALESCE(otp.delivery_date, parent.delivery_date), 'DD/MM/YYYY') AS "deliveryDate",
                CASE
                    WHEN COALESCE(otp.delivery_date, parent.delivery_date) IS NULL THEN 'Sin fecha'
                    WHEN COALESCE(otp.delivery_date, parent.delivery_date)::date < (CURRENT_TIMESTAMP AT TIME ZONE (${timeZone}))::date THEN 'Vencido'
                    WHEN COALESCE(otp.delivery_date, parent.delivery_date)::date - (CURRENT_TIMESTAMP AT TIME ZONE (${timeZone}))::date >= 5 THEN 'A tiempo'
                    ELSE 'Cerca de vencer'
                END AS commitment
            FROM "Process".process_instance otp
            JOIN "Process".process_instance parent ON parent.id = otp.parent_id AND parent.company_id = otp.company_id
            JOIN "Process".processes child_process ON child_process.id = otp.process_id AND child_process.company_id = otp.company_id
            JOIN "Process".processes parent_process ON parent_process.id = parent.process_id AND parent_process.company_id = otp.company_id
            LEFT JOIN "Process".process_steps step ON step.id = otp.step_id AND step.company_id = otp.company_id
            LEFT JOIN "Ecosystem".thirdparties supplier ON supplier.id = otp."thirdParty_id" AND supplier.company_id = otp.company_id
            LEFT JOIN "Ecosystem".thirdparties customer ON customer.id = parent."thirdParty_id" AND customer.company_id = otp.company_id
            LEFT JOIN LATERAL (
                -- Primero las asignaciones actuales; para OTP antiguas sin asignación,
                -- conservar las órdenes enlazadas directamente a la instancia.
                WITH assigned_orders AS (
                    SELECT DISTINCT movement.doc_id
                    FROM "Ecosystem".docs_instances link
                    JOIN "Ecosystem".documents delegation ON delegation.id = link.doc_id
                        AND delegation.company_id = otp.company_id AND delegation.status = 'active'
                    JOIN "Process"."ordersDelegation" assignment ON assignment.delegation_document_id = delegation.id
                        AND assignment.company_id = otp.company_id AND assignment.status = 'active'
                    JOIN "Inventory".services_movement movement ON movement.id = assignment.service_movement_id
                        AND movement.company_id = otp.company_id
                    WHERE link.instance_id = otp.id
                )
                SELECT doc_id FROM assigned_orders
                UNION
                SELECT legacy_order.id FROM "Ecosystem".docs_instances legacy_link
                JOIN "Ecosystem".documents legacy_order ON legacy_order.id = legacy_link.doc_id
                    AND legacy_order.company_id = otp.company_id AND legacy_order.document_type = 'Client Order'
                WHERE legacy_link.instance_id = otp.id AND NOT EXISTS (SELECT 1 FROM assigned_orders)
            ) related ON TRUE
            LEFT JOIN "Ecosystem".documents source ON source.id = related.doc_id
                AND source.company_id = otp.company_id AND source.document_type = 'Client Order'
            LEFT JOIN "Ecosystem".thirdparties order_customer ON order_customer.id = source."thirdParty_id"
                AND order_customer.company_id = otp.company_id
            LEFT JOIN LATERAL (
                SELECT parameter."specialConfig"->'values' AS values
                FROM "Ecosystem".documents_group document_group
                JOIN "Ecosystem".documents parameter ON parameter.id = document_group.main_doc_id
                    AND parameter.company_id = otp.company_id AND parameter.document_type = 'JSON Parametrization'
                WHERE document_group.doc_id = source.id
                ORDER BY parameter.id DESC LIMIT 1
            ) paramdoc ON TRUE
            WHERE ${whereClauses.join(' AND ')}
                AND EXISTS (
                    SELECT 1 FROM "Process".orders_delegation_config config
                    WHERE config.company_id = otp.company_id AND config.child_process_id = otp.process_id
                        AND config.parent_process_id = parent.process_id
                )
            ORDER BY otp.created_at DESC, otp.id DESC, source.id
        `, values, 1);
        if (result?.[0] === false) throw new Error('No fue posible consultar las OTP.');
        return res.status(200).json(result);
    } catch {
        return res.status(500).json({ error: 'No fue posible cargar el informe de OTP.' });
    }
};
