import allowedOrigins from '../config/corsConfig.js';
import SessionError from '../errors/SessionError.js';

const trustedOrigins = new Set(allowedOrigins);

export const requireTrustedOrigin = (req, res, next) => {
    const origin = req.get('Origin');

    // Clientes no-browser y pruebas pueden no enviar Origin. La autenticación sigue
    // siendo obligatoria; cuando Origin existe debe pertenecer a la lista explícita.
    if (!origin || trustedOrigins.has(origin)) return next();

    return next(new SessionError('El origen de la solicitud no está autorizado.', {
        statusCode: 403,
        code: 'UNTRUSTED_ORIGIN'
    }));
};
