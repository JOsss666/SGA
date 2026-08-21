import sessionCookieService from '../services/sessionCookieService.js';

export const sessionErrorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    const statusCode = Number(error.statusCode) || 500;
    if (statusCode === 401) sessionCookieService.clear(res);
    if (statusCode >= 500) console.error('Error de autenticación:', error);
    return res.status(statusCode).json({
        ok: false,
        error: {
            code: statusCode >= 500 ? 'AUTH_INTERNAL_ERROR' : (error.code || 'AUTH_REQUEST_ERROR'),
            message: statusCode >= 500 ? 'No fue posible validar la sesión.' : error.message
        }
    });
};
