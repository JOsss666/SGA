import { useDataBase } from "../app.js";
import encryptionService from "./encryptionService.js";
import electronicProviderCredentialsService from "./electronicProviderCredentialsService.js";

const factusService = {};

const PROVIDER = 'factus';
const DEFAULT_ENVIRONMENT = 'sandbox';
const TOKEN_REFRESH_WINDOW_MS = 5 * 60 * 1000;
const NUMBERING_RANGES_CACHE_MS = 30 * 60 * 1000;

const DOCUMENT_RANGE_NAMES = {
    invoice: 'Factura de Venta',
    cr_note: 'Nota Crédito',
    db_note: 'Nota Débito'
};

const normalizeEnvironment = (value) => `${value ?? DEFAULT_ENVIRONMENT}`.trim().toLowerCase();

const normalizeCompanyId = (value) => {
    const companyId = parseInt(value);
    if (!Number.isInteger(companyId) || companyId < 0) {
        throw new Error('company_id es requerido.');
    }
    return companyId;
};

const normalizeApiUrl = (apiUrl) => `${apiUrl}`.replace(/\/+$/, '');

const getCredentials = async ({ company_id, environment = DEFAULT_ENVIRONMENT } = {}) => {
    const companyId = normalizeCompanyId(company_id);
    const credential = await electronicProviderCredentialsService.getActive({
        company_id: companyId,
        provider: PROVIDER,
        environment: normalizeEnvironment(environment)
    });

    if (!credential) {
        throw new Error(`No hay credenciales activas de Factus para company_id ${companyId}.`);
    }

    return {
        ...credential,
        api_url: normalizeApiUrl(credential.api_url),
        request_company_id: companyId
    };
};

const decryptTokenRow = (row) => ({
    token_type: row.token_type,
    access_token: encryptionService.decrypt(row.access_token_encrypted),
    refresh_token: row.refresh_token_encrypted
        ? encryptionService.decrypt(row.refresh_token_encrypted)
        : null,
    expires_at: new Date(row.expires_at).getTime(),
    credential_id: row.credential_id,
    company_id: row.company_id,
    provider: row.provider,
    environment: row.environment
});

const getCachedToken = async (credential) => {
    const result = await useDataBase(`
        SELECT *
        FROM "Facturation".electronic_provider_tokens
        WHERE credential_id = $1
        LIMIT 1;
    `, [credential.id], 1);

    if (!result[0]) return null;

    const token = decryptTokenRow(result[1][0]);
    if (Date.now() < (token.expires_at - TOKEN_REFRESH_WINDOW_MS)) {
        return token;
    }

    return {
        ...token,
        expired: true
    };
};

const saveToken = async (credential, tokenData) => {
    const tokenCompanyId = credential.request_company_id > 0
        ? credential.request_company_id
        : parseInt(credential.company_id);

    // Las credenciales globales company_id=0 pueden usarse como fallback. Si
    // tambien se consulta directamente company_id=0, no cacheamos para evitar
    // depender de una FK global inexistente en algunas bases.
    if (!Number.isInteger(tokenCompanyId) || tokenCompanyId <= 0) {
        return {
            ...tokenData,
            expires_at: Date.now() + (Number(tokenData.expires_in ?? 3600) * 1000)
        };
    }

    const expiresAt = new Date(Date.now() + (Number(tokenData.expires_in ?? 3600) * 1000));
    const accessTokenEncrypted = encryptionService.encrypt(tokenData.access_token);
    const refreshTokenEncrypted = tokenData.refresh_token
        ? encryptionService.encrypt(tokenData.refresh_token)
        : null;

    const values = [
        credential.id,
        tokenCompanyId,
        PROVIDER,
        credential.environment,
        tokenData.token_type ?? 'Bearer',
        accessTokenEncrypted,
        refreshTokenEncrypted,
        expiresAt,
        JSON.stringify(tokenData.scope ?? []),
        JSON.stringify(tokenData)
    ];

    const result = await useDataBase(`
        INSERT INTO "Facturation".electronic_provider_tokens (
            credential_id,
            company_id,
            provider,
            environment,
            token_type,
            access_token_encrypted,
            refresh_token_encrypted,
            expires_at,
            scope,
            raw_payload
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (credential_id)
        DO UPDATE SET
            company_id = EXCLUDED.company_id,
            provider = EXCLUDED.provider,
            environment = EXCLUDED.environment,
            token_type = EXCLUDED.token_type,
            access_token_encrypted = EXCLUDED.access_token_encrypted,
            refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
            expires_at = EXCLUDED.expires_at,
            scope = EXCLUDED.scope,
            raw_payload = EXCLUDED.raw_payload,
            updated_at = now()
        RETURNING *;
    `, values, 3);

    return decryptTokenRow(result);
};

const requestToken = async (credential, grantType = 'password', refreshToken = null) => {
    const payload = {
        grant_type: grantType,
        client_id: credential.client_id,
        client_secret: credential.client_secret
    };

    if (grantType === 'refresh_token') {
        if (!refreshToken) throw new Error('Falta refresh_token para refrescar Factus.');
        payload.refresh_token = refreshToken;
    } else {
        payload.username = credential.username;
        payload.password = credential.password;
    }

    const response = await fetch(`${credential.api_url}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || `Error de autenticacion Factus (${response.status}).`);
    }

    return data;
};

factusService.getAuthToken = async ({ company_id, environment = DEFAULT_ENVIRONMENT, bypassCache = false } = {}) => {
    const credential = await getCredentials({ company_id, environment });

    if (!bypassCache) {
        const cachedToken = await getCachedToken(credential);

        if (cachedToken && !cachedToken.expired) {
            return {
                ...cachedToken,
                credential
            };
        }

        if (cachedToken?.refresh_token) {
            try {
                const refreshed = await requestToken(credential, 'refresh_token', cachedToken.refresh_token);
                const saved = await saveToken(credential, refreshed);
                return {
                    ...saved,
                    credential
                };
            } catch (error) {
                console.warn('Refresh token Factus invalido. Reintentando con password:', error.message);
            }
        }
    }

    const tokenData = await requestToken(credential, 'password');
    const saved = await saveToken(credential, tokenData);
    return {
        ...saved,
        credential
    };
};

factusService.request = async ({
    company_id,
    environment = DEFAULT_ENVIRONMENT,
    path,
    method = 'GET',
    body,
    retryOnUnauthorized = true
}) => {
    const auth = await factusService.getAuthToken({ company_id, environment });
    const url = `${auth.credential.api_url}${path}`;

    const execute = async (token) => fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let response = await execute(auth);

    if (response.status === 401 && retryOnUnauthorized) {
        const freshAuth = await factusService.getAuthToken({ company_id, environment, bypassCache: true });
        response = await execute(freshAuth);
    }

    const data = await response.json().catch(() => ({}));
    return {
        ok: response.ok,
        status: response.status,
        data
    };
};

const normalizeFactusResponseList = (responseData) => (
    responseData?.data?.data
    ?? responseData?.data
    ?? []
);

const getCachedNumberingRanges = async (credential) => {
    const companyId = credential.request_company_id;
    if (!Number.isInteger(companyId) || companyId <= 0) return null;

    const result = await useDataBase(`
        SELECT *
        FROM "Facturation".electronic_provider_numbering_ranges
        WHERE credential_id = $1
            AND company_id = $2
            AND provider = $3
            AND environment = $4
            AND (expires_at IS NULL OR expires_at > now())
        ORDER BY document_name ASC;
    `, [credential.id, companyId, PROVIDER, credential.environment], 1);

    return result[0] ? result[1] : null;
};

const saveNumberingRanges = async (credential, ranges) => {
    const companyId = credential.request_company_id;
    if (!Number.isInteger(companyId) || companyId <= 0) return ranges;

    const expiresAt = new Date(Date.now() + NUMBERING_RANGES_CACHE_MS);

    for (const range of ranges) {
        const providerRangeId = parseInt(range.id ?? range.provider_range_id);
        if (!Number.isInteger(providerRangeId)) continue;

        const values = [
            credential.id,
            companyId,
            PROVIDER,
            credential.environment,
            providerRangeId,
            range.document ?? range.document_name ?? '',
            range.document_code ?? range.code ?? null,
            range.prefix ?? null,
            range.current_number ?? range.current ?? null,
            range.from ?? range.from_number ?? null,
            range.to ?? range.to_number ?? null,
            range.valid_from ?? null,
            range.valid_until ?? range.valid_to ?? null,
            range.is_active ?? range.active ?? true,
            expiresAt,
            JSON.stringify(range)
        ];

        await useDataBase(`
            INSERT INTO "Facturation".electronic_provider_numbering_ranges (
                credential_id,
                company_id,
                provider,
                environment,
                provider_range_id,
                document_name,
                document_code,
                prefix,
                current_number,
                from_number,
                to_number,
                valid_from,
                valid_until,
                is_active,
                expires_at,
                raw_payload
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            ON CONFLICT (credential_id, company_id, provider_range_id)
            DO UPDATE SET
                company_id = EXCLUDED.company_id,
                provider = EXCLUDED.provider,
                environment = EXCLUDED.environment,
                document_name = EXCLUDED.document_name,
                document_code = EXCLUDED.document_code,
                prefix = EXCLUDED.prefix,
                current_number = EXCLUDED.current_number,
                from_number = EXCLUDED.from_number,
                to_number = EXCLUDED.to_number,
                valid_from = EXCLUDED.valid_from,
                valid_until = EXCLUDED.valid_until,
                is_active = EXCLUDED.is_active,
                expires_at = EXCLUDED.expires_at,
                raw_payload = EXCLUDED.raw_payload,
                updated_at = now();
        `, values, 2);
    }

    return ranges;
};

factusService.getNumberingRanges = async ({ company_id, environment = DEFAULT_ENVIRONMENT, bypassCache = false } = {}) => {
    const credential = await getCredentials({ company_id, environment });

    if (!bypassCache) {
        const cached = await getCachedNumberingRanges(credential);
        if (cached && cached.length > 0) {
            return cached.map((row) => ({
                ...row.raw_payload,
                id: row.provider_range_id,
                document: row.document_name
            }));
        }
    }

    const response = await factusService.request({
        company_id,
        environment,
        path: '/v1/numbering-ranges',
        method: 'GET'
    });

    if (!response.ok) {
        throw new Error(response.data?.message || `Error al obtener rangos Factus (${response.status}).`);
    }

    const ranges = normalizeFactusResponseList(response.data);
    await saveNumberingRanges(credential, ranges);
    return ranges;
};

factusService.getNumberingRangeId = async ({
    company_id,
    environment = DEFAULT_ENVIRONMENT,
    type,
    preferredRangeId = null,
    allowedRangeIds = null
} = {}) => {
    const documentName = DOCUMENT_RANGE_NAMES[type];
    if (!documentName) {
        throw new Error(`Tipo de rango Factus inválido: ${type}.`);
    }

    const rangeIdOf = (item) => `${item.id ?? item.provider_range_id}`;

    const ranges = await factusService.getNumberingRanges({ company_id, environment });
    let ofType = ranges.filter((item) => item.document === documentName || item.document_name === documentName);

    if (ofType.length === 0) {
        throw new Error(`No se encontró rango de numeración para ${documentName}.`);
    }

    // Restricción por rol: solo los rangos incluidos en la lista blanca.
    if (Array.isArray(allowedRangeIds)) {
        const allowed = new Set(allowedRangeIds.map((value) => `${value}`));
        ofType = ofType.filter((item) => allowed.has(rangeIdOf(item)));
        if (ofType.length === 0) {
            throw new Error(`El rol no tiene rangos de numeración autorizados para ${documentName}.`);
        }
    }

    // Rango elegido en el formulario: debe estar dentro de los permitidos.
    if (preferredRangeId != null && `${preferredRangeId}`.trim() !== '') {
        const chosen = ofType.find((item) => rangeIdOf(item) === `${preferredRangeId}`);
        if (!chosen) {
            throw new Error(`El rango de numeración ${preferredRangeId} no está autorizado para ${documentName}.`);
        }
        return chosen.id ?? chosen.provider_range_id;
    }

    const range = ofType[0];
    return range.id ?? range.provider_range_id;
};

factusService.validateInvoice = ({ company_id, environment, payload }) => (
    factusService.request({
        company_id,
        environment,
        path: '/v1/bills/validate',
        method: 'POST',
        body: payload
    })
);

factusService.validateCreditNote = ({ company_id, environment, payload }) => (
    factusService.request({
        company_id,
        environment,
        path: '/v1/credit-notes/validate',
        method: 'POST',
        body: payload
    })
);

export default factusService;
