import { useDataBase } from "../app.js";
import encryptionService from "./encryptionService.js";

const electronicProviderCredentialsService = {};

const SECRET_FIELDS = ['client_secret', 'password'];

const normalizeProvider = (value) => `${value ?? 'factus'}`.trim().toLowerCase();
const normalizeEnvironment = (value) => `${value ?? 'production'}`.trim().toLowerCase();
const normalizeStatus = (value) => `${value ?? 'active'}`.trim().toLowerCase();

const normalizeCompanyId = (value) => {
    const companyId = parseInt(value);
    if (!Number.isInteger(companyId) || companyId < 0) {
        throw new Error('company_id es requerido.');
    }
    return companyId;
};

const requireText = (value, fieldName) => {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${fieldName} es requerido.`);
    }
    return value.trim();
};

const normalizeCredentialPayload = (info) => {
    const companyId = normalizeCompanyId(info.company_id);

    const provider = normalizeProvider(info.provider);
    const environment = normalizeEnvironment(info.environment);
    const status = normalizeStatus(info.status);

    return {
        company_id: companyId,
        provider,
        environment,
        api_url: requireText(info.api_url ?? info.apiUrl, 'api_url'),
        client_id: requireText(info.client_id ?? info.clientId, 'client_id'),
        client_secret: requireText(info.client_secret ?? info.clientSecret, 'client_secret'),
        username: requireText(info.username, 'username'),
        password: requireText(info.password, 'password'),
        status,
        metadata: info.metadata ?? {},
        created_by: info.created_by ?? info.user_id ?? info.user ?? null
    };
};

const maskCredential = (credential) => {
    if (!credential) return credential;

    return {
        ...credential,
        client_secret_encrypted: undefined,
        password_encrypted: undefined,
        client_secret_masked: credential.client_secret_masked
            ?? encryptionService.maskSecret(credential.client_secret ?? ''),
        password_masked: credential.password_masked
            ?? encryptionService.maskSecret(credential.password ?? '')
    };
};

electronicProviderCredentialsService.upsert = async (info) => {
    const data = normalizeCredentialPayload(info);
    const encrypted = encryptionService.encryptFields(data, SECRET_FIELDS);

    const sentence = `
        INSERT INTO "Facturation".electronic_provider_credentials (
            company_id,
            provider,
            environment,
            api_url,
            client_id,
            client_secret_encrypted,
            username,
            password_encrypted,
            status,
            metadata,
            created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (company_id, provider, environment)
        DO UPDATE SET
            api_url = EXCLUDED.api_url,
            client_id = EXCLUDED.client_id,
            client_secret_encrypted = EXCLUDED.client_secret_encrypted,
            username = EXCLUDED.username,
            password_encrypted = EXCLUDED.password_encrypted,
            status = EXCLUDED.status,
            metadata = EXCLUDED.metadata,
            updated_at = now()
        RETURNING
            id,
            company_id,
            provider,
            environment,
            api_url,
            client_id,
            username,
            status,
            metadata,
            created_by,
            created_at,
            updated_at;
    `;

    const values = [
        encrypted.company_id,
        encrypted.provider,
        encrypted.environment,
        encrypted.api_url,
        encrypted.client_id,
        encrypted.client_secret,
        encrypted.username,
        encrypted.password,
        encrypted.status,
        JSON.stringify(encrypted.metadata),
        encrypted.created_by
    ];

    const result = await useDataBase(sentence, values, 3);

    return {
        status: "OK",
        data: {
            ...result,
            client_secret_masked: encryptionService.maskSecret(data.client_secret),
            password_masked: encryptionService.maskSecret(data.password)
        }
    };
};

electronicProviderCredentialsService.getActive = async (info) => {
    const companyId = normalizeCompanyId(info.company_id);

    const provider = normalizeProvider(info.provider);
    const environment = normalizeEnvironment(info.environment);

    const sentence = `
        SELECT *
        FROM "Facturation".electronic_provider_credentials
        WHERE company_id = ANY($1::bigint[])
            AND provider = $2
            AND environment = $3
            AND status = 'active'
        ORDER BY company_id DESC
        LIMIT 1;
    `;

    const allowedCompanyIds = companyId === 0 ? [0] : [companyId, 0];
    const result = await useDataBase(sentence, [allowedCompanyIds, provider, environment], 1);
    if (!result[0]) {
        return null;
    }

    const row = result[1][0];
    return {
        ...row,
        client_secret: encryptionService.decrypt(row.client_secret_encrypted),
        password: encryptionService.decrypt(row.password_encrypted)
    };
};

electronicProviderCredentialsService.list = async (info) => {
    const companyId = normalizeCompanyId(info.company_id);

    const values = [companyId];
    const whereClauses = ['company_id = $1'];

    if (info.provider !== undefined) {
        values.push(normalizeProvider(info.provider));
        whereClauses.push(`provider = $${values.length}`);
    }

    if (info.environment !== undefined) {
        values.push(normalizeEnvironment(info.environment));
        whereClauses.push(`environment = $${values.length}`);
    }

    const sentence = `
        SELECT
            id,
            company_id,
            provider,
            environment,
            api_url,
            client_id,
            username,
            status,
            metadata,
            created_by,
            created_at,
            updated_at
        FROM "Facturation".electronic_provider_credentials
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY provider ASC, environment ASC;
    `;

    const result = await useDataBase(sentence, values, 1);
    return result[0] ? result[1].map(maskCredential) : [];
};

electronicProviderCredentialsService.disable = async (info) => {
    const id = parseInt(info.id);
    const companyId = normalizeCompanyId(info.company_id);

    if (!Number.isInteger(id) || id <= 0) throw new Error('id es requerido.');

    const sentence = `
        UPDATE "Facturation".electronic_provider_credentials
        SET status = 'inactive',
            updated_at = now()
        WHERE id = $1
            AND company_id = $2
        RETURNING id, company_id, provider, environment, status;
    `;

    const result = await useDataBase(sentence, [id, companyId], 3);
    return {
        status: result?.id !== undefined ? "OK" : "Error",
        data: result
    };
};

export default electronicProviderCredentialsService;
