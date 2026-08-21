import sessionConfig from '../config/sessionConfig.js';
import SessionError from '../errors/SessionError.js';
import sessionRepository from '../repositories/sessionRepository.js';

const readCompanyId = (req) => {
    const headerValue = req.get('X-SGA-Company-Id');
    const value = headerValue ?? (sessionConfig.trustLegacyCompanyBody ? req.body?.company_id : undefined);
    const companyId = Number(value);
    if (!Number.isSafeInteger(companyId) || companyId <= 0) {
        throw new SessionError('Se requiere una compañía activa válida.', {
            statusCode: 400,
            code: 'INVALID_COMPANY_CONTEXT'
        });
    }
    return companyId;
};

const normalizePermissions = (roleConfig) => {
    if (!roleConfig) return [];
    try {
        const config = typeof roleConfig === 'string' ? JSON.parse(roleConfig) : roleConfig;
        return Array.isArray(config?.permissions) ? config.permissions.filter(value => typeof value === 'string') : [];
    } catch {
        return [];
    }
};

export const requireCompanyAccess = async (req, res, next) => {
    try {
        if (!req.auth?.userId) {
            throw new SessionError('Se requiere una sesión autenticada.');
        }
        const companyId = readCompanyId(req);
        const membership = await sessionRepository.findMembership(req.auth.userId, companyId);
        if (!membership) {
            throw new SessionError('El usuario no tiene acceso a la compañía solicitada.', {
                statusCode: 403,
                code: 'COMPANY_ACCESS_DENIED'
            });
        }

        req.auth = Object.freeze({
            ...req.auth,
            companyId,
            roleId: membership.role_id ? Number(membership.role_id) : null,
            permissions: Object.freeze(normalizePermissions(membership.role_config))
        });
        next();
    } catch (error) {
        next(error);
    }
};

export const requirePermission = (...requiredPermissions) => (req, res, next) => {
    const granted = new Set(req.auth?.permissions || []);
    const missing = requiredPermissions.filter(permission => !granted.has(permission));
    if (missing.length > 0) {
        return next(new SessionError('El usuario no tiene permisos para esta operación.', {
            statusCode: 403,
            code: 'INSUFFICIENT_PERMISSION'
        }));
    }
    next();
};
