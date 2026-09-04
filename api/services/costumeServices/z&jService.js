
import crypto from 'crypto';
import { useDataBase, withTransaction } from '../../app.js';

const zjService = {};

const THIRD_PARTY_TYPES = new Set([
    'client',
    'supplier',
    'employee',
    'contractor',
    'partner',
    'other',
    'both'
]);

const normalizePositiveInteger = (value, fallback, maximum = null) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return maximum ? Math.min(parsed, maximum) : parsed;
};

const normalizeTypes = (type) => {
    if (type === undefined || type === null || type === '') {
        return ['client', 'both'];
    }

    const requestedTypes = (Array.isArray(type) ? type : String(type).split(','))
        .map(value => String(value).trim().toLowerCase())
        .filter(Boolean);

    if (
        requestedTypes.length === 0 ||
        requestedTypes.some(value => !THIRD_PARTY_TYPES.has(value))
    ) {
        const error = new Error('El tipo de tercero solicitado no es válido.');
        error.statusCode = 400;
        error.code = 'INVALID_THIRD_PARTY_TYPE';
        throw error;
    }

    return [...new Set(requestedTypes)];
};

const escapeLikePattern = (value) => (
    String(value).replace(/[\\%_]/g, character => `\\${character}`)
);

const ensureDatabaseResult = (result) => {
    if (!result[0] && result[1] instanceof Error) throw result[1];
    return result[0] ? result[1] : [];
};

const createRequestError = (message, statusCode, code) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
};

const normalizeRequiredId = (value, field, code) => {
    const normalized = normalizePositiveInteger(value, null);
    if (!normalized) {
        throw createRequestError(`El campo ${field} no es válido.`, 400, code);
    }
    return normalized;
};

const normalizeDate = (value, { field, required = false, fallback = null }) => {
    if (value === undefined || value === null || value === '') {
        if (required) {
            throw createRequestError(`El campo ${field} es requerido.`, 400, 'MISSING_REQUIRED_FIELD');
        }
        return fallback;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw createRequestError(
            `El campo ${field} debe ser una fecha ISO 8601 válida.`,
            400,
            'INVALID_DATE'
        );
    }
    return date;
};

const sortJsonValue = (value) => {
    if (Array.isArray(value)) return value.map(sortJsonValue);
    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((result, key) => {
                result[key] = sortJsonValue(value[key]);
                return result;
            }, {});
    }
    return value;
};

const createPayloadHash = (payload) => (
    crypto
        .createHash('sha256')
        .update(JSON.stringify(sortJsonValue(payload)))
        .digest('hex')
);

const MONEY_DECIMALS = 6;
const MONEY_SCALE = 10n ** BigInt(MONEY_DECIMALS);

const normalizeMoney = (value, field) => {
    const text = String(value ?? '').trim();
    if (!/^\d+(\.\d{1,6})?$/.test(text)) {
        throw createRequestError(
            `${field} debe ser un valor monetario positivo con máximo 6 decimales.`,
            400,
            'INVALID_MONEY_VALUE'
        );
    }

    const [integerPart, decimalPart = ''] = text.split('.');
    const scaled = (BigInt(integerPart) * MONEY_SCALE)
        + BigInt(decimalPart.padEnd(MONEY_DECIMALS, '0'));
    if (scaled <= 0n || scaled > 999999999999999999999999n) {
        throw createRequestError(
            `${field} está fuera del rango permitido.`,
            400,
            'INVALID_MONEY_VALUE'
        );
    }

    return {
        scaled,
        value: `${integerPart}.${decimalPart.padEnd(MONEY_DECIMALS, '0')}`
    };
};

const formatScaledMoney = (scaled) => {
    const integerPart = scaled / MONEY_SCALE;
    const decimalPart = String(scaled % MONEY_SCALE).padStart(MONEY_DECIMALS, '0');
    return `${integerPart}.${decimalPart}`;
};

zjService.handshake = async ({ companyId, serviceUserId }) => {
    const normalizedCompanyId = normalizePositiveInteger(companyId, null);
    const normalizedServiceUserId = normalizePositiveInteger(serviceUserId, null);
    if (!normalizedCompanyId) throw new Error('companyId autenticado es requerido.');

    const result = await useDataBase(`
        SELECT
            company.company_id,
            company.legal_name,
            company.trade_name,
            technical_user.user_id AS service_user_id,
            technical_user.user_name AS service_user_name,
            technical_user.status AS service_user_status,
            now() AS database_time
        FROM "Ecosystem".companies company
        LEFT JOIN "Ecosystem".users technical_user
            ON technical_user.user_id = $2
           AND technical_user.company_id = company.company_id
        WHERE company.company_id = $1
        LIMIT 1;
    `, [normalizedCompanyId, normalizedServiceUserId], 1);

    const context = ensureDatabaseResult(result)[0];
    if (!context) {
        const error = new Error('La compañía asociada a la integración no está disponible.');
        error.statusCode = 503;
        error.code = 'INTEGRATION_COMPANY_UNAVAILABLE';
        throw error;
    }

    if (
        normalizedServiceUserId &&
        (
            Number(context.service_user_id) !== normalizedServiceUserId ||
            context.service_user_status !== 'active'
        )
    ) {
        const error = new Error('El usuario técnico de la integración no está disponible.');
        error.statusCode = 503;
        error.code = 'INTEGRATION_SERVICE_USER_UNAVAILABLE';
        throw error;
    }

    return context;
};

/**
 * Lista únicamente terceros disponibles de la compañía autenticada.
 *
 * Para una integración de pedidos se consideran clientes los registros con
 * type=client o type=both. El filtro puede cambiarse explícitamente, pero nunca
 * puede cambiarse companyId desde la petición HTTP.
 */
zjService.getThirdParties = async ({
    companyId,
    search,
    type,
    page = 1,
    limit = 50
}) => {
    const normalizedCompanyId = normalizePositiveInteger(companyId, null);
    if (!normalizedCompanyId) throw new Error('companyId autenticado es requerido.');

    const normalizedPage = normalizePositiveInteger(page, 1);
    const normalizedLimit = normalizePositiveInteger(limit, 50, 100);
    const offset = (normalizedPage - 1) * normalizedLimit;
    const types = normalizeTypes(type);
    const values = [normalizedCompanyId, types];
    const whereClauses = [
        'tp.company_id = $1',
        'tp.type::text = ANY($2::text[])',
        `EXISTS (
            SELECT 1
            FROM "Ecosystem"."thirdPartyComercialInfo" commercial
            WHERE commercial."thirdParty_id" = tp.id
              AND commercial.company_id = tp.company_id
              AND commercial.comercial_state = 'active'
        )`
    ];

    const normalizedSearch = typeof search === 'string' ? search.trim() : '';
    if (normalizedSearch) {
        values.push(`%${escapeLikePattern(normalizedSearch)}%`);
        const searchParameter = `$${values.length}`;
        whereClauses.push(`(
            tp.names ILIKE ${searchParameter} ESCAPE '\\'
            OR tp."lastNames" ILIKE ${searchParameter} ESCAPE '\\'
            OR CONCAT_WS(' ', tp.names, tp."lastNames") ILIKE ${searchParameter} ESCAPE '\\'
            OR tp.indentification_number ILIKE ${searchParameter} ESCAPE '\\'
            OR tp.mail ILIKE ${searchParameter} ESCAPE '\\'
            OR COALESCE(tp.phone, '') ILIKE ${searchParameter} ESCAPE '\\'
        )`);
    }

    values.push(normalizedLimit);
    const limitParameter = `$${values.length}`;
    values.push(offset);
    const offsetParameter = `$${values.length}`;

    const result = await useDataBase(`
        SELECT
            tp.id,
            tp.names,
            tp."lastNames",
            CONCAT_WS(' ', tp.names, tp."lastNames") AS full_name,
            tp.indentification_type,
            tp.indentification_number,
            tp.mail,
            tp.phone,
            tp.city,
            tp.address,
            tp.type,
            COUNT(*) OVER()::integer AS total_count
        FROM "Ecosystem".thirdparties tp
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY tp.names ASC, tp."lastNames" ASC, tp.id ASC
        LIMIT ${limitParameter}
        OFFSET ${offsetParameter};
    `, values, 1);

    const rows = ensureDatabaseResult(result);
    const total = rows[0]?.total_count ?? 0;
    const data = rows.map(({ total_count, ...thirdParty }) => thirdParty);

    return {
        data,
        pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total,
            total_pages: total === 0 ? 0 : Math.ceil(total / normalizedLimit)
        }
    };
};

/**
 * Busca terceros activos mediante filtros explícitos. `corporative_name` se
 * consulta sobre `names`, que es donde el modelo legacy almacena la razón
 * social de las personas jurídicas.
 */
zjService.searchThirdParties = async ({
    companyId,
    names,
    lastNames,
    corporativeName,
    email,
    nit,
    type,
    page = 1,
    limit = 50
}) => {
    const normalizedCompanyId = normalizePositiveInteger(companyId, null);
    if (!normalizedCompanyId) throw new Error('companyId autenticado es requerido.');

    const filters = {
        names: typeof names === 'string' ? names.trim() : '',
        lastNames: typeof lastNames === 'string' ? lastNames.trim() : '',
        corporativeName: typeof corporativeName === 'string' ? corporativeName.trim() : '',
        email: typeof email === 'string' ? email.trim() : '',
        nit: typeof nit === 'string' ? nit.trim() : ''
    };
    if (!Object.values(filters).some(Boolean)) {
        throw createRequestError(
            'Debe enviar al menos uno de estos filtros: names, lastNames, corporative_name, email o nit.',
            400,
            'MISSING_THIRD_PARTY_SEARCH_FILTER'
        );
    }
    if (Object.values(filters).some(value => value.length > 200)) {
        throw createRequestError(
            'Los filtros de búsqueda no pueden superar 200 caracteres.',
            400,
            'INVALID_THIRD_PARTY_SEARCH_FILTER'
        );
    }

    const normalizedPage = normalizePositiveInteger(page, 1);
    const normalizedLimit = normalizePositiveInteger(limit, 50, 100);
    const types = normalizeTypes(type);
    const values = [normalizedCompanyId, types];
    const whereClauses = [
        'tp.company_id = $1',
        'tp.type::text = ANY($2::text[])',
        `EXISTS (
            SELECT 1
            FROM "Ecosystem"."thirdPartyComercialInfo" commercial
            WHERE commercial."thirdParty_id" = tp.id
              AND commercial.company_id = tp.company_id
              AND commercial.comercial_state = 'active'
        )`
    ];

    const addPartialFilter = (column, value) => {
        if (!value) return;
        values.push(`%${escapeLikePattern(value)}%`);
        whereClauses.push(`${column} ILIKE $${values.length} ESCAPE '\\'`);
    };
    addPartialFilter('tp.names', filters.names);
    addPartialFilter('tp."lastNames"', filters.lastNames);
    addPartialFilter('tp.names', filters.corporativeName);

    if (filters.email) {
        values.push(filters.email.toLowerCase());
        whereClauses.push(`LOWER(TRIM(tp.mail)) = $${values.length}`);
    }
    if (filters.nit) {
        const normalizedNit = filters.nit.replace(/[^0-9a-z]/gi, '').toLowerCase();
        if (!normalizedNit) {
            throw createRequestError(
                'El filtro nit no es válido.',
                400,
                'INVALID_THIRD_PARTY_SEARCH_FILTER'
            );
        }
        values.push(normalizedNit);
        whereClauses.push(`LOWER(REGEXP_REPLACE(tp.indentification_number, '[^0-9a-z]', '', 'g')) = $${values.length}`);
    }

    values.push(normalizedLimit);
    const limitParameter = `$${values.length}`;
    values.push((normalizedPage - 1) * normalizedLimit);
    const offsetParameter = `$${values.length}`;

    const result = await useDataBase(`
        SELECT
            tp.id,
            tp.names,
            tp."lastNames",
            CASE
                WHEN COALESCE(tp."lastNames", '') = '' THEN tp.names
                ELSE NULL
            END AS corporative_name,
            CONCAT_WS(' ', tp.names, tp."lastNames") AS full_name,
            tp.indentification_type,
            tp.indentification_number,
            tp.mail,
            tp.phone,
            tp.country,
            tp.city,
            tp.address,
            tp.type,
            COUNT(*) OVER()::integer AS total_count
        FROM "Ecosystem".thirdparties tp
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY tp.names ASC, tp."lastNames" ASC, tp.id ASC
        LIMIT ${limitParameter}
        OFFSET ${offsetParameter};
    `, values, 1);

    const rows = ensureDatabaseResult(result);
    const total = rows[0]?.total_count ?? 0;
    return {
        data: rows.map(({ total_count, ...thirdParty }) => thirdParty),
        pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total,
            total_pages: total === 0 ? 0 : Math.ceil(total / normalizedLimit)
        }
    };
};

zjService.getThirdPartyById = async ({ companyId, thirdPartyId }) => {
    const normalizedCompanyId = normalizePositiveInteger(companyId, null);
    const normalizedThirdPartyId = normalizePositiveInteger(thirdPartyId, null);
    if (!normalizedCompanyId) throw new Error('companyId autenticado es requerido.');
    if (!normalizedThirdPartyId) {
        const error = new Error('El identificador del tercero no es válido.');
        error.statusCode = 400;
        error.code = 'INVALID_THIRD_PARTY_ID';
        throw error;
    }

    const result = await useDataBase(`
        SELECT
            tp.id,
            tp.names,
            tp."lastNames",
            CONCAT_WS(' ', tp.names, tp."lastNames") AS full_name,
            tp.indentification_type,
            tp.indentification_number,
            tp.mail,
            tp.phone,
            tp.country,
            tp.city,
            tp.address,
            tp.type,
            commercial.comercial_state
        FROM "Ecosystem".thirdparties tp
        LEFT JOIN LATERAL (
            SELECT info.comercial_state
            FROM "Ecosystem"."thirdPartyComercialInfo" info
            WHERE info."thirdParty_id" = tp.id
              AND info.company_id = tp.company_id
            ORDER BY (info.comercial_state = 'active') DESC
            LIMIT 1
        ) commercial ON true
        WHERE tp.company_id = $1
          AND tp.id = $2
          AND commercial.comercial_state = 'active'
        LIMIT 1;
    `, [normalizedCompanyId, normalizedThirdPartyId], 1);

    return ensureDatabaseResult(result)[0] ?? null;
};

zjService.getProcessTypes = async ({ companyId }) => {
    const normalizedCompanyId = normalizePositiveInteger(companyId, null);
    if (!normalizedCompanyId) throw new Error('companyId autenticado es requerido.');

    const result = await useDataBase(`
        SELECT
            process.id,
            process.code,
            process.name,
            process.description,
            process.img,
            process.status,
            COALESCE(
                JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                        'id', step.id,
                        'name', step.name,
                        'description', step.description,
                        'order', step."order",
                        'optional', step.optional,
                        'end_process', step.end_process
                    )
                    ORDER BY step."order", step.id
                ) FILTER (WHERE step.id IS NOT NULL),
                '[]'::jsonb
            ) AS steps
        FROM "Process".processes process
        LEFT JOIN "Process".process_steps step
            ON step.process_id = process.id
           AND step.company_id = process.company_id
        WHERE process.company_id = $1
          AND process.status = 'active'
        GROUP BY process.id
        ORDER BY process.name, process.id;
    `, [normalizedCompanyId], 1);

    return ensureDatabaseResult(result);
};

zjService.getProcessInstanceById = async ({ companyId, processInstanceId }) => {
    const normalizedCompanyId = normalizePositiveInteger(companyId, null);
    const normalizedInstanceId = normalizePositiveInteger(processInstanceId, null);
    if (!normalizedCompanyId) throw new Error('companyId autenticado es requerido.');
    if (!normalizedInstanceId) {
        const error = new Error('El identificador de la instancia no es válido.');
        error.statusCode = 400;
        error.code = 'INVALID_PROCESS_INSTANCE_ID';
        throw error;
    }

    const result = await useDataBase(`
        SELECT
            instance.id,
            instance."ownSerial" AS serial,
            instance.status,
            instance.created_at,
            instance.start_date,
            instance.delivery_date,
            instance.updated_at,
            instance.closed_at,
            JSONB_BUILD_OBJECT(
                'id', process.id,
                'code', process.code,
                'name', process.name
            ) AS process,
            CASE
                WHEN step.id IS NULL THEN NULL
                ELSE JSONB_BUILD_OBJECT(
                    'id', step.id,
                    'name', step.name,
                    'description', step.description,
                    'order', step."order",
                    'end_process', step.end_process
                )
            END AS current_step,
            CASE
                WHEN third_party.id IS NULL THEN NULL
                ELSE JSONB_BUILD_OBJECT(
                    'id', third_party.id,
                    'full_name', CONCAT_WS(
                        ' ',
                        third_party.names,
                        third_party."lastNames"
                    ),
                    'identification_number', third_party.indentification_number
                )
            END AS third_party,
            CASE
                WHEN responsible.user_id IS NULL THEN NULL
                ELSE JSONB_BUILD_OBJECT(
                    'id', responsible.user_id,
                    'name', responsible.user_name
                )
            END AS responsible
        FROM "Process".process_instance instance
        INNER JOIN "Process".processes process
            ON process.id = instance.process_id
           AND process.company_id = instance.company_id
        LEFT JOIN "Process".process_steps step
            ON step.id = instance.step_id
           AND step.company_id = instance.company_id
        LEFT JOIN "Ecosystem".thirdparties third_party
            ON third_party.id = instance."thirdParty_id"
           AND third_party.company_id = instance.company_id
        LEFT JOIN "Ecosystem".users responsible
            ON responsible.user_id = instance.responsable
           AND responsible.company_id = instance.company_id
        WHERE instance.company_id = $1
          AND instance.id = $2
        LIMIT 1;
    `, [normalizedCompanyId, normalizedInstanceId], 1);

    return ensureDatabaseResult(result)[0] ?? null;
};

zjService.getProductsNServices = async ({
    companyId,
    search,
    page = 1,
    limit = 50
}) => {
    const normalizedCompanyId = normalizePositiveInteger(companyId, null);
    if (!normalizedCompanyId) throw new Error('companyId autenticado es requerido.');

    const normalizedPage = normalizePositiveInteger(page, 1);
    const normalizedLimit = normalizePositiveInteger(limit, 50, 100);
    const offset = (normalizedPage - 1) * normalizedLimit;
    const values = [normalizedCompanyId];
    const whereClauses = [
        'item.company_id = $1',
        `item.type = 'service'`,
        `item.status = 'active'`
    ];

    const normalizedSearch = typeof search === 'string' ? search.trim() : '';
    if (normalizedSearch) {
        values.push(`%${escapeLikePattern(normalizedSearch)}%`);
        const searchParameter = `$${values.length}`;
        whereClauses.push(`(
            item.name ILIKE ${searchParameter} ESCAPE '\\'
            OR item.code ILIKE ${searchParameter} ESCAPE '\\'
            OR COALESCE(item.description, '') ILIKE ${searchParameter} ESCAPE '\\'
        )`);
    }

    values.push(normalizedLimit);
    const limitParameter = `$${values.length}`;
    values.push(offset);
    const offsetParameter = `$${values.length}`;

    const result = await useDataBase(`
        SELECT
            item.id,
            item.code,
            item.name,
            item.description,
            item.units,
            item.currency,
            item.img,
            item.taxed,
            item.tax_id,
            item.type,
            item.status,
            COUNT(*) OVER()::integer AS total_count
        FROM "Inventory"."products&services" item
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY item.order_index NULLS LAST, item.name, item.id
        LIMIT ${limitParameter}
        OFFSET ${offsetParameter};
    `, values, 1);

    const rows = ensureDatabaseResult(result);
    const total = rows[0]?.total_count ?? 0;
    const data = rows.map(({ total_count, ...item }) => item);

    return {
        data,
        pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total,
            total_pages: total === 0 ? 0 : Math.ceil(total / normalizedLimit)
        }
    };
};

zjService.createProcessInstance = async ({
    integrationId,
    companyId,
    serviceUserId,
    payload
}) => {
    const normalizedIntegrationId = normalizeRequiredId(
        integrationId,
        'integrationId',
        'INVALID_INTEGRATION_ID'
    );
    const normalizedCompanyId = normalizeRequiredId(
        companyId,
        'companyId',
        'INVALID_COMPANY_ID'
    );
    const normalizedServiceUserId = normalizeRequiredId(
        serviceUserId,
        'serviceUserId',
        'INVALID_SERVICE_USER_ID'
    );
    const processId = normalizeRequiredId(
        payload?.process_id,
        'process_id',
        'INVALID_PROCESS_ID'
    );
    const thirdPartyId = normalizeRequiredId(
        payload?.thirdParty_id,
        'thirdParty_id',
        'INVALID_THIRD_PARTY_ID'
    );

    const externalReference = typeof payload?.external_reference === 'string'
        ? payload.external_reference.trim()
        : '';
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(externalReference)) {
        throw createRequestError(
            'external_reference es requerido y solo permite letras, números, punto, guion, guion bajo o dos puntos.',
            400,
            'INVALID_EXTERNAL_REFERENCE'
        );
    }

    const description = payload?.description === undefined
        ? null
        : String(payload.description).trim();
    if (description && description.length > 1000) {
        throw createRequestError(
            'description no puede superar 1000 caracteres.',
            400,
            'INVALID_DESCRIPTION'
        );
    }

    const metadata = payload?.metadata ?? {};
    if (
        !metadata ||
        typeof metadata !== 'object' ||
        Array.isArray(metadata)
    ) {
        throw createRequestError(
            'metadata debe ser un objeto JSON.',
            400,
            'INVALID_METADATA'
        );
    }
    if (Buffer.byteLength(JSON.stringify(metadata), 'utf8') > 16 * 1024) {
        throw createRequestError(
            'metadata supera el límite de 16 KB.',
            400,
            'METADATA_TOO_LARGE'
        );
    }

    const requestedStartDate = normalizeDate(payload?.start_date, {
        field: 'start_date',
        fallback: null
    });
    const startDate = requestedStartDate ?? new Date();
    const deliveryDate = normalizeDate(payload?.delivery_date, {
        field: 'delivery_date',
        required: true
    });
    if (deliveryDate.getTime() < startDate.getTime()) {
        throw createRequestError(
            'delivery_date no puede ser anterior a start_date.',
            400,
            'INVALID_DELIVERY_DATE'
        );
    }

    const requestHash = createPayloadHash({
        process_id: processId,
        thirdParty_id: thirdPartyId,
        start_date: requestedStartDate?.toISOString() ?? null,
        delivery_date: deliveryDate.toISOString(),
        description,
        metadata
    });

    const creation = await withTransaction(async client => {
        await client.query(
            'SELECT pg_advisory_xact_lock(hashtextextended($1, 0));',
            [`${normalizedIntegrationId}:${externalReference}`]
        );

        const existingResult = await client.query(`
            SELECT process_instance_id, request_hash
            FROM "Integration".process_instance_requests
            WHERE integration_id = $1
              AND external_reference = $2
            LIMIT 1
            FOR UPDATE;
        `, [normalizedIntegrationId, externalReference]);

        const existing = existingResult.rows[0];
        if (existing) {
            if (existing.request_hash !== requestHash) {
                throw createRequestError(
                    `La referencia ${externalReference} ya existe con información diferente.`,
                    409,
                    'EXTERNAL_REFERENCE_CONFLICT'
                );
            }
            return {
                instanceId: Number(existing.process_instance_id),
                replayed: true
            };
        }

        const processResult = await client.query(`
            SELECT
                process.id,
                first_step.id AS first_step_id
            FROM "Process".processes process
            LEFT JOIN LATERAL (
                SELECT step.id
                FROM "Process".process_steps step
                WHERE step.process_id = process.id
                  AND step.company_id = process.company_id
                ORDER BY step."order", step.id
                LIMIT 1
            ) first_step ON true
            WHERE process.company_id = $1
              AND process.id = $2
              AND process.status = 'active'
            LIMIT 1;
        `, [normalizedCompanyId, processId]);

        const process = processResult.rows[0];
        if (!process || !process.first_step_id) {
            throw createRequestError(
                'El proceso solicitado no existe, no está activo o no tiene una etapa inicial.',
                422,
                'PROCESS_NOT_AVAILABLE'
            );
        }

        const thirdPartyResult = await client.query(`
            SELECT third_party.id
            FROM "Ecosystem".thirdparties third_party
            WHERE third_party.company_id = $1
              AND third_party.id = $2
              AND third_party.type::text = ANY($3::text[])
              AND EXISTS (
                  SELECT 1
                  FROM "Ecosystem"."thirdPartyComercialInfo" commercial
                  WHERE commercial."thirdParty_id" = third_party.id
                    AND commercial.company_id = third_party.company_id
                    AND commercial.comercial_state = 'active'
              )
            LIMIT 1;
        `, [normalizedCompanyId, thirdPartyId, ['client', 'both']]);

        if (!thirdPartyResult.rows[0]) {
            throw createRequestError(
                'El tercero solicitado no existe o no está disponible como cliente.',
                422,
                'THIRD_PARTY_NOT_AVAILABLE'
            );
        }

        const userResult = await client.query(`
            SELECT user_id
            FROM "Ecosystem".users
            WHERE company_id = $1
              AND user_id = $2
              AND status = 'active'
            LIMIT 1;
        `, [normalizedCompanyId, normalizedServiceUserId]);

        if (!userResult.rows[0]) {
            throw createRequestError(
                'El usuario técnico de la integración no está disponible.',
                503,
                'INTEGRATION_SERVICE_USER_UNAVAILABLE'
            );
        }

        const instanceResult = await client.query(`
            INSERT INTO "Process".process_instance(
                company_id,
                process_id,
                step_id,
                status,
                parent_id,
                parent_step,
                start_date,
                delivery_date,
                "thirdParty_id",
                responsable
            )
            VALUES ($1, $2, $3, 'active', NULL, NULL, $4, $5, $6, $7)
            RETURNING id, created_at;
        `, [
            normalizedCompanyId,
            processId,
            process.first_step_id,
            startDate,
            deliveryDate,
            thirdPartyId,
            normalizedServiceUserId
        ]);

        const instanceId = Number(instanceResult.rows[0].id);
        await client.query(`
            INSERT INTO "Process".process_historial(
                company_id,
                instance_id,
                previous_step,
                next_step,
                user_id,
                created_at,
                description
            )
            VALUES ($1, $2, $3, $3, $4, $5, $6);
        `, [
            normalizedCompanyId,
            instanceId,
            process.first_step_id,
            normalizedServiceUserId,
            instanceResult.rows[0].created_at,
            'Creación de instancia de proceso'
        ]);

        await client.query(`
            INSERT INTO "Integration".process_instance_requests(
                integration_id,
                company_id,
                external_reference,
                process_instance_id,
                request_hash,
                metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6::jsonb);
        `, [
            normalizedIntegrationId,
            normalizedCompanyId,
            externalReference,
            instanceId,
            requestHash,
            JSON.stringify({ ...metadata, description })
        ]);

        return { instanceId, replayed: false };
    });

    const instance = await zjService.getProcessInstanceById({
        companyId: normalizedCompanyId,
        processInstanceId: creation.instanceId
    });
    const { id, ...instanceDetails } = instance;

    return {
        external_reference: externalReference,
        replayed: creation.replayed,
        instance_id: id,
        guideLineURL:`https://facturation.sga360.co/preview/Process/123/${id}`,
        ...instanceDetails
    };
};

zjService.getClientOrderById = async ({ companyId, documentId }) => {
    const normalizedCompanyId = normalizeRequiredId(
        companyId,
        'companyId',
        'INVALID_COMPANY_ID'
    );
    const normalizedDocumentId = normalizeRequiredId(
        documentId,
        'documentId',
        'INVALID_DOCUMENT_ID'
    );

    const result = await useDataBase(`
        SELECT
            document.id,
            document."ownSerial" AS serial,
            document.status,
            document."subTotal" AS subtotal,
            document.total,
            document.description,
            document.created_at,
            document.instance_id,
            JSONB_BUILD_OBJECT(
                'id', instance.id,
                'serial', instance."ownSerial",
                'status', instance.status
            ) AS process_instance,
            JSONB_BUILD_OBJECT(
                'id', third_party.id,
                'full_name', CONCAT_WS(
                    ' ',
                    third_party.names,
                    third_party."lastNames"
                ),
                'identification_number', third_party.indentification_number
            ) AS third_party,
            COALESCE(
                JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                        'movement_id', movement.id,
                        'service_id', service.id,
                        'code', service.code,
                        'name', service.name,
                        'units', movement.units,
                        'unit_value', movement.unit_value,
                        'total', movement.total,
                        'description', movement.description
                    )
                    ORDER BY movement.id
                ) FILTER (WHERE movement.id IS NOT NULL),
                '[]'::jsonb
            ) AS items
        FROM "Ecosystem".documents document
        INNER JOIN "Process".process_instance instance
            ON instance.id = document.instance_id
           AND instance.company_id = document.company_id
        INNER JOIN "Ecosystem".thirdparties third_party
            ON third_party.id = document."thirdParty_id"
           AND third_party.company_id = document.company_id
        LEFT JOIN "Inventory".services_movement movement
            ON movement.doc_id = document.id
           AND movement.company_id = document.company_id
        LEFT JOIN "Inventory"."products&services" service
            ON service.id = movement.service_id
           AND service.company_id = document.company_id
        WHERE document.company_id = $1
          AND document.id = $2
          AND document.document_type = 'Client Order'
        GROUP BY document.id, instance.id, third_party.id
        LIMIT 1;
    `, [normalizedCompanyId, normalizedDocumentId], 1);

    return ensureDatabaseResult(result)[0] ?? null;
};

zjService.createClientOrder = async ({
    integrationId,
    companyId,
    serviceUserId,
    payload
}) => {
    const normalizedIntegrationId = normalizeRequiredId(
        integrationId,
        'integrationId',
        'INVALID_INTEGRATION_ID'
    );
    const normalizedCompanyId = normalizeRequiredId(
        companyId,
        'companyId',
        'INVALID_COMPANY_ID'
    );
    const normalizedServiceUserId = normalizeRequiredId(
        serviceUserId,
        'serviceUserId',
        'INVALID_SERVICE_USER_ID'
    );
    const instanceId = normalizeRequiredId(
        payload?.instance_id,
        'instance_id',
        'INVALID_PROCESS_INSTANCE_ID'
    );
    const storeId = normalizeRequiredId(
        payload?.store_id,
        'store_id',
        'INVALID_STORE_ID'
    );

    const externalReference = typeof payload?.external_reference === 'string'
        ? payload.external_reference.trim()
        : '';
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(externalReference)) {
        throw createRequestError(
            'external_reference es requerido y solo permite letras, números, punto, guion, guion bajo o dos puntos.',
            400,
            'INVALID_EXTERNAL_REFERENCE'
        );
    }

    const description = payload?.description === undefined
        ? null
        : String(payload.description).trim();
    if (description && description.length > 1000) {
        throw createRequestError(
            'description no puede superar 1000 caracteres.',
            400,
            'INVALID_DESCRIPTION'
        );
    }

    const metadata = payload?.metadata ?? {};
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        throw createRequestError('metadata debe ser un objeto JSON.', 400, 'INVALID_METADATA');
    }
    if (Buffer.byteLength(JSON.stringify(metadata), 'utf8') > 16 * 1024) {
        throw createRequestError(
            'metadata supera el límite de 16 KB.',
            400,
            'METADATA_TOO_LARGE'
        );
    }

    if (!Array.isArray(payload?.items) || payload.items.length === 0) {
        throw createRequestError(
            'items debe contener al menos un servicio.',
            400,
            'EMPTY_CLIENT_ORDER'
        );
    }
    if (payload.items.length > 100) {
        throw createRequestError(
            'Una orden no puede contener más de 100 líneas.',
            400,
            'TOO_MANY_ORDER_ITEMS'
        );
    }

    let totalScaled = 0n;
    const normalizedItems = payload.items.map((item, index) => {
        const serviceId = normalizeRequiredId(
            item?.service_id,
            `items[${index}].service_id`,
            'INVALID_SERVICE_ID'
        );
        const units = Number.parseInt(item?.units, 10);
        if (!Number.isInteger(units) || units <= 0 || units > 1_000_000) {
            throw createRequestError(
                `items[${index}].units debe ser un entero entre 1 y 1000000.`,
                400,
                'INVALID_ITEM_UNITS'
            );
        }

        const unitValue = normalizeMoney(
            item?.unit_value,
            `items[${index}].unit_value`
        );
        const itemDescription = item?.description === undefined
            ? null
            : String(item.description).trim();
        if (itemDescription && itemDescription.length > 500) {
            throw createRequestError(
                `items[${index}].description no puede superar 500 caracteres.`,
                400,
                'INVALID_ITEM_DESCRIPTION'
            );
        }

        const lineTotalScaled = unitValue.scaled * BigInt(units);
        totalScaled += lineTotalScaled;
        return {
            service_id: serviceId,
            units,
            unit_value: unitValue.value,
            total: formatScaledMoney(lineTotalScaled),
            description: itemDescription
        };
    });
    const total = formatScaledMoney(totalScaled);

    const requestHash = createPayloadHash({
        instance_id: instanceId,
        store_id: storeId,
        description,
        items: normalizedItems,
        metadata
    });

    const creation = await withTransaction(async client => {
        await client.query(
            'SELECT pg_advisory_xact_lock(hashtextextended($1, 0));',
            [`client-order:${normalizedIntegrationId}:${externalReference}`]
        );

        const existingResult = await client.query(`
            SELECT document_id, request_hash
            FROM "Integration".client_order_requests
            WHERE integration_id = $1
              AND external_reference = $2
            LIMIT 1
            FOR UPDATE;
        `, [normalizedIntegrationId, externalReference]);

        const existing = existingResult.rows[0];
        if (existing) {
            if (existing.request_hash !== requestHash) {
                throw createRequestError(
                    `La referencia ${externalReference} ya existe con información diferente.`,
                    409,
                    'EXTERNAL_REFERENCE_CONFLICT'
                );
            }
            return {
                documentId: Number(existing.document_id),
                replayed: true
            };
        }

        const instanceResult = await client.query(`
            SELECT id, step_id, "thirdParty_id"
            FROM "Process".process_instance
            WHERE company_id = $1
              AND id = $2
              AND status = 'active'
            LIMIT 1;
        `, [normalizedCompanyId, instanceId]);
        const instance = instanceResult.rows[0];
        if (!instance || !instance.thirdParty_id || !instance.step_id) {
            throw createRequestError(
                'La instancia no existe, no está activa o no tiene cliente y etapa asignados.',
                422,
                'PROCESS_INSTANCE_NOT_AVAILABLE'
            );
        }

        const storeResult = await client.query(`
            SELECT id
            FROM "Ecosystem".stores
            WHERE company_id = $1 AND id = $2
            LIMIT 1;
        `, [normalizedCompanyId, storeId]);
        if (!storeResult.rows[0]) {
            throw createRequestError(
                'La tienda solicitada no pertenece a la compañía.',
                422,
                'STORE_NOT_AVAILABLE'
            );
        }

        const userResult = await client.query(`
            SELECT user_id
            FROM "Ecosystem".users
            WHERE company_id = $1
              AND user_id = $2
              AND status = 'active'
            LIMIT 1;
        `, [normalizedCompanyId, normalizedServiceUserId]);
        if (!userResult.rows[0]) {
            throw createRequestError(
                'El usuario técnico de la integración no está disponible.',
                503,
                'INTEGRATION_SERVICE_USER_UNAVAILABLE'
            );
        }

        const uniqueServiceIds = [...new Set(
            normalizedItems.map(item => item.service_id)
        )];
        const servicesResult = await client.query(`
            SELECT id
            FROM "Inventory"."products&services"
            WHERE company_id = $1
              AND id = ANY($2::bigint[])
              AND type = 'service'
              AND status = 'active';
        `, [normalizedCompanyId, uniqueServiceIds]);
        const availableServiceIds = new Set(
            servicesResult.rows.map(row => Number(row.id))
        );
        const unavailableIds = uniqueServiceIds.filter(
            id => !availableServiceIds.has(id)
        );
        if (unavailableIds.length > 0) {
            throw createRequestError(
                `Los servicios ${unavailableIds.join(', ')} no existen o no están disponibles.`,
                422,
                'SERVICE_NOT_AVAILABLE'
            );
        }

        const documentResult = await client.query(`
            INSERT INTO "Ecosystem".documents(
                company_id,
                store_id,
                "thirdParty_id",
                document_type,
                status,
                "subTotal",
                total,
                created_by,
                description,
                attached,
                instance_id,
                step_instance
            )
            VALUES ($1, $2, $3, 'Client Order', 'active', $4, $4, $5, $6, $7, $8, $9)
            RETURNING id;
        `, [
            normalizedCompanyId,
            storeId,
            instance.thirdParty_id,
            total,
            normalizedServiceUserId,
            description,
            JSON.stringify([]),
            instanceId,
            instance.step_id
        ]);
        const documentId = Number(documentResult.rows[0].id);

        await client.query(`
            INSERT INTO "Ecosystem".docs_instances(
                doc_id, instance_id, step_instance
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (doc_id, instance_id)
            DO UPDATE SET step_instance = EXCLUDED.step_instance;
        `, [documentId, instanceId, instance.step_id]);

        for (const item of normalizedItems) {
            await client.query(`
                INSERT INTO "Inventory".services_movement(
                    company_id,
                    store_id,
                    "thirdParty_id",
                    service_id,
                    units,
                    unit_value,
                    total,
                    description,
                    instance_id,
                    doc_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
            `, [
                normalizedCompanyId,
                storeId,
                instance.thirdParty_id,
                item.service_id,
                item.units,
                item.unit_value,
                item.total,
                item.description,
                instanceId,
                documentId
            ]);
        }

        await client.query(`
            INSERT INTO "Integration".client_order_requests(
                integration_id,
                company_id,
                external_reference,
                process_instance_id,
                document_id,
                request_hash,
                metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb);
        `, [
            normalizedIntegrationId,
            normalizedCompanyId,
            externalReference,
            instanceId,
            documentId,
            requestHash,
            JSON.stringify(metadata)
        ]);

        return { documentId, replayed: false };
    });

    const order = await zjService.getClientOrderById({
        companyId: normalizedCompanyId,
        documentId: creation.documentId
    });
    const { id, ...orderDetails } = order;
    return {
        external_reference: externalReference,
        replayed: creation.replayed,
        document_id: id,
        ...orderDetails
    };
};

export default zjService;
