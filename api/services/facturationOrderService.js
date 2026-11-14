import { findDocumentRetry, saveDocumentRequest } from './customerAdvanceService.js';

export const FACTURATION_ORDER_TYPE = 'Facturation Order';
// Toda orden nace como borrador; la aprobación se controlará en una etapa posterior.
export const FACTURATION_ORDER_STATUS = 'draft';
const SOURCE_DOCUMENT_TYPE = 'Client Order';
const INACTIVE_SOURCE_STATUSES = ['cancelled', 'disabled'];

const fail = (message, statusCode = 422) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
};

const isId = value => /^[1-9]\d*$/.test(String(value ?? ''));

const uniqueIds = (values, label) => {
    const ids = [...new Set((Array.isArray(values) ? values : [])
        .map(value => (value !== null && typeof value === 'object' ? (value.instance_id ?? value.id) : value))
        .filter(value => value !== undefined && value !== null && value !== '')
        .map(String))];
    if (ids.some(id => !isId(id))) fail(`Los identificadores de ${label} no son válidos.`);
    return ids;
};

// Los montos se manejan en centavos enteros para no acumular errores de punto flotante.
const toCents = value => Math.round(Number(value) * 100);
const fromCents = cents => (cents / 100).toFixed(2);

export const normalizeAttached = (attached) => {
    if (Array.isArray(attached)) return attached;
    if (typeof attached === 'string' && attached.trim() !== '') {
        try {
            const parsed = JSON.parse(attached);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            return [attached];
        }
    }
    return [];
};

const validateRequest = (info) => {
    if (!info || typeof info !== 'object') fail('La solicitud es obligatoria.');
    if (!isId(info.company_id)) fail('La empresa no es válida.');
    if (!isId(info.store_id)) fail('Debes seleccionar una tienda para la orden de facturación.');
    if (!isId(info.thirdParty_id)) fail('Debes seleccionar un cliente.');
    if (!isId(info.created_by)) fail('No se pudo identificar al usuario que crea la orden.');

    const sourceDocIds = uniqueIds(info.source_doc_ids, 'las órdenes de cliente');
    if (sourceDocIds.length === 0) fail('La orden de facturación necesita al menos una orden de cliente.');

    if (!Array.isArray(info.items) || info.items.length === 0) {
        fail('La orden de facturación necesita al menos un ítem.');
    }

    const items = info.items.map((item, index) => {
        const position = index + 1;
        const serviceId = item?.service_id ?? item?.product_id;
        const units = Number(item?.units);
        const unitValue = Number(item?.unit_value);

        if (!isId(serviceId)) fail(`El ítem ${position} no tiene un producto o servicio válido.`);
        if (!Number.isInteger(units) || units <= 0) fail(`El ítem ${position} debe tener una cantidad entera mayor a cero.`);
        if (!Number.isFinite(unitValue) || unitValue < 0) fail(`El ítem ${position} tiene un valor unitario inválido.`);

        return {
            service_id: String(serviceId),
            units,
            unit_value: unitValue,
            total_cents: Math.round(units * unitValue * 100),
            description: `${item?.facturation_description ?? item?.description ?? ''}`.trim() || null
        };
    });

    return {
        sourceDocIds,
        instanceIds: uniqueIds(
            info.instances?.length ? info.instances : [info.instance_id],
            'los procesos'
        ),
        items
    };
};

const loadSourceDocuments = async (client, info, sourceDocIds) => {
    const result = await client.query(`
        SELECT id, "thirdParty_id", status
        FROM "Ecosystem".documents
        WHERE company_id = $1 AND document_type = $2 AND id = ANY($3::bigint[]);
    `, [info.company_id, SOURCE_DOCUMENT_TYPE, sourceDocIds]);

    if (result.rows.length !== sourceDocIds.length) {
        fail('Alguna orden de cliente no existe o no pertenece a esta empresa.');
    }
    for (const row of result.rows) {
        if (String(row.thirdParty_id) !== String(info.thirdParty_id)) {
            fail(`La orden de cliente #${row.id} pertenece a otro cliente.`);
        }
        if (INACTIVE_SOURCE_STATUSES.includes(`${row.status}`)) {
            fail(`La orden de cliente #${row.id} está ${row.status} y no se puede facturar.`);
        }
    }
};

const loadItemTaxRates = async (client, info, items) => {
    const serviceIds = [...new Set(items.map(item => item.service_id))];
    const result = await client.query(`
        SELECT ps.id, tax.rate
        FROM "Inventory"."products&services" ps
        LEFT JOIN "Ecosystem".taxes tax ON tax.id = ps.tax_id
        WHERE ps.company_id = $1 AND ps.id = ANY($2::bigint[]);
    `, [info.company_id, serviceIds]);

    if (result.rows.length !== serviceIds.length) {
        fail('Algún producto o servicio no existe o no pertenece a esta empresa.');
    }
    return new Map(result.rows.map(row => [String(row.id), Math.max(0, Number(row.rate) || 0)]));
};

// Procesos de la orden: los elegidos en el formulario más los de cada orden de cliente.
// El paso se toma del proceso (no del cliente web) para que no pueda falsearse.
const resolveProcessInstances = async (client, info, sourceDocIds, selectedInstanceIds) => {
    const inherited = await client.query(`
        SELECT DISTINCT instance_id
        FROM "Ecosystem".docs_instances
        WHERE doc_id = ANY($1::bigint[]);
    `, [sourceDocIds]);

    const instanceIds = [...new Set([
        ...selectedInstanceIds,
        ...inherited.rows.map(row => String(row.instance_id))
    ])];
    if (instanceIds.length === 0) return [];

    const result = await client.query(`
        SELECT id, step_id
        FROM "Process".process_instance
        WHERE company_id = $1 AND id = ANY($2::bigint[]);
    `, [info.company_id, instanceIds]);

    if (result.rows.length !== instanceIds.length) {
        fail('Algún proceso no existe o no pertenece a esta empresa.');
    }
    const byId = new Map(result.rows.map(row => [String(row.id), row.step_id]));
    // El orden se conserva: los procesos elegidos explícitamente van primero.
    return instanceIds.map(id => ({ instance_id: id, step_id: byId.get(id) ?? null }));
};

/**
 * Registra una orden de facturación (prefactura) dentro de la transacción del cliente recibido:
 *  - documento `Facturation Order` en borrador,
 *  - sus ítems en "Inventory".services_movement,
 *  - un registro en documents_group por cada orden de cliente de origen (main_doc_id = orden de cliente),
 *  - un registro en docs_instances por cada proceso relacionado.
 */
export async function registerFacturationOrder(client, info) {
    if (!client || typeof client.query !== 'function') fail('Se requiere un cliente de base de datos válido.', 500);
    const { sourceDocIds, instanceIds, items } = validateRequest(info);
    const requestInfo = { ...info, doc_type: FACTURATION_ORDER_TYPE };

    if (info.request_id) {
        const retry = await findDocumentRetry(client, requestInfo);
        if (retry) return { id: retry.id, ownSerial: retry.ownSerial, replayed: true };
    }

    await loadSourceDocuments(client, info, sourceDocIds);
    const taxRates = await loadItemTaxRates(client, info, items);
    const processInstances = await resolveProcessInstances(client, info, sourceDocIds, instanceIds);

    // Totales calculados en el servidor: los valores unitarios incluyen impuesto.
    let totalCents = 0;
    let subTotalCents = 0;
    for (const item of items) {
        totalCents += item.total_cents;
        subTotalCents += Math.round(item.total_cents / (1 + taxRates.get(item.service_id) / 100));
    }

    const primaryInstance = processInstances[0];
    const specialConfig = { source_documents: sourceDocIds };
    const document = (await client.query(`
        INSERT INTO "Ecosystem".documents(
            company_id, store_id, "thirdParty_id", document_type, status,
            "subTotal", total, created_by, description, attached,
            instance_id, step_instance, "specialConfig")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
        RETURNING id, "ownSerial";
    `, [
        info.company_id,
        info.store_id,
        info.thirdParty_id,
        FACTURATION_ORDER_TYPE,
        FACTURATION_ORDER_STATUS,
        fromCents(subTotalCents),
        fromCents(totalCents),
        info.created_by,
        `${info.description ?? ''}`.trim() || null,
        JSON.stringify(normalizeAttached(info.attached)),
        primaryInstance?.instance_id ?? null,
        primaryInstance?.step_id ?? null,
        JSON.stringify(specialConfig)
    ])).rows[0];

    if (document?.id === undefined) fail('No se pudo crear la orden de facturación.', 500);
    await saveDocumentRequest(client, requestInfo, document.id);

    for (const item of items) {
        await client.query(`
            INSERT INTO "Inventory".services_movement(
                company_id, store_id, "thirdParty_id", service_id,
                units, unit_value, total, description, instance_id, doc_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10);
        `, [
            info.company_id,
            info.store_id,
            info.thirdParty_id,
            item.service_id,
            item.units,
            item.unit_value,
            fromCents(item.total_cents),
            item.description,
            primaryInstance?.instance_id ?? null,
            document.id
        ]);
    }

    // Un registro por cada orden de cliente: ella es el documento principal del grupo.
    await client.query(`
        INSERT INTO "Ecosystem".documents_group(main_doc_id, doc_id)
        SELECT main_doc_id, $2::bigint
        FROM unnest($1::bigint[]) AS main_doc_id
        ON CONFLICT (main_doc_id, doc_id) DO NOTHING;
    `, [sourceDocIds, document.id]);

    if (processInstances.length > 0) {
        await client.query(`
            INSERT INTO "Ecosystem".docs_instances(doc_id, instance_id, step_instance)
            SELECT $1::bigint, instance_id, step_instance
            FROM unnest($2::bigint[], $3::bigint[]) AS relation(instance_id, step_instance)
            ON CONFLICT (doc_id, instance_id)
            DO UPDATE SET step_instance = EXCLUDED.step_instance;
        `, [
            document.id,
            processInstances.map(instance => instance.instance_id),
            processInstances.map(instance => instance.step_id)
        ]);
    }

    return {
        id: document.id,
        ownSerial: document.ownSerial,
        replayed: false,
        document_status: FACTURATION_ORDER_STATUS,
        subTotal: fromCents(subTotalCents),
        total: fromCents(totalCents),
        source_doc_ids: sourceDocIds,
        instance_ids: processInstances.map(instance => instance.instance_id),
        items: items.length
    };
}

export function createFacturationOrderService({ withTransaction }) {
    return {
        async register(info) {
            const order = await withTransaction(client => registerFacturationOrder(client, info));
            return {
                status: 'OK',
                message: `Orden de facturación #${order.ownSerial} creada correctamente.`,
                ...order
            };
        }
    };
}
