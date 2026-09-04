import { useDataBase } from '../app.js';
import clientSecretService from './clientSecretService.js';
import jwtService from './jwtService.js';
import IntegrationAuthError from '../errors/IntegrationAuthError.js';

const integrationAuthService = {};

const findClient = async (clientId) => {
    const result = await useDataBase(`
        SELECT
            id,
            company_id,
            service_user_id,
            client_id,
            name,
            secret_hash,
            scopes,
            status,
            token_version,
            access_token_ttl
        FROM "Integration".clients
        WHERE client_id = $1
        LIMIT 1;
    `, [clientId], 1);

    if (!result[0]) return null;
    return result[1][0];
};

const recordEvent = async ({
    clientId,
    client = null,
    eventType,
    success,
    requestContext = {},
    details = {}
}) => {
    try {
        await useDataBase(`
            INSERT INTO "Integration".auth_events(
                client_id, integration_id, company_id, event_type,
                success, ip_address, user_agent, details
            )
            VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::inet, $7, $8::jsonb);
        `, [
            clientId || null,
            client?.id ?? null,
            client?.company_id ?? null,
            eventType,
            success,
            requestContext.ip || '',
            requestContext.userAgent || null,
            JSON.stringify(details)
        ], 2);
    } catch (error) {
        console.error('No fue posible registrar el evento de autenticación:', error.message);
    }
};

integrationAuthService.issueToken = async ({
    clientId,
    clientSecret,
    requestContext = {}
}) => {
    const normalizedClientId = typeof clientId === 'string' ? clientId.trim().toLowerCase() : '';
    if (!normalizedClientId || typeof clientSecret !== 'string') {
        throw new IntegrationAuthError('Credenciales inválidas.', {
            statusCode: 401,
            code: 'INVALID_CLIENT'
        });
    }

    const client = await findClient(normalizedClientId);
    const secretIsValid = client
        ? await clientSecretService.verify(clientSecret, client.secret_hash)
        : false;

    if (!client || client.status !== 'active' || !secretIsValid) {
        await recordEvent({
            clientId: normalizedClientId,
            client,
            eventType: 'token_request',
            success: false,
            requestContext
        });
        throw new IntegrationAuthError('Credenciales inválidas.', {
            statusCode: 401,
            code: 'INVALID_CLIENT'
        });
    }

    const signed = jwtService.signAccessToken({
        integrationId: client.id,
        clientId: client.client_id,
        companyId: client.company_id,
        serviceUserId: client.service_user_id,
        scopes: client.scopes,
        tokenVersion: client.token_version,
        expiresIn: client.access_token_ttl
    });

    await Promise.all([
        useDataBase(`
            UPDATE "Integration".clients
            SET last_used_at = now(), updated_at = now()
            WHERE id = $1;
        `, [client.id], 2),
        recordEvent({
            clientId: normalizedClientId,
            client,
            eventType: 'token_issued',
            success: true,
            requestContext,
            details: { jti: signed.payload.jti }
        })
    ]);

    return {
        access_token: signed.token,
        token_type: 'Bearer',
        expires_in: signed.expiresIn,
        scope: client.scopes.join(' ')
    };
};

integrationAuthService.validateTokenClient = async (payload) => {
    const result = await useDataBase(`
        SELECT id, company_id, service_user_id, client_id, scopes, status, token_version
        FROM "Integration".clients
        WHERE id = $1 AND client_id = $2
        LIMIT 1;
    `, [payload.integration_id, payload.sub], 1);

    const client = result[0] ? result[1][0] : null;
    if (
        !client ||
        client.status !== 'active' ||
        Number(client.company_id) !== Number(payload.company_id) ||
        Number(client.token_version) !== Number(payload.token_version)
    ) {
        throw new IntegrationAuthError('La credencial asociada al token no está activa.', {
            statusCode: 401,
            code: 'INACTIVE_CLIENT'
        });
    }

    return {
        integrationId: Number(client.id),
        clientId: client.client_id,
        companyId: Number(client.company_id),
        serviceUserId: client.service_user_id === null ? null : Number(client.service_user_id),
        scopes: client.scopes
    };
};

integrationAuthService.createClientCredentials = async ({
    companyId,
    serviceUserId = null,
    clientId,
    name,
    scopes = [],
    accessTokenTtl = 10800,
    metadata = {}
}) => {
    const secret = clientSecretService.generate();
    const secretHash = await clientSecretService.hash(secret);
    const normalizedClientId = String(clientId || '').trim().toLowerCase();

    const result = await useDataBase(`
        INSERT INTO "Integration".clients(
            company_id, service_user_id, client_id, name, secret_hash,
            scopes, access_token_ttl, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6::text[], $7, $8::jsonb)
        RETURNING id, company_id, service_user_id, client_id, name, scopes, status, created_at;
    `, [
        companyId,
        serviceUserId,
        normalizedClientId,
        name,
        secretHash,
        scopes,
        accessTokenTtl,
        JSON.stringify(metadata)
    ], 3);

    if (!result?.id) throw new Error('No fue posible crear el cliente de integración.');
    return { client: result, client_secret: secret };
};

export default integrationAuthService;
