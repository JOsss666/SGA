import crypto from 'node:crypto';
import { useDataBase } from '../../app.js';
import clientSecretService from '../../services/clientSecretService.js';
import jwtService from '../../services/jwtService.js';
import sessionRepository from '../../repositories/sessionRepository.js';
import toolRegistry from '../tools/ToolRegistry.js';
import SystemAIError from '../core/errors/SystemAIError.js';

export const MCP_SCOPES = Object.freeze(['mcp:read']);
export const MCP_WRITE_SCOPES = Object.freeze(['sell-invoices:create', 'cash-receipts:create']);
export const MCP_PATH = '/api/integrations/v1/mcp';
export const TOKEN_PATH = '/api/integrations/v1/auth/token';
// La BD actual limita el TTL a 3600 s (migración 0022 pendiente de aplicar).
const MCP_TOKEN_TTL = 3600;
const EDITABLE_STATUSES = new Set(['active', 'suspended', 'revoked']);

const mcpSettingsService = {};

const fail = (message, statusCode, code) =>
    new SystemAIError(message, { statusCode, code });

// Un cliente MCP se distingue por metadata.kind = 'mcp'; no requiere cambios
// de esquema y deja intactos los clientes de integración existentes.
const findClient = async (companyId) => {
    const result = await useDataBase(`
        SELECT id, company_id, service_user_id, client_id, name, scopes, status, token_version,
               access_token_ttl, last_used_at, secret_rotated_at, created_at
        FROM "Integration".clients
        WHERE company_id = $1
          AND metadata->>'kind' = 'mcp'
          AND status <> 'revoked'
        ORDER BY id DESC
        LIMIT 1;
    `, [companyId], 1);
    return result[0] ? result[1][0] : null;
};

const requireClient = async (companyId) => {
    const client = await findClient(companyId);
    if (!client) throw fail('La compañía aún no tiene credenciales MCP.', 404, 'MCP_CLIENT_NOT_FOUND');
    return client;
};

const serializeClient = (client) => client && ({
    client_id: client.client_id,
    name: client.name,
    status: client.status,
    scopes: client.scopes,
    write_access: MCP_WRITE_SCOPES.every(scope => client.scopes?.includes(scope)),
    access_token_ttl: Number(client.access_token_ttl),
    created_at: client.created_at,
    last_used_at: client.last_used_at,
    secret_rotated_at: client.secret_rotated_at
});

const listTools = () => toolRegistry.list()
    .filter(tool => tool.operation === 'read')
    .map(tool => ({
        name: tool.definition.function.name,
        description: tool.definition.function.description
    }));

const recordEvent = async ({ client, eventType, userId, requestContext, details = {} }) => {
    try {
        await useDataBase(`
            INSERT INTO "Integration".auth_events(
                client_id, integration_id, company_id, event_type,
                success, ip_address, user_agent, details
            )
            VALUES ($1, $2, $3, $4, true, NULLIF($5, '')::inet, $6, $7::jsonb);
        `, [
            client.client_id, client.id, client.company_id, eventType,
            requestContext.ip || '', requestContext.userAgent || null,
            JSON.stringify({ ...details, user_id: userId, source: 'mcp_settings' })
        ], 2);
    } catch (error) {
        console.error('No fue posible registrar el evento MCP:', error.message);
    }
};

// Solo roles con acceso al módulo de administración pueden gestionar el MCP.
mcpSettingsService.assertCanManage = async ({ userId, companyId }) => {
    const membership = await sessionRepository.findMembership(userId, companyId);
    let config = membership?.role_config;
    if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch { config = null; }
    }
    if (config?.access?.modules?.management?.use !== true) {
        throw fail('Tu rol no puede administrar la conexión MCP.', 403, 'MCP_SETTINGS_FORBIDDEN');
    }
};

mcpSettingsService.getOverview = async ({ companyId, baseUrl }) => {
    const client = await findClient(companyId);
    return {
        configured: Boolean(client),
        company_id: companyId,
        server: {
            name: 'sga360-mcp',
            transport: 'streamable-http',
            url: `${baseUrl}${MCP_PATH}`,
            token_url: `${baseUrl}${TOKEN_PATH}`,
            auth: 'Bearer JWT (client_credentials)'
        },
        client: serializeClient(client),
        tools: listTools(),
        write_tools: MCP_WRITE_SCOPES,
        notes: [
            'El client_secret solo se muestra al crear o rotar las credenciales.',
            'El access_token es temporal; genera uno nuevo cuando venza.'
        ]
    };
};

mcpSettingsService.createCredentials = async ({ companyId, userId, baseUrl }) => {
    if (await findClient(companyId)) {
        throw fail('La compañía ya tiene credenciales MCP. Usa rotar para generar un nuevo secreto.', 409, 'MCP_CLIENT_EXISTS');
    }
    const secret = clientSecretService.generate();
    const secretHash = await clientSecretService.hash(secret);
    const clientId = `mcp-c${companyId}-${crypto.randomBytes(3).toString('hex')}`;

    const created = await useDataBase(`
        INSERT INTO "Integration".clients(
            company_id, service_user_id, client_id, name, secret_hash,
            scopes, access_token_ttl, metadata
        )
        VALUES ($1, NULL, $2, $3, $4, $5::text[], $6, $7::jsonb)
        RETURNING id, company_id, service_user_id, client_id, name, scopes, status,
                  token_version, access_token_ttl, last_used_at,
                  secret_rotated_at, created_at;
    `, [
        companyId, clientId, 'MCP SGA360', secretHash, [...MCP_SCOPES],
        MCP_TOKEN_TTL, JSON.stringify({ kind: 'mcp', created_by: userId })
    ], 3);

    return {
        client: serializeClient(created),
        client_secret: secret,
        token_url: `${baseUrl}${TOKEN_PATH}`,
        warning: 'Guarda el client_secret ahora: no volverá a mostrarse.'
    };
};

mcpSettingsService.rotateSecret = async ({ companyId, baseUrl }) => {
    const client = await requireClient(companyId);
    const secret = clientSecretService.generate();
    const secretHash = await clientSecretService.hash(secret);
    const updated = await useDataBase(`
        UPDATE "Integration".clients
        SET secret_hash = $1, token_version = token_version + 1,
            secret_rotated_at = now(), updated_at = now()
        WHERE id = $2 AND company_id = $3
        RETURNING id, company_id, service_user_id, client_id, name, scopes, status,
                  token_version, access_token_ttl, last_used_at,
                  secret_rotated_at, created_at;
    `, [secretHash, client.id, companyId], 3);

    return {
        client: serializeClient(updated),
        client_secret: secret,
        token_url: `${baseUrl}${TOKEN_PATH}`,
        warning: 'Los tokens anteriores quedaron invalidados. Guarda el nuevo client_secret ahora.'
    };
};

mcpSettingsService.setStatus = async ({ companyId, status }) => {
    if (!EDITABLE_STATUSES.has(status)) {
        throw fail('Estado inválido. Usa active, suspended o revoked.', 400, 'INVALID_MCP_STATUS');
    }
    const client = await requireClient(companyId);
    const updated = await useDataBase(`
        UPDATE "Integration".clients
        SET status = $1,
            revoked_at = CASE WHEN $1 = 'revoked' THEN now() ELSE revoked_at END,
            token_version = token_version + 1,
            updated_at = now()
        WHERE id = $2 AND company_id = $3
        RETURNING id, company_id, service_user_id, client_id, name, scopes, status,
                  token_version, access_token_ttl, last_used_at,
                  secret_rotated_at, created_at;
    `, [status, client.id, companyId], 3);
    return { client: serializeClient(updated) };
};

// Habilita o retira la creación de documentos (factura de venta y recibo de
// caja). Los documentos se registran a nombre del usuario que lo habilita, por
// lo que se aplican los accesos de su rol (tiendas, cajas, centros de costo).
mcpSettingsService.setWriteAccess = async ({ companyId, userId, enabled }) => {
    if (typeof enabled !== 'boolean') {
        throw fail('enabled debe ser true o false.', 400, 'INVALID_WRITE_ACCESS');
    }
    const client = await requireClient(companyId);
    const base = (client.scopes || []).filter(scope => !MCP_WRITE_SCOPES.includes(scope));
    const scopes = enabled ? [...base, ...MCP_WRITE_SCOPES] : base;
    const updated = await useDataBase(`
        UPDATE "Integration".clients
        SET scopes = $1::text[],
            service_user_id = CASE WHEN $2::boolean THEN $3::bigint ELSE service_user_id END,
            updated_at = now()
        WHERE id = $4 AND company_id = $5
        RETURNING id, company_id, service_user_id, client_id, name, scopes, status,
                  token_version, access_token_ttl, last_used_at,
                  secret_rotated_at, created_at;
    `, [scopes, enabled, userId, client.id, companyId], 3);
    return { client: serializeClient(updated) };
};

// Emite un token para el cliente MCP de la compañía sin exigir el secreto: el
// usuario ya está autenticado y autorizado por su sesión.
mcpSettingsService.issueAccessToken = async ({ companyId, userId, baseUrl, requestContext }) => {
    const client = await requireClient(companyId);
    if (client.status !== 'active') {
        throw fail('Las credenciales MCP no están activas.', 409, 'MCP_CLIENT_NOT_ACTIVE');
    }
    const signed = jwtService.signAccessToken({
        integrationId: client.id,
        clientId: client.client_id,
        companyId: client.company_id,
        serviceUserId: null,
        scopes: client.scopes,
        tokenVersion: client.token_version,
        expiresIn: client.access_token_ttl
    });
    await recordEvent({
        client, eventType: 'token_issued_console', userId, requestContext,
        details: { jti: signed.payload.jti }
    });

    const url = `${baseUrl}${MCP_PATH}`;
    return {
        access_token: signed.token,
        token_type: 'Bearer',
        expires_in: signed.expiresIn,
        expires_at: new Date(signed.payload.exp * 1000).toISOString(),
        scope: client.scopes.join(' '),
        mcp_url: url,
        claude_command: `claude mcp add --transport http sga ${url} --header "Authorization: Bearer ${signed.token}"`
    };
};

export default mcpSettingsService;
