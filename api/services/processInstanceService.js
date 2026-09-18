const fail = (message, statusCode) => { throw Object.assign(new Error(message), { statusCode }); };

// Un request proviene de un acceso externo (portal) si lo marca explícitamente o
// si trae las llaves del acceso.
export function isExternalAccess(info = {}) {
    return Boolean(info.external_access) || info.company_key !== undefined || info.access_key !== undefined;
}

// Resuelve el usuario interno (responsable) de un acceso externo validado por
// company_key + access_key. Un tercero no puede ser autor de historial/responsable,
// por eso se usa el responsable interno configurado en el acceso.
// `query(sql, params)` debe devolver un arreglo de filas.
export async function resolveExternalAccessUser(query, info = {}) {
    if (typeof info.company_key !== 'string' || !info.company_key.trim()
        || typeof info.access_key !== 'string' || !info.access_key.trim()) {
        fail('La compañía y la clave de acceso externo son obligatorias.', 401);
    }
    const rows = await query(`
        SELECT a.company_id, a.responsable, u.user_id AS internal_user_id
        FROM "Ecosystem"."externalThirdPatiesAccess" a
        JOIN "Ecosystem".companies c ON c.company_id = a.company_id
        LEFT JOIN "Ecosystem".users u ON u.user_id = a.responsable
            AND u.company_id = a.company_id AND u.status = 'active'
        WHERE c.company_key = $1 AND a."accesKey"::text = $2 AND a.enabled = true
            AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
        FOR SHARE OF a;
    `, [info.company_key, info.access_key]);
    const access = rows[0];
    if (!access) fail('Acceso externo no válido o vencido.', 401);
    if (!access.internal_user_id) fail('El acceso externo necesita un responsable interno activo de la misma compañía.', 422);
    return { company_id: access.company_id, user_id: access.responsable };
}

// Recibe el cliente de la transacción del llamador; nunca abre otra conexión.
export async function createProcessInstance(client, info) {
    if (isExternalAccess(info)) {
        const resolved = await resolveExternalAccessUser(
            (sql, params) => client.query(sql, params).then(result => result.rows),
            info
        );
        const scope = await client.query(`
            SELECT p.id FROM "Process".processes p
            JOIN "Process".process_steps s ON s.process_id = p.id
            WHERE p.company_id = $1 AND p.id = $2 AND s.id = $3
              AND ($4::bigint IS NULL OR EXISTS (
                SELECT 1 FROM "Ecosystem".thirdparties t WHERE t.company_id = p.company_id AND t.id = $4
              ));
        `, [resolved.company_id, info.process_id, info.step_id, info.thirdParty_id || null]);
        if (!scope.rows.length) fail('El proceso, la etapa o el tercero no pertenecen a la compañía.', 422);
        // Tanto responsable como el autor del historial requieren un usuario interno.
        info = { ...info, company_id: resolved.company_id, user_id: resolved.user_id };
    }
    const result = await client.query(`
        INSERT INTO "Process".process_instance (
            company_id, process_id, step_id, status, parent_id, parent_step,
            start_date, "delivery_date", "thirdParty_id", responsable, name, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
            CURRENT_TIMESTAMP AT TIME ZONE 'UTC', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
        RETURNING id, "ownSerial", created_at AT TIME ZONE 'UTC' AS created_at
    `, [info.company_id, info.process_id, info.step_id, info.status,
        info.parent_id ?? null, info.parent_step ?? null, info.start_date ?? null,
        info.delivery_date ?? null, info.thirdParty_id ?? null, info.user_id,
        info.name ?? null]);
    const instance = result.rows[0];
    await client.query(`
        INSERT INTO "Process".process_historial (
            company_id, instance_id, previous_step, next_step, user_id, created_at, description
        ) VALUES ($1,$2,$3,$3,$4,$5::timestamptz AT TIME ZONE 'UTC',$6)
    `, [info.company_id, instance.id, info.step_id, info.user_id,
        instance.created_at, 'Creación de instancia de proceso']);
    return instance;
}

// Evidencias del portal: la identidad siempre procede del acceso externo vigente.
export function createProcessEvidenceService({ withTransaction, registerDocument, linkDocumentInstances }) {
    const validId = value => (typeof value !== 'number' || Number.isSafeInteger(value))
        && /^[1-9]\d*$/.test(String(value)) && BigInt(value) <= 9223372036854775807n;
    async function access(client, info) {
        if (typeof info.company_key !== 'string' || typeof info.access_key !== 'string'
            || !info.company_key.trim() || !info.access_key.trim()) fail('Acceso externo requerido.', 401);
        const result = await client.query(`
            SELECT a.company_id, a."thirdParty_id", a.responsable
            FROM "Ecosystem"."externalThirdPatiesAccess" a
            JOIN "Ecosystem".companies c ON c.company_id = a.company_id
            JOIN "Ecosystem".users u ON u.company_id = a.company_id
                AND u.user_id = a.responsable AND u.status = 'active'
            WHERE c.company_key = $1 AND a."accesKey"::text = $2 AND a.enabled = true
                AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
            FOR SHARE OF a, u;
        `, [info.company_key, info.access_key]);
        if (!result.rows[0]) fail('Acceso externo no válido o sin responsable activo.', 401);
        return result.rows[0];
    }
    // Tiendas permitidas para el responsable del acceso, según su rol:
    // roles.config.access.stores = { overAll: bool, enabled: [store_id...] }.
    async function storePermissions(client, actor) {
        const roleRow = (await client.query(`
            SELECT r.config->'access'->'stores' AS stores_access
            FROM "Ecosystem".users_config uc
            JOIN "Ecosystem".roles r ON r.id = uc.role AND r.company_id = uc.company_id
            WHERE uc.user_id = $1 AND uc.company_id = $2
            LIMIT 1;
        `, [actor.responsable, actor.company_id])).rows[0];
        const storesAccess = roleRow?.stores_access ?? null;
        const overAll = !storesAccess || storesAccess.overAll === true;
        const enabled = Array.isArray(storesAccess?.enabled) ? storesAccess.enabled.map(String) : [];
        return { overAll, enabled };
    }
    return {
        async options(info = {}) {
            return withTransaction(async client => {
                const actor = await access(client, info);
                const instances = await client.query(`
                    SELECT pi.id, pi."ownSerial", pi.step_id, p.name AS process_name, s.name AS step_name
                    FROM "Process".process_instance pi
                    JOIN "Process".processes p ON p.id = pi.process_id AND p.company_id = pi.company_id
                    JOIN "Process".process_steps s ON s.id = pi.step_id AND s.process_id = pi.process_id
                        AND s.company_id = pi.company_id
                    WHERE pi.company_id = $1 AND pi."thirdParty_id" = $2 AND pi.status = 'active'
                    ORDER BY pi.id DESC;
                `, [actor.company_id, actor.thirdParty_id]);
                const { overAll, enabled } = await storePermissions(client, actor);
                const stores = await client.query(`
                    SELECT id, name FROM "Ecosystem".stores
                    WHERE company_id = $1 AND ($2::boolean IS TRUE OR id = ANY($3::bigint[]))
                    ORDER BY name, id;
                `, [actor.company_id, overAll, enabled]);
                return { instances: instances.rows, stores: stores.rows };
            });
        },
        async register(info = {}) {
            if (![info.instance_id, info.store_id, info.step_id].every(validId)) fail('Selecciona una instancia, etapa y tienda válidas.', 400);
            const description = typeof info.description === 'string' ? info.description.trim() : '';
            const attached = info.attached ?? [];
            if (!Array.isArray(attached) || attached.length > 50 || attached.some(file => !file || !validId(file.id))) fail('Los adjuntos deben ser archivos registrados.', 400);
            if (!description && !attached.length) fail('Escribe una descripción o adjunta al menos un archivo.', 400);
            return withTransaction(async client => {
                const actor = await access(client, info);
                const instance = (await client.query(`
                    SELECT id, step_id FROM "Process".process_instance
                    WHERE company_id = $1 AND id = $2 AND "thirdParty_id" = $3 AND status = 'active'
                    FOR UPDATE;
                `, [actor.company_id, info.instance_id, actor.thirdParty_id])).rows[0];
                if (!instance) fail('La instancia no está disponible para este acceso.', 403);
                if (String(instance.step_id) !== String(info.step_id)) fail('La etapa cambió. Actualiza los procesos antes de enviar.', 409);
                const { overAll, enabled } = await storePermissions(client, actor);
                const store = await client.query(`
                    SELECT id FROM "Ecosystem".stores
                    WHERE company_id = $1 AND id = $2 AND ($3::boolean IS TRUE OR id = ANY($4::bigint[]));
                `, [actor.company_id, info.store_id, overAll, enabled]);
                if (!store.rows.length) fail('La tienda no está permitida para este acceso.', 403);
                const fileIds = [...new Set(attached.map(file => String(file.id)))];
                let files = [];
                if (fileIds.length) {
                    const result = await client.query(`
                        SELECT id, url FROM "Ecosystem".attached
                        WHERE company_id = $1 AND uploaded_by = $2 AND id = ANY($3::bigint[]) FOR SHARE;
                    `, [actor.company_id, actor.responsable, fileIds]);
                    if (result.rows.length !== fileIds.length) fail('Hay adjuntos no disponibles para este responsable.', 403);
                    files = fileIds.map(fileId => result.rows.find(file => String(file.id) === fileId));
                }
                const documentInfo = {
                    company_id: actor.company_id, store_id: info.store_id, thirdParty_id: actor.thirdParty_id,
                    created_by: actor.responsable, doc_type: 'Process Voucher', status: 'active',
                    subTotal: 0, total: 0, description, attached: files,
                    instance_id: instance.id, step_id: instance.step_id
                };
                const document = await registerDocument(documentInfo, { client, includeProcessFields: true });
                if (!document?.id) throw new Error('No se pudo registrar la evidencia.');
                const link = await linkDocumentInstances(document.id, documentInfo, { client });
                if (link?.status !== 'OK') throw new Error('No se pudo vincular la evidencia al proceso.');
                return { ...document, instance_id: instance.id, step_instance: instance.step_id };
            });
        }
    };
}
