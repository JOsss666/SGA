// Dependencias inyectadas: reutiliza los helpers sin abrir conexiones al importar.
function fail(message, statusCode = 400) {
    throw Object.assign(new Error(message), { statusCode });
}

function id(value, field) {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) fail(`${field} no es válido.`);
    if (!/^[1-9]\d*$/.test(String(value)) || BigInt(value) > 9223372036854775807n) fail(`${field} no es válido.`);
    return String(value);
}

function decimal(value, field, positive = false) {
    if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') fail(`${field} es requerido.`);
    const number = Number(value);
    if (!Number.isFinite(number) || (positive ? number <= 0 : number < 0)) {
        fail(`${field} debe ser un número ${positive ? 'positivo' : 'no negativo'}.`);
    }
    return number;
}

function money(value) {
    if (!Number.isFinite(value) || value > Number.MAX_SAFE_INTEGER / 1000000) fail('El importe supera la precisión admitida.');
    return Number(value.toFixed(6));
}

function normalizePresets(presets) {
    if (!Array.isArray(presets) || !presets.length || presets.length > 1000) fail('items debe contener entre 1 y 1000 presets.');
    return presets.map((preset, index) => ({
        id: id(preset?.preset_id ?? preset?.id, `items[${index}].id`),
        units: decimal(preset?.units, `items[${index}].units`, true),
        description: preset?.description ?? ''
    }));
}

// Modo products: los ítems ya son productos con su valor unitario diligenciado en
// el formulario. No se expanden presets ni se leen precios de componentValues.
function normalizeProducts(products) {
    if (!Array.isArray(products) || !products.length || products.length > 1000) fail('items debe contener entre 1 y 1000 productos.');
    return products.map((item, index) => ({
        product_id: id(item?.product_id ?? item?.id ?? item?.service_id, `items[${index}].product_id`),
        units: decimal(item?.units, `items[${index}].units`, true),
        unit_value: money(decimal(item?.unit_value, `items[${index}].unit_value`)),
        description: item?.sell_desc ?? item?.description ?? ''
    }));
}

/**
 * paramDoc: company_id, store_id, thirdParty_id, created_by, description, attached e
 * instancias opcionales. El manejo de items depende del modo:
 *  - Presets: items [{ id|preset_id, units }] + componentValues { [product_id]: unit_value }.
 *    Los precios salen del config; los presets se expanden en sus productos-componente.
 *  - Products: items [{ product_id|id, units, unit_value, sell_desc }] SIN componentValues.
 *    El valor unitario lo trae cada ítem desde el formulario.
 * En ambos casos los valores son por unidad de producto. No se infieren precios ni impuestos.
 */
export function createNexo360Service({ withTransaction, registerDocument, registerPurchaseItems, linkDocumentInstances, advanceProcessInstance, createProcessInstance }) {
    async function transformPresets(presets, { company_id, client } = {}) {
        const companyId = id(company_id, 'company_id');
        const normalized = normalizePresets(presets);
        const transform = async connection => {
            const result = await connection.query(`
                SELECT preset.id AS preset_id, relation.product_id, relation.units,
                    product.id AS available_product_id
                FROM "Inventory".presets preset
                LEFT JOIN "Inventory"."presetsProductRelations" relation ON relation.preset_id = preset.id
                LEFT JOIN "Inventory"."products&services" product
                    ON product.id = relation.product_id AND product.company_id = preset.company_id
                    AND product.status = 'active'
                WHERE preset.company_id = $1 AND preset.id = ANY($2::bigint[]) AND preset.is_active = true;
            `, [companyId, [...new Set(normalized.map(preset => preset.id))]]);
            return normalized.flatMap(preset => {
                const components = result.rows.filter(row => String(row.preset_id) === preset.id);
                if (!components.length || components.some(row => !row.available_product_id)) {
                    fail(`El preset ${preset.id} no está disponible, está vacío o contiene productos no disponibles para la compañía.`, 422);
                }
                return components.map(component => ({
                    preset_id: preset.id, product_id: String(component.product_id), service_id: String(component.product_id),
                    units: decimal(Number(component.units) * preset.units, 'Cantidad resultante', true),
                    description: preset.description
                }));
            });
        };
        return client ? transform(client) : withTransaction(transform);
    }

    async function generateClientOrder(paramDoc, options = {}) {
        if (!paramDoc || typeof paramDoc !== 'object' || Array.isArray(paramDoc)) fail('paramDoc debe ser un objeto.');
        const info = {
            company_id: id(paramDoc.company_id, 'company_id'), store_id: id(paramDoc.store_id, 'store_id'),
            thirdParty_id: id(paramDoc.thirdParty_id, 'thirdParty_id'), created_by: id(paramDoc.created_by, 'created_by'),
            doc_type: 'Client Order', status: 'active', description: paramDoc.description ?? '', attached: paramDoc.attached ?? []
        };
        const componentValues = paramDoc.componentValues;
        // El config decide el modo: con componentValues -> presets (precios del config);
        // sin componentValues -> products (el ítem ya trae su unit_value del formulario).
        const usePresets = componentValues != null && typeof componentValues === 'object' && !Array.isArray(componentValues);
        const presets = usePresets ? normalizePresets(paramDoc.items) : null;
        const productItems = usePresets ? null : normalizeProducts(paramDoc.items);
        const requestedInstances = Array.isArray(paramDoc.instances) && paramDoc.instances.length
            ? paramDoc.instances
            : paramDoc.instance_id == null || paramDoc.instance_id === '' ? [] : [paramDoc.instance_id];
        const instanceIds = [...new Set(requestedInstances.map(instance => id(
            typeof instance === 'object' && instance !== null ? instance.instance_id ?? instance.id : instance, 'instance_id'
        )))];

        const execute = async client => {
            const scope = await client.query(`
                SELECT
                    EXISTS (SELECT 1 FROM "Ecosystem".stores WHERE company_id = $1 AND id = $2) AS store_ok,
                    EXISTS (SELECT 1 FROM "Ecosystem".thirdparties WHERE company_id = $1 AND id = $3) AS third_party_ok,
                    EXISTS (SELECT 1 FROM "Ecosystem".users WHERE company_id = $1 AND user_id = $4 AND status = 'active') AS user_ok;
            `, [info.company_id, info.store_id, info.thirdParty_id, info.created_by]);
            const availability = scope.rows[0];
            if (!availability?.store_ok || !availability.third_party_ok || !availability.user_ok) {
                fail('La tienda, el tercero o el usuario no están disponibles para la compañía.', 422);
            }
            info.instances = [];
            if (instanceIds.length) {
                const instances = await client.query(`
                    SELECT id, step_id, "thirdParty_id" FROM "Process".process_instance
                    WHERE company_id = $1 AND id = ANY($2::bigint[]) AND status = 'active' FOR SHARE;
                `, [info.company_id, instanceIds]);
                info.instances = instanceIds.map(instanceId => {
                    const instance = instances.rows.find(row => String(row.id) === instanceId);
                    if (!instance || String(instance.thirdParty_id) !== info.thirdParty_id || !instance.step_id) {
                        fail(`La instancia ${instanceId} no está disponible para este cliente y compañía.`, 422);
                    }
                    return { instance_id: instanceId, step_id: instance.step_id };
                });
            }
            info.instance_id = info.instances[0]?.instance_id;
            info.step_id = info.instances[0]?.step_id;
            if (usePresets) {
                const components = await transformPresets(presets, { company_id: info.company_id, client });
                info.items = components.map(component => {
                    const value = Object.hasOwn(componentValues, component.product_id) ? componentValues[component.product_id] : undefined;
                    const unit_value = money(decimal(value, `componentValues[${component.product_id}]`));
                    return { ...component, unit_value, total: money(component.units * unit_value) };
                });
            } else {
                // Modo products: validar existencia/estado de cada producto en la compañía,
                // igual que transformPresets lo garantiza para los componentes de un preset.
                const productIds = [...new Set(productItems.map(item => item.product_id))];
                const available = await client.query(`
                    SELECT id FROM "Inventory"."products&services"
                    WHERE company_id = $1 AND id = ANY($2::bigint[]) AND status = 'active';
                `, [info.company_id, productIds]);
                const availableIds = new Set(available.rows.map(row => String(row.id)));
                const missing = productIds.filter(productId => !availableIds.has(productId));
                if (missing.length) fail(`Productos no disponibles para la compañía: ${missing.join(', ')}.`, 422);
                info.items = productItems.map(item => ({
                    product_id: item.product_id, service_id: item.product_id,
                    units: item.units, unit_value: item.unit_value,
                    total: money(item.units * item.unit_value), description: item.description
                }));
            }
            info.subTotal = money(info.items.reduce((sum, item) => sum + item.total, 0));
            info.total = info.subTotal;
            // Rechaza diferencias: evita perder impuestos u otros importes aún no traducidos.
            for (const field of ['subTotal', 'total']) {
                if (paramDoc[field] !== undefined && money(decimal(paramDoc[field], field)) !== info[field]) {
                    fail(`${field} no coincide con los importes de los productos del preset.`);
                }
            }
            const document = await registerDocument(info, { client, includeProcessFields: true });
            if (!document?.id) throw new Error('No se pudo registrar la orden de cliente.');
            const itemsResult = await registerPurchaseItems(info, document.id, { client });
            if (itemsResult?.status !== 'OK') throw new Error('No se pudieron registrar todos los ítems.');
            const processResult = await linkDocumentInstances(document.id, info, { client });
            if (processResult?.status === 'Error') throw new Error('No se pudieron vincular los procesos.');
            return {
                status: 'OK', id: document.id, doc_id: document.id, ownSerial: document.ownSerial,
                total: info.total, items: info.items,
                steps: [
                    { name: 'registerDocument', status: 'OK', id: document.id },
                    { ...itemsResult, name: 'registerServiceMovements' },
                    { ...processResult, name: 'linkDocumentInstances' }
                ]
            };
        };
        return options.client ? execute(options.client) : withTransaction(execute);
    }

    async function createCaralNexo360Order({ payload, context, doc_id }, { client }) {
        const values = payload.values;
        let orderContext = context;
        if (context.instance_id) {
            const progress = await advanceProcessInstance(client, {
                company_id: context.company_id, instance_id: context.instance_id,
                previous_step: context.step_id, user_id: context.created_by,
                // Avance del sistema para crear la orden: no se valida el rol del responsable.
                bypassRoll: true,
                description: `ParamDoc #${doc_id} registrado; avance para crear Client Order.`
            });
            if (!progress.success) fail(progress.message ?? 'No hay una etapa siguiente para crear la orden.', 422);
            const stepId = id(progress.nextStepId, 'step_instance');
            orderContext = { ...context, step_id: stepId,
                instances: [{ instance_id: context.instance_id, step_id: stepId }] };
        }
        const order = await generateClientOrder({
            ...values,
            ...orderContext,
            items: values.items,
            componentValues: context.componentValues,
            attached: values.artworkFiles ?? [],
            description: values.description ?? ''
        }, { client });
        // Los subprocesos ya NO se crean al generar la Client Order. La orden queda
        // ligada a su proceso padre (en generateClientOrder) y los subprocesos se
        // crean después, durante la asignación a proveedores (supplierDelegationService).
        const subprocess = null;
        await client.query(`
            INSERT INTO "Ecosystem".documents_group (main_doc_id, doc_id)
            VALUES ($1, $2);
        `, [doc_id, order.id]);
        return { ...order, instance_id: orderContext.instance_id ?? null, step_instance: orderContext.step_id ?? null, subprocess };
    }
    return { generateClientOrder, transformPresets, createCaralNexo360Order };
}

export default createNexo360Service;
