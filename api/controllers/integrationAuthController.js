import integrationAuthService from '../services/integrationAuthService.js';

const MAX_BODY_BYTES = 16 * 1024;

const readJsonBody = (req) => new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    let rejected = false;

    req.on('data', chunk => {
        if (rejected) return;
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
            rejected = true;
            const error = new Error('El cuerpo de la petición supera el límite permitido.');
            error.statusCode = 413;
            error.code = 'PAYLOAD_TOO_LARGE';
            reject(error);
            return;
        }
        body += chunk;
    });

    req.on('end', () => {
        if (rejected) return;
        try {
            resolve(body ? JSON.parse(body) : {});
        } catch {
            const error = new Error('El cuerpo debe ser JSON válido.');
            error.statusCode = 400;
            error.code = 'INVALID_JSON';
            reject(error);
        }
    });
    req.on('error', reject);
});

const requestContext = (req) => ({
    ip: req.ip || req.socket?.remoteAddress || '',
    userAgent: req.headers['user-agent'] || null
});

const integrationAuthController = {};

integrationAuthController.issueToken = async (req, res, next) => {
    try {
        const body = await readJsonBody(req);
        const token = await integrationAuthService.issueToken({
            clientId: body.client_id,
            clientSecret: body.client_secret,
            requestContext: requestContext(req)
        });

        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        res.status(200).json(token);
    } catch (error) {
        next(error);
    }
};

export default integrationAuthController;
