import systemAIConfig from '../config/systemAIConfig.js';
import SystemAIError from '../core/errors/SystemAIError.js';

const windows = new Map();
const WINDOW_MS = 60000;

export const systemAIRateLimit = (req, res, next) => {
    const now = Date.now();
    const key = `${req.auth?.companyId || 'unknown'}:${req.auth?.userId || req.ip || 'unknown'}`;
    const current = windows.get(key);

    if (!current || current.resetAt <= now) {
        windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return next();
    }

    if (current.count >= systemAIConfig.requestsPerMinute) {
        res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
        return next(new SystemAIError('Se excedió el límite temporal de solicitudes de IA.', {
            statusCode: 429,
            code: 'SYSTEM_AI_RATE_LIMITED'
        }));
    }

    current.count += 1;
    next();
};
