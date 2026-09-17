function fail(message, statusCode = 400) {
    throw Object.assign(new Error(message), { statusCode });
}

function id(value, field) {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) fail(`${field} no es válido.`);
    if (!/^[1-9]\d*$/.test(String(value)) || BigInt(value) > 9223372036854775807n) fail(`${field} no es válido.`);
    return String(value);
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateParameterPayload(payload, config) {
    if (!isObject(payload) || payload.schemaVersion !== 1 || !isObject(payload.values)) {
        fail('El payload debe contener schemaVersion: 1 y un objeto values.');
    }
    if (Object.keys(payload).some(key => !['schemaVersion', 'paramdoc_id', 'paramDoc_id', 'destiny', 'values'].includes(key))) {
        fail('El payload contiene propiedades no admitidas.');
    }
    id(payload.paramdoc_id, 'paramdoc_id');
    if (payload.paramDoc_id !== undefined && id(payload.paramDoc_id, 'paramDoc_id') !== id(payload.paramdoc_id, 'paramdoc_id')) {
        fail('paramDoc_id y paramdoc_id deben identificar la misma plantilla.');
    }
    if (!config.destiny || payload.destiny !== config.destiny) fail('El destino no corresponde a la plantilla autorizada.', 403);
    if (!Array.isArray(config.fields)) fail('La plantilla no tiene fields configurados.', 422);
    for (const field of config.fields) {
        const rules = { ...config.fieldDefaults, ...field };
        if (rules.visible === false || rules.disabled || rules.readOnly) continue;
        const special = field.specialProps ?? field.propEspecial ?? {};
        const key = special.blockKey ?? special.collectionKey ?? field.key;
        const value = payload.values[key];
        const empty = value == null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length);
        if (rules.required && empty) fail(`El campo ${field.title ?? key} es obligatorio.`);
        if (empty) continue;
        if (field.type === 'array' && !Array.isArray(value)) fail(`${key} debe ser un arreglo.`);
        if (['number', 'integer'].includes(field.type)) {
            const number = Number(value);
            if (!['string', 'number'].includes(typeof value) || !Number.isFinite(number)
                || (field.type === 'integer' && !Number.isInteger(number))
                || (field.props?.min != null && number < Number(field.props.min))
                || (field.props?.max != null && number > Number(field.props.max))) fail(`${key} no es un número válido.`);
        }
    }
    return payload;
}

// El destino se resuelve en una lista explícita, nunca como ruta/import suministrado por el portal.
export function createParameterDocumentService({ withTransaction, registerDocument, linkDocumentInstances, actions }) {
    return {
        async register(request) {
            const companyKey = request?.company_key;
            const accessKey = request?.access_key;
            if (typeof companyKey !== 'string' || !companyKey.trim() || typeof accessKey !== 'string' || !accessKey.trim()) {
                fail('La compañía y la clave de acceso son obligatorias.', 401);
            }
            const payload = request.payload;
            const templateId = id(payload?.paramdoc_id, 'paramdoc_id');
            const supplied = value => value !== undefined && value !== null && value !== '';
            const instanceId = supplied(request.instance_id) ? id(request.instance_id, 'instance_id') : undefined;
            const steps = ['step_instance', 'step_id'].filter(key => supplied(request[key])).map(key => id(request[key], key));
            if (new Set(steps).size > 1) fail('step_instance y step_id deben identificar la misma etapa.');
            if (steps.length && !instanceId) fail('La etapa requiere un instance_id.');
            const primary = await withTransaction(async client => {
                const accessResult = await client.query(`
                    SELECT a.company_id, a."thirdParty_id"
                    FROM "Ecosystem"."externalThirdPatiesAccess" a
                    JOIN "Ecosystem".companies c ON c.company_id = a.company_id
                    WHERE c.company_key = $1 AND a."accesKey"::text = $2 AND a.enabled = true
                      AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
                    FOR SHARE OF a;
                `, [companyKey, accessKey]);
                const access = accessResult.rows[0];
                if (!access) fail('Acceso externo no válido o vencido.', 401);
                const templateResult = await client.query(`
                    SELECT d.config FROM "Custom"."externalDocParameters" d
                    WHERE d.id = $1 AND (d.company_id = $2 OR d.company_id = 0)
                      AND (d."thirdParty_id" = $3 OR d."thirdParty_id" IS NULL OR d."thirdParty_id" = 0)
                    FOR SHARE;
                `, [templateId, access.company_id, access.thirdParty_id]);
                if (!templateResult.rows[0]) fail('Documento parametrizado no autorizado.', 403);
                const rawConfig = templateResult.rows[0].config;
                const config = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
                if (!isObject(config)) fail('La plantilla no está configurada.', 422);
                validateParameterPayload(payload, config);
                const submittingThirdPartyId = id(access.thirdParty_id, 'thirdParty_id');
                if (payload.values.thirdParty_id !== undefined
                    && id(payload.values.thirdParty_id, 'thirdParty_id') !== submittingThirdPartyId) {
                    fail('thirdParty_id debe corresponder al tercero del acceso externo.', 403);
                }
                const action = Object.hasOwn(actions, config.destiny) ? actions[config.destiny] : undefined;
                if (typeof action !== 'function') fail('El flujo personalizado no está implementado.', 422);

                // IDs internos y precios proceden de la plantilla del servidor, no del acceso externo.
                const execution = config.execution ?? {};
                const context = {
                    company_id: id(access.company_id, 'company_id'),
                    store_id: id(execution.store_id, 'config.execution.store_id'),
                    created_by: id(execution.created_by, 'config.execution.created_by'),
                    thirdParty_id: id(payload.values.clientId ?? access.thirdParty_id, 'clientId'),
                    componentValues: execution.componentValues,
                    // Solo el contexto validado puede vincular documentos; no payload.values.
                    instance_id: undefined, step_id: undefined, instances: []
                };
                const allowedClients = Array.isArray(execution.allowedClientIds)
                    ? execution.allowedClientIds.map(String) : [String(access.thirdParty_id)];
                if (!allowedClients.includes(context.thirdParty_id)) fail('Cliente no autorizado para esta plantilla.', 403);
                const scopeResult = await client.query(`
                    SELECT
                      EXISTS (SELECT 1 FROM "Ecosystem".stores WHERE company_id = $1 AND id = $2) AS store_ok,
                      EXISTS (SELECT 1 FROM "Ecosystem".users WHERE company_id = $1 AND user_id = $3 AND status = 'active') AS user_ok,
                      EXISTS (SELECT 1 FROM "Ecosystem".thirdparties WHERE company_id = $1 AND id = $4) AS client_ok;
                `, [context.company_id, context.store_id, context.created_by, context.thirdParty_id]);
                const scope = scopeResult.rows[0];
                if (!scope?.store_ok || !scope.user_ok || !scope.client_ok) fail('La configuración referencia una tienda, usuario o cliente no disponible para la compañía.', 422);
                if (instanceId) {
                    const instanceResult = await client.query(`
                        SELECT id, step_id, "thirdParty_id"
                        FROM "Process".process_instance
                        WHERE company_id = $1 AND id = $2 AND status = 'active'
                        FOR SHARE;
                    `, [context.company_id, instanceId]);
                    const instance = instanceResult.rows[0];
                    if (!instance || String(instance.thirdParty_id) !== context.thirdParty_id || !instance.step_id) {
                        fail('La instancia no está activa o no pertenece a esta compañía y cliente.', 422);
                    }
                    const stepId = id(instance.step_id, 'step_instance');
                    if (steps.length && steps[0] !== stepId) fail('La etapa de la instancia cambió. Actualiza el formulario antes de enviar.', 409);
                    context.instance_id = instanceId;
                    context.step_id = stepId;
                    context.instances = [{ instance_id: instanceId, step_id: stepId }];
                }
                const document = await registerDocument({
                    ...context,
                    thirdParty_id: submittingThirdPartyId,
                    doc_type: 'JSON Parametrization', status: 'active', subTotal: 0, total: 0,
                    description: payload.values.description ?? '', attached: payload.values.artworkFiles ?? [],
                    specialConfig: payload
                }, { client, includeProcessFields: true });
                if (!document?.id) throw new Error('No se pudo registrar la parametrización.');
                if (context.instances.length) {
                    const link = await linkDocumentInstances(document.id, context, { client });
                    if (link?.status !== 'OK') throw new Error('No se pudo relacionar la parametrización con el proceso.');
                }
                return { document, context, action, destiny: config.destiny };
            });
            // El principal y su vínculo ya están confirmados antes de iniciar la orden.
            const { document, context, action, destiny } = primary;
            const primaryResult = {
                id: document.id, doc_id: document.id, ownSerial: document.ownSerial,
                paramDoc_id: templateId, instance_id: context.instance_id ?? null,
                step_instance: context.step_id ?? null, document_type: 'JSON Parametrization', destiny
            };
            try {
                const secondary = await withTransaction(async client => {
                    // El bloqueo anterior terminó con el primer COMMIT: comprobar la etapa otra vez.
                    if (context.instance_id) {
                        const result = await client.query(`
                            SELECT id, step_id, "thirdParty_id" FROM "Process".process_instance
                            WHERE company_id = $1 AND id = $2 AND status = 'active'
                            FOR UPDATE;
                        `, [context.company_id, context.instance_id]);
                        const instance = result.rows[0];
                        if (!instance || String(instance.step_id) !== context.step_id
                            || String(instance.thirdParty_id) !== context.thirdParty_id) {
                            fail('La instancia o su etapa cambió después de guardar el documento principal.', 409);
                        }
                    }
                    const result = await action({ payload, context, doc_id: document.id }, { client });
                    if (!result?.id) throw new Error('El flujo no devolvió el documento secundario.');
                    return result;
                });
                return { status: 'OK', ...primaryResult, secondary_doc_id: secondary.id, secondary };
            } catch (error) {
                error.primaryDocument = { ...primaryResult, secondary_doc_id: null, secondary_status: 'ERROR' };
                throw error;
            }
        }
    };
}
