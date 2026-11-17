import { findDocumentRetry, saveDocumentRequest } from './customerAdvanceService.js';
import { normalizeAttached, uniqueIds, resolveProcessInstances } from './facturationOrderService.js';

export const PURCHASE_ORDER_TYPE = 'Purchase Order';
// Toda orden nace como borrador; la aprobación se controlará en una etapa posterior.
export const PURCHASE_ORDER_STATUS = 'draft';
const SOURCE_DOCUMENT_TYPE = 'Client Order';
const INACTIVE_SOURCE_STATUSES = ['cancelled', 'disabled'];

const fail = (message, statusCode = 422) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
};

const isId = value => /^[1-9]\d*$/.test(String(value ?? ''));

// Los montos se manejan en centavos enteros para no acumular errores de punto flotante.
const fromCents = cents => (cents / 100).toFixed(2);

const validateRequest = (info) => {
    if (!info || typeof info !== 'object') fail('La solicitud es obligatoria.');
    if (!isId(info.company_id)) fail('La empresa no es válida.');
    if (!isId(info.store_id)) fail('Debes seleccionar una tienda para la orden de compra.');
    if (!isId(info.thirdParty_id)) fail('Debes seleccionar un proveedor.');
    if (!isId(info.created_by)) fail('No se pudo identificar al usuario que crea la orden.');
    if (info.price_list_id != null && info.price_list_id !== '' && !isId(info.price_list_id)) {
        fail('La lista de precios no es válida.');
    }
    if (!Array.isArray(info.items) || info.items.length === 0) {
        fail('La orden de compra necesita al menos un ítem.');
    }

    return info.items.map((item, index) => {
        const position = index + 1;
        const serviceId = item?.service_id ?? item?.product_id;
        const units = Number(item?.units);
        const unitValue = Number(item?.unit_value);

        if (!isId(serviceId)) fail(`El ítem ${position} no tiene un producto o servicio válido.`);
        if (!Number.isInteger(units) || units <= 0) fail(`El ítem ${position} debe tener una cantidad entera mayor a cero.`);
        // El costo pactado puede digitarse a mano: debe ser un número válido (no vacío).
        if (item?.unit_value === '' || item?.unit_value == null || !Number.isFinite(unitValue) || unitValue < 0) {
            fail(`El ítem ${position} tiene un costo unitario inválido.`);
        }

        return {
            service_id: String(serviceId),
            units,
            unit_value: unitValue,
            total_cents: Math.round(units * unitValue * 100),
            description: `${item?.description ?? ''}`.trim() || null
        };
    });
};

// Órdenes de cliente opcionales que originan la compra. Pueden ser de cualquier cliente.
const loadSourceDocuments = async (client, info, sourceDocIds) => {
    if (sourceDocIds.length === 0) return;
    const result = await client.query(`
        SELECT id, status
        FROM "Ecosystem".documents
        WHERE company_id = $1 AND document_type = $2 AND id = ANY($3::bigint[]);
    `, [info.company_id, SOURCE_DOCUMENT_TYPE, sourceDocIds]);

    if (result.rows.length !== sourceDocIds.length) {
        fail('Alguna orden de cliente no existe o no pertenece a esta empresa.');
    }
    for (const row of result.rows) {
        if (INACTIVE_SOURCE_STATUSES.includes(`${row.status}`)) {
            fail(`La orden de cliente #${row.id} está ${row.status} y no se puede incluir en la compra.`);
        }
    }
};

const assertSupplier = async (client, info) => {
    const result = await client.query(`
        SELECT id FROM "Ecosystem".thirdparties WHERE company_id = $1 AND id = $2;
    `, [info.company_id, info.thirdParty_id]);
    if (result.rows.length === 0) fail('El proveedor no existe o no pertenece a esta empresa.');
};

// Si se envía una lista de precios, debe estar asignada al proveedor (no se confía en el navegador).
const assertPriceList = async (client, info) => {
    if (info.price_list_id == null || info.price_list_id === '') return null;
    const result = await client.query(`
        SELECT 1 FROM "Inventory"."thirdparties_pricesList"
        WHERE company_id = $1 AND "thirdParty_id" = $2 AND "priceList_id" = $3
        LIMIT 1;
    `, [info.company_id, info.thirdParty_id, info.price_list_id]);
    if (result.rows.length === 0) fail('La lista de precios no está asignada a este proveedor.');
    return String(info.price_list_id);
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

/**
 * Registra una orden de compra dentro de la transacción del cliente recibido:
 *  - documento `Purchase Order` en borrador con el proveedor como tercero,
 *  - sus ítems (costo pactado) en "Inventory".services_movement.
 * Los costos unitarios incluyen impuesto, igual que en la orden de facturación.
 */
export async function registerPurchaseOrder(client, info) {
    if (!client || typeof client.query !== 'function') fail('Se requiere un cliente de base de datos válido.', 500);
    const items = validateRequest(info);
    const requestInfo = { ...info, doc_type: PURCHASE_ORDER_TYPE };

    if (info.request_id) {
        const retry = await findDocumentRetry(client, requestInfo);
        if (retry) return { id: retry.id, ownSerial: retry.ownSerial, replayed: true };
    }

    const sourceDocIds = uniqueIds(info.source_doc_ids, 'las órdenes de cliente');
    const instanceIds = uniqueIds(info.instances?.length ? info.instances : [info.instance_id], 'los procesos');

    await assertSupplier(client, info);
    await loadSourceDocuments(client, info, sourceDocIds);
    const processInstances = await resolveProcessInstances(client, info, sourceDocIds, instanceIds);
    const primaryInstance = processInstances[0];
    const priceListId = await assertPriceList(client, info);
    const taxRates = await loadItemTaxRates(client, info, items);

    let totalCents = 0;
    let subTotalCents = 0;
    for (const item of items) {
        totalCents += item.total_cents;
        subTotalCents += Math.round(item.total_cents / (1 + taxRates.get(item.service_id) / 100));
    }

    const document = (await client.query(`
        INSERT INTO "Ecosystem".documents(
            company_id, store_id, "thirdParty_id", document_type, status,
            "subTotal", total, created_by, description, attached, "specialConfig",
            instance_id, step_instance)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13)
        RETURNING id, "ownSerial";
    `, [
        info.company_id,
        info.store_id,
        info.thirdParty_id,
        PURCHASE_ORDER_TYPE,
        PURCHASE_ORDER_STATUS,
        fromCents(subTotalCents),
        fromCents(totalCents),
        info.created_by,
        `${info.description ?? ''}`.trim() || null,
        JSON.stringify(normalizeAttached(info.attached)),
        JSON.stringify({
            price_list_id: priceListId,
            expected_date: info.expected_date ?? null,
            source_documents: sourceDocIds
        }),
        primaryInstance?.instance_id ?? null,
        primaryInstance?.step_id ?? null
    ])).rows[0];

    if (document?.id === undefined) fail('No se pudo crear la orden de compra.', 500);
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

    // Cada orden de cliente de origen es el documento principal del grupo de la compra.
    if (sourceDocIds.length > 0) {
        await client.query(`
            INSERT INTO "Ecosystem".documents_group(main_doc_id, doc_id)
            SELECT main_doc_id, $2::bigint
            FROM unnest($1::bigint[]) AS main_doc_id
            ON CONFLICT (main_doc_id, doc_id) DO NOTHING;
        `, [sourceDocIds, document.id]);
    }

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
        document_status: PURCHASE_ORDER_STATUS,
        subTotal: fromCents(subTotalCents),
        total: fromCents(totalCents),
        source_doc_ids: sourceDocIds,
        instance_ids: processInstances.map(instance => instance.instance_id),
        items: items.length
    };
}

export function createPurchaseOrderService({ withTransaction }) {
    return {
        async register(info) {
            const order = await withTransaction(client => registerPurchaseOrder(client, info));
            return {
                status: 'OK',
                message: `Orden de compra #${order.ownSerial} creada correctamente.`,
                ...order
            };
        }
    };
}
