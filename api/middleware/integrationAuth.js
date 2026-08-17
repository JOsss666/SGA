import jwtService from '../services/jwtService.js';
import integrationAuthService from '../services/integrationAuthService.js';
import IntegrationAuthError from '../errors/IntegrationAuthError.js';

const getBearerToken = (req) => {
    const authorization = req.headers.authorization;
    if (typeof authorization !== 'string') return null;

    const match = authorization.match(/^Bearer\s+(\S+)$/i);
    return match?.[1] ?? null;
};

export const authenticateIntegration = async (req, res, next) => {
    try {
        const token = getBearerToken(req);
        if (!token) {
            throw new IntegrationAuthError('Se requiere un token Bearer.', {
                statusCode: 401,
                code: 'MISSING_ACCESS_TOKEN'
            });
        }

        const payload = jwtService.verifyAccessToken(token);
        req.integration = await integrationAuthService.validateTokenClient(payload);
        next();
    } catch (error) {
        next(error);
    }
};

export const requireScope = (...requiredScopes) => (req, res, next) => {
    const grantedScopes = new Set(req.integration?.scopes ?? []);
    const missingScopes = requiredScopes.filter(scope => !grantedScopes.has(scope));

    if (missingScopes.length > 0) {
        return next(new IntegrationAuthError('La integración no tiene permisos para esta operación.', {
            statusCode: 403,
            code: 'INSUFFICIENT_SCOPE'
        }));
    }

    next();
};
