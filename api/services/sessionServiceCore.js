import crypto from 'node:crypto';
import SessionError from '../errors/SessionError.js';

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);
const addHours = (date, hours) => new Date(date.getTime() + hours * 3600000);

class SessionService {
    constructor({ repository, config, now = () => new Date() }) {
        this.repository = repository;
        this.config = config;
        this.now = now;
    }

    assertConfigured() {
        if (!this.config.tokenPepper || this.config.tokenPepper.length < 32) {
            throw new SessionError('La autenticación por sesión no está configurada.', {
                statusCode: 503,
                code: 'SESSION_NOT_CONFIGURED'
            });
        }
    }

    hashValue(value) {
        return crypto.createHmac('sha256', this.config.tokenPepper).update(value).digest('hex');
    }

    async createSession({ userId, ip, userAgent }) {
        this.assertConfigured();
        const rawToken = crypto.randomBytes(32).toString('base64url');
        const now = this.now();
        const session = await this.repository.create({
            tokenHash: this.hashValue(rawToken),
            userId,
            idleExpiresAt: addMinutes(now, this.config.idleTimeoutMinutes),
            absoluteExpiresAt: addHours(now, this.config.absoluteTimeoutHours),
            ipHash: ip ? this.hashValue(ip) : null,
            userAgentHash: userAgent ? this.hashValue(userAgent) : null
        });
        return { rawToken, session };
    }

    async validateSession(rawToken) {
        this.assertConfigured();
        if (typeof rawToken !== 'string' || rawToken.length < 32 || rawToken.length > 512) {
            throw new SessionError('La sesión no es válida.', { code: 'INVALID_SESSION' });
        }
        const session = await this.repository.findActiveByTokenHash(this.hashValue(rawToken));
        if (!session) {
            throw new SessionError('La sesión expiró o fue revocada.', { code: 'SESSION_EXPIRED' });
        }
        const now = this.now();
        const lastActivity = new Date(session.last_activity_at);
        if (now.getTime() - lastActivity.getTime() >= this.config.touchIntervalMinutes * 60000) {
            const nextIdleExpiration = addMinutes(now, this.config.idleTimeoutMinutes);
            const absoluteExpiration = new Date(session.absolute_expires_at);
            await this.repository.touch(
                session.id,
                nextIdleExpiration < absoluteExpiration ? nextIdleExpiration : absoluteExpiration
            );
        }
        return session;
    }

    async revokeSession(rawToken, reason = 'logout') {
        if (!rawToken) return 0;
        this.assertConfigured();
        return this.repository.revokeByTokenHash(this.hashValue(rawToken), reason);
    }

    async revokeUserSessions(userId, reason = 'security_event') {
        this.assertConfigured();
        return this.repository.revokeAllForUser(userId, reason);
    }
}

export default SessionService;
