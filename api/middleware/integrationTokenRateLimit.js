const attempts = new Map();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

const pruneExpired = (now) => {
    if (attempts.size < 1000) return;
    for (const [key, value] of attempts.entries()) {
        if (value.resetAt <= now) attempts.delete(key);
    }
};

export const integrationTokenRateLimit = (req, res, next) => {
    const now = Date.now();
    pruneExpired(now);

    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const current = attempts.get(key);
    const entry = !current || current.resetAt <= now
        ? { count: 0, resetAt: now + WINDOW_MS }
        : current;

    entry.count += 1;
    attempts.set(key, entry);

    res.setHeader('X-RateLimit-Limit', MAX_ATTEMPTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(MAX_ATTEMPTS - entry.count, 0));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > MAX_ATTEMPTS) {
        res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
        return res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Demasiados intentos de autenticación. Intente nuevamente más tarde.'
            }
        });
    }

    next();
};
