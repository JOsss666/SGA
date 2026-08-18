import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import IntegrationAuthError from '../errors/IntegrationAuthError.js';

const ALGORITHM = 'HS256';
const DEFAULT_ISSUER = 'sga360';
const DEFAULT_AUDIENCE = 'sga360-integrations';

const getSecret = () => {
    const secret = process.env.INTEGRATION_JWT_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) {
        throw new Error('INTEGRATION_JWT_SECRET debe tener al menos 32 bytes.');
    }
    return secret;
};

const jwtService = {};

jwtService.signAccessToken = ({
    integrationId,
    clientId,
    companyId,
    serviceUserId,
    scopes,
    tokenVersion,
    expiresIn = 900
}) => {
    const ttl = Math.min(Math.max(Number(expiresIn) || 900, 60), 3600);
    const customClaims = {
        integration_id: Number(integrationId),
        company_id: Number(companyId),
        service_user_id: serviceUserId === null ? null : Number(serviceUserId),
        scopes: Array.isArray(scopes) ? scopes : [],
        token_version: Number(tokenVersion)
    };

    const token = jwt.sign(customClaims, getSecret(), {
        algorithm: ALGORITHM,
        expiresIn: ttl,
        issuer: process.env.INTEGRATION_JWT_ISSUER || DEFAULT_ISSUER,
        audience: process.env.INTEGRATION_JWT_AUDIENCE || DEFAULT_AUDIENCE,
        subject: clientId,
        jwtid: crypto.randomUUID()
    });

    return {
        token,
        expiresIn: ttl,
        payload: jwt.decode(token)
    };
};

jwtService.verifyAccessToken = (token) => {
    try {
        const payload = jwt.verify(token, getSecret(), {
            algorithms: [ALGORITHM],
            issuer: process.env.INTEGRATION_JWT_ISSUER || DEFAULT_ISSUER,
            audience: process.env.INTEGRATION_JWT_AUDIENCE || DEFAULT_AUDIENCE,
            clockTolerance: 5
        });

        if (!payload.sub || !payload.integration_id || !payload.company_id) throw new Error('Claims incompletos');
        if (!Array.isArray(payload.scopes)) throw new Error('Scopes inválidos');

        return payload;
    } catch {
        throw new IntegrationAuthError('Token de acceso inválido o vencido.', {
            statusCode: 401,
            code: 'INVALID_ACCESS_TOKEN'
        });
    }
};

export default jwtService;
